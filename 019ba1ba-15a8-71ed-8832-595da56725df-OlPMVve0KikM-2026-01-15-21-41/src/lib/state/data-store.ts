import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for Société A
export interface SocieteA {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  plan: 'Starter' | 'Pro' | 'Business' | 'Essai';
  amount: number;
  employeesCount: number;
  clientsCount: number;
  since: string;
  siret: string;
  address: string;
}

// Types for Subscription invoices (Admin App -> Société A)
export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  societeA: string;
  plan: string;
  amount: number;
  period: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  paidAt: string | null;
  dueDate: string;
}

// Types for PayFlow invoices (Société A's subscription)
export interface PayFlowInvoice {
  id: string;
  invoiceNumber: string;
  plan: string;
  amount: number;
  period: string;
  status: 'sent' | 'paid';
  dueDate: string;
  paidAt: string | null;
}

// Types for Invitations
export interface Invitation {
  id: string;
  email: string;
  phone?: string;
  type: 'societe_a' | 'societe_b' | 'employe';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitedBy: string;
  invitedByType: 'admin_app' | 'societe_a' | 'societe_b';
  createdAt: string;
  expiresAt: string;
}

// Types for Société B (clients of Société A)
export interface SocieteB {
  id: string;
  name: string;
  email: string;
  phone: string;
  siret: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt: string;
  societeAId: string; // Link to parent Société A
}

// Types for Employees (in real mode)
export interface RealEmployee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  contractType: 'CDI' | 'CDD' | 'Freelance';
  hourlyRate: number;
  hireDate: string;
  societeAId: string; // Employer
  societeBId: string; // Client company
  status: 'active' | 'inactive';
}

// Types for Payslips (in real mode)
export interface RealPayslip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  grossSalary: number;
  netSalary: number;
  hoursWorked: number;
  status: 'draft' | 'generated' | 'sent';
  createdAt: string;
}

// Types for Client Invoices (Société A -> Société B)
export interface ClientInvoice {
  id: string;
  invoiceNumber: string;
  societeBId: string;
  societeBName: string;
  amount: number;
  period: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
}

// Types for Monthly Variables (Société B submits for employees)
export interface RealMonthlyVariable {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  hoursWorked: number;
  overtimeHours: number;
  bonus: number;
  absenceDays: number;
  status: 'draft' | 'submitted' | 'validated';
  submittedAt: string | null;
  validatedAt: string | null;
}

interface DataState {
  // Sociétés A (managed by Admin App)
  societesA: SocieteA[];

  // Subscription invoices (Admin App -> Sociétés A)
  subscriptionInvoices: SubscriptionInvoice[];

  // PayFlow invoices (for Société A's own subscription)
  payflowInvoices: PayFlowInvoice[];

  // Invitations
  invitations: Invitation[];

  // Sociétés B (clients of Société A)
  societesB: SocieteB[];

  // Employees
  employees: RealEmployee[];

  // Payslips
  payslips: RealPayslip[];

  // Client Invoices (Société A -> Société B)
  clientInvoices: ClientInvoice[];

  // Monthly Variables
  monthlyVariables: RealMonthlyVariable[];

  // Actions for Sociétés A
  addSocieteA: (societe: SocieteA) => void;
  updateSocieteA: (id: string, updates: Partial<SocieteA>) => void;
  removeSocieteA: (id: string) => void;

  // Actions for Subscription invoices
  addSubscriptionInvoice: (invoice: SubscriptionInvoice) => void;
  updateSubscriptionInvoice: (id: string, updates: Partial<SubscriptionInvoice>) => void;
  removeSubscriptionInvoice: (id: string) => void;

  // Actions for PayFlow invoices
  addPayFlowInvoice: (invoice: PayFlowInvoice) => void;
  updatePayFlowInvoice: (id: string, updates: Partial<PayFlowInvoice>) => void;

  // Actions for Invitations
  addInvitation: (invitation: Invitation) => void;
  updateInvitation: (id: string, updates: Partial<Invitation>) => void;
  removeInvitation: (id: string) => void;

  // Actions for Sociétés B
  addSocieteB: (societe: SocieteB) => void;
  updateSocieteB: (id: string, updates: Partial<SocieteB>) => void;
  removeSocieteB: (id: string) => void;

  // Actions for Employees
  addEmployee: (employee: RealEmployee) => void;
  updateEmployee: (id: string, updates: Partial<RealEmployee>) => void;
  removeEmployee: (id: string) => void;

  // Actions for Payslips
  addPayslip: (payslip: RealPayslip) => void;
  updatePayslip: (id: string, updates: Partial<RealPayslip>) => void;
  removePayslip: (id: string) => void;

  // Actions for Client Invoices
  addClientInvoice: (invoice: ClientInvoice) => void;
  updateClientInvoice: (id: string, updates: Partial<ClientInvoice>) => void;
  removeClientInvoice: (id: string) => void;

  // Actions for Monthly Variables
  addMonthlyVariable: (variable: RealMonthlyVariable) => void;
  updateMonthlyVariable: (id: string, updates: Partial<RealMonthlyVariable>) => void;
  removeMonthlyVariable: (id: string) => void;

  // Reset all data
  resetAllData: () => void;
}

