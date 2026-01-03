# Rellx

Universal state manager for JavaScript and TypeScript applications. Rellx provides a simple and powerful API for state management with support for reactivity, middleware, and plugins.

## What is it?

Rellx is a state management library that solves the problem of data synchronization between different parts of an application. It's built with simplicity, performance, and flexibility in mind.

The library offers three modes of operation:
- **Light** - minimalistic version with basic functionality
- **Full** - full version with middleware support
- **Reactive** - reactive version with automatic change tracking

## Key Features

- **Simple API** - intuitive interface for working with state
- **TypeScript support** - full type definitions out of the box
- **Reactivity** - automatic tracking of nested object changes
- **Middleware** - extensibility through middleware system
- **Plugins** - support for custom plugins to extend functionality
- **Small size** - lightweight library without unnecessary dependencies
- **Universal** - works in browser and Node.js

## Installation

```bash
npm install rellx
```

or

```bash
yarn add rellx
```

or

```bash
pnpm add rellx
```

## Quick Start

### Light Version

The simplest version for basic state management:

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

// Subscribe to changes
const unsubscribe = store.subscribe((state) => {
  console.log('State changed:', state);
});

// Update state
store.setState((prev) => ({
  ...prev,
  count: prev.count + 1
}));

// Get current state
const currentState = store.getState();

// Unsubscribe
unsubscribe();
```

### Full Version with Middleware

Version with middleware support for more complex scenarios:

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

// Add middleware
store.use(loggerMiddleware);

// Create custom middleware
store.use((store) => (next) => (updater) => {
  console.log('Before update:', store.getState());
  next(updater);
  console.log('After update:', store.getState());
});

// Usage
store.setState((prev) => ({
  ...prev,
  todos: [...prev.todos, { id: 1, text: 'New todo', completed: false }]
}));
```

### Reactive Version

Reactive version with automatic change tracking:

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

// Subscribe to changes
store.subscribe((state) => {
  console.log('State updated:', state);
});

// Direct property changes - changes are tracked automatically
store.reactive.counter = 10;
store.reactive.user.name = 'Jane';
store.reactive.user.preferences.theme = 'dark';

// All changes automatically trigger subscribers
```

## API

### StoreCore

Base class for all store versions.

#### Methods

- `getState(): T` - get current state
- `setState(updater: (prevState: T) => T): void` - update state
- `subscribe(listener: (state: T) => void): () => void` - subscribe to changes, returns unsubscribe function
- `destroy(): void` - destroy store and clear all subscriptions

### Light Store

Simple version without additional features.

```typescript
import { createLightStore } from 'rellx';

const store = createLightStore(initialState);
```

### Full Store

Version with middleware support.

```typescript
import { createFullStore } from 'rellx/full';

const store = createFullStore(initialState);

// Add middleware
store.use(middleware);
```

### Reactive Store

Reactive version with automatic tracking.

```typescript
import { createReactiveStore } from 'rellx';

const store = createReactiveStore(initialState);

// Access reactive state
store.reactive.property = value;

// Get state
const state = store.getState();

// Set property
store.setProperty('key', value);

// Get property
const value = store.getProperty('key');
```

## Plugins

Rellx supports a plugin system for extending functionality:

```typescript
import { StoreCore } from 'rellx';
import type { StorePlugin } from 'rellx';

const myPlugin: StorePlugin<MyState> = {
  onInit(store) {
    console.log('Plugin initialized');
  },

  onBeforeUpdate(newState, oldState) {
    // You can modify state before update
    return newState;
  },

  onAfterUpdate(newState, oldState) {
    console.log('State updated:', newState);
  },

  onSubscribe(listener) {
    // Additional logic on subscribe
    return () => {
      // Cleanup on unsubscribe
    };
  },

  onDestroy() {
    console.log('Plugin destroyed');
  }
};

const store = new StoreCore(initialState, [myPlugin]);
```

## DevTools

Rellx DevTools is available as a separate package for state debugging:

```bash
npm install @rellx/devtools --save-dev
```

```typescript
import { createFullStore } from 'rellx/full';
import { createDevToolsPlugin } from '@rellx/devtools';

const store = createFullStore(initialState);

const devTools = createDevToolsPlugin(store, {
  name: 'MyStore',
  enableTimeTravel: true,
  maxHistorySize: 50
});

// Connect to DevTools server
devTools.connect('ws://localhost:8097');
```

For more information about DevTools, see the [@rellx/devtools](../rellx-devtools/README.md) documentation.

## Framework Integration

### React

```typescript
import React, { useEffect, useState } from 'react';
import { createFullStore } from 'rellx/full';

