from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from src.detectiveSet.services import DetectiveSetService
from src.detectiveSet.schemas import (
    
    DetectiveSetIn,
    DetectiveSetOut,
    DetectiveSetPlay,
    DetectiveSetOutOwner,
    WSAddMessage,
    WSUpdateMessage,
    WSDetectiveAdd,
    WSRevealTheirMessage,
    WSRevealYourMessage,
    WSHideYourMessage
)
from src.models.db import get_db
from src.cards.schemas import CardOut
from src.player.schemas import PlayerOut
from src.websocket import manager
from src.cards.models import Card
from src.playerCard.models import player_card_table
from src.gameCard.models import GameCard
from src.cards.models import SecretCard

detective_set_router = APIRouter()


@detective_set_router.get("/{set_id}", response_model=DetectiveSetOut)
def get_detective_set(set_id: int, db: Session = Depends(get_db)):
    """
    Retrieves a DetectiveSet by its ID.

    Parameters
    ----------
    set_id : int
        ID of the set to retrieve

    Returns
    -------
    DetectiveSetOut
        The requested set
    """
    service = DetectiveSetService(db)
    set_ = service.get_set(set_id)
    if not set_:
        raise HTTPException(status_code=404, detail="Set not found")
    return set_


@detective_set_router.get("/owner/{owner_id}", response_model=List[DetectiveSetOutOwner])
def get_sets_by_owner(owner_id: int, db: Session = Depends(get_db)):
    """
    Retrieves all DetectiveSets owned by a player.

    Parameters
    ----------
    owner_id : int
        ID of the player owner

    Returns
    -------
    List[DetectiveSetOut]
        List of sets
    """
    service = DetectiveSetService(db)
    return service.get_sets_by_owner(owner_id)


@detective_set_router.post("/", status_code=201, response_model=DetectiveSetOut)
async def create_detective_set(
    set_in: DetectiveSetIn,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
):
    """
    Creates a new DetectiveSet.

    Parameters
    ----------
    set_in : DetectiveSetIn
        Data to create the set
    room_id : str, optional
        Room to broadcast WebSocket messages, default "0"

    Returns
    -------
    DetectiveSetOut
        Created set
    """
    service = DetectiveSetService(db)
    set_, error_msg = service.create_set(
        id_owner=set_in.id_owner,
        main_detective=set_in.main_detective,
        action_secret=set_in.action_secret,
        is_cancellable=set_in.is_cancellable,
        wildcard_effects=set_in.wildcard_effects,
        detective_card_ids=set_in.detective_card_ids,
    )

    
    
    if error_msg:
        raise HTTPException(status_code=400, detail=error_msg)
    
    set_out = DetectiveSetOut(
        id=set_.id,
        main_detective=set_in.main_detective,
        owner=PlayerOut.model_validate(set_.owner) if set_.owner else None,
        cards=[CardOut.model_validate(card) for card in set_.cards] if set_.cards else [],
        action_secret=set_.action_secret,
        is_cancellable=set_.is_cancellable
        
    )

    card_ids = [card.id for card in set_out.cards]
    (
        db.query(GameCard)
        .filter(GameCard.card_id.in_(card_ids))
        .update({GameCard.card_position: "ON_TABLE"}, synchronize_session=False)
    )
    db.commit()
    ws_message = WSAddMessage(payload=set_out)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    print(set_)
    return set_out


@detective_set_router.put("/{set_id}")
async def update_detective_set(
    set_id: int,
    set_in: DetectiveSetIn,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
):
    """
    Updates an existing DetectiveSet.

    Parameters
    ----------
    set_id : int
        ID of the set to update
    set_in : DetectiveSetIn
        New data
    room_id : str, optional
        Room to broadcast WebSocket messages, default "0"

    Returns
    -------
    DetectiveSetOut
        Updated set
    """
    service = DetectiveSetService(db)
    updated_set = service.update_set(
        set_id,
        id_owner=set_in.id_owner,
        main_detective=set_in.main_detective,
        action_secret=set_in.action_secret,
        is_cancellable=set_in.is_cancellable,
        wildcard_effects=set_in.wildcard_effects,
    )
    if not updated_set:
        raise HTTPException(status_code=404, detail="Set not found")

    #ws_message = WSAddMessage(payload=updated_set)
    #await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    return updated_set


@detective_set_router.delete("/{set_id}", response_model=dict)
async def delete_detective_set(
    set_id: int,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
):
    """
    Deletes a DetectiveSet.

    Parameters
    ----------
    set_id : int
        ID of the set to delete
    room_id : str, optional
        Room to broadcast WebSocket messages, default "0"

    Returns
    -------
    dict
        Message confirming deletion
    """
    service = DetectiveSetService(db)
    set_ = service.get_set(set_id)
    if not set_:
        raise HTTPException(status_code=404, detail="Set not found")

    service.delete_set(set_id)
    #ws_message = WSRemoveMessage(payload=set_)
    #await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    return {"message": "Set deleted successfully", "id": set_id}


