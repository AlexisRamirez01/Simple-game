
from sqlalchemy import Column, Integer, ForeignKey, Table
from sqlalchemy.orm import relationship
from src.models.db import Base
from src.player.models import Player
from src.game.models import Game

class PlayerGame(Base):
    __tablename__ = "player_game"
    Base.metadata
    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("player.id"), unique=True)  # un jugador solo en un juego
    game_id = Column(Integer, ForeignKey("Game.id"))
    position_id_player = Column(Integer, nullable=True)

player = relationship("player", back_populates="player_game")
game = relationship("Game", back_populates="player_games")

