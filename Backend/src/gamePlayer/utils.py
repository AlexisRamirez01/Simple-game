from src.gamePlayer.models import PlayerGame
from src.gamePlayer.schemas import GamePlayerOut

def db_game_player_2_out(db_relation: PlayerGame) -> GamePlayerOut:
    return GamePlayerOut(
        id=db_relation.id,
        game_id=db_relation.game_id,
        player_id=db_relation.player_id,
        position_id_player=db_relation.position_id_player 
    )
