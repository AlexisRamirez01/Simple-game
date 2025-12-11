import pytest
from sqlalchemy.orm import Session
from src.cards.models import Card
from src.game.models import Game
from src.gameCard.models import GameCard, CardPosition
from src.gameLogic.create_game_perfile import initialize_game_cards
from src.cards.services import CardService
from src.cards.servicesSecretCard import SecretCardService
from src.cards.servicesDetectiveCard import DetectiveCardService
from src.cards.models import SecretCard, DetectiveCard
from src.gameCard.services import GameCardService
from src.gameLogic.cards_data import expanded_cards


@pytest.mark.parametrize("game_name", ["Test Game 1", "Test Game 2"])
def test_initialize_game_cards_creates_cards(db_session, game_name):
    # Crear un juego vacío
    game = Game(name=game_name)
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

    # Inicializar cartas en el juego
    initialize_game_cards(db_session, game.id)

    # Instanciar servicios
    card_service = CardService(db_session)
    secret_service = SecretCardService(db_session)
    game_card_service = GameCardService(db_session)

    # Obtener todas las cartas
    game_cards = game_card_service.get_game_cards(game.id)

    # Verificar que se crearon todas las cartas
    assert len(game_cards) == len(expanded_cards)

    for card in game_cards:
        assert card.card_position == None or  card.card_position == CardPosition.MAZO_ROBO.value

def test_initialize_game_cards_does_not_duplicate(db_session):
    # Crear un juego vacío
    game = Game(name="Juego Con Cartas Previas")
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

    game_card_service = GameCardService(db_session)

    # Inicializar cartas por primera vez
    initialize_game_cards(db_session, game.id)
    game_cards_first = game_card_service.get_game_cards(game.id)
    total_first = len(game_cards_first)

    # Intentar inicializar de nuevo
    initialize_game_cards(db_session, game.id)
    game_cards_second = game_card_service.get_game_cards(game.id)
    total_second = len(game_cards_second)

    # Verificar que no se hayan creado cartas adicionales
    assert total_first == total_second, (
        f"Se esperaban {total_first} cartas, pero hay {total_second} después de reinicializar."
    )


@pytest.mark.parametrize("game_name", ["Test Game 1", "Test Game 2"])
def test_initialize_creates_all_card_types_correctly(db_session, game_name):
    
    game = Game(name=game_name)
    db_session.add(game)
    db_session.commit()
    db_session.refresh(game)

    initialize_game_cards(db_session, game.id)

    expected_secrets = sum(1 for c in expanded_cards if "is_murderer" in c or "is_accomplice" in c)
    expected_detectives = sum(1 for c in expanded_cards if c["name"].startswith("detective_"))
    expected_normal = len(expanded_cards) - expected_secrets - expected_detectives

    actual_secrets = db_session.query(SecretCard).join(GameCard).filter(GameCard.game_id == game.id).count()
    actual_detectives = db_session.query(DetectiveCard).join(GameCard).filter(GameCard.game_id == game.id).count()
    secret_ids_sq = db_session.query(SecretCard.id).subquery()
    detective_ids_sq = db_session.query(DetectiveCard.id).subquery()
    actual_normal = db_session.query(Card).filter(
        Card.id.notin_(db_session.query(secret_ids_sq)),
        Card.id.notin_(db_session.query(detective_ids_sq))
    ).join(GameCard).filter(GameCard.game_id == game.id).count()

    assert actual_secrets == expected_secrets
    assert actual_detectives == expected_detectives
    assert actual_normal == expected_normal



