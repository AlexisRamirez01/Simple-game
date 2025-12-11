"""Game Schemas"""

from pydantic import BaseModel
from src.game.dtos import GameDTO

class GameIn(BaseModel):
	"""
	Schema for representing a inbound game
	"""

	name: str
	max_players: int
	min_players: int
	current_players: int
	is_started: bool
	current_turn: int
	turn_id_player: int
	draw_top: int = 0
	discard_top: int = 0

	# Method to transform data in DB to DTO
	def to_dto(self) -> GameDTO:
		return GameDTO(
			name=self.name,
			max_players=self.max_players,
			min_players=self.min_players,
			current_players=self.current_players,
			is_started=self.is_started,
			current_turn=self.current_turn,
			turn_id_player=self.turn_id_player,
			draw_top=self.draw_top,
			discard_top=self.discard_top,
		)

class GameResponse(BaseModel):
	"""
	Class for retrieving Game creation response
	"""
	id: int

class GameOut(BaseModel):
	"""
	Schema for representing a game
	"""

	id: int
	name: str
	max_players: int
	min_players: int
	current_players: int
	is_started: bool
	current_turn: int
	turn_id_player: int
	draw_top: int
	discard_top: int
	

class WSAddMessage(BaseModel):
	type: str = "gameAdd"
	payload: GameOut


class WSUpdateMessage(BaseModel):
	type: str = "gameUpdate"
	payload: GameOut


class WSUpdateStartMessage(BaseModel):
	type: str = "gameStartGame"
	payload: int

class WSRemoveMessage(BaseModel):
	type: str = "gameRemove"
	payload: int