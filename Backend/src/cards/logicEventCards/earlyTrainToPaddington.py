from sqlalchemy.orm import Session
from sqlalchemy import insert
from src.cards.dtos import CardDTO
from src.cards.models import Card
from src.cards.schemas import CardOut, TopDecks, WSRemoveMessage, WsTopDecks
from src.game.models import Game
from src.gameCard.models import GameCard, CardPosition
from src.gamePlayer.models import PlayerGame
from src.gamePlayer.schemas import DiscardPayload, MurdererEscapesPayload, WSDiscardMessage, WSMurdererEscapes
from src.player.enums import RolEnum
from src.player.models import Player
from src.player.schemas import PlayerOut
from src.playerCard.models import player_card_table
from fastapi import HTTPException, status
from src.websocket import manager
import traceback
from src.game.models import Game


class EarlyTrainToPaddingtonService:
    def __init__(self, db: Session):
        self.db = db 

    async def execute(self, card_id_played: int, payload: dict):
        game_id = payload['game_id']
        player_id = payload['player_id']
        
        try:
            game_card = self.db.query(GameCard).filter(
                GameCard.game_id == game_id,
                GameCard.card_id == card_id_played
            ).with_for_update().first()

            if not game_card:
                raise HTTPException(    
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Carta jugada no encontrada."
                )
            
            self.db.delete(game_card)
            
            delete_count = self.db.query(player_card_table).filter(
                player_card_table.c.player_id == player_id,
                player_card_table.c.card_id == card_id_played
            ).delete(synchronize_session=False)

            if delete_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="La carta jugada no pertenece al jugador."
                )
            
            self.db.commit()
            
            game = self.db.query(Game).filter(
                Game.id == game_id,
            ).first() 
            
            if not game:
                raise HTTPException(    
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="La partida no existe"
                )
            
            if game.draw_top < 6:
                # Se preparan payloads para el mensaje de que el asesino escapó
                playerMurderer = (
                    self.db.query(Player)
                    .join(PlayerGame, Player.id == PlayerGame.player_id)
                    .filter(
                        PlayerGame.game_id == game_id,
                        Player.rol == RolEnum.murderer
                    )
                    .first()
                )
            
                playerMurdererOut = playerMurderer.to_schema()
            
                playerAccomplice = None
                if (game.current_players >= 5):
                    playerAccomplice = (
                        self.db.query(Player)
                        .join(PlayerGame, Player.id == PlayerGame.player_id)
                        .filter(
                            PlayerGame.game_id == game_id,
                            Player.rol == RolEnum.accomplice
                        )
                        .first()
                    )
                    
                payloadMurderer = MurdererEscapesPayload(
                    murderer=playerMurdererOut,
                    accomplice=playerAccomplice.to_schema() if playerAccomplice else None
                )
            
                # Mensaje de que el asesino escapó
                message = WSMurdererEscapes(payload=payloadMurderer)
                await manager.broadcast(message.model_dump_json(), room_id=game_id)
                
            else:
                i = 0
                amount_cards_on_draw = game.draw_top
                last_discarded_card = None
                
                while i <= 5 and amount_cards_on_draw > 0: 
                    card_on_top_draw = self.db.query(GameCard).filter(
                        GameCard.game_id == game_id,
                        GameCard.card_position == CardPosition.MAZO_ROBO,
                        GameCard.card_order == amount_cards_on_draw
                    ).first()
                    
                    if not card_on_top_draw:
                        raise HTTPException(    
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail="Carta en el top del mazo de robo no encontrada."
                        )

                    # Cambiar posición
                    card_on_top_draw.card_position = CardPosition.MAZO_DESCARTE
                    
                    # Actualizar orden en descarte
                    game.discard_top = game.discard_top + 1
                    card_on_top_draw.card_order = game.discard_top

                    i += 1
                    amount_cards_on_draw -= 1
                    
                    last_discarded_card = card_on_top_draw 
                    
                if last_discarded_card is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No se descartó ninguna carta."
                    )

                game.draw_top = amount_cards_on_draw
                self.db.commit()
                
                
                # Mensaje para actualizar la cantidad de cartas en el mazo de robo
                payloadTopDraw = TopDecks(amount=-i, deck="mazo_robo")
                message = WsTopDecks(payload=payloadTopDraw)
                await manager.broadcast(message.model_dump_json(), room_id=game_id)
                
                
                # Mensaje para actualizar la cantidad de cartas en el mazo de descarte
                payloadTopDiscard = TopDecks(amount=(i-1), deck="mazo_descarte")
                message = WsTopDecks(payload=payloadTopDiscard)
                await manager.broadcast(message.model_dump_json(), room_id=game_id)
                
                
                # Mensaje para actualizar la carta del tope del mazo de descarte
                card = self.db.query(Card).filter(
                    Card.id == last_discarded_card.card_id
                ).first()
                
                ws_payload = DiscardPayload(
                    player_id=player_id,
                    card_id=card_id_played,
                    card_discard=card.to_schema()
                )
                
                ws_message = WSDiscardMessage(payload=ws_payload)
                await manager.broadcast(ws_message.model_dump_json(), room_id=game_id)
                
                
            # Mensaje para eliminar la carta jugada del juego
            ws_message = WSRemoveMessage(payload=card_id_played)
            await manager.broadcast(ws_message.model_dump_json(), room_id=game_id)
        
        except HTTPException:
            # Deja pasar los errores HTTP originales (404, 400, etc.)
            raise
                
        except Exception as e:
            # Maneja todo lo inesperado
            traceback.print_exc()
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Descarte de Early Train To Paddington OK, pero falló el efecto: {str(e)}"
            )

        return {
            "message": f"Early Train To Paddington descartada."
        }