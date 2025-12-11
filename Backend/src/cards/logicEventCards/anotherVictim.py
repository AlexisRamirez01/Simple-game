from sqlalchemy.orm import Session
from sqlalchemy import insert
from src.detectiveSet.services import DetectiveSetService
from fastapi import HTTPException, status
from src.gameLogic.discard_card_service import discard_card 
from src.detectiveSet.schemas import WSUpdateMessage
from src.websocket import manager
from src.gamePlayer.schemas import WSDiscardMessage, DiscardPayload

class AnotherVictimService:
    def __init__(self, db: Session):
        self.db = db 

    async def execute(self, payload, card_id_played, room_id: int):
        selected_set_id = payload['selected_set_id']
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
                detail=f"Falló el PASO 1 (Descarte de ATV): {str(e)}"
            )
        
        try:
            set_service = DetectiveSetService(self.db)
            updated_set = set_service.change_owner(selected_set_id, player_id)

            print(updated_set)
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Descarte de ATV OK, PERO falló el efecto: {str(e)}"
            )
        ws_payload = DiscardPayload(
            player_id=discard_result["player_id"],
            card_id=discard_result["card_id"],
            card_discard=discard_result["card_discard"].to_schema()
        )
        
        ws_message = WSDiscardMessage(payload=ws_payload)
        await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
        
        ws_message = WSUpdateMessage(payload=updated_set)
        await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
        return