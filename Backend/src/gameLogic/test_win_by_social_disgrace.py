from fastapi import HTTPException, status
import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock, patch
from src.gameLogic.win_by_social_disgrace import WinBySocialDisgrace

def test_win_by_social_disgrace_triggers_murderer_escape(db_session):
    mock_gamePlayerService = MagicMock()
    mock_playerService = MagicMock()
    mock_gameService = MagicMock()
    mock_secretCardService = MagicMock()
    mock_manager = AsyncMock()  # 👈 CORREGIDO

    # --- Simulamos jugadores en la partida ---
    mock_gamePlayerService.get_players_in_game.return_value = [
        MagicMock(player_id=1),
        MagicMock(player_id=2)
    ]

    innocent = MagicMock(id=1, rol="innocent")
    murderer = MagicMock(id=2, rol="murderer")
    mock_playerService.get_by_id.side_effect = [innocent, murderer]

    # --- Todos los secretos revelados ---
    mock_secretCardService.get_secret_cards_by_player.return_value = [MagicMock(id=1)]
    mock_secretCardService.is_revealed.return_value = True

    mock_gameService.get_by_id.return_value = MagicMock(current_players=4)
    mock_murderer = MagicMock(to_schema=lambda: {
        "id": 2,
        "rol": "murderer",
        "name": "John Doe",
        "avatar": "avatar.png",
        "birthdate": "1990-01-01",
        "is_Social_Disgrace": False,
        "is_Your_Turn": False,
        "is_Owner": False
    })

    mock_query = MagicMock()
    mock_query.join.return_value.filter.return_value.first.return_value = mock_murderer
    db_session.query = MagicMock(return_value=mock_query)

    # --- Parches ---
    with patch("src.gameLogic.win_by_social_disgrace.GamePlayerService", lambda db: mock_gamePlayerService), \
         patch("src.gameLogic.win_by_social_disgrace.PlayerService", lambda db: mock_playerService), \
         patch("src.gameLogic.win_by_social_disgrace.GameService", lambda db: mock_gameService), \
         patch("src.gameLogic.win_by_social_disgrace.SecretCardService", lambda db: mock_secretCardService), \
         patch("src.gameLogic.win_by_social_disgrace.manager", mock_manager):

        service = WinBySocialDisgrace(db_session, game_id=1)

        # Ejecutar método async sin pytest-asyncio
        asyncio.run(service.check_win_by_social_disgrace())

        # --- Validaciones ---
        mock_manager.broadcast.assert_awaited_once()  # 👈 ahora sí se puede esperar una coroutine



# --- Caso: no hay jugadores en la partida ---
def test_win_by_social_disgrace_no_players(db_session):
    mock_gamePlayerService = MagicMock()
    mock_gamePlayerService.get_players_in_game.return_value = []

    with patch("src.gameLogic.win_by_social_disgrace.GamePlayerService", lambda db: mock_gamePlayerService):
        service = WinBySocialDisgrace(db_session, game_id=99)
        with pytest.raises(HTTPException) as exc:
            asyncio.run(service.check_win_by_social_disgrace())

        assert exc.value.status_code == status.HTTP_404_NOT_FOUND


# --- Caso: un jugador no existe en la BD ---
def test_win_by_social_disgrace_player_not_found(db_session):
    mock_gamePlayerService = MagicMock()
    mock_gamePlayerService.get_players_in_game.return_value = [MagicMock(player_id=1)]

    mock_playerService = MagicMock()
    mock_playerService.get_by_id.return_value = None

    with patch("src.gameLogic.win_by_social_disgrace.GamePlayerService", lambda db: mock_gamePlayerService), \
         patch("src.gameLogic.win_by_social_disgrace.PlayerService", lambda db: mock_playerService):
        service = WinBySocialDisgrace(db_session, game_id=1)
        with pytest.raises(HTTPException) as exc:
            asyncio.run(service.check_win_by_social_disgrace())

        assert exc.value.status_code == status.HTTP_404_NOT_FOUND


# --- Caso: secretos no encontrados ---
def test_is_player_in_social_disgrace_no_secrets(db_session):
    mock_secretCardService = MagicMock()
    mock_secretCardService.get_secret_cards_by_player.return_value = []

    with patch("src.gameLogic.win_by_social_disgrace.SecretCardService", lambda db: mock_secretCardService):
        service = WinBySocialDisgrace(db_session, game_id=1)
        with pytest.raises(HTTPException) as exc:
            service.is_player_in_social_disgrace(player_id=1)

        assert exc.value.status_code == status.HTTP_404_NOT_FOUND


# --- Caso: secretos todos revelados (devuelve True) ---
def test_is_player_in_social_disgrace_all_revealed(db_session):
    mock_secretCardService = MagicMock()
    mock_secretCardService.get_secret_cards_by_player.return_value = [MagicMock(id=1), MagicMock(id=2)]
    mock_secretCardService.is_revealed.return_value = True

    with patch("src.gameLogic.win_by_social_disgrace.SecretCardService", lambda db: mock_secretCardService):
        service = WinBySocialDisgrace(db_session, game_id=1)
        result = service.is_player_in_social_disgrace(player_id=1)

        assert result is True
