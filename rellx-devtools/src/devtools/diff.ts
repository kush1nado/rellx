import { deepEqual } from 'rellx';

export type StateDiff = Record<string, unknown>;

/**
 * Computes a shallow diff between previous and next state.
 * Returns only top-level keys that have changed.
 * When keys are removed from state, returns null (caller should send full state).
 */
export function computeStateDiff(
    prev: Record<string, unknown>,
    next: Record<string, unknown>
): StateDiff | null {
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);

    const hasRemovals = prevKeys.some(k => !nextKeys.includes(k));
    if (hasRemovals) {
        return null;
    }

    const diff: StateDiff = {};
    for (const key of nextKeys) {
        const prevVal = prev[key];
        const nextVal = next[key];
        if (!deepEqual(prevVal, nextVal)) {
            diff[key] = nextVal;
        }
    }

    return Object.keys(diff).length > 0 ? diff : null;
}

/**
 * Applies a diff to a base state. Mutates base and returns it.
 * Used when receiving UPDATE with diff instead of full state.
 */
export function applyStateDiff(
    base: Record<string, unknown>,
    diff: StateDiff
): Record<string, unknown> {
    for (const key of Object.keys(diff)) {
        const value = diff[key];
        if (value === undefined && Object.prototype.hasOwnProperty.call(diff, key)) {
            delete base[key];
        } else {
            base[key] = value;
        }
    }
    return base;
}
