import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StaffUser, UserRole } from '../types';

interface AuthState {
    currentUser: StaffUser | null;
    staffUsers: StaffUser[];
    isWorkspaceActive: boolean;

    // Actions
    login: (user: StaffUser) => void;
    logout: () => void;
    setWorkspaceActive: (active: boolean) => void;
    addStaffUser: (user: StaffUser) => void;
    removeStaffUser: (userId: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            currentUser: null,
            staffUsers: [],
            isWorkspaceActive: false,

            login: (user) => set({ currentUser: user, isWorkspaceActive: true }),

            logout: () => set({ currentUser: null, isWorkspaceActive: false }),

            setWorkspaceActive: (active) => set({ isWorkspaceActive: active }),

            addStaffUser: (user) =>
                set((state) => ({ staffUsers: [...state.staffUsers, user] })),

            removeStaffUser: (userId) =>
                set((state) => ({
                    staffUsers: state.staffUsers.filter((u) => u.id !== userId),
                })),
        }),
        {
            name: 'nt_auth_store',
        }
    )
);
