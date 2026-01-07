import {PluginFactory, StorePlugin} from "../types/plugin";
import {deepEqual} from "./utils";

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
        try {
            const oldState = this.state;
            let newState = updater(oldState);

            // Validate new state is not null/undefined
            if (newState == null) {
                throw new Error('State cannot be null or undefined');
            }

            for (const plugin of this.plugins) {
                try {
                    const result = plugin.onBeforeUpdate?.(newState, oldState);
                    if (result !== undefined) newState = result;
                } catch (error) {
                    console.error('[StoreCore] Error in plugin onBeforeUpdate:', error);
                    throw error;
                }
            }

            // Use deep comparison for objects to detect actual changes
            const hasChanged = typeof newState === 'object' && newState !== null
                ? !deepEqual(newState, oldState)
                : newState !== oldState;

            if (hasChanged) {
                this.state = newState;
                try {
                    this.listeners.forEach(listener => {
                        try {
                            listener(newState);
                        } catch (error) {
                            console.error('[StoreCore] Error in listener:', error);
                        }
                    });
                } catch (error) {
                    console.error('[StoreCore] Error notifying listeners:', error);
                }

                this.plugins.forEach(p => {
                    try {
                        p.onAfterUpdate?.(newState, oldState);
                    } catch (error) {
                        console.error('[StoreCore] Error in plugin onAfterUpdate:', error);
                    }
                });
            }
        } catch (error) {
            console.error('[StoreCore] Error in setState:', error);
            throw error;
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