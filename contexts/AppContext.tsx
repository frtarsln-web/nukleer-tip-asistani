import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { StaffUser, UserRole, DoseUnit, AppNotification, NotificationType } from '../types';

// Storage keys
const STORAGE_KEYS = {
    CURRENT_USER: 'nt_current_user',
    STAFF_USERS: 'nt_staff_users',
    GLOBAL_UNIT: 'nt_unit',
    NOTIFICATIONS: 'nt_notifications'
};

// Helper function
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return defaultValue;
        return JSON.parse(stored);
    } catch {
        return defaultValue;
    }
};

const saveToStorage = <T,>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Storage save error:', e);
    }
};

// Default staff users
const DEFAULT_STAFF_USERS: StaffUser[] = [
    { id: 'tech1', name: 'Tekniker 1', role: UserRole.TECHNICIAN, createdAt: new Date(), isActive: true },
    { id: 'phys1', name: 'Fizikçi 1', role: UserRole.PHYSICIST, createdAt: new Date(), isActive: true },
    { id: 'nurse1', name: 'Hemşire 1', role: UserRole.NURSE, createdAt: new Date(), isActive: true },
    { id: 'doc1', name: 'Doktor Test', role: UserRole.DOCTOR, createdAt: new Date(), isActive: true },
];

interface AppContextType {
    // User management
    currentUser: StaffUser | null;
    staffUsers: StaffUser[];
    login: (user: StaffUser) => void;
    logout: () => void;
    addStaffUser: (name: string, role: UserRole) => void;

    // Unit management
    unit: DoseUnit;
    setUnit: (unit: DoseUnit) => void;

    // Notifications
    notifications: AppNotification[];
    addNotification: (message: string, type: NotificationType, description?: string) => void;
    markAsRead: (id: string) => void;
    clearNotifications: () => void;

    // Theme
    isDarkMode: boolean;
    toggleTheme: () => void;

    // Time
    now: Date;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    // User state
    const [currentUser, setCurrentUser] = useState<StaffUser | null>(() =>
        loadFromStorage(STORAGE_KEYS.CURRENT_USER, null)
    );
    const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() =>
        loadFromStorage(STORAGE_KEYS.STAFF_USERS, DEFAULT_STAFF_USERS)
    );

    // Unit state
    const [unit, setUnitState] = useState<DoseUnit>(() =>
        loadFromStorage(STORAGE_KEYS.GLOBAL_UNIT, DoseUnit.MCI)
    );

    // Notifications
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    // Theme
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true;
    });

    // Current time (updates every second)
    const [now, setNow] = useState(new Date());

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Apply theme
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    // User functions
    const login = useCallback((user: StaffUser) => {
        setCurrentUser(user);
        saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
    }, []);

    const logout = useCallback(() => {
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }, []);

    const addStaffUser = useCallback((name: string, role: UserRole) => {
        const newUser: StaffUser = {
            id: `user_${Date.now()}`,
            name,
            role,
            createdAt: new Date(),
            isActive: true
        };
        setStaffUsers(prev => {
            const updated = [...prev, newUser];
            saveToStorage(STORAGE_KEYS.STAFF_USERS, updated);
            return updated;
        });
    }, []);

    // Unit functions
    const setUnit = useCallback((newUnit: DoseUnit) => {
        setUnitState(newUnit);
        saveToStorage(STORAGE_KEYS.GLOBAL_UNIT, newUnit);
    }, []);

    // Notification functions
    const addNotification = useCallback((message: string, type: NotificationType, description?: string) => {
        const notification: AppNotification = {
            id: `notif_${Date.now()}`,
            type,
            message,
            description,
            timestamp: new Date(),
            read: false,
            autoClose: type !== 'error'
        };
        setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Theme
    const toggleTheme = useCallback(() => {
        setIsDarkMode(prev => !prev);
    }, []);

    const value: AppContextType = {
        currentUser,
        staffUsers,
        login,
        logout,
        addStaffUser,
        unit,
        setUnit,
        notifications,
        addNotification,
        markAsRead,
        clearNotifications,
        isDarkMode,
        toggleTheme,
        now
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContext;
