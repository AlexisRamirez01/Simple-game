from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from src.cards.schemas import CardOut
from src.player.schemas import PlayerOut

class DetectiveSetBase(BaseModel):
    id_owner: int
    main_detective: str
    action_secret: str
    is_cancellable: bool
    wildcard_effects: Optional[str] = None
    detective_card_ids: Optional[List[int]] = []

class DetectiveSetIn(DetectiveSetBase):
    pass

class DetectiveSetOut(BaseModel):
    id: int
    main_detective: str
    owner: Optional[PlayerOut] = None
    cards: Optional[List[CardOut]] = []
    old_owner:Optional[PlayerOut] = None
    action_secret: str
    is_cancellable: bool
    

    model_config = ConfigDict(from_attributes=True)

class DetectiveSetOutOwner(DetectiveSetBase):
    id: int
    owner: Optional[PlayerOut] = None
    cards: Optional[List[CardOut]] = []
    
    model_config = ConfigDict(from_attributes=True)

class DetectiveSetPlay(BaseModel):
    player_id: int
    target_id: int
    secret_cards: List[CardOut]
    is_cancellable: bool
    wildcard_effects: Optional[str] = None

class WSAddMessage(BaseModel):
    type: str = "detectiveSetAdd"
    payload: DetectiveSetOut

class WSRemoveMessage(BaseModel):
    type: str = "detectiveSetDelete"
    payload: DetectiveSetOut

class WSDetectiveAdd(BaseModel):
    type: str = "detectiveAddToSet"
    payload: DetectiveSetOut


class WSRevealTheirMessage(BaseModel):
    type: str = "revealTheirSecret"
    payload: DetectiveSetPlay
    
class WSRevealYourMessage(BaseModel):
    type: str = "revealYourSecret"
    payload: DetectiveSetPlay
    
class WSHideYourMessage(BaseModel):
    type: str = "hideYourSecret"
    payload: DetectiveSetPlay

class WSUpdateMessage(BaseModel):
    type: str = "detectiveSetUpdate"
    payload: DetectiveSetOut