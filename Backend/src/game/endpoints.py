"""Defines game endpoints"""
from src.gameLogic.start_game import start_game
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query

from src.game.models import Game
from src.game.schemas import (
	GameIn,
	GameOut,
	GameResponse,
	WSAddMessage,
	WSUpdateMessage,
 	WSUpdateStartMessage,
	WSRemoveMessage,
)

from src.game.utils import db_game_2_game_out
from src.websocket import manager
from src.game.services import GameService
from src.models.db import get_db

game_router = APIRouter()

@game_router.get(path="/")
async def retrieve_games(
	db=Depends(get_db),
	name: Optional[str] = None,
	max_players: Optional[int] = None,
	min_players: Optional[int] = None,
	current_players: Optional[int] = None,
	is_started: Optional[bool] = None,
	current_turn: Optional[int] = None,
	turn_id_player: Optional[int] = None,
) -> List[GameOut]:
		
	"""
    retrieves game information as a list filtering by name, 
    max_players, min_players, current_players, is_started,
    current_turn or turn_id_player.

    Parameters
    ----------
    name : Optional[str], optional game name, default None 
    max_players : Optional[int], optional game max_players, by default None 
    min_players : Optional[int], optional game min_players, by default None 
    current_players : Optional[int], optional game current_players, by default None 
    is_started : Optional[bool], optional game is_started, by default None 
    current_turn : Optional[int], optional game current_turn, by default None 
    turn_id_player : Optional[int], optional game turn_id_player, by default None 

    Returns 
    ------- 
    List[GameOut] 
    	A list of retrieved games
    """
	return GameService(db).get_all(
    	name=name, 
    	max_players=max_players, 
    	min_players=min_players,
    	current_players=current_players, 
    	is_started=is_started, 
    	current_turn=current_turn, 
    	turn_id_player=turn_id_player
	)


@game_router.get(path="/{id}")
async def get_game(id: int, db=Depends(get_db)) -> GameOut:
	"""
	Get a game

	Parameters
	----------
	id : int
		game id

	Returns
	-------
	GameOut
		Game retrieved

	Raises
	------
		HTTPException
			404 -> When game is not found
	"""
	db_game = GameService(db).get_by_id(id=id)
	if not db_game:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail=f"Game {id} not exists",
		)
	return db_game

@game_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_game(
	game_info: GameIn, db=Depends(get_db),
  	room_id: str = Query("0", description="ID de la sala, por defecto 0")
) -> GameResponse:
	"""
	Creates a new game

	Parameters
	----------
	game_info : GameIn
		Game information

	Returns
	-------
	GameResponse
		Game identifier

	Raises
	------
	HTTPException
		400 -> When there is a error creating the game
	"""
	try:
		created_game = GameService(db).create(game_dto=game_info.to_dto())
	except Exception as e:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail=str(e),
		)
	
	ws_message = WSAddMessage(
		payload=db_game_2_game_out(db_game=created_game)
	)
	await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
	return GameResponse(id=created_game.id, message="El juego fue creado correctamente")
	

@game_router.delete("/{id}")
async def delete_game(id: int, 
		db=Depends(get_db), 
		room_id: str = Query("0", description="ID de la sala, por defecto 0")) -> GameResponse:
    """
    Delete a game with id

    Parameters
    ----------
    id : int
        id of desired game

    Returns
    -------
    GameResponse
        id of deleted game

    Raises
    ------
    HTTPException
        404 -> When game with id is not found
        409 -> When game with id is started
    """
    game = GameService(db).get_by_id(id=id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game with id {id} not found"
        )

    if game.is_started:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Game with id {id} is already started"
        )

    deleted_game = GameService(db).delete(id=id)
    if not deleted_game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Game with id {id} could not be deleted"
        )
    ws_message = WSRemoveMessage(payload=deleted_game)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    return GameResponse(id=deleted_game, message="La partida se elimino correctamente")
    

@game_router.put("/{id}", response_model=GameOut)
async def game_update(
	id: int, game_info:GameIn, db=Depends(get_db),
 	room_id: str = Query("0", description="ID de la sala, por defecto 0")
) -> GameOut:
	"""
	Update an existing game

	Parameters
	----------
	id : int
		Id of game to update

	game_info : GameIn
		Updated game information

	Returns
	-------
	GameOut
		Updated game

	Raises
	------
	HTTPException
		400 -> When there is an error updating the game
		404 -> When the game is not found
	"""
	try:
		updated_game = GameService(db).update(id=id, game_dto=game_info.to_dto())
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
	ws_message = WSUpdateMessage(payload=db_game_2_game_out(db_game=updated_game))
	await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
	return updated_game  

@game_router.put("/start/{id}")
async def start_game_endpoint(
    id: int,
    game_info:GameIn,
    db=Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0"),
):

    # Validar que la partida exista
    game = GameService(db).get_by_id(id=id)
    if not game:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Game {id} not exists")
    try:
        first_player_id = start_game(db, id)
        print(first_player_id)
    except Exception as e:
        # error inesperado
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    # Broadcast opcional: intentar notificar la partida actualizada (no debe bloquear la respuesta)
    updated_game = GameService(db).get_by_id(id=id)
    
    ws_message = WSUpdateStartMessage(payload=first_player_id)
    print(updated_game)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return first_player_id