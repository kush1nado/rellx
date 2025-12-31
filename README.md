# Rellx

Универсальный менеджер состояния для JavaScript и TypeScript приложений. Rellx предоставляет простой и мощный API для управления состоянием с поддержкой реактивности, middleware, плагинов и DevTools.

## Что это такое?

Rellx - это библиотека для управления состоянием, которая решает проблему синхронизации данных между различными частями приложения. Она создана с учетом простоты использования, производительности и гибкости.

Библиотека предлагает три режима работы:
- **Light** - минималистичный вариант с базовым функционалом
- **Full** - полная версия с поддержкой middleware
- **Reactive** - реактивная версия с автоматическим отслеживанием изменений

## Основные возможности

- **Простой API** - интуитивно понятный интерфейс для работы с состоянием
- **TypeScript поддержка** - полная типизация из коробки
- **Реактивность** - автоматическое отслеживание изменений вложенных объектов
- **Middleware** - расширяемость через систему middleware
- **Плагины** - поддержка кастомных плагинов для расширения функциональности
- **DevTools** - инструменты для отладки и мониторинга состояния
- **Небольшой размер** - легковесная библиотека без лишних зависимостей
- **Универсальность** - работает в браузере и Node.js

## Установка

```bash
npm install rellx
```

или

```bash
yarn add rellx
```

или

```bash
pnpm add rellx
```

## Быстрый старт

### Light версия

Самая простая версия для базового управления состоянием:

```typescript
import { createLightStore } from 'rellx';

interface State {
  count: number;
  user: string | null;
}

const store = createLightStore<State>({
  count: 0,
  user: null
});

// Подписка на изменения
const unsubscribe = store.subscribe((state) => {
  console.log('State changed:', state);
});

// Обновление состояния
store.setState((prev) => ({
  ...prev,
  count: prev.count + 1
}));

// Получение текущего состояния
const currentState = store.getState();

// Отписка
unsubscribe();
```

### Full версия с middleware

Версия с поддержкой middleware для более сложных сценариев:

```typescript
import { createFullStore, loggerMiddleware } from 'rellx/full';

interface State {
  todos: Array<{ id: number; text: string; completed: boolean }>;
  filter: 'all' | 'active' | 'completed';
}

const store = createFullStore<State>({
  todos: [],
  filter: 'all'
});

// Добавление middleware
store.use(loggerMiddleware);

// Создание кастомного middleware
store.use((store) => (next) => (updater) => {
  console.log('Before update:', store.getState());
  next(updater);
  console.log('After update:', store.getState());
});

// Использование
store.setState((prev) => ({
  ...prev,
  todos: [...prev.todos, { id: 1, text: 'New todo', completed: false }]
}));
```

### Reactive версия

Реактивная версия с автоматическим отслеживанием изменений:

```typescript
import { createReactiveStore } from 'rellx';

interface State {
  user: {
    name: string;
    age: number;
    preferences: {
      theme: 'light' | 'dark';
    };
  };
  counter: number;
}

const store = createReactiveStore<State>({
  user: {
    name: 'John',
    age: 25,
    preferences: {
      theme: 'light'
    }
  },
  counter: 0
});

// Подписка на изменения
store.subscribe((state) => {
  console.log('State updated:', state);
});

// Прямое изменение свойств - изменения отслеживаются автоматически
store.reactive.counter = 10;
store.reactive.user.name = 'Jane';
store.reactive.user.preferences.theme = 'dark';

// Все изменения автоматически триггерят подписчиков
```

## API

### StoreCore

Базовый класс для всех версий стора.

#### Методы

- `getState(): T` - получить текущее состояние
- `setState(updater: (prevState: T) => T): void` - обновить состояние
- `subscribe(listener: (state: T) => void): () => void` - подписаться на изменения, возвращает функцию отписки
- `destroy(): void` - уничтожить стор и очистить все подписки

### Light Store

Простая версия без дополнительных функций.

```typescript
import { createLightStore } from 'rellx';

const store = createLightStore(initialState);
```

### Full Store

Версия с поддержкой middleware.

```typescript
import { createFullStore } from 'rellx/full';

const store = createFullStore(initialState);

// Добавление middleware
store.use(middleware);
```

### Reactive Store

Реактивная версия с автоматическим отслеживанием.

```typescript
import { createReactiveStore } from 'rellx';

const store = createReactiveStore(initialState);

// Доступ к реактивному состоянию
store.reactive.property = value;

// Получение состояния
const state = store.getState();

// Установка свойства
store.setProperty('key', value);

// Получение свойства
const value = store.getProperty('key');
```

## Плагины

Rellx поддерживает систему плагинов для расширения функциональности:

```typescript
import { StoreCore } from 'rellx';
import type { StorePlugin } from 'rellx';

const myPlugin: StorePlugin<MyState> = {
  onInit(store) {
    console.log('Plugin initialized');
  },

  onBeforeUpdate(newState, oldState) {
    // Можете модифицировать состояние перед обновлением
    return newState;
  },

  onAfterUpdate(newState, oldState) {
    console.log('State updated:', newState);
  },

  onSubscribe(listener) {
    // Дополнительная логика при подписке
    return () => {
      // Очистка при отписке
    };
  },

  onDestroy() {
    console.log('Plugin destroyed');
  }
};

const store = new StoreCore(initialState, [myPlugin]);
```

## DevTools

Rellx включает инструменты разработчика для отладки состояния:

```typescript
import { createFullStore } from 'rellx/full';
import { createDevToolsPlugin } from 'rellx/devtools';

const store = createFullStore(initialState);

const devTools = createDevToolsPlugin(store, {
  name: 'MyStore',
  enableTimeTravel: true,
  maxHistorySize: 50
});

// Подключение к DevTools серверу
devTools.connect('ws://localhost:8097');
```

Подробнее о DevTools смотрите в документации [rellx-devtools](rellx-devtools/README.md).

## Примеры использования

### Todo приложение

```typescript
import { createFullStore } from 'rellx/full';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface State {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
}

const store = createFullStore<State>({
  todos: [],
  filter: 'all'
});

// Действия
const addTodo = (text: string) => {
  store.setState((prev) => ({
    ...prev,
    todos: [
      ...prev.todos,
      { id: Date.now(), text, completed: false }
    ]
  }));
};

const toggleTodo = (id: number) => {
  store.setState((prev) => ({
    ...prev,
    todos: prev.todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  }));
};

const setFilter = (filter: State['filter']) => {
  store.setState((prev) => ({ ...prev, filter }));
};

// Подписка на изменения
store.subscribe((state) => {
  console.log('Todos updated:', state.todos);
  console.log('Filter:', state.filter);
});
```

### Счетчик с историей

```typescript
import { createReactiveStore } from 'rellx';

interface State {
  count: number;
  history: number[];
}

const store = createReactiveStore<State>({
  count: 0,
  history: []
});

store.subscribe((state) => {
  console.log(`Count: ${state.count}`);
  console.log(`History: ${state.history.join(', ')}`);
});

// Увеличение счетчика
store.reactive.count++;
store.reactive.history.push(store.reactive.count);
```

## Совместимость

- Node.js: 14+
- Браузеры: все современные браузеры (ES2020+)
- TypeScript: 4.5+

## Лицензия

Apache License 2.0

## Поддержка

Если у вас есть вопросы, предложения или вы нашли баг, пожалуйста, создайте issue в репозитории проекта.

## Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста, прочитайте руководство по контрибьюции перед отправкой pull request.
