from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List

from src.models.db import get_db
from src.playerCard.services import PlayerCardService
from src.playerCard.schemas import CardDTO, PlayerDTO, PlayerCardTransferredDTO, WSAddMessage, WSRemoveMessage, WSUpdateMessage
from src.player.models import Player
from src.cards.models import Card
from src.websocket import manager 

playerCard_router = APIRouter()


@playerCard_router.get("/{player_id}/cards", response_model=List[CardDTO])
def get_player_cards(player_id: int, db: Session = Depends(get_db)):
    service = PlayerCardService(db)
    cards = service.get_player_cards(player_id)
    if cards is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return cards


@playerCard_router.post("/{player_id}/{card_id}")
async def assign_card(
    player_id: int,
    card_id: int,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
):
    service = PlayerCardService(db)
    success = service.assign_card_to_player(player_id, card_id)
    if not success:
        raise HTTPException(status_code=404, detail="Player or Card not found")

    card = db.query(Card).filter(Card.id == card_id).first()
    ws_message = WSAddMessage(payload=CardDTO.model_validate(card))
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return {"message": "Card assigned successfully"}

@playerCard_router.put("/{old_player_id}/cards/{card_id}")
async def transfer_card(
    old_player_id: int,
    card_id: int,
    new_player_id: int,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
):
    service = PlayerCardService(db)

    if not service.is_card_assigned_to_player(old_player_id, card_id):
        raise HTTPException(
            status_code=400,
            detail=f"La carta {card_id} no pertenece al jugador {old_player_id}"
        )

    removed = service.remove_card_from_player(old_player_id, card_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Error al remover la carta del jugador anterior")

    assigned = service.assign_card_to_player(new_player_id, card_id)
    if not assigned:
        raise HTTPException(status_code=404, detail="Error al asignar la carta al nuevo jugador")

    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Carta no encontrada")

    old_player = db.query(Player).filter(Player.id == old_player_id).first()
    new_player = db.query(Player).filter(Player.id == new_player_id).first()

    if not old_player or not new_player:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")

    card_dto = CardDTO.model_validate(card)
    old_player_dto = PlayerDTO.model_validate(old_player)
    new_player_dto = PlayerDTO.model_validate(new_player)

    ws_message = WSUpdateMessage(
        payload=PlayerCardTransferredDTO(
            card=card_dto,
            old_player=old_player_dto,
            new_player=new_player_dto,
        )
    )
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return {"message": f"Card {card_id} transferred from {old_player_id} to {new_player_id}"}


@playerCard_router.delete("/{player_id}/cards/{card_id}")
async def remove_card(
    player_id: int,
    card_id: int,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
):
    service = PlayerCardService(db)
    success = service.remove_card_from_player(player_id, card_id)
    if not success:
        raise HTTPException(status_code=404, detail="Player or Card not found")

    card = db.query(Card).filter(Card.id == card_id).first()
    ws_message = WSRemoveMessage(payload=CardDTO.model_validate(card))
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return {"message": "Card removed successfully"}
