from dataclasses import dataclass

@dataclass
class GameCardDTO:
    game_id: int
    card_id: int
    card_position: str
    card_order: int
