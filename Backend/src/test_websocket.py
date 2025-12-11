import asyncio
from unittest.mock import AsyncMock, patch
from fastapi import WebSocketDisconnect
from src.websocket import ConnectionManager, websocket_endpoint


def test_connect_creates_new_room():
    manager = ConnectionManager()
    mock_ws = AsyncMock()
    asyncio.run(manager.connect(mock_ws, "room1"))
    assert "room1" in manager.rooms
    assert mock_ws in manager.rooms["room1"]
    mock_ws.accept.assert_awaited_once()


def test_connect_existing_room():
    manager = ConnectionManager()
    mock_ws1, mock_ws2 = AsyncMock(), AsyncMock()
    asyncio.run(manager.connect(mock_ws1, "room1"))
    asyncio.run(manager.connect(mock_ws2, "room1"))
    assert len(manager.rooms["room1"]) == 2


def test_disconnect_removes_ws_and_deletes_room():
    manager = ConnectionManager()
    mock_ws = AsyncMock()
    asyncio.run(manager.connect(mock_ws, "room1"))
    manager.disconnect(mock_ws, "room1")
    assert "room1" not in manager.rooms


def test_disconnect_with_remaining_clients():
    manager = ConnectionManager()
    ws1, ws2 = AsyncMock(), AsyncMock()
    asyncio.run(manager.connect(ws1, "room1"))
    asyncio.run(manager.connect(ws2, "room1"))
    manager.disconnect(ws1, "room1")
    assert "room1" in manager.rooms
    assert ws2 in manager.rooms["room1"]


def test_send_message_calls_send_text():
    manager = ConnectionManager()
    mock_ws = AsyncMock()
    asyncio.run(manager.send_message("hola", mock_ws))
    mock_ws.send_text.assert_awaited_once_with("hola")


def test_broadcast_sends_to_all_clients():
    manager = ConnectionManager()
    ws1, ws2 = AsyncMock(), AsyncMock()
    asyncio.run(manager.connect(ws1, "room1"))
    asyncio.run(manager.connect(ws2, "room1"))
    asyncio.run(manager.broadcast("mensaje", "room1"))
    ws1.send_text.assert_awaited_with("mensaje")
    ws2.send_text.assert_awaited_with("mensaje")


def test_broadcast_no_room_does_nothing():
    manager = ConnectionManager()
    asyncio.run(manager.broadcast("mensaje", "no_existe"))


def test_websocket_endpoint_normal_flow():
    mock_ws = AsyncMock()
    mock_ws.receive_text = AsyncMock(side_effect=["hola", "chau", WebSocketDisconnect()])
    manager = ConnectionManager()
    with patch("src.websocket.manager", manager):
        asyncio.run(websocket_endpoint(mock_ws, "room1"))
    mock_ws.accept.assert_awaited()
    mock_ws.send_text.assert_any_await("hola")
    mock_ws.send_text.assert_any_await("chau")
    assert "room1" not in manager.rooms


def test_websocket_endpoint_disconnect_immediate():
    mock_ws = AsyncMock()
    mock_ws.receive_text = AsyncMock(side_effect=WebSocketDisconnect)
    manager = ConnectionManager()
    with patch("src.websocket.manager", manager):
        asyncio.run(websocket_endpoint(mock_ws, "room1"))
    assert "room1" not in manager.rooms
