import random
from sqlalchemy.orm import Session
from sqlalchemy import insert

from src.game.models import Game
from src.gamePlayer.models import PlayerGame
from src.gameCard.models import GameCard
from src.playerCard.models import player_card_table
from src.player.models import Player, RolEnum


class NotEnoughSecretCards(Exception):
    pass

def assign_secrets(db: Session, game_id: int) -> None:
    """
    Asigna cartas secretas a cada jugador en la partida.
    - Cada jugador recibe 3 cartas secretas.
    - 1 jugador recibe 'secret_murderer' y su rol pasa a RolEnum.murderer.
    - Si hay >=5 jugadores, 1 jugador distinto recibe 'secret_accomplice' y su rol pasa a RolEnum.accomplice.
    - El resto reciben solo 'secret_back'.
    - Ningún jugador puede ser a la vez asesino y cómplice.
    """

    # Validar existencia de la partida
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise Exception("Game not found")

    # Obtener jugadores en la partida
    player_games = (
        db.query(PlayerGame)
        .filter(PlayerGame.game_id == game_id)
        .order_by(PlayerGame.player_id.asc())
        .all()
    )
    if not player_games:
        raise Exception("No players in game")

    player_ids = [pg.player_id for pg in player_games]

    # Obtener cartas secretas
    gamecard_rows = db.query(GameCard).filter(GameCard.game_id == game_id).all()

    murderer_cards = [gc.card_id for gc in gamecard_rows if gc.card.name == "secret_murderer"]
    accomplice_cards = [gc.card_id for gc in gamecard_rows if gc.card.name == "secret_accomplice"]
    back_cards = [gc.card_id for gc in gamecard_rows if gc.card.name == "secret_back"]

    # Validaciones
    if not murderer_cards:
        raise NotEnoughSecretCards("Debe haber al menos 1 carta 'secret_murderer'")
    if len(player_ids) >= 5 and not accomplice_cards:
        raise NotEnoughSecretCards("Debe haber al menos 1 carta 'secret_accomplice' para partidas de 5+ jugadores")

    total_needed = len(player_ids) * 3
    if len(murderer_cards) + len(accomplice_cards) + len(back_cards) < total_needed:
        raise NotEnoughSecretCards("No hay suficientes cartas secretas para repartir")

    random.shuffle(player_ids)

    # Seleccionar asesino
    murderer_player = player_ids[0]
    murderer_card_id = murderer_cards.pop()
    db.query(Player).filter(Player.id == murderer_player).update({"rol": RolEnum.murderer})

    # Seleccionar cómplice si corresponde
    accomplice_player = None
    accomplice_card_id = None
    if len(player_ids) >= 5:
        accomplice_player = random.choice([pid for pid in player_ids if pid != murderer_player])
        accomplice_card_id = accomplice_cards.pop()
        db.query(Player).filter(Player.id == accomplice_player).update({"rol": RolEnum.accomplice})

    # Repartir cartas
    for pid in player_ids:
        hand = []
        if pid == murderer_player:
            hand.append(murderer_card_id)
            hand.extend([back_cards.pop() for _ in range(2)])
        elif pid == accomplice_player:
            hand.append(accomplice_card_id)
            hand.extend([back_cards.pop() for _ in range(2)])
        else:
            hand.extend([back_cards.pop() for _ in range(3)])

        # Insertar en player_card_table y actualizar GameCard
        for cid in hand:
            stmt = insert(player_card_table).values(player_id=pid, card_id=cid)
            db.execute(stmt)

            gc = (
                db.query(GameCard)
                .filter(GameCard.game_id == game_id, GameCard.card_id == cid)
                .first()
            )
            if gc:
                gc.card_position = None

    db.commit()
