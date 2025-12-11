from sqlalchemy.orm import Session
from src.game.models import Game
from src.gamePlayer.models import PlayerGame
from typing import Tuple, Optional, List
from src.gameLogic.discard_card_service import discard_card
from src.player.services import PlayerService
from fastapi import HTTPException, status
from collections import defaultdict
from src.websocket import manager
from src.gamePlayer.schemas import DiscardPayload, WSDiscardMessage
from src.cards.schemas import (
	SuspiciosPayload, 
	WSSuspiciousPlayer, 
	WSCurrentVoter
)
from src.gamePlayer.models import PlayerGame
import random


Votes_received: dict[int, list[tuple[int, int]]] = {}
End_votation: dict[int, bool] = {}
Order_vote: dict[int, list[int]] = {}
Current_voter_index: dict[int, int] = {}

async def register_receiving_votes(db: Session, game_id: int, vote: Tuple[int, int], room_id: int):
	"""
	Register the votes in event card 'Point your Suspicions'
	"""

	global Votes_received, End_votation, Current_voter_index, Order_vote

	game: Optional[Game] = db.query(Game).filter(Game.id == game_id).first()

	if not game:
		raise ValueError("The game not exist")

	player_id, selected_player_id = vote

	if any(v[0] == player_id for v in Votes_received[game_id]):
		print("Entre acá")
		raise Exception("You already voted")

	players_in_game = db.query(PlayerGame).filter(PlayerGame.game_id == game_id).all()

	Current_voter_index[game_id] += 1

	Votes_received[game_id].append(vote)

	if len(Order_vote[game_id]) <= len(Votes_received[game_id]):
		End_votation[game_id] = True
	else:
		next_voter = Order_vote[game_id][Current_voter_index[game_id]]
		ws_message = WSCurrentVoter(payload=next_voter)
		await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

	return End_votation[game_id]

def start_votation(db: Session, game_id: int, initiator_id: int, card_id: int, room_id: int):

	global Order_vote, Current_voter_index, Current_voter_index, End_votation

	game: Optional[Game] = db.query(Game).filter(Game.id == game_id).first()

	if not game:
		raise ValueError("The game not exist")

	players = (
		db.query(PlayerGame)
		.filter(PlayerGame.game_id == game_id)
		.order_by(PlayerGame.position_id_player.asc())
		.all()
	)

	Order_vote[game_id] = [p.player_id for p in players]

	current_voter_id = Order_vote[game_id][0]

	Current_voter_index[game_id] = 0

	End_votation[game_id] = False

	Votes_received[game_id] = []

	playerService = PlayerService(db)
	players_game = []

	for pid in players:
		player = playerService.get_by_id(pid.player_id)
		players_game.append(player)

	return {
		"current_voter_id": current_voter_id,
		"initiator_id": initiator_id,
		"card_id": card_id,
		"players": players_game
	}


class PointYourSuspicions:
	def __init__(self, db: Session):
		self.db = db

	async def execute(
		self, 
		payload: dict, 
		card_played_id: int, 
		room_id: int
	):

		global Votes_received
		game_id = payload['game_id']
		player_id = payload['player_id']
		end_votation = payload['end_votation']

		try:
			discarted_point = discard_card(
				db=self.db,
				game_id=game_id,
				player_id=player_id,
				card_id=card_played_id
			)
		except Exception as e:
			raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail=f"Falló el primer paso en el descarte de PYS: {str(e)}"
		)

		try:
			if not end_votation:
				return {
					"message": "The votation has no ended"
				}
			key = int(game_id)
			votes = Votes_received[key]

			vote_count = defaultdict(int)
			for _, voted_id in votes:
				vote_count[voted_id] += 1

			max_votes = max(vote_count.values(), default=0)
			most_voted_players = [pid for pid, count in vote_count.items() if count == max_votes]
			is_tie = len(most_voted_players) > 1

			if is_tie:
				player_selected = random.choice(most_voted_players)
			else:
				player_selected = most_voted_players[0]

		except Exception as e:
			self.db.rollback()
			raise HTTPException(
				status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
				detail=f"Descarte de LITA OK, PERO falló el efecto: {str(e)}"
			)

		ws_discard = WSDiscardMessage(payload=DiscardPayload(
			player_id=player_id,
			card_id=card_played_id,
			card_discard=discarted_point["card_discard"].to_schema()
		))

		await manager.broadcast(ws_discard.model_dump_json(), room_id=room_id)

		ws_message = WSSuspiciousPlayer(payload=SuspiciosPayload(
			suspicious_playerId= player_selected,
			end_votation=end_votation
		))

		await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

		Votes_received.pop(game_id, None)
		End_votation.pop(game_id, None)
		Order_vote.pop(game_id, None)
		Current_voter_index.pop(game_id, None)

		return 

		