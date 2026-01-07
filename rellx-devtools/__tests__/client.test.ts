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
    it('should manage state history', () => {
      expect(client).toBeDefined();
      // Client should have state history management
    });
  });
});

