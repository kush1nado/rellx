import { WebSocketServer, WebSocket } from 'ws';
import { DevToolsMessage } from './protocol';

const PORT = 8097;

export class DevToolsServer<T, P> {
    private wss: WebSocketServer;
    private clients = new Set<WebSocket>();

    constructor() {
        this.wss = new WebSocketServer({ port: PORT });
        this.setupConnection();
        console.log(`DevTools server running on ws://localhost:${PORT}`);
    }

    private setupConnection() {
        this.wss.on('connection', ws => {
            this.clients.add(ws);
            ws.on('close', () => this.clients.delete(ws));
        });
    }

    send(message: DevToolsMessage<T, P>) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
}