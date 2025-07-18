const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8097 });

console.log("🚀 DevTools Server запущен на ws://localhost:8097");
console.log("📡 Сервер готов! Откройте DevTools UI в браузере");

let connectionCount = 0;
const maxConnections = 1;
let lastConnectionTime = 0;
const connectionDebounce = 1000;

wss.on("connection", (ws) => {
  const now = Date.now();

  if (now - lastConnectionTime < connectionDebounce) {
    console.log("🔌 Игнорируем частое подключение");
    ws.close(1000, "Too frequent connections");
    return;
  }

  connectionCount++;
  lastConnectionTime = now;

  if (connectionCount > maxConnections) {
    console.log("🔌 Уже есть подключение, закрываем новое");
    ws.close(1000, "Already connected");
    connectionCount--;
    return;
  }

  console.log("🔌 DevTools UI подключился");

  const initMessage = {
    type: "INIT",
    payload: {
      state: {
        counter: 0,
        user: null,
        theme: "light",
      },
    },
    timestamp: Date.now(),
    id: `init_${Date.now()}`,
  };
  ws.send(JSON.stringify(initMessage));

  ws.on("close", () => {
    connectionCount--;
    console.log("🔌 DevTools UI отключился");
  });
});

let messageCounter = 0;
const interval = setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      messageCounter++;

      const action = {
        type: `TEST_ACTION_${messageCounter}`,
        timestamp: Date.now(),
        id: `action_${messageCounter}_${Date.now()}`,
        name: `Test Action ${messageCounter}`,
      };

      const state = {
        counter: messageCounter,
        user: messageCounter % 2 === 0 ? { id: 1, name: "Test User" } : null,
        theme: messageCounter % 3 === 0 ? "dark" : "light",
        lastUpdate: new Date().toISOString(),
      };

      const message = {
        type: "UPDATE",
        payload: {
          state,
          action,
        },
        timestamp: Date.now(),
        id: `update_${messageCounter}_${Date.now()}`,
      };

      client.send(JSON.stringify(message));
      console.log(`📤 Отправлено обновление #${messageCounter}`);
    }
  });
}, 5000);

process.on("SIGINT", () => {
  console.log("\n🛑 Останавливаем DevTools сервер...");
  clearInterval(interval);
  wss.close();
  process.exit(0);
});
