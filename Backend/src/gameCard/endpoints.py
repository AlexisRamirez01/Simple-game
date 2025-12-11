from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from src.websocket import manager
from src.cards.schemas import CardOut
from src.models.db import get_db
from src.gameCard.services import GameCardService
from src.gameCard.schemas import GameCardOut, GameCardIn, WSAddMessage, WSRemoveMessage, GameCardUpdate

gameCard_router = APIRouter()

@gameCard_router.get("/{game_id}/cards", response_model=List[GameCardOut])
def get_game_cards(game_id: int, db: Session = Depends(get_db)):
    service = GameCardService(db)
    cards = service.get_game_cards(game_id)
    if cards is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return cards

@gameCard_router.post("/{game_id}/{card_id}")
async def assign_card(game_id: int, 
    card_id: int, 
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
):

    service = GameCardService(db)
    success = service.assign_card_to_game(game_id, card_id)
    if not success:
        raise HTTPException(status_code=404, detail="Game or Card not found")

    ws_payload = GameCardOut.model_validate(
        {"game_id": game_id, "card_id": card_id, "card_position": None}
    )
    ws_message = WSAddMessage(payload=ws_payload)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return {"message": "Card assigned successfully"}

@gameCard_router.delete("/{game_id}/cards/{card_id}")
async def remove_card(game_id: int, 
    card_id: int, 
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
    ):

    service = GameCardService(db)
    success = service.remove_card_from_game(game_id, card_id)
    if not success:
        raise HTTPException(status_code=404, detail="Game or Card not found")

    ws_payload = GameCardOut.model_validate(
        {"game_id": game_id, "card_id": card_id, "card_position": None}
    )
    ws_message = WSRemoveMessage(payload=ws_payload)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return {"message": "Card removed successfully"}

@gameCard_router.put(
    "/{game_id}/{card_id}",
    summary="Actualizar posición y orden de una carta en una partida"
)
async def update_game_card(
    game_id: int,
    card_id: int,
    card_info: GameCardUpdate,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
):
    service = GameCardService(db)
    success = service.update_card_position(
        game_id,
        card_id,
        card_info.card_position,
        card_info.card_order,
    )
    if not success:
        raise HTTPException(status_code=404, detail="Game or Card not found")

    ws_payload = GameCardOut.model_validate(
        {
            "game_id": game_id,
            "card_id": card_id,
            "card_position": card_info.card_position,
            "card_order": card_info.card_order,
        }
    )
    ws_message = WSAddMessage(payload=ws_payload)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return {"message": "Card updated successfully"}


@gameCard_router.get("/game/{game_id}/cards/{deck}", response_model=List[GameCardOut])
def get_cards_by_deck(game_id: int, deck: str, db: Session = Depends(get_db)):
    service = GameCardService(db)
    cards = service.get_cards_by_deck(game_id, deck)

    # Si no hay cartas, devolver lista vacía, no 404
    return cards or []


@gameCard_router.get("/game/{game_id}/discard-deck/top5", response_model=List[CardOut])
async def get_top_5_discard(game_id: int, db: Session = Depends(get_db)):

    service = GameCardService(db)
    cards = service.get_top_5_discard_deck_cards(game_id)
    
    return cards

@gameCard_router.get("/game/{game_id}/discard-deck/top1", response_model=Optional[GameCardOut])
def get_top_1_discard(game_id: int, db: Session = Depends(get_db)):
    service = GameCardService(db)
    card = service.get_top_1_discard_deck_card(game_id)

    return card
