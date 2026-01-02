# Rellx DevTools UI

Web interface for debugging Rellx store state in real-time.

## Features

- **Real-time state tracking**
- **Time Travel** - navigate through state history
- **Statistics** - action and change counts
- **Action navigation** - click on action to jump to state
- **Modern dark interface**
- **Responsive design**

## Installation and Setup

1. Install dependencies:

```bash
cd devtools-ui
npm install
```

2. Start DevTools UI:

```bash
npm start
```

3. Open browser: http://localhost:3000

## How to Use

1. **Run your code** with DevTools connected
2. **Open DevTools UI** in browser
3. **Observe** state changes in real-time
4. **Use Time Travel** for debugging

## Interface

### Left Panel

- **Actions** - list of all actions with timestamps
- **Time Travel** - buttons for history navigation

### Right Panel

- **Current State** - current state in JSON format
- **Statistics** - action and change statistics

## Connecting to Your Code

DevTools UI automatically connects to WebSocket server at `ws://localhost:8097`.

Make sure your code creates a DevTools server:

```typescript
import { createDevToolsPlugin } from "rellx/devtools";

const devTools = createDevToolsPlugin(store, {
  name: "MyStore",
  enableTimeTravel: true,
});

devTools.connect(); // Connects to ws://localhost:8097
```

## Keyboard Shortcuts

- `Ctrl+Shift+D` - open DevTools (if embedded in application)
- `Escape` - close DevTools

## Development

```bash
# Run in development mode
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
devtools-ui/
├── src/
│   ├── App.tsx          # Main component
│   ├── App.css          # Styles
│   ├── index.tsx        # Entry point
│   └── index.css        # Base styles
├── public/
│   └── index.html       # HTML template
└── package.json         # Dependencies
```
