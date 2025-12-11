import pytest
from unittest.mock import patch

created_event_card_id = None

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
    print(response)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    created_event_card_id = data["id"]

    assert data["name"] == "Tormenta mágica"
    assert data["is_cancellable"] is True


def test_get_event_card_by_id(client):
    """
    Test retrieving an EventCard by its ID.
    """
    response = client.get(f"/event-cards/{created_event_card_id}")
    assert response.status_code == 200
    data = response.json()

    assert data["id"] == created_event_card_id
    assert data["name"] == "Tormenta mágica"
    assert data["is_cancellable"] is True


def test_update_event_card(client):
    """
    Test updating an existing EventCard.
    """
    response = client.put(
        f"/event-cards/{created_event_card_id}",
        json={
            "name": "Tormenta mágica",
            "description": "Causa confusión a todos los jugadores.",
            "image_url": "http://example.com/storm.png",
            "is_murderes_escapes": False,
            "was_played": True,
            "was_traded": False,
            "is_cancellable": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["was_played"] is True

def test_play_event_card_logic(client):
    response_create_train = client.post(
        "/event-cards/",
        json={
            "name": "event_earlytrain",
            "description": "Carta de Early Train To Paddington",
            "image_url": "http://example.com/train.png",
            "is_murderes_escapes": False,
            "was_played": False,
            "was_traded": False,
            "is_cancellable": False
        }
    )
    assert response_create_train.status_code == 201
    event_card_train = response_create_train.json()
    card_id_train = event_card_train["id"]

    payload_train = {"game_id": 1, "player_id": 2}

    with patch(
        "src.cards.servicesEventCard.EarlyTrainToPaddingtonService.execute",
        return_value=None
    ) as mock_train:
        response_play_train = client.put(
            f"/event-cards/play/{card_id_train}",
            json=payload_train,
            params={"room_id": "1"}
        )

    assert response_play_train.status_code == 200
    played_card_train = response_play_train.json()
    assert played_card_train["id"] == card_id_train
    assert played_card_train["was_played"] is True
    assert played_card_train["name"] == "event_earlytrain"
    
    mock_train.assert_called_once_with(
        card_id_played=card_id_train,
        payload=payload_train
    )

    response_create_delay = client.post(
        "/event-cards/",
        json={
            "name": "event_delayescape",
            "description": "Carta Delay The Murderer's Escape",
            "image_url": "http://example.com/delay.png",
            "is_murderes_escapes": True,
            "was_played": False,
            "was_traded": False,
            "is_cancellable": False
        }
    )
    assert response_create_delay.status_code == 201
    event_card_delay = response_create_delay.json()
    card_id_delay = event_card_delay["id"]

    payload_delay = {
        "game_id": 1,
        "player_id": 2,
        "cards": [10, 11, 12]
    }

    with patch(
        "src.cards.servicesEventCard.DelayTheMurderersEscapeService.execute",
        return_value=None
    ) as mock_delay:
        response_play_delay = client.put(
            f"/event-cards/play/{card_id_delay}",
            json=payload_delay,
            params={"room_id": "1"}
        )

    assert response_play_delay.status_code == 200
    played_card_delay = response_play_delay.json()
    assert played_card_delay["id"] == card_id_delay
    assert played_card_delay["was_played"] is True
    assert played_card_delay["name"] == "event_delayescape"

    mock_delay.assert_called_once_with(
        card_id_played=card_id_delay,
        payload=payload_delay
    )

    response_create_point = client.post(
        "/event-cards/",
        json={
            "name": "event_pointsuspicions",
            "description": "Carta Point Your Suspicions",
            "image_url": "http://example.com/point.png",
            "is_murderes_escapes": False,
            "was_played": False,
            "was_traded": False,
            "is_cancellable": False
        }
    )

    assert response_create_point.status_code == 201
    event_card_point = response_create_point.json()
    card_id_point = event_card_point["id"]

    payload_point = {
        "game_id": 1,
        "player_id": 2,
        "end_votation": True
    }

    with patch(
        "src.cards.servicesEventCard.PointYourSuspicions.execute",
        return_value=None
    ) as mock_point:
        response_play_point = client.put(
            f"/event-cards/play/{card_id_point}",
            json=payload_point,
            params={"room_id": "1"}
        )

    assert response_play_point.status_code == 200
    played_card_point = response_play_point.json()
    assert played_card_point["id"] == card_id_point
    assert played_card_point["was_played"] is True
    assert played_card_point["name"] == "event_pointsuspicions"

    mock_point.assert_called_once_with(
        payload=payload_point,
        card_played_id=card_id_point,
        room_id="1"
    )


def test_is_event_card_cancellable(client):
    """
    Test checking if an EventCard is cancellable.
    """
    response = client.get(f"/event-cards/{created_event_card_id}/is-cancellable")
    assert response.status_code == 200
    data = response.json()
    assert data["card_id"] == created_event_card_id
    assert data["is_cancellable"] is True


def test_is_event_card_cancellable_not_found(client):
    """
    Test checking is-cancellable for a non-existent EventCard.
    """
    response = client.get("/event-cards/99999/is-cancellable")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_delete_event_card(client):
    """
    Test deleting an EventCard by ID.
    """
    response = client.delete(f"/event-cards/{created_event_card_id}")
    assert response.status_code == 204

    response_check = client.get(f"/event-cards/{created_event_card_id}")
    assert response_check.status_code == 404