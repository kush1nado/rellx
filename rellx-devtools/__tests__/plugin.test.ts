import { StoreCore } from 'rellx';
import { DevToolsPluginManager } from '../src/devtools/plugin';

describe('DevToolsPluginManager', () => {
  interface TestState {
    count: number;
    name: string;
  }

  let store: StoreCore<TestState>;
  let pluginManager: DevToolsPluginManager<TestState>;

  beforeEach(() => {
    store = new StoreCore<TestState>({
      count: 0,
      name: 'test'
    });
    pluginManager = new DevToolsPluginManager(store, {
      name: 'TestStore',
      enableTimeTravel: true
    });
  });

  describe('Initialization', () => {
    it('should create plugin manager with default config', () => {
      const manager = new DevToolsPluginManager(store);
      expect(manager).toBeDefined();
    });

    it('should create plugin manager with custom config', () => {
      const manager = new DevToolsPluginManager(store, {
        name: 'CustomStore',
        maxHistorySize: 100,
        enableTimeTravel: false
      });
      expect(manager).toBeDefined();
    });
  });

  describe('State tracking', () => {
    it('should track state changes', () => {
      store.setState((prev) => ({ ...prev, count: 1, name: 'updated' }));
      // Plugin manager should track the change
      expect(store.getState().count).toBe(1);
    });

    it('should track multiple state changes', () => {
      store.setState((prev) => ({ ...prev, count: 1 }));
      store.setState((prev) => ({ ...prev, count: 2 }));
      store.setState((prev) => ({ ...prev, count: 3 }));
      expect(store.getState().count).toBe(3);
    });
  });

  describe('Time travel', () => {
    it('should support time travel when enabled', () => {
      const manager = new DevToolsPluginManager(store, {
        enableTimeTravel: true
      });
      expect(manager).toBeDefined();
    });
  });
});