// Create store
const store = createFullStore({
  count: 0,
  todos: []
});

// Custom hook
function useStore<T>(store: ReturnType<typeof createFullStore<T>>) {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [store]);

  return [state, store.setState.bind(store)] as const;
}

// Component
function Counter() {
  const [state, setState] = useStore(store);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => setState(prev => ({ ...prev, count: prev.count + 1 }))}>
        Increment
      </button>
    </div>
  );
}
```

### Vue 3

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { createFullStore } from 'rellx/full';

// Create store
const store = createFullStore({
  count: 0,
  todos: []
});

// Composable
function useStore<T>(store: ReturnType<typeof createFullStore<T>>) {
  const state = ref(store.getState());

  let unsubscribe: (() => void) | null = null;

  onMounted(() => {
    unsubscribe = store.subscribe((newState) => {
      state.value = newState;
    });
  });

  onUnmounted(() => {
    unsubscribe?.();
  });

  return {
    state,
    setState: store.setState.bind(store)
  };
}

// Component
export default {
  setup() {
    const { state, setState } = useStore(store);

    const increment = () => {
      setState(prev => ({ ...prev, count: prev.count + 1 }));
    };

    return {
      state,
      increment
    };
  },
  template: `
    <div>
      <p>Count: {{ state.count }}</p>
      <button @click="increment">Increment</button>
    </div>
  `
};
```

### Angular

```typescript
import { Injectable, Component, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { createFullStore } from 'rellx/full';

// Service
@Injectable({ providedIn: 'root' })
export class StoreService {
  private store = createFullStore({
    count: 0,
    todos: []
  });

  private stateSubject = new BehaviorSubject(this.store.getState());
  public state$: Observable<typeof this.store.getState> = this.stateSubject.asObservable();

  constructor() {
    this.store.subscribe((state) => {
      this.stateSubject.next(state);
    });
  }

  getState() {
    return this.store.getState();
  }

  setState(updater: any) {
    this.store.setState(updater);
  }
}

// Component
@Component({
  selector: 'app-counter',
  template: `
    <div>
      <p>Count: {{ state.count }}</p>
      <button (click)="increment()">Increment</button>
    </div>
  `
})
export class CounterComponent implements OnDestroy {
  state: any;
  private subscription: any;

  constructor(private storeService: StoreService) {
    this.subscription = this.storeService.state$.subscribe(state => {
      this.state = state;
    });
  }

  increment() {
    this.storeService.setState((prev: any) => ({
      ...prev,
      count: prev.count + 1
    }));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
```

### Svelte

```javascript
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { createFullStore } from 'rellx/full';

  // Create Rellx store
  const rellxStore = createFullStore({
    count: 0,
    todos: []
  });

  // Create Svelte store wrapper
  const stateStore = writable(rellxStore.getState());

  let unsubscribe: (() => void) | null = null;

  onMount(() => {
    unsubscribe = rellxStore.subscribe((state) => {
      stateStore.set(state);
    });
  });

  onDestroy(() => {
    unsubscribe?.();
  });

  function increment() {
    rellxStore.setState(prev => ({
      ...prev,
      count: prev.count + 1
    }));
  }
</script>

<div>
  <p>Count: {$stateStore.count}</p>
  <button on:click={increment}>Increment</button>
</div>
```

### Vanilla JavaScript

```javascript
import { createFullStore } from 'rellx/full';

// Create store
const store = createFullStore({
  count: 0,
  todos: []
});

// Subscribe to changes
store.subscribe((state) => {
  // Update UI when state changes
  document.getElementById('count').textContent = state.count;
  renderTodos(state.todos);
});

// Initial render
document.getElementById('count').textContent = store.getState().count;

// Event handlers
document.getElementById('increment').addEventListener('click', () => {
  store.setState(prev => ({
    ...prev,
    count: prev.count + 1
  }));
});

function renderTodos(todos) {
  const container = document.getElementById('todos');
  container.innerHTML = todos.map(todo => `
    <div>${todo.text}</div>
  `).join('');
}
```

## Usage Examples

### Todo Application

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

// Actions
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

// Subscribe to changes
store.subscribe((state) => {
  console.log('Todos updated:', state.todos);
  console.log('Filter:', state.filter);
});
```

### Counter with History

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

// Increment counter
store.reactive.count++;
store.reactive.history.push(store.reactive.count);
```

## Compatibility

- Node.js: 14+
- Browsers: all modern browsers (ES2020+)
- TypeScript: 4.5+

## License

Apache License 2.0

## Support

If you have questions, suggestions, or found a bug, please create an issue in the project repository.

## Contributing

We welcome contributions to the project! Please read the contribution guide before submitting a pull request.
