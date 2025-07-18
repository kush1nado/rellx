import { StoreCore } from '../core';

type Middleware<T> = (store: StoreFull<T>) => (next: Function) => (updater: Function) => void;

export class StoreFull<T> extends StoreCore<T> {
    private middlewares: Middleware<T>[] = [];

    constructor(initialState: T) {
        super(initialState);
    }

    use(middleware: Middleware<T>): void {
        this.middlewares.push(middleware);
    }

    setState(updater: (prevState: T) => T): void {
        if (this.middlewares.length === 0) {
            super.setState(updater);
            return;
        }

        const chain = this.middlewares.map(mw => mw(this));
        const composed = chain.reduceRight(
            (next, mw) => mw(next),
            super.setState.bind(this)
        );
        composed(updater);
    }
}

export function createFullStore<T>(initialState: T): StoreFull<T> {
    return new StoreFull(initialState);
}