from sqlalchemy.orm import Session
from src.game.models import Game
from src.player.models import Player
from src.gamePlayer.models import PlayerGame
from src.gameCard.models import GameCard

def murderer_escapes_service(db: Session, game_id: int):
    """
    Detecta la victoria del asesino y elimina la partida junto a todas sus relaciones.

    Args:
        db (Session): Sesión activa de la base de datos.
        game_id (int): ID de la partida.

    Returns:
        dict: Información del asesino y el cómplice antes de eliminar la partida.
    """
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise ValueError(f"Game with id {game_id} not found")

    game_players = (
        db.query(PlayerGame)
        .filter(PlayerGame.game_id == game_id)
        .all()
    )

    player_ids = [gp.player_id for gp in game_players]
    players = db.query(Player).filter(Player.id.in_(player_ids)).all()

    murderer = next((p for p in players if p.rol == "murderer"), None)
    accomplice = next((p for p in players if p.rol == "accomplice"), None)

    result = {
        "game_id": game.id,
        "murderer": murderer if murderer else None,
        "accomplice": accomplice if accomplice else None,
    }

    db.query(GameCard).filter(GameCard.game_id == game_id).delete()
    db.query(PlayerGame).filter(PlayerGame.game_id == game_id).delete()
    db.delete(game)
    db.commit()

    return result