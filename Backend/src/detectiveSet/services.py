from sqlalchemy.orm import Session
from src.detectiveSet.models import DetectiveSet
from src.cards.models import DetectiveCard
from src.player.models import Player
from src.gamePlayer.models import PlayerGame
from sqlalchemy import distinct

class DetectiveSetService:
    def __init__(self, db: Session):
        self.db = db

    def get_set(self, set_id: int) -> DetectiveSet | None:
        return self.db.query(DetectiveSet).filter(DetectiveSet.id == set_id).first()

    def get_sets_by_owner(self, owner_id: int) -> list[DetectiveSet]:
        return self.db.query(DetectiveSet).filter(DetectiveSet.id_owner == owner_id).all()

    def get_players_with_sets(self, game_id: int) -> list[int]:
        query_result = (
            self.db.query(DetectiveSet.id_owner)
            .join(PlayerGame, DetectiveSet.id_owner == PlayerGame.player_id)
            .filter(PlayerGame.game_id == game_id)
            .distinct()
            .all()
        )
        
        owner_ids = [id_tuple[0] for id_tuple in query_result]
        
        return owner_ids

    def create_set(self, id_owner, main_detective, action_secret, is_cancellable, wildcard_effects, detective_card_ids=None) -> DetectiveSet:
        set_ = DetectiveSet(
            id_owner=id_owner,
            main_detective=main_detective,
            action_secret=action_secret,
            is_cancellable=is_cancellable,
            wildcard_effects=wildcard_effects
        )
        self.db.add(set_)
        self.db.commit()
        self.db.refresh(set_)
        error_msg = None
        if detective_card_ids:
            cards = self.db.query(DetectiveCard).filter(DetectiveCard.id.in_(detective_card_ids)).all()
            
            missing_ids = set(detective_card_ids) - {c.id for c in cards}
            if missing_ids:
                error_msg = f"Estas cartas no son DetectiveCard o no existen: {missing_ids}"
                    
            for card in cards:
                card.detective_set_id = set_.id
            self.db.commit()
            self.db.refresh(set_)
        return set_, error_msg

    def update_set(self, set_id: int, **kwargs) -> DetectiveSet | None:
        set_ = self.get_set(set_id)
        if not set_:
            return None
        for key, value in kwargs.items():
            setattr(set_, key, value)
        self.db.commit()
        self.db.refresh(set_)
        return set_

    def delete_set(self, set_id: int):
        set_ = self.get_set(set_id)
        if set_:
            self.db.delete(set_)
            self.db.commit()

    def add_detective_to_set(self, set_id: int, detective_id: int) -> DetectiveSet | None:
        set_ = self.get_set(set_id)
        detective = self.db.query(DetectiveCard).filter(DetectiveCard.id == detective_id).first()
        if not set_ or not detective:
            return None
        detective.detective_set_id = set_id
        detectives = set_.cards
        names = [d.name for d in detectives]

        tommy_count = names.count("detective_tommyberesford")
        tuppence_count = names.count("detective_tuppenceberesford")

        only_tommy = tommy_count > 0 and tuppence_count == 0
        only_tuppence = tuppence_count > 0 and tommy_count == 0

        if ((only_tommy and detective.name == "detective_tuppenceberesford") or 
            (only_tuppence and detective.name == "detective_tommyberesford")) :
            set_.is_cancellable = False
        
        self.db.commit()
        self.db.refresh(set_)
        return set_

    def get_cards_of_set(self, set_id: int) -> list[DetectiveCard] | None:
        set_ = self.get_set(set_id)
        if not set_:
            return None
        return set_.cards

    def change_owner(self, set_id: int, new_owner_id: int) -> dict:
        detective_set = self.db.query(DetectiveSet).filter(DetectiveSet.id == set_id).first()
        if not detective_set:
            return {"error": f"DetectiveSet con id {set_id} no encontrado."}
        
        old_owner_id = detective_set.id_owner
        new_owner = self.db.query(Player).filter(Player.id == new_owner_id).first()
        if not new_owner:
            return {"error": f"Jugador con id {new_owner_id} no encontrado."}

        detective_set.id_owner = new_owner_id
        self.db.commit()
        self.db.refresh(detective_set)
        self.db.expire(detective_set, ["owner"])
        self.db.refresh(detective_set)

        return detective_set