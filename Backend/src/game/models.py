"""Game Models"""

from sqlalchemy import Column, Integer, String, Boolean, Table, ForeignKey
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy.orm import Mapped
from src.models.db import Base
# from src.player.models import Player


class Game(Base):
	"""
	Represent a Game
	"""
	__tablename__ = "Game"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	name = Column(String, nullable=True)
	max_players = Column(Integer, nullable=True)
	min_players = Column(Integer, nullable=True)
	current_players = Column(Integer, nullable=True)
	is_started = Column(Boolean, default=False)
	current_turn = Column(Integer, nullable=True)
	turn_id_player = Column(Integer, nullable=True)
	draw_top = Column(Integer, default = 0)
	discard_top = Column(Integer, default = 0)
	"""
	Creo la columna para turn_id_player viendolo como ya que necsito una asociación
	turn_id_player: Mapped[int] = mapped_column(ForeignKey("player.id"), nullable=True)
    turn_player = relationship("Player", foreign_keys=[turn_id_player])

    Acá implemento una relación de muchos jugadores a un único juego
    players = relationship("Player", back_populates="game")

    Necesito que el que hace jugador haga por lo menos el código del modelo para que agregue lo siguiente:
    game_id: Mapped[int] = mapped_column(ForeignKey("game.id"))
    game = relationship("Game", back_populates="players")
	"""
