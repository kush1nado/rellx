import { StoreFull } from "./full";

export function loggerMiddleware<T>(store: StoreFull<T>) {
    return (next: Function) => (updater: Function) => {
        console.log('Previous state:', store.getState());
        next(updater);
        console.log('Next state:', store.getState());
    };
}