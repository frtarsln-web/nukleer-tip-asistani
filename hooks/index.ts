import React, { useState, useEffect, useCallback } from 'react';

/**
 * Type-safe localStorage hook with automatic serialization/deserialization
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
    // State to store our value
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Return a wrapped version of useState's setter function that persists the new value to localStorage.
    const setValue = (value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Save state
            setStoredValue(valueToStore);

            // Save to local storage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
}

/**
 * Hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook to detect clicks outside of a component
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
    ref: React.RefObject<T>,
    handler: (event: MouseEvent | TouchEvent) => void
) {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
}

/**
 * Hook to detect key press
 */
export function useKeyPress(targetKey: string, handler: () => void, modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
}) {
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            const modifiersMatch =
                (!modifiers?.ctrl || event.ctrlKey || event.metaKey) &&
                (!modifiers?.shift || event.shiftKey) &&
                (!modifiers?.alt || event.altKey);

            if (event.key === targetKey && modifiersMatch) {
                event.preventDefault();
                handler();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [targetKey, handler, modifiers]);
}

/**
 * Timer hook - updates every second
 */
export function useTimer() {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return now;
}

/**
 * Format elapsed time helper
 */
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

/**
 * Modal state hook
 */
export function useModal(initialState = false) {
    const [isOpen, setIsOpen] = useState(initialState);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    return { isOpen, open, close, toggle };
}

/**
 * Search/filter hook with debounce
 */
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

// Re-export notification sound hooks
export { useNotificationSound, useDesktopNotifications } from './useNotificationSound';
