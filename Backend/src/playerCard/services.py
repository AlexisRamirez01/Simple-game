from sqlalchemy.orm import Session
from src.playerCard.models import player_card_table
from src.player.models import Player
from src.cards.models import Card
from src.gameCard.models import GameCard

class PlayerCardService:
    def __init__(self, db: Session):
        self.db = db

    def get_player_cards(self, player_id: int) -> list[Card] | None:

        player = self.db.query(Player).filter(Player.id == player_id).first()
        if not player:
            raise ValueError(f"Jugador con id {player_id} no encontrado")
        all_player_cards = player.cards
        cards_in_hand = []
        for card in all_player_cards:
            game_card_entry = self.db.query(GameCard).filter(
                GameCard.card_id == card.id,
                GameCard.card_position == None
            ).first()

            if game_card_entry:
                cards_in_hand.append(card)
        return cards_in_hand

    def assign_card_to_player(self, player_id: int, card_id: int):
        player = self.db.query(Player).filter(Player.id == player_id).first()
        card = self.db.query(Card).filter(Card.id == card_id).first()
        if not player or not card:
            return False
        if card not in player.cards:
            player.cards.append(card)
            self.db.commit()
        return True

    def remove_card_from_player(self, player_id: int, card_id: int):
        player = self.db.query(Player).filter(Player.id == player_id).first()
        card = self.db.query(Card).filter(Card.id == card_id).first()
        if not player or not card:
            return False
        if card in player.cards:
            player.cards.remove(card)
            self.db.commit()
        return True
    
    def is_card_assigned_to_player(self, player_id: int, card_id: int) -> bool:
        player = self.db.query(Player).filter(Player.id == player_id).first()
        card = self.db.query(Card).filter(Card.id == card_id).first()
        if not player or not card:
            return False
        return card in player.cards
