from sqlalchemy import Column, Integer, String, Enum, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.models.db import Base
from src.player.models import Player
from src.cards.models import DetectiveCard

class DetectiveSet(Base):
    __tablename__ = "detective_set"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_owner: Mapped[int] = mapped_column(Integer, ForeignKey("player.id"))
    main_detective: Mapped[str] = mapped_column(String, nullable=False)
    action_secret: Mapped[str] = mapped_column(Enum("reveal_your", "reveal_their", "hide", name="action_secret_enum"), nullable=False)
    is_cancellable: Mapped[bool] = mapped_column(Boolean, nullable=False)
    wildcard_effects: Mapped[str] = mapped_column(Enum("Satterthwaite", "Oliver", name="wildcard_enum"), nullable=True)

    owner: Mapped[Player] = relationship("Player", back_populates="sets_detective")
    cards: Mapped[list[DetectiveCard]] = relationship("DetectiveCard", back_populates="detective_set")