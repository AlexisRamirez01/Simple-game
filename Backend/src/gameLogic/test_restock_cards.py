""" Restock cards test """
import pytest
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import select

from src.game.models import Game
from src.player.models import Player
from src.gamePlayer.models import PlayerGame
from src.cards.models import Card
from src.gameCard.models import GameCard  # <--- IMPORTAR ESTO
from src.playerCard.models import player_card_table
from src.playerCard.services import PlayerCardService
from src.gameLogic.assign_cards_service import assign_cards
from src.gameLogic.restock_cards_service import restock_card
from src.gameLogic.create_draw_deck_service import create_draw_deck, create_draft_deck

@pytest.fixture
def setup_game_with_cards_and_players(db_session: Session):

    game = Game(name="Test Game")
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

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

    db_session.add_all([
        PlayerGame(game_id=game.id, player_id=p1.id),
        PlayerGame(game_id=game.id, player_id=p2.id)
    ])
    db_session.commit()

    normal_cards = []
    for i in range(16):
        c = Card(
            name=f"Card {i}",
            description="desc",
            image_url="img",
            is_murderes_escapes=False
        )
        db_session.add(c)
        normal_cards.append(c)
    db_session.commit()

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

    murder_card = Card(
        name="murder_escapes",
        description="desc",
        image_url="img",
        is_murderes_escapes=True,
    )
    db_session.add(murder_card)
    db_session.commit()

    for c in normal_cards + notsofast_cards + [murder_card]:
        gc = GameCard(game_id=game.id, card_id=c.id, card_position="MAZO_ROBO", card_order=0)
        db_session.add(gc)
    db_session.commit()

    return game, [p1, p2], normal_cards, notsofast_cards

def test_restock_cards_success(db_session: Session, setup_game_with_cards_and_players):

    game, players, normal_cards, notsofast_cards = setup_game_with_cards_and_players

    assign_cards(db_session, game.id)
    create_draw_deck(db_session, game.id)

    player = players[0]
    player_card_service = PlayerCardService(db_session)

    cards_in_hand = player_card_service.get_player_cards(player.id)

    cards_to_discard = [c.id for c in cards_in_hand if "secret" not in c.name.lower()][:2]

    for card_id in cards_to_discard:
        player_card_service.remove_card_from_player(player.id, card_id)

    player_response = restock_card(db_session, game.id, player.id, [], 2)

    final_hand = player_card_service.get_player_cards(player.id)
    assert len(final_hand) == 6 
    
    assert isinstance(player_response["cards_from_draw"], list)
    assert len(player_response["cards_from_draw"]) == 2

    for card in player_response["cards_from_draw"]:
        assert hasattr(card, "id")
        assert hasattr(card, "name")
        assert hasattr(card, "description")
        assert hasattr(card, "image_url")
        assert hasattr(card, "is_murderes_escapes")

def test_restock_cards_with_complete_hand(db_session: Session, setup_game_with_cards_and_players):

    game, players, normal_cards, notsofast_cards = setup_game_with_cards_and_players
    player_card_service = PlayerCardService(db_session)
    player = players[1]

    extra_cards = []
    for i in range(6):
        c = Card(
            name=f"Extra Card {i}",
            description="desc extra",
            image_url="img",
            is_murderes_escapes=False
        )
        db_session.add(c)
        extra_cards.append(c)
    db_session.commit()

    for order, c in enumerate(extra_cards, start=1):
        player_card_service.assign_card_to_player(player_id=player.id, card_id=c.id)
        
        gc = GameCard(game_id=game.id, card_id=c.id, card_position=None, card_order=order)
        db_session.add(gc)
        
    db_session.commit()

    with pytest.raises(Exception, match="Player have 6 cards in his hand"):
        result = restock_card(db_session, game.id, player.id, [], 0)


def test_restock_cards_from_draft_success(db_session: Session, setup_game_with_cards_and_players):

    game, players, normal_cards, notsofast_cards = setup_game_with_cards_and_players

    assign_cards(db_session, game.id)
    create_draw_deck(db_session, game.id)
    create_draft_deck(db_session, game.id)

    player = players[0]

    draft_deck = (
        db_session.query(GameCard)
        .filter(
            GameCard.game_id == game.id,
            GameCard.card_position == "mazo_draft"
        )
        .all()
    )

    assert len(draft_deck) > 0, "El mazo de draft debería tener cartas"

    draft_card_ids = [card.card_id for card in draft_deck]

    player_card_service = PlayerCardService(db_session)

    cards_in_hand = player_card_service.get_player_cards(player.id)
    cards_to_discard = [c.id for c in cards_in_hand if "secret" not in c.name.lower()][:2]

    for card_id in cards_to_discard:
        player_card_service.remove_card_from_player(player.id, card_id)

    result = restock_card(db_session, game.id, player.id, draft_card_ids[:2], 0)

    assert len(result["cards_from_draft"]) == 2
    for c in result["cards_from_draft"]:
        assert hasattr(c, "id")
        assert hasattr(c, "name")
        assert hasattr(c, "description")
        assert hasattr(c, "image_url")
        assert hasattr(c, "is_murderes_escapes")


def test_restock_card_from_draft_with_noexistent_game(db_session: Session):

    with pytest.raises(ValueError, match="Game not found"):
        result = restock_card(db_session, 999, 1, [], 0)


def test_restock_card_from_draft_with_noexistent_player(db_session: Session, setup_game_with_cards_and_players):

    game, players, normal_cards, notsofast_cards = setup_game_with_cards_and_players
    
    with pytest.raises(ValueError, match="Player not found in this game"):
        result = restock_card(db_session, game.id, 999, [], 0)

def test_restock_card_from_draft_with_hand_complete(db_session: Session, setup_game_with_cards_and_players):

    game, players, normal_cards, notsofast_cards = setup_game_with_cards_and_players
    player_card_service = PlayerCardService(db_session)
    player = players[1]

    extra_cards = []
    for i in range(6):
        c = Card(
            name=f"Extra Card {i}",
            description="desc extra",
            image_url="img",
            is_murderes_escapes=False
        )
        db_session.add(c)
        extra_cards.append(c)
    db_session.commit()

    for order, c in enumerate(extra_cards, start=1):
        player_card_service.assign_card_to_player(player_id=player.id, card_id=c.id)

        gc = GameCard(game_id=game.id, card_id=c.id, card_position=None, card_order=order)
        db_session.add(gc)
        
    db_session.commit()

    create_draw_deck(db_session, game.id)
    create_draft_deck(db_session, game.id)

    draft_deck = (
        db_session.query(GameCard)
        .filter(
            GameCard.game_id == game.id,
            GameCard.card_position == "mazo_draft"
        )
        .all()
    )

    assert len(draft_deck) > 0, "El mazo de draft debería tener cartas"

    draft_card_ids = [card.card_id for card in draft_deck]
    
    with pytest.raises(Exception, match="Player have 6 cards in his hand"):
        player_response = restock_card(db_session, game.id, player.id, draft_card_ids[:2], 0)