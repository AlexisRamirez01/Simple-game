import pytest
from fastapi import status
from src.game.models import Game
from src.gameCard.models import CardPosition, GameCard
from src.playerCard.models import player_card_table
from src.gamePlayer.models import PlayerGame
from src.cards.models import Card

# --- Crear jugadores ---
def test_create_delay_players(client):
    response = client.post(
        "/player",
        json={
            "name": "Delay Player 1",
            "birthdate": "1995-08-15",
            "avatar": "http://example.com/avatar1.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": True,
            "is_Owner": False,
            "rol": "innocent"
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    global delay_player_id_1
    delay_player_id_1 = response.json()["id"]

    response = client.post(
        "/player",
        json={
            "name": "Delay Player 2",
            "birthdate": "1993-05-20",
            "avatar": "http://example.com/avatar2.png",
            "is_Social_Disgrace": False,
            "is_Your_Turn": False,
            "is_Owner": False,
            "rol": "murderer"
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    global delay_player_id_2
    delay_player_id_2 = response.json()["id"]


# --- Crear juego ---
def test_create_delay_game(client):
    response = client.post(
        "/game",
        json={
            "name": "Delay Game",
            "max_players": 5,
            "min_players": 2,
            "current_players": 2,
            "is_started": True,
            "current_turn": 0,
            "turn_id_player": 0
        },
    )
    assert response.status_code == status.HTTP_201_CREATED
    global delay_game_id
    delay_game_id = response.json()["id"]


# --- Crear carta evento ---
def test_create_delay_event_card(client):
    response = client.post(
        "/event-cards/",
        json={
            "name": "event_delayescape",
            "description": "Devuelve hasta 5 cartas del descarte al mazo de robo.",
            "image_url": "http://example.com/delay.png",
            "is_murderes_escapes": False,
            "was_played": False,
            "was_traded": False,
            "is_cancellable": False
        }
    )
    assert response.status_code == 201
    data = response.json()
    global delay_card_id
    delay_card_id = data["id"]
    assert data["name"] == "event_delayescape"


# --- Ejecucion correcta: mueve cartas del descarte al mazo de robo ---
def test_execute_delay_the_murderers_escape_success(client, db_session):
    # --- Asegurar relación GameCard de la carta jugada ---
    game_card = db_session.query(GameCard).filter_by(
        game_id=delay_game_id,
        card_id=delay_card_id
    ).first()
    if not game_card:
        game_card = GameCard(game_id=delay_game_id, card_id=delay_card_id)
        db_session.add(game_card)
        db_session.commit()

    # --- PlayerCard (la carta pertenece al jugador que la juega) ---
    db_session.execute(
        player_card_table.insert().values(
            player_id=delay_player_id_1,
            card_id=delay_card_id
        )
    )
    db_session.commit()

    # --- Configurar game ---
    game = db_session.get(Game, delay_game_id)
    # draw_top inicial (por ejemplo 2)
    game.draw_top = 2
    # discard_top: vamos a poner 3 cartas en el descarte
    game.discard_top = 3
    db_session.commit()

    # --- Añadir 3 cartas al mazo de descarte ---
    discard_card_ids = []
    for i in range(3):
        c = Card(
            name=f"DiscardCard {i}",
            description="test",
            image_url="url",
            is_murderes_escapes=False
        )
        db_session.add(c)
        db_session.commit()
        discard_card_ids.append(c.id)

        gc = GameCard(
            game_id=delay_game_id,
            card_id=c.id,
            card_position=CardPosition.MAZO_DESCARTE,
            card_order=i + 1
        )
        db_session.add(gc)
    db_session.commit()

    # --- Ejecutar el efecto ---
    payload = {
        "game_id": delay_game_id,
        "player_id": delay_player_id_1,
        # enviamos las cartas que queremos devolver (hasta 5, acá 3)
        "cards": [{"id": cid} for cid in discard_card_ids]
    }

    response = client.put(
        f"/event-cards/play/{delay_card_id}?room_id={delay_game_id}",
        json=payload
    )

    # --- Verificaciones HTTP y respuesta del endpoint ---
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == "event_delayescape"
    assert data["was_played"] is True

    # --- Verificar cambios en el estado del juego ---
    game_after = db_session.get(Game, delay_game_id)
    # draw_top aumentó en 3 (las 3 cartas movidas del descarte al mazo)
    assert game_after.draw_top == 2 + 3
    # discard_top quedó en 0 (3 - 3)
    assert game_after.discard_top == 0


# --- Carta jugada no encontrada ---
def test_delay_murderer_card_not_found(client):
    payload = {"game_id": 1, "player_id": 1, "cards": []}
    response = client.put(
        "/event-cards/play/999?room_id=1",
        json=payload
    )

    assert response.status_code == 404
    assert "EventCard with id 999 does not exist" in response.json()["detail"]


# --- Carta jugada no pertenece al jugador ---
def test_delay_murderer_card_not_belongs_to_player(client, db_session):
    # --- Asegurar relación GameCard de la carta jugada ---
    game_card = db_session.query(GameCard).filter_by(
        game_id=delay_game_id,
        card_id=delay_card_id
    ).first()
    if not game_card:
        game_card = GameCard(game_id=delay_game_id, card_id=delay_card_id)
        db_session.add(game_card)
        db_session.commit()
    
    # Simular que el jugador no tiene la carta jugada
    payload = {"game_id": delay_game_id, "player_id": 999, "cards": []}
    response = client.put(
        f"/event-cards/play/{delay_card_id}?room_id={delay_game_id}",
        json=payload
    )

    assert response.status_code == 404
    assert "La carta jugada no pertenece al jugador." in response.json()["detail"]
    
    
# --- Carta en el mazo de descarte no encontrada ---
def test_delay_murderer_card_in_discard_not_found(client, db_session):
    # --- Asegurar relación GameCard de la carta jugada ---
    game_card = db_session.query(GameCard).filter_by(
        game_id=delay_game_id,
        card_id=delay_card_id
    ).first()
    if not game_card:
        game_card = GameCard(
            game_id=delay_game_id,
            card_id=delay_card_id,
        )
        db_session.add(game_card)
        db_session.commit()

    # --- Asegurar que el jugador tiene la carta jugada ---
    existing_relation = db_session.execute(
        player_card_table.select().where(
            player_card_table.c.player_id == 1,
            player_card_table.c.card_id == delay_card_id
        )
    ).fetchone()

    if not existing_relation:
        db_session.execute(
            player_card_table.insert().values(
                player_id=1,
                card_id=delay_card_id
            )
        )
        db_session.commit()

    # --- Configurar el juego ---
    game = db_session.get(Game, delay_game_id)
    game.discard_top = 1
    db_session.commit()

    # --- Payload con carta inexistente ---
    payload = {
        "game_id": delay_game_id,
        "player_id": 1,
        "cards": [{"id": 999}]  # carta inexistente en el mazo de descarte
    }

    response = client.put(
        f"/event-cards/play/{delay_card_id}?room_id={delay_game_id}",
        json=payload
    )

    # --- Verificaciones ---
    assert response.status_code == 404
    assert "Carta en el top del mazo de descarte no encontrada." in response.json()["detail"]