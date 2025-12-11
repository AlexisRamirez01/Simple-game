import pytest
from unittest.mock import patch
from src.cards.models import DetectiveCard
from src.player.models import Player
from sqlalchemy import insert
from src.playerCard.models import player_card_table

created_player_id = None
created_detective_card_id = None
created_set_id = None
target_player_id = None
secret_card_id = None

def test_create_player(client):
    global created_player_id
    response = client.post(
        "/player/",
        json={
            "name": "Test Player",
            "avatar": "http://example.com/avatar.png",
            "birthdate": "2000-01-01",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": True,
            "rol": "innocent"
        }
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert "id" in data
    created_player_id = data["id"]

def test_create_detective_card(client):
    global created_detective_card_id
    response = client.post(
        "/detective-cards/",
        json={
            "name": "Sherlock Holmes",
            "description": "El mejor detective",
            "image_url": "http://example.com/sherlock.png",
            "is_murderes_escapes": False,
            "requiredAmount": 5
        }
    )
    assert response.status_code == 201, response.text
    data = response.json()
    created_detective_card_id = data["id"]

def test_create_detective_set(client):
    global created_set_id
    response = client.post(
        "/detective-set/",
        json={
            "id_owner": created_player_id,
            "main_detective": "Sherlock Holmes",
            "action_secret": "reveal_your",
            "is_cancellable": True,
            "wildcard_effects": "Oliver",
            "detective_card_ids": [created_detective_card_id]
        }
    )
    assert response.status_code == 201, response.text
    data = response.json()
    created_set_id = data["id"]
    assert data["owner"]["id"] == created_player_id
    card_ids_in_response = [card["id"] for card in data.get("cards", [])]
    assert created_detective_card_id in card_ids_in_response

def test_get_detective_set_by_id(client):
    response = client.get(f"/detective-set/{created_set_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_set_id

def test_get_sets_by_owner(client):
    response = client.get(f"/detective-set/owner/{created_player_id}")
    assert response.status_code == 200
    data = response.json()
    assert any(s["id"] == created_set_id for s in data)

def test_update_detective_set(client):
    response = client.put(
        f"/detective-set/{created_set_id}",
        json={
            "id_owner": created_player_id,
            "main_detective": "Hercule Poirot",
            "action_secret": "reveal_their",
            "is_cancellable": False,
            "wildcard_effects": "Satterthwaite",
            "detective_card_ids": []
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["action_secret"] == "reveal_their"
    assert data["is_cancellable"] is False
    assert data["wildcard_effects"] == "Satterthwaite"

def test_add_detective_to_set(client):
    response = client.post(f"/detective-set/{created_set_id}/add/{created_detective_card_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_set_id
    assert any(c["id"] == created_detective_card_id for c in data["cards"])


def test_get_cards_of_set(client):
    response = client.get(f"/detective-set/{created_set_id}/cards")
    assert response.status_code == 200
    data = response.json()
    assert any(c["id"] == created_detective_card_id for c in data)

def test_delete_detective_set(client):
    response = client.delete(f"/detective-set/{created_set_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_set_id

    response = client.get(f"/detective-set/{created_set_id}")
    assert response.status_code == 404

def test_play_set_endpoint_status_code(client, db_session):

    response_owner = client.post(
        "/player/",
        json={
            "name": "Set Owner Status Test",
            "avatar": "http://example.com/owner_status.png", 
            "birthdate": "2000-01-01",
            "is_Social_Disgrace": False, "is_Your_Turn": False, "is_Owner": True, "rol": "innocent"
        }
    )
    assert response_owner.status_code == 201
    owner_id = response_owner.json()["id"]

    response_target = client.post(
        "/player/",
        json={
            "name": "Target Player Status Test", 
            "avatar": "http://example.com/target_status.png", 
            "birthdate": "2001-01-01",
            "is_Social_Disgrace": False, "is_Your_Turn": False, "is_Owner": False, "rol": "innocent"
        }
    )
    assert response_target.status_code == 201
    target_id = response_target.json()["id"]

    response_d_card = client.post(
        "/detective-cards/",
        json={
            "name": "Test Card Status", "description": "Desc", 
            "image_url": "http://example.com/card_status.png",
            "is_murderes_escapes": False, "requiredAmount": 1
        }
    )
    assert response_d_card.status_code == 201
    detective_card_id = response_d_card.json()["id"]

    response_s_card = client.post(
        "/secret-cards/", 
        json={
            "name": "secret_test_card_status", "description": "Desc", 
            "image_url": "http://example.com/secret_status.png", 
            "is_murderes_escapes": False, 
            "is_murderer": False, "is_accomplice": False, "is_revealed": False 
        }
    )
    assert response_s_card.status_code == 201, response_s_card.text
    secret_card_id = response_s_card.json()["id"]

    db_session.execute(
        insert(player_card_table).values(
            player_id=target_id, 
            card_id=secret_card_id
        )
    )
    db_session.commit()

    response_set = client.post(
        "/detective-set/",
        json={
            "id_owner": owner_id,
            "main_detective": "Test Card Status",
            "action_secret": "reveal_their",
            "is_cancellable": True,
            "wildcard_effects": "Oliver",
            "detective_card_ids": [detective_card_id]
        }
    )
    assert response_set.status_code == 201
    set_id = response_set.json()["id"]

    response = client.post(f"/detective-set/play-set/{set_id}/{target_id}")
    assert response.status_code == 201, response.text
    

def test_get_players_with_sets(client):

    game_payload = {
        "name": "Game for Set Test",
        "max_players": 4, 
        "min_players": 2, 
        "current_players": 0,
        "is_started": False,
        "current_turn": 0,  
        "turn_id_player": 0 
    }
    response_game = client.post("/game/", json=game_payload)
    assert response_game.status_code == 201, response_game.text
    test_game_id = response_game.json()["id"]

    player_A_payload = {
        "name": "Player With Set", 
        "avatar": "http://example.com/avatarA.png", 
        "birthdate": "2000-01-01",
        "is_Social_Disgrace": False, "is_Your_Turn": False, "is_Owner": True, "rol": "innocent"
    }
    response_pA = client.post("/player/", json=player_A_payload)
    assert response_pA.status_code == 201, response_pA.text 
    player_A_id = response_pA.json()["id"]

    player_B_payload = {
        "name": "Player Without Set", 
        "avatar": "http://example.com/avatarB.png", 
        "birthdate": "2000-01-02",
        "is_Social_Disgrace": False, "is_Your_Turn": False, "is_Owner": False, "rol": "innocent"
    }
    response_pB = client.post("/player/", json=player_B_payload)
    assert response_pB.status_code == 201, response_pB.text 
    player_B_id = response_pB.json()["id"]

    
    join_payload_A = {"position_id_player": 1}
    response_join_A = client.post(
        f"/game/{test_game_id}/{player_A_id}",
        json=join_payload_A
    )
    assert response_join_A.status_code == 201, response_join_A.text

    join_payload_B = {"position_id_player": 2}
    response_join_B = client.post(
        f"/game/{test_game_id}/{player_B_id}",
        json=join_payload_B
    )
    assert response_join_B.status_code == 201, response_join_B.text

    card_payload = {
        "name": "Card for Set Test", 
        "description": "Desc", 
        "image_url": "http://example.com/card.png",
        "is_murderes_escapes": False, "requiredAmount": 1
    }
    response_card = client.post("/detective-cards/", json=card_payload)
    assert response_card.status_code == 201, response_card.text 
    card_id = response_card.json()["id"]

    response_set = client.post(
        "/detective-set/",
        json={
            "id_owner": player_A_id,
            "main_detective": "Card for Set Test",
            "action_secret": "reveal_your",
            "is_cancellable": True,
            "wildcard_effects": "Oliver",
            "detective_card_ids": [card_id]
        }
    )
    assert response_set.status_code == 201, response_set.text

    response = client.get(f"/detective-set/players/with-sets/{test_game_id}")
    assert response.status_code == 200, response.text
    
    data = response.json()
    assert isinstance(data, list)
    assert player_A_id in data
    assert player_B_id not in data
    assert len(data) == 1