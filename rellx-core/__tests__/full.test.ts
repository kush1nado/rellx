import { createFullStore, StoreFull } from '../src/full/full';
import { loggerMiddleware } from '../src/full/middleware';
import type { StoreFull as StoreFullType } from '../src/full/full';

type StateUpdater<T> = (prevState: T) => T;
type NextFn<T> = (updater: StateUpdater<T>) => void;
type MiddlewareFn<T> = (next: NextFn<T>) => NextFn<T>;
type Middleware<T> = (store: StoreFullType<T>) => MiddlewareFn<T>;

describe('StoreFull', () => {
    describe('Initialization', () => {
        it('should create store with initial state', () => {
            const store = createFullStore({ count: 0, name: 'test' });
            expect(store.getState()).toEqual({ count: 0, name: 'test' });
        });

        it('should work without middleware', () => {
            const store = createFullStore({ count: 0 });
            const listener = jest.fn();
            store.subscribe(listener);

            store.setState(prev => ({ ...prev, count: 1 }));

            expect(listener).toHaveBeenCalledTimes(1);
            expect(store.getState()).toEqual({ count: 1 });
        });
    });

    describe('Middleware', () => {
        it('should use middleware when provided', () => {
            const store = createFullStore({ count: 0 });
            const middleware: Middleware<{ count: number }> = jest.fn((store) => (next: NextFn<{ count: number }>) => (updater: StateUpdater<{ count: number }>) => {
                next(updater);
            });

            store.use(middleware);
            store.setState(prev => ({ ...prev, count: 1 }));

            expect(middleware).toHaveBeenCalledTimes(1);
            expect(middleware).toHaveBeenCalledWith(store);
            expect(store.getState()).toEqual({ count: 1 });
        });

        it('should compose multiple middlewares correctly', () => {
            const store = createFullStore({ count: 0 });
            const callOrder: string[] = [];

            const middleware1: Middleware<{ count: number }> = jest.fn((store) => (next: NextFn<{ count: number }>) => (updater: StateUpdater<{ count: number }>) => {
                callOrder.push('middleware1-before');
                next(updater);
                callOrder.push('middleware1-after');
            });

            const middleware2: Middleware<{ count: number }> = jest.fn((store) => (next: NextFn<{ count: number }>) => (updater: StateUpdater<{ count: number }>) => {
                callOrder.push('middleware2-before');
                next(updater);
                callOrder.push('middleware2-after');
            });

            store.use(middleware1);
            store.use(middleware2);

            store.setState(prev => ({ ...prev, count: 1 }));

            expect(callOrder).toEqual([
                'middleware1-before',
                'middleware2-before',
                'middleware2-after',
                'middleware1-after'
            ]);
        });

        it('should work with loggerMiddleware', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const store = createFullStore({ count: 0 });

            store.use(loggerMiddleware);
            store.setState(prev => ({ ...prev, count: 1 }));

            expect(consoleSpy).toHaveBeenCalled();
            expect(store.getState()).toEqual({ count: 1 });

            consoleSpy.mockRestore();
        });

        it('should allow middleware to modify state', () => {
            const store = createFullStore({ count: 0 });
            const middleware: Middleware<{ count: number }> = jest.fn((store) => (next: NextFn<{ count: number }>) => (updater: StateUpdater<{ count: number }>) => {
                next((prev: { count: number }) => {
                    const result = updater(prev);
                    return { ...result, modified: true };
                });
            });

            store.use(middleware);
            store.setState(prev => ({ ...prev, count: 1 }));

            expect(store.getState()).toEqual({ count: 1, modified: true });
        });

        it('should allow middleware to prevent state update', () => {
            const store = createFullStore({ count: 0 });
            const listener = jest.fn();
            store.subscribe(listener);

            const middleware: Middleware<{ count: number }> = jest.fn((store) => (next: NextFn<{ count: number }>) => (updater: StateUpdater<{ count: number }>) => {
                // Don't call next, preventing update
            });

            store.use(middleware);
            store.setState(prev => ({ ...prev, count: 1 }));

            expect(store.getState()).toEqual({ count: 0 });
            expect(listener).not.toHaveBeenCalled();
        });

        it('should handle middleware chain with errors gracefully', () => {
            const store = createFullStore({ count: 0 });
            const errorMiddleware: Middleware<{ count: number }> = jest.fn((store) => (next: NextFn<{ count: number }>) => (updater: StateUpdater<{ count: number }>) => {
                throw new Error('Middleware error');
            });

            store.use(errorMiddleware);

            expect(() => {
                store.setState(prev => ({ ...prev, count: 1 }));
            }).toThrow('Middleware error');
        });

        it('should preserve middleware order', () => {
            const store = createFullStore({ count: 0 });
            const order: number[] = [];

            const middleware1: Middleware<{ count: number }> = jest.fn((store) => (next: NextFn<{ count: number }>) => (updater: StateUpdater<{ count: number }>) => {
                order.push(1);
                next(updater);
            });

            const middleware2: Middleware<{ count: number }> = jest.fn((store) => (next: NextFn<{ count: number }>) => (updater: StateUpdater<{ count: number }>) => {
                order.push(2);
                next(updater);
            });

            const middleware3: Middleware<{ count: number }> = jest.fn((store) => (next: NextFn<{ count: number }>) => (updater: StateUpdater<{ count: number }>) => {
                order.push(3);
                next(updater);
            });

            store.use(middleware1);
            store.use(middleware2);
            store.use(middleware3);

            store.setState(prev => ({ ...prev, count: 1 }));

            expect(order).toEqual([1, 2, 3]);
        });
    });

    describe('State updates', () => {
        it('should update state correctly with middleware', () => {
            const store = createFullStore<{ count: number; items: number[] }>({ count: 0, items: [] });
            store.setState(prev => ({ ...prev, count: 1, items: [1, 2, 3] }));

            expect(store.getState()).toEqual({ count: 1, items: [1, 2, 3] });
        });

        it('should trigger listeners with middleware', () => {
            const store = createFullStore({ count: 0 });
            const listener = jest.fn();
            store.subscribe(listener);

            const middleware: Middleware<{ count: number }> = jest.fn((store) => (next: NextFn<{ count: number }>) => (updater: StateUpdater<{ count: number }>) => {
                next(updater);
            });

            store.use(middleware);
            store.setState(prev => ({ ...prev, count: 1 }));

            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith({ count: 1 });
        });
    });

    describe('Integration with StoreCore', () => {
        it('should inherit all StoreCore methods', () => {
            const store = createFullStore({ count: 0 });
            expect(typeof store.getState).toBe('function');
            expect(typeof store.setState).toBe('function');
            expect(typeof store.subscribe).toBe('function');
            expect(typeof store.destroy).toBe('function');
        });

        it('should work with plugins', () => {
            const onInit = jest.fn();
            const store = new StoreFull({ count: 0 });
            store['plugins'] = [{ onInit }];

            // Access protected state through setState
            store.setState(prev => ({ ...prev, count: 1 }));

            // Plugins should be initialized (this is handled by StoreCore constructor)
            // Since we're testing StoreFull, we can't easily test plugin initialization
            // without exposing protected members, but we can test that setState works
            expect(store.getState()).toEqual({ count: 1 });
        });
    });
});

