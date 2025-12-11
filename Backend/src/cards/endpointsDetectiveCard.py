"""Defines detective cards endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.cards.models import DetectiveCard
from src.cards.schemas import DetectiveCardIn, DetectiveCardOut, CardResponse, DetectiveCardAmountOut
from src.cards.servicesDetectiveCard import DetectiveCardService
from src.models.db import get_db

detective_cards_router = APIRouter(prefix="", tags=["DetectiveCards"])


@detective_cards_router.get("/", response_model=List[DetectiveCardOut])
async def get_all_detective_cards(
    db: Session = Depends(get_db),
    name: Optional[str] = None,
    description: Optional[str] = None,
    requiredAmount: Optional[int] = None,
):
    """
    Retrieves detective cards as a list, allowing filtering by different attributes.

    Parameters
    ----------
    name : Optional[str], optional
        Detective card name, default None
    description : Optional[str], optional
        Detective card description, default None
    requiredAmount : Optional[int], optional
        Filter for `requiredAmount` field, default None

    Returns
    -------
    List[DetectiveCardOut]
        A list of retrieved detective cards
    """
    service = DetectiveCardService(db)
    return service.get_all(
        name=name,
        description=description,
        requiredAmount=requiredAmount,
    )


@detective_cards_router.get("/{id}", response_model=DetectiveCardOut)
async def get_detective_card(id: int, db: Session = Depends(get_db)):
    """
    Get a detective card by ID.

    Parameters
    ----------
    id : int
        Detective card identifier

    Returns
    -------
    DetectiveCardOut
        Retrieved detective card

    Raises
    ------
    HTTPException
        404 -> When detective card is not found
    """
    service = DetectiveCardService(db)
    card = service.get_by_id(id)
    if not card:
        raise HTTPException(status_code=404, detail="DetectiveCard not found")
    return card


@detective_cards_router.get("/player/{player_id}", response_model=List[DetectiveCardOut])
async def get_detective_cards_by_player(player_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all detective cards assigned to a specific player.

    Parameters
    ----------
    player_id : int
        Identifier of the player whose detective cards are to be retrieved.

    Returns
    -------
    List[DetectiveCardOut]
        A list of detective cards assigned to the player.
    """
    service = DetectiveCardService(db)
    detective_cards = service.get_detective_cards_by_player(player_id)
    return detective_cards


@detective_cards_router.get("/{id}/required_amount", response_model=DetectiveCardAmountOut)
async def get_required_amount_for_card(id: int, db: Session = Depends(get_db)):
    """
    Get the required amount for a specific detective card.

    Parameters
    ----------
    id : int
        Detective card identifier

    Returns
    -------
    DetectiveCardAmountOut
        An object containing the required amount for the card.

    Raises
    ------
    HTTPException
        404 -> When detective card with id is not found
    """
    service = DetectiveCardService(db)
    try:
        amount = service.get_required_amount(id)
        return {"requiredAmount": amount}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@detective_cards_router.post("/", status_code=201, response_model=DetectiveCardOut)
async def create_detective_card(card: DetectiveCardIn, db: Session = Depends(get_db)):
    """
    Create a new detective card.

    Parameters
    ----------
    card : DetectiveCardIn
        Detective card information

    Returns
    -------
    DetectiveCardOut
        Created detective card

    Raises
    ------
    HTTPException
        500 -> When there is an error creating the detective card
    """
    service = DetectiveCardService(db)
    try:
        detective_card = service.create(card.to_dto())
        return detective_card
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@detective_cards_router.put("/{id}", response_model=DetectiveCardOut)
async def update_detective_card(id: int, card: DetectiveCardIn, db: Session = Depends(get_db)):
    """
    Update an existing detective card.

    Parameters
    ----------
    id : int
        Detective card identifier
    card : DetectiveCardIn
        Updated detective card information

    Returns
    -------
    DetectiveCardOut
        Updated detective card

    Raises
    ------
    HTTPException
        404 -> When detective card with id is not found
    """
    service = DetectiveCardService(db)
    try:
        return service.update(id, card.to_dto())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@detective_cards_router.delete("/{id}", response_model=CardResponse)
async def delete_detective_card(id: int, db: Session = Depends(get_db)):
    """
    Delete a detective card by ID.

    Parameters
    ----------
    id : int
        Detective card identifier

    Returns
    -------
    CardResponse
        Identifier of the deleted detective card

    Raises
    ------
    HTTPException
        404 -> When detective card with id is not found
    """
    service = DetectiveCardService(db)
    try:
        deleted_id = service.delete(id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return CardResponse(id=deleted_id, message="DetectiveCard eliminada")