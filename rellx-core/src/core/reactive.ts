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
            const isArray = Array.isArray(state);
            return new Proxy(state as ReactiveState<T>, {
            get(target, prop) {
                if (prop === '__isReactive') return true;
                if (prop === '__store') return store;

                const value = isArray 
                    ? (target as unknown as unknown[])[prop as unknown as number]
                    : target[prop as keyof T];

                if (value && typeof value === 'object' && !(value as ReactiveObject).__isReactive) {
                    const reactiveValue = store.makeReactive(value);
                    if (isArray) {
                        (target as unknown as unknown[])[prop as unknown as number] = reactiveValue;
                    } else {
                        (target as Record<string, unknown>)[prop as string] = reactiveValue;
                    }
                    return reactiveValue as T[keyof T];
                }

                return value as T[keyof T];
            },

            set(target, prop, value) {
                const oldValue = (target as Record<string, unknown>)[prop as string];

                let reactiveValue: unknown = value;
                if (value && typeof value === 'object' && !(value as ReactiveObject).__isReactive) {
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
        if (!obj || typeof obj !== 'object') return obj;

        // Check cache
        const cached = this.proxyCache.get(obj);
        if (cached) {
            return cached as T;
        }

        const store = this;
        let proxy: T;
        
        try {
            const isArray = Array.isArray(obj);
            proxy = new Proxy(obj as unknown as T & ReactiveObject, {
            get(target, prop) {
                if (prop === '__isReactive') return true;

                // Intercept array methods to trigger reactivity
                if (isArray) {
                    if (prop === 'push' || prop === 'pop' || prop === 'shift' || prop === 'unshift' || prop === 'splice' || prop === 'sort' || prop === 'reverse') {
                        const array = target as unknown as unknown[] & { [key: string]: (...args: unknown[]) => unknown };
                        const originalMethod = array[prop as string] as (...args: unknown[]) => unknown;
                        return (...args: unknown[]) => {
                            const result = originalMethod.apply(target, args);
                            store.notifyListeners();
                            return result;
                        };
                    }
                }

                const value = isArray 
                    ? (target as unknown as unknown[])[prop as unknown as number]
                    : target[prop as keyof T];

                if (value && typeof value === 'object' && !(value as ReactiveObject).__isReactive) {
                    const reactiveValue = store.makeReactive(value);
                    if (isArray) {
                        (target as unknown as unknown[])[prop as unknown as number] = reactiveValue;
                    } else {
                        (target as Record<string, unknown>)[prop as string] = reactiveValue;
                    }
                    return reactiveValue as T[keyof T];
                }

                return value as T[keyof T];
            },

            set(target, prop, value) {
                const oldValue = isArray
                    ? (target as unknown as unknown[])[prop as unknown as number]
                    : (target as Record<string, unknown>)[prop as string];

                let reactiveValue: unknown = value;
                if (value && typeof value === 'object' && !(value as ReactiveObject).__isReactive) {
                    reactiveValue = store.makeReactive(value);
                }

                if (isArray) {
                    (target as unknown as unknown[])[prop as unknown as number] = reactiveValue;
                } else {
                    (target as Record<string, unknown>)[prop as string] = reactiveValue;
                }

                // For arrays, also check if we're setting an index (numeric property)
                // For arrays, numeric indices should trigger notifications
                const isNumericIndex = typeof prop === 'string' && !isNaN(Number(prop)) && prop !== 'NaN';
                const shouldNotify = isArray 
                    ? isNumericIndex || !deepEqual(oldValue, reactiveValue)
                    : !deepEqual(oldValue, reactiveValue);

                if (shouldNotify) {
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