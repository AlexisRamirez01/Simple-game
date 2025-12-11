import pytest
import json
from fastapi import status
from unittest.mock import patch, MagicMock, AsyncMock
from src.cards.models import Card, EventCard
from src.game.models import Game
from src.gameCard.models import GameCard, CardPosition
from src.gamePlayer.models import PlayerGame
from src.playerCard.models import player_card_table
from sqlalchemy import insert
lita_player_id = None
lita_game_id = None
lita_event_card_id = None
lita_target_card_id_1 = None 
lita_target_card_id_2 = None 

def test_create_lita_entities(client):
    """Crea el jugador, la partida y las 3 cartas necesarias."""
    global lita_player_id, lita_game_id, lita_event_card_id, \
           lita_target_card_id_1, lita_target_card_id_2

    response_player = client.post(
        "/player",
        json={
            "name": "LITA Player",
            "birthdate": "1990-01-01",
            "avatar": "http://example.com/lita_player.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent"
        },
    )
    assert response_player.status_code == status.HTTP_201_CREATED
    lita_player_id = response_player.json()["id"]

    response_game = client.post(
        "/game",
        json={
            "name": "Look into the Ashes Game",
            "max_players": 4, "min_players": 2, "current_players": 0,
            "is_started": True, "current_turn": 0,
            "turn_id_player": lita_player_id
        },
    )
    assert response_game.status_code == status.HTTP_201_CREATED
    lita_game_id = response_game.json()["id"]

    response_lita = client.post(
        "/event-cards/",
        json={
            "name": "event_lookashes",
            "description": "Toma una carta del descarte.",
            "image_url": "http://example.com/lita.png",
            "is_murderes_escapes": False,
            "was_played": False, "was_traded": False, "is_cancellable": True
        }
    )
    assert response_lita.status_code == status.HTTP_201_CREATED
    lita_event_card_id = response_lita.json()["id"]

    response_card1 = client.post(
        "/detective-cards/",
        json={
            "name": "Pala", "description": "Carta de descarte 1",
            "image_url": "http://example.com/pala.png",
            "is_murderes_escapes": False, "requiredAmount": 1
        }
    )
    assert response_card1.status_code == status.HTTP_201_CREATED
    lita_target_card_id_1 = response_card1.json()["id"]

    response_card2 = client.post(
        "/detective-cards/",
        json={
            "name": "Té", "description": "Carta de descarte 2",
            "image_url": "http://example.com/te.png",
            "is_murderes_escapes": False, "requiredAmount": 1
        }
    )
    assert response_card2.status_code == status.HTTP_201_CREATED
    lita_target_card_id_2 = response_card2.json()["id"]


def test_setup_lita_db_state(client, db_session):
    """
    Prepara el estado de la DB:
    - Pone 2 cartas en el mazo de descarte.
    - Da la carta LITA al jugador.
    - Setea el contador 'discard_top' del juego.
    """
    assert all([lita_player_id, lita_game_id, lita_event_card_id, 
                lita_target_card_id_1, lita_target_card_id_2])

    try:
        client.post(f"/game/{lita_game_id}/{lita_player_id}", json={"position_id_player": 0})
        db_session.execute(
            insert(player_card_table).values(
                player_id=lita_player_id, 
                card_id=lita_event_card_id
            )
        )

        db_session.add_all([
            GameCard(
                game_id=lita_game_id, 
                card_id=lita_target_card_id_1, 
                card_position=CardPosition.MAZO_DESCARTE, 
                card_order=1
            ),
            GameCard(
                game_id=lita_game_id, 
                card_id=lita_target_card_id_2, 
                card_position=CardPosition.MAZO_DESCARTE, 
                card_order=2
            )
        ])
        
        game = db_session.get(Game, lita_game_id)
        assert game is not None, "El juego no se encontró en la DB"
        game.discard_top = 2
        
        db_session.commit()
        
    except Exception as e:
        db_session.rollback()
        pytest.fail(f"Falló el setup de la DB para LITA: {e}")

