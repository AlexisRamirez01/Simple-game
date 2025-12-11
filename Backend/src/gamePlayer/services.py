from typing import List
from sqlalchemy.orm import Session

from src.gamePlayer.models import PlayerGame
from src.player.models import Player
from src.game.models import Game
from src.gamePlayer.dtos import GamePlayerDTO
from src.game.services import GameService

class GamePlayerService:
    def __init__(self, db: Session):
        self._db = db

    def join_game(self, dto: GamePlayerDTO) -> PlayerGame:
        # Verifico que exista el jugador
        player = self._db.query(Player).filter(Player.id == dto.player_id).first()
        if not player:
            raise ValueError(f"Player {dto.player_id} not found")

        # Verifico que exista el juego
        game = self._db.query(Game).filter(Game.id == dto.game_id).first()
        if not game:
            raise ValueError(f"Game {dto.game_id} not found")

        # Verifico que el jugador no esté ya en un juego
        existing = self._db.query(PlayerGame).filter(PlayerGame.player_id == dto.player_id).first()
        if existing:
            raise ValueError(f"Player {dto.player_id} is already in a game")

        # Creo el PlayerGame
        player_game = PlayerGame(
        player_id=dto.player_id,
        game_id=dto.game_id,
        position_id_player=dto.position_id_player  # puede ser None
        )
        self._db.add(player_game)
        self._db.commit()
        self._db.refresh(player_game)

        return player_game

    def get_players_in_game(self, game_id: int) -> List[PlayerGame]:
        players_in_game = self._db.query(PlayerGame).filter(PlayerGame.game_id == game_id).all()
        if not players_in_game:
            raise ValueError(f"No players found for game {game_id}")
        return players_in_game

    def delete_game_player(self, game_id: int, player_id: int) -> int: 
        game = GameService(self._db).get_by_id(game_id)

        if game.is_started:
            raise Exception("Game is started")

        player_game = (
            self._db.query(PlayerGame)
            .filter(PlayerGame.game_id == game_id, PlayerGame.player_id == player_id)
            .first()
        )

        if not player_game:
            raise ValueError("Player Not Found")

        self._db.delete(player_game)
        self._db.commit()

        return player_id


