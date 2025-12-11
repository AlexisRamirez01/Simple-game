"""Game test module"""

import pytest

def test_create_game(client):
	"""
	Test for simulate the creation of a game

	Parameters
	----------
	client
		Simulate a client of the application
	"""
	response = client.post(
		"/game",
		json={
			"name": "Test game",
			"max_players": 6,
			"min_players": 2,
			"current_players": 1,
			"is_started": False,
			"current_turn": 0,
			"turn_id_player": 0,
			"draw_top": 0,
			"discard_top": 0,
		},
	)
	print(response.json())
	assert response.status_code == 201
	data = response.json()
	assert "id" in data
	global created_game_id
	created_game_id = data["id"] 


def test_create_game_with_bad_name(client):
	"""
	Test for simulate the creation of a game with an invalid name

	Parameters
	----------
	client
		Simulate a client of the application
	"""
	response = client.post(
		"/game",
		json={
			"name": "",
			"max_players": 6,
			"min_players": 2,
			"current_players": 1,
			"is_started": False,
			"current_turn": 0,
			"turn_id_player": 0,
			"draw_top": 0,
			"discard_top": 0,
		},
	)
	print(response.json())
	assert response.status_code == 400
	

def test_create_game_with_bad_max_players_limit(client):
	"""
	Test for simulate the creation of a game with too many maximum players

	Parameters
	----------
	client
		Simulate a client of the application
	"""
	response = client.post(
		"/game",
		json={
			"name": "Test game2",
			"max_players": 7,
			"min_players": 2,
			"current_players": 0,
			"is_started": False,
			"current_turn": 0,
			"turn_id_player": 0,
			"draw_top": 0,
			"discard_top": 0,
		},
	)
	print(response.json())
	assert response.status_code == 400
	data = response.json()
	assert data["detail"] == "Maximum players cannot be more than 6"

def test_create_game_with_bad_min_players_limit(client):
	"""
	Test for simulate the creation of a game with too few minimum players

	Parameters
	----------
	client
		Simulate a client of the application
	"""
	response = client.post(
		"/game",
		json={
			"name": "Test game2",
			"max_players": 6,
			"min_players": 1,
			"current_players": 0,
			"is_started": False,
			"current_turn": 0,
			"turn_id_player": 0,
			"draw_top": 0,
			"discard_top": 0,
		},
	)
	print(response.json())
	assert response.status_code == 400
	data = response.json()
	assert data["detail"] == "Minimum players cannot be less than 2"
	

def test_create_game_with_bad_limit(client):
	"""
	Test for simulate the creation of a game with inconsistent player limits
	(maximum players less than minimum players)

	Parameters
	----------
	client
		Simulate a client of the application
	"""
	response = client.post(
		"/game",
		json={
			"name": "Test game3",
			"max_players": 3,
			"min_players": 4,
			"current_players": 0,
			"is_started": False,
			"current_turn": 0,
			"turn_id_player": 0, 
			"draw_top": 0,
			"discard_top": 0,
		},
	)
	print(response.json())
	assert response.status_code == 400
	data = response.json()
	assert data["detail"] == "Maximum players cannot be less than minimum players"

def test_get_game_by_id(client):
	"""
	Test for simulate is all OK when the client get a game

	Parameters
	----------
	client
		Simulate a client of the application
	"""	
	response = client.get(f"/game/{created_game_id}")
	assert response.status_code == 200
	data = response.json()
	assert data["id"] == created_game_id
	assert data["name"] == "Test game"
	# new attributes assertions (defaults)
	assert data["draw_top"] == 0
	assert data["discard_top"] == 0

def test_get_game_by_bad_id(client):
	"""
	Test for simulate getting a game with a non-existing id

	Parameters
	----------
	client
		Simulate a client of the application
	"""
	response = client.get("/game/999")
	assert response.status_code == 404
	data = response.json()
	assert data["detail"] == "Game 999 not exists"


