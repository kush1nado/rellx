import { StoreCore } from "../core";

export interface StorePlugin<T> {
    onInit?(store: StoreCore<T>): void;

    onBeforeUpdate?(newState: T, oldState: T): void | T;

    onAfterUpdate?(newState: T, oldState: T): void;

    onSubscribe?(listener: (state: T) => void): () => void;

    onDestroy?(): void;
}

export type PluginFactory<T> = (store: StoreCore<T>) => StorePlugin<T>;