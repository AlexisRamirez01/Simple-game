import pytest
import json
from fastapi import status
from unittest.mock import patch, MagicMock, AsyncMock
from src.cards.models import Card, EventCard
from src.gameCard.models import GameCard
from src.gamePlayer.models import PlayerGame
from src.playerCard.models import player_card_table
from sqlalchemy import insert

cott_player_id_1 = None 
cott_player_id_2 = None 
cott_game_id = None
cott_event_card_id = None 
cott_nsf_card_id_1 = None 
cott_nsf_card_id_2 = None 
cott_other_card_id = None 

def test_create_cott_players(client):
    """Crea los jugadores para el test."""
    global cott_player_id_1, cott_player_id_2
    
    response1 = client.post(
        "/player",
        json={
            "name": "COTT Attacker",
            "birthdate": "1990-01-01",
            "avatar": "http://example.com/attacker.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent"
        },
    )
    assert response1.status_code == status.HTTP_201_CREATED
    cott_player_id_1 = response1.json()["id"]

    response2 = client.post(
        "/player",
        json={
            "name": "COTT Victim",
            "birthdate": "1991-02-02",
            "avatar": "http://example.com/victim.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "innocent"
        },
    )
    assert response2.status_code == status.HTTP_201_CREATED
    cott_player_id_2 = response2.json()["id"]

