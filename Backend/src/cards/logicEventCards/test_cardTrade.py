import pytest
import json
from fastapi import status
# ¡Importamos MagicMock y AsyncMock!
from unittest.mock import patch, MagicMock, AsyncMock 

# --- Globales para pasar IDs entre tests (como en tu ejemplo) ---
created_player_id_1 = None # El jugador que juega la carta
created_player_id_2 = None # El jugador objetivo
created_game_id_1 = None
created_cardtrade_card_id = None

# --- 1. Creación de Entidades (Setup) ---

def test_create_player_initiator(client):
    """Crea el jugador que va a jugar la carta."""
    global created_player_id_1
    response = client.post(
        "/player",
        json={
            "name": "CardTrade Initiator",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar1.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True, # Asumimos que es dueño de la partida
            "rol": "innocent"
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    created_player_id_1 = data["id"]

def test_create_player_target(client):
    """Crea el jugador que será el objetivo del trade."""
    global created_player_id_2
    response = client.post(
        "/player",
        json={
            "name": "CardTrade Target",
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
    created_player_id_2 = data["id"]

def test_create_game(client):
    """Crea la partida donde se jugará la carta."""
    global created_game_id_1
    response = client.post(
        "/game",
        json={
            "name": "CardTrade Game",
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
    created_game_id_1 = data["id"]

def test_create_cardtrade_card(client):
    """
    Crea la carta de evento 'event_cardtrade' específica.
    El nombre debe ser exacto para que el 'match...case' funcione.
    """
    global created_cardtrade_card_id
    response = client.post(
        "/event-cards/",
        json={
            "name": "event_cardtrade", # <-- Nombre clave
            "description": "Intercambio de cartas",
            "image_url": "http://example.com/trade.png",
            "is_murderes_escapes": False,
            "was_played": False,
            "was_traded": False,
            "is_cancellable": False
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    created_cardtrade_card_id = data["id"]
    assert data["name"] == "event_cardtrade"

# --- 2. Test Principal de Lógica ---
# ¡SIN DECORADOR, SIN ASYNC DEF! (Como en not_so_fast)
def test_play_cardtrade_event(client):
    """
    Prueba el endpoint de jugar la carta CardTrade.
    """
    # 1. Asegurarse de que los tests de setup corrieron
    assert all([created_player_id_1, created_player_id_2, created_game_id_1, created_cardtrade_card_id])

    # 2. Definir el payload que enviaría el frontend
    payload = {
        "game_id": created_game_id_1,
        "player_id": created_player_id_1,
        "target_player_id": created_player_id_2
    }
    room_id = str(created_game_id_1) # Usamos el ID del juego como room_id

    # 3. Mockear las dependencias externas (manager y discard_card)
    #    Hacemos patch en el lugar donde 'cardTrade.py' las importa.
    with patch("src.cards.logicEventCards.cardTrade.manager.broadcast", new_callable=AsyncMock) as mock_broadcast, \
         patch("src.cards.logicEventCards.cardTrade.discard_card") as mock_discard_card:
        
        # 3a. Configurar el mock de discard_card (es una función SÍNCRONA)
        mock_card_discarded = MagicMock()
        mock_card_discarded.to_schema.return_value = {
            "id": created_cardtrade_card_id, 
            "name": "event_cardtrade",
            "description": "Test description",
            "image_url": "http://example.com/test.png",
            "is_murderes_escapes": False
        }
        mock_discard_card.return_value = {
            "player_id": created_player_id_1,
            "card_id": created_cardtrade_card_id,
            "card_discard": mock_card_discarded
        }
        
        # mock_broadcast ya es un AsyncMock, el 'await' en el
        # servicio funcionará automáticamente.

        # 4. Ejecutar la llamada a la API (el 'client' de pytest es SÍNCRONO)
        response = client.put(
            f"/event-cards/play/{created_cardtrade_card_id}",
            json=payload,
            params={"room_id": room_id}
        )

        # 5. Validar la respuesta HTTP
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert response_data["id"] == created_cardtrade_card_id
        assert response_data["was_played"] is True

        # 6. Validar las llamadas a los mocks
        
        # 6a. Se llamó a discard_card?
        mock_discard_card.assert_called_once()
        args, _ = mock_discard_card.call_args
        assert args[1] == created_game_id_1
        assert args[2] == created_player_id_1
        assert args[3] == created_cardtrade_card_id
        
        # 6b. Se llamó al broadcast 3 VECES?
        assert mock_broadcast.call_count == 3

        # 6c. Validar WS 1: Descarte (decodificando el JSON)
        call_args_discard_str = mock_broadcast.call_args_list[0][0][0]
        data_discard = json.loads(call_args_discard_str)
        assert data_discard['type'] == 'gamePlayerDiscard'
        assert data_discard['payload']['player_id'] == created_player_id_1

        # 6d. Validar WS 2: Trade al Iniciador
        call_args_initiator_str = mock_broadcast.call_args_list[1][0][0]
        data_initiator = json.loads(call_args_initiator_str)
        assert data_initiator['type'] == 'card_trade_request'
        assert data_initiator['payload']['target_id'] == created_player_id_1
        assert data_initiator['payload']['other_player_id'] == created_player_id_2
        assert data_initiator['payload']['played_card_id'] == created_cardtrade_card_id

        # 6e. Validar WS 3: Trade al Objetivo
        call_args_target_str = mock_broadcast.call_args_list[2][0][0]
        data_target = json.loads(call_args_target_str)
        assert data_target['type'] == 'card_trade_request'
        assert data_target['payload']['target_id'] == created_player_id_2
        assert data_target['payload']['other_player_id'] == created_player_id_1
        assert data_target['payload']['played_card_id'] == created_cardtrade_card_id