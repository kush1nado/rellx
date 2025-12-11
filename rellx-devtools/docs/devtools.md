# Rellx DevTools

Мощная система DevTools для Rellx с поддержкой кастомных плагинов, time travel и аналитики.

## Возможности

- **Time Travel** - путешествие по истории состояний
- **Кастомные плагины** - создание собственных плагинов
- **Аналитика** - отслеживание действий и производительности
- **Экспорт/Импорт** - сохранение и загрузка состояния
- **WebSocket** - реальное время отладки
- **TypeScript** - полная типизация

## 📦 Установка

```bash
npm install rellx
```

## Базовое использование

```typescript
import { StoreCore } from "rellx";
import { createDevToolsPlugin } from "rellx/devtools";

// Создаем store
const store = new StoreCore({ count: 0 });

// Создаем DevTools
const devTools = createDevToolsPlugin(store, {
  name: "MyStore",
  maxHistorySize: 50,
  enableTimeTravel: true,
});

// Подключаемся
devTools.connect();
```

## Кастомные плагины

### Создание плагина

```typescript
import { DevToolsPlugin } from "rellx/devtools";

const myPlugin: DevToolsPlugin<MyState, MyAction> = {
  id: "my-plugin",
  name: "My Custom Plugin",
  version: "1.0.0",

  onInit: (store) => {
    console.log("Plugin initialized");
  },

  onStateChange: (state, action) => {
    console.log("State changed:", state, action);
  },

  onMessage: (message) => {
    console.log("Plugin message:", message);
  },

  onDestroy: () => {
    console.log("Plugin destroyed");
  },
};

// Регистрируем плагин
devTools.registerPlugin(myPlugin);
```

### Встроенные плагины

#### Analytics Plugin

```typescript
import { createAnalyticsPlugin } from "rellx/devtools";

const analyticsPlugin = createAnalyticsPlugin({
  endpoint: "https://analytics.example.com",
  apiKey: "your-api-key",
  trackEvents: true,
  trackErrors: true,
});

devTools.registerPlugin(analyticsPlugin);
```

#### Performance Plugin

```typescript
import { createPerformancePlugin } from "rellx/devtools";

const performancePlugin = createPerformancePlugin({
  threshold: 100, // ms
  logSlowActions: true,
});

devTools.registerPlugin(performancePlugin);
```

## ⏰ Time Travel

```typescript
// Прыжок к конкретному состоянию
devTools.timeTravel(0);

// Прыжок к конкретному действию
devTools.jumpToAction("action-id");

// Прыжок к конкретному стейту
devTools.jumpToState("state-id");
```

## Аналитика

```typescript
// Статистика действий
const stats = devTools.getActionStats();
console.log(stats); // { 'STATE_UPDATE': 5, 'CUSTOM_ACTION': 2 }

// Частота изменений состояния
const frequency = devTools.getStateChangeFrequency();
console.log(frequency); // 2.5 (изменений в секунду)

// История состояний
const history = devTools.getStateHistory();
console.log(history.states.length); // количество состояний
```

## 💾 Экспорт/Импорт

```typescript
// Экспорт состояния
const exported = devTools.exportState();
localStorage.setItem("rellx-state", exported);

// Импорт состояния
const imported = localStorage.getItem("rellx-state");
if (imported) {
  devTools.importState(imported);
}
```

## WebSocket API

### Подключение к DevTools UI

```typescript
// Подключение к DevTools серверу
devTools.connect("ws://localhost:8097");

// Отключение
devTools.disconnect();
```

### Отправка кастомных сообщений

```typescript
// Отправка сообщения плагину
devTools.sendCustomPluginMessage("my-plugin", "CUSTOM_EVENT", {
  data: "some data",
});
```

## Тестирование

```typescript
import { describe, it, expect } from "vitest";
import { DevToolsPluginManager } from "rellx/devtools";

describe("DevTools", () => {
  it("should track state changes", () => {
    const store = new StoreCore({ count: 0 });
    const devTools = createDevToolsPlugin(store);

    store.setState((prev) => ({ count: prev.count + 1 }));

    const history = devTools.getStateHistory();
    expect(history.states).toHaveLength(1);
  });
});
```

