from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from src.cards.models import EventCard
from src.cards.schemas import EventCardIn
from .services import CardService
from src.detectiveSet.services import DetectiveSetService
from src.gamePlayer.schemas import WSDiscardMessage, DiscardPayload
from src.websocket import manager
from src.playerCard.models import player_card_table
from src.player.models import Player
from src.cards.logicEventCards.lookIntoTheAshes import LookIntoTheAshesService
from src.cards.logicEventCards.earlyTrainToPaddington import EarlyTrainToPaddingtonService
from src.cards.logicEventCards.delayMurderersEscape import DelayTheMurderersEscapeService
from src.cards.logicEventCards.cardsOffTheTable import CardsOffTheTableService
from src.cards.logicEventCards.cardTrade import CardTradeServices
from src.cards.logicEventCards.andThenThereWasOneMore import AndThenThereWasOneMoreService
from src.cards.logicEventCards.anotherVictim import AnotherVictimService
from src.cards.logicEventCards.point_suspicions_service import PointYourSuspicions, start_votation
from src.cards.logicEventCards.notSoFast import NotSoFast
from src.cards.logicEventCards.deadCardFolly import DeadCardFollyService

class EventCardService(CardService):
    """Provides business logic for EventCard operations."""

    def __init__(self, db: Session):
        super().__init__(db)

    def get_by_id(self, id: int) -> Optional[EventCard]:
        return self._db.query(EventCard).filter(EventCard.id == id).first()

    def create(self, card_dto: EventCardIn) -> EventCard:
        # Convertir HttpUrl a str si es necesario
        new_card = EventCard(
            name=card_dto.name,
            description=card_dto.description,
            image_url=str(card_dto.image_url),
            is_murderes_escapes=card_dto.is_murderes_escapes,
            was_played=card_dto.was_played,
            was_traded=card_dto.was_traded,
            is_cancellable=card_dto.is_cancellable
        )
        self._db.add(new_card)
        self._db.flush()
        self._db.commit()
        self._db.refresh(new_card)
        return new_card

    def update(self, id: int, card_dto: EventCardIn) -> EventCard:
        db_card = self.get_by_id(id)
        if not db_card:
            raise ValueError(f"EventCard with id {id} does not exist")
        db_card.name = card_dto.name
        db_card.description = card_dto.description
        db_card.image_url = str(card_dto.image_url)
        db_card.is_murderes_escapes = card_dto.is_murderes_escapes
        db_card.was_played = card_dto.was_played
        db_card.was_traded = card_dto.was_traded
        db_card.is_cancellable = card_dto.is_cancellable
        self._db.flush()
        self._db.commit()
        self._db.refresh(db_card)
        return db_card

    def delete(self, id: int) -> int:
        db_card = self.get_by_id(id)
        if not db_card:
            raise ValueError(f"EventCard with id {id} does not exist")
        self._db.delete(db_card)
        self._db.flush()
        self._db.commit()
        return id

    def get_by_player(self, player_id: int):
        """
        Returns all event cards owned by a given player.
        """

        # Verificar si existe el jugador
        player = self._db.query(Player).filter(Player.id == player_id).first()
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Player with id={player_id} not found"
            )

        cards = (
            self._db.query(EventCard)
            .join(player_card_table, player_card_table.c.card_id == EventCard.id)
            .filter(player_card_table.c.player_id == player_id)
            .all()
        )

        if not cards:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No event cards found for player id={player_id}"
            )

        return cards

    async def play(self, id: int, payload: dict, room_id: str) -> EventCard:
        db_card = self.get_by_id(id)
        if not db_card:
            raise ValueError(f"EventCard with id {id} does not exist")
        ws_message_to_send = None

        match db_card.name:
            case "event_delayescape":
                delay_service = DelayTheMurderersEscapeService(self._db)
                await delay_service.execute(
                    card_id_played=id, 
                    payload=payload                    
                )
            case "event_pointsuspicions":
                suspicions_service = PointYourSuspicions(self._db)
                await suspicions_service.execute(
                    payload=payload,
                    card_played_id=id,
                    room_id=room_id
                )
            case "event_deadcardfolly":
                folly_service = DeadCardFollyService(self._db)
                await folly_service.execute(
                        payload=payload,
                        card_id_played=id,
                        room_id=room_id
                    )
            case "event_anothervictim":
                victim_service = AnotherVictimService(self._db)
                await victim_service.execute( 
                        payload = payload,
                        card_id_played = id,
                        room_id = room_id
                    )
                print("Efecto de Another Victim")
            case "event_lookashes":
                ashes_service = LookIntoTheAshesService(self._db)
                await ashes_service.execute( 
                        payload=payload,
                        card_id_played=id,
                        room_id=room_id
                    )
            case "event_cardtrade":
                cardTradeServices = CardTradeServices(self._db)
                await cardTradeServices.execute(
                    played_card_id=id,
                    payload=payload,
                    room_id=room_id
                )
            case "event_onemore":                
                onemore_service = AndThenThereWasOneMoreService(self._db)
                await onemore_service.execute(
                    payload=payload,
                    card_id_played=id,
                    room_id=room_id
                )
            case "event_earlytrain":
                earlytrain_service = EarlyTrainToPaddingtonService(self._db)
                await earlytrain_service.execute(
                    card_id_played=id,
                    payload=payload
                )
            case "event_cardsonthetable":
                cards_off_table_service = CardsOffTheTableService(self._db)
                await cards_off_table_service.execute(
                    payload=payload,
                    card_id_played=id,
                    room_id=room_id
                )
            case "Instant_notsofast":
                notSoFast_service = NotSoFast(self._db)
                await notSoFast_service.execute(
                        payload=payload,
                        card_id_played=id,
                        room_id=room_id
                )
            case _:
                print("Evento desconocido")

        if not db_card:
            raise ValueError(f"EventCard with id {id} does not exist")
        db_card.was_played = True
        self._db.flush()
        self._db.commit()
        self._db.refresh(db_card)
        return db_card
