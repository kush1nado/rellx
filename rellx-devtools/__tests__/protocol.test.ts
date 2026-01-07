import { describe, it, expect } from '@jest/globals';
import type {
  DevToolsMessageType,
  ActionType,
  Action,
  DevToolsMessage,
  DevToolsConfig,
  StateHistory,
  StateSnapshot
} from '../src/devtools/protocol';

describe('Protocol Types', () => {
  describe('DevToolsMessageType', () => {
    it('should have all required message types', () => {
      const types: DevToolsMessageType[] = [
        'INIT',
        'UPDATE',
        'ACTION',
        'DISPATCH',
        'PLUGIN_MESSAGE',
        'TIME_TRAVEL',
        'IMPORT_STATE',
        'EXPORT_STATE',
        'CLEAR',
        'JUMP_TO_STATE',
        'JUMP_TO_ACTION',
        'ANALYTICS_DATA',
        'PERFORMANCE_DATA'
      ];
      expect(types.length).toBeGreaterThan(0);
    });
  });

  describe('ActionType', () => {
    it('should have all required action types', () => {
      const types: ActionType[] = [
        'STATE_UPDATE',
        'CUSTOM_ACTION',
        'PLUGIN_ACTION',
        'TIME_TRAVEL_ACTION',
        'IMPORT_ACTION',
        'EXPORT_ACTION'
      ];
      expect(types.length).toBeGreaterThan(0);
    });
  });

  describe('Action', () => {
    it('should create valid action object', () => {
      const action: Action = {
        type: 'STATE_UPDATE',
        payload: { count: 1 },
        timestamp: Date.now(),
        id: 'test-id',
        name: 'test-action'
      };
      expect(action.type).toBe('STATE_UPDATE');
      expect(action.id).toBe('test-id');
      expect(action.timestamp).toBeGreaterThan(0);
    });
  });

  describe('DevToolsConfig', () => {
    it('should create valid config object', () => {
      const config: DevToolsConfig = {
        name: 'TestStore',
        storeId: 'test-id',
        maxHistorySize: 50,
        enableTimeTravel: true,
        enableStateExport: true,
        enableActionExport: true
      };
      expect(config.name).toBe('TestStore');
      expect(config.maxHistorySize).toBe(50);
    });
  });

  describe('StateHistory', () => {
    it('should create valid state history object', () => {
      const history: StateHistory<{ count: number }, unknown> = {
        states: [],
        actions: [],
        currentIndex: -1,
        maxHistorySize: 50
      };
      expect(history.states).toEqual([]);
      expect(history.actions).toEqual([]);
      expect(history.currentIndex).toBe(-1);
    });
  });

  describe('StateSnapshot', () => {
    it('should create valid state snapshot', () => {
      const snapshot: StateSnapshot<{ count: number }> = {
        state: { count: 1 },
        timestamp: Date.now(),
        actionId: 'test-action-id'
      };
      expect(snapshot.state.count).toBe(1);
      expect(snapshot.timestamp).toBeGreaterThan(0);
    });
  });
});

