import pytest
from datetime import date
from sqlalchemy.orm import Session
from src.game.models import Game
from src.player.models import Player
from src.gamePlayer.models import PlayerGame
from src.cards.models import Card
from src.gameCard.models import GameCard
from src.gameLogic.murderer_escapes_service import murderer_escapes_service

@pytest.fixture
def setup_game_for_murderer(db_session: Session):
    """
    Fixture que crea un juego con:
    - 2 jugadores
    - Roles: murderer y accomplice
    - 3 cartas normales asignadas al juego
    """
    game = Game(name="Test Murderer Game")
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

    murderer = Player(
        name="Asesino",
        avatar="avatar1.png",
        birthdate=date(1990, 1, 1),
        is_Social_Disgrace=False,
        is_Your_Turn=False,
        is_Owner=False,
        rol="murderer"
    )
    accomplice = Player(
        name="Cómplice",
        avatar="avatar2.png",
        birthdate=date(1991, 2, 2),
        is_Social_Disgrace=False,
        is_Your_Turn=False,
        is_Owner=False,
        rol="accomplice"
    )

    db_session.add_all([murderer, accomplice])
    db_session.commit()

    db_session.add_all([
        PlayerGame(game_id=game.id, player_id=murderer.id),
        PlayerGame(game_id=game.id, player_id=accomplice.id)
    ])
    db_session.commit()

    cards = []
    for i in range(3):
        c = Card(
            name=f"Card {i}",
            description="desc",
            image_url=f"img{i}.png",
            is_murderes_escapes=False
        )
        db_session.add(c)
        cards.append(c)
    db_session.commit()

    for c in cards:
        gc = GameCard(game_id=game.id, card_id=c.id, card_position="MAZO_ROBO", card_order=0)
        db_session.add(gc)
    db_session.commit()

    return game, murderer, accomplice, cards


def test_murderer_escapes_service(db_session: Session, setup_game_for_murderer):
    game, murderer, accomplice, cards = setup_game_for_murderer

    result = murderer_escapes_service(db_session, game.id)

    assert result["game_id"] == game.id
    assert result["murderer"].id == murderer.id
    assert result["accomplice"].id == accomplice.id

    # Verificar eliminación completa
    assert db_session.query(Game).filter(Game.id == game.id).first() is None
    assert db_session.query(GameCard).filter(GameCard.game_id == game.id).count() == 0
    assert db_session.query(PlayerGame).filter(PlayerGame.game_id == game.id).count() == 0