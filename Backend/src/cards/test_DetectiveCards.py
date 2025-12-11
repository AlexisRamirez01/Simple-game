import pytest
from unittest.mock import patch
from src.cards.models import DetectiveCard


created_detective_card_id = None

def test_create_detective_card(client):
    
    global created_detective_card_id
    response = client.post(
        "/detective-cards/",
        json={
            "name": "Sherlock Holmes",
            "description": "El mejor detective.",
            "image_url": "http://example.com/sherlock.png",
            "is_murderes_escapes": False,
            "requiredAmount": 5
        }
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert "id" in data
    assert data["name"] == "Sherlock Holmes"
    assert data["requiredAmount"] == 5
    created_detective_card_id = data["id"]

def test_get_detective_card_by_id(client):
    assert created_detective_card_id is not None, "Debe crearse una carta primero"
    response = client.get(f"/detective-cards/{created_detective_card_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_detective_card_id
    assert data["name"] == "Sherlock Holmes"
    assert data["requiredAmount"] == 5

def test_get_all_detective_cards(client):
    """Test para obtener todas las cartas de detective."""
    response = client.get("/detective-cards/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(c["id"] == created_detective_card_id for c in data)

def test_update_detective_card(client):
    """Test para actualizar una carta de detective."""
    assert created_detective_card_id is not None, "Debe crearse una carta primero"
    response = client.put(
        f"/detective-cards/{created_detective_card_id}",
        json={
            "name": "Hercule Poirot",
            "description": "Con células grises.",
            "image_url": "http://example.com/poirot.png",
            "is_murderes_escapes": False,
            "requiredAmount": 8
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Hercule Poirot"
    assert data["requiredAmount"] == 8

def test_get_required_amount_for_card(client):
    """Test para obtener solo el requiredAmount de una carta."""
    assert created_detective_card_id is not None, "Debe crearse una carta primero"
    response = client.get(f"/detective-cards/{created_detective_card_id}/required_amount")
    assert response.status_code == 200
    data = response.json()
    assert data["requiredAmount"] == 8 # Verificamos con el valor actualizado

def test_get_detective_cards_by_player(client):
    """Test para obtener las cartas de detective de un jugador."""
    # Creamos un objeto mock de la carta para que el servicio lo devuelva
    fake_card = DetectiveCard(
        id=created_detective_card_id,
        name="Hercule Poirot",
        description="Con células grises.",
        image_url="http://example.com/poirot.png",
        is_murderes_escapes=False,
        requiredAmount=8
    )

    # "Parcheamos" el método del servicio para que devuelva nuestra carta falsa
    with patch("src.cards.servicesDetectiveCard.DetectiveCardService.get_detective_cards_by_player", return_value=[fake_card]):
        player_id = 123
        response = client.get(f"/detective-cards/player/{player_id}")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == fake_card.id
        assert data[0]["name"] == fake_card.name
        assert data[0]["requiredAmount"] == fake_card.requiredAmount

def test_delete_detective_card(client):
    """Test para eliminar una carta de detective."""
    assert created_detective_card_id is not None, "Debe crearse una carta primero"
    response = client.delete(f"/detective-cards/{created_detective_card_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_detective_card_id
    
    # Verificamos que la carta ya no exista
    response = client.get(f"/detective-cards/{created_detective_card_id}")
    assert response.status_code == 404

def test_create_detective_card_missing_field(client):
    """Test para verificar que falla si falta el campo requiredAmount."""
    response = client.post(
        "/detective-cards/",
        json={
            "name": "Incomplete Card",
            "description": "Falta requiredAmount.",
            "image_url": "http://example.com/incomplete.png",
            "is_murderes_escapes": False
        }
    )
    assert response.status_code == 422 # Error de validación de Pydantic