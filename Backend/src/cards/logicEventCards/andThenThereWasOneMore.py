from sqlalchemy.orm import Session
from sqlalchemy import delete
from src.cards.models import SecretCard, Card
from src.player.models import Player
from src.playerCard.models import player_card_table
from src.gamePlayer.models import PlayerGame
from fastapi import HTTPException, status
from src.gameLogic.discard_card_service import discard_card
from src.websocket import manager
from src.gamePlayer.schemas import WSDiscardMessage, DiscardPayload
from src.playerCard.schemas import PlayerCardTransferredDTO, CardDTO, PlayerDTO, WSUpdateMessage as PlayerCardWSUpdateMessage


class AndThenThereWasOneMoreService:
    def __init__(self, db: Session):
        self.db = db

    async def execute(
        self,
        payload: dict,
        card_id_played: int,
        room_id: str = None
    ):
        """
        Ejecuta el efecto de "And Then There Was One More":
        - Si revealed_secret_card_id y target_player_id son None: Solo descarta la carta
        - Si tienen valores:
          1. Valida la carta de secreto revelada
          2. Verifica que el jugador objetivo existe
          3. Oculta la carta (is_revealed = False)
          4. La reasigna al jugador objetivo
          5. Actualiza is_Social_Disgrace del jugador objetivo
          6. Descarta la carta evento (último paso)
        """
        
        game_id = payload['game_id']
        player_id = payload['player_id']
        revealed_secret_card_id = payload.get('revealed_secret_card_id')
        target_player_id = payload.get('target_player_id')

        if revealed_secret_card_id is None or target_player_id is None:
            try:
                discard_result = discard_card(
                    db=self.db,
                    game_id=game_id,
                    player_id=player_id,
                    card_id=card_id_played
                )
                
                ws_payload = DiscardPayload(
                    player_id=discard_result["player_id"],
                    card_id=discard_result["card_id"],
                    card_discard=discard_result["card_discard"].to_schema()
                )
                ws_message = WSDiscardMessage(payload=ws_payload)
                await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
                
                return {
                    "message": "And Then There Was One More descartada sin efecto (no hay secretos revelados)"
                }
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Falló el descarte de la carta: {str(e)}"
                )
        
        try:
            secret_card = (
                self.db.query(SecretCard)
                .filter(
                    SecretCard.id == revealed_secret_card_id,
                    SecretCard.is_revealed == True
                )
                .with_for_update()
                .first()
            )

            if not secret_card:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Carta de secreto revelada no encontrada."
                )

            target_player = (
                self.db.query(Player)
                .join(PlayerGame, Player.id == PlayerGame.player_id)
                .filter(
                    Player.id == target_player_id,
                    PlayerGame.game_id == game_id
                )
                .first()
            )

            if not target_player:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Jugador objetivo no encontrado en la partida."
                )

            current_owner = (
                self.db.query(Player)
                .join(player_card_table, Player.id == player_card_table.c.player_id)
                .filter(player_card_table.c.card_id == revealed_secret_card_id)
                .first()
            )

            if not current_owner:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No se encontró el propietario actual de la carta."
                )

            secret_card.is_revealed = False

            delete_stmt = delete(player_card_table).where(
                player_card_table.c.card_id == revealed_secret_card_id,
                player_card_table.c.player_id == current_owner.id
            )
            self.db.execute(delete_stmt)

            from sqlalchemy import insert
            insert_stmt = insert(player_card_table).values(
                player_id=target_player_id,
                card_id=revealed_secret_card_id
            )
            self.db.execute(insert_stmt)

            if target_player.is_Social_Disgrace:
                target_player.is_Social_Disgrace = False

            self.db.commit()

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Falló el efecto de 'And Then There Was One More': {str(e)}"
            )

        try:
            discard_result = discard_card(
                db=self.db,
                game_id=game_id,
                player_id=player_id,
                card_id=card_id_played
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Efecto OK, pero falló el descarte de la carta evento: {str(e)}"
            )

        try:
            ws_payload = DiscardPayload(
                player_id=discard_result["player_id"],
                card_id=discard_result["card_id"],
                card_discard=discard_result["card_discard"].to_schema()
            )
            ws_message = WSDiscardMessage(payload=ws_payload)
            await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

            card_data = self.db.query(Card).filter(Card.id == revealed_secret_card_id).first()
            transfer_payload = PlayerCardTransferredDTO(
                card=CardDTO.model_validate(card_data),
                old_player=PlayerDTO(id=current_owner.id, name=current_owner.name),
                new_player=PlayerDTO(id=target_player.id, name=target_player.name)
            )
            transfer_message = PlayerCardWSUpdateMessage(payload=transfer_payload)
            await manager.broadcast(transfer_message.model_dump_json(), room_id=room_id)

        except Exception as e:
            print(f"Error al enviar notificación WebSocket: {str(e)}")

        return {
            "message": "And Then There Was One More ejecutada exitosamente",
            "secret_card_moved": revealed_secret_card_id,
            "from_player": current_owner.id,
            "to_player": target_player_id
        }
