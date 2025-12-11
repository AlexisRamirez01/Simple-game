# tests/test_player_game.py
import pytest
from fastapi import status

# Variables globales para usar entre tests
created_player_id_1 = None
created_player_id_2 = None
created_game_id_1 = None
created_game_id_2 = None
created_game_id_3 = None
created_player_game_id = None
created_player_id_3 = None
created_player_id_4 = None
created_player_game_id_2 = None
created_game_votation_id = None
created_player_voter_1 = None
created_player_voter_2 = None
created_player_voter_3 = None
created_card_vote_id = None

# --- Crear jugadores ---
def test_create_player_1(client):
    response = client.post(
        "/player",
        json={
            "name": "Test Player 1",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar1.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": False,
            "rol": "innocent"
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    global created_player_id_1
    created_player_id_1 = data["id"]

def test_create_player_2(client):
    response = client.post(
        "/player",
        json={
            "name": "Test Player 2",
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
    global created_player_id_2
    created_player_id_2 = data["id"]

# --- Crear juegos ---
def test_create_game_1(client):
    response = client.post(
        "/game",
        json={
            "name": "Test Game 1",
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
    global created_game_id_1
    created_game_id_1 = data["id"]

def test_create_game_2(client):
    response = client.post(
        "/game",
        json={
            "name": "Test Game 2",
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
    global created_game_id_2
    created_game_id_2 = data["id"]

# --- Unir jugador a juego sin posición (None) ---
def test_add_player_to_game_no_position(client):
    response = client.post(
        f"/game/{created_game_id_1}/{created_player_id_1}",
        json={"position_id_player": None}  # explícitamente None
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data.get("position_id_player") is None
    global created_player_game_id
    created_player_game_id = data["id"]

# --- Unir jugador a juego con posición ---
def test_add_player_to_game_with_position(client):
    response = client.post(
        f"/game/{created_game_id_1}/{created_player_id_2}",
        json={"position_id_player": 3}  # ejemplo de posición asignada
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "id" in data
    assert data.get("position_id_player") == 3

# --- Listar jugadores de un juego ---
def test_get_players_of_game(client):
    response = client.get(f"/game/{created_game_id_1}/players")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    # Verifico que los jugadores estén listados y sus posiciones sean correctas
    assert any(p["id"] == created_player_id_1 and p["position_id_player"] is None for p in data)
    assert any(p["id"] == created_player_id_2 and p["position_id_player"] == 3 for p in data)

# --- Obtener rol de jugador de un juego ---
def test_get_player_role(client):
    """
    Testea el endpoint /game/{game_id}/{player_id}/role
    Usando los jugadores y juegos creados en los fixtures.
    """
    # Test jugador inocente (sin compañero)
    response = client.get(f"/game/{created_game_id_1}/{created_player_id_1}/role")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    assert "player" in data
    assert data["player"]["id"] == created_player_id_1
    assert data["player"]["rol"] == "innocent"
    assert data["partner"] is None

    # Test jugador murderer (con compañero, si existe)
    response2 = client.get(f"/game/{created_game_id_1}/{created_player_id_2}/role")
    assert response2.status_code == status.HTTP_200_OK
    data2 = response2.json()

    assert "player" in data2
    assert data2["player"]["id"] == created_player_id_2
    assert data2["player"]["rol"] == "murderer"
    assert data2["partner"] is None



# --- Borrar jugador de un juego ---
def test_delete_player_from_game(client):
    response = client.delete(f"/game/{created_game_id_1}/{created_player_id_1}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data == created_player_id_1

    response = client.get(f"/game/{created_game_id_1}/players")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert all(p["id"] != created_player_id_1 for p in data)


# --- Borrar jugador de partida en curso ---
def test_delete_player_from_game_started(client):
    aux = client.put(
        f"/game/{created_game_id_1}", 
        json={
            "name": "Test Game 1",
            "max_players": 4,
            "min_players": 2,
            "current_players": 3,
            "is_started": True,
            "current_turn": 0,
            "turn_id_player": 0
        },
    )

    response = client.delete(f"/game/{created_game_id_1}/{created_player_id_2}")
    assert response.status_code == 400
    data = response.json()
    assert "Game is started" in data["detail"]

# --- Borrar un jugador que no está dentro de la partida ---
def test_delete_noexistent_player(client):
    response = client.delete(f"/game/{created_game_id_1}/players/9999")
    assert response.status_code == 404
    data = response.json()
    assert "Not Found" in data["detail"]
    
# --- Descartar una carta normal
def test_discard_card(client):
    # Actualizo el juego a is_started=True
    response = client.put(
        f"/game/{created_game_id_1}",
        json={
            "name": "Test Game 1",
            "max_players": 4,
            "min_players": 2,
            "current_players": 2,
            "is_started": True,
            "current_turn": 0,
            "turn_id_player": created_player_id_1
        },
    )
    assert response.status_code == 200

    # Creo una carta
    response = client.post(
        "/card/",
        json={
            "name": "Carta test descarte",
            "description": "Carta usada para testear descarte",
            "image_url": "http://example.com/card.png",
            "is_murderes_escapes": False
        },
    )
    assert response.status_code == 201
    card_id = response.json()["id"]

    # Asigno la carta al juego
    response = client.post(f"/game-cards/{created_game_id_1}/{card_id}")
    assert response.status_code == 200

    # Asigno la carta al jugador
    response = client.post(f"/player/{created_player_id_1}/{card_id}")
    assert response.status_code == 200

    # Descarto la carta
    response = client.put(f"/game/{created_game_id_1}/{created_player_id_1}/{card_id}/discard")
    assert response.status_code == 200

    data = response.json()
    assert data["player_id"] == created_player_id_1
    assert data["card_id"] == card_id


# --- Descartar una carta que no está en mano del jugador
def test_discard_nonexistent_card(client):
    # Se inicia la partida
    response = client.put(
        f"/game/{created_game_id_1}",
        json={
            "name": "Test Game 1",
            "max_players": 4,
            "min_players": 2,
            "current_players": 2,
            "is_started": True,
            "current_turn": 0,
            "turn_id_player": created_player_id_1
        },
    )
    assert response.status_code == 200

    # Creo una carta
    response = client.post(
        "/card/",
        json={
            "name": "Carta test descarte",
            "description": "Carta usada para testear descarte",
            "image_url": "http://example.com/card.png",
            "is_murderes_escapes": False
        },
    )
    assert response.status_code == 201
    card_id = response.json()["id"]

    # Asigno la carta al juego
    response = client.post(f"/game-cards/{created_game_id_1}/{card_id}")
    assert response.status_code == 200
    
    # Intento descartar la carta
    response = client.put(f"/game/{created_game_id_1}/{created_player_id_1}/{card_id}/discard")
  
    # Verificamos que se lance el error correcto
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Carta no encontrada en la mano del jugador"


# --- Descartar una carta de secreto
def test_discard_secret_card(client):
    # Actualizo el juego a is_started=True
    response = client.put(
        f"/game/{created_game_id_1}",
        json={
            "name": "Test Game 1",
            "max_players": 4,
            "min_players": 2,
            "current_players": 2,
            "is_started": True,
            "current_turn": 0,
            "turn_id_player": created_player_id_1
        },
    )
    assert response.status_code == 200

    # Creo una carta de secreto
    response = client.post(
        "/secret-cards/",
        json={
            "name": "secret_card",
            "description": "Carta usada para testear descarte",
            "image_url": "http://example.com/card.png",
            "is_murderes_escapes": False,
            "is_murderer": False,
            "is_accomplice": False,
            "is_revealed": False
        },
    )
    assert response.status_code == 201
    card_id = response.json()["id"]

    # Asigno la carta al juego
    response = client.post(f"/game-cards/{created_game_id_1}/{card_id}")
    assert response.status_code == 200

    # Asigno la carta al jugador
    response = client.post(f"/player/{created_player_id_1}/{card_id}")
    assert response.status_code == 200

    # Intento descartar la carta
    response = client.put(f"/game/{created_game_id_1}/{created_player_id_1}/{card_id}/discard")
    assert response.status_code == 400

    data = response.json()
    assert data["detail"] == "Cannot discard a secret card"


# --- Reponer del mazo draw ---
def test_restock_card_success(client):
    a = client.post(
        "/game",
        json={
            "name": "Test game 3",
            "max_players": 2,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0,
            "draw_top": 0,
            "discard_top": 0
        },
    )

    assert a.status_code == status.HTTP_201_CREATED
    data = a.json()
    global created_game_id_3
    created_game_id_3 = data["id"]

    b = client.post(
        "/player",
        json={
            "name": "Test Player 3",
            "birthdate": "1993-05-20",
            "avatar": "http://example.com/avatar2.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "innocent"
        },
    )

    assert b.status_code == status.HTTP_201_CREATED
    data = b.json()
    global created_player_id_3
    created_player_id_3 = data["id"]

    c = client.post(
        "/player",
        json={
            "name": "Test Player 2",
            "birthdate": "1993-05-20",
            "avatar": "http://example.com/avatar2.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "innocent"
        },
    )

    assert c.status_code == status.HTTP_201_CREATED
    data = c.json()
    global created_player_id_4
    created_player_id_4 = data["id"]

    d = client.post(
        f"/game/{created_game_id_3}/{created_player_id_3}",
        json={"position_id_player": None}
    )

    assert d.status_code == status.HTTP_201_CREATED
    data = d.json()
    global created_player_game_id_2
    created_player_game_id_2 = data["id"]

    e = client.post(
        f"/game/{created_game_id_3}/{created_player_id_4}",
        json={"position_id_player": None}
    )

    assert e.status_code == status.HTTP_201_CREATED

    sg = client.put(
        f"/game/start/{created_game_id_3}",
        json={
            "name": "Test game 3",
            "max_players": 2,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0,
            "draw_top": 0,
            "discard_top": 0
        },
    )

    assert sg.status_code == status.HTTP_200_OK

    cards_player = client.get(f"/player/{created_player_id_3}/cards")

    assert cards_player.status_code == status.HTTP_200_OK

    data = cards_player.json()

    cards_to_discard = [c["id"] for c in data[:2]]

    assert len(cards_to_discard) == 2

    for card_id in cards_to_discard:
        card_delete = client.delete(f"/player/{created_player_id_3}/cards/{card_id}?room_id={created_game_id_3}")
        assert card_delete.status_code == status.HTTP_200_OK

    response = client.post(
        f"/game/{created_game_id_3}/{created_player_id_3}/restock?room_id={created_game_id_3}&cantidad_robo=2",
        json={"cards_id":[]},
    )

    data = response.json()
    
    assert data["player_id"] == created_player_id_3
    assert "player_cards" in data
    assert isinstance(data["player_cards"], list)
    assert all("id" in c and "name" in c for c in data["player_cards"])
    assert len(data["player_cards"]) >= 1

# --- Reponer desde el mazo de draft con selección parcial ---
def test_restock_card_from_draft_select_two_cards(client):
    # Crear juego
    a = client.post(
        "/game",
        json={
            "name": "Draft Test Game 1",
            "max_players": 2,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0,
            "draw_top": 0,
            "discard_top": 0
        },
    )
    assert a.status_code == status.HTTP_201_CREATED
    data = a.json()
    game_id = data["id"]

    # Crear dos jugadores
    p1 = client.post("/player", json={
        "name": "Jugador Draft 1",
        "birthdate": "1993-05-20",
        "avatar": "http://example.com/avatar.png",
        "is_Social_Disgrace": False,
        "is_Your_Turn": False,
        "is_Owner": False,
        "rol": "innocent"
    })
    assert p1.status_code == status.HTTP_201_CREATED
    player1_id = p1.json()["id"]

    p2 = client.post("/player", json={
        "name": "Jugador Draft 2",
        "birthdate": "1993-05-20",
        "avatar": "http://example.com/avatar.png",
        "is_Social_Disgrace": False,
        "is_Your_Turn": False,
        "is_Owner": False,
        "rol": "innocent"
    })
    assert p2.status_code == status.HTTP_201_CREATED
    player2_id = p2.json()["id"]

    # Asociar jugadores al juego
    assert client.post(f"/game/{game_id}/{player1_id}", json={"position_id_player": None}).status_code == 201
    assert client.post(f"/game/{game_id}/{player2_id}", json={"position_id_player": None}).status_code == 201

    # Iniciar partida
    start = client.put(f"/game/start/{game_id}", json={
        "name": "Draft Test Game 1",
        "max_players": 2,
        "min_players": 2,
        "current_players": 0,
        "is_started": False,
        "current_turn": 0,
        "turn_id_player": 0,
        "draw_top": 0,
        "discard_top": 0
    })
    assert start.status_code == status.HTTP_200_OK

    # Obtener cartas iniciales del jugador 1
    hand_resp = client.get(f"/player/{player1_id}/cards")
    assert hand_resp.status_code == status.HTTP_200_OK
    player_cards = hand_resp.json()

    hand_cards = [c for c in player_cards if "secret" not in c["name"].lower()]
    assert len(hand_cards) == 6

    # El jugador descarta 3 cartas
    cards_to_discard = [c["id"] for c in hand_cards[:3]]
    for card_id in cards_to_discard:
        r = client.delete(f"/player/{player1_id}/cards/{card_id}?room_id={game_id}")
        assert r.status_code == 200

    # Obtener cartas actuales del mazo de draft
    draft_resp = client.get(f"/game-cards/game/{game_id}/cards/mazo_draft")
    assert draft_resp.status_code == 200
    draft_cards = draft_resp.json()
    assert len(draft_cards) >= 2

    # El jugador elige 2 cartas del draft
    selected_cards = [draft_cards[0]["card_id"], draft_cards[1]["card_id"]]

    # Llamar al endpoint de reposición
    restock_resp = client.post(
        f"/game/{game_id}/{player1_id}/restock?room_id={game_id}&cantidad_robo={1}",
        json={"cards_id": selected_cards},
    )
    assert restock_resp.status_code == 200

    result = restock_resp.json()
    assert result["player_id"] == player1_id
    assert "player_cards" in result
    assert isinstance(result["player_cards"], list)
    assert all("id" in c and "name" in c for c in result["player_cards"])

# --- Reponer desde el mazo de draft con todas las cartas ---
def test_restock_card_from_draft_select_all_cards(client):
    # Crear juego
    a = client.post(
        "/game",
        json={
            "name": "Draft Test Game 2",
            "max_players": 2,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0,
            "draw_top": 0,
            "discard_top": 0
        },
    )
    assert a.status_code == status.HTTP_201_CREATED
    data = a.json()
    game_id = data["id"]

    # Crear dos jugadores
    p1 = client.post("/player", json={
        "name": "Jugador Draft A",
        "birthdate": "1993-05-20",
        "avatar": "http://example.com/avatar.png",
        "is_Social_Disgrace": False,
        "is_Your_Turn": False,
        "is_Owner": False,
        "rol": "innocent"
    })
    assert p1.status_code == status.HTTP_201_CREATED
    player1_id = p1.json()["id"]

    p2 = client.post("/player", json={
        "name": "Jugador Draft B",
        "birthdate": "1993-05-20",
        "avatar": "http://example.com/avatar.png",
        "is_Social_Disgrace": False,
        "is_Your_Turn": False,
        "is_Owner": False,
        "rol": "innocent"
    })
    assert p2.status_code == status.HTTP_201_CREATED
    player2_id = p2.json()["id"]

    # Asociar jugadores y comenzar partida
    client.post(f"/game/{game_id}/{player1_id}", json={"position_id_player": None})
    client.post(f"/game/{game_id}/{player2_id}", json={"position_id_player": None})
    client.put(f"/game/start/{game_id}", json={
        "name": "Draft Test Game 2",
        "max_players": 2,
        "min_players": 2,
        "current_players": 0,
        "is_started": False,
        "current_turn": 0,
        "turn_id_player": 0,
        "draw_top": 0,
        "discard_top": 0
    })

    # Obtener mazo de draft
    draft_resp = client.get(f"/game-cards/game/{game_id}/cards/mazo_draft")
    assert draft_resp.status_code == 200
    draft_cards = draft_resp.json()

    # El jugador selecciona todas las cartas disponibles
    selected_cards = [c["card_id"] for c in draft_cards]

    # Obtengo las cartas del jugador
    hand_resp = client.get(f"/player/{player1_id}/cards")
    assert hand_resp.status_code == status.HTTP_200_OK
    player_cards = hand_resp.json()

    hand_cards = [c for c in player_cards if "secret" not in c["name"].lower()]
    assert len(hand_cards) == 6

    # El jugador descarta 3 cartas
    cards_to_discard = [c["id"] for c in hand_cards[:3]]
    for card_id in cards_to_discard:
        r = client.delete(f"/player/{player1_id}/cards/{card_id}?room_id={game_id}")
        assert r.status_code == 200


    # Ejecutar reposición con todas las cartas del draft
    restock_resp = client.post(
        f"/game/{game_id}/{player1_id}/restock?room_id={game_id}",
        json={"cards_id": selected_cards},
    )
    assert restock_resp.status_code == 200

    data = restock_resp.json()
    assert data["player_id"] == player1_id
    assert isinstance(data["player_cards"], list)
    assert len(data["player_cards"]) >= len(selected_cards)


def test_restock_card_in_noexistent_game(client):

    response = client.post(
        f"/game/999/{created_player_id_1}/restock",
        json={"cards_id":[]},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert data["detail"] == "Game not found"


def test_restock_card_with_noexistent_player(client):

    response = client.post(
        f"/game/{created_game_id_1}/999/restock",
        json={"cards_id":[]},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert data["detail"] == "Player not found in this game"


def test_pass_turn_endpoint_success(client):
    res_p1 = client.post("/player", json={
        "name": "Jugador1",
        "birthdate": "1990-01-01",
        "avatar": "http://example.com/p1.png",
        "is_Social_Disgrace": False,
        "is_Your_Turn": True,
        "is_Owner": False,
        "rol": "innocent"
    })
    assert res_p1.status_code == 201
    player_id_1 = res_p1.json()["id"]

    res_p2 = client.post("/player", json={
        "name": "Jugador2",
        "birthdate": "1991-02-02",
        "avatar": "http://example.com/p2.png",
        "is_Social_Disgrace": False,
        "is_Your_Turn": False,
        "is_Owner": False,
        "rol": "innocent"
    })
    assert res_p2.status_code == 201
    player_id_2 = res_p2.json()["id"]
    
    res_game = client.post("/game", json={
        "name": "Game Pass Turn Test",
        "max_players": 2,
        "min_players": 2,
        "current_players": 0,
        "is_started": False,
        "current_turn": 0,
        "turn_id_player": 0,
        "draw_top": 0,
        "discard_top": 0
    })
    assert res_game.status_code == 201
    game_id = res_game.json()["id"]

    res_pg1 = client.post(f"/game/{game_id}/{player_id_1}", json={"position_id_player": None})
    assert res_pg1.status_code == 201
    res_pg2 = client.post(f"/game/{game_id}/{player_id_2}", json={"position_id_player": None})
    assert res_pg2.status_code == 201

    res_update = client.put(
        f"/game/{game_id}",
        json={
            "name": "Game Pass Turn Test",
            "max_players": 2,
            "min_players": 2,
            "current_players": 2,
            "is_started": True,
            "current_turn": 0,
            "turn_id_player": player_id_1,
            "draw_top": 2,
            "discard_top": 0
        },
    )
    assert res_update.status_code == 200

    # Crear 3 cartas en el mazo
    card_ids = []
    for i in range(3):
        res_card = client.post("/card/", json={
            "name": f"Carta Pass {i}",
            "description": "Carta para test de pasar turno",
            "image_url": f"http://example.com/card{i}.png",
            "is_murderes_escapes": False
        })
        assert res_card.status_code == 201
        card_id = res_card.json()["id"]
        card_ids.append(card_id)

        # Asignar carta al mazo del juego
        res_gc = client.post(f"/game-cards/{game_id}/{card_id}")
        assert res_gc.status_code == 200
        
        res_update = client.put(
            f"/game-cards/{game_id}/{card_id}",
            json={
                "card_position": "mazo_robo",
                "card_order": i
            }
        )
        assert res_update.status_code == 200
        
    response = client.get(f"/game-cards/{game_id}/cards")
    print("Response status:", response.status_code)
    print("Response body:", response.text)

    # Crear 6 cartas para el jugador
    player_cards = []
    for j in range(6):
        res_card_player = client.post("/card/", json={
            "name": f"Carta Jugador {j}",
            "description": "Carta en mano del jugador",
            "image_url": f"http://example.com/player{j}.png",
            "is_murderes_escapes": False
        })
        assert res_card_player.status_code == 201
        card_id = res_card_player.json()["id"]
        player_cards.append(card_id)

        res_gc = client.post(f"/player/{player_id_1}/{card_id}")
        assert res_gc.status_code == 200
        
        res_gc = client.post(f"/game-cards/{game_id}/{card_id}")
        assert res_gc.status_code == 200

    response = client.get(f"/player/{player_id_1}/cards")

    response = client.post(f"/game/{game_id}/{player_id_1}/pass?room_id={game_id}")
    assert response.status_code == 200
    
    data = response.json()
    

    assert set(data.keys()) == {"player_id", "discarded_card", "restock_cards", "next_player_id"}

    assert data["player_id"] == player_id_1

    discarded_card = data["discarded_card"]
    assert isinstance(discarded_card, dict)
    assert "card_id" in discarded_card
    assert "card_discard" in discarded_card
    assert isinstance(discarded_card["card_id"], int)
    assert isinstance(data["restock_cards"], list)
    assert len(data["restock_cards"]) >= 1
    assert data["next_player_id"] == player_id_2

def test_pass_turn_endpoint_nonexistent_player(client):
    response = client.post(f"/game/{created_game_id_3}/999/pass")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert data["detail"] == "Player not in game"

def test_pass_turn_endpoint_nonexistent_game(client):
    response = client.post(f"/game/999/{created_player_id_3}/pass")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert data["detail"] == "Game not found"

# --- Crear jugadores para votación ---
def test_create_votation_players(client):
    global created_player_voter_1, created_player_voter_2, created_player_voter_3

    for i in range(1, 4):
        response = client.post(
            "/player",
            json={
                "name": f"Voter {i}",
                "birthdate": "1990-01-01",
                "avatar": f"http://example.com/voter{i}.png",
                "is_Social_Disgrace": False,
                "is_Your_Turn": i == 1,
                "is_Owner": i == 1,
                "rol": "innocent"
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "id" in data

        if i == 1:
            created_player_voter_1 = data["id"]
        elif i == 2:
            created_player_voter_2 = data["id"]
        else:
            created_player_voter_3 = data["id"]


# --- Crear juego para votación ---
def test_create_votation_game(client):
    response = client.post(
        "/game",
        json={
            "name": "Votation Test Game",
            "max_players": 3,
            "min_players": 2,
            "current_players": 0,
            "is_started": True,
            "current_turn": 0,
            "turn_id_player": 0
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    global created_game_votation_id
    created_game_votation_id = data["id"]


# --- Unir jugadores al juego ---
def test_join_players_to_votation_game(client):
    for pid, pos in [
        (created_player_voter_1, 1),
        (created_player_voter_2, 2),
        (created_player_voter_3, 3)
    ]:
        response = client.post(
            f"/game/{created_game_votation_id}/{pid}",
            json={"position_id_player": pos},
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["player_id"] == pid


# --- Crear carta que inicia la votación ---
def test_create_vote_card(client):
    response = client.post(
        "/card/",
        json={
            "name": "Point your Suspicions",
            "description": "Card that triggers a voting phase",
            "image_url": "http://example.com/vote_card.png",
            "is_murderes_escapes": False,
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    global created_card_vote_id
    created_card_vote_id = data["id"]


# --- Iniciar votación ---
def test_start_votation_success(client):
    response = client.get(
        f"/game/{created_game_votation_id}/{created_player_voter_1}/{created_card_vote_id}/start-votation",
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["current_voter_id"] == created_player_voter_1
    assert data["initiator_id"] == created_player_voter_1
    assert data["card_id"] == created_card_vote_id
    assert isinstance(data["players"], list)
    assert len(data["players"]) == 3


# --- Registrar voto válido ---
def test_register_vote_success(client):
    response = client.post(
        f"/game/{created_game_votation_id}/{created_player_voter_1}/vote",
        json={
            "vote": [created_player_voter_1, created_player_voter_2],
            "room_id": created_game_votation_id
        },
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    # Debe retornar un booleano indicando si terminó la votación
    assert isinstance(data, bool)
    assert data is False or data is True


# --- Registrar voto duplicado (misma persona) ---
def test_register_duplicate_vote_error(client):
    response = client.post(
        f"/game/{created_game_votation_id}/{created_player_voter_1}/vote",
        json={
            "vote": [created_player_voter_1, created_player_voter_3],
            "room_id": created_game_votation_id
        },
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert "You already voted" in data["detail"]


# --- Votación en juego inexistente ---
def test_start_votation_game_not_found(client):
    response = client.get(
        f"/game/9999/{created_player_voter_1}/{created_card_vote_id}/start-votation",
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert data["detail"] == "The game not exist"


# --- Registrar voto en juego inexistente ---
def test_register_vote_game_not_found(client):
    response = client.post(
        f"/game/9999/{created_player_voter_1}/vote",
        json={
            "vote": [1, 2],
            "room_id": 9999
        },
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert data["detail"] == "The game not exist"
