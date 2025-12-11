from sqlalchemy import Column, Integer, ForeignKey, Table
from sqlalchemy.orm import relationship
from src.models.db import Base
from src.player.models import Player
from src.cards.models import Card

player_card_table = Table(
    "player_card",
    Base.metadata,
    Column("player_id", Integer, ForeignKey("player.id"), primary_key=True),
    Column("card_id", Integer, ForeignKey("cards.id"), primary_key=True)
)

Player.cards = relationship("Card", secondary=player_card_table, back_populates="players")
Card.players = relationship("Player", secondary=player_card_table, back_populates="cards")