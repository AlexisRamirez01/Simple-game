import pytest
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.game.models import Game
from src.player.models import Player
from src.gamePlayer.models import PlayerGame
from src.cards.models import Card
from src.gameCard.models import GameCard
from src.playerCard.models import player_card_table
from src.gameLogic.assign_cards_service import assign_cards, NotEnoughCards


@pytest.fixture
def setup_game_with_cards_and_players(db_session: Session):
    """
    Crea un juego con 2 jugadores y un mazo con cartas normales + cartas NotSoFast.
    """
    # Crear juego
    game = Game(name="Test Game")
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
        rol="innocent"
    )

    p2 = Player(
        name="Jugador 2",
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

    # Crear cartas normales (10)
    normal_cards = []
    for i in range(10):
        c = Card(
            name=f"Card {i}",
            description="desc",
            image_url="img",
            is_murderes_escapes=False
        )
        db_session.add(c)
        normal_cards.append(c)
    db_session.commit()

    # Crear cartas NotSoFast (2, una por jugador)
    notsofast_cards = []
    for i in range(2):
        c = Card(
            name="Instant_notsofast",
            description="desc",
            image_url="img",
            is_murderes_escapes=False
        )
        db_session.add(c)
        notsofast_cards.append(c)
    db_session.commit()

    # Registrar todas las cartas en GameCard (sin is_revealed)
    for c in normal_cards + notsofast_cards:
        gc = GameCard(game_id=game.id, card_id=c.id, card_position="MAZO_ROBO")
        db_session.add(gc)
    db_session.commit()

    return game, [p1, p2], normal_cards, notsofast_cards


def test_assign_cards_success(db_session: Session, setup_game_with_cards_and_players):
    game, players, normal_cards, notsofast_cards = setup_game_with_cards_and_players

    # Ejecutar lógica
    assign_cards(db_session, game.id)

    # Verificar que cada jugador tiene exactamente 6 cartas
    for player in players:
        stmt = select(player_card_table.c.card_id).where(player_card_table.c.player_id == player.id)
        player_cards = [cid for (cid,) in db_session.execute(stmt).fetchall()]
        assert len(player_cards) == 6

        # Verificar que tienen exactamente 1 NotSoFast
        n_s_f = db_session.query(Card).filter(Card.id.in_(player_cards), Card.name == "Instant_notsofast").count()
        assert n_s_f == 1

        # Las otras 5 cartas son normales
        n_normal = db_session.query(Card).filter(Card.id.in_(player_cards), Card.name != "Instant_notsofast").count()
        assert n_normal == 5

    # Verificar que las cartas repartidas tienen card_position=None en GameCard
    game_cards = db_session.query(GameCard).filter(GameCard.game_id == game.id).all()
    for gc in game_cards:
        stmt = select(player_card_table.c.card_id).where(player_card_table.c.card_id == gc.card_id)
        assigned = db_session.execute(stmt).first()
        if assigned:
            assert gc.card_position is None



def test_assign_cards_not_enough_cards(db_session: Session):
    """
    Verifica que se lanza NotEnoughCards si no hay suficientes cartas.
    """
    # Crear juego vacío
    game = Game(name="Juego con pocas cartas")
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

    # Crear un jugador
    player = Player(
        name="Jugador único",
        avatar="ruta",
        birthdate=date(1990, 11, 14),
        is_Social_Disgrace=False,
        is_Your_Turn=False,
        is_Owner=False,
        rol="innocent",
    )
    db_session.add(player)
    db_session.commit()

    gp = PlayerGame(game_id=game.id, player_id=player.id)
    db_session.add(gp)
    db_session.commit()

    # Crear solo 3 cartas (se necesitan 6)
    for i in range(3):
        c = Card(name=f"Card {i}", description="desc", image_url="img", is_murderes_escapes=False)
        db_session.add(c)
        db_session.commit()
        gc = GameCard(game_id=game.id, card_id=c.id, card_position="MAZO_ROBO")
        db_session.add(gc)
    db_session.commit()

    # Ejecutar y verificar excepción
    with pytest.raises(NotEnoughCards):
        assign_cards(db_session, game.id)
