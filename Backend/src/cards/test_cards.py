import pytest

def test_create_card(client):
    response = client.post(
        "/card",
        json={
            "name": "Test Card",
            "description": "Una carta de prueba",
            "image_url": "http://example.com/image.png",
            "is_murderes_escapes": True
        },
    )
    print(response.json())
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    global created_card_id
    created_card_id = data["id"]

def test_get_card_by_id(client):
    response = client.get(f"/card/{created_card_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_card_id
    assert data["name"] == "Test Card"

def test_get_all_cards(client):
    response = client.get("/card")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1 

def test_update_card(client):
    response = client.put(
        f"/card/{created_card_id}",
        json={
            "name": "Updated Card",
            "description": "Carta modificada",
            "image_url": "http://example.com/updated.png",
            "is_murderes_escapes": False
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Card"
    assert data["is_murderes_escapes"] == False

def test_delete_card(client):
    response = client.delete(f"/card/{created_card_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_card_id

    response = client.get(f"/card/{created_card_id}")
    assert response.status_code == 404

def test_create_card_without_name(client):
    response = client.post(
        "/card",
        json={
            "name": "",
            "description": "Una carta sin nombre",
            "image_url": "http://example.com/image.png",
            "is_murderes_escapes": True
        },
    )
    assert response.status_code == 422


def test_create_card_with_long_description(client):
    response = client.post(
        "/card",
        json={
            "name": "Test Card",
            "description": "x" * 201,
            "image_url": "http://example.com/image.png",
            "is_murderes_escapes": True
        },
    )
    assert response.status_code == 422

def test_create_card_with_long_name(client):
    response = client.post(
        "/card",
        json={
            "name": "Test" *51,
            "description": "Descripción válida" ,
            "image_url": "http://example.com/image.png",
            "is_murderes_escapes": True
        },
    )
    assert response.status_code == 422


def test_create_card_without_image_url(client):
    response = client.post(
        "/card",
        json={
            "name": "Test Card",
            "description": "Descripción válida",
            "image_url": None,
            "is_murderes_escapes": True
        },
    )
    assert response.status_code == 422
    
def test_create_card_without_murderes(client):
    response = client.post(
        "/card",
        json={
            "name": "Test Card",
            "description": "Descripción válida",
            "image_url": "http://example.com/image.png",
        },
    )
    assert response.status_code == 422

def test_update_card_without_name(client, created_card_id=1):
    response = client.put(
        f"/card/{created_card_id}",
        json={
            "name": "",
            "description": "Una carta sin nombre",
            "image_url": "http://example.com/image.png",
            "is_murderes_escapes": True
        },
    )
    assert response.status_code == 422


def test_update_card_with_long_description(client, created_card_id=1):
    response = client.put(
        f"/card/{created_card_id}",
        json={
            "name": "Test Card",
            "description": "x" * 201,
            "image_url": "http://example.com/image.png",
            "is_murderes_escapes": True
        },
    )
    assert response.status_code == 422


def test_update_card_with_long_name(client, created_card_id=1):
    response = client.put(
        f"/card/{created_card_id}",
        json={
            "name": "Test" * 51,
            "description": "Descripción válida",
            "image_url": "http://example.com/image.png",
            "is_murderes_escapes": True
        },
    )
    assert response.status_code == 422


def test_update_card_without_image_url(client, created_card_id=1):
    response = client.put(
        f"/card/{created_card_id}",
        json={
            "name": "Test Card",
            "description": "Descripción válida",
            "image_url": None,
            "is_murderes_escapes": True
        },
    )
    assert response.status_code == 422


def test_update_card_without_murderes(client, created_card_id=1):
    response = client.put(
        f"/card/{created_card_id}",
        json={
            "name": "Test Card",
            "description": "Descripción válida",
            "image_url": "http://example.com/image.png"
        },
    )
    assert response.status_code == 422
