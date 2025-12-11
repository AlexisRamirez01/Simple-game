"""Defines event cards endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from typing import Optional

from src.cards.models import EventCard
from src.cards.schemas import EventCardIn, EventCardOut
from src.cards.servicesEventCard import EventCardService
from src.models.db import get_db

event_cards_router = APIRouter(prefix="", tags=["EventCards"])


@event_cards_router.get("/{card_id}", response_model=EventCardOut)
async def get_event_card(card_id: int, db=Depends(get_db)):
    """
    Retrieves an event card by its ID.

    Parameters
    ----------
    card_id : int
        Unique identifier of the event card to retrieve.
    db : Session, optional
        Database session dependency.

    Returns
    -------
    EventCardOut
        The retrieved event card.

    Raises
    ------
    HTTPException
        If no event card with the specified ID exists.
    """
    service = EventCardService(db)
    event_card = service.get_by_id(card_id)
    if not event_card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"EventCard with id={card_id} not found"
        )
    return event_card


@event_cards_router.post("/", response_model=EventCardOut, status_code=status.HTTP_201_CREATED)
async def create_event_card(event_card_in: EventCardIn, db=Depends(get_db)):
    """
    Creates a new event card.

    Parameters
    ----------
    event_card_in : EventCardIn
        Input data containing event card attributes.
    db : Session, optional
        Database session dependency.

    Returns
    -------
    EventCardOut
        The newly created event card.
    """
    service = EventCardService(db)
    return service.create(event_card_in)


@event_cards_router.put("/{card_id}", response_model=EventCardOut)
async def update_event_card(card_id: int, event_card_in: EventCardIn, db=Depends(get_db)):
    """
    Updates an existing event card by its ID.

    Parameters
    ----------
    card_id : int
        Unique identifier of the event card to update.
    event_card_in : EventCardIn
        Updated event card data.
    db : Session, optional
        Database session dependency.

    Returns
    -------
    EventCardOut
        The updated event card.

    Raises
    ------
    HTTPException
        If no event card with the specified ID exists.
    """
    service = EventCardService(db)
    updated = service.update(card_id, event_card_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"EventCard with id={card_id} not found"
        )
    return updated


@event_cards_router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event_card(card_id: int, db=Depends(get_db)):
    """
    Deletes an event card by its ID.

    Parameters
    ----------
    card_id : int
        Unique identifier of the event card to delete.
    db : Session, optional
        Database session dependency.

    Returns
    -------
    None
        No content on successful deletion.

    Raises
    ------
    HTTPException
        If no event card with the specified ID exists.
    """
    service = EventCardService(db)
    deleted = service.delete(card_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"EventCard with id={card_id} not found"
        )
    return None


@event_cards_router.put("/play/{card_id}",  response_model=EventCardOut)
async def play_event_card(card_id: int, payload: dict = Body(...), db=Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")):
    """
    Marks an event card as played.

    Parameters
    ----------
    card_id : int
        Unique identifier of the event card to mark as played.
    db : Session, optional
        Database session dependency.

    Returns
    -------
    EventCardOut
        The updated event card marked as played.

    Raises
    ------
    HTTPException
        If no event card with the specified ID exists.
    """
    service = EventCardService(db)
    try:
        card = await service.play(card_id, payload, room_id)
        return card
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@event_cards_router.get("/player/{player_id}", response_model=list[EventCardOut])
async def get_event_cards_by_player(player_id: int, db=Depends(get_db)):
    """
    Retrieves all event cards assigned to a player.

    Parameters
    ----------
    player_id : int
        Unique ID of the player.

    Returns
    -------
    list[EventCardOut]
        List of event cards owned by the player.
    """
    service = EventCardService(db)
    return service.get_by_player(player_id)

    
@event_cards_router.get("/{card_id}/is-cancellable", response_model=dict)
async def is_event_card_cancellable(card_id: int, db=Depends(get_db)):
    """
    Checks if an event card is cancellable.

    Parameters
    ----------
    card_id : int
        Unique identifier of the event card.
    db : Session, optional
        Database session dependency.

    Returns
    -------
    dict
        Dictionary with `card_id` and `is_cancellable` boolean.
    
    Raises
    ------
    HTTPException
        If no event card with the specified ID exists.
    """
    service = EventCardService(db)
    card = service.get_by_id(card_id)
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"EventCard with id={card_id} not found"
        )
    return {"card_id": card.id, "is_cancellable": card.is_cancellable}