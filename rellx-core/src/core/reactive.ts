import { StoreCore } from './storeCore';

type ReactiveState<T> = T & {
    __isReactive?: boolean;
    __store?: StoreCore<T>;
};

type ReactiveObject = {
    __isReactive?: boolean;
    [key: string]: any;
};

export class ReactiveStore<T extends object> extends StoreCore<T> {
    private reactiveState: ReactiveState<T>;

    constructor(initialState: T) {
        super(initialState);
        this.reactiveState = this.createReactiveState(initialState);
    }

    private createReactiveState(state: T): ReactiveState<T> {
        const store = this;

        return new Proxy(state as ReactiveState<T>, {
            get(target, prop) {
                if (prop === '__isReactive') return true;
                if (prop === '__store') return store;

                const value = target[prop as keyof T];

                if (value && typeof value === 'object' && !(value as ReactiveObject).__isReactive) {
                    target[prop as keyof T] = store.makeReactive(value) as any;
                    return target[prop as keyof T];
                }

                return value;
            },

            set(target, prop, value) {
                const oldValue = target[prop as keyof T];

                if (value && typeof value === 'object' && !(value as ReactiveObject).__isReactive) {
                    value = store.makeReactive(value);
                }

                target[prop as keyof T] = value;

                if (oldValue !== value) {
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
    }

    private makeReactive<T extends object>(obj: T): T {
        if (!obj || typeof obj !== 'object') return obj;

        const store = this;

        return new Proxy(obj as T & ReactiveObject, {
            get(target, prop) {
                if (prop === '__isReactive') return true;

                const value = target[prop as keyof T];

                if (value && typeof value === 'object' && !(value as ReactiveObject).__isReactive) {
                    target[prop as keyof T] = store.makeReactive(value) as any;
                    return target[prop as keyof T];
                }

                return value;
            },

            set(target, prop, value) {
                const oldValue = target[prop as keyof T];

                if (value && typeof value === 'object' && !(value as ReactiveObject).__isReactive) {
                    value = store.makeReactive(value);
                }

                target[prop as keyof T] = value;

                if (oldValue !== value) {
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
    }

    getState(): T {
        return this.reactiveState;
    }

    setState(updater: (prevState: T) => T): void {
        const newState = updater(this.reactiveState);

        Object.keys(newState).forEach(key => {
            const k = key as keyof T;
            if (this.reactiveState[k] !== newState[k]) {
                this.reactiveState[k] = newState[k];
            }
        });

        this.notifyListeners();
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