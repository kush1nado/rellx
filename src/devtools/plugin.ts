import { DevToolsClient } from './client';
import {
    DevToolsMessage,
    DevToolsConfig,
    DevToolsPlugin,
    ExtendedAction
} from './protocol';
import { StoreCore } from '../core';

export class DevToolsPluginManager<T = unknown, P = unknown> {
    private client: DevToolsClient<T, P>;
    private store: StoreCore<T>;
    private config: DevToolsConfig;
    private plugins: Map<string, DevToolsPlugin<T, P>> = new Map();
    private actionCounter = 0;

    constructor(
        store: StoreCore<T>,
        config: DevToolsConfig = {}
    ) {
        this.store = store;
        this.config = {
            name: 'AnonymousStore',
            storeId: this.generateId(),
            maxHistorySize: 50,
            enableTimeTravel: true,
            enableStateExport: true,
            enableActionExport: true,
            plugins: [],
            ...config
        };

        this.client = new DevToolsClient<T, P>(this.config);
        this.initializePlugins();
        this.setupStoreListeners();
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    private initializePlugins(): void {
        // Регистрируем встроенные плагины
        this.registerBuiltinPlugins();

        // Регистрируем кастомные плагины
        this.config.plugins?.forEach(plugin => {
            this.registerPlugin(plugin);
        });
    }

    private registerBuiltinPlugins(): void {
        this.registerPlugin({
            id: 'logger',
            name: 'Logger Plugin',
            version: '1.0.0',
            onStateChange: (state, action) => {
                console.log(`[DevTools] State changed by action: ${action.type}`, {
                    state,
                    action,
                    timestamp: new Date().toISOString()
                });
            }
        });

        this.registerPlugin({
            id: 'analytics',
            name: 'Analytics Plugin',
            version: '1.0.0',
            onStateChange: (state, action) => {
                this.trackAnalytics(action);
            }
        });

        this.registerPlugin({
            id: 'performance',
            name: 'Performance Plugin',
            version: '1.0.0',
            onStateChange: (state, action) => {
                this.trackPerformance(action);
            }
        });
    }

    private setupStoreListeners(): void {
        this.store.subscribe((state) => {
            this.handleStateChange(state);
        });
    }

    private handleStateChange(state: T): void {
        const action: ExtendedAction<P> = {
            type: 'STATE_UPDATE',
            timestamp: Date.now(),
            id: this.generateActionId(),
            name: 'State Update',
            duration: 0
        };

        this.client.addState(state, action);

        this.plugins.forEach(plugin => {
            plugin.onStateChange?.(state, action);
        });

        this.sendStateUpdate(state, action);
    }

    private generateActionId(): string {
        return `action_${++this.actionCounter}_${Date.now()}`;
    }

    private sendStateUpdate(state: T, action: ExtendedAction<P>): void {
        this.client.send({
            type: 'UPDATE',
            payload: {
                state,
                action,
                storeName: this.config.name,
                storeId: this.config.storeId
            },
            timestamp: Date.now(),
            id: this.generateId(),
            storeName: this.config.name,
            storeId: this.config.storeId
        });
    }

    registerPlugin(plugin: DevToolsPlugin<T, P>): void {
        this.plugins.set(plugin.id, plugin);
        plugin.onInit?.({ getState: () => this.store.getState() });

        console.log(`[DevTools] Plugin registered: ${plugin.name} (${plugin.id})`);
    }

    unregisterPlugin(pluginId: string): void {
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            plugin.onDestroy?.();
            this.plugins.delete(pluginId);
            console.log(`[DevTools] Plugin unregistered: ${plugin.name} (${pluginId})`);
        }
    }

    getPlugin(pluginId: string): DevToolsPlugin<T, P> | undefined {
        return this.plugins.get(pluginId);
    }

    getAllPlugins(): DevToolsPlugin<T, P>[] {
        return Array.from(this.plugins.values());
    }

