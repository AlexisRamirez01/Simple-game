import random
from sqlalchemy.orm import Session
from src.game.models import Game
from src.gameCard.models import GameCard
from typing import Optional

def create_draw_deck(db: Session, game_id: int) -> None:
    """
    Crea el mazo de robo de la partida.
    - Incluye todas las cartas que no sean secretas ni estén en manos de jugadores.
    - Ordena aleatoriamente las cartas.
    - Coloca 'murder_escapes' al final del mazo (posición 0).
    - Actualiza draw_top y card_order.
    """

    # Obtener partida
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise Exception("Game not found")

    # Obtener cartas que no estén en manos de jugadores
    gamecards = (
        db.query(GameCard)
        .filter(GameCard.game_id == game_id, GameCard.card_position != None)
        .all()
    )

    # Filtrar solo las cartas que no sean secretas
    non_secret_cards = [
        gc for gc in gamecards
        if "secret" not in getattr(gc.card, "name", "").lower()
    ]

    # Separar murder_escapes
    murder_escapes_card = next(
        (gc for gc in non_secret_cards if getattr(gc.card, "name", "") == "murder_escapes"),
        None
    )
    if not murder_escapes_card:
        raise Exception("No se encontró la carta 'murder_escapes' en el mazo")

    # Remover murder_escapes del mazo y mezclar el resto
    other_cards = [gc for gc in non_secret_cards if gc != murder_escapes_card]
    random.shuffle(other_cards)

    # Insertar murder_escapes al final del mazo (posición 0)
    draw_deck = [murder_escapes_card] + other_cards

    # Asignar orden
    for idx, gc in enumerate(draw_deck):
        gc.card_order = idx
        gc.card_position = "mazo_robo"

    # Actualizar draw_top
    game.draw_top = len(draw_deck) - 1

    db.commit()


def create_draft_deck(db: Session, game_id: int) -> None:

    game: Optional[Game] = db.query(Game).filter(Game.id == game_id).first()

    if not game:
        raise ValueError(f"Game with id {game_id} not found")

    draft_deck = (
        db.query(GameCard)
        .filter(
            GameCard.game_id == game_id, 
            GameCard.card_position == "mazo_robo",
        )
        .order_by(GameCard.card_order.desc())
        .limit(3)
        .all()
    )

    if not draft_deck:
        raise Exception("Don't found cards for draft deck")

    for gc in draft_deck:
        gc.card_position = "mazo_draft"

    game.draw_top = game.draw_top - 3

    db.commit()

    db.refresh(game)
