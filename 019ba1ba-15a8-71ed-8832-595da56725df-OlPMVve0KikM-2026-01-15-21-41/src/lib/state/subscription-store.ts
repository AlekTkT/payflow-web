import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types de plans disponibles
export type PlanType = 'trial' | 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled' | 'past_due';

// Configuration des plans
export const PLANS = {
  trial: {
    id: 'trial',
    name: 'Essai Gratuit',
    price: 0,
    priceLabel: 'Gratuit',
    duration: '14 jours',
    employeeLimit: 5,
    features: [
      'Jusqu\'à 5 employés',
      'Toutes les fonctionnalités',
      'Support par email',
      '14 jours d\'essai',
    ],
    color: '#64748b',
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 295,
    priceLabel: '295€/mois',
    duration: 'mensuel',
    employeeLimit: 20,
    features: [
      'Jusqu\'à 20 employés',
      'Toutes les fonctionnalités',
      'Support par email',
      'Mises à jour incluses',
      'Conforme URSSAF/RGPD',
    ],
    color: '#3b82f6',
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 695,
    priceLabel: '695€/mois',
    duration: 'mensuel',
    employeeLimit: 100,
    popular: true,
    features: [
      'Jusqu\'à 100 employés',
      'Toutes les fonctionnalités',
      'API REST complète',
      'Support prioritaire',
      'Gestionnaire de compte dédié',
      'Formation incluse',
    ],
    color: '#8b5cf6',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: -1, // Sur devis
    priceLabel: 'Sur devis',
    duration: 'annuel',
    employeeLimit: Infinity,
    features: [
      'Employés illimités',
      'Personnalisation complète',
      'Support multi-entités',
      'SLA 99.9% garanti',
      'Déploiement on-premise possible',
      'Support 24/7',
    ],
    color: '#059669',
  },
} as const;

export type PlanConfig = typeof PLANS[PlanType];

// Interface de l'abonnement d'une société
export interface Subscription {
  companyId: string;
  plan: PlanType;
  status: SubscriptionStatus;
  employeeCount: number;
  startDate: string;
  endDate: string | null;
  trialEndsAt: string | null;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
}

interface SubscriptionState {
  // Abonnements par société (pour le mode démo)
  subscriptions: Record<string, Subscription>;

  // Actions
  getSubscription: (companyId: string) => Subscription | null;
  setSubscription: (companyId: string, subscription: Partial<Subscription>) => void;
  initTrialSubscription: (companyId: string) => void;
  upgradePlan: (companyId: string, newPlan: PlanType) => void;
  cancelSubscription: (companyId: string) => void;
  updateEmployeeCount: (companyId: string, count: number) => void;

  // Vérifications
  canAddEmployee: (companyId: string) => { allowed: boolean; reason?: string; currentCount: number; limit: number };
  canCreatePayslip: (companyId: string) => { allowed: boolean; reason?: string };
  canCreateInvoice: (companyId: string) => { allowed: boolean; reason?: string };
  isTrialExpired: (companyId: string) => boolean;
  getDaysRemaining: (companyId: string) => number | null;
}

