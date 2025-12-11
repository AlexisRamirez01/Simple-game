"""Card Schemas."""

from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl, ConfigDict

from src.cards.dtos import CardDTO, SecretCardDTO, DetectiveCardDTO, EventCardDTO

from src.player.schemas import PlayerOut

class CardIn(BaseModel):
    """
    Schema for representing a inbound card
    """

    name: str = Field(..., min_length=1, max_length=50, description="El nombre es requerido")
    description: str = Field(..., max_length=200, description="Máximo 200 caracteres")
    image_url: HttpUrl = Field(..., description="Debe ser una URL válida")
    is_murderes_escapes: bool = Field(..., description="Debe ser True o False")

    def to_dto(self) -> CardDTO:
        return CardDTO(
            name=self.name,
            description=self.description,
            image_url=str(self.image_url),
            is_murderes_escapes=self.is_murderes_escapes,
        )
    
    


class CardResponse(BaseModel):
    """Class for retriving Card creation response."""

    id: int
    message: str


class CardOut(BaseModel):
    """
    Schema for representing a  contact
    """

    id: int
    name: str
    description: str
    image_url: str
    is_murderes_escapes: bool
    
    model_config = ConfigDict(from_attributes=True)
    
class SecretCardIn(CardIn):
    is_murderer: bool
    is_accomplice: bool
    is_revealed: bool

    def to_dto(self) -> SecretCardDTO:
        return SecretCardDTO(
            name=self.name,
            description=self.description,
            image_url=str(self.image_url),
            is_murderes_escapes=self.is_murderes_escapes,
            is_murderer=self.is_murderer,
            is_accomplice=self.is_accomplice,
            is_revealed=self.is_revealed,
        )

class SecretCardOut(CardOut):
    id: int
    name: str
    description: str
    image_url: str
    is_murderes_escapes: bool
    is_murderer: bool
    is_accomplice: bool
    is_revealed: bool
    owner: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class DetectiveCardIn(CardIn):
    requiredAmount: int

    def to_dto(self) -> DetectiveCardDTO:
        return DetectiveCardDTO(
            name=self.name,
            description=self.description,
            image_url=str(self.image_url),
            is_murderes_escapes=self.is_murderes_escapes,
            requiredAmount=self.requiredAmount,
        )

class DetectiveCardOut(CardOut):
    requiredAmount: int

class DetectiveCardAmountOut(BaseModel):
    requiredAmount: int

class EventCardIn(CardIn):
    was_played: bool
    was_traded: bool
    is_cancellable: bool

    def to_dto(self) -> EventCardDTO:
        return EventCardDTO(
            name=self.name,
            description=self.description,
            image_url=str(self.image_url),
            is_murderes_escapes=self.is_murderes_escapes,
            was_played=self.was_played,
            was_traded=self.was_traded,
            is_cancellable=self.is_cancellable
        )

class EventCardOut(CardOut):
    was_played: bool
    was_traded: bool
    is_cancellable: bool

class TopDecks(BaseModel):
    amount: int
    deck: str

class RecieveCard(CardOut):
    player_id: int

class CardTradeRequestPayload(BaseModel):
    target_id: int
    other_player_id: int
    played_card_id: int

class WSRecieveCard(BaseModel):
    type: str="gamePlayerRecieveCard"
    payload: RecieveCard

class WsTopDecks(BaseModel):
    type: str="gamePlayerTopDecks"
    payload: TopDecks 

class WSAddMessage(BaseModel):
    type: str = "cardAdd"
    payload: CardOut

class WSUpdateMessage(BaseModel):
    type: str = "cardUpdate"
    payload: CardOut

class WSRemoveMessage(BaseModel):
    type: str = "cardDelete"
    payload: int

class WSSecretUpdateMessage(BaseModel):
    type: str = "secretCardUpdate"
    payload: SecretCardOut

class WSGameUnlock(BaseModel):
    type: str = "gameUnlock"
    payload: int

class WSCardTradeRequest(BaseModel):
    type: str = "card_trade_request"
    payload: CardTradeRequestPayload
      
class SuspiciosPayload(BaseModel):
    suspicious_playerId: int
    end_votation: bool

class WSSuspiciousPlayer(BaseModel):
    type: str="playerSuspicious"
    payload: SuspiciosPayload

class WSCurrentVoter(BaseModel):
    type: str="currentVoter"
    payload: int
