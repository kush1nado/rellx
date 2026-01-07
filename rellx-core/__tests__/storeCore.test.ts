import { StoreCore } from '../src/core/storeCore';
import type { StorePlugin } from '../src/types/plugin';

describe('StoreCore', () => {
    describe('Initialization', () => {
        it('should create store with initial state', () => {
            const store = new StoreCore({ count: 0, name: 'test' });
            expect(store.getState()).toEqual({ count: 0, name: 'test' });
        });

        it('should create store with empty state', () => {
            const store = new StoreCore({});
            expect(store.getState()).toEqual({});
        });
    });

    describe('getState', () => {
        it('should return current state', () => {
            const initialState = { count: 5, items: [1, 2, 3] };
            const store = new StoreCore(initialState);
            expect(store.getState()).toBe(initialState);
        });
    });

    describe('setState', () => {
        it('should update state correctly', () => {
            const store = new StoreCore({ count: 0 });
            store.setState(prev => ({ ...prev, count: 1 }));
            expect(store.getState()).toEqual({ count: 1 });
        });

        it('should trigger listeners on state change', () => {
            const store = new StoreCore({ count: 0 });
            const listener = jest.fn();
            store.subscribe(listener);

            store.setState(prev => ({ ...prev, count: 1 }));

            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith({ count: 1 });
        });

        it('should not trigger listeners when state is unchanged', () => {
            const store = new StoreCore({ count: 0 });
            const listener = jest.fn();
            store.subscribe(listener);

            store.setState(prev => ({ ...prev, count: 0 }));

            expect(listener).not.toHaveBeenCalled();
        });

        it('should not trigger listeners when deep equality is same', () => {
            const store = new StoreCore({ count: 0, user: { name: 'John' } });
            const listener = jest.fn();
            store.subscribe(listener);

            store.setState(prev => ({ count: 0, user: { name: 'John' } }));

            expect(listener).not.toHaveBeenCalled();
        });

        it('should trigger listeners when deep equality differs', () => {
            const store = new StoreCore({ count: 0, user: { name: 'John' } });
            const listener = jest.fn();
            store.subscribe(listener);

            store.setState(prev => ({ count: 0, user: { name: 'Jane' } }));

            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith({ count: 0, user: { name: 'Jane' } });
        });

        it('should update state with complex objects', () => {
            const store = new StoreCore({
                users: [{ id: 1, name: 'John' }],
                settings: { theme: 'dark' }
            });

            store.setState(prev => ({
                ...prev,
                users: [...prev.users, { id: 2, name: 'Jane' }]
            }));

            expect(store.getState().users).toHaveLength(2);
            expect(store.getState().users[1]).toEqual({ id: 2, name: 'Jane' });
        });
    });

    describe('subscribe', () => {
        it('should add listener and return unsubscribe function', () => {
            const store = new StoreCore({ count: 0 });
            const listener = jest.fn();
            const unsubscribe = store.subscribe(listener);

            expect(typeof unsubscribe).toBe('function');

            store.setState(prev => ({ ...prev, count: 1 }));
            expect(listener).toHaveBeenCalledTimes(1);

            unsubscribe();
            store.setState(prev => ({ ...prev, count: 2 }));
            expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
        });

        it('should handle multiple subscriptions', () => {
            const store = new StoreCore({ count: 0 });
            const listener1 = jest.fn();
            const listener2 = jest.fn();

            store.subscribe(listener1);
            store.subscribe(listener2);

            store.setState(prev => ({ ...prev, count: 1 }));

            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);
        });

        it('should call listeners in order', () => {
            const store = new StoreCore({ count: 0 });
            const callOrder: number[] = [];
            const listener1 = jest.fn(() => callOrder.push(1));
            const listener2 = jest.fn(() => callOrder.push(2));

            store.subscribe(listener1);
            store.subscribe(listener2);

            store.setState(prev => ({ ...prev, count: 1 }));

            expect(callOrder).toEqual([1, 2]);
        });
    });

    describe('Plugins', () => {
        it('should initialize plugins on creation', () => {
            const onInit = jest.fn();
            const plugin: StorePlugin<{ count: number }> = {
                onInit
            };

            const store = new StoreCore({ count: 0 }, [plugin]);

            expect(onInit).toHaveBeenCalledTimes(1);
            expect(onInit).toHaveBeenCalledWith(store);
        });

        it('should call onBeforeUpdate before state update', () => {
            const onBeforeUpdate = jest.fn((newState) => ({ ...newState, modified: true }));
            const plugin: StorePlugin<{ count: number; modified?: boolean }> = {
                onBeforeUpdate
            };

            const store = new StoreCore({ count: 0 }, [plugin]);
            store.setState(prev => ({ ...prev, count: 1 }));

            expect(onBeforeUpdate).toHaveBeenCalledTimes(1);
            expect(store.getState()).toEqual({ count: 1, modified: true });
        });

        it('should call onAfterUpdate after state update', () => {
            const onAfterUpdate = jest.fn();
            const plugin: StorePlugin<{ count: number }> = {
                onAfterUpdate
            };

            const store = new StoreCore({ count: 0 }, [plugin]);
            store.setState(prev => ({ ...prev, count: 1 }));

            expect(onAfterUpdate).toHaveBeenCalledTimes(1);
            expect(onAfterUpdate).toHaveBeenCalledWith(
                { count: 1 },
                { count: 0 }
            );
        });

        it('should handle plugin factory', () => {
            const onInit = jest.fn();
            const pluginFactory: (store: StoreCore<{ count: number }>) => StorePlugin<{ count: number }> = (store) => ({
                onInit: () => onInit(store)
            });

            const store = new StoreCore({ count: 0 }, [pluginFactory]);

            expect(onInit).toHaveBeenCalledTimes(1);
            expect(onInit).toHaveBeenCalledWith(store);
        });

        it('should call onSubscribe when listener is added', () => {
            const onSubscribe = jest.fn();
            const plugin: StorePlugin<{ count: number }> = {
                onSubscribe
            };

            const store = new StoreCore({ count: 0 }, [plugin]);
            const listener = jest.fn();
            store.subscribe(listener);

            expect(onSubscribe).toHaveBeenCalledTimes(1);
            expect(onSubscribe).toHaveBeenCalledWith(listener);
        });

        it('should call plugin unsubscribe on listener unsubscribe', () => {
            const unsubscribe = jest.fn();
            const onSubscribe = jest.fn(() => unsubscribe);
            const plugin: StorePlugin<{ count: number }> = {
                onSubscribe
            };

            const store = new StoreCore({ count: 0 }, [plugin]);
            const listener = jest.fn();
            const unsub = store.subscribe(listener);

            unsub();

            expect(unsubscribe).toHaveBeenCalledTimes(1);
        });

        it('should call onDestroy when store is destroyed', () => {
            const onDestroy = jest.fn();
            const plugin: StorePlugin<{ count: number }> = {
                onDestroy
            };

            const store = new StoreCore({ count: 0 }, [plugin]);
            store.destroy();

            expect(onDestroy).toHaveBeenCalledTimes(1);
        });

        it('should handle multiple plugins', () => {
            const onInit1 = jest.fn();
            const onInit2 = jest.fn();
            const plugin1: StorePlugin<{ count: number }> = { onInit: onInit1 };
            const plugin2: StorePlugin<{ count: number }> = { onInit: onInit2 };

            const store = new StoreCore({ count: 0 }, [plugin1, plugin2]);

            expect(onInit1).toHaveBeenCalledTimes(1);
            expect(onInit2).toHaveBeenCalledTimes(1);
        });
    });

    describe('destroy', () => {
        it('should clear all listeners', () => {
            const store = new StoreCore({ count: 0 });
            const listener = jest.fn();

            store.subscribe(listener);
            store.destroy();

            store.setState(prev => ({ ...prev, count: 1 }));
            expect(listener).not.toHaveBeenCalled();
        });

        it('should call onDestroy for all plugins', () => {
            const onDestroy1 = jest.fn();
            const onDestroy2 = jest.fn();
            const plugin1: StorePlugin<{ count: number }> = { onDestroy: onDestroy1 };
            const plugin2: StorePlugin<{ count: number }> = { onDestroy: onDestroy2 };

            const store = new StoreCore({ count: 0 }, [plugin1, plugin2]);
            store.destroy();

            expect(onDestroy1).toHaveBeenCalledTimes(1);
            expect(onDestroy2).toHaveBeenCalledTimes(1);
        });
    });

    describe('Edge cases', () => {
        it('should handle null and undefined values', () => {
            const store = new StoreCore<{ value: string | null | undefined }>({ value: null });
            const listener = jest.fn();
            store.subscribe(listener);

            store.setState(() => ({ value: undefined }));
            expect(listener).toHaveBeenCalledWith({ value: undefined });
        });

        it('should handle array state', () => {
            const store = new StoreCore({ items: [1, 2, 3] });
            const listener = jest.fn();
            store.subscribe(listener);

            store.setState(prev => ({ items: [...prev.items, 4] }));
            expect(listener).toHaveBeenCalledWith({ items: [1, 2, 3, 4] });
        });

        it('should handle primitive state', () => {
            const store = new StoreCore<{ value: number }>({ value: 0 });
            store.setState(() => ({ value: 1 }));
            expect(store.getState().value).toBe(1);
        });
    });
});

