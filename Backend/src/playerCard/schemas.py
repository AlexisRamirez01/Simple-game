from pydantic import BaseModel, ConfigDict
from typing import List

class CardDTO(BaseModel):
    id: int
    name: str
    description: str
    image_url: str
    is_murderes_escapes: bool

    model_config = ConfigDict(from_attributes=True)


class PlayerDTO(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class SecretCardDTO(CardDTO):
    is_secret: bool = True
    is_murderer: bool
    is_accomplice: bool
    is_revealed: bool


class PlayerCardTransferredDTO(BaseModel):
    card: CardDTO
    old_player: PlayerDTO
    new_player: PlayerDTO

    model_config = ConfigDict(from_attributes=True)

class WSAddMessage(BaseModel):
    type: str = "playerCardAdd"
    payload: CardDTO

class WSRemoveMessage(BaseModel):
    type: str = "playerCardDelete"
    payload: CardDTO

class WSUpdateMessage(BaseModel):
    type: str = "playerCardUpdate"
    payload: PlayerCardTransferredDTO