    private trackAnalytics(action: ExtendedAction<P>): void {
        const analyticsData = {
            event: 'state_change',
            action_type: action.type,
            action_id: action.id,
            timestamp: action.timestamp,
            store_name: this.config.name,
            store_id: this.config.storeId
        };

        this.sendCustomPluginMessage('analytics', 'ANALYTICS_DATA', analyticsData);
    }

    private trackPerformance(action: ExtendedAction<P>): void {
        const startTime = performance.now();

        setTimeout(() => {
            const duration = performance.now() - startTime;

            this.sendCustomPluginMessage('performance', 'PERFORMANCE_DATA', {
                action_id: action.id,
                duration,
                timestamp: Date.now()
            });
        }, 0);
    }

    sendPluginMessage(pluginId: string, message: DevToolsMessage<T, P>): void {
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            plugin.onMessage?.(message);
        }
    }

    sendCustomPluginMessage(pluginId: string, type: string, data: unknown): void {
        const message: DevToolsMessage<T, P> = {
            type: 'PLUGIN_MESSAGE',
            payload: {
                pluginId,
                pluginData: data
            },
            timestamp: Date.now(),
            id: this.generateId(),
            storeName: this.config.name,
            storeId: this.config.storeId
        };

        this.sendPluginMessage(pluginId, message);
    }

    connect(url?: string): void {
        this.client.connect(url);
    }

    disconnect(): void {
        this.client.disconnect();
    }

    exportState(): string {
        return this.client.exportState();
    }

    importState(stateData: string): void {
        this.client.importState(stateData);
    }

    timeTravel(index: number): void {
        this.client.timeTravel(index);
    }

    jumpToAction(actionId: string): void {
        this.client.jumpToAction(actionId);
    }

    jumpToState(stateId: string): void {
        this.client.jumpToState(stateId);
    }

    getActionStats(): Record<string, number> {
        return this.client.getActionStats();
    }

    getStateChangeFrequency(): number {
        return this.client.getStateChangeFrequency();
    }

    getStateHistory() {
        return this.client.getStateHistory();
    }

    clearHistory(): void {
        this.client.clearHistory();
    }

    getConfig(): DevToolsConfig {
        return { ...this.config };
    }

    updateConfig(newConfig: Partial<DevToolsConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

export function createDevToolsPlugin<T = unknown, P = unknown>(
    store: StoreCore<T>,
    config?: DevToolsConfig
): DevToolsPluginManager<T, P> {
    return new DevToolsPluginManager(store, config);
}

export function createAnalyticsPlugin<T = unknown, P = unknown>(
    options: {
        endpoint?: string;
        apiKey?: string;
        trackEvents?: boolean;
        trackErrors?: boolean;
    } = {}
): DevToolsPlugin<T, P> {
    return {
        id: 'custom-analytics',
        name: 'Custom Analytics Plugin',
        version: '1.0.0',
        onStateChange: (state, action) => {
            if (options.trackEvents) {
                console.log('[Analytics]', { state, action, options });
            }
        },
        onMessage: (message) => {
            if (message.type === 'PLUGIN_MESSAGE' && message.payload.pluginId === 'custom-analytics') {
                console.log('[Analytics Plugin]', message);
            }
        }
    };
}

export function createPerformancePlugin<T = unknown, P = unknown>(
    options: {
        threshold?: number;
        logSlowActions?: boolean;
    } = {}
): DevToolsPlugin<T, P> {
    const { threshold = 100, logSlowActions = true } = options;

    return {
        id: 'custom-performance',
        name: 'Custom Performance Plugin',
        version: '1.0.0',
        onStateChange: (state, action) => {
            const extendedAction = action as ExtendedAction<P>;
            if (extendedAction.duration && extendedAction.duration > threshold && logSlowActions) {
                console.warn(`[Performance] Slow action detected: ${action.type} (${extendedAction.duration}ms)`);
            }
        }
    };
}