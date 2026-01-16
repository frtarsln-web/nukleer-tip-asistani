import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StaffUser, UserRole } from '../types';

interface AuthState {
    currentUser: StaffUser | null;
    staffUsers: StaffUser[];
    isWorkspaceActive: boolean;

    // Actions
    login: (user: StaffUser, password?: string) => boolean;
    logout: () => void;
    setWorkspaceActive: (active: boolean) => void;
    addStaffUser: (user: StaffUser) => void;
    updateStaffUser: (userId: string, updates: Partial<StaffUser>) => void;
    removeStaffUser: (userId: string) => void;
    validatePassword: (userId: string, password: string) => boolean;
    isFirstUser: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            currentUser: null,
            staffUsers: [],
            isWorkspaceActive: false,

            login: (user, password) => {
                const state = get();
                const existingUser = state.staffUsers.find(u => u.id === user.id);

                // Eğer şifreli kullanıcıysa şifre kontrolü yap
                if (existingUser?.password) {
                    if (!password || existingUser.password !== password) {
                        return false;
                    }
                }

                set({ currentUser: existingUser || user, isWorkspaceActive: true });
                return true;
            },

            logout: () => set({ currentUser: null, isWorkspaceActive: false }),

            setWorkspaceActive: (active) => set({ isWorkspaceActive: active }),

            addStaffUser: (user) =>
                set((state) => ({ staffUsers: [...state.staffUsers, user] })),

            updateStaffUser: (userId, updates) =>
                set((state) => ({
                    staffUsers: state.staffUsers.map((u) =>
                        u.id === userId ? { ...u, ...updates } : u
                    ),
                    currentUser: state.currentUser?.id === userId
                        ? { ...state.currentUser, ...updates }
                        : state.currentUser
                })),

            removeStaffUser: (userId) =>
                set((state) => ({
                    staffUsers: state.staffUsers.filter((u) => u.id !== userId),
                })),

            validatePassword: (userId, password) => {
                const state = get();
                const user = state.staffUsers.find(u => u.id === userId);
                if (!user?.password) return true;
                return user.password === password;
            },

            isFirstUser: () => {
                const state = get();
                return state.staffUsers.length === 0;
            },
        }),
        {
            name: 'nt_auth_store',
        }
    )
);
