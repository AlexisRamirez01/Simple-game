from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Dict, Optional
from src.websocket import manager
from src.gameLogic.discard_card_service import discard_card 
from src.gamePlayer.schemas import WSDiscardMessage, DiscardPayload

class EventStateService:
    def __init__(self):
        self.event_states: Dict[int, str] = {}

    async def toggle(self, game_id: int):
        game_id = str(game_id)
        if game_id not in self.event_states:
            self.event_states[game_id] = "active"
        
        current = self.event_states.get(game_id, "active")
        new_state = "cancelled" if current == "active" else "active"
        self.event_states[game_id] = new_state

    def get_state(self, game_id: int) -> Optional[str]:
        return self.event_states.get(game_id)

    async def finalize(self, game_id: int):
        game_id = str(game_id)
        final_state = self.event_states.get(game_id, "active")
        print(final_state)
        self.event_states.pop(game_id, None)
        return final_state


event_state_service = EventStateService()

class NotSoFast:
    def __init__(self, db: Session):
        self.db = db 

    async def execute(self, payload: dict, card_id_played: int, room_id: int):
        
        player_id = payload['player_id']
        game_id = payload['game_id']
        
        try:
            discard_result = discard_card(
                db=self.db,
                game_id=game_id,
                player_id=player_id,
                card_id=card_id_played
            )
            await event_state_service.toggle(game_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Falló el PASO 1 (Descarte): {str(e)}"
            )
        
        ws_payload = DiscardPayload(
            player_id=discard_result["player_id"],
            card_id=discard_result["card_id"],
            card_discard=discard_result["card_discard"].to_schema()
        )
        ws_message = WSDiscardMessage(payload=ws_payload)
        await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
        
        return

