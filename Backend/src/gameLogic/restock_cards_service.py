from typing import Optional
from sqlalchemy.orm import Session
from src.game.models import Game
from src.player.models import Player
from src.gamePlayer.models import PlayerGame
from src.gameCard.models import GameCard
from src.gameCard.services import GameCardService
from src.playerCard.services import PlayerCardService
from src.gameCard.models import CardPosition
from src.game.services import GameService
from src.cards.services import CardService
from src.cards.schemas import CardOut
from src.cards.models import Card
from src.gameLogic.murderer_escapes_service import murderer_escapes_service


def restock_card(db: Session, game_id: int, player_id: int, cards_id: list[int], robo: int) -> dict:

    game: Optional[Game] = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise ValueError("Game not found")

    player_game = db.query(PlayerGame).filter(PlayerGame.game_id == game_id, PlayerGame.player_id == player_id).first()
    if not player_game:
        raise ValueError("Player not found in this game")

    player_card_service = PlayerCardService(db)
    game_card_service = GameCardService(db)
    card_service = CardService(db)

    cards_player = player_card_service.get_player_cards(player_id)
    cards_player_id = [
        card.id for card in cards_player
        if "secret" not in getattr(card, "name", "").lower() and not getattr(card, "is_murderes_escapes", False)
    ]
    amount_restock = 6 - len(cards_player_id)
    if amount_restock <= 0:
        raise Exception("Player have 6 cards in his hand")
    if (len(cards_id) + robo) > amount_restock:
        raise Exception("The requested amount exceeds the allowed amount")

    try:
        draft_cards = restock_from_draft(db, game, player_id, cards_id, player_card_service, game_card_service, card_service)
        draw_cards_result = restock_from_draw(db, game, player_id, robo, player_card_service, game_card_service, card_service)

        if isinstance(draw_cards_result, dict) and draw_cards_result.get("type") == "murderer_escapes":
            db.rollback()
            return draw_cards_result

        pass_turn = False
        turn = len(draft_cards) + len(draw_cards_result)
        if turn == amount_restock:
        	pass_turn = True

        db.commit()

        return {
            "cards_from_draft": draft_cards,
            "cards_from_draw": draw_cards_result,
            "pass_turn": pass_turn
        }
    except Exception as e:
        db.rollback()
        raise e


def restock_from_draw(db: Session, game: Game, player_id: int, robo: int, player_card_service, game_card_service, card_service) -> list | dict:
    cards_receive = []
    for _ in range(robo):
        card = db.query(GameCard).join(Card).filter(
            GameCard.game_id == game.id,
            GameCard.card_position == CardPosition.MAZO_ROBO.value,
            GameCard.card_order == game.draw_top,
            Card.is_murderes_escapes == False
        ).first()

        if not card:
            result = murderer_escapes_service(db, game.id)
            result["type"] = "murderer_escapes"
            return result
        
        player_card_service.assign_card_to_player(player_id, card.card_id)
        game_card_service.update_card_position(game.id, card.card_id, None, card.card_order)
        card_object = card_service.get_by_id(card.card_id)
        cards_receive.append(CardOut(
			id=card_object.id,
			name=card_object.name,
			description=getattr(card_object, "description", ""),
			image_url=card_object.image_url,
			is_murderes_escapes=card_object.is_murderes_escapes
		))
        game.draw_top -= 1
        
    return cards_receive


def restock_from_draft(db: Session, game: Game, player_id: int, cards_id: list[int], player_card_service, game_card_service, card_service) -> list:
    cards_receive = []
    if not cards_id:
        return cards_receive

    for card_id in cards_id:
        card = db.query(GameCard).join(Card).filter(
            GameCard.game_id == game.id,
            GameCard.card_position == CardPosition.MAZO_DRAFT.value,
            GameCard.card_id == card_id,
            Card.is_murderes_escapes == False
        ).first()

        if not card:
            raise ValueError(f"Card with id {card_id} not found in draft")
            
        player_card_service.assign_card_to_player(player_id, card.card_id)
        game_card_service.update_card_position(game.id, card.card_id, None, card.card_order)
        card_object = card_service.get_by_id(card.card_id)
        cards_receive.append(CardOut(
			id=card_object.id,
			name=card_object.name,
			description=getattr(card_object, "description", ""),
			image_url=card_object.image_url,
			is_murderes_escapes=card_object.is_murderes_escapes
		))
        
    return cards_receive