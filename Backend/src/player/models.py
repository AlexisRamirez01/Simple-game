"""Player Models."""""

from sqlalchemy import Enum as SqlEnum

from sqlalchemy import Column, Integer, String, Table, ForeignKey, Boolean, Date
from sqlalchemy.orm import mapped_column, relationship
from typing import List
from sqlalchemy.orm import Mapped
from src.models.db import Base
from src.player.schemas import PlayerOut
from src.player.enums import RolEnum

class Player(Base):
    """
    Represent a Player

    """

    __tablename__ = "player"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    avatar = Column(String, nullable=False)
    birthdate = Column(Date, nullable=False)
    is_Social_Disgrace = Column(Boolean, nullable=False)
    is_Your_Turn = Column(Boolean, nullable=False)
    is_Owner = Column(Boolean, nullable=False)
    rol = Column(SqlEnum(RolEnum), nullable=False, default=RolEnum.innocent)
    
    sets_detective: Mapped[list["DetectiveSet"]] = relationship("DetectiveSet", back_populates="owner")
    
    def to_schema(self) -> PlayerOut:
        """Convierte el modelo SQLAlchemy en un schema Pydantic PlayerOut."""
        return PlayerOut(
            id=self.id,
            name=self.name,
            avatar=self.avatar,
            birthdate=self.birthdate,
            is_Social_Disgrace=self.is_Social_Disgrace,
            is_Your_Turn=self.is_Your_Turn,
            is_Owner=self.is_Owner,
            rol=self.rol,
        )