## 📋 API Reference

### DevToolsPluginManager

#### Методы

- `connect(url?: string)` - подключение к DevTools
- `disconnect()` - отключение
- `registerPlugin(plugin)` - регистрация плагина
- `unregisterPlugin(pluginId)` - удаление плагина
- `timeTravel(index)` - прыжок по времени
- `jumpToAction(actionId)` - прыжок к действию
- `jumpToState(stateId)` - прыжок к состоянию
- `exportState()` - экспорт состояния
- `importState(data)` - импорт состояния
- `getActionStats()` - статистика действий
- `getStateChangeFrequency()` - частота изменений
- `getStateHistory()` - история состояний
- `clearHistory()` - очистка истории

#### Конфигурация

```typescript
interface DevToolsConfig {
  name?: string;
  storeId?: string;
  maxHistorySize?: number;
  enableTimeTravel?: boolean;
  enableStateExport?: boolean;
  enableActionExport?: boolean;
  plugins?: DevToolsPlugin[];
}
```

### DevToolsPlugin

```typescript
interface DevToolsPlugin<T, P> {
  id: string;
  name: string;
  version: string;
  onInit?: (store: { getState(): T }) => void;
  onStateChange?: (state: T, action: Action<P>) => void;
  onMessage?: (message: DevToolsMessage<T, P>) => void;
  onDestroy?: () => void;
}
```

## Примеры

### Плагин для логирования

```typescript
const loggerPlugin: DevToolsPlugin<MyState, MyAction> = {
  id: "logger",
  name: "Logger Plugin",
  version: "1.0.0",

  onStateChange: (state, action) => {
    console.log(`[${action.type}]`, {
      state,
      action,
      timestamp: new Date().toISOString(),
    });
  },
};
```

### Плагин для мониторинга производительности

```typescript
const performancePlugin: DevToolsPlugin<MyState, MyAction> = {
  id: "performance",
  name: "Performance Plugin",
  version: "1.0.0",

  onStateChange: (state, action) => {
    if (action.duration && action.duration > 100) {
      console.warn(`Slow action: ${action.type} (${action.duration}ms)`);
    }
  },
};
```

### Плагин для аналитики

```typescript
const analyticsPlugin: DevToolsPlugin<MyState, MyAction> = {
  id: "analytics",
  name: "Analytics Plugin",
  version: "1.0.0",

  onStateChange: (state, action) => {
    // Отправка в Google Analytics
    gtag("event", "state_change", {
      action_type: action.type,
      state_size: JSON.stringify(state).length,
    });
  },
};
```

## Конфигурация

### TypeScript

```typescript
// Определение типов
interface AppState {
  user: User | null;
  settings: Settings;
}

interface AppAction {
  type: "LOGIN" | "LOGOUT" | "UPDATE_SETTINGS";
  payload?: unknown;
}

// Создание DevTools с типизацией
const devTools = createDevToolsPlugin<AppState, AppAction>(store, {
  name: "AppStore",
  plugins: [
    createAnalyticsPlugin<AppState, AppAction>({
      trackEvents: true,
    }),
  ],
});
```

## Производительность

- **Ленивая загрузка** - плагины загружаются только при необходимости
- **Ограничение истории** - автоматическое удаление старых состояний
- **WebSocket оптимизация** - батчинг сообщений
- **Memory management** - автоматическая очистка ресурсов

## Безопасность

- **Валидация данных** - проверка входящих сообщений
- **Изоляция плагинов** - плагины не могут влиять друг на друга
- **Ограничение доступа** - плагины имеют доступ только к своим данным

## Сообщество

- **GitHub Issues** - для багов и предложений
- **Discussions** - для обсуждений
- **Contributing** - для вклада в проект

## Лицензия

MIT License
