from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, aliased
from typing import List, Optional, Dict
from pydantic import BaseModel

from src.models.db import get_db
from src.gamePlayer.services import GamePlayerService 
from src.gamePlayer.schemas import (
    GamePlayerOut, 
    WSAddMessage, 
    WSDeleteMessage, 
    WSRestockMessage,
    WSDiscardMessage,
    WSNextTurnMessage,
    WSMurdererEscapes,
    MurdererEscapesPayload,
    DiscardPayload,
    RestockPayload,
    CardsDraftInfo,
    JoinGameIn,
    VotePlayerInfo,
    RegisterVotesPayload,
    WSRegisteVotes,
    WSStartVotation,
    StartVotationPayload
)
from src.gamePlayer.dtos import GamePlayerDTO
from src.gamePlayer.models import PlayerGame
from src.gameLogic.restock_cards_service import restock_card
from src.gameLogic.discard_card_service import discard_card as discard_card_service
from src.gameLogic.discard_card_service import discard_random_card
from src.gameLogic.advance_turn_service import advance_turn
from src.gameLogic.restock_draft_deck import restock_draft_deck
from src.player.models import Player, RolEnum
from src.game.models import Game
from src.playerCard.services import PlayerCardService
from src.websocket import manager  
from src.cards.logicEventCards.point_suspicions_service import register_receiving_votes, start_votation

player_game_router = APIRouter()


# Helper para convertir modelo DB a schema
def db_gameplayer_to_out(pg) -> GamePlayerOut:
    return GamePlayerOut(
        id=pg.id,
        game_id=pg.game_id,
        player_id=pg.player_id,
        position_id_player=pg.position_id_player
    )

@player_game_router.post("/{game_id}/{player_id}", status_code=status.HTTP_201_CREATED)
async def join_game(
    game_id: int,
    player_id: int,
    data: JoinGameIn,  # <-- recibimos position_id_player
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")
):
    """
    Un jugador se une a una partida.

    Parameters
    ----------
    game_id : int
        ID de la partida
    player_id : int
        ID del jugador
    data : JoinGameIn
        Posición opcional del jugador
    room_id : str
        ID de la sala (opcional)

    Returns
    -------
    dict
        Información del jugador unido
    """
    service = GamePlayerService(db)
    try:
        dto = GamePlayerDTO(
            game_id=game_id,
            player_id=player_id,
            position_id_player=data.position_id_player  # opcional
        )
        player_game = service.join_game(dto)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    ws_message = WSAddMessage(payload=db_gameplayer_to_out(player_game))
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return {
        "id": player_game.id,
        "game_id": game_id,
        "player_id": player_id,
        "position_id_player": player_game.position_id_player,
        "message": "Jugador unido correctamente"
    }


@player_game_router.get("/{game_id}/players", response_model=List[GamePlayerOut])
async def get_players(
    game_id: int,
    db: Session = Depends(get_db)
):
    """
    Lista todos los jugadores de una partida.

    Parameters
    ----------
    game_id : int
        ID de la partida

    Returns
    -------
    List[GamePlayerOut]
        Jugadores en la partida

    """

    service = GamePlayerService(db)
    try:
        players_pg = service.get_players_in_game(game_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    # Devuelvo position_id_player incluido
    return [db_gameplayer_to_out(pg) for pg in players_pg]

@player_game_router.delete("/{game_id}/{player_id}")
async def delete_game_player(
    game_id: int,
    player_id: int,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")
):

    """
    Elimina la relación entre el jugador y la partida

    Parameters
    ----------
    game_id : int
        ID de la partida

    player_id : int
        ID del jugador que abandona la partida

    """

    service = GamePlayerService(db)
    try:
        player_remove = service.delete_game_player(game_id, player_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))    

    ws_message = WSDeleteMessage(player_id=player_remove)
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    
    return player_remove

