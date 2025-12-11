from datetime import date
from typing import List, Optional

from src.player.dtos import PlayerDTO
from src.player.models import Player
from src.gamePlayer.models import PlayerGame

from typing import List, Optional
from sqlalchemy.orm import Session

class PlayerService:
    def __init__(self, db: Session):
        self._db = db

    def get_all(
        self,
        name: Optional[str] = None,
        birthdate: Optional[date] = None,
        is_Social_Disgrace: Optional[bool] = None,
        is_Your_Turn: Optional[bool] = None,
        is_Owner: Optional[bool] = None,
        rol: Optional[str] = None,
    ) -> List[Player]:
        query = self._db.query(Player)
        if name:
            query = query.filter(Player.name == name)
        if birthdate:
            query = query.filter(Player.birthdate == birthdate)
        if is_Social_Disgrace:
            query = query.filter(Player.is_Social_Disgrace == is_Social_Disgrace)
        if is_Your_Turn:
            query = query.filter(Player.is_Your_Turn == is_Your_Turn)
        if is_Owner:
            query = query.filter(Player.is_Owner == is_Owner)
        if rol:
            query = query.filter(Player.rol == rol)
        return query.all()


    def get_by_id(self, id: int) -> Optional[Player]:
        return self._db.query(Player).filter(Player.id == id).first()

    def create(self, player_dto: PlayerDTO) -> Player:
        new_player = Player(
            name=player_dto.name,
            birthdate=player_dto.birthdate,
            avatar=player_dto.avatar,
            is_Social_Disgrace=player_dto.is_Social_Disgrace,
            is_Your_Turn=player_dto.is_Your_Turn,
            is_Owner=player_dto.is_Owner,
            rol=player_dto.rol,
        )
        self._db.add(new_player)
        self._db.flush()
        self._db.commit()
        return new_player

    def update(self, id: int, player_dto: PlayerDTO) -> Player:
        db_player = self.get_by_id(id)
        if not db_player:
            raise ValueError(f"Player with id {id} does not exist")
        db_player.name = player_dto.name
        db_player.birthdate = player_dto.birthdate
        db_player.avatar = player_dto.avatar
        db_player.is_Social_Disgrace = player_dto.is_Social_Disgrace
        db_player.is_Your_Turn = player_dto.is_Your_Turn
        db_player.is_Owner = player_dto.is_Owner
        db_player.rol = player_dto.rol    
        self._db.flush()
        self._db.commit()
        return db_player

    def delete(self, id: int) -> int:
        db_player = self.get_by_id(id)
        if not db_player:
            raise ValueError(f"Player with id {id} does not exist")
        self._db.delete(db_player)
        self._db.flush()
        self._db.commit()
        return id

    def get_players_by_game(self, game_id: int) -> List[Player]:
        """
        Obtiene todos los jugadores de una partida específica.
        
        Parameters
        ----------
        game_id : int
            ID de la partida
            
        Returns
        -------
        List[Player]
            Lista de jugadores en la partida
        """
        players = (
            self._db.query(Player)
            .join(PlayerGame, Player.id == PlayerGame.player_id)
            .filter(PlayerGame.game_id == game_id)
            .all()
        )
        return players

    def get_players_with_revealed_secrets(self, game_id: int) -> List[Player]:
        """
        Obtiene todos los jugadores de una partida que tienen al menos un secreto revelado.
        
        Parameters
        ----------
        game_id : int
            ID de la partida
            
        Returns
        -------
        List[Player]
            Lista de jugadores con secretos revelados
        """
        from src.cards.models import SecretCard
        from src.playerCard.models import player_card_table
        
        players = (
            self._db.query(Player)
            .join(PlayerGame, Player.id == PlayerGame.player_id)
            .join(player_card_table, Player.id == player_card_table.c.player_id)
            .join(SecretCard, player_card_table.c.card_id == SecretCard.id)
            .filter(
                PlayerGame.game_id == game_id,
                SecretCard.is_revealed == True
            )
            .distinct()
            .all()
        )
        return players
