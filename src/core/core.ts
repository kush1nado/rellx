type Listener<T> = (state: T) => void;

export class Core<T> {
    protected state: T;
    private listeners: Listener<T>[] = [];

    constructor(initialState: T) {
        this.state = initialState;
    }

    getState(): T {
        return this.state;
    }

    setState(updater: (prevState: T) => T): void {
        const newState = updater(this.state);
        if (newState !== this.state) {
            this.state = newState;
            this.notifyListeners();
        }
    }

    subscribe(listener: Listener<T>): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    protected notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.state));
    }
}