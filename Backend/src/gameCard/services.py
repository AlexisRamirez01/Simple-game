from sqlalchemy.orm import Session
from sqlalchemy import desc
from src.gameCard.models import GameCard, CardPosition
from src.game.models import Game
from src.cards.models import Card
from typing import List

class GameCardService:
    def __init__(self, db: Session):
        self.db = db

    def get_game_cards(self, game_id: int):
        return self.db.query(GameCard).filter(GameCard.game_id == game_id).all()

    def get_game_card_by_id(self, game_id: int, card_id: int):
        return (
            self.db.query(GameCard)
            .filter(GameCard.game_id == game_id, GameCard.card_id == card_id)
            .first()
        )

    def assign_card_to_game(self, game_id: int, card_id: int, position=None, card_order=0):
        gc = GameCard(game_id=game_id, card_id=card_id, card_position=position, card_order=card_order)
        self.db.add(gc)
        self.db.commit()
        return True

    def update_card_position(self, game_id: int, card_id: int, new_position, new_card_order):
        gc = (
            self.db.query(GameCard)
            .filter(GameCard.game_id == game_id, GameCard.card_id == card_id)
            .first()
        )
        if not gc:
            return False
        gc.card_position = new_position
        gc.card_order = new_card_order
        self.db.commit()
        return True

    def remove_card_from_game(self, game_id: int, card_id: int):
        gc = (
            self.db.query(GameCard)
            .filter(GameCard.game_id == game_id, GameCard.card_id == card_id)
            .first()
        )
        if not gc:
            return False
        self.db.delete(gc)
        self.db.commit()
        return True

    def get_cards_by_deck(self, game_id: int, deck: str):
        return (
            self.db.query(GameCard)
            .filter(GameCard.game_id == game_id, GameCard.card_position == deck)
            .all()
            )

    def get_top_5_discard_deck_cards(self, game_id: int) -> List[Card]:
        cards = (
            self.db.query(Card) 
            .join(GameCard, GameCard.card_id == Card.id)
            .filter(
                GameCard.game_id == game_id,
                GameCard.card_position == CardPosition.MAZO_DESCARTE
            )
            .order_by(GameCard.card_order.desc())
            .limit(5)
            .all()
        )
        
        return cards

    def get_top_1_discard_deck_card(self, game_id: int) -> GameCard:
        game_card = (
            self.db.query(GameCard) 
            .filter(
                GameCard.game_id == game_id,
                GameCard.card_position == CardPosition.MAZO_DESCARTE
            )
            .order_by(GameCard.card_order.desc())
            .limit(1)
            .first()
        )
            
        return game_card
