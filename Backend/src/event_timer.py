from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Body, Depends
from sqlalchemy.orm import Session
import asyncio
from src.models.db import get_db
from pydantic import BaseModel
from src.websocket import manager
from src.cards.logicEventCards.notSoFast import event_state_service
from src.player.models import Player
from src.cards.schemas import CardOut
from src.cards.models import Card

event_timer = APIRouter()

class EventPayload(BaseModel):
    game_id: int
    event_by_player: int
    player_name: str
    card: CardOut | None

class EventEndPayload(BaseModel):
    game_id: int
    final_state: str

class EventTickPayload(BaseModel):
    game_id: int
    time: int

if not hasattr(manager, "active_timers"):
    manager.active_timers = {} 

async def countdown(game_id: int, player_id: int, room_id: str):
    try:
        for i in range(10, -1, -1):
            ws_tickMessage = CountdownTickMessage(payload=EventTickPayload(
                game_id=game_id, time=i))
            await manager.broadcast(
                ws_tickMessage.model_dump_json(),
                room_id=room_id)
            if i == 0:
                
                final_state = await event_state_service.finalize(game_id)
                ws_endMessage = CountdownEndMessage(payload=EventEndPayload(game_id=game_id,
                                    final_state=final_state))
                await manager.broadcast(
                    ws_endMessage.model_dump_json(),
                    room_id=room_id)
                manager.active_timers.pop((game_id, room_id), None)

            await asyncio.sleep(1)

    except asyncio.CancelledError:
        ws_cancelMessage = CountdownCancelledMessage(payload=game_id)
        await manager.broadcast(
            ws_cancelMessage.model_dump_json(),
            room_id=room_id)
        raise

@event_timer.post("/{game_id}/event/start")
async def start_event(
    game_id: int,
    data: dict = Body(...),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
    db: Session = Depends(get_db)
):
    """
    Comienza el temporizador de evento. Requiere player_id y card_id en el body.
    """
    player_id = data.get("player_id")
    if player_id is None:
        raise HTTPException(400, "player_id es requerido")
    card_id = data.get("card_id")
    if card_id is None:
        card=None
    else:
        card = db.query(Card).filter(Card.id == card_id).first()
        if not card:
            raise HTTPException(404, "Carta no encontrada")

    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(404, "Jugador no encontrado")
    
    key = (game_id, room_id)
    if key in manager.active_timers:
        raise HTTPException(400, "Ya hay un evento activo en esta sala")

    task = asyncio.create_task(countdown(game_id, player_id, room_id))
    manager.active_timers[key] = task

    ws_message = EventStartedMessage(payload=EventPayload(game_id=game_id,
                                    event_by_player=player_id, player_name=player.name, card=card))
    await manager.broadcast(
        ws_message.model_dump_json(),
        room_id=room_id)

    return {"message": "Evento iniciado", "room_id": room_id, "started_by": player_id}


@event_timer.post("/{game_id}/event/cancel")
async def cancel_event(
    game_id: int,
    data: dict = Body(...),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
    db: Session = Depends(get_db)
):
    """
    Cancela el evento. Requiere player_id en el body.
    """
    player_id = data.get("player_id")
    if player_id is None:
        raise HTTPException(400, "player_id es requerido")

    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(404, "Jugador no encontrado")
    
    key = (game_id, room_id)
    if key not in manager.active_timers:
        raise HTTPException(400, "No hay evento activo para cancelar")

    task = manager.active_timers.pop(key)
    task.cancel()
    
    ws_message = EventCancelledMessage(payload=EventPayload(game_id=game_id,
                                    event_by_player=player_id, player_name=player.name, card=None))
    await manager.broadcast(
        ws_message.model_dump_json(),
        room_id=room_id)

    return {"message": "Evento cancelado", "room_id": room_id, "cancelled_by": player_id}
    
class EventStartedMessage(BaseModel):
    type: str = "EVENT_STARTED"
    payload: EventPayload


class CountdownTickMessage(BaseModel):
    type: str = "COUNTDOWN_TICK"
    payload: EventTickPayload

class CountdownEndMessage(BaseModel):
    type: str = "COUNTDOWN_END"
    payload: EventEndPayload

class CountdownCancelledMessage(BaseModel):
    type: str = "COUNTDOWN_CANCELLED"
    payload: int

class EventCancelledMessage(BaseModel):
    type: str = "EVENT_CANCELLED"
    payload: EventPayload
    
