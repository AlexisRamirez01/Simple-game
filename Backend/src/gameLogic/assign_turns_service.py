from datetime import date
import random
from sqlalchemy.orm import Session
from src.game.models import Game
from src.player.models import Player
from src.gamePlayer.models import PlayerGame

AGATHA_BIRTHDAY = date(1900, 9, 15)  # año no importa


def days_diff(birthdate: date) -> int:
    # Representar siempre en un mismo año
    d = date(1900, birthdate.month, birthdate.day)
    diff = abs((d - AGATHA_BIRTHDAY).days)
    # Ajuste circular
    return min(diff, 365 - diff)


def assign_turns(db: Session, game_id: int):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise Exception("Game not found")

    # Traer jugadores en partida con join
    game_players = (
        db.query(PlayerGame, Player)
        .join(Player, Player.id == PlayerGame.player_id)
        .filter(PlayerGame.game_id == game_id)
        .all()
    )

    if not game_players:
        raise Exception("No players in game")

    # Ordenar: primero el más cercano al 15/11
    game_players.sort(key=lambda gp: days_diff(gp[1].birthdate))  # gp[1] es Player

    first_pg, first_player = game_players[0]
    others = game_players[1:]
    random.shuffle(others)

    ordered = [(first_pg, first_player)] + others

    # Actualizar DB
    for pos, (pg, player) in enumerate(ordered, start=1):
        pg.position_id_player = pos
        player.is_Your_Turn = (pos == 1)

    game.turn_id_player = first_pg.player_id
    db.commit()

    # devolver solo IDs en orden
    return [pg.player_id for pg, _ in ordered]
