import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { StoreCore } from '../src/core/storeCore';
import { DevToolsPluginManager, createDevToolsPlugin, createAnalyticsPlugin, createPerformancePlugin } from '../src/devtools/plugin';
import { DevToolsPlugin } from '../src/devtools/protocol';

const MockWebSocket = jest.fn().mockImplementation(() => ({
    readyState: 1,
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null
}));

Object.defineProperty(MockWebSocket, 'CONNECTING', { value: 0, writable: false });
Object.defineProperty(MockWebSocket, 'OPEN', { value: 1, writable: false });
Object.defineProperty(MockWebSocket, 'CLOSING', { value: 2, writable: false });
Object.defineProperty(MockWebSocket, 'CLOSED', { value: 3, writable: false });

Object.defineProperty(global, 'WebSocket', {
    value: MockWebSocket,
    writable: true,
    configurable: true
});

describe('DevTools Plugin Manager', () => {
    let store: StoreCore<{ count: number }>;
    let devTools: DevToolsPluginManager<{ count: number }, unknown>;

    beforeEach(() => {
        store = new StoreCore({ count: 0 });
        devTools = createDevToolsPlugin(store, {
            name: 'TestStore',
            maxHistorySize: 10
        });
    });

    afterEach(() => {
        devTools.disconnect();
    });

    describe('Basic Functionality', () => {
        it('should initialize with correct configuration', () => {
            const config = devTools.getConfig();
            expect(config.name).toBe('TestStore');
            expect(config.maxHistorySize).toBe(10);
            expect(config.enableTimeTravel).toBe(true);
        });

        it('should track state changes', () => {
            const mockListener = jest.fn();
            devTools.connect();

            store.setState(prev => ({ count: prev.count + 1 }));

            const history = devTools.getStateHistory();
            expect(history.states).toHaveLength(1);
            expect(history.states[0].state).toEqual({ count: 1 });
        });

        it('should limit history size', () => {
            devTools.connect();
            for (let i = 0; i < 15; i++) {
                store.setState(prev => ({ count: prev.count + 1 }));
            }

            const history = devTools.getStateHistory();
            expect(history.states).toHaveLength(10);
        });
    });

    describe('Plugin System', () => {
        it('should register and unregister plugins', () => {
            const mockPlugin: DevToolsPlugin<{ count: number }, unknown> = {
                id: 'test-plugin',
                name: 'Test Plugin',
                version: '1.0.0',
                onInit: jest.fn(),
                onDestroy: jest.fn()
            };

            devTools.registerPlugin(mockPlugin);
            expect(devTools.getAllPlugins()).toHaveLength(4);
            expect(mockPlugin.onInit).toHaveBeenCalled();

            devTools.unregisterPlugin('test-plugin');
            expect(devTools.getAllPlugins()).toHaveLength(3);
            expect(mockPlugin.onDestroy).toHaveBeenCalled();
        });

        it('should notify plugins on state changes', () => {
            const mockPlugin: DevToolsPlugin<{ count: number }, unknown> = {
                id: 'test-plugin',
                name: 'Test Plugin',
                version: '1.0.0',
                onStateChange: jest.fn()
            };

            devTools.registerPlugin(mockPlugin);
            store.setState(prev => ({ count: prev.count + 1 }));

            expect(mockPlugin.onStateChange).toHaveBeenCalledWith(
                { count: 1 },
                expect.objectContaining({
                    type: 'STATE_UPDATE',
                    id: expect.any(String)
                })
            );
        });
    });

    describe('Analytics Plugin', () => {
        it('should create analytics plugin with correct options', () => {
            const analyticsPlugin = createAnalyticsPlugin({
                endpoint: 'https://analytics.example.com',
                apiKey: 'test-key',
                trackEvents: true,
                trackErrors: true
            });

            expect(analyticsPlugin.id).toBe('custom-analytics');
            expect(analyticsPlugin.name).toBe('Custom Analytics Plugin');
            expect(analyticsPlugin.version).toBe('1.0.0');
        });

        it('should track events when enabled', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            const analyticsPlugin = createAnalyticsPlugin({ trackEvents: true });

            devTools.registerPlugin(analyticsPlugin);
            store.setState(prev => ({ count: prev.count + 1 }));

            expect(consoleSpy).toHaveBeenCalledWith(
                '[Analytics]',
                expect.objectContaining({
                    state: { count: 1 },
                    action: expect.any(Object),
                    options: expect.any(Object)
                })
            );

            consoleSpy.mockRestore();
        });
    });

    describe('Performance Plugin', () => {
        it('should create performance plugin with threshold', () => {
            const performancePlugin = createPerformancePlugin({
                threshold: 50,
                logSlowActions: true
            });

            expect(performancePlugin.id).toBe('custom-performance');
            expect(performancePlugin.name).toBe('Custom Performance Plugin');
        });

        it('should handle performance monitoring', () => {
            const performancePlugin = createPerformancePlugin({
                threshold: 50,
                logSlowActions: true
            });

            devTools.registerPlugin(performancePlugin);
            store.setState(prev => ({ count: prev.count + 1 }));

            const plugins = devTools.getAllPlugins();
            const perfPlugin = plugins.find(p => p.id === 'custom-performance');
            expect(perfPlugin).toBeDefined();
        });
    });

    describe('Time Travel', () => {
        it('should support time travel functionality', () => {
            devTools.connect();

            store.setState(prev => ({ count: 1 }));
            store.setState(prev => ({ count: 2 }));
            store.setState(prev => ({ count: 3 }));

            const history = devTools.getStateHistory();
            expect(history.states).toHaveLength(3);

            devTools.timeTravel(0);
            const updatedHistory = devTools.getStateHistory();
            expect(updatedHistory.currentIndex).toBe(0);
        });

        it('should jump to specific action', () => {
            devTools.connect();

            store.setState(prev => ({ count: 1 }));
            store.setState(prev => ({ count: 2 }));

            const history = devTools.getStateHistory();
            const actionId = history.actions[0].id;

            devTools.jumpToAction(actionId);
            const updatedHistory = devTools.getStateHistory();
            expect(updatedHistory.currentIndex).toBe(0);
        });
    });

    describe('Export/Import', () => {
        it('should export state history', () => {
            devTools.connect();

            store.setState(prev => ({ count: 1 }));
            store.setState(prev => ({ count: 2 }));

            const exported = devTools.exportState();
            const parsed = JSON.parse(exported);

            expect(parsed.states).toHaveLength(2);
            expect(parsed.actions).toHaveLength(2);
            expect(parsed.config).toBeDefined();
        });

        it('should import state history', () => {
            const testData = {
                states: [
                    { state: { count: 5 }, timestamp: Date.now(), id: 'test-1', actionId: 'action-1' }
                ],
                actions: [
                    { type: 'STATE_UPDATE', timestamp: Date.now(), id: 'action-1', name: 'Test Action' }
                ],
                config: { name: 'ImportedStore' }
            };

            devTools.importState(JSON.stringify(testData));
            const history = devTools.getStateHistory();

            expect(history.states).toHaveLength(1);
            expect(history.actions).toHaveLength(1);
        });
    });

    describe('Statistics', () => {
        it('should provide action statistics', () => {
            devTools.connect();

            store.setState(prev => ({ count: 1 }));
            store.setState(prev => ({ count: 2 }));
            store.setState(prev => ({ count: 3 }));

            const stats = devTools.getActionStats();
            expect(stats['STATE_UPDATE']).toBe(3);
        });

        it('should calculate state change frequency', () => {
            devTools.connect();

            store.setState(prev => ({ count: 1 }));
            store.setState(prev => ({ count: 2 }));

            const frequency = devTools.getStateChangeFrequency();
            expect(typeof frequency).toBe('number');
            expect(frequency).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle WebSocket connection errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            const MockWebSocketWithError = jest.fn().mockImplementation(() => ({
                readyState: 3,
                send: jest.fn(),
                close: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                onopen: null,
                onmessage: null,
                onclose: null,
                onerror: null
            }));

            Object.defineProperty(MockWebSocketWithError, 'CONNECTING', { value: 0, writable: false });
            Object.defineProperty(MockWebSocketWithError, 'OPEN', { value: 1, writable: false });
            Object.defineProperty(MockWebSocketWithError, 'CLOSING', { value: 2, writable: false });
            Object.defineProperty(MockWebSocketWithError, 'CLOSED', { value: 3, writable: false });

            const originalWebSocket = global.WebSocket;
            Object.defineProperty(global, 'WebSocket', {
                value: MockWebSocketWithError,
                writable: true,
                configurable: true
            });

            devTools.connect();

            const wsInstance = (MockWebSocketWithError as jest.Mock).mock.results[0].value as { onerror: ((e: Event) => void) | null };
            if (wsInstance.onerror) {
                wsInstance.onerror(new Event('error'));
            }

            Object.defineProperty(global, 'WebSocket', {
                value: originalWebSocket,
                writable: true,
                configurable: true
            });

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
}); 