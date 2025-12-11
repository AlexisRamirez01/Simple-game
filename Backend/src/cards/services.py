from typing import List, Optional

from src.cards.dtos import CardDTO
from src.cards.models import Card

from sqlalchemy.orm import Session

class CardService:
    def __init__(self, db: Session):
        self._db = db

    def get_all(
        self,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_murderes_escapes: Optional[bool] = None,
    ) -> List[Card]:
        query = self._db.query(Card)
        if name:
            query = query.filter(Card.name == name)
        if description:
            query = query.filter(Card.description == description)
        if is_murderes_escapes:
            query = query.filter(Card.is_murderes_escapes == is_murderes_escapes)
        return query.all()

    def get_by_id(self, id: int) -> Optional[Card]:
        return self._db.query(Card).filter(Card.id == id).first()

    def create(self, card_dto: CardDTO) -> Card:
        new_card = Card(
            name=card_dto.name,
            description=card_dto.description,
            image_url=card_dto.image_url,
            is_murderes_escapes=card_dto.is_murderes_escapes,
        )
        self._db.add(new_card)
        self._db.flush()
        self._db.commit()
        return new_card

    def update(self, id: int, card_dto: CardDTO) -> Card:
        db_card = self.get_by_id(id)
        if not db_card:
            raise ValueError(f"Card with id {id} does not exist")
        db_card.name = card_dto.name
        db_card.description = card_dto.description
        db_card.image_url = card_dto.image_url
        db_card.is_murderes_escapes = card_dto.is_murderes_escapes
        self._db.flush()
        self._db.commit()
        return db_card

    def delete(self, id: int) -> int:
        db_card = self.get_by_id(id)
        if not db_card:
            raise ValueError(f"Card with id {id} does not exist")
        self._db.delete(db_card)
        self._db.flush()
        self._db.commit()
        return id

