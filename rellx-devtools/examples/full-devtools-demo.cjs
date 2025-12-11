const { WebSocketServer } = require("ws");

class DemoStore {
  constructor() {
    this.state = {
      user: {
        name: "",
        email: "",
        isLoggedIn: false,
      },
      counter: 0,
      todos: [],
      theme: "light",
      notifications: [],
    };
    this.subscribers = [];
  }

  getState() {
    return this.state;
  }

  setState(updater) {
    const newState =
      typeof updater === "function" ? updater(this.state) : updater;
    this.state = { ...this.state, ...newState };
    this.notifySubscribers();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  }

  notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.state));
  }

  loginUser(name, email) {
    this.setState((prev) => ({
      user: { name, email, isLoggedIn: true },
      notifications: [
        ...prev.notifications,
        { type: "success", message: "User logged in" },
      ],
    }));
  }

  logoutUser() {
    this.setState((prev) => ({
      user: { name: "", email: "", isLoggedIn: false },
      notifications: [
        ...prev.notifications,
        { type: "info", message: "User logged out" },
      ],
    }));
  }

  incrementCounter() {
    this.setState((prev) => ({
      counter: prev.counter + 1,
    }));
  }

  addTodo(text) {
    this.setState((prev) => ({
      todos: [
        ...prev.todos,
        { id: Date.now().toString(), text, completed: false },
      ],
    }));
  }

  toggleTodo(id) {
    this.setState((prev) => ({
      todos: prev.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    }));
  }

  changeTheme(theme) {
    this.setState({ theme });
  }

  clearNotifications() {
    this.setState({ notifications: [] });
  }
}

const store = new DemoStore();

const wss = new WebSocketServer({ port: 8097 });
console.log("🚀 DevTools Demo Server запущен на ws://localhost:8097");

let messageCounter = 0;
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
      state: store.getState(),
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

const actions = [
  {
    name: "Login User",
    action: () => store.loginUser("John Doe", "john@example.com"),
  },
  { name: "Increment Counter", action: () => store.incrementCounter() },
  { name: "Add Todo", action: () => store.addTodo("Learn Rellx DevTools") },
  {
    name: "Add Another Todo",
    action: () => store.addTodo("Build amazing apps"),
  },
  {
    name: "Toggle Todo",
    action: () => store.toggleTodo(store.getState().todos[0]?.id),
  },
  { name: "Change Theme", action: () => store.changeTheme("dark") },
  { name: "Increment Again", action: () => store.incrementCounter() },
  {
    name: "Add More Todos",
    action: () => {
      store.addTodo("Write tests");
      store.addTodo("Deploy to production");
    },
  },
  { name: "Logout User", action: () => store.logoutUser() },
  {
    name: "Login Again",
    action: () => store.loginUser("Jane Smith", "jane@example.com"),
  },
];

let actionIndex = 0;

const actionInterval = setInterval(() => {
  if (actionIndex >= actions.length) {
    console.log("🔄 Демо завершено! Начинаем цикл заново...");
    actionIndex = 0; // Сбрасываем индекс для бесконечного цикла
  }

  const { name, action } = actions[actionIndex];
  console.log(`🎯 Выполняем действие: ${name}`);

  action();

  const message = {
    type: "UPDATE",
    payload: {
      state: store.getState(),
      action: {
        type: "CUSTOM_ACTION",
        id: `action_${++messageCounter}`,
        timestamp: Date.now(),
        name: name,
      },
    },
    timestamp: Date.now(),
    id: `msg_${messageCounter}`,
  };

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });

  actionIndex++;
}, 3000);

process.on("SIGINT", () => {
  console.log("\n🛑 Останавливаем демо сервер...");
  clearInterval(actionInterval);
  wss.close();
  process.exit(0);
});

console.log("📡 Сервер готов! Откройте DevTools UI в браузере");
console.log("🎯 Демо будет выполнять действия каждые 3 секунды");
