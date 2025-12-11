from src.gameCard.models import GameCard
from typing import Optional
from sqlalchemy.orm import Session
from src.cards.models import Card
from src.game.models import Game
from src.cards.schemas import CardOut
from src.gameCard.models import CardPosition
from src.gameCard.services import GameCardService
from src.cards.services import CardService
from src.gameLogic.murderer_escapes_service import murderer_escapes_service


def restock_draft_deck(db: Session, game_id: int) -> dict:

	game: Optional[Game] = db.query(Game).filter(Game.id == game_id).first()
	if not game:
		raise ValueError(f"Game with {game_id} is not found")

	game_card_service = GameCardService(db)
	card_service = CardService(db)

	draft_cards = game_card_service.get_cards_by_deck(game_id, CardPosition.MAZO_DRAFT.value)

	amount_restock = abs(3-len(draft_cards))

	if amount_restock == 0:
		return "The draft deck have 3 cards"

	cards_restocked = []

	for _ in range(amount_restock):
		card = (
			db.query(GameCard)
			.join(Card)
			.filter(
				GameCard.game_id == game_id,
				GameCard.card_position == CardPosition.MAZO_ROBO.value,
				GameCard.card_order == game.draw_top,
				Card.is_murderes_escapes == False
			)
			.first()
		)
		
		if not card:
			result = murderer_escapes_service(db, game_id)
			result["type"] = "murderer_escapes"
			return result

		game_card_service.update_card_position(game_id, card.card_id, CardPosition.MAZO_DRAFT.value, card.card_order)

		card_object = card_service.get_by_id(card.card_id)
		if not card_object:
			raise ValueError(f"Card id={card_object.card_id} not found in database")

		if card_object.is_murderes_escapes == True:
			result = murderer_escapes_service(db, game_id)
			result["type"] = "murderer_escapes"
			return result

		game.draw_top -= 1

	db.commit()

	final_draft_cards_instances = game_card_service.get_cards_by_deck(game_id, CardPosition.MAZO_DRAFT.value)

	final_draft_cards_out = []
	for game_card in final_draft_cards_instances:
		card_details = card_service.get_by_id(game_card.card_id)
		
		if card_details:
			final_draft_cards_out.append(
				CardOut(
					id=card_details.id,
					name=card_details.name,
					description=getattr(card_details, "description", ""),
					image_url=card_details.image_url,
					is_murderes_escapes=card_details.is_murderes_escapes
				)
			)
	return {
		"game_id": game_id,
		"new_cards_to_draft": final_draft_cards_out
	}