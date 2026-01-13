import { useState, useCallback, useEffect } from 'react';

// Generic storage hook
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        setStoredValue(prev => {
            const newValue = value instanceof Function ? value(prev) : value;
            try {
                localStorage.setItem(key, JSON.stringify(newValue));
            } catch (e) {
                console.error('LocalStorage error:', e);
            }
            return newValue;
        });
    }, [key]);

    return [storedValue, setValue];
}

// Timer hook - updates every second
export function useTimer() {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return now;
}

// Format elapsed time
export function useElapsedTime(startTime: Date | string, now: Date) {
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const elapsedMs = now.getTime() - start.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);

    const hours = Math.floor(elapsedMinutes / 60);
    const mins = elapsedMinutes % 60;

    const formattedTime = hours > 0
        ? `${hours}sa ${mins}dk`
        : mins > 0
            ? `${mins}dk ${elapsedSeconds}sn`
            : `${elapsedSeconds}sn`;

    return {
        elapsedMs,
        elapsedMinutes,
        elapsedSeconds,
        hours,
        minutes: mins,
        formattedTime,
        isOverdue: elapsedMinutes >= 60,
        isCritical: elapsedMinutes >= 90,
        isReady: elapsedMinutes >= 45 && elapsedMinutes < 60
    };
}

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

// Modal state hook
export function useModal(initialState = false) {
    const [isOpen, setIsOpen] = useState(initialState);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    return { isOpen, open, close, toggle };
}

// Search/filter hook
export function useSearch<T>(items: T[], searchFields: (keyof T)[], debounceMs = 300) {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, debounceMs);

    const filteredItems = debouncedQuery
        ? items.filter(item =>
            searchFields.some(field => {
                const value = item[field];
                return typeof value === 'string' &&
                    value.toLowerCase().includes(debouncedQuery.toLowerCase());
            })
        )
        : items;

    return {
        query,
        setQuery,
        filteredItems,
        hasResults: filteredItems.length > 0,
        resultCount: filteredItems.length
    };
}

// Previous value hook
export function usePrevious<T>(value: T): T | undefined {
    const [current, setCurrent] = useState<T>(value);
    const [previous, setPrevious] = useState<T | undefined>();

    if (value !== current) {
        setPrevious(current);
        setCurrent(value);
    }

    return previous;
}

// Online/offline status hook
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

// Keyboard shortcut hook
export function useKeyboardShortcut(key: string, callback: () => void, modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const { ctrl = false, shift = false, alt = false } = modifiers;

            if (
                e.key.toLowerCase() === key.toLowerCase() &&
                e.ctrlKey === ctrl &&
                e.shiftKey === shift &&
                e.altKey === alt
            ) {
                e.preventDefault();
                callback();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [key, callback, modifiers]);
}
