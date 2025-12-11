from sqlalchemy.orm import Session
from sqlalchemy import insert
from src.game.models import Game
from src.cards.models import Card
from src.gameCard.models import GameCard, CardPosition
from src.playerCard.models import player_card_table
from fastapi import HTTPException, status
from src.gameLogic.discard_card_service import discard_card 
from src.gamePlayer.schemas import WSDiscardMessage, DiscardPayload
from src.websocket import manager

from src.cards.schemas import WSRecieveCard, CardOut, WsTopDecks,TopDecks, RecieveCard

class LookIntoTheAshesService:
    def __init__(self, db: Session):
        self.db = db 

    async def execute(self, payload: dict, card_id_played: int, room_id: int):
        selected_card_id = payload.get('selected_card_id')
        player_id = payload['player_id']
        game_id = payload['game_id']
    
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
                detail=f"Falló el PASO 1 (Descarte de LITA): {str(e)}"
            )

        ws_payload = DiscardPayload(
            player_id=discard_result["player_id"],
            card_id=discard_result["card_id"],
            card_discard=discard_result["card_discard"].to_schema()
        )
        ws_message = WSDiscardMessage(payload=ws_payload)
        await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

        if selected_card_id is None:
            print(f"LITA jugada por {player_id} sin efecto (mazo de descarte vacío o sin selección).")
            return
        
        try:
            game_card = self.db.query(GameCard).filter(
                GameCard.game_id == game_id,
                GameCard.card_id == selected_card_id,
                GameCard.card_position == CardPosition.MAZO_DESCARTE
            ).with_for_update().first()

            if not game_card:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Carta seleccionada no encontrada en el mazo de descarte."
                )
            
            taken_order = game_card.card_order

            game = self.db.query(Game).filter(Game.id == game_id).first()
            if not game:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, 
                    detail="Juego no encontrado."
                )

            if game.discard_top > 0:
                game.discard_top -= 1

            game_card.card_position = None
            game_card.card_order = 0

            stmt = insert(player_card_table).values(
                player_id=player_id,
                card_id=selected_card_id
            )
            self.db.execute(stmt)

            self.db.query(GameCard).filter(
                GameCard.game_id == game_id,
                GameCard.card_position == CardPosition.MAZO_DESCARTE,
                GameCard.card_order > taken_order
            ).update({
                GameCard.card_order: GameCard.card_order - 1
            }, synchronize_session=False)

            self.db.commit()

        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Descarte de LITA OK, PERO falló el efecto: {str(e)}"
            )

        card_out = self.db.query(Card).filter(Card.id == selected_card_id).first()
        print(card_out.id)

        ws_payload1 = card_out.to_schema()
        ws_payload1 = RecieveCard(**ws_payload1.model_dump(), player_id=player_id)
        ws_message1 = WSRecieveCard(payload=ws_payload1)
        await manager.broadcast(ws_message1.model_dump_json(), room_id=room_id)

        ws_payload2 = TopDecks(amount=-1, deck="mazo_descarte")
        ws_message2 = WsTopDecks(payload=ws_payload2)
        await manager.broadcast(ws_message2.model_dump_json(), room_id=room_id)

        return