def test_get_all_games(client):
	"""
	Test for simulate is all OK when the client get a list of game

	Parameters
	-----------
	client
		Simulate a client of the application
	"""
	response = client.get("/game")
	assert response.status_code == 200
	data = response.json()
	assert isinstance(data, list)
	assert len(data) >= 1

def test_update_game(client):
	"""
	Test to simulate a successful update of a game

	Parameters
	-----------
	client
		Simulate a client of the application
	"""
	response = client.put(
		f"/game/{created_game_id}",
		json={
			"name": "Test game",
			"max_players": 6,
			"min_players": 2,
			"current_players": 4,
			"is_started": False,
			"current_turn": 1,
			"turn_id_player": 3,
			"draw_top": 2,
			"discard_top": 3,
		},
	)

	assert response.status_code == 200
	data = response.json()
	assert data["current_turn"] == 1
	assert data["current_players"] == 4
	assert data["is_started"] == False
	assert data["turn_id_player"] == 3
	# new attributes assertions
	assert data["draw_top"] == 2
	assert data["discard_top"] == 3

def test_update_bad_game(client):
	"""
	Test for simulate an invalid update of a game
	(game cannot exist without players)

	Parameters
	----------
	client
		Simulate a client of the application
	"""
	response = client.put(
		f"/game/{created_game_id}",
		json={
			"name": "Test game",
			"max_players": 6,
			"min_players": 2,
			"current_players": 0,
			"is_started": True,
			"current_turn": 2,
			"turn_id_player": 4,
			"draw_top": 0,
			"discard_top": 0,
		},
	)
	assert response.status_code == 400
	data = response.json()
	assert data["detail"] == "The game cannot exist without players"

def test_update_game_with_more_players(client):
	"""
	Test for simulate an invalid update of a game
	where the current players exceed the maximum players

	Parameters
	----------
	client
		Simulate a client of the application
	"""
	response = client.put(
		f"/game/{created_game_id}",
		json={
			"name":"Test game",
			"max_players": 6,
			"min_players": 2,
			"current_players": 7,
			"is_started": False,
			"current_turn": 0,
			"turn_id_player": 0,
			"draw_top": 0,
			"discard_top": 0,
		}
	)
	assert response.status_code == 400
	data = response.json()
	assert data["detail"] == "Current players cannot exceed maximum players"

def test_delete_game(client):
	"""
	Test to simulate a delete of game

	Parameters
	----------
	client
		Simulate a client of the application
	"""
	response = client.delete(f"/game/{created_game_id}")
	assert response.status_code == 200
	data = response.json()
	assert data["id"] == created_game_id

	response = client.get(f"/game/{created_game_id}")
	assert response.status_code == 404

def test_delete_game_with_bad_id(client):
	"""
	Test for simulate trying to delete a game that does not exist

	Parameters
	----------
	client
		Simulate a client of the application
	"""
	response = client.delete(f"/game/999")
	assert response.status_code == 404
	data = response.json()
	assert data["detail"] == "Game with id 999 not found"

def test_delete_started_game(client):
	"""
	Test for simulate trying to delete a game that is already started

	Parameters
	----------
	client
		Simulate a client of the application
	"""
	aux2 = client.post(
		"/game",
		json={
			"name": "Test game",
			"max_players": 6,
			"min_players": 2,
			"current_players": 1,
			"is_started": False,
			"current_turn": 0,
			"turn_id_player": 0,
			"draw_top": 0,
			"discard_top": 0,
		},
	)
	dat = aux2.json()
	id_game = dat["id"]
	aux = client.put(
		f"/game/{id_game}",
		json={
			"name": "Test game",
			"max_players": 6,
			"min_players": 2,
			"current_players": 4,
			"is_started": True,
			"current_turn": 1,
			"turn_id_player": 3,
			"draw_top": 0,
			"discard_top": 0,
		}
	)

	print(aux.json())
	response = client.delete(f"/game/{id_game}")
	assert response.status_code == 409
	data = response.json()
	assert data["detail"] == f"Game with id {id_game} is already started"
