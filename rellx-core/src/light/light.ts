import { StoreCore } from "../core";

export function createLightStore<T>(initialState: T): StoreCore<T> {
    return new StoreCore(initialState);
}