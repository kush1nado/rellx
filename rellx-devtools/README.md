# Rellx DevTools

DevTools for Rellx State Manager - powerful tools for debugging and monitoring application state.

## Features

- **Time Travel Debugging** - navigate through state history
- **Action History** - complete history of actions with timestamps
- **Real-time State Monitoring** - real-time state monitoring
- **WebSocket Communication** - fast communication with application
- **Modern UI** - modern DevTools-style interface

## Project Structure

```
rellx-devtools/
├── devtools-ui/              # React DevTools UI
├── extension/                # Browser Extension for Chrome/Edge
├── examples/                 # Usage examples
├── scripts/                  # Server scripts and utilities
└── package.json             # Project configuration
```

## Installation and Setup

### Install Dependencies

```bash
npm install
```

### Run DevTools UI

```bash
npm run dev
```

DevTools UI will be available at: http://localhost:3000

### Run Demo Server

```bash
# Simple test server
npm run start-simple

# Full demo with realistic data
npm run start-server
```

## Browser Extension

Rellx DevTools is available as a Chrome/Edge extension that integrates into browser DevTools.

### Installing the Extension

1. **Build the extension:**

```bash
# Generate icons (first time only)
npm run generate-icons

# Build extension
npm run build:extension
```

2. **Load into Chrome/Edge:**

   - Open browser and navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `extension` folder in the `rellx-devtools` directory

3. **Use the extension:**

   - Open any web page
   - Open DevTools (F12)
   - You will see a new "Rellx" tab
   - Click on it to open DevTools UI

### Updating the Extension

After code changes:

```bash
npm run build:extension
```

Then in `chrome://extensions/` click the refresh button (↻) on the Rellx DevTools extension.

## Usage

### 1. Start DevTools Server

```bash
node scripts/start-devtools-server.cjs
```

### 2. Open DevTools UI

**Option A: Via Web Interface**

```bash
cd devtools-ui
npm start
```

Open browser: http://localhost:3000

**Option B: Via Browser Extension (recommended)**

The extension is already installed (see [Browser Extension](#browser-extension) section above). Simply open browser DevTools (F12) and go to the "Rellx" tab.

### 3. Integration with Your Application

```javascript
// In your application
import { createStore } from "rellx";

const store = createStore({
  // your configuration
});

// Connect to DevTools (optional)
if (process.env.NODE_ENV === "development") {
  store.connectToDevTools("ws://localhost:8097");
}
```

## Key Features

### Time Travel

- Navigate through state history
- Replay actions
- Compare states

### Action History

- Complete history of all actions
- Timestamps
- Action details

### State Monitoring

- Current state in real-time
- JSON viewer
- Statistics

## WebSocket Protocol

DevTools uses a simple WebSocket protocol:

### Messages from server:

```javascript
// Initialization
{
  type: "INIT",
  payload: { state: {...} },
  timestamp: 1234567890,
  id: "init_1234567890"
}

// State update
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

## Testing

```bash
npm test
```

## License

MIT
