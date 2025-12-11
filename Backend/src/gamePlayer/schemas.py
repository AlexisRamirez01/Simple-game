from pydantic import BaseModel
from typing import Optional, List, Tuple
from src.cards.schemas import CardOut
from src.player.schemas import PlayerOut

class GamePlayerBase(BaseModel):
    game_id: int
    player_id: int
    position_id_player: Optional[int] = None

class GamePlayerIn(GamePlayerBase):
    pass

class GamePlayerOut(GamePlayerBase):
    id: int

class DiscardPayload(BaseModel):
    player_id: int
    card_id: int
    card_discard: CardOut
    
class MurdererEscapesPayload(BaseModel):
    murderer: PlayerOut
    accomplice: Optional[PlayerOut] = None

class RestockPayload(BaseModel):
    game_id: int
    player_id: int
    cards: List[CardOut]
    draft_cards: List[CardOut]

class CardsDraftInfo(BaseModel):
    cards_id: Optional[list[int]] = []

class JoinGameIn(BaseModel):
    position_id_player: Optional[int] = None

class WSAddMessage(BaseModel):
    type: str = "gamePlayerAdd"
    payload: GamePlayerOut

class WSUpdateMessage(BaseModel):
    type: str = "gamePlayerUpdate"
    payload: GamePlayerOut

class WSDeleteMessage(BaseModel):
    type: str = "gamePlayerRemove"
    player_id: int

class WSRestockMessage(BaseModel):
    type: str = "gamePlayerRestock"
    payload: RestockPayload

class WSDiscardMessage(BaseModel):
    type: str = "gamePlayerDiscard"
    payload: DiscardPayload

class WSNextTurnMessage(BaseModel):
    type: str = "gameNextTurn"
    payload: int
    
class WSMurdererEscapes(BaseModel):
    type: str = "gameMurdererEscapes"
    payload: MurdererEscapesPayload

class VotePlayerInfo(BaseModel):
    vote: Tuple[int, int]

class RegisterVotesPayload(BaseModel):
    end_votation: bool

class WSRegisteVotes(BaseModel):
    type: str = "RegisterVotes"
    payload: RegisterVotesPayload

class StartVotationPayload(BaseModel):
    current_voter_id: int
    initiator_id: int
    card_id: int
    players: List[PlayerOut]

class WSStartVotation(BaseModel):
    type: str="startVotation"
    payload: StartVotationPayload