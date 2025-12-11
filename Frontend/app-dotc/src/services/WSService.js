const createWSService = (initialRoom = "0") => {
  let ws = null;
  let connected = false;
  let room = initialRoom;
  const wsUrl = (r) => `ws://localhost:8000/ws/${r}`;
  const listeners = {};

  
  const emit = (event, data) => {
    if (data?.room && data.room !== room) return;
    if (listeners[event]) {
      listeners[event].forEach(callback => callback(data));
    }
  };

  
  const connect = () => {
    try {
      ws = new WebSocket(wsUrl(room));

      ws.onopen = () => {
        connected = true;
        console.log(`WebSocket connected to room ${room}`);
      };

      ws.onmessage = (event) => {
        console.log("📩 Mensaje WS recibido:", event.data);
        try {
          const data = JSON.parse(event.data);
          emit(data.type, data.payload);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log(`WebSocket disconnected from room ${room}`);
        connected = false;
        setTimeout(() => connect(), 3000); // reconexión automática
      };

      ws.onerror = (error) => {
        connected = false;
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      connected = false;
      console.error('Failed to connect to WebSocket:', error);
    }
  };

  const on = (event, callback) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  };

  const off = (event, callback) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter(cb => cb !== callback);
    }
  };


  const joinRoom = (newRoom) => {
    if (ws) ws.close(); // cerrar conexión anterior
    room = newRoom;
    ws = null;
    connect(); // conectar a la nueva room
  };

  const disconnect = () => {
    if (ws) ws.close();
  };

  return {
    connect,
    joinRoom,
    on,
    off,
    disconnect,
    isConnected: () => connected
  };
};

export default createWSService;