@player_game_router.get("/{game_id}/{player_id}/role")
async def get_player_role(
    game_id: int,
    player_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Optional[Dict]]:
    """
    Devuelve el rol del jugador y su compañero secreto (si corresponde) para una partida específica.

    Parameters
    ----------
    game_id : int
        ID de la partida en la que se encuentra el jugador.
    player_id : int
        ID del jugador cuyo rol se quiere consultar.

    Returns
    -------
    Dict[str, Optional[Dict]]
        Diccionario con la información del jugador y su compañero secreto.
        - "player": Diccionario con "id", "name" y "rol" del jugador.
        - "partner": Diccionario con "id" y "name" del compañero secreto, 
                    o None si no hay compañero asignado o el jugador es inocente.

    Raises
    ------
    HTTPException
        404: Si el jugador no pertenece a la partida.
    """

    player_game = db.query(PlayerGame).filter_by(game_id=game_id, player_id=player_id).first()
    if not player_game:
        raise HTTPException(status_code=404, detail="Jugador no pertenece a la partida")

    player = db.query(Player).filter_by(id=player_id).first()

    partner_info = None
    if player.rol in [RolEnum.murderer, RolEnum.accomplice]:
        partner_rol = RolEnum.accomplice if player.rol == RolEnum.murderer else RolEnum.murderer
        partner = (
            db.query(Player)
            .join(PlayerGame, Player.id == PlayerGame.player_id)
            .filter(PlayerGame.game_id == game_id, Player.rol == partner_rol)
            .first()
        )
        if partner:
            partner_info = {"id": partner.id, "name": partner.name}

    return {
        "player": {"id": player.id, "name": player.name, "rol": player.rol.value},
        "partner": partner_info
    }

