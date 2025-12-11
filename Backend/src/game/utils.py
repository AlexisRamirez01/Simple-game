""" Game utilities """

from src.game.models import Game
from src.game.schemas import GameOut


def db_game_2_game_out(db_game: Game) -> GameOut:
    """
    Converts a Database game into a response schema

    Parameters
    ----------
    db_contact : Game
        Database Game

    Returns
    -------
    GameOut
        Game schema for response
    """

    return GameOut(
        id=db_game.id,
        name=db_game.name,
        max_players=db_game.max_players,
        min_players=db_game.min_players,
        is_started=db_game.is_started,
        current_players=db_game.current_players,
        current_turn=db_game.current_turn,
        turn_id_player=db_game.turn_id_player,
        draw_top=db_game.draw_top,
        discard_top=db_game.discard_top,
    )