import pytest
import time
import asyncio
from unittest.mock import patch, AsyncMock

# --- IDs Globales para este test ---
timer_player_id_1 = None
timer_player_id_2 = None

# --- 1. Setup (¡NECESARIO!) ---
def test_create_timer_players(client):
    """Crea los jugadores que se usarán en los tests del timer."""
    global timer_player_id_1, timer_player_id_2
    
    response1 = client.post(
        "/player",
        json={
            "name": "Timer Player 1",
            "birthdate": "1990-01-01",
            "avatar": "http://example.com/timer1.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent"
        },
    )
    assert response1.status_code == 201
    timer_player_id_1 = response1.json()["id"]
    
    response2 = client.post(
        "/player",
        json={
            "name": "Timer Player 2",
            "birthdate": "1991-02-02",
            "avatar": "http://example.com/timer2.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "innocent"
        },
    )
    assert response2.status_code == 201
    timer_player_id_2 = response2.json()["id"]


# --- 2. Tests Corregidos ---

def test_start_event(client):
    assert timer_player_id_1 is not None, "El setup de jugadores falló"
    
    game_id = 1
    room_id = "sala_test"
    player_id = timer_player_id_1

    response = client.post(
        f"/game/{game_id}/event/start?room_id={room_id}", 
        json={"player_id": player_id}
    )

    assert response.status_code == 200, response.text

    data = response.json()
    assert data["message"] == "Evento iniciado"
    assert data["room_id"] == room_id
    assert data["started_by"] == player_id


def test_websocket_receives_event_started(client):
    assert timer_player_id_1 is not None, "El setup de jugadores falló"

    game_id = 1
    room_id = "sala_ws_test"
    player_id = timer_player_id_1

    # Mockeamos el 'countdown' para que no duerma 10 segundos
    with patch("src.event_timer.countdown", new_callable=AsyncMock) as mock_countdown:
        with client.websocket_connect(f"/ws/{room_id}") as websocket:
            
            response = client.post(
                f"/game/{game_id}/event/start?room_id={room_id}", 
                json={"player_id": player_id}
            )
            
            assert response.status_code == 200, response.text
            
            # --- ¡CORRECCIÓN AQUÍ! ---
            # 1. El broadcast es asíncrono, esperamos 100ms
            time.sleep(0.1) 
            # 2. 'receive_json()' no acepta 'timeout'
            msg = websocket.receive_json()
            # --- FIN CORRECCIÓN ---
            
            assert msg["type"] == "EVENT_STARTED"
            assert msg["payload"]["game_id"] == game_id
            assert msg["payload"]["event_by_player"] == player_id
            assert msg["payload"]["player_name"] == "Timer Player 1"
        
        # Verificamos que la tarea de fondo (countdown) fue llamada
        mock_countdown.assert_called_once()


def test_cancel_event(client):
    assert timer_player_id_1 is not None and timer_player_id_2 is not None
    
    game_id = 2
    room_id = "sala_cancel_test"
    player_id_1 = timer_player_id_1
    player_id_2 = timer_player_id_2

    # Mockeamos el 'countdown' para que no duerma
    with patch("src.event_timer.countdown", new_callable=AsyncMock):
        
        response_start = client.post(
            f"/game/{game_id}/event/start?room_id={room_id}", 
            json={"player_id": player_id_1}
        )
        assert response_start.status_code == 200, response_start.text

        response_cancel = client.post(
            f"/game/{game_id}/event/cancel?room_id={room_id}", 
            json={"player_id": player_id_2}
        )

    assert response_cancel.status_code == 200, response_cancel.text

    data = response_cancel.json()
    assert data["message"] == "Evento cancelado"
    assert data["room_id"] == room_id
    assert data["cancelled_by"] == player_id_2