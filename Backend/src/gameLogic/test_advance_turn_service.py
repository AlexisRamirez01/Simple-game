import pytest
from datetime import date
from sqlalchemy.orm import Session

from src.game.models import Game
from src.player.models import Player
from src.gamePlayer.models import PlayerGame

from src.gameLogic.assign_turns_service import assign_turns
from src.gameLogic.advance_turn_service import advance_turn 

@pytest.fixture
def setup_game_with_6_players(db_session: Session):
    """
    Crea un juego con 6 jugadores en la base de datos de prueba.
    """

    game = Game(name="Test Game 6 Players")
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

    players = []
    for i in range(6):
        p = Player(
            name=f"Jugador {i+1}",
            birthdate=date(1990, 1, i+1),
            avatar="ruta",
            is_Social_Disgrace=False,
            is_Your_Turn=False,
            is_Owner=False,
            rol="innocent"
        )
        db_session.add(p)
        players.append(p)
    db_session.commit()

    gp_list = []
    for pos, p in enumerate(players, start=1):
        gp = PlayerGame(game_id=game.id, player_id=p.id, position_id_player=pos)
        gp_list.append(gp)
    db_session.add_all(gp_list)
    db_session.commit()

    return game, players


def test_advance_turn_6_players_simple(db_session: Session, setup_game_with_6_players):
    game, players = setup_game_with_6_players

    first_player_id = assign_turns(db_session, game.id)[0]
    db_session.refresh(game)
    assert game.turn_id_player == first_player_id

    current_player_id = game.turn_id_player
    for _ in range(12):
        next_player_id = advance_turn(db_session, game.id)
        db_session.refresh(game)
        assert next_player_id != current_player_id
        current_player_id = next_player_id

    db_session.refresh(game)
    for _ in range(6):
        current_player_id = advance_turn(db_session, game.id)
        db_session.refresh(game)
    assert game.turn_id_player == first_player_id
