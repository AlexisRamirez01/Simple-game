import random
from sqlalchemy.orm import Session
from sqlalchemy import insert
from datetime import date

from src.game.models import Game
from src.gamePlayer.models import PlayerGame
from src.gameCard.models import GameCard
from src.playerCard.models import player_card_table


class NotEnoughCards(Exception):
    pass


def assign_cards(db: Session, game_id: int) -> None:
    """
    Reparte cartas a cada jugador de la partida `game_id`.
    - Cada jugador recibe 5 cartas normales + 1 carta "Instant_notsofast".
    - Ordena jugadores por player_id.
    - Mezcla mazos antes de repartir.
    - Inserta filas en player_card_table.
    - Marca GameCard.card_position = None para cartas repartidas.
    - Hace commit.
    """

    # Validar existencia de la partida
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise Exception("Game not found")

    # Obtener jugadores ordenados por player_id
    player_games = (
        db.query(PlayerGame)
        .filter(PlayerGame.game_id == game_id)
        .order_by(PlayerGame.player_id.asc())
        .all()
    )
    if not player_games:
        raise Exception("No players in game")

    player_ids = [pg.player_id for pg in player_games]

    # Obtener cartas de GameCard
    gamecard_rows = (
        db.query(GameCard)
        .filter(GameCard.game_id == game_id)
        .all()
    )

    # Filtrar cartas que no sean "Instant_notsofast" y que no sean secretos
    deck_card_ids = [
        gc.card_id
        for gc in gamecard_rows
        if "secret" not in getattr(gc.card, "name", "").lower()
            and getattr(gc.card, "name", "") != "Instant_notsofast"
            and getattr(gc.card, "name", "") != "murder_escapes"
    ]

    # Mazo "NotSoFast"
    notsofast_cards = [
        gc.card_id
        for gc in gamecard_rows
        if getattr(gc.card, "name", "") == "Instant_notsofast"
    ]

    cards_per_player = 5  # normales
    needed = len(player_ids) * cards_per_player
    if len(deck_card_ids) < needed:
        raise NotEnoughCards(f"Se necesitan {needed} cartas normales pero el mazo tiene {len(deck_card_ids)}")

    if len(notsofast_cards) < len(player_ids):
        raise NotEnoughCards(f"No hay suficientes cartas NotSoFast para cada jugador")

    # Mezclar mazos
    random.shuffle(deck_card_ids)

    card_index = 0

    for idx, pid in enumerate(player_ids):
        # Tomar 5 cartas normales
        hand = deck_card_ids[card_index:card_index + cards_per_player]
        card_index += cards_per_player

        # Agregar 1 carta NotSoFast
        hand.append(notsofast_cards[idx])

        # Insertar cartas y actualizar GameCard
        for cid in hand:
            stmt = insert(player_card_table).values(
                player_id=pid,
                card_id=cid,
            )
            db.execute(stmt)

            gc = (
                db.query(GameCard)
                .filter(GameCard.game_id == game_id, GameCard.card_id == cid)
                .first()
            )
            if gc:
                gc.card_position = None

    db.commit()
