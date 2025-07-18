// Глобальные настройки для тестов
import { jest } from '@jest/globals';

// Мокаем performance API для тестов
Object.defineProperty(global, 'performance', {
    value: {
        now: jest.fn(() => Date.now()),
        mark: jest.fn(),
        measure: jest.fn(),
        clearMarks: jest.fn(),
        clearMeasures: jest.fn(),
        getEntries: jest.fn(() => []),
        getEntriesByName: jest.fn(() => []),
        getEntriesByType: jest.fn(() => []),
        toJSON: jest.fn()
    },
    writable: true,
    configurable: true
});

// Мокаем console методы для тестов
Object.defineProperty(global, 'console', {
    value: {
        ...console,
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
    },
    writable: true,
    configurable: true
}); 