def test_create_cott_game(client):
    """Crea la partida."""
    global cott_game_id
    response = client.post(
        "/game",
        json={
            "name": "Cards Off The Table Game",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": True,
            "current_turn": 0,
            "turn_id_player": cott_player_id_1
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    cott_game_id = response.json()["id"]

def test_create_cott_cards(client):
    global cott_event_card_id, cott_nsf_card_id_1, cott_nsf_card_id_2, cott_other_card_id
    
    # 1. La carta de evento principal
    response_cott = client.post(
        "/event-cards/",
        json={
            "name": "event_cardsonthetable",
            "description": "Descarta todos los 'Not So Fast' de un oponente.",
            "image_url": "http://example.com/cott.png",
            "is_murderes_escapes": False,
            "was_played": False, "was_traded": False, "is_cancellable": False
        }
    )
    assert response_cott.status_code == status.HTTP_201_CREATED
    cott_event_card_id = response_cott.json()["id"]
    
    # 2. El primer "Not So Fast" 
    response_nsf1 = client.post(
        "/event-cards/",
        json={
            "name": "Instant_notsofast",
            "description": "Carta Not So Fast 1",
            "image_url": "http://example.com/nsf.png",
            "is_murderes_escapes": False,
            "was_played": False, "was_traded": False, "is_cancellable": False
        }
    )
    assert response_nsf1.status_code == status.HTTP_201_CREATED
    cott_nsf_card_id_1 = response_nsf1.json()["id"]

    # 3. El segundo "Not So Fast"
    response_nsf2 = client.post(
        "/event-cards/",
        json={
            "name": "Instant_notsofast",
            "description": "Carta Not So Fast 2",
            "image_url": "http://example.com/nsf.png",
            "is_murderes_escapes": False,
            "was_played": False, "was_traded": False, "is_cancellable": False
        }
    )
    assert response_nsf2.status_code == status.HTTP_201_CREATED
    cott_nsf_card_id_2 = response_nsf2.json()["id"]

    response_other = client.post(
        "/detective-cards/",
        json={
            "name": "Detective Random",
            "description": "No debe ser descartada",
            "image_url": "http://example.com/other.png",
            "is_murderes_escapes": False,
            "requiredAmount": 3
        }
    )
    assert response_other.status_code == status.HTTP_201_CREATED
    cott_other_card_id = response_other.json()["id"]


def test_setup_cott_db_state(client, db_session):
    """
    Prepara el estado de la DB:
    1. Linkea P1 y P2 a la partida.
    2. Da la carta COTT a P1.
    3. Da las 3 cartas (2 NSF, 1 Otra) a P2.
    4. Linkea todas las 4 cartas a la partida (GameCard).
    """
    assert all([
        cott_player_id_1, cott_player_id_2, cott_game_id, 
        cott_event_card_id, cott_nsf_card_id_1, cott_nsf_card_id_2, cott_other_card_id
    ])

    try:
        client.post(f"/game/{cott_game_id}/{cott_player_id_1}", json={"position_id_player": 0})
        client.post(f"/game/{cott_game_id}/{cott_player_id_2}", json={"position_id_player": 1})

        db_session.execute(
            insert(player_card_table).values(
                player_id=cott_player_id_1, 
                card_id=cott_event_card_id
            )
        )
        
        db_session.execute(
            insert(player_card_table).values(
                [
                    {"player_id": cott_player_id_2, "card_id": cott_nsf_card_id_1},
                    {"player_id": cott_player_id_2, "card_id": cott_nsf_card_id_2},
                    {"player_id": cott_player_id_2, "card_id": cott_other_card_id}
                ]
            )
        )
        
        db_session.add_all([
            GameCard(game_id=cott_game_id, card_id=cott_event_card_id),
            GameCard(game_id=cott_game_id, card_id=cott_nsf_card_id_1),
            GameCard(game_id=cott_game_id, card_id=cott_nsf_card_id_2),
            GameCard(game_id=cott_game_id, card_id=cott_other_card_id),
        ])
        
        db_session.commit()
        
    except Exception as e:
        db_session.rollback()
        pytest.fail(f"Falló el setup de la DB para COTT: {e}")


def _create_full_mock_schema(card_id, name):
    """crear un schema de carta completo para Pydantic."""
    return {
        "id": card_id,
        "name": name,
        "description": "Test Desc",
        "image_url": "http://test.com/img.png",
        "is_murderes_escapes": False
    }

def discard_side_effect(db, game_id, player_id, card_id):
    """
    Simular las múltiples llamadas a discard_card.
    """
    if card_id == cott_nsf_card_id_1:
        return {
            "player_id": cott_player_id_2, "card_id": card_id, 
            "card_discard": MagicMock(to_schema=lambda: _create_full_mock_schema(card_id, "Instant_notsofast"))
        }
    if card_id == cott_nsf_card_id_2:
        return {
            "player_id": cott_player_id_2, "card_id": card_id,
            "card_discard": MagicMock(to_schema=lambda: _create_full_mock_schema(card_id, "Instant_notsofast"))
        }
    if card_id == cott_event_card_id:
        return {
            "player_id": cott_player_id_1, "card_id": card_id,
            "card_discard": MagicMock(to_schema=lambda: _create_full_mock_schema(card_id, "event_cardsonthetable"))
        }
    raise ValueError(f"Llamada inesperada a discard_card con card_id: {card_id}")


def test_execute_cards_off_the_table_happy_path(client):
    """
    Test del "Happy Path"
    """
    assert all([cott_player_id_1, cott_player_id_2, cott_game_id, cott_event_card_id])
    
    payload = {
        "game_id": cott_game_id,
        "player_id": cott_player_id_1,   
        "target_player_id": cott_player_id_2
    }
    room_id = str(cott_game_id)

    with patch("src.cards.logicEventCards.cardsOffTheTable.manager.broadcast", new_callable=AsyncMock) as mock_broadcast, \
         patch("src.cards.logicEventCards.cardsOffTheTable.discard_card") as mock_discard_card:
        
        mock_discard_card.side_effect = discard_side_effect
        
        response = client.put(
            f"/event-cards/play/{cott_event_card_id}",
            json=payload,
            params={"room_id": room_id}
        )

        assert response.status_code == status.HTTP_200_OK, response.text
        data = response.json()
        
        assert data["id"] == cott_event_card_id
        assert data["was_played"] is True

        assert mock_discard_card.call_count == 3
        assert mock_broadcast.call_count == 3

        ws1_data = json.loads(mock_broadcast.call_args_list[0][0][0])
        assert ws1_data["type"] == "gamePlayerDiscard"
        assert ws1_data["payload"]["player_id"] == cott_player_id_2
        assert ws1_data["payload"]["card_id"] == cott_nsf_card_id_1

        ws2_data = json.loads(mock_broadcast.call_args_list[1][0][0])
        assert ws2_data["type"] == "gamePlayerDiscard"
        assert ws2_data["payload"]["player_id"] == cott_player_id_2
        assert ws2_data["payload"]["card_id"] == cott_nsf_card_id_2

        ws3_data = json.loads(mock_broadcast.call_args_list[2][0][0])
        assert ws3_data["type"] == "gamePlayerDiscard"
        assert ws3_data["payload"]["player_id"] == cott_player_id_1
        assert ws3_data["payload"]["card_id"] == cott_event_card_id


def test_execute_cott_no_nsf_cards(client, db_session):
    """
    Test del "No Effect Path"
    """
    payload = {
        "game_id": cott_game_id,
        "player_id": cott_player_id_1, 
        "target_player_id": cott_player_id_1 
    }
    room_id = str(cott_game_id)
    
    with patch("src.cards.logicEventCards.cardsOffTheTable.manager.broadcast", new_callable=AsyncMock) as mock_broadcast, \
         patch("src.cards.logicEventCards.cardsOffTheTable.discard_card") as mock_discard_card:
        
        mock_discard_card.side_effect = discard_side_effect
        
        response = client.put(
            f"/event-cards/play/{cott_event_card_id}",
            json=payload,
            params={"room_id": room_id}
        )

        assert response.status_code == status.HTTP_200_OK, response.text
        data = response.json()

        assert data["id"] == cott_event_card_id
        assert data["was_played"] is True

        mock_discard_card.assert_called_once() 
        mock_broadcast.assert_called_once() 
        
        ws1_data = json.loads(mock_broadcast.call_args_list[0][0][0])
        assert ws1_data["type"] == "gamePlayerDiscard"
        assert ws1_data["payload"]["player_id"] == cott_player_id_1