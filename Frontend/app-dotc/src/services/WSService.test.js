import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import createWSService from './WSService';

global.WebSocket = vi.fn();

vi.mock('import.meta', () => ({
  env: {
    VITE_WS_URI: undefined
  }
}));

describe('WSService', () => {
  let mockWebSocket;
  let wsService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();


    mockWebSocket = {
      close: vi.fn(),
      send: vi.fn(),
      readyState: WebSocket.CONNECTING,
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null
    };
    global.WebSocket.mockImplementation(() => mockWebSocket);

    wsService = createWSService();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Service Creation', () => {
    it('creates a WebSocket service with correct initial state', () => {
      expect(wsService).toHaveProperty('isConnected');
      expect(wsService).toHaveProperty('connect');
      expect(wsService).toHaveProperty('on');
      expect(wsService).toHaveProperty('off');
      expect(wsService).toHaveProperty('disconnect');
      expect(wsService.isConnected()).toBe(false);
    });

    it('creates independent service instances', () => {
      const wsService2 = createWSService();
      
      expect(wsService).not.toBe(wsService2);
      expect(wsService.isConnected()).toBe(false);
      expect(wsService2.isConnected()).toBe(false);
      
      wsService.connect();
      mockWebSocket.onopen();
      
      expect(wsService.isConnected()).toBe(true);
      expect(wsService2.isConnected()).toBe(false);
    });
  });

  describe('Connection Management', () => {
    it('establishes WebSocket connection', () => {
      wsService.connect();
      
       // We should have a test that validates the env var usage too
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8000/ws/0');
      expect(mockWebSocket.onopen).toBeDefined();
      expect(mockWebSocket.onclose).toBeDefined();
      expect(mockWebSocket.onmessage).toBeDefined();
      expect(mockWebSocket.onerror).toBeDefined();
    });

    it('handles connection errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Connection failed');
      wsService.connect();
      
      mockWebSocket.onerror(error);
      expect(wsService.isConnected()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', error);
      consoleSpy.mockRestore();
    });

    it('handles WebSocket constructor failure', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('WebSocket creation failed');
      global.WebSocket.mockImplementation(() => {
        throw error;
      });
      wsService.connect();
      
      expect(wsService.isConnected()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to connect to WebSocket:', error);
      consoleSpy.mockRestore();
    });

    it('reconnects automatically on connection close', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      wsService.connect();
      mockWebSocket.onclose();
      
      expect(wsService.isConnected()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('WebSocket disconnected from room 0');
      
      // Fast-forward to trigger reconnection
      vi.advanceTimersByTime(3000);
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
      consoleSpy.mockRestore();
    });

    it('closes WebSocket connection on disconnect', () => {
      wsService.connect();
      wsService.disconnect();
      
      expect(mockWebSocket.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Handling', () => {
    it('registers joinRoom event listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      wsService.on('joinRoom', callback1);
      wsService.on('joinRoom', callback2);

      expect(typeof wsService.on).toBe('function');
    });

    it('processes joinRoom messages', () => {
      const callback = vi.fn();

      wsService.on('joinRoom', callback);
      wsService.connect();

      const messageEvent = {
        data: JSON.stringify({
          type: 'joinRoom',
          payload: { room: '0', userId: 123 }
        })
      };
      mockWebSocket.onmessage(messageEvent);

      expect(callback).toHaveBeenCalledWith({ room: '0', userId: 123 });
    });

    it('handles multiple joinRoom listeners', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      wsService.on('joinRoom', cb1);
      wsService.on('joinRoom', cb2);

      wsService.connect();

      const messageEvent = {
        data: JSON.stringify({
          type: 'joinRoom',
          payload: { room: '0', userId: 456 }
        })
      };
      mockWebSocket.onmessage(messageEvent);

      expect(cb1).toHaveBeenCalledWith({ room: '0', userId: 456 });
      expect(cb2).toHaveBeenCalledWith({ room: '0', userId: 456 });
    });

    it('ignores joinRoom events if no listeners are registered', () => {
      wsService.connect();

      const messageEvent = {
        data: JSON.stringify({
          type: 'joinRoom',
          payload: { room: '0', userId: 789 }
        })
      };

      expect(() => {
        mockWebSocket.onmessage(messageEvent);
      }).not.toThrow();
    });
  });

  describe('Room-based joinRoom events', () => {
    let wsRoom0, wsRoom1;
    let mockWebSocket0, mockWebSocket1;

    beforeEach(() => {
      vi.useFakeTimers();
      
      mockWebSocket0 = { send: vi.fn(), close: vi.fn(), onmessage: null, onopen: null, onclose: null };
      mockWebSocket1 = { send: vi.fn(), close: vi.fn(), onmessage: null, onopen: null, onclose: null };
      
      let callCount = 0;
      global.WebSocket.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? mockWebSocket0 : mockWebSocket1;
      });

      wsRoom0 = createWSService("0");
      wsRoom1 = createWSService("1");
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.clearAllMocks();
    });

    it('only triggers joinRoom listeners in the same room', () => {
      const cbRoom0 = vi.fn();
      const cbRoom1 = vi.fn();

      wsRoom0.on('joinRoom', cbRoom0);
      wsRoom1.on('joinRoom', cbRoom1);

      wsRoom0.connect();
      wsRoom1.connect();

      
      const messageForRoom0 = { data: JSON.stringify({ type: 'joinRoom', payload: { room: '0', userId: 101 } }) };
      const messageForRoom1 = { data: JSON.stringify({ type: 'joinRoom', payload: { room: '1', userId: 202 } }) };

      mockWebSocket0.onmessage(messageForRoom0);
      mockWebSocket0.onmessage(messageForRoom1); 

      mockWebSocket1.onmessage(messageForRoom1);
      mockWebSocket1.onmessage(messageForRoom0); 

     
      expect(cbRoom0).toHaveBeenCalledWith({ room: '0', userId: 101 });
      expect(cbRoom1).toHaveBeenCalledWith({ room: '1', userId: 202 });

      expect(cbRoom0).toHaveBeenCalledTimes(1);
      expect(cbRoom1).toHaveBeenCalledTimes(1);
    });
  });
});