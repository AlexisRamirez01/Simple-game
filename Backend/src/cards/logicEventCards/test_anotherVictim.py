import pytest
import json
from fastapi import status
from unittest.mock import patch, MagicMock, AsyncMock
from src.detectiveSet.models import DetectiveSet

from src.gamePlayer.models import PlayerGame
from src.playerCard.models import player_card_table
from sqlalchemy import insert

av_player_id_1 = None 
av_player_id_2 = None
av_game_id = None
av_card_id = None 
av_set_id = None 

def test_create_av_players(client):
    """Crea los jugadores para el test."""
    global av_player_id_1, av_player_id_2
    
    response1 = client.post(
        "/player",
        json={
            "name": "AV Victim",
            "birthdate": "1990-01-01",
            "avatar": "http://example.com/victim.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "innocent"
        },
    )
    assert response1.status_code == status.HTTP_201_CREATED
    av_player_id_1 = response1.json()["id"]

    response2 = client.post(
        "/player",
        json={
            "name": "AV Attacker",
            "birthdate": "1991-02-02",
            "avatar": "http://example.com/attacker.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent"
        },
    )
    assert response2.status_code == status.HTTP_201_CREATED
    av_player_id_2 = response2.json()["id"]

def test_create_av_game(client):
    """Crea la partida."""
    global av_game_id
    response = client.post(
        "/game",
        json={
            "name": "Another Victim Game",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": True,
            "current_turn": 0,
            "turn_id_player": av_player_id_2
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    av_game_id = response.json()["id"]

def test_create_av_event_card(client):
    """Crea la carta de evento 'event_anothervictim'."""
    global av_card_id
    EVENT_NAME = "event_anothervictim" 
    
    response = client.post(
        "/event-cards/",
        json={
            "name": EVENT_NAME, 
            "description": "Roba un set de detective.",
            "image_url": "http://example.com/av.png",
            "is_murderes_escapes": False,
            "was_played": False,
            "was_traded": False,
            "is_cancellable": True
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    av_card_id = data["id"]
    assert data["name"] == EVENT_NAME


def test_setup_av_db_state(client, db_session):
    """
    Prepara el estado de la DB:
    1. Linkea a P1 y P2 a la partida.
    2. Da la carta 'event_anothervictim' a P2 (Atacante).
    3. Crea un DetectiveSet y se lo da a P1 (Víctima).
    """
    assert all([av_player_id_1, av_player_id_2, av_game_id, av_card_id])
    
    global av_set_id

    try:
        client.post(f"/game/{av_game_id}/{av_player_id_1}", json={"position_id_player": 0})
        client.post(f"/game/{av_game_id}/{av_player_id_2}", json={"position_id_player": 1})

        db_session.execute(
            insert(player_card_table).values(
                player_id=av_player_id_2, 
                card_id=av_card_id
            )
        )
        
        victim_set = DetectiveSet(
            id_owner=av_player_id_1,
            main_detective="Holmes",
            action_secret="reveal_your",
            is_cancellable=True,
            wildcard_effects="Oliver"
        )
        
        db_session.add(victim_set)
        db_session.commit()
        
        av_set_id = victim_set.id
        
    except Exception as e:
        db_session.rollback()
        pytest.fail(f"Falló el setup de la DB para AV: {e}")

def test_execute_another_victim_happy_path(client, db_session):
    """
    Test del "Happy Path"
    """
    assert all([
        av_player_id_1, av_player_id_2, 
        av_game_id, av_card_id, av_set_id
    ])
    
    payload = {
        "game_id": av_game_id,
        "player_id": av_player_id_2,   
        "selected_set_id": av_set_id   
    }
    room_id = str(av_game_id)

    with patch("src.cards.logicEventCards.anotherVictim.manager.broadcast", new_callable=AsyncMock) as mock_broadcast, \
         patch("src.cards.logicEventCards.anotherVictim.discard_card") as mock_discard_card:
        
        mock_event_card_discarded = MagicMock()
        mock_event_card_discarded.to_schema.return_value = {
            "id": av_card_id,
            "name": "event_anothervictim",
            "description": "Test Desc",
            "image_url": "http://test.com/img.png",
            "is_murderes_escapes": False
        }
        
        mock_discard_card.return_value = {
            "player_id": av_player_id_2,
            "card_id": av_card_id,
            "card_discard": mock_event_card_discarded
        }
        
        response = client.put(
            f"/event-cards/play/{av_card_id}",
            json=payload,
            params={"room_id": room_id}
        )

        assert response.status_code == status.HTTP_200_OK, response.text
        data = response.json()
        assert data["id"] == av_card_id
        assert data["was_played"] is True

        mock_discard_card.assert_called_once()
        args, kwargs = mock_discard_card.call_args
        assert kwargs.get("game_id") == av_game_id
        assert kwargs.get("player_id") == av_player_id_2
        assert kwargs.get("card_id") == av_card_id
        
        assert mock_broadcast.call_count == 2

        ws1_data = json.loads(mock_broadcast.call_args_list[0][0][0])
        assert ws1_data["type"] == "gamePlayerDiscard"
        assert ws1_data["payload"]["player_id"] == av_player_id_2

        ws2_data = json.loads(mock_broadcast.call_args_list[1][0][0])
        assert ws2_data["type"] == "detectiveSetUpdate" 
        assert ws2_data["payload"]["id"] == av_set_id
        
        assert ws2_data["payload"]["owner"]["id"] == av_player_id_2

    victim_set_after = db_session.get(DetectiveSet, av_set_id)
    db_session.refresh(victim_set_after)
    
    assert victim_set_after.id_owner == av_player_id_2

def test_execute_av_discard_fails(client):
    """
    Test de fallo: El servicio 'discard_card' falla.
    """
    payload = {
        "game_id": av_game_id,
        "player_id": av_player_id_2,
        "selected_set_id": av_set_id
    }
    room_id = str(av_game_id)
    
    with patch("src.cards.logicEventCards.anotherVictim.discard_card", side_effect=Exception("Boom Descarte")):
        
        response = client.put(
            f"/event-cards/play/{av_card_id}",
            json=payload,
            params={"room_id": room_id}
        )
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Falló el PASO 1 (Descarte de ATV)" in response.json()["detail"]

def test_execute_av_set_change_fails(client):
    """
    Test de fallo: El 'selected_set_id' no existe.
    """
    payload = {
        "game_id": av_game_id,
        "player_id": av_player_id_2,
        "selected_set_id": 99999
    }
    room_id = str(av_game_id)
    
    with patch("src.cards.logicEventCards.anotherVictim.discard_card") as mock_discard_card:
        
        mock_event_card_discarded = MagicMock()
        mock_event_card_discarded.to_schema.return_value = {
            "id": av_card_id, "name": "event_anothervictim", "description": "...", 
            "image_url": "...", "is_murderes_escapes": False
        }
        mock_discard_card.return_value = {
            "player_id": av_player_id_2, "card_id": av_card_id, 
            "card_discard": mock_event_card_discarded
        }
        
        response = client.put(
            f"/event-cards/play/{av_card_id}",
            json=payload,
            params={"room_id": room_id}
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND