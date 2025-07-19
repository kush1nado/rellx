import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createReactiveStore, ReactiveStore } from '../src/core/reactive';

describe('ReactiveStore', () => {
    let store: ReactiveStore<any>;

    beforeEach(() => {
        store = createReactiveStore({
            count: 0,
            user: {
                name: 'John',
                age: 25,
                preferences: {
                    theme: 'dark',
                    language: 'en'
                }
            },
            todos: [
                { id: 1, text: 'Learn Rellx', completed: false },
                { id: 2, text: 'Build app', completed: true }
            ]
        });
    });

    describe('Basic reactivity', () => {
        it('should trigger listeners when direct property is changed', () => {
            const listener = jest.fn();
            store.subscribe(listener);

            store.reactive.count = 5;

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                count: 5
            }));
        });

        it('should trigger listeners when nested property is changed', () => {
            const listener = jest.fn();
            store.subscribe(listener);

            store.reactive.user.name = 'Jane';

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                user: expect.objectContaining({
                    name: 'Jane'
                })
            }));
        });

        it('should trigger listeners when deeply nested property is changed', () => {
            const listener = jest.fn();
            store.subscribe(listener);

            store.reactive.user.preferences.theme = 'light';

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                user: expect.objectContaining({
                    preferences: expect.objectContaining({
                        theme: 'light'
                    })
                })
            }));
        });

        it('should trigger listeners when array element is changed', () => {
            const listener = jest.fn();
            store.subscribe(listener);

            store.reactive.todos[0].completed = true;

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                todos: expect.arrayContaining([
                    expect.objectContaining({ completed: true })
                ])
            }));
        });
    });

    describe('Property access methods', () => {
        it('should get property using getProperty', () => {
            expect(store.getProperty('count')).toBe(0);
            expect(store.getProperty('user').name).toBe('John');
        });

        it('should set property using setProperty', () => {
            const listener = jest.fn();
            store.subscribe(listener);

            store.setProperty('count', 10);

            expect(store.getProperty('count')).toBe(10);
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                count: 10
            }));
        });
    });

    describe('Nested object reactivity', () => {
        it('should make new objects reactive when assigned', () => {
            const listener = jest.fn();
            store.subscribe(listener);

            const newUser = { name: 'Alice', age: 30 };
            store.reactive.user = newUser;

            store.reactive.user.age = 31;

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                user: expect.objectContaining({
                    age: 31
                })
            }));
        });

        it('should make arrays reactive', () => {
            const listener = jest.fn();
            store.subscribe(listener);

            store.reactive.todos.push({ id: 3, text: 'New todo', completed: false });

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                todos: expect.arrayContaining([
                    expect.objectContaining({ id: 3 })
                ])
            }));
        });
    });

    describe('setState method', () => {
        it('should work with reactive state', () => {
            const listener = jest.fn();
            store.subscribe(listener);

            store.setState(state => ({
                ...state,
                count: state.count + 1
            }));

            expect(store.getState().count).toBe(1);
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                count: 1
            }));
        });

        it('should preserve reactivity after setState', () => {
            store.setState(state => ({
                ...state,
                count: 5
            }));

            const listener = jest.fn();
            store.subscribe(listener);

            store.reactive.count = 10;

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                count: 10
            }));
        });
    });

    describe('Reactive state access', () => {
        it('should provide reactive state through reactive getter', () => {
            const reactiveState = store.reactive;

            expect(reactiveState.__isReactive).toBe(true);
            expect(reactiveState.__store).toBe(store);
        });

        it('should allow direct mutation of reactive state', () => {
            const listener = jest.fn();
            store.subscribe(listener);

            const reactiveState = store.reactive;
            reactiveState.count = 100;

            expect(listener).toHaveBeenCalledWith(expect.objectContaining({
                count: 100
            }));
        });
    });

    describe('Performance and optimization', () => {
        it('should not trigger listeners when value is the same', () => {
            const listener = jest.fn();
            store.subscribe(listener);

            store.reactive.count = 0;

            expect(listener).not.toHaveBeenCalled();
        });

        it('should handle multiple subscriptions correctly', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();

            const unsubscribe1 = store.subscribe(listener1);
            const unsubscribe2 = store.subscribe(listener2);

            store.reactive.count = 5;

            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);

            unsubscribe1();
            store.reactive.count = 10;

            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(2);
        });
    });

    describe('Error handling', () => {
        it('should handle non-object values gracefully', () => {
            const simpleStore = createReactiveStore({
                count: 0,
                text: 'hello',
                flag: true
            });

            const listener = jest.fn();
            simpleStore.subscribe(listener);

            simpleStore.reactive.count = 5;
            simpleStore.reactive.text = 'world';
            simpleStore.reactive.flag = false;

            expect(listener).toHaveBeenCalledTimes(3);
        });
    });
}); 