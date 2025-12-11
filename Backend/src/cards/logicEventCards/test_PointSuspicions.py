import pytest
import json
from fastapi import status
from unittest.mock import patch, MagicMock, AsyncMock
from collections import defaultdict

created_player_id_pys = None
created_game_id_pys = None
created_card_pys_id = None


def test_create_player_pys(client):
    """Crea el jugador que usará la carta PointYourSuspicions."""
    global created_player_id_pys
    response = client.post(
        "/player",
        json={
            "name": "Detective PYS",
            "birthdate": "1987-10-10",
            "avatar": "http://example.com/pys_detective.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent"
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    created_player_id_pys = data["id"]


def test_create_game_pys(client):
    """Crea la partida para PointYourSuspicions."""
    global created_game_id_pys
    response = client.post(
        "/game",
        json={
            "name": "PYS Game",
            "max_players": 6,
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
    created_game_id_pys = data["id"]


def test_create_point_your_suspicions_card(client):
    """Crea la carta 'event_point_your_suspicions' (exacto para el match/case)."""
    global created_card_pys_id
    response = client.post(
        "/event-cards/",
        json={
            "name": "event_pointsuspicions",
            "description": "Carta de acusar sospechoso",
            "image_url": "http://example.com/pys_card.png",
            "is_murderes_escapes": False,
            "was_played": False,
            "was_traded": False,
            "is_cancellable": False
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    created_card_pys_id = data["id"]
    assert data["name"] == "event_pointsuspicions"

def test_play_point_your_suspicions_event(client):
    """
    Verifica que al jugar 'PointYourSuspicions' se descarte la carta
    y se emitan los WS correctos (Discard y SuspiciousPlayer).
    """
    assert all([created_player_id_pys, created_game_id_pys, created_card_pys_id])

    payload = {
        "game_id": created_game_id_pys,
        "player_id": created_player_id_pys,
        "end_votation": True 
    }
    room_id = str(created_game_id_pys)

    with patch("src.cards.logicEventCards.point_suspicions_service.manager.broadcast", new_callable=AsyncMock) as mock_broadcast, \
         patch("src.cards.logicEventCards.point_suspicions_service.discard_card") as mock_discard_card, \
         patch("src.cards.logicEventCards.point_suspicions_service.Votes_received", {created_game_id_pys: [(1, 2), (3, 2)]}), \
         patch("src.cards.logicEventCards.point_suspicions_service.End_votation", {}), \
         patch("src.cards.logicEventCards.point_suspicions_service.Order_vote", {}), \
         patch("src.cards.logicEventCards.point_suspicions_service.Current_voter_index", {}):
        
        mock_card_discarded = MagicMock()
        mock_card_discarded.to_schema.return_value = {
            "id": created_card_pys_id,
            "name": "event_pointsuspicions",
            "description": "Descartar carta PYS",
            "image_url": "http://example.com/discard.png",
            "is_murderes_escapes": False
        }
        mock_discard_card.return_value = {
            "player_id": created_player_id_pys,
            "card_id": created_card_pys_id,
            "card_discard": mock_card_discarded
        }

        response = client.put(
            f"/event-cards/play/{created_card_pys_id}",
            json=payload,
            params={"room_id": room_id}
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == created_card_pys_id
        assert data["was_played"] is True

        mock_discard_card.assert_called_once()
        _, kwargs = mock_discard_card.call_args
        assert kwargs["game_id"] == created_game_id_pys
        assert kwargs["player_id"] == created_player_id_pys
        assert kwargs["card_id"] == created_card_pys_id

        assert mock_broadcast.call_count == 2

        ws1_data = json.loads(mock_broadcast.call_args_list[0][0][0])
        assert ws1_data["type"] == "gamePlayerDiscard"
        assert ws1_data["payload"]["player_id"] == created_player_id_pys
        assert ws1_data["payload"]["card_discard"]["name"] == "event_pointsuspicions"

        ws2_data = json.loads(mock_broadcast.call_args_list[1][0][0])
        assert ws2_data["type"] == "playerSuspicious"
        assert ws2_data["payload"]["end_votation"] is True
        assert "suspicious_playerId" in ws2_data["payload"]
