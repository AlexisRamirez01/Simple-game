import pytest
import json
from fastapi import status
from unittest.mock import patch, MagicMock, AsyncMock
from src.cards.models import SecretCard
from src.player.models import Player
from src.gamePlayer.models import PlayerGame
from src.playerCard.models import player_card_table
from sqlalchemy import insert

attwom_player_id_1 = None 
attwom_player_id_2 = None 
attwom_game_id = None
attwom_card_id = None
attwom_secret_card_id = None 

def test_create_attwom_players(client):
    """Crea los jugadores para el test."""
    global attwom_player_id_1, attwom_player_id_2
    
    response1 = client.post(
        "/player",
        json={
            "name": "ATTWOM Initiator",
            "birthdate": "1990-01-01",
            "avatar": "http://example.com/p1.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent"
        },
    )
    assert response1.status_code == status.HTTP_201_CREATED
    attwom_player_id_1 = response1.json()["id"]

    response2 = client.post(
        "/player",
        json={
            "name": "ATTWOM Target",
            "birthdate": "1991-02-02",
            "avatar": "http://example.com/p2.png",
            "is_Social_Disgrace": True,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "innocent"
        },
    )
    assert response2.status_code == status.HTTP_201_CREATED
    attwom_player_id_2 = response2.json()["id"]