// Données démo par défaut
const defaultDemoSubscriptions: Record<string, Subscription> = {
  // TalentFlow SAS (Société A) - Plan Professional
  'company-a-1': {
    companyId: 'company-a-1',
    plan: 'professional',
    status: 'active',
    employeeCount: 12,
    startDate: '2024-01-15',
    endDate: null,
    trialEndsAt: null,
    lastPaymentDate: '2024-12-01',
    nextPaymentDate: '2025-01-01',
  },
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscriptions: defaultDemoSubscriptions,

      getSubscription: (companyId) => {
        return get().subscriptions[companyId] || null;
      },

      setSubscription: (companyId, subscription) => {
        set((state) => ({
          subscriptions: {
            ...state.subscriptions,
            [companyId]: {
              ...state.subscriptions[companyId],
              ...subscription,
              companyId,
            } as Subscription,
          },
        }));
      },

      initTrialSubscription: (companyId) => {
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + 14);

        set((state) => ({
          subscriptions: {
            ...state.subscriptions,
            [companyId]: {
              companyId,
              plan: 'trial',
              status: 'trial',
              employeeCount: 0,
              startDate: now.toISOString(),
              endDate: null,
              trialEndsAt: trialEnd.toISOString(),
              lastPaymentDate: null,
              nextPaymentDate: null,
            },
          },
        }));
      },

      upgradePlan: (companyId, newPlan) => {
        const now = new Date();
        const nextPayment = new Date(now);
        nextPayment.setMonth(nextPayment.getMonth() + 1);

        set((state) => ({
          subscriptions: {
            ...state.subscriptions,
            [companyId]: {
              ...state.subscriptions[companyId],
              plan: newPlan,
              status: 'active',
              trialEndsAt: null,
              lastPaymentDate: now.toISOString(),
              nextPaymentDate: newPlan === 'enterprise' ? null : nextPayment.toISOString(),
            },
          },
        }));
      },

      cancelSubscription: (companyId) => {
        set((state) => ({
          subscriptions: {
            ...state.subscriptions,
            [companyId]: {
              ...state.subscriptions[companyId],
              status: 'cancelled',
              endDate: new Date().toISOString(),
            },
          },
        }));
      },

      updateEmployeeCount: (companyId, count) => {
        set((state) => ({
          subscriptions: {
            ...state.subscriptions,
            [companyId]: {
              ...state.subscriptions[companyId],
              employeeCount: count,
            },
          },
        }));
      },

      canAddEmployee: (companyId) => {
        const subscription = get().subscriptions[companyId];

        if (!subscription) {
          return {
            allowed: false,
            reason: 'Aucun abonnement actif',
            currentCount: 0,
            limit: 0
          };
        }

        const plan = PLANS[subscription.plan];
        const currentCount = subscription.employeeCount;
        const limit = plan.employeeLimit;

        // Vérifier le statut
        if (subscription.status === 'cancelled' || subscription.status === 'expired') {
          return {
            allowed: false,
            reason: 'Votre abonnement a expiré',
            currentCount,
            limit
          };
        }

        // Vérifier si l'essai est expiré
        if (subscription.status === 'trial' && get().isTrialExpired(companyId)) {
          return {
            allowed: false,
            reason: 'Votre période d\'essai est terminée',
            currentCount,
            limit
          };
        }

        // Vérifier la limite
        if (currentCount >= limit) {
          return {
            allowed: false,
            reason: `Limite de ${limit} employés atteinte`,
            currentCount,
            limit
          };
        }

        return { allowed: true, currentCount, limit };
      },

      canCreatePayslip: (companyId) => {
        const subscription = get().subscriptions[companyId];

        if (!subscription) {
          return { allowed: false, reason: 'Aucun abonnement actif' };
        }

        if (subscription.status === 'cancelled' || subscription.status === 'expired') {
          return { allowed: false, reason: 'Votre abonnement a expiré' };
        }

        if (subscription.status === 'trial' && get().isTrialExpired(companyId)) {
          return { allowed: false, reason: 'Votre période d\'essai est terminée' };
        }

        return { allowed: true };
      },

      canCreateInvoice: (companyId) => {
        // Même logique que canCreatePayslip
        return get().canCreatePayslip(companyId);
      },

      isTrialExpired: (companyId) => {
        const subscription = get().subscriptions[companyId];
        if (!subscription || !subscription.trialEndsAt) return false;

        return new Date(subscription.trialEndsAt) < new Date();
      },

      getDaysRemaining: (companyId) => {
        const subscription = get().subscriptions[companyId];
        if (!subscription) return null;

        if (subscription.status === 'trial' && subscription.trialEndsAt) {
          const now = new Date();
          const end = new Date(subscription.trialEndsAt);
          const diff = end.getTime() - now.getTime();
          return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

        if (subscription.nextPaymentDate) {
          const now = new Date();
          const next = new Date(subscription.nextPaymentDate);
          const diff = next.getTime() - now.getTime();
          return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

        return null;
      },
    }),
    {
      name: 'payflow-subscriptions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Hooks utilitaires
export const useSubscription = (companyId: string) =>
  useSubscriptionStore((s) => s.getSubscription(companyId));

export const useCanAddEmployee = (companyId: string) =>
  useSubscriptionStore((s) => s.canAddEmployee(companyId));

export const usePlanLimits = (companyId: string) => {
  const subscription = useSubscriptionStore((s) => s.getSubscription(companyId));
  if (!subscription) return null;

  const plan = PLANS[subscription.plan];
  return {
    plan: subscription.plan,
    planName: plan.name,
    employeeLimit: plan.employeeLimit,
    employeeCount: subscription.employeeCount,
    percentUsed: Math.min(100, (subscription.employeeCount / plan.employeeLimit) * 100),
    status: subscription.status,
  };
};
