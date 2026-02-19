import { describe, it, expect } from '@jest/globals';
import { computeStateDiff, applyStateDiff } from '../src/devtools/diff';

describe('computeStateDiff', () => {
    it('should return null when keys are removed', () => {
        const prev = { a: 1, b: 2 };
        const next = { a: 1 };
        expect(computeStateDiff(prev, next)).toBe(null);
    });

    it('should return changed keys only', () => {
        const prev = { a: 1, b: 2, c: 3 };
        const next = { a: 1, b: 20, c: 3 };
        expect(computeStateDiff(prev, next)).toEqual({ b: 20 });
    });

    it('should return null when no changes', () => {
        const prev = { a: 1, b: 2 };
        const next = { a: 1, b: 2 };
        expect(computeStateDiff(prev, next)).toBe(null);
    });

    it('should include new keys', () => {
        const prev = { a: 1 };
        const next = { a: 1, b: 2 };
        expect(computeStateDiff(prev, next)).toEqual({ b: 2 });
    });

    it('should handle nested object changes', () => {
        const prev = { a: 1, user: { name: 'John' } };
        const next = { a: 1, user: { name: 'Jane' } };
        expect(computeStateDiff(prev, next)).toEqual({ user: { name: 'Jane' } });
    });
});

describe('applyStateDiff', () => {
    it('should apply changed values', () => {
        const base = { a: 1, b: 2 };
        const diff = { b: 20 };
        expect(applyStateDiff(base, diff)).toEqual({ a: 1, b: 20 });
    });

    it('should add new keys', () => {
        const base = { a: 1 };
        const diff = { b: 2 };
        expect(applyStateDiff(base, diff)).toEqual({ a: 1, b: 2 });
    });

    it('should remove keys when value is undefined', () => {
        const base = { a: 1, b: 2 };
        const diff = { b: undefined };
        const result = applyStateDiff(base, diff);
        expect(result).toEqual({ a: 1 });
        expect('b' in result).toBe(false);
    });
});
