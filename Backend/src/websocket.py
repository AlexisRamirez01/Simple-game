from fastapi import APIRouter, WebSocket, WebSocketDisconnect

websocket_router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.rooms: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        self.rooms[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].remove(websocket)
            if not self.rooms[room_id]:
                del self.rooms[room_id]  # eliminar room vacía

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str, room_id: str = "0"):
        if room_id in self.rooms:
            for connection in self.rooms[room_id]:
                await connection.send_text(message)


manager = ConnectionManager()

@websocket_router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    print(f"Nuevo cliente conectado a la room {room_id}")
    await manager.connect(websocket, room_id)
    try:
        while True:
            text = await websocket.receive_text()
            print(f"Received message from {websocket}: {text}")
            await manager.broadcast(text, room_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)