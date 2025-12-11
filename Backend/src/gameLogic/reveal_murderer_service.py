from sqlalchemy.orm import Session
from src.gameCard.models import GameCard
from src.game.models import Game
from src.gamePlayer.models import PlayerGame
from src.player.models import Player
from sqlalchemy import select


def reveal_murderer(db: Session, secret_id: int) -> dict:
	"""
	Detecta la victoria si se revelo al asesino

	Parameters
	-----------
	db: Session
		Sesión activa de la base de datos

	secret_id: int
		ID del secreto del asesino

	Returns
	--------
		dict: Información del asesino y su complice antes de eliminar la partida
	"""

	stmt_game = (
		select(GameCard.game_id)
		.where(GameCard.card_id == secret_id)
	)

	row = db.execute(stmt_game).first()
	if not row:
		raise ValueError("Game not found")

	game_id = row[0]

	game_players = (
		db.query(PlayerGame)
		.filter(PlayerGame.game_id == game_id)
		.all()
	)

	player_ids = [p.player_id for p in game_players]
	players = db.query(Player).filter(Player.id.in_(player_ids)).all()

	murderer = next((p for p in players if p.rol == "murderer"), None)
	accomplice = next((p for p in players if p.rol == "accomplice"), None)

	result = {
		"game_id": game_id,
		"murderer": murderer if murderer else None,
		"accomplice": accomplice if accomplice else None
	}

	game = db.query(Game).filter(Game.id == game_id).first()

	db.query(GameCard).filter(GameCard.game_id == game_id).delete()
	db.query(PlayerGame).filter(PlayerGame.game_id == game_id).delete()
	db.delete(game)
	db.commit()

	return result
