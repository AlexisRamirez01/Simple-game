# dtos/game_player_dto.py
"""Defines data transfer objects for GamePlayer (DTOs)"""

from dataclasses import dataclass
from typing import Optional

@dataclass
class GamePlayerDTO:
    game_id: int
    player_id: int
    position_id_player: Optional[int] = None
