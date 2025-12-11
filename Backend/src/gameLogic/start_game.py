# src/game/start_game.py
from typing import Optional
from sqlalchemy.orm import Session
from src.game.models import Game
from src.gameLogic.assign_cards_service import assign_cards, NotEnoughCards
from src.gameLogic.assign_secrets_service import assign_secrets
from src.gameLogic.assign_turns_service import assign_turns
from src.gameLogic.create_game_perfile import initialize_game_cards
from src.gameLogic.create_draw_deck_service import create_draw_deck, create_draft_deck

class StartGameError(Exception):
    """Error genérico al intentar iniciar la partida"""
    pass


def start_game(db: Session, game_id: int) -> int:
    """
    Orquesta el inicio de la partida:
      1) Crea las cartas y las asigna a la partida (initialize_game_cards)
      2) Genera el orden y asigna el primer turno (assign_turns) -> devuelve lista ordenada
      3) Reparte cartas a jugadores (assign_cards) y secretos (assign_secrets)
      4) Marca game.is_started = True si no estaba marcado
    Devuelve:
      player_id (int) -> id del jugador al que se le asignó el primer turno.

    Requiere: db (Session) y game_id (int).
    Lanza:
      - NotEnoughCards (desde assign_cards) si no hay cartas suficientes
      - StartGameError para errores generales
    """

    game: Optional[Game] = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise StartGameError("Game not found")

    try:
        initialize_game_cards(db, game_id=game_id)
    except Exception as e:
        raise StartGameError(f"Error initializing game cards: {e}")
    try:
        ordered_player_ids = assign_turns(db, game_id)
    except Exception as e:
        raise StartGameError(f"Error assigning turns: {e}")

    if not ordered_player_ids:
        raise StartGameError("assign_turns returned no players")

    first_player_id = ordered_player_ids[0]

    try:
        assign_cards(db, game_id)
        assign_secrets(db, game_id)
        create_draw_deck(db, game_id)
        create_draft_deck(db, game_id)
    except NotEnoughCards:
        raise
    except Exception as e:
        raise StartGameError(f"Error assigning cards: {e}")

    try:
        game = db.query(Game).filter(Game.id == game_id).first()
        if not getattr(game, "is_started", False):
            setattr(game, "is_started", True)
            db.commit()
    except Exception as e:
        raise StartGameError(f"Error marking game as started: {e}")

    return first_player_id