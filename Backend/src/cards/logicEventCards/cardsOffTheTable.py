from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from src.player.models import Player
from src.game.models import Game
from src.gameCard.models import GameCard
from src.gameLogic.discard_card_service import discard_card
from src.websocket import manager
from src.gamePlayer.schemas import WSDiscardMessage, DiscardPayload

class CardsOffTheTableService:
    def __init__(self, db: Session):
        self.db = db

    async def execute(self, payload: dict, card_id_played: int, room_id: int):
        
        game_id = payload['game_id']
        player_id = payload['player_id']
        target_player_id = payload['target_player_id']
        
        if not all([game_id, player_id, target_player_id, card_id_played]):
            raise HTTPException(status_code=400, detail="Faltan parámetros obligatorios")

        player = self.db.query(Player).filter(Player.id == target_player_id).first()
        if not player:
            raise HTTPException(status_code=404, detail="Jugador objetivo no encontrado")

        game = self.db.query(Game).filter(Game.id == game_id).first()
        if not game:
            raise HTTPException(status_code=404, detail="Juego no encontrado")

        card_ids_in_current_game = {
            result[0] for result in self.db.query(GameCard.card_id).filter(GameCard.game_id == game_id)
        }

        notsofast_card_ids = [
            card.id for card in player.cards
            if card.name == "Instant_notsofast" and card.id in card_ids_in_current_game
        ]

        discarded_cards = []

        if not notsofast_card_ids:
            print(f"   El jugador {target_player_id} no tiene cartas 'Not So Fast'.")
        else:
            for card_id in notsofast_card_ids:
                try:
                    result = discard_card(self.db, game_id, target_player_id, card_id)
                    self.db.commit()

                    ws_payload = DiscardPayload(
                        player_id=result["player_id"],
                        card_id=result["card_id"],
                        card_discard=result["card_discard"].to_schema(),
                    )
                    ws_message = WSDiscardMessage(payload=ws_payload)
                    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

                    discarded_cards.append(result["card_id"])
                    print(f"   🔥 'Not So Fast' descartada del jugador {target_player_id}: {card_id}")

                except Exception as e:
                    self.db.rollback()
                    print(f"⚠️ Error al descartar carta {card_id}: {e}")

        try:
            result = discard_card(self.db, game_id, player_id, card_id_played)
            self.db.commit()

            ws_payload = DiscardPayload(
                player_id=result["player_id"],
                card_id=result["card_id"],
                card_discard=result["card_discard"].to_schema(),
            )
            ws_message = WSDiscardMessage(payload=ws_payload)
            await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

            print(f"🗑️ Carta de evento {card_id_played} descartada correctamente.")
        except Exception as e:
            self.db.rollback()
            print(f"⚠️ Error al descartar la carta jugada {card_id_played}: {e}")

        return {
            "player_id": player_id,
            "target_player_id": target_player_id,
            "discarded_cards": discarded_cards,
            "message": f"El jugador {target_player_id} descartó {len(discarded_cards)} 'Not So Fast'."
        }

