import pytest

created_player_id = None
created_card_id = None
new_player_id = None
created_game_id = None  # Variable global para el ID del juego

def test_create_player(client):
    response = client.post(
        "/player",
        json={
            "name": "Test Player",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": False,
            "rol": "innocent"
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    global created_player_id
    created_player_id = data["id"]


def test_create_card(client):
    response = client.post(
        "/card",
        json={
            "name": "Test Card",
            "description": "Card for testing",
            "image_url": "http://example.com/image.png",
            "is_murderes_escapes": True
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    global created_card_id
    created_card_id = data["id"]

# --- NUEVO TEST (Añadido) ---
# Necesitamos un juego al cual la carta pueda pertenecer.
# Copiado de tu test_gameCard.py
def test_create_game(client):
    response = client.post(
        "/game",
        json={
            "name": "Test Game for PlayerCard",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    global created_game_id
    created_game_id = data["id"]


def test_assign_card_to_player(client):
    # Esto crea la relación en player_card_table
    response = client.post(f"/player/{created_player_id}/{created_card_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Card assigned successfully"

# --- NUEVO TEST (Añadido) ---
# Esto crea la relación en GameCard con position=None (asumido).
# Esta es la pieza que faltaba para que get_player_cards funcione.
def test_add_card_to_game_hand(client):
    # Asumimos que llamar a este endpoint sin ?position lo setea en None
    response = client.post(f"/game-cards/{created_game_id}/{created_card_id}")
    
    # Basado en tu test_gameCard.py, el código de éxito es 200
    assert response.status_code == 200
    assert response.json()["message"] == "Card assigned successfully"


def test_create_new_player_for_transfer(client):
    response = client.post(
        "/player",
        json={
            "name": "Receiver Player",
            "birthdate": "2000-05-10",
            "avatar": "http://example.com/avatar2.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "innocent"
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    global new_player_id
    new_player_id = data["id"]

def test_get_player_cards(client):
    # Ahora este test debería pasar
    response = client.get(f"/player/{created_player_id}/cards")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # El servicio ahora encontrará la carta en player_card_table
    # Y también en GameCard con position=None
    assert any(card["id"] == created_card_id for card in data)


def test_remove_card_from_player(client):
    # Esto elimina la relación de player_card_table
    response = client.delete(f"/player/{created_player_id}/cards/{created_card_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Card removed successfully"

    # Nota: La entrada en GameCard sigue existiendo, pero eso no afecta
    # a los tests siguientes.

def test_transfer_card(client):
    # Creamos un jugador nuevo (diferente al de test_create_new_player_for_transfer)
    response = client.post(
        "/player",
        json={
            "name": "New Player 2",
            "birthdate": "1998-01-01",
            "avatar": "http://example.com/avatar2.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "innocent"
        },
    )
    assert response.status_code == 201
    data = response.json()
    global new_player_id
    new_player_id = data["id"] # Sobrescribimos el ID global

    # 1. Asignamos la carta al jugador original (crea entrada en player_card_table)
    response = client.post(f"/player/{created_player_id}/{created_card_id}")
    assert response.status_code == 200

    # 2. Transferimos la carta
    response = client.put(
        f"/player/{created_player_id}/cards/{created_card_id}?room_id=0",
        params={"new_player_id": new_player_id}, 
    )
    assert response.status_code == 200
    data = response.json()
    assert "transferred" in data["message"] 

    # 3. Verificamos que el jugador original ya no tiene la carta
    response = client.get(f"/player/{created_player_id}/cards")
    assert response.status_code == 200
    data = response.json()
    # El servicio get_player_cards no encontrará la relación en
    # player_card_table, por lo que devolverá []
    assert all(card["id"] != created_card_id for card in data)
    
    # 4. Verificamos que el nuevo jugador SÍ tiene la carta
    response = client.get(f"/player/{new_player_id}/cards")
    assert response.status_code == 200
    
    data = response.json()
    # El servicio get_player_cards encontrará:
    # a) La relación en player_card_table (creada por el PUT de transfer)
    # b) La relación en GameCard (creada en test_add_card_to_game_hand)
    # Por lo tanto, el test debería pasar.
    assert any(card["id"] == created_card_id for card in data)


def test_get_player_cards_after_removal(client):
    # Limpiamos la carta del nuevo jugador también para estar seguros
    client.delete(f"/player/{new_player_id}/cards/{created_card_id}")

    # Verificamos la mano del jugador original (debería estar vacía)
    response = client.get(f"/player/{created_player_id}/cards")
    assert response.status_code == 200
    data = response.json()
    assert all(card["id"] != created_card_id for card in data)