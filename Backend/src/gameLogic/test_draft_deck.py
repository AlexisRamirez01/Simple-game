""" Test for the new logic of draft deck """

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
from src.gameLogic.create_draw_deck_service import create_draw_deck, create_draft_deck

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


def test_create_draft_deck_success(db_session: Session, setup_game_with_cards_and_players):
	"""
	Test para comprobar la creación del draft deck
	"""
	game, players, normal_cards, notsofast_cards = setup_game_with_cards_and_players

	assign_cards(db_session, game.id)
	create_draw_deck(db_session, game.id)
	create_draft_deck(db_session, game.id)

	db_session.refresh(game)

	draft_cards = (
		db_session.query(GameCard)
		.filter(
			GameCard.game_id == game.id,
			GameCard.card_position == "mazo_draft"
		)
		.all()
	)

	assert len(draft_cards) == 3

	cards_hand = (
		db_session.query(GameCard)
		.filter(
			GameCard.game_id == game.id,
			GameCard.card_position == None
		)
		.all()
	)

	for gc in cards_hand:
		assert gc not in draft_cards

def test_create_draft_deck_with_nonexist_game(db_session: Session):
	"""
	Verificación de si el juego existe o no
	"""
	with pytest.raises(Exception):
		create_draw_deck(db_session, game_id=9999)

