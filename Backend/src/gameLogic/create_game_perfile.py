import random
from sqlalchemy.orm import Session

from src.cards.services import CardService
from src.gameCard.services import GameCardService
from src.cards.dtos import CardDTO, SecretCardDTO, DetectiveCardDTO, EventCardDTO
from src.cards.servicesSecretCard import SecretCardService
from src.cards.servicesDetectiveCard import DetectiveCardService
from src.cards.servicesEventCard import EventCardService
from src.gameLogic.cards_data import expanded_cards
from src.gameCard.models import CardPosition





cantidades = {
    "detective_quin": 0,
    "detective_oliver": 0,
    "detective_marple": 3,
    "detective_pyne": 2,
    "detective_tommyberesford": 2,
    "detective_brent": 2,
    "detective_tuppenceberesford": 2,
    "detective_poirot": 3,
    "detective_satterthwaite": 2
}

def initialize_game_cards(db, game_id: int):
    card_service = CardService(db)
    secret_card_service = SecretCardService(db)
    game_card_service = GameCardService(db)
    detective_card_service = DetectiveCardService(db)
    event_card_service = EventCardService(db)

    existing_cards = game_card_service.get_game_cards(game_id)
    if existing_cards and len(existing_cards) > 0:
        print(f"El juego {game_id} ya tiene {len(existing_cards)} cartas asignadas. No se inicializa nuevamente.")
        return
    
    for card in expanded_cards:
        
        if "is_murderer" in card  or "is_accomplice" in card:

            new_card = secret_card_service.create(
                card_dto=SecretCardDTO(
                    name=card["name"],
                    description=card["description"],
                    image_url=card["image_url"],
                    is_murderes_escapes=card["is_murderes_escapes"],
                    is_murderer=card.get("is_murderer", False),
                    is_accomplice=card.get("is_accomplice", False),
                    is_revealed=False
                )
            )
            game_card_service.assign_card_to_game(game_id, new_card.id)

        elif card["name"].startswith("detective_"):
            new_card = detective_card_service.create(
                card_dto=DetectiveCardDTO(
                    name=card["name"],
                    description=card["description"],
                    image_url=card["image_url"],
                    is_murderes_escapes=card.get("is_murderes_escapes", False),
                    requiredAmount=cantidades.get(card["name"])
                )
            )
            game_card_service.assign_card_to_game(game_id, new_card.id, CardPosition.MAZO_ROBO.value)

        elif card["name"].startswith("event_") or card["name"].startswith("devious_") or card["name"].startswith("Instant"):
            is_cancellable = not (
                card["name"].startswith("devious_") or card["name"] == "event_cardsonthetable"
            )
            new_card = event_card_service.create(
                card_dto=EventCardDTO(
                    name=card["name"],
                    description=card["description"],
                    image_url=card["image_url"],
                    is_murderes_escapes=card.get("is_murderes_escapes", False),
                    was_played = False,
                    was_traded = False,
                    is_cancellable = is_cancellable
                )
            )
            game_card_service.assign_card_to_game(game_id, new_card.id, CardPosition.MAZO_ROBO.value)

        else:

            new_card = card_service.create(
                card_dto= CardDTO(
                    name=card["name"],
                    description=card["description"],
                    image_url=card["image_url"],
                    is_murderes_escapes=card["is_murderes_escapes"]
                )
            )
            game_card_service.assign_card_to_game(game_id, new_card.id, CardPosition.MAZO_ROBO.value)
