import { describe, it, expect } from '@jest/globals';
import { deepEqual } from '../src/core/utils';

describe('deepEqual', () => {
    describe('primitives', () => {
        it('should return true for identical primitives', () => {
            expect(deepEqual(1, 1)).toBe(true);
            expect(deepEqual('a', 'a')).toBe(true);
            expect(deepEqual(true, true)).toBe(true);
            expect(deepEqual(false, false)).toBe(true);
        });

        it('should return false for different primitives', () => {
            expect(deepEqual(1, 2)).toBe(false);
            expect(deepEqual('a', 'b')).toBe(false);
            expect(deepEqual(true, false)).toBe(false);
        });

        it('should return true for same reference', () => {
            const obj = { a: 1 };
            expect(deepEqual(obj, obj)).toBe(true);
        });
    });

    describe('null and undefined', () => {
        it('should return true for both null', () => {
            expect(deepEqual(null, null)).toBe(true);
        });

        it('should return true for both undefined', () => {
            expect(deepEqual(undefined, undefined)).toBe(true);
        });

        it('should return false when one is null and other undefined', () => {
            expect(deepEqual(null, undefined)).toBe(false);
        });

        it('should return false when one is null/undefined and other is object', () => {
            expect(deepEqual(null, {})).toBe(false);
            expect(deepEqual(undefined, {})).toBe(false);
            expect(deepEqual({}, null)).toBe(false);
        });
    });

    describe('objects', () => {
        it('should return true for equal shallow objects', () => {
            expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
        });

        it('should return true for equal nested objects', () => {
            expect(
                deepEqual(
                    { a: { b: { c: 1 } } },
                    { a: { b: { c: 1 } } }
                )
            ).toBe(true);
        });

        it('should return false for objects with different values', () => {
            expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
        });

        it('should return false for objects with different keys', () => {
            expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
            expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
        });

        it('should return false for object vs array', () => {
            expect(deepEqual({ 0: 1, length: 1 }, [1])).toBe(false);
        });

        it('should handle empty objects', () => {
            expect(deepEqual({}, {})).toBe(true);
        });
    });

    describe('arrays', () => {
        it('should return true for equal arrays', () => {
            expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
        });

        it('should return true for equal nested arrays', () => {
            expect(deepEqual([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(true);
        });

        it('should return false for arrays with different order', () => {
            expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
        });

        it('should return false for arrays with different length', () => {
            expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
        });

        it('should handle empty arrays', () => {
            expect(deepEqual([], [])).toBe(true);
        });

        it('should return false for empty array vs empty object', () => {
            expect(deepEqual([], {})).toBe(false);
        });
    });

    describe('mixed structures', () => {
        it('should compare objects with arrays inside', () => {
            expect(
                deepEqual({ items: [1, 2], name: 'test' }, { items: [1, 2], name: 'test' })
            ).toBe(true);
            expect(
                deepEqual({ items: [1, 2] }, { items: [1, 3] })
            ).toBe(false);
        });

        it('should compare arrays with objects inside', () => {
            expect(
                deepEqual([{ id: 1 }, { id: 2 }], [{ id: 1 }, { id: 2 }])
            ).toBe(true);
        });
    });
});
