"""Player Schemas."""
from src.player.enums import RolEnum

from datetime import date

from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl, ConfigDict

from src.player.dtos import PlayerDTO

class PlayerIn(BaseModel):
    """
    Schema for representing a inbound player
    """

    name: str = Field(..., min_length=1, max_length=50, description="El nombre es requerido")
    birthdate: date = Field(..., description="Player birthdate")
    avatar: HttpUrl = Field(..., description="Debe ser una URL válida")
    is_Social_Disgrace: bool = Field(..., description="Debe ser True o False")
    is_Your_Turn: bool = Field(..., description="Debe ser True o False")
    is_Owner: bool = Field(..., description="Debe ser True o False")
    rol: RolEnum = Field(default=RolEnum.innocent, description="Rol del jugador")

    def to_dto(self) -> PlayerDTO:
        return PlayerDTO(
            name=self.name,
            birthdate=self.birthdate,
            avatar=str(self.avatar),
            is_Social_Disgrace=self.is_Social_Disgrace,
            is_Your_Turn=self.is_Your_Turn,
            is_Owner=self.is_Owner,
            rol=self.rol,
        )


class PlayerResponse(BaseModel):
    """Class for retriving Player creation response."""

    id: int
    message: str


class PlayerOut(BaseModel):
    """
    Schema for representing a player
    """

    id: int
    name: str
    avatar: str
    birthdate: date
    is_Social_Disgrace: bool
    is_Your_Turn: bool
    is_Owner: bool
    rol: RolEnum
    
    model_config = ConfigDict(from_attributes=True)

class WSAddMessage(BaseModel):
    type: str = "playerAdd"
    payload: PlayerOut

class WSUpdateMessage(BaseModel):
    type: str = "playerUpdate"
    payload: PlayerOut

class WSRemoveMessage(BaseModel):
    type: str = "playerDelete"
    payload: int

class ReveledMurdererPayload(BaseModel):
    murderer: PlayerOut
    accomplice: Optional[PlayerOut] = None

class WSReveledMurderer(BaseModel):
    type: str = "murdererReveled"
    payload: ReveledMurdererPayload