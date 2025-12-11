WS_TEST_HTML = """<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Room Test</title>
</head>
<body>
    <h1>WebSocket Room Test</h1>
    <h2>Current Room: <span id="room-id"></span></h2>
    <h2>Your ID: <span id="ws-id"></span></h2>

    <label for="room-select">Unirse a otra room:</label>
    <select id="room-select">
        <option value="0">Lobby (0)</option>
        <option value="partida123">Partida 123</option>
        <option value="partida456">Partida 456</option>
    </select>
    <button onclick="joinRoom()">Unirme</button>

    <form onsubmit="sendMessage(event)">
        <input type="text" id="messageText" autocomplete="off"/>
        <button>Send</button>
    </form>

    <ul id="messages"></ul>

    <script>
        let client_id = Date.now();
        let room_id = "0"; // default room
        let ws;

        document.getElementById("ws-id").textContent = client_id;
        document.getElementById("room-id").textContent = room_id;

        function connect(room) {
            if (ws) ws.close(); // cerrar conexión anterior
            ws = new WebSocket(`ws://localhost:8000/ws/${room}`);

            ws.onopen = () => {
                console.log(`Conectado a la room ${room}`);
            };

            ws.onmessage = (event) => {
                const messages = document.getElementById('messages');
                const message = document.createElement('li');
                message.textContent = event.data;
                messages.appendChild(message);
            };

            ws.onclose = () => {
                console.log(`Desconectado de la room ${room}`);
            };

            ws.onerror = (err) => {
                console.error('WebSocket error:', err);
            };
        }

        function joinRoom() {
            const select = document.getElementById("room-select");
            room_id = select.value;
            document.getElementById("room-id").textContent = room_id;
            connect(room_id);
        }

        function sendMessage(event) {
            event.preventDefault();
            const input = document.getElementById("messageText");
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(`[${client_id}] ${input.value}`);
                input.value = '';
            } else {
                console.warn('No hay conexión activa');
            }
        }

        // Conectar automáticamente al lobby al inicio
        connect(room_id);
    </script>
</body>
</html>

"""