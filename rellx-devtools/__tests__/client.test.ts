import { DevToolsClient } from '../src/devtools/client';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// @ts-ignore
global.WebSocket = MockWebSocket;

describe('DevToolsClient', () => {
  let client: DevToolsClient<{ count: number }, unknown>;

  beforeEach(() => {
    client = new DevToolsClient({
      name: 'TestStore',
      enableTimeTravel: true
    });
  });

  describe('Initialization', () => {
    it('should create client with default config', () => {
      const newClient = new DevToolsClient();
      expect(newClient).toBeDefined();
    });

    it('should create client with custom config', () => {
      const newClient = new DevToolsClient({
        name: 'CustomStore',
        maxHistorySize: 100
      });
      expect(newClient).toBeDefined();
    });
  });

  describe('Message handling', () => {
    it('should subscribe to messages', () => {
      const listener = () => {};
      const unsubscribe = client.subscribe(listener);
      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe from messages', () => {
      const listener = () => {};
      const unsubscribe = client.subscribe(listener);
      unsubscribe();
      expect(listener).toBeDefined();
    });
  });

  describe('State history', () => {
    it('should add state and update history', () => {
      const action = { type: 'STATE_UPDATE' as const, timestamp: Date.now(), id: 'a1', name: 'Test' };
      client.addState({ count: 1 }, action);
      client.addState({ count: 2 }, { ...action, id: 'a2' });

      const history = client.getStateHistory();
      expect(history.states).toHaveLength(2);
      expect(history.states[0].state).toEqual({ count: 1 });
      expect(history.states[1].state).toEqual({ count: 2 });
      expect(client.getCurrentState()).toEqual({ count: 2 });
    });

    it('should jump to state by index', () => {
      client.addState({ count: 1 }, { type: 'STATE_UPDATE', timestamp: 0, id: 'a1' });
      client.addState({ count: 2 }, { type: 'STATE_UPDATE', timestamp: 0, id: 'a2' });
      client.addState({ count: 3 }, { type: 'STATE_UPDATE', timestamp: 0, id: 'a3' });

      client.timeTravel(0);
      expect(client.getCurrentState()).toEqual({ count: 1 });

      client.timeTravel(2);
      expect(client.getCurrentState()).toEqual({ count: 3 });
    });

    it('should export and import state', () => {
      client.addState({ count: 1 }, { type: 'STATE_UPDATE', timestamp: 0, id: 'a1' });
      const exported = client.exportState();

      client.clearHistory();
      expect(client.getCurrentState()).toBeNull();

      client.importState(exported);
      expect(client.getCurrentState()).toEqual({ count: 1 });
    });
  });
});

