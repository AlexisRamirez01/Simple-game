import traceback
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from src.cards.servicesSecretCard import SecretCardService
from src.game.services import GameService
from src.gamePlayer.models import PlayerGame
from src.gamePlayer.schemas import MurdererEscapesPayload, WSMurdererEscapes
from src.gamePlayer.services import GamePlayerService
from src.player.models import Player
from src.player.services import PlayerService
from src.player.enums import RolEnum
from src.websocket import manager



class WinBySocialDisgrace:
    def __init__(self, db: Session, game_id: int):
        self.db = db
        self.game_id = game_id
    
    async def check_win_by_social_disgrace(self):
        try:
            gamePlayerService = GamePlayerService(self.db)
            gamePlayers = gamePlayerService.get_players_in_game(game_id=self.game_id)
            
            if not gamePlayers:
                    raise HTTPException(    
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"No se pudo encontrar jugadores asociados a la partida con id: {self.game_id}."
                    )
            
            playerService = PlayerService(self.db)
            
            # Se obtiene lista de players
            players = []
            for p in gamePlayers:
                player = playerService.get_by_id(p.player_id)
                
                if not player:
                    raise HTTPException(    
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"No se pudo encontrar el jugador con id: {p.player_id} asociado a la partida que tiene id: {self.game_id}."
                    )
                
                players.append(player)
            
            # Se filtran los jugadores inocentes
            innocentPlayers = list(filter(lambda p: p.rol == RolEnum.innocent, players))
            
            win_by_social_disgrace = all(self.is_player_in_social_disgrace(p.id) for p in innocentPlayers)
            
            # Mensaje de que el asesino escapó en caso de que todos los inocentes estén en desgracia social
            if win_by_social_disgrace:
                gameService = GameService(self.db)
                game = gameService.get_by_id(id=self.game_id)
                
                if not game:
                    raise HTTPException(    
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"No se pudo encontrar la partida con id: {self.game_id}."
                    )
                
                playerMurderer = (
                    self.db.query(Player)
                    .join(PlayerGame, Player.id == PlayerGame.player_id)
                    .filter(
                        PlayerGame.game_id == self.game_id,
                        Player.rol == RolEnum.murderer
                    )
                    .first()
                )
                
                if not playerMurderer:
                    raise HTTPException(    
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"No se pudo encontrar el jugador asesino asociado a la partida que tiene id: {self.game_id}."
                    )
            
                playerMurdererOut = playerMurderer.to_schema()
            
                playerAccomplice = None
                if (game.current_players >= 5):
                    playerAccomplice = (
                        self.db.query(Player)
                        .join(PlayerGame, Player.id == PlayerGame.player_id)
                        .filter(
                            PlayerGame.game_id == self.game_id,
                            Player.rol == RolEnum.accomplice
                        )
                        .first()
                    )
                    
                payloadMurderer = MurdererEscapesPayload(
                    murderer=playerMurdererOut,
                    accomplice=playerAccomplice.to_schema() if playerAccomplice else None
                )
                
                message = WSMurdererEscapes(payload=payloadMurderer)
                await manager.broadcast(message.model_dump_json(), room_id=self.game_id)
                    
        except HTTPException:
            # Deja pasar los errores HTTP originales (404, 400, etc.)
            raise
                
        except Exception as e:
            # Maneja todo lo inesperado
            traceback.print_exc()
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ha ocurrido un error inesperado: {str(e)}"
            )


    def is_player_in_social_disgrace(self, player_id: int) -> bool:
        try:    
            secretCardService = SecretCardService(self.db)
            
            secretsFromPlayer = secretCardService.get_secret_cards_by_player(player_id=player_id)
            
            if not secretsFromPlayer:
                raise HTTPException(    
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No se pudo encontrar los secretos asociados al jugador con id: {player_id}."
                )
            
            in_social_disgrace = all(
                secretCardService.is_revealed(secretCard.id) 
                for secretCard in secretsFromPlayer)
            
            return in_social_disgrace
            
        
        except HTTPException:
            # Deja pasar los errores HTTP originales (404, 400, etc.)
            raise
                
        except Exception as e:
            # Maneja todo lo inesperado
            traceback.print_exc()
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ha ocurrido un error inesperado: {str(e)}"
            )