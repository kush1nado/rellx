import {
    DevToolsMessage,
    DevToolsConfig,
    DevToolsPlugin,
    Action,
    StateHistory,
    StateSnapshot
} from './protocol';

export class DevToolsClient<T = unknown, P = unknown> {
    private ws: WebSocket | null = null;
    private reconnectInterval = 1000;
    private maxReconnectAttempts = 10;
    private reconnectAttempts = 0;
    private listeners = new Set<(msg: DevToolsMessage<T, P>) => void>();
    private plugins = new Map<string, DevToolsPlugin<T, P>>();
    private stateHistory: StateHistory<T, P>;
    private config: DevToolsConfig;
    private isConnected = false;
    private messageQueue: DevToolsMessage<T, P>[] = [];

    constructor(config: DevToolsConfig = {}) {
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

        this.stateHistory = {
            states: [],
            actions: [],
            currentIndex: -1,
            maxHistorySize: this.config.maxHistorySize || 50
        };

        this.initializePlugins();
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    private initializePlugins(): void {
        this.config.plugins?.forEach(plugin => {
            this.plugins.set(plugin.id, plugin);
            plugin.onInit?.({ getState: () => this.getCurrentState() || {} as T });
        });
    }

    connect(url: string = 'ws://localhost:8097'): void {
        try {
            this.ws = new WebSocket(url);
            this.setupWebSocketHandlers();
        } catch (error) {
            console.error('DevTools connection failed:', error);
            this.scheduleReconnect();
        }
    }

    private setupWebSocketHandlers(): void {
        if (!this.ws) return;

        this.ws.onopen = () => {
            console.log('DevTools connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.flushMessageQueue();
            this.sendInitMessage();
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data as string) as DevToolsMessage<T, P>;
                this.handleMessage(message);
            } catch (error) {
                console.error('DevTools parse error:', error);
            }
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            console.log('DevTools disconnected');
            this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('DevTools WebSocket error', error);
        };
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`DevTools reconnecting... (attempt ${this.reconnectAttempts})`);
                this.connect();
            }, this.reconnectInterval * this.reconnectAttempts);
        } else {
            console.error('DevTools max reconnection attempts reached');
        }
    }

    private handleMessage(message: DevToolsMessage<T, P>): void {
        this.listeners.forEach(listener => listener(message));

        if (message.payload.pluginId) {
            const plugin = this.plugins.get(message.payload.pluginId);
            plugin?.onMessage?.(message);
        }

        switch (message.type) {
            case 'TIME_TRAVEL':
                this.handleTimeTravel(message);
                break;
            case 'IMPORT_STATE':
                this.handleImportState(message);
                break;
            case 'CLEAR':
                this.clearHistory();
                break;
        }
    }

    private handleTimeTravel(message: DevToolsMessage<T, P>): void {
        const { actionId, stateId } = message.payload as { actionId?: string; stateId?: string };
        if (actionId) {
            this.jumpToAction(actionId);
        } else if (stateId) {
            this.jumpToState(stateId);
        }
    }

    private handleImportState(message: DevToolsMessage<T, P>): void {
        const { state } = message.payload;
        if (state) {
            this.importState(JSON.stringify(state));
        }
    }

    private sendInitMessage(): void {
        const currentState = this.getCurrentState();
        this.send({
            type: 'INIT',
            payload: {
                state: currentState || undefined,
                storeName: this.config.name,
                storeId: this.config.storeId
            },
            timestamp: Date.now(),
            id: this.generateId(),
            storeName: this.config.name,
            storeId: this.config.storeId
        });
    }

    private flushMessageQueue(): void {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message) {
                this.send(message);
            }
        }
    }

    subscribe(listener: (msg: DevToolsMessage<T, P>) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    send(message: DevToolsMessage<T, P>): void {
        if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            this.messageQueue.push(message);
        }
    }

    addState(state: T, action?: Action<P>): void {
        const stateSnapshot: StateSnapshot<T> = {
            state: JSON.parse(JSON.stringify(state)),
            timestamp: Date.now(),
            id: this.generateId(),
            actionId: action?.id
        };

        this.stateHistory.states.push(stateSnapshot);
        if (action) {
            this.stateHistory.actions.push(action);
        }

        if (this.stateHistory.states.length > this.stateHistory.maxHistorySize) {
            this.stateHistory.states.shift();
            if (this.stateHistory.actions.length > 0) {
                this.stateHistory.actions.shift();
            }
        }

        this.stateHistory.currentIndex = this.stateHistory.states.length - 1;
    }

    getCurrentState(): T | null {
        if (this.stateHistory.currentIndex >= 0) {
            return this.stateHistory.states[this.stateHistory.currentIndex].state;
        }
        return null;
    }

    getStateHistory(): StateHistory<T, P> {
        return { ...this.stateHistory };
    }

    jumpToState(stateId: string): void {
        const stateIndex = this.stateHistory.states.findIndex(s => s.id === stateId);
        if (stateIndex !== -1) {
            this.stateHistory.currentIndex = stateIndex;
            this.notifyStateChange();
        }
    }

    jumpToAction(actionId: string): void {
        const actionIndex = this.stateHistory.actions.findIndex(a => a.id === actionId);
        if (actionIndex !== -1) {
            const stateIndex = this.stateHistory.states.findIndex(s => s.actionId === actionId);
            if (stateIndex !== -1) {
                this.stateHistory.currentIndex = stateIndex;
                this.notifyStateChange();
            }
        }
    }

    timeTravel(index: number): void {
        if (index >= 0 && index < this.stateHistory.states.length) {
            this.stateHistory.currentIndex = index;
            this.notifyStateChange();
        }
    }

    private notifyStateChange(): void {
        const currentState = this.getCurrentState();
        if (currentState !== null) {
            this.send({
                type: 'UPDATE',
                payload: { state: currentState },
                timestamp: Date.now(),
                id: this.generateId(),
                storeName: this.config.name,
                storeId: this.config.storeId
            });
        }
    }

    exportState(): string {
        return JSON.stringify({
            states: this.stateHistory.states,
            actions: this.stateHistory.actions,
            config: this.config
        });
    }

    importState(stateData: string): void {
        try {
            const data = JSON.parse(stateData);
            this.stateHistory.states = data.states || [];
            this.stateHistory.actions = data.actions || [];
            this.stateHistory.currentIndex = this.stateHistory.states.length - 1;
            this.notifyStateChange();
        } catch (error) {
            console.error('Failed to import state:', error);
        }
    }

    clearHistory(): void {
        this.stateHistory.states = [];
        this.stateHistory.actions = [];
        this.stateHistory.currentIndex = -1;
    }

    registerPlugin(plugin: DevToolsPlugin<T, P>): void {
        this.plugins.set(plugin.id, plugin);
        plugin.onInit?.({ getState: () => this.getCurrentState() || {} as T });
    }

    unregisterPlugin(pluginId: string): void {
        const plugin = this.plugins.get(pluginId);
        plugin?.onDestroy?.();
        this.plugins.delete(pluginId);
    }

    getPlugins(): DevToolsPlugin<T, P>[] {
        return Array.from(this.plugins.values());
    }

    getActionStats(): Record<string, number> {
        const stats: Record<string, number> = {};
        this.stateHistory.actions.forEach(action => {
            stats[action.type] = (stats[action.type] || 0) + 1;
        });
        return stats;
    }

    getStateChangeFrequency(): number {
        if (this.stateHistory.states.length < 2) return 0;
        const timeSpan = this.stateHistory.states[this.stateHistory.states.length - 1].timestamp -
            this.stateHistory.states[0].timestamp;
        return this.stateHistory.states.length / (timeSpan / 1000);
    }

    disconnect(): void {
        this.isConnected = false;
        this.ws?.close();
        this.plugins.forEach(plugin => plugin.onDestroy?.());
    }
}