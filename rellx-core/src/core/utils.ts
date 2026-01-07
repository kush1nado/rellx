/**
 * Deep comparison utility for objects
 */
export function deepEqual<T>(a: T, b: T): boolean {
    if (a === b) return true;

    if (a == null || b == null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key)) return false;

        const valueA = (a as Record<string, unknown>)[key];
        const valueB = (b as Record<string, unknown>)[key];

        if (!deepEqual(valueA, valueB)) return false;
    }

    return true;
}

