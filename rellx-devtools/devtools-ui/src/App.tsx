import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const [isPaused, setIsPaused] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [pausedMessages, setPausedMessages] = useState<DevToolsMessage[]>([]);

  // useRef для отслеживания актуального состояния паузы
  const isPausedRef = useRef(isPaused);

  // Обновляем ref при изменении isPaused
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

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

        // Не переподключаемся если это нормальное закрытие или блокировка сервера
        const skipReconnect =
          event.code === 1000 ||
          event.reason === "Too many connections" ||
          event.reason === "Too frequent connections" ||
          event.reason === "Already connected";

        if (!skipReconnect) {
          setTimeout(() => {
            console.log("Attempting to reconnect...");
            connect();
          }, 5000); // Увеличена задержка до 5 секунд
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

  const handleMessage = useCallback(
    (message: DevToolsMessage) => {
      // Если на паузе, сохраняем сообщение в очередь
      if (isPausedRef.current && message.type === "UPDATE") {
        setPausedMessages((prev) => [...prev, message]);
        return;
      }

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

              // Только переключаемся на новое состояние, если пользователь следит за последним
              const isFollowingLatest =
                prev.currentIndex === prev.states.length - 1;
              const newIndex = isFollowingLatest
                ? newStates.length - 1
                : prev.currentIndex;

              // Обновляем текущее состояние только если следим за последним
              if (isFollowingLatest) {
                setCurrentState(message.payload.state);
              }

              return {
                states: newStates,
                actions: newActions,
                currentIndex: newIndex,
              };
            });
          }
          break;
      }
    },
    [] // Убираем isPaused из зависимостей, так как используем isPausedRef
  );

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

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const newPausedState = !prev;

      // Если возобновляем (было true, стало false) - обрабатываем приостановленные сообщения
      if (prev === true && newPausedState === false) {
        // Используем setTimeout чтобы обработка произошла после обновления состояния
        setTimeout(() => {
          setPausedMessages((messages) => {
            messages.forEach((msg) => handleMessage(msg));
            return [];
          });
        }, 0);
      }

      return newPausedState;
    });
  }, [handleMessage]);

  const clearPausedMessages = useCallback(() => {
    setPausedMessages([]);
  }, []);

  // Получаем уникальные типы действий для фильтра
  const actionTypes = useCallback(() => {
    const types = new Set(stateHistory.actions.map((a) => a.type));
    return ["ALL", ...Array.from(types)];
  }, [stateHistory.actions]);

  // Фильтруем действия
  const filteredActions = useCallback(() => {
    if (actionFilter === "ALL") {
      return stateHistory.actions;
    }
    return stateHistory.actions.filter((a) => a.type === actionFilter);
  }, [stateHistory.actions, actionFilter]);

  useEffect(() => {
    // Подключаемся только один раз при монтировании
    connect();

    return () => {
      // Отключаемся при размонтировании
      if (ws) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Пустой массив зависимостей - выполняется только один раз

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
            <div className="section-header">
              <h3>
                Actions ({filteredActions().length}/
                {stateHistory.actions.length})
              </h3>
              <div className="controls">
                <button
                  onClick={togglePause}
                  className={`pause-button ${isPaused ? "paused" : ""}`}
                  title={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? "▶" : "⏸"}
                </button>
                {pausedMessages.length > 0 && (
                  <span
                    className="paused-count"
                    title={`${pausedMessages.length} messages paused`}
                  >
                    ({pausedMessages.length})
                  </span>
                )}
              </div>
            </div>

            <div className="filter-controls">
              <label htmlFor="action-filter">Filter:</label>
              <select
                id="action-filter"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                {actionTypes().map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {isPaused && pausedMessages.length > 0 && (
              <div className="paused-info">
                <div className="paused-hint">
                  Нажмите ▶ чтобы обработать {pausedMessages.length} сообщений
                </div>
                <button
                  onClick={clearPausedMessages}
                  className="clear-paused-button"
                >
                  Удалить приостановленные
                </button>
              </div>
            )}

            <div className="actions-list">
              {filteredActions().map((action, index) => {
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
