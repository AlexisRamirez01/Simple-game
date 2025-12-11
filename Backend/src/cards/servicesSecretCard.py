from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import select

from .services import CardService
from .models import SecretCard
from src.playerCard.models import player_card_table
from src.player.models import Player
from .dtos import SecretCardDTO

class SecretCardService(CardService):
    def __init__(self, db: Session):
        super().__init__(db)

    def get_all(
        self,
        name: Optional[str] = None,
        description: Optional[str] = None,
        is_murderes_escapes: Optional[bool] = None,
        is_murderer: Optional[bool] = None,
        is_accomplice: Optional[bool] = None,
        is_revealed: Optional[bool] = None,
    ) -> List[SecretCard]:
        query = self._db.query(SecretCard)
        if name:
            query = query.filter(SecretCard.name == name)
        if description:
            query = query.filter(SecretCard.description == description)
        if is_murderes_escapes is not None:
            query = query.filter(SecretCard.is_murderes_escapes == is_murderes_escapes)
        if is_murderer is not None:
            query = query.filter(SecretCard.is_murderer == is_murderer)
        if is_accomplice is not None:
            query = query.filter(SecretCard.is_accomplice == is_accomplice)
        if is_revealed is not None:
            query = query.filter(SecretCard.is_revealed == is_revealed)
        return query.all()

    def get_by_id(self, id: int) -> Optional[SecretCard]:
        return self._db.query(SecretCard).filter(SecretCard.id == id).first()

    def create(self, card_dto: SecretCardDTO) -> SecretCard:
        new_card = SecretCard(
            name=card_dto.name,
            description=card_dto.description,
            image_url=card_dto.image_url,
            is_murderes_escapes=card_dto.is_murderes_escapes,
            is_murderer=card_dto.is_murderer,
            is_accomplice=card_dto.is_accomplice,
            is_revealed=card_dto.is_revealed
        )
        self._db.add(new_card)
        self._db.flush()
        self._db.commit()
        return new_card

    def update(self, id: int, card_dto: SecretCardDTO) -> SecretCard:
        db_card = self.get_by_id(id)
        if not db_card:
            raise ValueError(f"SecretCard with id {id} does not exist")
        db_card.name = card_dto.name
        db_card.description = card_dto.description
        db_card.image_url = card_dto.image_url
        db_card.is_murderes_escapes = card_dto.is_murderes_escapes
        db_card.is_murderer = card_dto.is_murderer
        db_card.is_accomplice = card_dto.is_accomplice
        db_card.is_revealed = card_dto.is_revealed
        self._db.flush()
        self._db.commit()
        return db_card

    def delete(self, id: int) -> int:
        db_card = self.get_by_id(id)
        if not db_card:
            raise ValueError(f"SecretCard with id {id} does not exist")
        self._db.delete(db_card)
        self._db.flush()
        self._db.commit()
        return id

    def reveal(self, id: int, revealed: bool = True) -> SecretCard:
        card = self._db.query(SecretCard).filter(SecretCard.id == id).first()
        if not card:
            raise ValueError(f"SecretCard with id {id} does not exist")
        card.is_revealed = revealed
        self._db.flush()
        self._db.commit()
        stmt_owner = (
            select(Player.name)
            .join(player_card_table, Player.id == player_card_table.c.player_id)
            .where(player_card_table.c.card_id == id)
        )
        result = self._db.execute(stmt_owner).first()
        owner_name = result[0] if result else None
        return {
        "id": card.id,
        "name": card.name,
        "description": card.description,
        "image_url": card.image_url,
        "is_murderes_escapes": card.is_murderes_escapes,
        "is_murderer": card.is_murderer,
        "is_accomplice": card.is_accomplice,
        "is_revealed": card.is_revealed,
        "owner": owner_name
        }

    def is_revealed(self, id: int) -> bool:
        card = self._db.query(SecretCard).filter(SecretCard.id == id).first()
        if not card:
            raise ValueError(f"SecretCard with id {id} does not exist")
        return card.is_revealed

    def get_secret_cards_by_player(self, player_id: int) -> List[SecretCard]:
        stmt = (
            select(SecretCard)
            .join(player_card_table, player_card_table.c.card_id == SecretCard.id)
            .where(player_card_table.c.player_id == player_id)
        )
        result = self._db.scalars(stmt).all()
        return result if result else []