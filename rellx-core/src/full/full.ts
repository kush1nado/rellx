import { StoreCore } from '../core';

type StateUpdater<T> = (prevState: T) => T;
type NextFn<T> = (updater: StateUpdater<T>) => void;
type MiddlewareFn<T> = (next: NextFn<T>) => NextFn<T>;
type Middleware<T> = (store: StoreFull<T>) => MiddlewareFn<T>;

export class StoreFull<T> extends StoreCore<T> {
    private middlewares: Middleware<T>[] = [];

    constructor(initialState: T) {
        super(initialState);
    }

    use(middleware: Middleware<T>): void {
        this.middlewares.push(middleware);
    }

    setState(updater: StateUpdater<T>): void {
        if (this.middlewares.length === 0) {
            super.setState(updater);
            return;
        }

        const chain = this.middlewares.map(mw => mw(this));
        const composed = chain.reduceRight<NextFn<T>>(
            (next, mw) => mw(next),
            super.setState.bind(this)
        );
        composed(updater);
    }
}

export function createFullStore<T>(initialState: T): StoreFull<T> {
    return new StoreFull(initialState);
}