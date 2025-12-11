"""Defines data transfer objects for games (DTOs)"""
from dataclasses import dataclass

@dataclass
class GameDTO:
	name: str
	max_players: int
	min_players: int
	current_players: int
	is_started: bool
	current_turn: int
	turn_id_player: int # -> Sujeto a cambios por la relacion Game-Player
	draw_top: int
	discard_top: int
	