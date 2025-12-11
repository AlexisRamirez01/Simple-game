""" Discard card test """
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
from src.playerCard.services import PlayerCardService
from src.gameLogic.assign_cards_service import assign_cards
from src.gameLogic.assign_secrets_service import assign_secrets
from src.gameLogic.discard_card_service import discard_card, discard_random_card

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
    
    # Crear cartas de secreto (5, 2 para el jugador que es asesino y 3 para el inocente)
    secret_cards = []
    for i in range(5):
        c = Card(
            name="secret_back",
            description="desc",
            image_url="img",
            is_murderes_escapes=False
        )
        db_session.add(c)
        secret_cards.append(c)
    
    # Creo carta de asesino 
    murderer_card = Card(
                    name="secret_murderer",
                    description="desc",
                    image_url="img",
                    is_murderes_escapes=True
    )
    db_session.add(murderer_card)   
    secret_cards.append(murderer_card)
    db_session.commit()

    # Registrar todas las cartas en GameCard (sin is_revealed)
    for c in normal_cards + notsofast_cards + secret_cards:
        gc = GameCard(game_id=game.id, card_id=c.id, card_position="MAZO_ROBO", card_order=0)
        db_session.add(gc)
    db_session.commit()

    return game, [p1, p2], normal_cards, notsofast_cards



def test_discard_card_success(db_session: Session, setup_game_with_cards_and_players, client):
    game, players, normal_cards, notsofast_cards = setup_game_with_cards_and_players

    assign_cards(db_session, game.id)
    assign_secrets(db_session, game.id)
    
    player = players[0]
    db_session.refresh(player)

    player_card_service = PlayerCardService(db_session)

    cards_in_hand = player_card_service.get_player_cards(player.id)
    
    # Buscar una carta que NO sea de tipo secreto
    card_to_discard = next(
        (c for c in cards_in_hand if not c.name.startswith("secret_")), 
        None
    )
    assert card_to_discard is not None, "No se encontró ninguna carta descartable" 

    response = client.put(f"/game/{game.id}/{player.id}/{card_to_discard.id}/discard")
    assert response.status_code == 200
    db_session.refresh(player)

    data = response.json()
    assert data["player_id"] == player.id
    assert data["card_id"] == card_to_discard.id

    final_cards = player_card_service.get_player_cards(player.id)
    assert len(final_cards) == 8

    final_cards_ids = [c.id for c in final_cards]
    assert card_to_discard.id not in final_cards_ids 

 

def test_discard_secret_card(db_session: Session, setup_game_with_cards_and_players, client):
    game, players, normal_cards, notsofast_cards = setup_game_with_cards_and_players

    assign_cards(db_session, game.id)
    assign_secrets(db_session, game.id)
    
    player = players[0]
    db_session.refresh(player)

    player_card_service = PlayerCardService(db_session)

    cards_in_hand = player_card_service.get_player_cards(player.id)
    
    # Buscar una carta que sea de tipo secreto
    card_to_discard = next(
        (c for c in cards_in_hand if c.name.startswith("secret_")), 
        None
    )
    assert card_to_discard is not None, "No se encontró ninguna carta de secreto" 

    response = client.put(f"/game/{game.id}/{player.id}/{card_to_discard.id}/discard")
    assert response.status_code == 400

    data = response.json()
    assert data["detail"] == "Cannot discard a secret card"
    
def test_discard_random_card(db_session: Session, setup_game_with_cards_and_players):
    game, players, normal_cards, notsofast_cards = setup_game_with_cards_and_players

    assign_cards(db_session, game.id)
    assign_secrets(db_session, game.id)

    player = players[0]
    db_session.refresh(player)
    player_card_service = PlayerCardService(db_session)

    initial_discardable = [
        c for c in player_card_service.get_player_cards(player.id)
        if not c.name.startswith("secret_")
    ]
    assert len(initial_discardable) > 0, "No hay cartas descartables para el test"

    discarded_card = discard_random_card(db_session, player.id, game.id)
    
    discarded_card_id = discarded_card["card_id"]
    final_cards = player_card_service.get_player_cards(player.id)
    final_discardable = [c for c in final_cards if not c.name.startswith("secret_")]

    final_cards_ids = [c.id for c in final_cards]
    assert discarded_card_id not in final_cards_ids

    discarded_card = next((c for c in initial_discardable if c.id == discarded_card_id), None)
    assert discarded_card is not None
    assert not discarded_card.name.startswith("secret_")

    assert len(final_discardable) == len(initial_discardable) - 1