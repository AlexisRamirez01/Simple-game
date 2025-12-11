from typing import List, Optional

from src.game.dtos import GameDTO
from src.game.models import Game

class GameService:
	def __init__(self, db):
		self._db = db
		

	def get_all(
		self,
		name: Optional[str] = None,
		max_players: Optional[int] = None,
		min_players: Optional[int] = None,
		current_players: Optional[int] = None,
		is_started: Optional[bool] = None,
		current_turn: Optional[int] = None,
		turn_id_player: Optional[int] = None,
		draw_top: Optional[int] = None,
		discard_top: Optional[int] = None,
	) -> List[Game]:
		query = self._db.query(Game)
		if name is not None:
			query = query.filter(Game.name==name)
		if max_players is not None:
			query = query.filter(Game.max_players == max_players)
		if min_players is not None:
			query = query.filter(
			Game.min_players == min_players)
		if current_players is not None:
			query = query.filter(
			Game.current_players == current_players)
		if is_started is not None:
			query = query.filter(Game.is_started == is_started)
		if current_turn is not None:
			query = query.filter(
			Game.current_turn == current_turn)
		if turn_id_player is not None:
			query = query.filter(
			Game.turn_id_player == turn_id_player)
		if draw_top is not None:
			query = query.filter(
			Game.draw_top == draw_top)
		if discard_top is not None:
			query = query.filter(
			Game.discard_top == discard_top)
		return query.all()

	def get_by_id(self, id: int) -> Optional[Game]:
		return self._db.query(Game).filter(Game.id == id).first()

	
	def create(self, game_dto: GameDTO) -> Game:
		# Validaciones
		if game_dto.name == "":
			raise ValueError("The game name cannot be empty")
		if game_dto.max_players < game_dto.min_players:
			raise ValueError("Maximum players cannot be less than minimum players")
		if game_dto.max_players > 6:
			raise ValueError("Maximum players cannot be more than 6")
		if game_dto.min_players < 2:
			raise ValueError("Minimum players cannot be less than 2")
		
    
		new_game = Game(
			name=game_dto.name,
			max_players=game_dto.max_players,
			min_players=game_dto.min_players,
			current_players=game_dto.current_players,
			is_started=game_dto.is_started,
			current_turn=game_dto.current_turn,
			turn_id_player=game_dto.turn_id_player,
			draw_top=game_dto.draw_top,
			discard_top=game_dto.discard_top,
		)
		self._db.add(new_game)
		self._db.flush()
		self._db.commit()
		return new_game


	def update(self, id: int, game_dto: GameDTO) -> Game:
		if game_dto.current_players <= 0:
			raise Exception("The game cannot exist without players")
		if game_dto.current_players > game_dto.max_players:
			raise Exception("Current players cannot exceed maximum players")
		
		db_game = self.get_by_id(id)
		if not db_game:
			raise ValueError(f"Game with id {id} does not exist")

		db_game.current_players = game_dto.current_players
		db_game.is_started = game_dto.is_started
		db_game.current_turn = game_dto.current_turn
		db_game.turn_id_player = game_dto.turn_id_player
		db_game.draw_top = game_dto.draw_top
		db_game.discard_top = game_dto.discard_top
		self._db.flush()
		self._db.commit()
		return db_game

	def delete(self, id: int) -> int:
		db_game = self.get_by_id(id)
		if not db_game:
			raise ValueError(f"Game with id {id} does not exist")
		self._db.delete(db_game)
		self._db.flush()
		self._db.commit()
		return id
