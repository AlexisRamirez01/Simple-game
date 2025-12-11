""" Player utilities """

from src.player.models import Player
from src.player.schemas import PlayerOut


def db_player_2_player_out(db_player: Player) -> PlayerOut:
    """
    Converts a Database player into a response schema

    Parameters
    ----------
    db_contact : Player
        Database Player

    Returns
    -------
    PlayerOut
        Player schema for response
    """

    return PlayerOut(
        id=db_player.id,
        name=db_player.name,
        avatar=db_player.avatar,
        birthdate=db_player.birthdate,
        is_Social_Disgrace=db_player.is_Social_Disgrace,
        is_Your_Turn=db_player.is_Your_Turn,
        is_Owner=db_player.is_Owner,
        rol=db_player.rol
    )