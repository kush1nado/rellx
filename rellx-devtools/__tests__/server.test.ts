import { describe, it, expect, jest } from '@jest/globals';

const connectionHandlers: Array<(ws: unknown) => void> = [];

jest.mock('ws', () => {
    const MockWSS = function (this: { on: (e: string, h: (ws: unknown) => void) => unknown }) {
        this.on = (event: string, handler: (ws: unknown) => void) => {
            if (event === 'connection') {
                connectionHandlers.push(handler);
            }
            return this;
        };
        return this;
    };
    return {
        WebSocketServer: MockWSS,
        WebSocket: { OPEN: 1, CLOSING: 2, CLOSED: 3 }
    };
});

describe('DevToolsServer', () => {
    it('should create server and setup connection handler', () => {
        const { DevToolsServer } = require('../src/devtools/server');
        const server = new DevToolsServer();
        expect(server).toBeDefined();
        expect(typeof server.send).toBe('function');
    });

    it('should broadcast message to connected clients', () => {
        const { DevToolsServer } = require('../src/devtools/server');
        const { WebSocket } = require('ws');

        const sentData: string[] = [];
        const mockClient = {
            readyState: WebSocket.OPEN,
            send: (data: string) => sentData.push(data),
            on: () => mockClient
        };

        const server = new DevToolsServer();
        const connectionHandler = connectionHandlers[connectionHandlers.length - 1];
        connectionHandler(mockClient);

        const message = {
            type: 'UPDATE',
            payload: { state: { count: 1 } },
            timestamp: Date.now(),
            id: 'test-id',
            storeName: 'Test',
            storeId: 'store-1'
        };

        server.send(message);

        expect(sentData).toHaveLength(1);
        const parsed = JSON.parse(sentData[0]);
        expect(parsed.type).toBe('UPDATE');
        expect(parsed.payload.state).toEqual({ count: 1 });
    });
});
