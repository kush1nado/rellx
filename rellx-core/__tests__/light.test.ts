import { createLightStore } from '../src/light/light';
import { StoreCore } from '../src/core/storeCore';

describe('StoreLight', () => {
    describe('Initialization', () => {
        it('should create store with initial state', () => {
            const store = createLightStore({ count: 0, name: 'test' });
            expect(store.getState()).toEqual({ count: 0, name: 'test' });
        });

        it('should be instance of StoreCore', () => {
            const store = createLightStore({ count: 0 });
            expect(store).toBeInstanceOf(StoreCore);
        });
    });

    describe('Basic operations', () => {
        it('should get state', () => {
            const store = createLightStore({ count: 5 });
            expect(store.getState()).toEqual({ count: 5 });
        });

        it('should set state', () => {
            const store = createLightStore({ count: 0 });
            store.setState(prev => ({ ...prev, count: 1 }));
            expect(store.getState()).toEqual({ count: 1 });
        });

        it('should subscribe to changes', () => {
            const store = createLightStore({ count: 0 });
            const listener = jest.fn();
            store.subscribe(listener);

            store.setState(prev => ({ ...prev, count: 1 }));

            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith({ count: 1 });
        });

        it('should unsubscribe from changes', () => {
            const store = createLightStore({ count: 0 });
            const listener = jest.fn();
            const unsubscribe = store.subscribe(listener);

            store.setState(prev => ({ ...prev, count: 1 }));
            expect(listener).toHaveBeenCalledTimes(1);

            unsubscribe();
            store.setState(prev => ({ ...prev, count: 2 }));
            expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
        });

        it('should destroy store', () => {
            const store = createLightStore({ count: 0 });
            const listener = jest.fn();
            store.subscribe(listener);

            store.destroy();
            store.setState(prev => ({ ...prev, count: 1 }));

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('State updates', () => {
        it('should handle nested state updates', () => {
            const store = createLightStore({
                user: { name: 'John', age: 25 }
            });

            store.setState(prev => ({
                ...prev,
                user: { ...prev.user, age: 26 }
            }));

            expect(store.getState()).toEqual({
                user: { name: 'John', age: 26 }
            });
        });

        it('should handle array state updates', () => {
            const store = createLightStore({ items: [1, 2, 3] });
            store.setState(prev => ({
                items: [...prev.items, 4]
            }));

            expect(store.getState().items).toEqual([1, 2, 3, 4]);
        });

        it('should handle complex state updates', () => {
            const store = createLightStore({
                count: 0,
                users: [{ id: 1, name: 'John' }],
                settings: { theme: 'dark' }
            });

            store.setState(prev => ({
                ...prev,
                count: 1,
                users: [...prev.users, { id: 2, name: 'Jane' }],
                settings: { ...prev.settings, theme: 'light' }
            }));

            expect(store.getState()).toEqual({
                count: 1,
                users: [
                    { id: 1, name: 'John' },
                    { id: 2, name: 'Jane' }
                ],
                settings: { theme: 'light' }
            });
        });
    });

    describe('Multiple listeners', () => {
        it('should notify all listeners', () => {
            const store = createLightStore({ count: 0 });
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            const listener3 = jest.fn();

            store.subscribe(listener1);
            store.subscribe(listener2);
            store.subscribe(listener3);

            store.setState(prev => ({ ...prev, count: 1 }));

            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);
            expect(listener3).toHaveBeenCalledTimes(1);
        });
    });
});

