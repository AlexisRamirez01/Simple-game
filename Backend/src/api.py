"""Defines API."""

from fastapi import APIRouter

from src.game.endpoints import game_router
from src.cards.endpoints import cards_router
from src.cards.endpointsSecretCard import secret_cards_router
from src.player.endpoints import player_router
from src.playerCard.endpoints import playerCard_router
from src.gameCard.endpoints import gameCard_router
from src.gamePlayer.endpoints import player_game_router
from src.cards.endpointsDetectiveCard import detective_cards_router
from src.detectiveSet.endpoints import detective_set_router
from src.cards.endpointsEventCard import event_cards_router
from src.event_timer import event_timer

api_router = APIRouter()
api_router.include_router(game_router, prefix="/game", tags=["game"])
api_router.include_router(cards_router, prefix="/card", tags=["card"])
api_router.include_router(secret_cards_router, prefix="/secret-cards")
api_router.include_router(player_router, prefix="/player", tags=["player"])

api_router.include_router(playerCard_router, prefix="/player", tags=["player_card"])
api_router.include_router(gameCard_router, prefix="/game-cards", tags=["game-cards"])
api_router.include_router(player_game_router, prefix="/game", tags=["game"])

api_router.include_router(detective_cards_router, prefix="/detective-cards", tags=["DetectiveCards"])
api_router.include_router(detective_set_router, prefix="/detective-set", tags=["DetectiveSet"])

api_router.include_router(event_cards_router, prefix="/event-cards", tags=["EventCards"])
api_router.include_router(event_timer, prefix="/game", tags=["game"])