import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserType, User } from '../database.types';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  user_type: UserType;
  company_id: string | null;
  employee_id: string | null;
}

interface AuthState {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setIsAuthenticated: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  logout: () => void;
}

const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setIsAuthenticated: (value) => set({ isAuthenticated: value }),
      setIsLoading: (value) => set({ isLoading: value }),
      logout: () => set({ ...initialState, isLoading: false }),
    }),
    {
      name: 'payflow-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setIsLoading(false);
        }
      },
    }
  )
);

// Selectors for optimized re-renders
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useAuthUser = () => useAuthStore((s) => s.user);
export const useAuthUserType = () => useAuthStore((s) => s.user?.user_type ?? null);
export const useIsAdmin = () => useAuthStore((s) => s.user?.user_type === 'admin_app');
