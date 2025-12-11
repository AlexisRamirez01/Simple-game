import pytest
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.game.models import Game
from src.player.models import Player
from src.gamePlayer.models import PlayerGame
from src.cards.models import Card
from src.gameCard.models import GameCard
from src.gameLogic.create_draw_deck_service import create_draw_deck


@pytest.fixture
def setup_game_for_draw_deck(db_session: Session):
    """
    Crea un juego con cartas ya repartidas (algunas con card_position=None)
    y otras disponibles para el mazo de robo.
    """
    # Crear juego
    game = Game(name="Juego test mazo robo")
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

    # Crear jugadores
    p1 = Player(
        name="Jugador 1",
        avatar="ruta",
        birthdate=date(1990, 11, 14),
        is_Social_Disgrace=False,
        is_Your_Turn=False,
        is_Owner=False,
        rol="innocent",
    )
    p2 = Player(
        name="Jugador 2",
        avatar="ruta",
        birthdate=date(1991, 1, 1),
        is_Social_Disgrace=False,
        is_Your_Turn=False,
        is_Owner=False,
        rol="innocent",
    )
    db_session.add_all([p1, p2])
    db_session.commit()

    db_session.add_all([
        PlayerGame(game_id=game.id, player_id=p1.id),
        PlayerGame(game_id=game.id, player_id=p2.id),
    ])
    db_session.commit()

    # Crear cartas normales (no secretas)
    normal_cards = []
    for i in range(5):
        c = Card(
            name=f"Normal_{i}",
            description="desc",
            image_url="img",
            is_murderes_escapes=False,
        )
        db_session.add(c)
        normal_cards.append(c)
    db_session.commit()

    # Crear carta murder_escapes
    murder_card = Card(
        name="murder_escapes",
        description="desc",
        image_url="img",
        is_murderes_escapes=True,
    )
    db_session.add(murder_card)
    db_session.commit()

    # Crear carta secreta (que debe ser ignorada)
    secret_card = Card(
        name="Secret_Trap",
        description="desc",
        image_url="img",
        is_murderes_escapes=False,
    )
    db_session.add(secret_card)
    db_session.commit()

    # Agregar todas a GameCard
    for c in normal_cards + [murder_card, secret_card]:
        gc = GameCard(game_id=game.id, card_id=c.id, card_position="mazo_robo")
        db_session.add(gc)
    db_session.commit()

    # Simular cartas ya repartidas (quedan fuera del mazo)
    # Por ejemplo, la primera normal y la secreta
    gcs = db_session.query(GameCard).filter(GameCard.game_id == game.id).all()
    gcs[0].card_position = None  # repartida a un jugador
    db_session.commit()

    return game, normal_cards, murder_card, secret_card


def test_create_draw_deck_success(db_session: Session, setup_game_for_draw_deck):
    game, normal_cards, murder_card, secret_card = setup_game_for_draw_deck

    # Ejecutar servicio
    create_draw_deck(db_session, game.id)

    # Verificar que draw_top se haya actualizado correctamente
    db_session.refresh(game)
    gamecards = db_session.query(GameCard).filter(GameCard.game_id == game.id).all()
    mazo = [gc for gc in gamecards if gc.card_position == "mazo_robo" and "secret" not in gc.card.name.lower()]

    assert game.draw_top == len(mazo) - 1

    # Verificar que todas las cartas del mazo tengan card_order asignado
    orders = [gc.card_order for gc in mazo]
    assert all(o is not None for o in orders)
    assert sorted(orders) == list(range(len(orders)))

    # Verificar que murder_escapes está en posición 0
    murder_gc = next(gc for gc in mazo if gc.card.name == "murder_escapes")
    assert murder_gc.card_order == 0

    # Verificar que la carta secreta no fue incluida
    secret_gc = db_session.query(GameCard).join(Card).filter(Card.name == "Secret_Trap").first()
    assert "secret" in secret_gc.card.name.lower()
    assert secret_gc not in mazo

    # Verificar que las cartas repartidas (card_position=None) no fueron incluidas
    repartidas = db_session.query(GameCard).filter(GameCard.card_position == None).all()
    for gc in repartidas:
        assert gc not in mazo


def test_create_draw_deck_no_game(db_session: Session):
    """
    Verifica que se lanza excepción si el juego no existe.
    """
    with pytest.raises(Exception, match="Game not found"):
        create_draw_deck(db_session, game_id=9999)


def test_create_draw_deck_no_murder_card(db_session: Session):
    """
    Verifica que se lanza excepción si falta la carta 'murder_escapes'.
    """
    # Crear juego sin murder card
    game = Game(name="Juego sin murder")
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

    # Crear carta normal
    c = Card(name="Normal", description="desc", image_url="img", is_murderes_escapes=False)
    db_session.add(c)
    db_session.commit()

    gc = GameCard(game_id=game.id, card_id=c.id, card_position="mazo_robo")
    db_session.add(gc)
    db_session.commit()

    with pytest.raises(Exception, match="murder_escapes"):
        create_draw_deck(db_session, game.id)
