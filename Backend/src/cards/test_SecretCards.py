import pytest
from src.websocket import manager
from unittest.mock import AsyncMock, patch

created_secret_card_id = None

def test_create_secret_card(client):
    global created_secret_card_id
    response = client.post(
        "/secret-cards/",
        json={
            "name": "Secret Test",
            "description": "Carta secreta de prueba",
            "image_url": "http://example.com/image.png",
            "is_murderes_escapes": True,
            "is_murderer": True,
            "is_accomplice": False,
            "is_revealed": False
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    created_secret_card_id = data["id"]


def test_get_secret_card_by_id(client):
    response = client.get(f"/secret-cards/{created_secret_card_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_secret_card_id
    assert data["name"] == "Secret Test"
    assert data["is_murderer"] == True
    assert data["is_revealed"] == False


def test_get_all_secret_cards(client):
    response = client.get("/secret-cards/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(c["id"] == created_secret_card_id for c in data)


def test_update_secret_card(client):
    response = client.put(
        f"/secret-cards/{created_secret_card_id}",
        json={
            "name": "Secret Updated",
            "description": "Carta secreta modificada",
            "image_url": "http://example.com/updated.png",
            "is_murderes_escapes": False,
            "is_murderer": False,
            "is_accomplice": True,
            "is_revealed": False
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Secret Updated"
    assert data["is_accomplice"] == True
    assert data["is_revealed"] == False


def test_reveal_secret_card(client):
    with patch("src.cards.endpointsSecretCard.WinBySocialDisgrace") as mock_win:
        # Mockea el método async para que no haga nada ni levante excepciones
        mock_instance = mock_win.return_value
        mock_instance.check_win_by_social_disgrace = AsyncMock(return_value=None)

        response = client.patch(f"/secret-cards/{created_secret_card_id}/reveal")

        assert response.status_code == 200
        data = response.json()
        assert data["is_revealed"] is True


def test_is_revealed_secret_card(client):
    response = client.get(f"/secret-cards/{created_secret_card_id}/is_revealed")
    assert response.status_code == 200
    assert response.json() == True


def test_delete_secret_card(client):
    response = client.delete(f"/secret-cards/{created_secret_card_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_secret_card_id
    
    response = client.get(f"/secret-cards/{created_secret_card_id}")
    assert response.status_code == 404
    

def test_create_secret_card_without_name(client):
    response = client.post(
        "/secret-cards/",
        json={
            "name": "",
            "description": "Carta sin nombre",
            "image_url": "http://example.com/image.png",
            "is_murderes_escapes": True,
            "is_murderer": False,
            "is_accomplice": False,
            "is_revealed": False
        }
    )
    assert response.status_code == 422


def test_create_secret_card_with_long_name(client):
    response = client.post(
        "/secret-cards/",
        json={
            "name": "x" * 51,
            "description": "Carta con nombre muy largo",
            "image_url": "http://example.com/image.png",
            "is_murderes_escapes": True,
            "is_murderer": False,
            "is_accomplice": False,
            "is_revealed": False
        }
    )
    assert response.status_code == 422


def test_create_secret_card_with_long_description(client):
    response = client.post(
        "/secret-cards/",
        json={
            "name": "Nombre válido",
            "description": "x" * 201,
            "image_url": "http://example.com/image.png",
            "is_murderes_escapes": True,
            "is_murderer": False,
            "is_accomplice": False,
            "is_revealed": False
        }
    )
    assert response.status_code == 422


def test_create_secret_card_without_image_url(client):
    response = client.post(
        "/secret-cards/",
        json={
            "name": "Nombre válido",
            "description": "Descripción válida",
            "image_url": None,
            "is_murderes_escapes": True,
            "is_murderer": False,
            "is_accomplice": False,
            "is_revealed": False
        }
    )
    assert response.status_code == 422


def test_create_secret_card_missing_boolean_flags(client):
    response = client.post(
        "/secret-cards/",
        json={
            "name": "Nombre válido",
            "description": "Descripción válida",
            "image_url": "http://example.com/image.png",
            "is_murderes_escapes": True
        }
    )
    assert response.status_code == 422

from unittest.mock import patch
from src.cards.models import SecretCard

def test_get_secret_cards_by_player(client):
    fake_card = SecretCard(
        id=1,
        name="Secret Player Test",
        description="Carta secreta mockeada",
        image_url="http://example.com/image.png",
        is_murderes_escapes=True,
        is_murderer=True,
        is_accomplice=False,
        is_revealed=False
    )

    with patch("src.cards.servicesSecretCard.SecretCardService.get_secret_cards_by_player", return_value=[fake_card]):
        player_id = 1
        response = client.get(f"/secret-cards/player/{player_id}")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == fake_card.id
        assert data[0]["name"] == fake_card.name
        assert data[0]["is_murderer"] == fake_card.is_murderer
        assert data[0]["is_revealed"] == fake_card.is_revealed