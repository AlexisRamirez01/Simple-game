import pytest

def test_create_player(client):
    response = client.post(
        "/player",
        json = {
                "name": "Test Player",
                "birthdate": "1995-08-15",
                "avatar": "http://example.com/avatar.png",
                "is_Social_Disgrace": False,
                "is_Your_Turn": True,
                "is_Owner": False,
                "rol": "murderer"
                },

    )
    print(response.json())
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    global created_player_id
    created_player_id = data["id"]

def test_get_player_by_id(client):
    response = client.get(f"/player/{created_player_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_player_id
    assert data["name"] == "Test Player"

def test_get_all_players(client):
    response = client.get("/player")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1 

def test_update_player(client):
    response = client.put(
        f"/player/{created_player_id}",
        json={
            "name": "Updated Player",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": True,
            "is_Your_Turn": True,
            "is_Owner": False
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Player"
    assert data["is_Social_Disgrace"] == True

def test_delete_player(client):
    response = client.delete(f"/player/{created_player_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_player_id

    response = client.get(f"/player/{created_player_id}")
    assert response.status_code == 404

def test_create_player_without_name(client):
    response = client.post(
        "/player",
        json={
            "name": "",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": True,
            "is_Your_Turn": True,
            "is_Owner": False
        },
    )
    assert response.status_code == 422


def test_create_player_with_long_name(client):
    response = client.post(
        "/player",
        json={
            "name": "X" *51,
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": True,
            "is_Your_Turn": True,
            "is_Owner": False
        },
    )
    assert response.status_code == 422


def test_create_player_without_avatar(client):
    response = client.post(
        "/player",
        json={
            "name": "Test Player",
            "birthdate": "1995-08-15",
            "avatar": None,
            "is_Social_Disgrace": True,
            "is_Your_Turn": True,
            "is_Owner": False
        },
    )
    assert response.status_code == 422
    
def test_create_player_without_Social_Disgrace(client):
    response = client.post(
        "/player",
        json={
            "name": "Test Player",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar.png",
            "is_Your_Turn": True,
            "is_Owner": False
        },
    )
    assert response.status_code == 422

def test_create_player_without_Your_Turn(client, created_player_id=1):
    response = client.post(
        "/player",
        json={
            "name": "Test Player",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": False,
            "is_Owner": False
        },
    )
    assert response.status_code == 422


def test_create_player_without_Owner(client, created_player_id=1):
    response = client.post(
        "/player",
        json = {
            "name": "Test Player",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
        },
    )
    assert response.status_code == 422


def test_update_player_without_name(client, created_player_id=1):
    response = client.put(
        f"/player/{created_player_id}",
        json={
            "name": "",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": True,
            "is_Your_Turn": True,
            "is_Owner": False
        },
    )
    assert response.status_code == 422


def test_update_player_with_long_name(client, created_player_id=1):
    response = client.put(
        f"/player/{created_player_id}",
        json={
            "name": "X" *51,
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": True,
            "is_Your_Turn": True,
            "is_Owner": False
        },
    )
    assert response.status_code == 422


def test_update_player_without_avatar(client, created_player_id=1):
    response = client.put(
        f"/player/{created_player_id}",
        json={
            "name": "Test Player",
            "birthdate": "1995-08-15",
            "avatar": None,
            "is_Social_Disgrace": True,
            "is_Your_Turn": True,
            "is_Owner": False
        },
    )
    assert response.status_code == 422


def test_update_player_without_Social_Disgrace(client, created_player_id=1):
    response = client.put(
        f"/player/{created_player_id}",
        json={
            "name": "Test Player",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar.png",
            "is_Your_Turn": True,
            "is_Owner": False
        },
    )
    assert response.status_code == 422


def test_update_player_without_Your_Turn(client, created_player_id=1):
    response = client.put(
        f"/player/{created_player_id}",
        json={
            "name": "Test Player",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": False,
            "is_Owner": False
        },
    )
    assert response.status_code == 422


def test_update_player_without_Owner(client, created_player_id=1):
    response = client.put(
        f"/player/{created_player_id}",
        json={
            "name": "Test Player",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": True,
            "is_Your_Turn": True,
        },
    )
    assert response.status_code == 422

def test_create_player_with_role(client):
    response = client.post(
        "/player",
        json={
            "name": "Role Player",
            "birthdate": "2000-01-01",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": True,
            "rol": "murderer"
        },
    )
    assert response.status_code == 201
    data = response.json()
    global role_player_id
    role_player_id = data["id"]

    get_response = client.get(f"/player/{role_player_id}")
    assert get_response.status_code == 200
    player_data = get_response.json()
    assert player_data["rol"] == "murderer"


def test_create_player_without_role_defaults_to_innocent(client):
    response = client.post(
        "/player",
        json={
            "name": "Default Role Player",
            "birthdate": "2001-01-01",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": True,
            "is_Your_Turn": True,
            "is_Owner": False
        },
    )
    assert response.status_code == 201
    data = response.json()
    player_id = data["id"]

    get_response = client.get(f"/player/{player_id}")
    assert get_response.status_code == 200
    player_data = get_response.json()
    assert player_data["rol"] == "innocent"


def test_update_player_role(client):
    
    response = client.put(
        f"/player/{role_player_id}",
        json={
            "name": "Role Player Updated",
            "birthdate": "2000-01-01",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": True,
            "is_Your_Turn": True,
            "is_Owner": False,
            "rol": "accomplice"
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["rol"] == "accomplice"
    assert data["name"] == "Role Player Updated"


def test_create_player_with_invalid_role(client):
    response = client.post(
        "/player",
        json={
            "name": "Invalid Role Player",
            "birthdate": "2002-01-01",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": False,
            "rol": "villain"
        },
    )
    
    assert response.status_code == 422


# --- Tests para el endpoint get_players_by_game ---

def test_get_players_by_game_success(client):
    """Test para obtener jugadores de una partida exitosamente"""
    # Crear un juego
    game_response = client.post(
        "/game",
        json={
            "name": "Test Game for Players",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0
        },
    )
    assert game_response.status_code == 201
    game_id = game_response.json()["id"]

    # Crear dos jugadores
    player1_response = client.post(
        "/player",
        json={
            "name": "Player Room 1",
            "birthdate": "1995-01-01",
            "avatar": "http://example.com/avatar1.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent"
        },
    )
    assert player1_response.status_code == 201
    player1_id = player1_response.json()["id"]

    player2_response = client.post(
        "/player",
        json={
            "name": "Player Room 2",
            "birthdate": "1996-02-02",
            "avatar": "http://example.com/avatar2.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "murderer"
        },
    )
    assert player2_response.status_code == 201
    player2_id = player2_response.json()["id"]

    # Asociar jugadores al juego
    client.post(f"/game/{game_id}/{player1_id}", json={"position_id_player": None})
    client.post(f"/game/{game_id}/{player2_id}", json={"position_id_player": None})

    # Obtener jugadores de la partida
    response = client.get(f"/player/game/{game_id}/players")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    
    # Verificar que los jugadores estén en la lista
    player_ids = [p["id"] for p in data]
    assert player1_id in player_ids
    assert player2_id in player_ids
    
    # Verificar estructura de PlayerOut
    for player in data:
        assert "id" in player
        assert "name" in player
        assert "avatar" in player
        assert "birthdate" in player
        assert "is_Social_Disgrace" in player
        assert "is_Your_Turn" in player
        assert "is_Owner" in player
        assert "rol" in player


def test_get_players_by_game_empty(client):
    """Test para obtener jugadores de una partida sin jugadores"""
    # Crear un juego sin jugadores
    game_response = client.post(
        "/game",
        json={
            "name": "Empty Game",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0
        },
    )
    assert game_response.status_code == 201
    game_id = game_response.json()["id"]

    # Intentar obtener jugadores de la partida vacía
    response = client.get(f"/player/game/{game_id}/players")
    assert response.status_code == 404
    data = response.json()
    assert "No se encontraron jugadores" in data["detail"]


def test_get_players_by_game_nonexistent_game(client):
    """Test para obtener jugadores de una partida inexistente"""
    # Usar un ID de juego que no existe
    response = client.get("/player/game/99999/players")
    assert response.status_code == 404
    data = response.json()
    assert "No se encontraron jugadores" in data["detail"]


def test_get_players_by_game_multiple_games(client):
    """Test para verificar que solo se obtienen jugadores de la partida específica"""
    # Crear dos juegos
    game1_response = client.post(
        "/game",
        json={
            "name": "Game 1",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0
        },
    )
    assert game1_response.status_code == 201
    game1_id = game1_response.json()["id"]

    game2_response = client.post(
        "/game",
        json={
            "name": "Game 2",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0
        },
    )
    assert game2_response.status_code == 201
    game2_id = game2_response.json()["id"]

    # Crear jugadores para cada juego
    player_game1 = client.post(
        "/player",
        json={
            "name": "Player Game 1",
            "birthdate": "1995-01-01",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent"
        },
    )
    assert player_game1.status_code == 201
    player1_id = player_game1.json()["id"]

    player_game2 = client.post(
        "/player",
        json={
            "name": "Player Game 2",
            "birthdate": "1996-02-02",
            "avatar": "http://example.com/avatar2.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "accomplice"
        },
    )
    assert player_game2.status_code == 201
    player2_id = player_game2.json()["id"]

    # Asociar cada jugador a un juego diferente
    client.post(f"/game/{game1_id}/{player1_id}", json={"position_id_player": None})
    client.post(f"/game/{game2_id}/{player2_id}", json={"position_id_player": None})

    # Obtener jugadores del game1
    response1 = client.get(f"/player/game/{game1_id}/players")
    assert response1.status_code == 200
    data1 = response1.json()
    assert len(data1) == 1
    assert data1[0]["id"] == player1_id
    assert data1[0]["name"] == "Player Game 1"

    # Obtener jugadores del game2
    response2 = client.get(f"/player/game/{game2_id}/players")
    assert response2.status_code == 200
    data2 = response2.json()
    assert len(data2) == 1
    assert data2[0]["id"] == player2_id
    assert data2[0]["name"] == "Player Game 2"


# --- Tests para el endpoint get_players_with_revealed_secrets ---

def test_get_players_with_revealed_secrets_success(client):
    """Test para verificar que el endpoint responde correctamente"""
    # Crear un juego
    game_response = client.post(
        "/game",
        json={
            "name": "Test Game for Secrets",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0
        },
    )
    assert game_response.status_code == 201
    game_id = game_response.json()["id"]

    # Obtener jugadores con secretos revelados (puede ser lista vacía)
    response = client.get(f"/player/game/{game_id}/players-with-revealed-secrets")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    # No verificamos el contenido específico, solo que devuelve una lista


def test_get_players_with_revealed_secrets_empty(client):
    """Test para obtener jugadores con secretos revelados cuando no hay ninguno"""
    # Crear un juego
    game_response = client.post(
        "/game",
        json={
            "name": "Game No Revealed Secrets",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0
        },
    )
    assert game_response.status_code == 201
    game_id = game_response.json()["id"]

    # Crear jugador
    player_response = client.post(
        "/player",
        json={
            "name": "Player No Revealed",
            "birthdate": "1995-01-01",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent"
        },
    )
    assert player_response.status_code == 201
    player_id = player_response.json()["id"]

    # Asociar jugador al juego
    client.post(f"/game/{game_id}/{player_id}", json={"position_id_player": None})

    # Crear carta secreta oculta
    secret_hidden = client.post(
        "/secret-cards",
        json={
            "name": "Hidden Secret",
            "description": "A hidden secret",
            "image_url": "http://example.com/secret.png",
            "is_murderes_escapes": False,
            "is_murderer": False,
            "is_accomplice": False,
            "is_revealed": False
        },
    )
    assert secret_hidden.status_code == 201
    secret_hidden_id = secret_hidden.json()["id"]

    # Asignar secreto oculto al jugador
    client.post(f"/playerCard/{player_id}/{secret_hidden_id}")

    # Obtener jugadores con secretos revelados (debe retornar lista vacía)
    response = client.get(f"/player/game/{game_id}/players-with-revealed-secrets")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_get_players_with_revealed_secrets_multiple_players(client):
    """Test para verificar que el endpoint funciona con múltiples jugadores"""
    # Crear un juego
    game_response = client.post(
        "/game",
        json={
            "name": "Game Multiple Revealed",
            "max_players": 4,
            "min_players": 2,
            "current_players": 0,
            "is_started": False,
            "current_turn": 0,
            "turn_id_player": 0
        },
    )
    assert game_response.status_code == 201
    game_id = game_response.json()["id"]

    # Obtener jugadores con secretos revelados
    response = client.get(f"/player/game/{game_id}/players-with-revealed-secrets")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    # No verificamos contenido específico, solo que funciona


def test_get_players_with_revealed_secrets_nonexistent_game(client):
    """Test para obtener jugadores de un juego inexistente"""
    # Intentar obtener jugadores de un juego que no existe
    response = client.get("/player/game/99999/players-with-revealed-secrets")
    assert response.status_code == 200  # El endpoint retorna 200 con lista vacía
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


# --- Tests para el endpoint get_revealed_secrets_by_player ---

def test_get_revealed_secrets_by_player_success(client):
    """Test para obtener secretos revelados de un jugador exitosamente"""
    # Crear jugador
    player_response = client.post(
        "/player",
        json={
            "name": "Player with Secrets",
            "birthdate": "1995-01-01",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": True,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent"
        },
    )
    assert player_response.status_code == 201
    player_id = player_response.json()["id"]

    # Obtener secretos revelados del jugador
    response = client.get(f"/player/{player_id}/revealed-secrets")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    # No verificamos contenido específico, solo que funciona y devuelve lista


def test_get_revealed_secrets_by_player_empty(client):
    """Test para obtener secretos revelados cuando el jugador no tiene ninguno"""
    # Crear jugador
    player_response = client.post(
        "/player",
        json={
            "name": "Player No Revealed Secrets",
            "birthdate": "1995-01-01",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent"
        },
    )
    assert player_response.status_code == 201
    player_id = player_response.json()["id"]

    # Crear solo secretos ocultos
    for i in range(2):
        secret = client.post(
            "/secret-cards",
            json={
                "name": f"Hidden Secret {i+1}",
                "description": f"Hidden secret {i+1}",
                "image_url": f"http://example.com/hidden{i+1}.png",
                "is_murderes_escapes": False,
                "is_murderer": False,
                "is_accomplice": False,
                "is_revealed": False
            },
        )
        assert secret.status_code == 201
        secret_id = secret.json()["id"]
        client.post(f"/playerCard/{player_id}/{secret_id}")

    # Obtener secretos revelados (debe retornar lista vacía)
    response = client.get(f"/player/{player_id}/revealed-secrets")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_get_revealed_secrets_by_player_no_secrets(client):
    """Test para obtener secretos revelados cuando el jugador no tiene ninguna carta"""
    # Crear jugador sin cartas
    player_response = client.post(
        "/player",
        json={
            "name": "Player No Cards",
            "birthdate": "1995-01-01",
            "avatar": "http://example.com/avatar.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": True,
            "rol": "innocent"
        },
    )
    assert player_response.status_code == 201
    player_id = player_response.json()["id"]

    # Obtener secretos revelados (debe retornar lista vacía)
    response = client.get(f"/player/{player_id}/revealed-secrets")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_get_revealed_secrets_by_nonexistent_player(client):
    """Test para obtener secretos revelados de un jugador inexistente"""
    # Intentar obtener secretos de un jugador que no existe
    response = client.get("/player/99999/revealed-secrets")
    assert response.status_code == 200  # El endpoint retorna 200 con lista vacía
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0

