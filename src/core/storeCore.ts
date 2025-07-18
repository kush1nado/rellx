import {PluginFactory, StorePlugin} from "../types/plugin";

type Listener<T> = (state: T) => void;

export class StoreCore<T> {
    protected state: T;
    private listeners: Set<(state: T) => void> = new Set();
    private plugins: StorePlugin<T>[] = [];

    constructor(initialState: T, plugins: Array<StorePlugin<T> | PluginFactory<T>> = []) {
        this.state = initialState;
        this.plugins = plugins.map(p => typeof p === 'function' ? p(this) : p);
        this.plugins.forEach(plugin => plugin.onInit?.(this));
    }

    getState(): T {
        return this.state;
    }

    setState(updater: (prevState: T) => T): void {
        const oldState = this.state;
        let newState = updater(oldState);

        for (const plugin of this.plugins) {
            const result = plugin.onBeforeUpdate?.(newState, oldState);
            if (result !== undefined) newState = result;
        }

        if (newState !== oldState) {
            this.state = newState;
            this.listeners.forEach(listener => listener(newState));
            this.plugins.forEach(p => p.onAfterUpdate?.(newState, oldState));
        }
    }

    subscribe(listener: Listener<T>): () => void {
        this.listeners.add(listener);

        const pluginUnsubscribes = this.plugins
            .map(plugin => plugin.onSubscribe?.(listener))
            .filter(Boolean) as Array<() => void>;

        return () => {
            this.listeners.delete(listener);
            pluginUnsubscribes.forEach(unsubscribe => unsubscribe());
        };
    }

    destroy(): void {
        this.listeners.clear();
        this.plugins.forEach(plugin => plugin.onDestroy?.());
    }

    protected notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.state));
    }
}