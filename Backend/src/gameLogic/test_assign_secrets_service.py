import pytest
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.game.models import Game
from src.player.models import Player, RolEnum
from src.gamePlayer.models import PlayerGame
from src.cards.models import Card
from src.gameCard.models import GameCard
from src.playerCard.models import player_card_table
from src.gameLogic.assign_secrets_service import assign_secrets, NotEnoughSecretCards


@pytest.fixture
def setup_game_with_secret_cards(db_session: Session):
    """
    Crea un juego con 5 jugadores y cartas secretas necesarias:
    - 1 secret_murderer
    - 1 secret_accomplice
    - Resto secret_back
    """
    # Crear juego
    game = Game(name="Test Secret Game")
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

    # Crear 5 jugadores
    players = []
    for i in range(5):
        p = Player(
            name=f"Jugador {i+1}",
            avatar="ruta",
            birthdate=date(1990, 1, 1),
            is_Social_Disgrace=False,
            is_Your_Turn=False,
            is_Owner=False,
            rol=RolEnum.innocent
        )
        db_session.add(p)
        players.append(p)
    db_session.commit()

    # Vincular jugadores al juego
    for p in players:
        db_session.add(PlayerGame(game_id=game.id, player_id=p.id))
    db_session.commit()

    # Crear cartas secretas
    secret_cards = []

    # Asesino
    c = Card(name="secret_murderer", description="desc", image_url="img", is_murderes_escapes=False)
    db_session.add(c)
    secret_cards.append(c)

    # Cómplice
    c = Card(name="secret_accomplice", description="desc", image_url="img", is_murderes_escapes=False)
    db_session.add(c)
    secret_cards.append(c)

    # Resto secret_back (3 por jugador menos las dos especiales = 13)
    for i in range(13):
        c = Card(name="secret_back", description="desc", image_url="img", is_murderes_escapes=False)
        db_session.add(c)
        secret_cards.append(c)
    db_session.commit()

    # Registrar cartas en GameCard
    for c in secret_cards:
        db_session.add(GameCard(game_id=game.id, card_id=c.id, card_position="MAZO_ROBO"))
    db_session.commit()

    return game, players, secret_cards


def test_assign_secrets_success(db_session: Session, setup_game_with_secret_cards):
    game, players, secret_cards = setup_game_with_secret_cards

    # Ejecutar asignación
    assign_secrets(db_session, game.id)

    # Verificar roles
    roles = {p.id: db_session.get(Player, p.id).rol for p in players}
    assert list(roles.values()).count(RolEnum.murderer) == 1
    assert list(roles.values()).count(RolEnum.accomplice) == 1
    assert list(roles.values()).count(RolEnum.innocent) == 3

    # Verificar que cada jugador tenga 3 cartas secretas
    for player in players:
        stmt = select(player_card_table.c.card_id).where(player_card_table.c.player_id == player.id)
        cards = [cid for (cid,) in db_session.execute(stmt).fetchall()]
        assert len(cards) == 3

    # Verificar que las cartas asignadas tengan card_position=None
    game_cards = db_session.query(GameCard).filter(GameCard.game_id == game.id).all()
    for gc in game_cards:
        stmt = select(player_card_table.c.card_id).where(player_card_table.c.card_id == gc.card_id)
        assigned = db_session.execute(stmt).first()
        if assigned:
            assert gc.card_position is None


def test_assign_secrets_not_enough_secret_cards(db_session: Session):
    """
    Verifica que se lanza NotEnoughSecretCards si no hay suficientes cartas secretas
    para repartir a todos los jugadores.
    """
    # Crear juego vacío
    game = Game(name="Juego con pocas cartas secretas")
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

    # Crear 2 jugadores
    players = []
    for i in range(2):
        p = Player(
            name=f"Jugador {i+1}",
            avatar="ruta",
            birthdate=date(1990, 1, 1),
            is_Social_Disgrace=False,
            is_Your_Turn=False,
            is_Owner=False,
            rol="innocent",
        )
        db_session.add(p)
        players.append(p)
    db_session.commit()

    # Vincular jugadores al juego
    for p in players:
        db_session.add(PlayerGame(game_id=game.id, player_id=p.id))
    db_session.commit()

    # Crear solo 2 cartas secretas (insuficientes, se necesitan 2*3 = 6)
    for i in range(2):
        c = Card(name="secret_back", description="desc", image_url="img", is_murderes_escapes=False)
        db_session.add(c)
        db_session.commit()
        gc = GameCard(game_id=game.id, card_id=c.id, card_position="MAZO_ROBO")
        db_session.add(gc)
    db_session.commit()

    # Ejecutar y verificar excepción
    with pytest.raises(NotEnoughSecretCards):
        assign_secrets(db_session, game.id)
