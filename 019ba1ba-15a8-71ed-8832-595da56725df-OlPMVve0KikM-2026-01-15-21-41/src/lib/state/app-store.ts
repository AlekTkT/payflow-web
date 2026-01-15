import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserType } from '../database.types';

export type AppMode = 'demo' | 'real';

interface AppState {
  // User state
  userType: UserType;
  userId: string | null;
  companyId: string | null;

  // App mode
  appMode: AppMode;

  // Actions
  setUserType: (type: UserType) => void;
  setUserId: (id: string | null) => void;
  setCompanyId: (id: string | null) => void;
  setAppMode: (mode: AppMode) => void;
  reset: () => void;
}

const initialState = {
  userType: 'societe_a' as UserType,
  userId: null,
  companyId: null,
  appMode: 'demo' as AppMode,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setUserType: (type) => set({ userType: type }),
      setUserId: (id) => set({ userId: id }),
      setCompanyId: (id) => set({ companyId: id }),
      setAppMode: (mode) => set({ appMode: mode }),
      reset: () => set(initialState),
    }),
    {
      name: 'payflow-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userType: state.userType,
        userId: state.userId,
        companyId: state.companyId,
        appMode: state.appMode,
      }),
    }
  )
);

// Selectors for optimized re-renders
export const useUserType = () => useAppStore((s) => s.userType);
export const useUserId = () => useAppStore((s) => s.userId);
export const useCompanyId = () => useAppStore((s) => s.companyId);
export const useAppMode = () => useAppStore((s) => s.appMode);
export const useSetAppMode = () => useAppStore((s) => s.setAppMode);