def test_create_attwom_game(client):
    """Crea la partida."""
    global attwom_game_id
    response = client.post(
        "/game",
        json={
            "name": "ATTWOM Game",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": True,
            "current_turn": 0,
            "turn_id_player": attwom_player_id_1
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    attwom_game_id = response.json()["id"]

def test_create_attwom_event_card(client):
    global attwom_card_id
    
    EVENT_NAME_FROM_YOUR_SERVICE = "event_onemore" 
    
    response = client.post(
        "/event-cards/",
        json={
            "name": EVENT_NAME_FROM_YOUR_SERVICE, 
            "description": "Transfiere un secreto revelado.",
            "image_url": "http://example.com/attwom.png",
            "is_murderes_escapes": False,
            "was_played": False,
            "was_traded": False,
            "is_cancellable": True
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    attwom_card_id = data["id"]
    assert data["name"] == EVENT_NAME_FROM_YOUR_SERVICE

def test_execute_attwom_full_effect(client, db_session):
    """
    Test del "Happy Path"
    """
    assert all([
        attwom_player_id_1, attwom_player_id_2, 
        attwom_game_id, attwom_card_id
    ])
    
    global attwom_secret_card_id
    try:
        # Crear la carta de Secreto
        secret_card = SecretCard(
            name="Eres el Cómplice",
            description="Ayudas al asesino.",
            image_url="http://example.com/accomplice.png",
            is_murderes_escapes=False,
            is_accomplice=True,
            is_murderer=False,
            is_revealed=True
        )
        db_session.add(secret_card)
        db_session.commit()
        attwom_secret_card_id = secret_card.id

        db_session.add_all([
            PlayerGame(game_id=attwom_game_id, player_id=attwom_player_id_1, position_id_player=0),
            PlayerGame(game_id=attwom_game_id, player_id=attwom_player_id_2, position_id_player=1)
        ])
        
        db_session.execute(
            insert(player_card_table).values(
                player_id=attwom_player_id_1, 
                card_id=attwom_card_id
            )
        )
        
        db_session.execute(
            insert(player_card_table).values(
                player_id=attwom_player_id_1, 
                card_id=attwom_secret_card_id
            )
        )
        
        player2 = db_session.get(Player, attwom_player_id_2)
        player2.is_Social_Disgrace = True
        
        db_session.commit()
    except Exception as e:
        db_session.rollback()
        pytest.fail(f"Falló el setup de la DB: {e}")

    payload = {
        "game_id": attwom_game_id,
        "player_id": attwom_player_id_1,
        "revealed_secret_card_id": attwom_secret_card_id,
        "target_player_id": attwom_player_id_2
    }
    room_id = str(attwom_game_id)

    with patch("src.cards.logicEventCards.andThenThereWasOneMore.manager.broadcast", new_callable=AsyncMock) as mock_broadcast, \
         patch("src.cards.logicEventCards.andThenThereWasOneMore.discard_card") as mock_discard_card:
        
        mock_event_card_discarded = MagicMock()
        mock_event_card_discarded.to_schema.return_value = {
            "id": attwom_card_id,
            "name": "event_onemore",
            "description": "Test Desc",
            "image_url": "http://test.com/img.png",
            "is_murderes_escapes": False
        }
        
        mock_discard_card.return_value = {
            "player_id": attwom_player_id_1,
            "card_id": attwom_card_id,
            "card_discard": mock_event_card_discarded
        }
        
        response = client.put(
            f"/event-cards/play/{attwom_card_id}",
            json=payload,
            params={"room_id": room_id}
        )

        assert response.status_code == status.HTTP_200_OK, response.text
        
        mock_discard_card.assert_called_once()
        args, kwargs = mock_discard_card.call_args
        assert kwargs.get("game_id") == attwom_game_id
        assert kwargs.get("player_id") == attwom_player_id_1
        assert kwargs.get("card_id") == attwom_card_id
        
        assert mock_broadcast.call_count == 2

        ws1_data = json.loads(mock_broadcast.call_args_list[0][0][0])
        assert ws1_data["type"] == "gamePlayerDiscard"

        ws2_data = json.loads(mock_broadcast.call_args_list[1][0][0])
        assert ws2_data["type"] == "playerCardUpdate"
        
        assert ws2_data["payload"]["card"]["id"] == attwom_secret_card_id
        assert ws2_data["payload"]["old_player"]["id"] == attwom_player_id_1
        assert ws2_data["payload"]["new_player"]["id"] == attwom_player_id_2

    db_session.refresh(player2)
    secret_card_after = db_session.get(SecretCard, attwom_secret_card_id)

    assert secret_card_after.is_revealed is False
    assert player2.is_Social_Disgrace is False
    
    new_owner_link = db_session.execute(
        player_card_table.select().where(
            player_card_table.c.card_id == attwom_secret_card_id
        )
    ).fetchone()
    assert new_owner_link is not None
    assert new_owner_link.player_id == attwom_player_id_2


def test_execute_attwom_no_effect(client, db_session):
    """
    Test del "No Effect Path"
    """
    try:
        db_session.execute(
            insert(player_card_table).values(
                player_id=attwom_player_id_1, 
                card_id=attwom_card_id
            )
        )
        db_session.commit()
    except Exception:
        db_session.rollback()
        pass 

    payload = {
        "game_id": attwom_game_id,
        "player_id": attwom_player_id_1,
        "revealed_secret_card_id": None, # Sin efecto
        "target_player_id": None
    }
    room_id = str(attwom_game_id)

    with patch("src.cards.logicEventCards.andThenThereWasOneMore.manager.broadcast", new_callable=AsyncMock) as mock_broadcast, \
         patch("src.cards.logicEventCards.andThenThereWasOneMore.discard_card") as mock_discard_card:
        
        mock_event_card_discarded = MagicMock()
        mock_event_card_discarded.to_schema.return_value = {
            "id": attwom_card_id,
            "name": "event_onemore",
            "description": "Test Desc",
            "image_url": "http://test.com/img.png",
            "is_murderes_escapes": False
        }
        
        mock_discard_card.return_value = {
            "player_id": attwom_player_id_1, "card_id": attwom_card_id, "card_discard": mock_event_card_discarded
        }
        
        response = client.put(
            f"/event-cards/play/{attwom_card_id}",
            json=payload,
            params={"room_id": room_id}
        )

        assert response.status_code == status.HTTP_200_OK, response.text
        
        mock_discard_card.assert_called_once()
        assert mock_broadcast.call_count == 1
        ws1_data = json.loads(mock_broadcast.call_args_list[0][0][0])
        assert ws1_data["type"] == "gamePlayerDiscard"


def test_execute_attwom_fail_secret_card_not_found(client, db_session):
    """
    Test de fallo: La carta de secreto especificada no existe.
    (Este test ya pasaba en la ejecución anterior, está OK)
    """

    payload = {
        "game_id": attwom_game_id,
        "player_id": attwom_player_id_1,
        "revealed_secret_card_id": 99999,
        "target_player_id": attwom_player_id_2
    }
    room_id = str(attwom_game_id)

    response = client.put(
        f"/event-cards/play/{attwom_card_id}",
        json=payload,
        params={"room_id": room_id}
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "Carta de secreto revelada no encontrada" in response.json()["detail"]