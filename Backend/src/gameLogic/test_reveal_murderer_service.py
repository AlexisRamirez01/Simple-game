import pytest
from unittest.mock import MagicMock
from src.gameLogic.reveal_murderer_service import reveal_murderer
from src.gameCard.models import GameCard
from src.game.models import Game
from src.gamePlayer.models import PlayerGame
from src.player.models import Player


def make_player(id, rol):
    player = MagicMock(spec=Player)
    player.id = id
    player.rol = rol
    return player


def make_pg(id, pid, gid):
    pg = MagicMock(spec=PlayerGame)
    pg.id = id
    pg.player_id = pid
    pg.game_id = gid
    return pg


def test_reveal_murderer_success(monkeypatch):
    """Caso feliz: encuentra asesino y cómplice y elimina correctamente el juego."""
    db = MagicMock()

    # Simulamos que la carta pertenece al juego 10
    db.execute.return_value.first.return_value = (10,)

    # Mockeamos jugadores de la partida
    pg1 = make_pg(1, 1, 10)
    pg2 = make_pg(2, 2, 10)
    db.query.return_value.filter.return_value.all.side_effect = [
        [pg1, pg2],  # PlayerGame
        [make_player(1, "murderer"), make_player(2, "accomplice")],  # Player
    ]

    # Game existente
    game = MagicMock(spec=Game)
    db.query.return_value.filter.return_value.first.return_value = game

    result = reveal_murderer(db, secret_id=99)

    # Validaciones de resultado
    assert result["game_id"] == 10
    assert result["murderer"].rol == "murderer"
    assert result["accomplice"].rol == "accomplice"

    # Validar eliminaciones y commit
    assert db.query.return_value.filter.return_value.delete.call_count == 2
    db.delete.assert_called_once_with(game)
    db.commit.assert_called_once()


def test_reveal_murderer_no_game_found():
    """Debe lanzar ValueError si no se encuentra el juego."""
    db = MagicMock()
    db.execute.return_value.first.return_value = None

    with pytest.raises(ValueError, match="Game not found"):
        reveal_murderer(db, secret_id=123)

    db.commit.assert_not_called()


def test_reveal_murderer_no_players_found(monkeypatch):
    """Debe retornar asesino/accomplice None si no hay jugadores o roles."""
    db = MagicMock()
    db.execute.return_value.first.return_value = (5,)

    # Sin jugadores asociados
    db.query.return_value.filter.return_value.all.side_effect = [
        [],  # PlayerGame
        [],  # Player
    ]

    # Mock Game
    game = MagicMock(spec=Game)
    db.query.return_value.filter.return_value.first.return_value = game

    result = reveal_murderer(db, secret_id=77)

    assert result["game_id"] == 5
    assert result["murderer"] is None
    assert result["accomplice"] is None
    db.commit.assert_called_once()

def test_reveal_murderer_missing_game_object():
    db = MagicMock()
    db.execute.return_value.first.return_value = (42,)

    pg = make_pg(1, 1, 42)
    db.query.return_value.filter.return_value.all.side_effect = [
        [pg],
        [make_player(1, "murderer")],
    ]
    db.query.return_value.filter.return_value.first.return_value = None

    # No debería lanzar excepción aunque no haya game
    result = reveal_murderer(db, secret_id=999)

    assert result["murderer"].rol == "murderer"
    db.commit.assert_called_once()
