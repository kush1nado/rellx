# Rellx DevTools

Powerful DevTools system for Rellx with support for custom plugins, time travel, and analytics.

## Features

- **Time Travel** - navigate through state history
- **Custom plugins** - create your own plugins
- **Analytics** - track actions and performance
- **Export/Import** - save and load state
- **WebSocket** - real-time debugging
- **TypeScript** - full type definitions

## Installation

```bash
npm install rellx
```

## Basic Usage

```typescript
import { StoreCore } from "rellx";
import { createDevToolsPlugin } from "rellx/devtools";

// Create store
const store = new StoreCore({ count: 0 });

// Create DevTools
const devTools = createDevToolsPlugin(store, {
  name: "MyStore",
  maxHistorySize: 50,
  enableTimeTravel: true,
});

// Connect
devTools.connect();
```

## Custom Plugins

### Creating a Plugin

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

// Register plugin
devTools.registerPlugin(myPlugin);
```

### Built-in Plugins

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

## Time Travel

```typescript
// Jump to specific state
devTools.timeTravel(0);

// Jump to specific action
devTools.jumpToAction("action-id");

// Jump to specific state
devTools.jumpToState("state-id");
```

## Analytics

```typescript
// Action statistics
const stats = devTools.getActionStats();
console.log(stats); // { 'STATE_UPDATE': 5, 'CUSTOM_ACTION': 2 }

// State change frequency
const frequency = devTools.getStateChangeFrequency();
console.log(frequency); // 2.5 (changes per second)

// State history
const history = devTools.getStateHistory();
console.log(history.states.length); // number of states
```

## Export/Import

```typescript
// Export state
const exported = devTools.exportState();
localStorage.setItem("rellx-state", exported);

// Import state
const imported = localStorage.getItem("rellx-state");
if (imported) {
  devTools.importState(imported);
}
```

## WebSocket API

### Connecting to DevTools UI

```typescript
// Connect to DevTools server
devTools.connect("ws://localhost:8097");

// Disconnect
devTools.disconnect();
```

### Sending Custom Messages

```typescript
// Send message to plugin
devTools.sendCustomPluginMessage("my-plugin", "CUSTOM_EVENT", {
  data: "some data",
});
```

## Testing

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

## API Reference

### DevToolsPluginManager

#### Methods

- `connect(url?: string)` - connect to DevTools
- `disconnect()` - disconnect
- `registerPlugin(plugin)` - register plugin
- `unregisterPlugin(pluginId)` - remove plugin
- `timeTravel(index)` - time travel
- `jumpToAction(actionId)` - jump to action
- `jumpToState(stateId)` - jump to state
- `exportState()` - export state
- `importState(data)` - import state
- `getActionStats()` - action statistics
- `getStateChangeFrequency()` - change frequency
- `getStateHistory()` - state history
- `clearHistory()` - clear history

#### Configuration

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

## Examples

### Logging Plugin

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

### Performance Monitoring Plugin

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

### Analytics Plugin

```typescript
const analyticsPlugin: DevToolsPlugin<MyState, MyAction> = {
  id: "analytics",
  name: "Analytics Plugin",
  version: "1.0.0",

  onStateChange: (state, action) => {
    // Send to Google Analytics
    gtag("event", "state_change", {
      action_type: action.type,
      state_size: JSON.stringify(state).length,
    });
  },
};
```

## Configuration

### TypeScript

```typescript
// Type definitions
interface AppState {
  user: User | null;
  settings: Settings;
}

interface AppAction {
  type: "LOGIN" | "LOGOUT" | "UPDATE_SETTINGS";
  payload?: unknown;
}

// Create DevTools with types
const devTools = createDevToolsPlugin<AppState, AppAction>(store, {
  name: "AppStore",
  plugins: [
    createAnalyticsPlugin<AppState, AppAction>({
      trackEvents: true,
    }),
  ],
});
```

## Performance

- **Lazy loading** - plugins load only when needed
- **History limiting** - automatic removal of old states
- **WebSocket optimization** - message batching
- **Memory management** - automatic resource cleanup

## Security

- **Data validation** - validate incoming messages
- **Plugin isolation** - plugins cannot affect each other
- **Access restrictions** - plugins have access only to their own data

## Community

- **GitHub Issues** - for bugs and suggestions
- **Discussions** - for discussions
- **Contributing** - for contributing to the project

## License

MIT License
