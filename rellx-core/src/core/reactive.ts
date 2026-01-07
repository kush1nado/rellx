import { StoreCore } from './storeCore';
import { deepEqual } from './utils';

type ReactiveState<T> = T & {
    __isReactive?: boolean;
    __store?: StoreCore<T>;
};

type ReactiveObject = {
    __isReactive?: boolean;
    [key: string]: unknown;
};

export class ReactiveStore<T extends object> extends StoreCore<T> {
    private reactiveState: ReactiveState<T>;
    private proxyCache = new WeakMap<object, object>();

    constructor(initialState: T) {
        super(initialState);
        this.reactiveState = this.createReactiveState(initialState);
    }

    private createReactiveState(state: T): ReactiveState<T> {
        const store = this;

        try {
            return new Proxy(state as ReactiveState<T>, {
            get(target, prop) {
                if (prop === '__isReactive') return true;
                if (prop === '__store') return store;

                const value = target[prop as keyof T];

                if (value && typeof value === 'object' && !Array.isArray(value) && !(value as ReactiveObject).__isReactive) {
                    const reactiveValue = store.makeReactive(value);
                    (target as Record<string, unknown>)[prop as string] = reactiveValue;
                    return (target as Record<string, unknown>)[prop as string] as T[keyof T];
                }

                return value;
            },

            set(target, prop, value) {
                const oldValue = (target as Record<string, unknown>)[prop as string];

                let reactiveValue: unknown = value;
                if (value && typeof value === 'object' && !Array.isArray(value) && !(value as ReactiveObject).__isReactive) {
                    reactiveValue = store.makeReactive(value);
                }

                (target as Record<string, unknown>)[prop as string] = reactiveValue;

                if (!deepEqual(oldValue, reactiveValue)) {
                    store.notifyListeners();
                }

                return true;
            },

            deleteProperty(target, prop) {
                const hasProperty = prop in target;
                const result = delete target[prop as keyof T];

                if (hasProperty && result) {
                    store.notifyListeners();
                }

                return result;
            }
            });
        } catch (error) {
            console.error('[ReactiveStore] Failed to create reactive state:', error);
            // Return non-reactive state if Proxy creation fails
            return state as ReactiveState<T>;
        }
    }

    private makeReactive<T extends object>(obj: T): T {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

        // Check cache
        const cached = this.proxyCache.get(obj);
        if (cached) {
            return cached as T;
        }

        const store = this;
        let proxy: T;
        
        try {
            proxy = new Proxy(obj as unknown as T & ReactiveObject, {
            get(target, prop) {
                if (prop === '__isReactive') return true;

                const value = target[prop as keyof T];

                if (value && typeof value === 'object' && !Array.isArray(value) && !(value as ReactiveObject).__isReactive) {
                    const reactiveValue = store.makeReactive(value);
                    (target as Record<string, unknown>)[prop as string] = reactiveValue;
                    return (target as Record<string, unknown>)[prop as string] as T[keyof T];
                }

                return value;
            },

            set(target, prop, value) {
                const oldValue = (target as Record<string, unknown>)[prop as string];

                let reactiveValue: unknown = value;
                if (value && typeof value === 'object' && !Array.isArray(value) && !(value as ReactiveObject).__isReactive) {
                    reactiveValue = store.makeReactive(value);
                }

                (target as Record<string, unknown>)[prop as string] = reactiveValue;

                if (!deepEqual(oldValue, reactiveValue)) {
                    store.notifyListeners();
                }

                return true;
            },

            deleteProperty(target, prop) {
                const hasProperty = prop in target;
                const result = delete (target as Record<string, unknown>)[prop as string];

                if (hasProperty && result) {
                    store.notifyListeners();
                }

                return result;
            }
            }) as T;

            // Cache the proxy
            this.proxyCache.set(obj, proxy);
            return proxy;
        } catch (error) {
            console.error('[ReactiveStore] Failed to make object reactive:', error);
            // Return non-reactive object if Proxy creation fails
            return obj;
        }
    }

    getState(): T {
        return this.reactiveState;
    }

    setState(updater: (prevState: T) => T): void {
        try {
            const newState = updater(this.reactiveState);

            let hasChanges = false;
            Object.keys(newState).forEach(key => {
                const k = key as keyof T;
                const oldValue = this.reactiveState[k];
                const newValue = newState[k];
                
                if (!deepEqual(oldValue, newValue)) {
                    this.reactiveState[k] = newValue;
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                this.notifyListeners();
            }
        } catch (error) {
            console.error('[ReactiveStore] Error in setState:', error);
            throw error;
        }
    }

    get reactive(): ReactiveState<T> {
        return this.reactiveState;
    }

    setProperty<K extends keyof T>(key: K, value: T[K]): void {
        this.reactiveState[key] = value;
    }

    getProperty<K extends keyof T>(key: K): T[K] {
        return this.reactiveState[key];
    }
}

export function createReactiveStore<T extends object>(initialState: T): ReactiveStore<T> {
    return new ReactiveStore(initialState);
} 