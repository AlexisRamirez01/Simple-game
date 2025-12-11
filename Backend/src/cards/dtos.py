"""Defines data transfer objects for cards (DTOs)"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class CardDTO:
    name: str
    description: str
    image_url: str
    is_murderes_escapes: bool

@dataclass
class SecretCardDTO(CardDTO):
    is_murderer: bool
    is_accomplice: bool
    is_revealed: bool

@dataclass
class DetectiveCardDTO(CardDTO):
    requiredAmount: int
    
@dataclass
class EventCardDTO(CardDTO):
    was_played: bool
    was_traded: bool
    is_cancellable: bool