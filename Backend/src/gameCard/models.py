from sqlalchemy import Column, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from src.models.db import Base
import enum

class CardPosition(str, enum.Enum):
    MAZO_ROBO = "mazo_robo"
    MAZO_DESCARTE = "mazo_descarte"
    MAZO_DRAFT = "mazo_draft"
    ON_TABLE = "on_table"

class GameCard(Base):
    __tablename__ = "game_card"
    game_id = Column(Integer, ForeignKey("Game.id"), primary_key=True)
    card_id = Column(Integer, ForeignKey("cards.id"), primary_key=True)
    card_position = Column(Enum(CardPosition), nullable=True)  # puede ser null
    card_order = Column(Integer, default = 0)

    game = relationship("Game", back_populates="game_cards")
    card = relationship("Card", back_populates="game_cards")

# Relaciones
from src.game.models import Game
from src.cards.models import Card

Game.game_cards = relationship("GameCard", back_populates="game")
Card.game_cards = relationship("GameCard", back_populates="card")