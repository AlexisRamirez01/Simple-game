import pytest
from datetime import date
from sqlalchemy.orm import Session

from src.game.models import Game
from src.player.models import Player
from src.gamePlayer.models import PlayerGame
from src.gameLogic.assign_turns_service import assign_turns


@pytest.fixture
def setup_game_with_players(db_session: Session):
    """
    Crea un juego con 3 jugadores en la base de datos de prueba.
    Los cumpleaños están puestos para testear la lógica de cercanía a 15/11.
    """
    # Crear juego
    game = Game(name="Test Game")
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

    # Jugadores con distintos cumpleaños
    p1 = Player(
        name="Jugador A",
        birthdate=date(1990, 11, 14),  # 1 día antes
        avatar="ruta",
        is_Social_Disgrace=False,
        is_Your_Turn=False,
        is_Owner=False,
        rol="innocent",
    )

    p2 = Player(
        name="Jugador B",
        birthdate=date(1990, 11, 16),  # 1 día después
        avatar="ruta",
        is_Social_Disgrace=False,
        is_Your_Turn=False,
        is_Owner=False,
        rol="innocent",
    )

    p3 = Player(
        name="Jugador C",
        birthdate=date(1990, 1, 1),  # lejos
        avatar="ruta",
        is_Social_Disgrace=False,
        is_Your_Turn=False,
        is_Owner=False,
        rol="innocent",
    )

    db_session.add_all([p1, p2, p3])
    db_session.commit()

    # Vincular jugadores al juego
    gp1 = PlayerGame(game_id=game.id, player_id=p1.id)
    gp2 = PlayerGame(game_id=game.id, player_id=p2.id)
    gp3 = PlayerGame(game_id=game.id, player_id=p3.id)

    db_session.add_all([gp1, gp2, gp3])
    db_session.commit()

    return game, [p1, p2, p3]


def test_assign_turns_assigns_first_turn_correctly(db_session: Session, setup_game_with_players):
    game, players = setup_game_with_players
    p1, p2, p3 = players

    # Ejecutar lógica sobre la DB de prueba
    order = assign_turns(db_session, game.id)

    # Refrescar datos desde la DB
    db_session.refresh(game)

    # Traer PlayerGame + Player juntos
    gp_list = (
        db_session.query(PlayerGame, Player)
        .join(Player, Player.id == PlayerGame.player_id)
        .filter(PlayerGame.game_id == game.id)
        .all()
    )

    # Verificaciones
    # 1. El turno en Game corresponde al jugador más cercano al 15/11 (p1 o p2)
    assert game.turn_id_player in [p1.id, p2.id]

    # 2. El primero en el orden devuelto es el jugador con turno
    assert order[0] == game.turn_id_player

    # 3. Todos los jugadores tienen asignada una posición única
    positions = [pg.position_id_player for pg, _ in gp_list]
    assert sorted(positions) == [1, 2, 3]

    # 4. Solo un jugador tiene is_your_turn = True
    players_turn = [player.is_Your_Turn for _, player in gp_list]
    assert players_turn.count(True) == 1
    # El jugador del primer turno tiene el flag activo
    first_player_id = order[0]
    assert any(player.id == first_player_id and player.is_Your_Turn for _, player in gp_list)

    # 5. El array de IDs devuelto contiene exactamente a todos los jugadores
    ids_from_db = sorted([p.id for p in players])
    ids_from_order = sorted(order)
    assert ids_from_order == ids_from_db
