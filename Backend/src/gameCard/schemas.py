from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from src.gameCard.models import CardPosition
from src.gameCard.dtos import GameCardDTO


class GameCardIn(BaseModel):

    game_id: int = Field(..., description="El id del game es requerido")
    card_id: int = Field(..., description="El id de la card es requerido")
    card_position: Optional[CardPosition] = Field(default=None, description="Posición de la carta (puede ser null)")
    card_order: int = Field(default = 0, description="Posición dentro del mazo (si no pertenece a ninguno se ignora)")

    def to_dto(self) -> GameCardDTO:
        return GameCardDTO(
            game_id=self.game_id,
            card_id=self.card_id,
            card_position=self.card_position,
            card_order=self.card_order,
        )


class GameCardResponse(BaseModel):
    """Class for retriving Player creation response."""

    id: int
    message: str


class GameCardOut(BaseModel):
    """
    Schema for representing a player
    """
    game_id: int
    card_id: int
    card_position: Optional[CardPosition] = None
    card_order: Optional[int] = 0

class GameCardUpdate(BaseModel):
    card_position: Optional[CardPosition] = None
    card_order: Optional[int] = 0


class WSAddMessage(BaseModel):
    type: str = "gameCardAdd"
    payload: GameCardOut

class WSRemoveMessage(BaseModel):
    type: str = "gameCardRemoved"
    payload: GameCardOut