import pytest

# IDs de la partida y cartas creadas en los tests
created_game_id = None
created_card_ids = []
discard_pile_card_ids = []



# Crear partida

def test_create_game(client):
    response = client.post(
        "/game",
        json={
            "name": "Test Game",
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


# Crear cartas de prueba (base)

def test_create_cards(client):
    cards = [
        {
            "name": "Carta Mazo Robo",
            "description": "Carta que irá al mazo de robo",
            "image_url": "http://example.com/robo.png",
            "is_murderes_escapes": False
        },
        {
            "name": "Carta Descarte (Orden 0)",
            "description": "Carta que irá al mazo de descarte",
            "image_url": "http://example.com/descarte.png",
            "is_murderes_escapes": True
        }
    ]

    created_ids = []
    for card in cards:
        response = client.post("/card", json=card)
        assert response.status_code == 201
        data = response.json()
        created_ids.append(data["id"])

    global created_card_ids
    created_card_ids = created_ids
    assert len(created_card_ids) == 2


# Asignar cartas al juego

def test_assign_cards_to_game(client):
    # Primera carta al mazo de robo
    response = client.post(f"/game-cards/{created_game_id}/{created_card_ids[0]}?position=mazo_robo")
    assert response.status_code == 200
    assert response.json()["message"] == "Card assigned successfully"

    # Segunda carta al mazo de descarte (tendrá card_order=0 por defecto)
    response = client.post(f"/game-cards/{created_game_id}/{created_card_ids[1]}?position=mazo_descarte")
    assert response.status_code == 200
    assert response.json()["message"] == "Card assigned successfully"

# 4️⃣ Obtener todas las cartas del juego
def test_get_all_game_cards(client):
    response = client.get(f"/game-cards/{created_game_id}/cards")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    ids = [card["card_id"] for card in data]
    for cid in created_card_ids:
        assert cid in ids


# Filtrar por mazo

def test_get_cards_by_deck(client):
    # Caso: mazo_robo
    response = client.get(f"/game-cards/game/{created_game_id}/cards/mazo_robo")
    assert response.status_code == 200
    data = response.json()
    assert all(card["card_position"] == "mazo_robo" for card in data)

    # Caso: mazo_descarte
    response = client.get(f"/game-cards/game/{created_game_id}/cards/mazo_descarte")
    assert response.status_code == 200
    data = response.json()
    assert all(card["card_position"] == "mazo_descarte" for card in data)


    # Caso: mazo vacío
    response = client.get(f"/game-cards/game/{created_game_id}/cards/mazo_inexistente")
    assert response.status_code == 200
    data = response.json()
    assert data == [] or data == {"message": "No cards found in this deck"}


# Actualizar orden de la carta (card_order)

def test_update_card_order(client):
    card_id = created_card_ids[0] # Actualiza la del mazo de robo
    response = client.put(
        f"/game-cards/{created_game_id}/{card_id}",
        json={"card_position": "mazo_robo", "card_order": 5}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Card updated successfully"

    # Verificamos que el cambio se refleje
    verify = client.get(f"/game-cards/{created_game_id}/cards")
    updated_card = next((c for c in verify.json() if c["card_id"] == card_id), None)
    assert updated_card is not None
    assert updated_card["card_order"] == 5


# --- TESTS AÑADIDOS PARA EL TOP 5 ---

def test_setup_full_discard_pile(client):
    """
    Crea 6 cartas nuevas y las añade al mazo de descarte
    con órdenes del 1 al 6 para probar el endpoint top5.
    """
    global discard_pile_card_ids
    cards_info = [
        {"name": "Discard 1", "order": 1},
        {"name": "Discard 2", "order": 2},
        {"name": "Discard 3", "order": 3},
        {"name": "Discard 4", "order": 4},
        {"name": "Discard 5", "order": 5},
        {"name": "Discard 6", "order": 6},
    ]

    for info in cards_info:
        # 1. Crear la carta (tabla 'cards')
        response = client.post("/card", json={
            "name": info["name"],
            "description": "Test card para top5",
            "image_url": "http://example.com/test.png",
            "is_murderes_escapes": False
        })
        assert response.status_code == 201
        card_id = response.json()["id"]
        discard_pile_card_ids.append(card_id)

        # 2. Asignar al juego (tabla 'game_card')
        response = client.post(f"/game-cards/{created_game_id}/{card_id}?position=mazo_descarte")
        assert response.status_code == 200

        # 3. Actualizar su orden
        response = client.put(
            f"/game-cards/{created_game_id}/{card_id}",
            json={"card_position": "mazo_descarte", "card_order": info["order"]}
        )
        assert response.status_code == 200
    
    assert len(discard_pile_card_ids) == 6

def test_get_top_5_discard_deck_success(client):
    """
    Prueba que el endpoint devuelva solo 5 cartas y en el orden correcto.
    """
    response = client.get(f"/game-cards/game/{created_game_id}/discard-deck/top5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    # Debe haber 7 cartas en el descarte (la de orden 0 + las 6 nuevas)
    # El endpoint solo debe devolver 5
    assert len(data) == 5

    # Verificamos que devuelva CardOut (chequeando el 'name')
    # Y que estén en el orden correcto (del 6 al 2)
    names = [card["name"] for card in data]
    expected_names = [
        "Discard 6", # order 6
        "Discard 5", # order 5
        "Discard 4", # order 4
        "Discard 3", # order 3
        "Discard 2"  # order 2
    ]
    assert names == expected_names
    
    # Verificamos que las cartas con orden bajo no estén
    assert "Discard 1" not in names
    assert "Carta Descarte (Orden 0)" not in names

def test_get_top_5_discard_deck_empty(client):
    """
    Prueba que el endpoint devuelva una lista vacía para un juego sin cartas.
    """
    # Usamos un ID de juego que (con suerte) no existe
    response = client.get(f"/game-cards/game/99999/discard-deck/top5")
    assert response.status_code == 200
    data = response.json()
    assert data == []

def test_get_top_1_discard_success(client):
    response = client.get(f"/game-cards/game/{created_game_id}/discard-deck/top1")
    assert response.status_code == 200
    data = response.json()

    assert "card_order" in data
    assert "card_id" in data
    assert "name" not in data
    expected_card_id = discard_pile_card_ids[5]
    
    assert data["card_order"] == 6
    assert data["card_id"] == expected_card_id
    assert data["game_id"] == created_game_id

def test_get_top_1_discard_empty_game(client):

    response = client.get(f"/game-cards/game/99999/discard-deck/top1")
    assert response.status_code == 200    
    data = response.json()
    assert data is None



# --- FIN DE TESTS AÑADIDOS ---


# Intentar actualizar una carta inexistente

def test_update_nonexistent_card(client):
    response = client.put(
        f"/game-cards/{created_game_id}/99999",
        json={"card_position": "mazo_robo"}
    )
    assert response.status_code in (404, 400)


# Eliminar cartas del juego (ACTUALIZADO)

def test_remove_cards_from_game(client):
    """
    Actualizado para limpiar TODAS las cartas creadas en los tests.
    """
    all_card_ids = created_card_ids + discard_pile_card_ids
    
    for cid in all_card_ids:
        response = client.delete(f"/game-cards/{created_game_id}/cards/{cid}")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Card removed successfully"

#Verificar que ya no haya cartas en el juego
def test_no_cards_after_deletion(client):
    response = client.get(f"/game-cards/{created_game_id}/cards")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0
