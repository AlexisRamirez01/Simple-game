from sqlalchemy.orm import Session
from src.game.models import Game
from src.gamePlayer.models import PlayerGame

def advance_turn(db: Session, game_id: int) -> int:
    """
    Avanza el turno del juego circularmente y devuelve el player_id del siguiente turno.
    """
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise ValueError(f"Game {game_id} not found")
    
    players = db.query(PlayerGame).filter(PlayerGame.game_id == game_id)\
                .order_by(PlayerGame.position_id_player).all()
    if not players:
        raise ValueError(f"No players found for game {game_id}")
    
    current_index = next((i for i, p in enumerate(players) if p.player_id == game.turn_id_player), None)
    
    next_index = 0 if current_index is None else (current_index + 1) % len(players)
    
    game.turn_id_player = players[next_index].player_id
    db.commit()

    return game.turn_id_player