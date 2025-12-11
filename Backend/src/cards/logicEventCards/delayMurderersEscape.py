from sqlalchemy.orm import Session
from sqlalchemy import insert
from src.cards.schemas import TopDecks, WSRemoveMessage, WsTopDecks
from src.game.models import Game
from src.cards.models import Card
from src.gameCard.models import GameCard, CardPosition
from src.gamePlayer.schemas import DiscardPayload, WSDiscardMessage
from src.playerCard.models import player_card_table
from fastapi import HTTPException, status
from src.gameLogic.discard_card_service import discard_card 
from src.websocket import manager

class DelayTheMurderersEscapeService:
    def __init__(self, db: Session):
        self.db = db 

    async def execute(self,card_id_played: int, payload: dict):
        game_id = payload['game_id']
        player_id = payload['player_id']
        cards = payload['cards']
        
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
        
        except HTTPException:
            raise  # volver a lanzar la HTTPException original
        
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Falló la eliminación de la carta Delay The Murderer's Escape: {str(e)}"
            )
        
        try:
            game = self.db.query(Game).filter(
                Game.id == game_id,
            ).first()
            
            if not game:
                raise HTTPException(    
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="La partida no existe"
                )
            
            amount_cards_on_discard = game.discard_top
            i = 0
            
            print(f"amount_cards_on_discard antes del while: {amount_cards_on_discard}")
            while i <= 4 and amount_cards_on_discard > 0: 
                card_on_discard_selected = self.db.query(GameCard).filter(
                    GameCard.game_id == game_id,
                    GameCard.card_position == CardPosition.MAZO_DESCARTE,
                    GameCard.card_id == cards[i]["id"]
                ).first()
                
                if not card_on_discard_selected:
                    raise HTTPException(    
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Carta en el top del mazo de descarte no encontrada."
                    )

                # Cambiar posición
                card_on_discard_selected.card_position = CardPosition.MAZO_ROBO
                
                # Actualizar orden en mazo de robo
                game.draw_top = game.draw_top + 1
                card_on_discard_selected.card_order = game.draw_top

                
                i += 1
                amount_cards_on_discard -= 1
                
            #Actualizamos la cantidad de cartas del mazo de descarte
            game.discard_top = amount_cards_on_discard
            
            self.db.commit()
            
            # Mensaje para eliminar la carta jugada del juego
            ws_message = WSRemoveMessage(payload=card_id_played)
            await manager.broadcast(ws_message.model_dump_json(), room_id=game_id)
            
            
            # Mensaje para actualizar la cantidad de cartas en el mazo de descarte
            payloadTopDiscard = TopDecks(amount=(-i), deck="mazo_descarte")
            message = WsTopDecks(payload=payloadTopDiscard)
            await manager.broadcast(message.model_dump_json(), room_id=game_id)
            
            
            # Mensaje para actualizar la cantidad de cartas en el mazo de robo
            payloadTopDiscard = TopDecks(amount=(i), deck="mazo_robo")
            message = WsTopDecks(payload=payloadTopDiscard)
            await manager.broadcast(message.model_dump_json(), room_id=game_id)
            

        except HTTPException:
            raise  # volver a lanzar la HTTPException original
        
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Falló la eliminación de la carta Delay The Murderer's Escape: {str(e)}"
            )

        return