const initialState = {
  societesA: [] as SocieteA[],
  subscriptionInvoices: [] as SubscriptionInvoice[],
  payflowInvoices: [] as PayFlowInvoice[],
  invitations: [] as Invitation[],
  societesB: [] as SocieteB[],
  employees: [] as RealEmployee[],
  payslips: [] as RealPayslip[],
  clientInvoices: [] as ClientInvoice[],
  monthlyVariables: [] as RealMonthlyVariable[],
};

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      ...initialState,

      // Sociétés A actions
      addSocieteA: (societe) => set((state) => ({
        societesA: [...state.societesA, societe],
      })),
      updateSocieteA: (id, updates) => set((state) => ({
        societesA: state.societesA.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      })),
      removeSocieteA: (id) => set((state) => ({
        societesA: state.societesA.filter((s) => s.id !== id),
      })),

      // Subscription invoices actions
      addSubscriptionInvoice: (invoice) => set((state) => ({
        subscriptionInvoices: [...state.subscriptionInvoices, invoice],
      })),
      updateSubscriptionInvoice: (id, updates) => set((state) => ({
        subscriptionInvoices: state.subscriptionInvoices.map((i) =>
          i.id === id ? { ...i, ...updates } : i
        ),
      })),
      removeSubscriptionInvoice: (id) => set((state) => ({
        subscriptionInvoices: state.subscriptionInvoices.filter((i) => i.id !== id),
      })),

      // PayFlow invoices actions
      addPayFlowInvoice: (invoice) => set((state) => ({
        payflowInvoices: [...state.payflowInvoices, invoice],
      })),
      updatePayFlowInvoice: (id, updates) => set((state) => ({
        payflowInvoices: state.payflowInvoices.map((i) =>
          i.id === id ? { ...i, ...updates } : i
        ),
      })),

      // Invitations actions
      addInvitation: (invitation) => set((state) => ({
        invitations: [...state.invitations, invitation],
      })),
      updateInvitation: (id, updates) => set((state) => ({
        invitations: state.invitations.map((i) =>
          i.id === id ? { ...i, ...updates } : i
        ),
      })),
      removeInvitation: (id) => set((state) => ({
        invitations: state.invitations.filter((i) => i.id !== id),
      })),

      // Sociétés B actions
      addSocieteB: (societe) => set((state) => ({
        societesB: [...state.societesB, societe],
      })),
      updateSocieteB: (id, updates) => set((state) => ({
        societesB: state.societesB.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      })),
      removeSocieteB: (id) => set((state) => ({
        societesB: state.societesB.filter((s) => s.id !== id),
      })),

      // Employees actions
      addEmployee: (employee) => set((state) => ({
        employees: [...state.employees, employee],
      })),
      updateEmployee: (id, updates) => set((state) => ({
        employees: state.employees.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      })),
      removeEmployee: (id) => set((state) => ({
        employees: state.employees.filter((e) => e.id !== id),
      })),

      // Payslips actions
      addPayslip: (payslip) => set((state) => ({
        payslips: [...state.payslips, payslip],
      })),
      updatePayslip: (id, updates) => set((state) => ({
        payslips: state.payslips.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      })),
      removePayslip: (id) => set((state) => ({
        payslips: state.payslips.filter((p) => p.id !== id),
      })),

      // Client Invoices actions
      addClientInvoice: (invoice) => set((state) => ({
        clientInvoices: [...state.clientInvoices, invoice],
      })),
      updateClientInvoice: (id, updates) => set((state) => ({
        clientInvoices: state.clientInvoices.map((i) =>
          i.id === id ? { ...i, ...updates } : i
        ),
      })),
      removeClientInvoice: (id) => set((state) => ({
        clientInvoices: state.clientInvoices.filter((i) => i.id !== id),
      })),

      // Monthly Variables actions
      addMonthlyVariable: (variable) => set((state) => ({
        monthlyVariables: [...state.monthlyVariables, variable],
      })),
      updateMonthlyVariable: (id, updates) => set((state) => ({
        monthlyVariables: state.monthlyVariables.map((v) =>
          v.id === id ? { ...v, ...updates } : v
        ),
      })),
      removeMonthlyVariable: (id) => set((state) => ({
        monthlyVariables: state.monthlyVariables.filter((v) => v.id !== id),
      })),

      // Reset all data
      resetAllData: () => set(initialState),
    }),
    {
      name: 'payflow-data-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const useSocietesA = () => useDataStore((s) => s.societesA);
export const useSubscriptionInvoices = () => useDataStore((s) => s.subscriptionInvoices);
export const usePayFlowInvoices = () => useDataStore((s) => s.payflowInvoices);
export const useInvitations = () => useDataStore((s) => s.invitations);
export const useSocietesB = () => useDataStore((s) => s.societesB);
export const useRealEmployees = () => useDataStore((s) => s.employees);
export const useRealPayslips = () => useDataStore((s) => s.payslips);
export const useClientInvoices = () => useDataStore((s) => s.clientInvoices);
export const useRealMonthlyVariables = () => useDataStore((s) => s.monthlyVariables);

// Helper to generate unique IDs
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper to generate invoice numbers
export const generateInvoiceNumber = (prefix: string, count: number) => {
  const year = new Date().getFullYear();
  const num = String(count + 1).padStart(3, '0');
  return `${prefix}-${year}-${num}`;
};
