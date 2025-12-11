from typing import List, Optional

from sqlalchemy.orm import Session

from .services import CardService
from .models import DetectiveCard
from .dtos import DetectiveCardDTO
from sqlalchemy import select
from src.playerCard.models import player_card_table

class DetectiveCardService(CardService):
    def __init__(self, db: Session):
        super().__init__(db)

    def get_all(
        self,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_murderes_escapes: Optional[bool] = None,
        requiredAmount: Optional[int] = None,
    ) -> List[DetectiveCard]:
        query = self._db.query(DetectiveCard)
        if name:
            query = query.filter(DetectiveCard.name == name)
        if description:
            query = query.filter(DetectiveCard.description == description)
        if is_murderes_escapes is not None:
            query = query.filter(DetectiveCard.is_murderes_escapes == is_murderes_escapes)
        if requiredAmount is not None:
            query = query.filter(DetectiveCard.requiredAmount == requiredAmount)
        return query.all()

    def get_by_id(self, id: int) -> Optional[DetectiveCard]:
        return self._db.query(DetectiveCard).filter(DetectiveCard.id == id).first()

    def get_detective_cards_by_player(self, player_id: int) -> List[DetectiveCard]:
        stmt = (
            select(DetectiveCard)
            .join(player_card_table, player_card_table.c.card_id == DetectiveCard.id)
            .where(player_card_table.c.player_id == player_id)
        )
        result = self._db.scalars(stmt).all()
        return result


    def get_required_amount(self, id: int) -> int:
        db_card = self.get_by_id(id)
        if not db_card:
            raise ValueError(f"DetectiveCard with id {id} does not exist")
        return db_card.requiredAmount


    def create(self, card_dto: DetectiveCardDTO) -> DetectiveCard:
        new_card = DetectiveCard(
            name=card_dto.name,
            description=card_dto.description,
            image_url=card_dto.image_url,
            is_murderes_escapes=card_dto.is_murderes_escapes,
            requiredAmount=card_dto.requiredAmount
        )
        self._db.add(new_card)
        self._db.flush()
        self._db.commit()
        return new_card

    def update(self, id: int, card_dto: DetectiveCardDTO) -> DetectiveCard:
        db_card = self.get_by_id(id)
        if not db_card:
            raise ValueError(f"DetectiveCard with id {id} does not exist")
        
        db_card.name = card_dto.name
        db_card.description = card_dto.description
        db_card.image_url = card_dto.image_url
        db_card.is_murderes_escapes = card_dto.is_murderes_escapes
        db_card.requiredAmount = card_dto.requiredAmount
        
        self._db.flush()
        self._db.commit()
        return db_card

    def delete(self, id: int) -> int:
        db_card = self.get_by_id(id)
        if not db_card:
            raise ValueError(f"DetectiveCard with id {id} does not exist")
        self._db.delete(db_card)
        self._db.flush()
        self._db.commit()
        return id