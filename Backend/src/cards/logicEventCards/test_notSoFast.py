import pytest
import asyncio
from fastapi import status
from src.cards.logicEventCards.notSoFast import event_state_service, NotSoFast


def test_create_player_1(client):
    response = client.post(
        "/player",
        json={
            "name": "Test Player 1",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar1.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": False,
            "rol": "innocent"
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    global created_player_id_1
    created_player_id_1 = data["id"]


    response = client.post(
        "/player",
        json={
            "name": "Test Player 2",
            "birthdate": "1993-05-20",
            "avatar": "http://example.com/avatar2.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "murderer"
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    global created_player_id_2
    created_player_id_2 = data["id"]

def test_create_game_1(client):
    response = client.post(
        "/game",
        json={
            "name": "Test Game 1",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    global created_game_id_1
    created_game_id_1 = data["id"]

def test_create_event_card(client):
    """
    Test creating a new EventCard.
    """
    global created_event_card_id
    response = client.post(
        "/event-cards/",
        json={
            "name": "Tormenta mágica",
            "description": "Causa confusión a todos los jugadores.",
            "image_url": "http://example.com/storm.png",
            "is_murderes_escapes": False,
            "was_played": False,
            "was_traded": False,
            "is_cancellable": True
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    created_event_card_id = data["id"]

    assert data["name"] == "Tormenta mágica"
    assert data["is_cancellable"] is True

def test_event_start_and_cancel(client):
    game_id = 100
    room_id = "room_test"

    response = client.post(f"/game/{game_id}/event/start?room_id={room_id}", json={"player_id": 1})
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Evento iniciado"
    assert data["room_id"] == room_id

    assert event_state_service.get_state(game_id) is None

    response = client.post(f"/game/{game_id}/event/cancel?room_id={room_id}", json={"player_id": 1})
    assert response.status_code == 200
    cancel_data = response.json()
    assert cancel_data["message"] == "Evento cancelado"
    assert cancel_data["room_id"] == room_id
    assert cancel_data["cancelled_by"] == 1

def test_event_state_toggle_and_finalize(client):
    """
    Prueba que toggle cambia el estado y finalize devuelve el estado correcto
    """
    game_id = str(999)
    room_id = "room_test_state"

    assert event_state_service.get_state(game_id) is None

    import asyncio
    asyncio.run(event_state_service.toggle(game_id))
    assert event_state_service.get_state(game_id) == "cancelled"
    
    asyncio.run(event_state_service.toggle(game_id))
    assert event_state_service.get_state(game_id) == "active"

    final_state = asyncio.run(event_state_service.finalize(game_id))
    assert final_state == "active"
    assert event_state_service.get_state(game_id) is None

def test_execute_not_so_fast_card(client):
    payload = {
        "game_id": created_game_id_1,
        "player_id": created_player_id_1
    }
    room_id = "room_nsf"
    response = client.put(
        f"/event-cards/play/{created_event_card_id}?room_id={room_id}",
        json=payload
    )
    assert response.status_code == 200
