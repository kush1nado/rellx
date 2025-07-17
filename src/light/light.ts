import { Core } from "../core";

export function createLightStore<T>(initialState: T): Core<T> {
    return new Core(initialState);
}