def test_execute_look_into_the_ashes_happy_path(client, db_session):
    """
    Test del "Happy Path":
    - P1 juega LITA.
    - P1 elige la carta "Pala" (lita_target_card_id_1) del descarte.
    - EFECTO: "Pala" va a la mano de P1.
    - "Té" (que estaba en orden 2) ahora pasa a orden 1.
    - Se emiten 3 broadcasts.
    """
    assert all([lita_player_id, lita_game_id, lita_event_card_id, 
                lita_target_card_id_1, lita_target_card_id_2])
    payload = {
        "game_id": lita_game_id,
        "player_id": lita_player_id,
        "selected_card_id": lita_target_card_id_1
    }
    room_id = str(lita_game_id)

    with patch("src.cards.logicEventCards.lookIntoTheAshes.manager.broadcast", new_callable=AsyncMock) as mock_broadcast, \
         patch("src.cards.logicEventCards.lookIntoTheAshes.discard_card") as mock_discard_card:
        
        mock_lita_card_schema = {
            "id": lita_event_card_id, "name": "event_lookashes", "description": "...",
            "image_url": "...", "is_murderes_escapes": False
        }
        mock_discard_card.return_value = {
            "player_id": lita_player_id, "card_id": lita_event_card_id,
            "card_discard": MagicMock(to_schema=lambda: mock_lita_card_schema)
        }
        
        response = client.put(
            f"/event-cards/play/{lita_event_card_id}",
            json=payload,
            params={"room_id": room_id}
        )

        assert response.status_code == status.HTTP_200_OK, response.text
        data = response.json()
        assert data["id"] == lita_event_card_id
        assert data["was_played"] is True

        mock_discard_card.assert_called_once()
        args, kwargs = mock_discard_card.call_args
        assert kwargs.get("card_id") == lita_event_card_id
        
        assert mock_broadcast.call_count == 3

        ws1_data = json.loads(mock_broadcast.call_args_list[0][0][0])
        assert ws1_data["type"] == "gamePlayerDiscard"
        assert ws1_data["payload"]["player_id"] == lita_player_id
        assert ws1_data["payload"]["card_id"] == lita_event_card_id

        ws2_data = json.loads(mock_broadcast.call_args_list[1][0][0])
        assert ws2_data["type"] == "gamePlayerRecieveCard"
        assert ws2_data["payload"]["player_id"] == lita_player_id
        assert ws2_data["payload"]["id"] == lita_target_card_id_1 # "Pala"

        # WS 3 (Actualización del mazo de descarte)
        ws3_data = json.loads(mock_broadcast.call_args_list[2][0][0])
        assert ws3_data["type"] == "gamePlayerTopDecks"
        assert ws3_data["payload"]["amount"] == -1
        assert ws3_data["payload"]["deck"] == "mazo_descarte"

    game_after = db_session.get(Game, lita_game_id)
    assert game_after.discard_top == 1

    pala_link = db_session.query(player_card_table).filter(
        player_card_table.c.player_id == lita_player_id,
        player_card_table.c.card_id == lita_target_card_id_1
    ).first()
    assert pala_link is not None

    pala_game_card = db_session.get(GameCard, (lita_game_id, lita_target_card_id_1))
    assert pala_game_card.card_position is None
    assert pala_game_card.card_order == 0
    
    te_game_card = db_session.get(GameCard, (lita_game_id, lita_target_card_id_2))
    assert te_game_card.card_position == CardPosition.MAZO_DESCARTE
    assert te_game_card.card_order == 1 


def test_execute_lita_fail_card_not_in_discard(client, db_session):
    """
    Test de fallo: El 'selected_card_id' no está en el mazo de descarte.
    """
    payload = {
        "game_id": lita_game_id,
        "player_id": lita_player_id,
        "selected_card_id": 99999
    }
    room_id = str(lita_game_id)
    
    with patch("src.cards.logicEventCards.lookIntoTheAshes.discard_card") as mock_discard_card:
        
        mock_lita_card_schema = {
            "id": lita_event_card_id, "name": "event_lookashes", "description": "...",
            "image_url": "...", "is_murderes_escapes": False
        }
        mock_discard_card.return_value = {
            "player_id": lita_player_id, "card_id": lita_event_card_id,
            "card_discard": MagicMock(to_schema=lambda: mock_lita_card_schema)
        }
        
        response = client.put(
            f"/event-cards/play/{lita_event_card_id}",
            json=payload,
            params={"room_id": room_id}
        )
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "falló el efecto" in response.json()["detail"]