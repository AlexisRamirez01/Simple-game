import pytest
from fastapi import status
from src.game.models import Game
from src.gameCard.models import CardPosition, GameCard
from src.playerCard.models import player_card_table
from src.gamePlayer.models import PlayerGame
from src.cards.models import Card

# --- Crear jugadores ---
def test_create_paddington_players(client):
    response = client.post(
        "/player",
        json={
            "name": "Paddington Player 1",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar1.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": False,
            "rol": "innocent"
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    global paddington_player_id_1
    paddington_player_id_1 = response.json()["id"]

    response = client.post(
        "/player",
        json={
            "name": "Paddington Player 2",
            "birthdate": "1993-05-20",
            "avatar": "http://example.com/avatar2.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "murderer"
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    global paddington_player_id_2
    paddington_player_id_2 = response.json()["id"]


# --- Crear juego ---
def test_create_paddington_game(client):
    response = client.post(
        "/game",
        json={
            "name": "Paddington Game",
            "max_players": 5,
            "min_players": 2,
            "current_players": 2,
            "is_started": True,
            "current_turn": 0,
            "turn_id_player": 0
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    global paddington_game_id
    paddington_game_id = response.json()["id"]


# --- Crear carta ---
def test_create_early_train_to_paddington_card(client):
    response = client.post(
        "/event-cards/",
        json={
            "name": "event_earlytrain",
            "description": "Descarta hasta 6 cartas del mazo de robo.",
            "image_url": "http://example.com/train.png",
            "is_murderes_escapes": False,
            "was_played": False,
            "was_traded": False,
            "is_cancellable": False
        }
    )
    assert response.status_code == 201
    data = response.json()
    global paddington_card_id
    paddington_card_id = data["id"]
    assert data["name"] == "event_earlytrain"


# --- Ejecutar el evento ---
def test_execute_early_train_to_paddington(client, db_session):
    # --- Relación GameCard de la carta jugada ---
    game_card = GameCard(
        game_id=paddington_game_id,
        card_id=paddington_card_id,
    )
    db_session.add(game_card)
    db_session.commit()

    # --- PlayerCard ---
    db_session.execute(
        player_card_table.insert().values(
            player_id=paddington_player_id_1,
            card_id=paddington_card_id
        )
    )
    db_session.commit()

    # --- Game configurado ---
    game = db_session.get(Game, paddington_game_id)
    game.draw_top = 10
    game.discard_top = 0
    db_session.commit()

    # --- PlayerGame ---
    db_session.add_all([
        PlayerGame(game_id=paddington_game_id, player_id=paddington_player_id_1),
        PlayerGame(game_id=paddington_game_id, player_id=paddington_player_id_2)
    ])
    db_session.commit()

    # --- Cartas del mazo de robo ---
    for i in range(10):
        c = Card(
            name=f"Card {i}",
            description="test",
            image_url="url",
            is_murderes_escapes=False
        )
        db_session.add(c)
        db_session.commit()

        gc = GameCard(
            game_id=paddington_game_id,
            card_id=c.id,
            card_position=CardPosition.MAZO_ROBO,
            card_order=i + 1
        )
        db_session.add(gc)
    db_session.commit()

    # --- Ejecutar el efecto ---
    payload = {
        "game_id": paddington_game_id,
        "player_id": paddington_player_id_1
    }

    response = client.put(
        f"/event-cards/play/{paddington_card_id}?room_id={paddington_game_id}",
        json=payload
    )

    # --- Verificar resultado ---
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == "event_earlytrain"
    assert data["was_played"] is True
    
    
# Carta jugada no existe
def test_card_not_found(client, db_session):
    payload = {"game_id": 999, "player_id": 1}
    response = client.put(
        f"/event-cards/play/1000?room_id={paddington_game_id}",
        json=payload
    )
    assert response.status_code == 404
    assert "EventCard with id 1000 does not exist" in response.text
    

# La carta no pertenece al jugador
def test_card_not_owned_by_player(client, db_session):
    # Simula carta que no está en player_card_table
    game_card = GameCard(game_id=paddington_game_id, card_id=paddington_card_id)
    db_session.add(game_card)
    db_session.commit()

    payload = {"game_id": paddington_game_id, "player_id": 999}
    response = client.put(
        f"/event-cards/play/{paddington_card_id}?room_id={paddington_game_id}",
        json=payload
    )
    assert response.status_code == 404
    assert "La carta jugada no pertenece al jugador." in response.text
    

# Se juega cuando hay menos de 6 cartas en el mazo de robo (el asesino escapa)
def test_murderer_escapes(client, db_session):
    # --- Buscar o crear la relación GameCard de la carta jugada ---
    game_card = db_session.query(GameCard).filter_by(
        game_id=paddington_game_id,
        card_id=paddington_card_id
    ).first()
    if not game_card:
        game_card = GameCard(
            game_id=paddington_game_id,
            card_id=paddington_card_id,
        )
        db_session.add(game_card)
        db_session.commit()

    # --- PlayerCard ---
    db_session.execute(
        player_card_table.insert().values(
            player_id=paddington_player_id_1,
            card_id=paddington_card_id
        )
    )
    db_session.commit()

    # --- Game configurado ---
    game = db_session.get(Game, paddington_game_id)
    game.draw_top = 5
    game.discard_top = 0
    db_session.commit()

    # --- Cartas del mazo de robo (menos de 6) ---
    for i in range(5):
        c = Card(
            name=f"Card {i}",
            description="test",
            image_url="url",
            is_murderes_escapes=False
        )
        db_session.add(c)
        db_session.commit()

        gc = GameCard(
            game_id=paddington_game_id,
            card_id=c.id,
            card_position=CardPosition.MAZO_ROBO,
            card_order=i + 1
        )
        db_session.add(gc)
    db_session.commit()

    # --- Ejecutar el efecto ---
    payload = {
        "game_id": paddington_game_id,
        "player_id": paddington_player_id_1
    }

    response = client.put(
        f"/event-cards/play/{paddington_card_id}?room_id={paddington_game_id}",
        json=payload
    )

    # --- Verificaciones ---
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "event_earlytrain"
    assert data["was_played"] is True