@player_game_router.put("/{game_id}/{player_id}/{card_id}/discard")
async def discard_card(
    game_id: int,
    player_id: int,
    card_id: int,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")
):

    """
    Endpoint que maneja descartar la carta de un jugador

    Parameters
    ----------
    game_id : int
        ID de la partida

    player_id : int
        ID del jugador que quiere descartar una carta
    
    card_id: int
        Id de la carta a descartar

    Returns
    -------
    result : dict
        ID del jugador e ID de la carta que descarta
    """

    try:
        result = discard_card_service(db, game_id, player_id, card_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    ws_message = WSDiscardMessage(payload=DiscardPayload(
        player_id=result["player_id"],
        card_id=result["card_id"],
        card_discard=result["card_discard"].to_schema()))
    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    return result

@player_game_router.post("/{game_id}/{player_id}/restock")
async def restock_cards(
    game_id: int,
    player_id: int,
    cards: CardsDraftInfo,
    cantidad_robo: int = 0,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")
):
    """
    Endpoint que maneja la reposición de cartas en la mano de un jugador

    Parameters
    ----------
    game_id : int
        ID de la partida

    player_id : int
        ID del jugador que quiere reponer sus cartas

    cards : list[int]
        Lista opcional de cartas seleccionadas por el jugador
        del mazo de draft

    Returns
    -------
    result : dict
        ID del jugador que repone de su mano y cartas obtenidas
    """
    new_cards_draft = []
    cards_result = []
    try:
        result = restock_card(db, game_id, player_id, cards.cards_id, cantidad_robo)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    if "murderer" in result:
        accomplice = result.get("accomplice")
        ws_message = WSMurdererEscapes(payload=MurdererEscapesPayload(
            murderer=result["murderer"].to_schema(),
            accomplice=accomplice.to_schema() if accomplice else None))
        await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
    else:
        cards_result = result["cards_from_draft"] + result["cards_from_draw"]
        if result["pass_turn"]:
            next_player_id = advance_turn(db, game_id)
            ws_nextTurn = WSNextTurnMessage(payload=next_player_id)
            await manager.broadcast(ws_nextTurn.model_dump_json(), room_id=room_id)

        cards_draft = restock_draft_deck(db, game_id)
        if "murderer" in cards_draft:
            accomplice = cards_draft.get("accomplice")
            ws_message = WSMurdererEscapes(payload=MurdererEscapesPayload(
                murderer=cards_draft["murderer"].to_schema(),
                accomplice=accomplice.to_schema() if accomplice else None))
            await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
            return cards_draft
        try:
            if cards_draft != "The draft deck have 3 cards":
                new_cards_draft = cards_draft["new_cards_to_draft"]
        except Exception:
            new_cards_draft = []
        ws_message = WSRestockMessage(payload=RestockPayload(
            game_id=game_id,
            player_id=player_id,
            cards=[card.model_dump() for card in cards_result],
            draft_cards=[card.model_dump() for card in new_cards_draft]
        ))
        await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return {
        "player_id": player_id,
        "game_id": game_id,
        "player_cards": cards_result,
        "draft_card": new_cards_draft
    }


@player_game_router.post("/{game_id}/{player_id}/pass")
async def pass_turn_endpoint(
    game_id: int,
    player_id: int,
    db: Session = Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")
):
    """
    Endpoint para que un jugador pase su turno sin realizar acción.
    Realiza los siguientes pasos:
      1. Descarta una carta aleatoria del jugador
      2. Reponer 1 carta del mazo
      3. Avanza el turno al siguiente jugador

    Parameters
    ----------
    game_id : int
        ID de la partida

    player_id : int
        ID del jugador que quiere pasar su turno

    Returns
    -------
    result : dict
        Diccionario con:
            - player_id: ID del jugador que pasó turno
            - discarded_card_id: ID de la carta descartada
            - next_player_id: ID del siguiente jugador
            - drawn_cards: lista de cartas repuestas
    """
    try:
        game = db.query(Game).filter(Game.id == game_id).first()
        if not game:
            raise ValueError("Game not found")
        
        player_game = db.query(PlayerGame).filter_by(game_id=game_id, player_id=player_id).first()
        if not player_game:
            raise ValueError("Player not in game")


        if game.turn_id_player != player_id:
            raise ValueError("It's not the player's turn")
        

        discarded_card = discard_random_card(db, player_id, game_id)

        player_card_service = PlayerCardService(db)

        cards_player = player_card_service.get_player_cards(player_id)
        cards_player_id = [
            card.id for card in cards_player
            if "secret" not in getattr(card, "name", "").lower() and not getattr(card, "is_murderes_escapes", False)
        ]
        amount_restock = 6 - len(cards_player_id)
        
        restock_result = restock_card(db, game_id, player_id, [], amount_restock)

        if "murderer" in restock_result:
            accomplice = restock_result.get("accomplice")
            ws_message = WSMurdererEscapes(payload=MurdererEscapesPayload(
                murderer=restock_result["murderer"].to_schema(),
                accomplice=accomplice.to_schema() if accomplice else None))
            await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
            return restock_result

        cards_result = restock_result["cards_from_draw"]

        next_player_id = advance_turn(db, game_id)

        result = {
            "player_id": player_id,
            "discarded_card": discarded_card,
            "restock_cards": cards_result,
            "next_player_id": next_player_id
        }

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Notificar a la sala vía WebSocket

    ws_restock = WSRestockMessage(payload=RestockPayload(
        game_id=game_id,
        player_id=player_id,
        cards=[card.model_dump() for card in cards_result],
        draft_cards=[]
    ))
    await manager.broadcast(ws_restock.model_dump_json(), room_id=room_id)

    ws_discard = WSDiscardMessage(payload=DiscardPayload(
        player_id=result["player_id"],
        card_id=discarded_card["card_id"],
        card_discard=discarded_card["card_discard"].to_schema()))
    await manager.broadcast(ws_discard.model_dump_json(), room_id=room_id)
    
    ws_nextTurn = WSNextTurnMessage(payload=result["next_player_id"])
    await manager.broadcast(ws_nextTurn.model_dump_json(), room_id=room_id)
    
    return result

@player_game_router.post("/{game_id}/{player_id}/vote")
async def register_votes_endpoint(
    game_id: int,
    player_id: int,
    vote: VotePlayerInfo,
    db: Session=Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")
):

    """
    Endpoint para que los jugadores registren los votos
    al jugarse una carta evento Point your Suspicions

    Parameters
    ----------
    game_id: int
        ID de la partida

    vote: Tuple[int, int]
        Contiene tanto el ID del jugador votante como el del jugador votado


    Returns
    -------
    End_votation: bool
        Es un booleano que se retorna para indicar que la votación a terminado

    Raises
    ------
    HTTPException
        404: Si el juego no es encontrado
        400: Si el jugador que emite el voto ya lo hizo
    """

    try:
        result = await register_receiving_votes(db, game_id, vote.vote, room_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    ws_message = WSRegisteVotes(payload=RegisterVotesPayload(
        end_votation=result,
    ))

    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return result

@player_game_router.get("/{game_id}/{player_id}/{card_id}/start-votation")
async def start_votation_endpoint(
    game_id: int,
    player_id: int,
    card_id: int,
    db: Session=Depends(get_db),
    room_id: str = Query("0", description="ID de la sala, por defecto 0")
):
    """
    Endpoint para que comunica a todos los jugadores el inicio de la votación
    para el evento de Point Your Suspicions

    Parameters
    -----------
    game_id: int
        ID de la partida

    player_id: int
        ID del jugador que juega la carta

    card_id: int
        ID de la carta jugada

    Raises
    ------
        404 -> Si la partida no ha sido encontrada
    """
    try:
        result = start_votation(db, game_id, player_id, card_id, room_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    players = result["players"]

    ws_message = WSStartVotation(payload=StartVotationPayload(
        current_voter_id=result["current_voter_id"],
        initiator_id=result["initiator_id"],
        card_id=result["card_id"],
        players=[player.to_schema() for player in players]
    ))

    await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

    return result
