"""Defines data transfer objects for player (DTOs)"""
from datetime import date
from dataclasses import dataclass
from typing import Optional


@dataclass
class PlayerDTO:
    name: str
    avatar: str
    birthdate: date
    is_Social_Disgrace: bool
    is_Your_Turn: bool
    is_Owner: bool
    rol: str