@detective_set_router.post("/{set_id}/add/{detective_id}")
async def add_detective_to_set(
    set_id: int,
    detective_id: int,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
):
    """
    Adds a DetectiveCard to an existing DetectiveSet.

    Parameters
    ----------
    set_id : int
        ID of the set
    detective_id : int
        ID of the detective to add
    room_id : str, optional
        Room to broadcast WebSocket messages, default "0"

    Returns
    -------
    dict
        Confirmation message
    """
    service = DetectiveSetService(db)
    updated_set = service.add_detective_to_set(set_id, detective_id)
    if not updated_set:
        raise HTTPException(status_code=404, detail="Set or Detective not found")

    card_ids = [card.id for card in updated_set.cards]
    (
        db.query(GameCard)
        .filter(GameCard.card_id.in_(card_ids))
        .update({GameCard.card_position: "ON_TABLE"}, synchronize_session=False)
    )
    db.commit()
    ws_message = WSDetectiveAdd(payload=updated_set)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    return updated_set


@detective_set_router.get("/{set_id}/cards", response_model=List[CardOut])
def get_cards_of_set(set_id: int, db: Session = Depends(get_db)):
    """
    Retrieves all DetectiveCards associated with a DetectiveSet.

    Parameters
    ----------
    set_id : int
        ID of the set

    Returns
    -------
    List[CardOut]
        List of detective cards in the set
    """
    service = DetectiveSetService(db)
    cards = service.get_cards_of_set(set_id)
    if cards is None:
        raise HTTPException(status_code=404, detail="Set not found")
    return cards


@detective_set_router.post("/{set_id}/change-owner/{owner_id}", response_model=dict)
async def change_detective_set_owner(
    set_id: int,
    owner_id: int,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
):
    """
    Change the owner of an existing DetectiveSet.

    Parameters
    ----------
    set_id : int
        ID of the detective set to update.
    owner_id : int
        ID of the new player who will own the set.
    room_id : str, optional
        Room ID for WebSocket broadcasting (default: "0").

    Returns
    -------
    dict
        A success or error message.
    """
    service = DetectiveSetService(db)
    set_ = service.change_owner(set_id, owner_id)

    if  set_out is None: 
        raise HTTPException(status_code=404)

    set_out = DetectiveSetOut(
        id=set_.id,
        main_detective=set_.main_detective,
        owner=PlayerOut.model_validate(set_.owner) if set_.owner else None,
        cards=[CardOut.model_validate(card) for card in set_.cards] if set_.cards else []
    )
    
    ws_message = WSAddMessage(payload=set_out)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    
    return set_out

# FALTA TEST
@detective_set_router.post("/play-set/{set_id}/{target_id}", status_code=201)
async def play_set(
    set_id: int,
    target_id: int,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
):
    service = DetectiveSetService(db)
    set_ = service.get_set(set_id)
    if not set_:
        raise HTTPException(status_code=404, detail="Set not found")
    
    payload = DetectiveSetPlay(player_id=set_.owner.id, 
                               target_id=target_id, secret_cards=[], 
                               is_cancellable=set_.is_cancellable, 
                               wildcard_effects=set_.wildcard_effects)
    
    db.commit()
            
    if set_.action_secret in ["reveal_your", "reveal_their"]:
        stmt = select(player_card_table.c.card_id).where(player_card_table.c.player_id == target_id)
        result = db.execute(stmt).all()
        card_ids = [row.card_id for row in result]

        secret_cards = (
            db.query(SecretCard)
            .join(player_card_table, SecretCard.id == player_card_table.c.card_id)
            .filter(player_card_table.c.player_id == target_id)
            .filter(SecretCard.is_revealed == False)
            .all()
        )
        payload.secret_cards = [CardOut.model_validate(card) for card in secret_cards]

        if set_.action_secret == "reveal_your":
            ws_message = WSRevealYourMessage(payload=payload)
        else:
            ws_message = WSRevealTheirMessage(payload=payload)
    elif set_.action_secret == "hide":
        revealed_cards = (
            db.query(SecretCard)
            .join(player_card_table, SecretCard.id == player_card_table.c.card_id)
            .filter(player_card_table.c.player_id == target_id)
            .filter(SecretCard.is_revealed == True)
            .all()
        )
        payload.secret_cards = [CardOut.model_validate(card) for card in revealed_cards]
        ws_message = WSHideYourMessage(payload=payload)
 
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    return set_

@detective_set_router.get("/players/with-sets/{game_id}", response_model=List[int])
def get_players_who_own_sets(
    game_id: int, 
    db: Session = Depends(get_db)
):
    """
    Retrieves a list of unique player IDs *from a specific game* that own at least one DetectiveSet.

    Parameters
    ----------
    game_id : int
        ID of the game to filter by (from path)

    Returns
    -------
    List[int]
        A list of player IDs.
    """
    service = DetectiveSetService(db)
    player_ids = service.get_players_with_sets(game_id=game_id)
    return player_ids