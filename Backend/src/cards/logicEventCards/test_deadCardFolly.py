import pytest
import json
from fastapi import status
from unittest.mock import patch, MagicMock, AsyncMock


created_player_id_1 = None
created_player_id_2 = None
created_player_id_3 = None
created_game_id_1 = None
created_card_id = None


def test_create_player_one(client):
    global created_player_id_1
    response = client.post(
        "/player",
        json={
            "name": "DeadFolly Player 1",
            "birthdate": "1990-01-01",
            "avatar": "http://example.com/avatar1.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent",
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    created_player_id_1 = data["id"]


def test_create_player_two(client):
    global created_player_id_2
    response = client.post(
        "/player",
        json={
            "name": "DeadFolly Player 2",
            "birthdate": "1991-02-02",
            "avatar": "http://example.com/avatar2.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "innocent",
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    created_player_id_2 = data["id"]


def test_create_player_three(client):
    global created_player_id_3
    response = client.post(
        "/player",
        json={
            "name": "DeadFolly Player 3",
            "birthdate": "1992-03-03",
            "avatar": "http://example.com/avatar3.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "innocent",
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    created_player_id_3 = data["id"]


def test_create_game(client):
    global created_game_id_1
    response = client.post(
        "/game",
        json={
            "name": "DeadFolly Game",
            "max_players": 6,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0,
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    created_game_id_1 = data["id"]


def test_create_deadcardfolly_card(client):
    global created_card_id
    response = client.post(
        "/event-cards/",
        json={
            "name": "event_deadcardfolly",
            "description": "Dead Card Folly",
            "image_url": "http://example.com/deadfolly.png",
            "is_murderes_escapes": False,
            "was_played": False,
            "was_traded": False,
            "is_cancellable": False,
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data["name"] == "event_deadcardfolly"
    created_card_id = data["id"]


def test_play_deadcardfolly_right_direction(client):
    assert all([created_player_id_1, created_player_id_2, created_player_id_3, created_game_id_1, created_card_id])

    payload = {
        "game_id": created_game_id_1,
        "player_id": created_player_id_1,

    }
    room_id = str(created_game_id_1)

    client.post(f"/game/{created_game_id_1}/{created_player_id_1}", json={"position_id_player": None})
    client.post(f"/game/{created_game_id_1}/{created_player_id_2}", json={"position_id_player": None})
    client.post(f"/game/{created_game_id_1}/{created_player_id_3}", json={"position_id_player": None})

    with patch("src.cards.logicEventCards.deadCardFolly.manager.broadcast", new_callable=AsyncMock) as mock_broadcast, \
         patch("src.cards.logicEventCards.deadCardFolly.discard_card") as mock_discard_card:

        mock_card_discarded = MagicMock()
        mock_card_discarded.to_schema.return_value = {
            "id": created_card_id,
            "name": "event_deadcardfolly",
            "description": "discarded",
            "image_url": "http://example.com/x.png",
            "is_murderes_escapes": False,
        }

        mock_discard_card.return_value = {
            "player_id": created_player_id_1,
            "card_id": created_card_id,
            "card_discard": mock_card_discarded,
        }

        response = client.put(
            f"/event-cards/play/{created_card_id}",
            json=payload,
            params={"room_id": room_id},
        )

        assert response.status_code == status.HTTP_200_OK
        resp = response.json()
        assert resp["id"] == created_card_id
        assert resp["was_played"] is True

        mock_discard_card.assert_called_once()

        assert mock_broadcast.call_count == 1 + 3

        call_discard_str = mock_broadcast.call_args_list[0][0][0]
        data_discard = json.loads(call_discard_str)
        assert data_discard["type"] == "gamePlayerDiscard"
        assert data_discard["payload"]["player_id"] == created_player_id_1

        player_ids_in_order = [created_player_id_1, created_player_id_2, created_player_id_3]

        for idx, player_id in enumerate(player_ids_in_order):
            call_str = mock_broadcast.call_args_list[1 + idx][0][0]
            data = json.loads(call_str)
            assert data["type"] == "card_trade_request"
            target = data["payload"]["target_id"]
            other = data["payload"]["other_player_id"]
            expected_partner = player_ids_in_order[(idx + 1) % len(player_ids_in_order)]
            assert target == player_id
            assert other == expected_partner


def test_play_deadcardfolly_not_enough_players(client):
    r = client.post(
        "/player",
        json={
            "name": "Solo Player",
            "birthdate": "1980-01-01",
            "avatar": "http://example.com/solo.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent",
        },
    )
    assert r.status_code == status.HTTP_201_CREATED
    solo_player_id = r.json()["id"]

    r = client.post(
        "/game",
        json={
            "name": "Solo Game",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0,
        },
    )
    assert r.status_code == status.HTTP_201_CREATED
    game_id = r.json()["id"]

    r = client.post(
        "/event-cards/",
        json={
            "name": "event_deadcardfolly",
            "description": "Dead Card Folly Solo",
            "image_url": "http://example.com/deadfolly2.png",
            "is_murderes_escapes": False,
            "was_played": False,
            "was_traded": False,
            "is_cancellable": False,
        },
    )
    assert r.status_code == status.HTTP_201_CREATED
    card_id = r.json()["id"]
    payload = {"game_id": game_id, "player_id": solo_player_id}
    room_id = str(game_id)

    # join solo player to the game so the DB query returns one player (do this BEFORE patching broadcast)
    client.post(f"/game/{game_id}/{solo_player_id}", json={"position_id_player": None})

    with patch("src.cards.logicEventCards.deadCardFolly.manager.broadcast", new_callable=AsyncMock) as mock_broadcast, \
        patch("src.cards.logicEventCards.deadCardFolly.discard_card") as mock_discard_card:

        mock_card_discarded = MagicMock()
        mock_card_discarded.to_schema.return_value = {
            "id": card_id,
            "name": "event_deadcardfolly",
            "description": "solo",
            "image_url": "http://example.com/x.png",
            "is_murderes_escapes": False,
        }

        mock_discard_card.return_value = {
            "player_id": solo_player_id,
            "card_id": card_id,
            "card_discard": mock_card_discarded,
        }

        response = client.put(f"/event-cards/play/{card_id}", json=payload, params={"room_id": room_id})
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == card_id

        assert mock_broadcast.call_count == 1


def test_play_deadcardfolly_left_direction(client):
    assert all([created_player_id_1, created_player_id_2, created_player_id_3, created_game_id_1, created_card_id])

    payload = {
        "game_id": created_game_id_1,
        "player_id": created_player_id_1,
        "trade_direction": "left",
    }
    room_id = str(created_game_id_1)
    
    client.post(f"/game/{created_game_id_1}/{created_player_id_1}", json={"position_id_player": None})
    client.post(f"/game/{created_game_id_1}/{created_player_id_2}", json={"position_id_player": None})
    client.post(f"/game/{created_game_id_1}/{created_player_id_3}", json={"position_id_player": None})

    with patch("src.cards.logicEventCards.deadCardFolly.manager.broadcast", new_callable=AsyncMock) as mock_broadcast, \
         patch("src.cards.logicEventCards.deadCardFolly.discard_card") as mock_discard_card:

        mock_card_discarded = MagicMock()
        mock_card_discarded.to_schema.return_value = {
            "id": created_card_id,
            "name": "event_deadcardfolly",
            "description": "discarded",
            "image_url": "http://example.com/x.png",
            "is_murderes_escapes": False,
        }

        mock_discard_card.return_value = {
            "player_id": created_player_id_1,
            "card_id": created_card_id,
            "card_discard": mock_card_discarded,
        }

        response = client.put(
            f"/event-cards/play/{created_card_id}", json=payload, params={"room_id": room_id}
        )

        assert response.status_code == status.HTTP_200_OK
        assert mock_broadcast.call_count == 4
        player_ids_in_order = [created_player_id_1, created_player_id_2, created_player_id_3]
        for idx, player_id in enumerate(player_ids_in_order):
            call_str = mock_broadcast.call_args_list[1 + idx][0][0]
            data = json.loads(call_str)
            assert data["type"] == "card_trade_request"
            expected_partner = player_ids_in_order[(idx - 1) % len(player_ids_in_order)]
            assert data["payload"]["target_id"] == player_id
            assert data["payload"]["other_player_id"] == expected_partner


def test_play_deadcardfolly_discard_exception_returns_500(client):
    r = client.post(
        "/player",
        json={
            "name": "Err Player",
            "birthdate": "1970-01-01",
            "avatar": "http://example.com/err.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent",
        },
    )
    assert r.status_code == status.HTTP_201_CREATED
    err_player_id = r.json()["id"]

    r = client.post(
        "/game",
        json={
            "name": "Err Game",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0,
        },
    )
    assert r.status_code == status.HTTP_201_CREATED
    err_game_id = r.json()["id"]

    r = client.post(
        "/event-cards/",
        json={
            "name": "event_deadcardfolly",
            "description": "Dead Card Folly Err",
            "image_url": "http://example.com/deadfolly3.png",
            "is_murderes_escapes": False,
            "was_played": False,
            "was_traded": False,
            "is_cancellable": False,
        },
    )
    assert r.status_code == status.HTTP_201_CREATED
    err_card_id = r.json()["id"]

    client.post(f"/game/{err_game_id}/{err_player_id}", json={"position_id_player": None})

    payload = {"game_id": err_game_id, "player_id": err_player_id}

    with patch("src.cards.logicEventCards.deadCardFolly.discard_card", side_effect=Exception("boom")):
        response = client.put(f"/event-cards/play/{err_card_id}", json=payload, params={"room_id": str(err_game_id)})
        assert response.status_code == 500
        assert "Error al descartar 'Dead Card Folly'" in response.json()["detail"]
