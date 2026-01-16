import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppNotification } from '../types';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
    // Theme
    theme: ThemeMode;

    // Notifications
    notifications: AppNotification[];

    // Sound settings
    soundEnabled: boolean;

    // Mobile menu state
    mobileMenuOpen: boolean;

    // Search state
    searchQuery: string;
    searchOpen: boolean;

    // Actions
    setTheme: (theme: ThemeMode) => void;

    addNotification: (notification: AppNotification) => void;
    removeNotification: (id: string) => void;
    markNotificationRead: (id: string) => void;
    clearNotifications: () => void;

    setSoundEnabled: (enabled: boolean) => void;
    toggleSound: () => void;

    setMobileMenuOpen: (open: boolean) => void;
    toggleMobileMenu: () => void;

    setSearchQuery: (query: string) => void;
    setSearchOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            theme: 'dark',
            notifications: [],
            soundEnabled: true,
            mobileMenuOpen: false,
            searchQuery: '',
            searchOpen: false,

            setTheme: (theme) => {
                // Apply theme to document
                const applyTheme = (isDark: boolean) => {
                    if (isDark) {
                        document.documentElement.classList.remove('light');
                        document.documentElement.classList.add('dark');
                        document.documentElement.style.colorScheme = 'dark';
                    } else {
                        document.documentElement.classList.remove('dark');
                        document.documentElement.classList.add('light');
                        document.documentElement.style.colorScheme = 'light';
                    }
                };

                if (theme === 'dark') {
                    applyTheme(true);
                } else if (theme === 'light') {
                    applyTheme(false);
                } else {
                    applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
                }

                set({ theme });
            },

            addNotification: (notification) =>
                set((state) => ({
                    notifications: [notification, ...state.notifications],
                })),

            removeNotification: (id) =>
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                })),

            markNotificationRead: (id) =>
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    ),
                })),

            clearNotifications: () => set({ notifications: [] }),

            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

            toggleSound: () =>
                set((state) => ({ soundEnabled: !state.soundEnabled })),

            setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

            toggleMobileMenu: () =>
                set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

            setSearchQuery: (query) => set({ searchQuery: query }),

            setSearchOpen: (open) => set({ searchOpen: open }),
        }),
        {
            name: 'nt_app_store',
            partialize: (state) => ({
                theme: state.theme,
                soundEnabled: state.soundEnabled,
            }),
        }
    )
);
