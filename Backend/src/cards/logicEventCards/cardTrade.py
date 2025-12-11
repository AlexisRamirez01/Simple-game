from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from src.player.models import Player
from src.game.models import Game
from src.gameCard.models import GameCard
from src.gameLogic.discard_card_service import discard_card
from src.websocket import manager
from src.gamePlayer.schemas import WSDiscardMessage, DiscardPayload
from src.cards.schemas import CardTradeRequestPayload, WSCardTradeRequest

class CardTradeServices:
    def __init__(self, db: Session):
        self.db = db

    async def execute(self, played_card_id: int, payload: dict, room_id: int):
        game_id = payload.get("game_id")
        player_id = payload.get("player_id")
        target_player_id = payload.get("target_player_id") 

        if not all([game_id, player_id, target_player_id, played_card_id]):
            raise HTTPException(status_code=400, detail="Faltan parámetros obligatorios")

        print(f"🃏 Card Trade usada en game {game_id}")
        print(f"   Jugador que la usa: {player_id}")
        print(f"   Jugador objetivo: {target_player_id}")
        print(f"   Carta jugada: {played_card_id}")

        player = self.db.query(Player).filter(Player.id == target_player_id).first()
        if not player:
            raise HTTPException(status_code=404, detail="Jugador objetivo no encontrado")

        game = self.db.query(Game).filter(Game.id == game_id).first()
        if not game:
            raise HTTPException(status_code=404, detail="Juego no encontrado")

        card_ids_in_current_game = {
            result[0] for result in self.db.query(GameCard.card_id).filter(GameCard.game_id == game_id)
        }

        try:
            result = discard_card(self.db, game_id, player_id, played_card_id)
            self.db.commit()

            ws_payload = DiscardPayload(
                player_id=result["player_id"],
                card_id=result["card_id"],
                card_discard=result["card_discard"].to_schema(),
            )
            ws_message = WSDiscardMessage(payload=ws_payload)
            await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

            print(f"🗑️ Carta de evento {played_card_id} descartada correctamente.")
            print(f"📣 Enviando WS 'card_trade_request' a {player_id} y {target_player_id}")

            payload_to_initiator = CardTradeRequestPayload(
                target_id=player_id,
                other_player_id=target_player_id,
                played_card_id=played_card_id
            )
            ws_msg_initiator = WSCardTradeRequest(payload=payload_to_initiator)
            await manager.broadcast(ws_msg_initiator.model_dump_json(), room_id=room_id)
            
            payload_to_target = CardTradeRequestPayload(
                target_id=target_player_id,
                other_player_id=player_id,
                played_card_id=played_card_id
            )
            ws_msg_target = WSCardTradeRequest(payload=payload_to_target)
            await manager.broadcast(ws_msg_target.model_dump_json(), room_id=room_id)
            
            print("✅ Mensajes de inicio de trade (A y B) enviados.")

        except Exception as e:
            self.db.rollback()
            print(f"⚠️ Error al descartar la carta jugada {played_card_id}: {e}")

        return
