"""Defines cards endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query

from src.cards.models import Card
from src.cards.schemas import (
    CardIn, CardOut, CardResponse,
    WSAddMessage,
    WSRemoveMessage,
    WSUpdateMessage,
)

from src.cards.utils import db_card_2_card_out
from src.websocket import manager
from src.cards.services import CardService
from src.models.db import get_db

cards_router = APIRouter()


@cards_router.get(path="/")
async def retrieve_cards(
    db=Depends(get_db),
    name: Optional[str] = None,
    description: Optional[str] = None,
    is_murderes_escapes: Optional[bool] = None,
) -> List[CardOut]:
    """
    Retrieves card information as a list filtering by name, description or is_murderes_escapes.

    Parameters
    ----------
    name : Optional[str], optional
        Card name, default None
    description : Optional[str], optional
        Card description, default None
    is_murderes_escapes : Optional[bool], optional
        Filter for is_murderes_escapes field, default None

    Returns
    -------
    List[CardOut]
        A list of retrieved cards
    """
    return CardService(db).get_all(
        name=name, description=description, is_murderes_escapes=is_murderes_escapes
    )


@cards_router.get(path="/{id}")
async def get_card(id: int, db=Depends(get_db)) -> CardOut:
    """
    Get a card

    Parameters
    ----------
    id : int
        Card id

    Returns
    -------
    CardOut
        Card retrieved

    Raises
    ------
    HTTPException
        404 -> When card is not found
    """
    db_card = CardService(db).get_by_id(id=id)
    if not db_card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La carta id:{id} no existe.",
        )
    return db_card


@cards_router.post(path="/", status_code=status.HTTP_201_CREATED)
async def create_card(
    card_info: CardIn, 
    db=Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")) -> CardResponse:
    """
    Creates a new card

    Parameters
    ----------
    card_info : CardIn
        Card information

    Returns
    -------
    CardResponse
        Card identifier

    Raises
    ------
    HTTPException
        404 -> When there is an error creating the card
    """
    try:
        created_card = CardService(db).create(card_info.to_dto())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
        
    ws_message = WSAddMessage(
		payload=db_card_2_card_out(db_card=created_card)
	)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    return CardResponse(id=created_card.id, message="El juego fue creado correctamente")


@cards_router.delete(path="/{id}")
async def delete_card(id: int, 
    db=Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")) -> CardResponse:
    """
    Delete card with id.

    Parameters
    ----------
    id : int
        Id of desired card

    Returns
    -------
    CardResponse
        Id of deleted card

    Raises
    ------
    HTTPException
        404 -> When card with id is not found
    """
    try:
        deleted_id = CardService(db).delete(id=id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
        
    ws_message = WSRemoveMessage(payload=deleted_id)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    return CardResponse(id=deleted_id, message="La partida se elimino correctamente")

@cards_router.put(path="/{id}", response_model=CardOut)
async def update_card(id: int, 
    card_info: CardIn, db=Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")) -> CardOut:
    """
    Update an existing card

    Parameters
    ----------
    id : int
        Id of the card to update
    card_info : CardIn
        Updated card information

    Returns
    -------
    CardOut
        Updated card

    Raises
    ------
    HTTPException
        404 -> When card with id is not found
        400 -> When there is an error updating the card
    """
    try:
        updated_card = CardService(db).update(id=id, card_dto=card_info.to_dto())
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
        
    ws_message = WSUpdateMessage(payload=db_card_2_card_out(db_card=updated_card))
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    return updated_card  