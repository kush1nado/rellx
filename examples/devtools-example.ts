import { StoreCore } from '../src/core/storeCore';
import {
    createDevToolsPlugin,
    createAnalyticsPlugin,
    createPerformancePlugin
} from '../src/devtools/plugin';

// Определяем типы для нашего состояния
interface UserState {
    user: {
        id: string;
        name: string;
        email: string;
    } | null;
    isAuthenticated: boolean;
    preferences: {
        theme: 'light' | 'dark';
        language: string;
    };
}

interface UserAction {
    type: 'LOGIN' | 'LOGOUT' | 'UPDATE_PREFERENCES' | 'UPDATE_PROFILE';
    payload?: unknown;
}

// Создаем store
const userStore = new StoreCore<UserState>({
    user: null,
    isAuthenticated: false,
    preferences: {
        theme: 'light',
        language: 'en'
    }
});

// Создаем кастомный плагин для отслеживания пользовательских действий
const userTrackingPlugin = {
    id: 'user-tracking',
    name: 'User Tracking Plugin',
    version: '1.0.0',
    onStateChange: (state: UserState, action: any) => {
        if (action.type === 'LOGIN' && state.user) {
            console.log(`[User Tracking] User logged in: ${state.user.name} (${state.user.email})`);

            // Здесь можно отправить данные в аналитическую систему
            // analytics.track('user_login', { userId: state.user.id });
        }

        if (action.type === 'LOGOUT') {
            console.log('[User Tracking] User logged out');
        }

        if (action.type === 'UPDATE_PREFERENCES') {
            console.log(`[User Tracking] Preferences updated:`, state.preferences);
        }
    },
    onInit: (store: { getState(): UserState }) => {
        console.log('[User Tracking] Plugin initialized');
    },
    onDestroy: () => {
        console.log('[User Tracking] Plugin destroyed');
    }
};

// Создаем плагин для мониторинга производительности
const performanceMonitoringPlugin = {
    id: 'performance-monitoring',
    name: 'Performance Monitoring Plugin',
    version: '1.0.0',
    onStateChange: (state: UserState, action: any) => {
        // Отслеживаем медленные операции
        if (action.duration && action.duration > 100) {
            console.warn(`[Performance] Slow action detected: ${action.type} (${action.duration}ms)`);
        }

        // Отслеживаем частоту изменений состояния
        const changeRate = action.timestamp - (action.timestamp - 1000);
        if (changeRate > 10) {
            console.warn(`[Performance] High state change rate: ${changeRate} changes per second`);
        }
    }
};

// Создаем DevTools с кастомными плагинами
const devTools = createDevToolsPlugin<UserState, UserAction>(userStore, {
    name: 'UserStore',
    maxHistorySize: 100,
    enableTimeTravel: true,
    enableStateExport: true,
    plugins: [
        createAnalyticsPlugin<UserState, UserAction>({
            endpoint: 'https://analytics.example.com',
            apiKey: 'your-api-key',
            trackEvents: true,
            trackErrors: true
        }),
        createPerformancePlugin<UserState, UserAction>({
            threshold: 50,
            logSlowActions: true
        }),
        userTrackingPlugin as any,
        performanceMonitoringPlugin as any
    ]
});

// Подключаемся к DevTools
devTools.connect();

// Симулируем пользовательские действия
console.log('=== DevTools Example ===');

// Логин пользователя
userStore.setState(prev => ({
    ...prev,
    user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
    },
    isAuthenticated: true
}));

// Обновление предпочтений
userStore.setState(prev => ({
    ...prev,
    preferences: {
        ...prev.preferences,
        theme: 'dark',
        language: 'ru'
    }
}));

// Обновление профиля
userStore.setState(prev => ({
    ...prev,
    user: prev.user ? {
        ...prev.user,
        name: 'John Smith'
    } : null
}));

// Логаут
userStore.setState(prev => ({
    ...prev,
    user: null,
    isAuthenticated: false
}));

// Демонстрируем возможности DevTools
console.log('\n=== DevTools Features ===');

// Получаем статистику действий
const actionStats = devTools.getActionStats();
console.log('Action Statistics:', actionStats);

// Получаем частоту изменений состояния
const changeFrequency = devTools.getStateChangeFrequency();
console.log('State Change Frequency:', changeFrequency, 'changes per second');

// Экспортируем состояние
const exportedState = devTools.exportState();
console.log('Exported State Size:', exportedState.length, 'characters');

// Получаем историю состояний
const history = devTools.getStateHistory();
console.log('History Length:', history.states.length, 'states');

// Демонстрируем time travel
if (history.states.length > 0) {
    console.log('\n=== Time Travel Demo ===');

    // Путешествуем к первому состоянию
    devTools.timeTravel(0);
    console.log('Traveled to first state');

    // Путешествуем к последнему состоянию
    devTools.timeTravel(history.states.length - 1);
    console.log('Traveled to last state');
}

// Получаем список всех плагинов
const plugins = devTools.getAllPlugins();
console.log('\nRegistered Plugins:', plugins.map(p => p.name));

// Отключаем DevTools
setTimeout(() => {
    devTools.disconnect();
    console.log('\nDevTools disconnected');
}, 1000);

export { userStore, devTools }; 