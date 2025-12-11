"""Defines secret cards endpoints."""

from typing import List, Optional
from fastapi import Body
from fastapi import APIRouter, Depends, HTTPException, status, Query

from src.cards.models import SecretCard
from src.cards.schemas import SecretCardIn, SecretCardOut, CardResponse, WSSecretUpdateMessage, WSGameUnlock
from src.player.schemas import WSReveledMurderer, ReveledMurdererPayload
from src.cards.servicesSecretCard import SecretCardService
from src.gameLogic.win_by_social_disgrace import WinBySocialDisgrace
from src.models.db import get_db
from src.websocket import manager
from src.gameLogic.reveal_murderer_service import reveal_murderer

secret_cards_router = APIRouter(prefix="", tags=["SecretCards"])


@secret_cards_router.get("/", response_model=List[SecretCardOut])
async def get_all_secret_cards(
    db=Depends(get_db),
    name: Optional[str] = None,
    description: Optional[str] = None,
    is_murderes_escapes: Optional[bool] = None,
    is_murderer: Optional[bool] = None,
    is_accomplice: Optional[bool] = None,
    is_revealed: Optional[bool] = None,
):
    """
    Retrieves secret cards as a list, allowing filtering by different attributes.

    Parameters
    ----------
    name : Optional[str], optional
        Secret card name, default None
    description : Optional[str], optional
        Secret card description, default None
    is_murderes_escapes : Optional[bool], optional
        Filter for `is_murderes_escapes` field, default None
    is_murderer : Optional[bool], optional
        Filter for `is_murderer` field, default None
    is_accomplice : Optional[bool], optional
        Filter for `is_accomplice` field, default None
    is_revealed : Optional[bool], optional
        Filter for `is_revealed` field, default None

    Returns
    -------
    List[SecretCardOut]
        A list of retrieved secret cards
    """
    service = SecretCardService(db)
    return service.get_all(
        name=name,
        description=description,
        is_murderes_escapes=is_murderes_escapes,
        is_murderer=is_murderer,
        is_accomplice=is_accomplice,
        is_revealed=is_revealed,
    )


@secret_cards_router.get("/{id}", response_model=SecretCardOut)
async def get_secret_card(id: int, db=Depends(get_db)):
    """
    Get a secret card by ID.

    Parameters
    ----------
    id : int
        Secret card identifier

    Returns
    -------
    SecretCardOut
        Retrieved secret card

    Raises
    ------
    HTTPException
        404 -> When secret card is not found
    """
    service = SecretCardService(db)
    card = service.get_by_id(id)
    if not card:
        raise HTTPException(status_code=404, detail="SecretCard not found")
    return card


@secret_cards_router.post("/", status_code=201, response_model=SecretCardOut)
async def create_secret_card(card: SecretCardIn, db=Depends(get_db)):
    """
    Create a new secret card.

    Parameters
    ----------
    card : SecretCardIn
        Secret card information

    Returns
    -------
    SecretCardOut
        Created secret card

    Raises
    ------
    HTTPException
        500 -> When there is an error creating the secret card
    """
    service = SecretCardService(db)
    try:
        secret_card = service.create(card.to_dto())
        return secret_card
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@secret_cards_router.put("/{id}", response_model=SecretCardOut)
async def update_secret_card(id: int, card: SecretCardIn, 
                             db=Depends(get_db),
                             room_id: str = Query("0", description="ID de la sala, por defecto 0")):
    """
    Update an existing secret card.

    Parameters
    ----------
    id : int
        Secret card identifier
    card : SecretCardIn
        Updated secret card information

    Returns
    -------
    SecretCardOut
        Updated secret card

    Raises
    ------
    HTTPException
        404 -> When secret card with id is not found
    """
    service = SecretCardService(db)
    try:
        updated_card = service.update(id, card.to_dto())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    updated_card_out = SecretCardOut.model_validate(updated_card)
    ws_message = WSSecretUpdateMessage(payload=updated_card_out)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    return updated_card_out


@secret_cards_router.delete("/{id}", response_model=CardResponse)
async def delete_secret_card(id: int, db=Depends(get_db)):
    """
    Delete a secret card by ID.

    Parameters
    ----------
    id : int
        Secret card identifier

    Returns
    -------
    CardResponse
        Identifier of deleted secret card

    Raises
    ------
    HTTPException
        404 -> When secret card with id is not found
    """
    service = SecretCardService(db)
    try:
        deleted_id = service.delete(id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return CardResponse(id=deleted_id, message="SecretCard eliminada")


@secret_cards_router.patch("/{id}/reveal", response_model=SecretCardOut)
async def reveal_secret_card(id: int, db=Depends(get_db),
                             revealed: bool = Body(True, description="Si es True se revela, si es False se oculta"),
                             room_id: str = Query("0", description="ID de la sala, por defecto 0")):
    """
    Reveal a secret card by ID (marks the card as revealed).

    Parameters
    ----------
    id : int
        Secret card identifier

    Returns
    -------
    SecretCardOut
        Secret card with updated reveal status

    Raises
    ------
    HTTPException
        404 -> When secret card with id is not found
    """
    service = SecretCardService(db)
    try:
        updated_card = service.reveal(id, revealed)
        winBySocialDisgraceService = WinBySocialDisgrace(db, room_id)
        await winBySocialDisgraceService.check_win_by_social_disgrace()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    updated_card_out = SecretCardOut.model_validate(updated_card)
    ws_message = WSSecretUpdateMessage(payload=updated_card_out)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    
    ws_message = WSGameUnlock(payload=1)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    if updated_card["name"] == "secret_murderer":
        try:
            result = reveal_murderer(db, id)
        except Exception as e:
            raise HTTPException(status_code=404, detail=str(e))

        accomplice = result.get("accomplice")
        ws_murderer_revealed = WSReveledMurderer(payload=ReveledMurdererPayload(
            murderer=result["murderer"].to_schema(),
            accomplice=accomplice.to_schema() if accomplice else None
        ))

        await manager.broadcast(ws_murderer_revealed.model_dump_json(), room_id=room_id)
    
    return updated_card_out


@secret_cards_router.get("/{id}/is_revealed")
async def is_revealed_secret_card(id: int, db=Depends(get_db)):
    """
    Check if a secret card is revealed.

    Parameters
    ----------
    id : int
        Secret card identifier

    Returns
    -------
    dict
        Reveal status of the secret card (True/False)

    Raises
    ------
    HTTPException
        404 -> When secret card with id is not found
    """
    service = SecretCardService(db)
    try:
        return service.is_revealed(id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@secret_cards_router.get("/player/{player_id}", response_model=List[SecretCardOut])
async def get_secret_cards_by_player(player_id: int, db=Depends(get_db)):
    """
    Retrieve all secret cards assigned to a specific player.

    Parameters
    ----------
    player_id : int
        Identifier of the player whose secret cards are to be retrieved.

    Returns
    -------
    List[SecretCardOut]
        A list of secret cards assigned to the player.

    Raises
    ------
    HTTPException
        404 -> When no secret cards are found for the given player ID.
    """
    service = SecretCardService(db)
    secret_cards = service.get_secret_cards_by_player(player_id)
    return secret_cards
