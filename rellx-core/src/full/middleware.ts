import { StoreFull } from "./full";

type StateUpdater<T> = (prevState: T) => T;
type NextFn<T> = (updater: StateUpdater<T>) => void;
type MiddlewareFn<T> = (next: NextFn<T>) => NextFn<T>;

export function loggerMiddleware<T>(store: StoreFull<T>): MiddlewareFn<T> {
    return (next: NextFn<T>) => (updater: StateUpdater<T>) => {
        console.log('Previous state:', store.getState());
        next(updater);
        console.log('Next state:', store.getState());
    };
}