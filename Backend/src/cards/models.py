"""Card Models."""""

from sqlalchemy import Column, Integer, String, Table, ForeignKey, Boolean
from sqlalchemy.orm import mapped_column, relationship
from typing import List
from sqlalchemy.orm import Mapped
from src.models.db import Base
from src.cards.schemas import CardOut

class Card(Base):
    """
    Represent a Card

    """

    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
    is_murderes_escapes = Column(Boolean, nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": "card",
        "polymorphic_on": None,
    }
    
    def to_schema(self) -> CardOut:
        """Convierte el modelo SQLAlchemy en un schema Pydantic CardOut."""
        return CardOut(
            id=self.id,
            name=self.name,
            description=self.description,
            image_url=self.image_url,
            is_murderes_escapes=self.is_murderes_escapes,
        )

class SecretCard(Card):
    """
    Represent a SecretCard

    """

    __tablename__ = "secret_cards"
    
    id: Mapped[int] = mapped_column(Integer, ForeignKey("cards.id"), primary_key=True)
    is_murderer: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_accomplice: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_revealed: Mapped[bool] = mapped_column(Boolean, nullable=False)

    __mapper_args__ = {
        "polymorphic_identity": "secret_card",
    }

class DetectiveCard(Card):
    """
    Represent a DetectiveCard
    """
    __tablename__ = "detective_cards"
    
    id: Mapped[int] = mapped_column(Integer, ForeignKey("cards.id"), primary_key=True)
    requiredAmount: Mapped[int] = mapped_column(Integer, nullable=False)

    detective_set_id: Mapped[int] = mapped_column(Integer, ForeignKey("detective_set.id"), nullable=True)
    detective_set = relationship("DetectiveSet", back_populates="cards")
    
    __mapper_args__ = {
        "polymorphic_identity": "detective_card",
    }

class EventCard(Card):
    """
    Represent a EventCard
    """
    __tablename__ = "event_cards"
    
    id: Mapped[int] = mapped_column(Integer, ForeignKey("cards.id"), primary_key=True)
    was_played: Mapped[bool] = mapped_column(Boolean, nullable=False)
    was_traded: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_cancellable: Mapped[bool] = mapped_column(Boolean, nullable=False)

    
    __mapper_args__ = {
        "polymorphic_identity": "event_card",
    }