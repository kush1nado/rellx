export type DevToolsMessageType =
    | 'INIT'
    | 'UPDATE'
    | 'ACTION'
    | 'DISPATCH'
    | 'PLUGIN_MESSAGE'
    | 'TIME_TRAVEL'
    | 'IMPORT_STATE'
    | 'EXPORT_STATE'
    | 'CLEAR'
    | 'JUMP_TO_STATE'
    | 'JUMP_TO_ACTION'
    | 'ANALYTICS_DATA'
    | 'PERFORMANCE_DATA';

export type ActionType =
    | 'STATE_UPDATE'
    | 'CUSTOM_ACTION'
    | 'PLUGIN_ACTION'
    | 'TIME_TRAVEL_ACTION'
    | 'IMPORT_ACTION'
    | 'EXPORT_ACTION';

export interface Action<P = unknown> {
    type: ActionType;
    payload?: P;
    timestamp: number;
    id: string;
    name?: string;
}

export interface StateSnapshot<T = unknown> {
    state: T;
    timestamp: number;
    id: string;
    actionId?: string;
}

export interface DevToolsPlugin<T = unknown, P = unknown> {
    id: string;
    name: string;
    version: string;
    onMessage?: (message: DevToolsMessage<T, P>) => void;
    onStateChange?: (state: T, action: Action<P>) => void;
    onInit?: (store: { getState(): T }) => void;
    onDestroy?: () => void;
}

export interface DevToolsMessage<T = unknown, P = unknown> {
    type: DevToolsMessageType;
    payload: {
        state?: T;
        action?: Action<P>;
        pluginId?: string;
        pluginData?: unknown;
        storeName?: string;
        storeId?: string;
    };
    timestamp: number;
    id: string;
    storeName?: string;
    storeId?: string;
}

export interface StateHistory<T = unknown, P = unknown> {
    states: StateSnapshot<T>[];
    actions: Action<P>[];
    currentIndex: number;
    maxHistorySize: number;
}

export interface DevToolsConfig {
    name?: string;
    storeId?: string;
    maxHistorySize?: number;
    enableTimeTravel?: boolean;
    enableStateExport?: boolean;
    enableActionExport?: boolean;
    plugins?: DevToolsPlugin[];
}

export interface ActionMetadata {
    name: string;
    description?: string;
    category?: string;
    tags?: string[];
}

export interface ExtendedAction<P = unknown> extends Action<P> {
    metadata?: ActionMetadata;
    duration?: number;
    error?: string;
}