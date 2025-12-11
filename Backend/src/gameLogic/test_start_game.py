import pytest
from datetime import date
from sqlalchemy.orm import Session

from src.game.models import Game
from src.player.models import Player
from src.gamePlayer.models import PlayerGame
from src.cards.models import Card
from src.gameCard.models import GameCard
from src.gameLogic.start_game import start_game, StartGameError
from src.gameLogic.assign_cards_service import NotEnoughCards


@pytest.fixture
def setup_minimal_game(db_session: Session):
    """
    Crea un juego con 2 jugadores y algunas cartas.
    """
    # Crear juego
    game = Game(name="Test Game Start")
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

    # Crear jugadores
    p1 = Player(
        name="Player 1",
        avatar="ruta",
        birthdate=date(1990, 11, 14),
        is_Social_Disgrace=False,
        is_Your_Turn=False,
        is_Owner=True,
        rol="innocent"
    )

    p2 = Player(
        name="Player 2",
        avatar="ruta",
        birthdate=date(1990, 11, 14),
        is_Social_Disgrace=False,
        is_Your_Turn=False,
        is_Owner=False,
        rol="innocent"
    )

    db_session.add_all([p1, p2])
    db_session.commit()

    # Vincular jugadores al juego
    db_session.add_all([
        PlayerGame(game_id=game.id, player_id=p1.id),
        PlayerGame(game_id=game.id, player_id=p2.id)
    ])
    db_session.commit()

    # Crear cartas suficientes
    for i in range(20):
        c = Card(
            name=f"Card {i}",
            description="desc",
            image_url="img",
            is_murderes_escapes=False
        )
        db_session.add(c)
    db_session.commit()

    return game, [p1, p2]


def test_start_game_success(db_session: Session, setup_minimal_game):
    """
    Verifica que start_game inicializa correctamente el juego
    y marca el juego como iniciado.
    """
    game, players = setup_minimal_game

    first_player_id = start_game(db_session, game.id)

    # Verifica que devuelva un ID de jugador válido
    assert first_player_id in [p.id for p in players]

    # Verifica que el juego se haya marcado como iniciado
    updated_game = db_session.query(Game).filter_by(id=game.id).first()
    assert updated_game.is_started is True


def test_start_game_with_invalid_game_id(db_session: Session):
    """
    Verifica que lanza StartGameError si el juego no existe.
    """
    with pytest.raises(StartGameError, match="Game not found"):
        start_game(db_session, 9999)


