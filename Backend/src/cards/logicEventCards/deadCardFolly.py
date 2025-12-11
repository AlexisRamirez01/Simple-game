from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from src.player.models import Player
from src.gamePlayer.models import PlayerGame 
from src.gameLogic.discard_card_service import discard_card
from src.websocket import manager

from src.gamePlayer.schemas import WSDiscardMessage, DiscardPayload
from src.cards.schemas import CardTradeRequestPayload, WSCardTradeRequest 

class DeadCardFollyService:
    def __init__(self, db: Session):
        self.db = db

    async def execute(
        self,
        payload: dict,
        card_id_played: int,
        room_id: str
    ):
        
        game_id = payload.get("game_id")
        player_id = payload.get("player_id")
        trade_direction = payload.get("trade_direction", "right")

        if not game_id or not player_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faltan game_id o player_id en el payload."
            )

        try:
            result = discard_card(
                db=self.db,
                game_id=game_id,
                player_id=player_id,
                card_id=card_id_played
            )
            self.db.commit()

            ws_payload = DiscardPayload(
                player_id=result["player_id"],
                card_id=result["card_id"],
                card_discard=result["card_discard"].to_schema(),
            )
            ws_message = WSDiscardMessage(payload=ws_payload)
            await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)

        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al descartar 'Dead Card Folly': {str(e)}"
            )

        try:
            players_in_game = (
                self.db.query(Player)
                .join(PlayerGame, Player.id == PlayerGame.player_id)
                .filter(PlayerGame.game_id == game_id)
                .order_by(PlayerGame.position_id_player)
                .all()
            )

            num_players = len(players_in_game)
            if num_players < 2:
                print("No hay suficientes jugadores para 'Dead Card Folly'.")
                return {"message": "Dead Card Folly descartada, pero no hay suficientes jugadores para intercambio."}

            if trade_direction == "left":
                direction_step = -1
                print(f"🃏 Iniciando 'Dead Card Folly' (Hacia la IZQUIERDA) para {num_players} jugadores en Sala {room_id}.")
            else:
                direction_step = 1
                print(f"🃏 Iniciando 'Dead Card Folly' (Hacia la DERECHA) para {num_players} jugadores en Sala {room_id}.")

            for i in range(num_players):
                current_player = players_in_game[i]
                partner_index = (i + direction_step + num_players) % num_players
                partner_player = players_in_game[partner_index]

                print(f"   -> Preparando broadcast para: {current_player.name} (ID: {current_player.id})")
                
                if direction_step == 1:
                    print(f"Su 'other_player_id' (a quien pasa a la DERECHA) es: {partner_player.name} (ID: {partner_player.id})")
                else:
                    print(f"Su 'other_player_id' (a quien pasa a la IZQUIERDA) es: {partner_player.name} (ID: {partner_player.id})")

                payload_to_broadcast = CardTradeRequestPayload(
                    target_id=current_player.id,       
                    other_player_id=partner_player.id, 
                    played_card_id=card_id_played      
                )
                
                ws_message = WSCardTradeRequest(payload=payload_to_broadcast)
                
                await manager.broadcast(ws_message.model_dump_json(), room_id=room_id)
            return {"message": "Dead Card Folly ejecutada. Iniciando intercambio global."}

        except Exception as e:
            self.db.rollback()
            print(f"Error al ejecutar la lógica de broadcast de 'Dead Card Folly': {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al procesar intercambios de 'Dead Card Folly': {str(e)}"
            )