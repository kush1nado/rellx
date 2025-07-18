import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

interface DevToolsMessage {
  type: string;
  payload: {
    state?: any;
    action?: any;
    storeName?: string;
    storeId?: string;
  };
  timestamp: number;
  id: string;
  storeName?: string;
  storeId?: string;
}

interface StateHistory {
  states: Array<{
    state: any;
    timestamp: number;
    id: string;
    actionId?: string;
  }>;
  actions: Array<{
    type: string;
    timestamp: number;
    id: string;
    name?: string;
  }>;
  currentIndex: number;
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentState, setCurrentState] = useState<any>(null);
  const [stateHistory, setStateHistory] = useState<StateHistory>({
    states: [],
    actions: [],
    currentIndex: -1,
  });
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
    }

    if (ws && ws.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const websocket = new WebSocket("ws://localhost:8097");

      websocket.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log("Connected to DevTools server");
      };

      websocket.onmessage = (event) => {
        try {
          const message: DevToolsMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error("Failed to parse message:", err);
        }
      };

      websocket.onclose = (event) => {
        setIsConnected(false);
        console.log(
          "Disconnected from DevTools server",
          event.code,
          event.reason
        );

        if (event.code !== 1000 && event.reason !== "Too many connections") {
          setTimeout(() => {
            console.log("Attempting to reconnect...");
            connect();
          }, 3000);
        }
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      setWs(websocket);
    } catch (err) {
      setError("Failed to connect to DevTools server");
      console.error("Connection error:", err);
    }
  }, [ws]);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
    }
  }, [ws]);

  const handleMessage = useCallback((message: DevToolsMessage) => {
    switch (message.type) {
      case "INIT":
        if (message.payload.state) {
          setCurrentState(message.payload.state);
          setStateHistory((prev) => ({
            ...prev,
            states: [
              {
                state: message.payload.state,
                timestamp: message.timestamp,
                id: message.id,
              },
            ],
            currentIndex: 0,
          }));
        }
        break;

      case "UPDATE":
        if (message.payload.state) {
          setCurrentState(message.payload.state);
          setStateHistory((prev) => {
            const isDuplicate = prev.actions.some(
              (action) => action.id === message.payload.action?.id
            );

            if (isDuplicate) {
              return prev;
            }

            const newState = {
              state: message.payload.state,
              timestamp: message.timestamp,
              id: message.id,
              actionId: message.payload.action?.id,
            };

            const newStates = [...prev.states, newState];
            const newActions = message.payload.action
              ? [...prev.actions, message.payload.action]
              : prev.actions;

            return {
              states: newStates,
              actions: newActions,
              currentIndex: newStates.length - 1,
            };
          });
        }
        break;
    }
  }, []);

  const timeTravel = useCallback(
    (index: number) => {
      if (index >= 0 && index < stateHistory.states.length) {
        setCurrentState(stateHistory.states[index].state);
        setStateHistory((prev) => ({
          ...prev,
          currentIndex: index,
        }));
      }
    },
    [stateHistory.states]
  );

  const jumpToAction = useCallback(
    (actionId: string) => {
      const stateIndex = stateHistory.states.findIndex(
        (s) => s.actionId === actionId
      );
      if (stateIndex !== -1) {
        timeTravel(stateIndex);
      } else {
        console.log("Action state not yet available");
      }
    },
    [stateHistory.states, timeTravel]
  );

  const clearHistory = useCallback(() => {
    setStateHistory({
      states: [],
      actions: [],
      currentIndex: -1,
    });
    setCurrentState(null);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Rellx DevTools</h1>
        <div className="connection-status">
          <span
            className={`status ${isConnected ? "connected" : "disconnected"}`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          {error && <span className="error">{error}</span>}
          {!isConnected && (
            <button onClick={connect} className="reconnect-button">
              Reconnect
            </button>
          )}
        </div>
      </header>

      <div className="devtools-container">
        <div className="sidebar">
          <div className="section">
            <h3>Actions ({stateHistory.actions.length})</h3>
            <div className="actions-list">
              {stateHistory.actions.map((action, index) => {
                const stateIndex = stateHistory.states.findIndex(
                  (s) => s.actionId === action.id
                );

                return (
                  <div
                    key={`${action.id}-${action.timestamp}`}
                    className={`action-item ${
                      stateIndex === -1 ? "pending" : ""
                    } ${
                      stateHistory.currentIndex === stateIndex ? "active" : ""
                    }`}
                    onClick={() => jumpToAction(action.id)}
                  >
                    <div className="action-type">
                      {action.type}
                      {stateIndex === -1 && " (pending)"}
                    </div>
                    <div className="action-time">
                      {new Date(action.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="section">
            <h3>Time Travel</h3>
            <div className="time-travel-controls">
              <button
                onClick={() => timeTravel(0)}
                disabled={stateHistory.states.length === 0}
              >
                First
              </button>
              <button
                onClick={() =>
                  timeTravel(Math.max(0, stateHistory.currentIndex - 1))
                }
                disabled={stateHistory.currentIndex <= 0}
              >
                Previous
              </button>
              <button
                onClick={() =>
                  timeTravel(
                    Math.min(
                      stateHistory.states.length - 1,
                      stateHistory.currentIndex + 1
                    )
                  )
                }
                disabled={
                  stateHistory.currentIndex >= stateHistory.states.length - 1
                }
              >
                Next
              </button>
              <button
                onClick={() => timeTravel(stateHistory.states.length - 1)}
                disabled={stateHistory.states.length === 0}
              >
                Last
              </button>
            </div>
            <button onClick={clearHistory} className="clear-button">
              Clear History
            </button>
          </div>
        </div>

        <div className="main-content">
          <div className="section">
            <h3>Current State</h3>
            <div className="state-display">
              {currentState ? (
                <pre>{JSON.stringify(currentState, null, 2)}</pre>
              ) : (
                <p>No state available</p>
              )}
            </div>
          </div>

          <div className="section">
            <h3>Statistics</h3>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-label">States:</span>
                <span className="stat-value">{stateHistory.states.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Actions:</span>
                <span className="stat-value">
                  {stateHistory.actions.length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Current Index:</span>
                <span className="stat-value">{stateHistory.currentIndex}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
