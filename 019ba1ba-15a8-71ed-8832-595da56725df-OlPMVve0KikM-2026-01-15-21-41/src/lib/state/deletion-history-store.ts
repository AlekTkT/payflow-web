import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Company, Employee, EmployeeWithDetails } from '../database.types';

export type DeletionType = 'company' | 'employee';

export interface DeletionRecord {
  id: string;
  type: DeletionType;
  deletedAt: string;
  deletedBy: string;
  reason?: string;
  data: Company | EmployeeWithDetails;
}

interface DeletionHistoryState {
  deletions: DeletionRecord[];
  addDeletion: (record: Omit<DeletionRecord, 'id' | 'deletedAt'>) => void;
  getDeletionsByType: (type: DeletionType) => DeletionRecord[];
  getDeletedCompanies: () => DeletionRecord[];
  getDeletedEmployees: () => DeletionRecord[];
  restoreItem: (id: string) => DeletionRecord | undefined;
  clearHistory: () => void;
}

export const useDeletionHistoryStore = create<DeletionHistoryState>()(
  persist(
    (set, get) => ({
      deletions: [],

      addDeletion: (record) => {
        const newRecord: DeletionRecord = {
          ...record,
          id: `del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          deletedAt: new Date().toISOString(),
        };
        set((state) => ({
          deletions: [newRecord, ...state.deletions],
        }));
      },

      getDeletionsByType: (type) => {
        return get().deletions.filter((d) => d.type === type);
      },

      getDeletedCompanies: () => {
        return get().deletions.filter((d) => d.type === 'company');
      },

      getDeletedEmployees: () => {
        return get().deletions.filter((d) => d.type === 'employee');
      },

      restoreItem: (id) => {
        const item = get().deletions.find((d) => d.id === id);
        if (item) {
          set((state) => ({
            deletions: state.deletions.filter((d) => d.id !== id),
          }));
        }
        return item;
      },

      clearHistory: () => {
        set({ deletions: [] });
      },
    }),
    {
      name: 'payflow-deletion-history',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const useDeletions = () => useDeletionHistoryStore((s) => s.deletions);
export const useDeletedCompaniesCount = () =>
  useDeletionHistoryStore((s) => s.deletions.filter((d) => d.type === 'company').length);
export const useDeletedEmployeesCount = () =>
  useDeletionHistoryStore((s) => s.deletions.filter((d) => d.type === 'employee').length);
