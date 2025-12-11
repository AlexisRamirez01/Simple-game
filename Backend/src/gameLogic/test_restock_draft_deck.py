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
from src.gameLogic.restock_cards_service import restock_card
from src.gameLogic.create_draw_deck_service import create_draw_deck, create_draft_deck
from src.gameLogic.restock_draft_deck import restock_draft_deck


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

	# Crear cartas normales (12)
	normal_cards = []
	for i in range(18):
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

	# Crear carta Murderer escape
	murder_card = Card(
		name="murder_escapes",
		description="desc",
		image_url="img",
		is_murderes_escapes=True,
	)
	db_session.add(murder_card)
	db_session.commit()

	# Registrar todas las cartas en GameCard (sin is_revealed)
	for c in normal_cards + notsofast_cards + [murder_card]:
		gc = GameCard(game_id=game.id, card_id=c.id, card_position="mazo_robo", card_order=0)
		db_session.add(gc)
	db_session.commit()

	return game, [p1, p2], normal_cards, notsofast_cards



def test_restock_draft_deck_after_player_takes_cards(db_session: Session, setup_game_with_cards_and_players):
	"""
	Test para comprobar que el mazo de draft se repone correctamente
	luego de que un jugador tome cartas del draft.
	"""
	game, players, normal_cards, notsofast_cards = setup_game_with_cards_and_players

	assign_cards(db_session, game.id)
	create_draw_deck(db_session, game.id)
	create_draft_deck(db_session, game.id)
	player = players[1]

	draft_cards_before = (
		db_session.query(GameCard)
		.filter(GameCard.game_id == game.id, GameCard.card_position == "mazo_draft")
		.all()
	)
	assert len(draft_cards_before) == 3	
	draft_card_ids = [gc.card_id for gc in draft_cards_before]
	player_card_service = PlayerCardService(db_session)

	cards_in_hand = player_card_service.get_player_cards(player.id)
	cards_to_discard = [c.id for c in cards_in_hand[:2]]

	for card_id in cards_to_discard:
		player_card_service.remove_card_from_player(player.id, card_id)
	result_take = restock_card(db_session, game.id, player.id, draft_card_ids[:2], 0)

	assert len(result_take["cards_from_draft"]) == 2

	draft_after_take = (
		db_session.query(GameCard)
		.filter(GameCard.game_id == game.id, GameCard.card_position == "mazo_draft")
		.all()
	)
	assert len(draft_after_take) == 1
	
	result_restock = restock_draft_deck(db_session, game.id)

	assert "new_cards_to_draft" in result_restock
	new_cards = result_restock["new_cards_to_draft"]

	draft_after_restock = (
		db_session.query(GameCard)
		.filter(GameCard.game_id == game.id, GameCard.card_position == "mazo_draft")
		.all()
	)
	assert len(draft_after_restock) == 3

	assert len(new_cards) == 3

	for c in new_cards:
		db_card = db_session.query(Card).filter(Card.id == c.id).first()
		assert db_card is not None

def test_restock_draft_deck_when_full_raises_exception(db_session: Session, setup_game_with_cards_and_players):
	game, players, normal_cards, notsofast_cards = setup_game_with_cards_and_players

	assign_cards(db_session, game.id)
	create_draw_deck(db_session, game.id)
	create_draft_deck(db_session, game.id)

	result = restock_draft_deck(db_session, game.id)

	assert result == "The draft deck have 3 cards"