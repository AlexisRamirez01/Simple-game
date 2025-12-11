"""Defines player endpoints."""
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from src.player.models import Player
from src.player.services import PlayerService
from src.models.db import get_db
from src.player.models import RolEnum
from src.player.schemas import (
    PlayerIn, PlayerOut, PlayerResponse,
    WSAddMessage,
    WSRemoveMessage,
    WSUpdateMessage,
)

from src.player.utils import db_player_2_player_out
from src.websocket import manager
from src.cards.models import SecretCard
from src.cards.schemas import CardOut
from src.playerCard.models import player_card_table

player_router = APIRouter()


@player_router.get(path="/")
async def retrieve_players(
    db=Depends(get_db),
    name: Optional[str] = None,
    birthdate: Optional[date] = None,
    is_Social_Disgrace: Optional[bool] = None,
    is_Your_Turn: Optional[bool] = None,
    is_Owner: Optional[bool] = None,
    rol: Optional[RolEnum] = None,
) -> List[PlayerOut]:
    """
    Retrieves player information as a list filtering by name,
    avatar, birthdate or is_Social_Disgrace.

    Parameters
    ----------
    name : Optional[str], optional
        Player name, default None
    avatar : Optional[str], optional
        Player avatar, default None
    birthdate : Optional[date], optional
        Player birthdate, default None
    is_Social_Disgrace : Optional[bool], optional
        Filter for is_Social_Disgrace field, default None

    Returns
    -------
    List[PlayerOut]
        A list of retrieved players
    """
    return PlayerService(db).get_all(
        name=name, birthdate=birthdate,
        is_Social_Disgrace=is_Social_Disgrace, is_Your_Turn=is_Your_Turn,
        is_Owner=is_Owner, rol=rol
    )


@player_router.get(path="/{id}")
async def get_player(id: int, db=Depends(get_db)) -> PlayerOut:
    """
    Get a player

    Parameters
    ----------
    id : int
        Player id

    Returns
    -------
    PlayerOut
        Player retrieved

    Raises
    ------
    HTTPException
        404 -> When player is not found
    """
    db_player = PlayerService(db).get_by_id(id=id)
    if not db_player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El jugador id:{id} no existe.",
        )
    return db_player


@player_router.post(path="/", status_code=status.HTTP_201_CREATED)
async def create_player(
    player_info: PlayerIn,
    db=Depends(get_db), 
    room_id: str = Query("0", description="ID de la sala, por defecto 0")) -> PlayerResponse:
    """
    Creates a new player

    Parameters
    ----------
    player_info : PlayerIn
        Player information

    Returns
    -------
    PlayerResponse
        Player identifier

    Raises
    ------
    HTTPException
        404 -> When there is an error creating the player
    """
    try:
        created_player = PlayerService(db).create(player_info.to_dto())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    ws_message = WSAddMessage(
        payload=db_player_2_player_out(db_player=created_player)
    )
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return PlayerResponse(id=created_player.id,
                          message="El jugador se creó correctamente.")


@player_router.delete(path="/{id}")
async def delete_player(
    id: int, 
    db=Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")) -> PlayerResponse:
    """
    Delete player with id.

    Parameters
    ----------
    id : int
        Id of desired player

    Returns
    -------
    PlayerResponse
        Id of deleted player

    Raises
    ------
    HTTPException
        404 -> When player with id is not found
    """
    try:
        deleted_id = PlayerService(db).delete(id=id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

    ws_message = WSRemoveMessage(payload=deleted_id)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return PlayerResponse(id=deleted_id, message="El jugador se eliminó correctamente.")

@player_router.put(path="/{id}", response_model=PlayerOut)
async def update_player(
    id: int, 
    player_info: PlayerIn, 
    db=Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")) -> PlayerOut:
    """
    Update an existing player

    Parameters
    ----------
    id : int
        Id of the player to update
    player_info : PlayerIn
        Updated player information

    Returns
    -------
    PlayerOut
        Updated player

    Raises
    ------
    HTTPException
        404 -> When player with id is not found
        400 -> When there is an error updating the player
    """
    try:
        updated_player = PlayerService(db).update(id=id, player_dto=player_info.to_dto())
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

    ws_message = WSUpdateMessage(payload=db_player_2_player_out(db_player=updated_player))
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return updated_player


@player_router.get(path="/game/{game_id}/players")
async def get_players_by_game(
    game_id: int,
    db=Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")) -> List[PlayerOut]:
    """
    Obtiene todos los jugadores de una partida específica.

    Parameters
    ----------
    game_id : int
        ID de la partida
    room_id : str
        ID de la sala para websockets

    Returns
    -------
    List[PlayerOut]
        Lista de jugadores en la partida

    Raises
    ------
    HTTPException
        404 -> Cuando no se encuentran jugadores en la partida
    """
    try:
        players = PlayerService(db).get_players_by_game(game_id=game_id)
        if not players:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No se encontraron jugadores en la partida con id: {game_id}",
            )
        return [player.to_schema() for player in players]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al obtener jugadores: {str(e)}",
        )


@player_router.get(path="/game/{game_id}/players-with-revealed-secrets")
async def get_players_with_revealed_secrets(
    game_id: int,
    db=Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")) -> List[PlayerOut]:
    """
    Obtiene todos los jugadores de una partida que tienen al menos un secreto revelado.

    Parameters
    ----------
    game_id : int
        ID de la partida
    room_id : str
        ID de la sala para websockets

    Returns
    -------
    List[PlayerOut]
        Lista de jugadores con secretos revelados

    Raises
    ------
    HTTPException
        404 -> Cuando no se encuentran jugadores con secretos revelados
    """
    try:
        players = PlayerService(db).get_players_with_revealed_secrets(game_id=game_id)
        if not players:
            return []  # Devolver lista vacía si no hay jugadores con secretos revelados
        return [player.to_schema() for player in players]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al obtener jugadores con secretos revelados: {str(e)}",
        )


@player_router.get(path="/{player_id}/revealed-secrets")
async def get_revealed_secrets_by_player(
    player_id: int,
    db=Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")) -> List[CardOut]:
    """
    Obtiene todos los secretos revelados de un jugador específico.

    Parameters
    ----------
    player_id : int
        ID del jugador

    Returns
    -------
    List[CardOut]
        Lista de cartas de secreto reveladas del jugador

    Raises
    ------
    HTTPException
        404 -> Cuando no se encuentran secretos revelados
    """
    try:
        from src.cards.models import Card
        
        revealed_secrets = (
            db.query(SecretCard)
            .join(player_card_table, player_card_table.c.card_id == SecretCard.id)
            .filter(
                player_card_table.c.player_id == player_id,
                SecretCard.is_revealed == True
            )
            .all()
        )
        
        if not revealed_secrets:
            return []  # Devolver lista vacía si no hay secretos revelados
            
        return [card.to_schema() for card in revealed_secrets]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al obtener secretos revelados: {str(e)}",
        )