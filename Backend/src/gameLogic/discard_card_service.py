import random
from sqlalchemy.orm import Session
from src.gameCard.models import GameCard, CardPosition
from src.cards.models import Card
from src.game.models import Game
from src.playerCard.models import player_card_table
from src.player.models import Player

def discard_card(db: Session, game_id: int, player_id: int, card_id: int):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise ValueError("Game not found")
    
    updated_top = game.discard_top + 1
    db.query(Game).filter(Game.id == game_id).update({"discard_top": updated_top})
    
    gamecard = db.query(GameCard).filter(GameCard.game_id == game_id, GameCard.card_id == card_id).first()
    if not gamecard:
        raise ValueError("Relation between game and card doesn't exist")

    db.query(GameCard).filter(GameCard.game_id == game_id, GameCard.card_id == card_id).update({"card_position": CardPosition.MAZO_DESCARTE, "card_order": updated_top})
    
    player = db.query(Player).filter_by(id=player_id).first()
    if not player:
        raise ValueError("Jugador no encontrado")

    # Buscar la carta en la mano del jugador
    card_to_discard = next((c for c in player.cards if c.id == card_id), None)
    if not card_to_discard:
        raise ValueError("Carta no encontrada en la mano del jugador")

    # Si es carta secreta, lanzar error
    if card_to_discard.name.startswith("secret_"):
        raise Exception("Cannot discard a secret card")

    # Eliminar la relación (descarte)
    player.cards.remove(card_to_discard)
    db.commit()
    
    return{
        "player_id":player_id,
        "card_id": card_id,
        "card_discard": card_to_discard,
    }
    
    
def discard_random_card(db: Session, player_id: int, game_id: int) -> int:
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise ValueError("Player not found")

    discardable_cards = [
        card for card in player.cards
        if not card.name.startswith("secret_")
    ]
    if not discardable_cards:
        raise ValueError("No discardable cards in player's hand")

    card_to_discard = random.choice(discardable_cards)

    result = discard_card(db, game_id, player_id, card_to_discard.id)

    return result
    
    
    