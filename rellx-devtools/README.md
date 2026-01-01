# Rellx DevTools

DevTools для Rellx State Manager - мощные инструменты для отладки и мониторинга состояния приложения.

## Возможности

- **Time Travel Debugging** - путешествие по истории состояний
- **Action History** - полная история действий с временными метками
- **Real-time State Monitoring** - мониторинг состояния в реальном времени
- **WebSocket Communication** - быстрая связь с приложением
- **Modern UI** - современный интерфейс в стиле DevTools

## Структура проекта

```
rellx-devtools/
├── devtools-ui/              # React DevTools UI
├── extension/                # Browser Extension для Chrome/Edge
├── examples/                 # Примеры использования
├── scripts/                  # Серверные скрипты и утилиты
└── package.json             # Конфигурация проекта
```

## Установка и запуск

### Установка зависимостей

```bash
npm install
```

### Запуск DevTools UI

```bash
npm run dev
```

DevTools UI будет доступен по адресу: http://localhost:3000

### Запуск демо сервера

```bash
# Простой тестовый сервер
npm run start-simple

# Полный демо с реалистичными данными
npm run start-server
```

## Browser Extension

Rellx DevTools доступен как расширение для Chrome/Edge, которое интегрируется в браузерные DevTools.

### Установка расширения

1. **Соберите extension:**

```bash
# Генерируем иконки (первый раз)
npm run generate-icons

# Собираем extension
npm run build:extension
```

2. **Загрузите в Chrome/Edge:**

   - Откройте браузер и перейдите в `chrome://extensions/` (или `edge://extensions/`)
   - Включите "Режим разработчика" (Developer mode) в правом верхнем углу
   - Нажмите "Загрузить распакованное расширение" (Load unpacked)
   - Выберите папку `extension` в директории `rellx-devtools`

3. **Используйте расширение:**

   - Откройте любую веб-страницу
   - Откройте DevTools (F12)
   - Вы увидите новую вкладку "Rellx"
   - Кликните на неё для открытия DevTools UI

### Обновление расширения

После изменений в коде:

```bash
npm run build:extension
```

Затем в `chrome://extensions/` нажмите кнопку обновления (↻) у расширения Rellx DevTools.

## Использование

### 1. Запустите DevTools сервер

```bash
node scripts/start-devtools-server.cjs
```

### 2. Откройте DevTools UI

**Вариант A: Через веб-интерфейс**

```bash
cd devtools-ui
npm start
```

Откройте браузер: http://localhost:3000

**Вариант B: Через Browser Extension (рекомендуется)**

Расширение уже установлено (см. раздел [Browser Extension](#browser-extension) выше). Просто откройте DevTools браузера (F12) и перейдите на вкладку "Rellx".

### 3. Интеграция с вашим приложением

```javascript
// В вашем приложении
import { createStore } from "rellx";

const store = createStore({
  // ваша конфигурация
});

// Подключение к DevTools (опционально)
if (process.env.NODE_ENV === "development") {
  store.connectToDevTools("ws://localhost:8097");
}
```

## Основные функции

### Time Travel

- Перемещение по истории состояний
- Воспроизведение действий
- Сравнение состояний

### Action History

- Полная история всех действий
- Временные метки
- Детали действий

### State Monitoring

- Текущее состояние в реальном времени
- JSON просмотрщик
- Статистика

## WebSocket Protocol

DevTools использует простой WebSocket протокол:

### Сообщения от сервера:

```javascript
// Инициализация
{
  type: "INIT",
  payload: { state: {...} },
  timestamp: 1234567890,
  id: "init_1234567890"
}

// Обновление состояния
{
  type: "UPDATE",
  payload: {
    state: {...},
    action: {
      type: "ACTION_TYPE",
      id: "action_123",
      timestamp: 1234567890
    }
  },
  timestamp: 1234567890,
  id: "update_1234567890"
}
```

## Тестирование

```bash
npm test
```

## Лицензия

MIT
