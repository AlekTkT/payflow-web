import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPreferences {
  // Channels
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  // Types
  bulletinEnabled: boolean;
  invoiceEnabled: boolean;
  paymentEnabled: boolean;
  reminderEnabled: boolean;
}

interface NotificationState extends NotificationPreferences {
  // Actions
  setEmailEnabled: (enabled: boolean) => void;
  setPushEnabled: (enabled: boolean) => void;
  setSmsEnabled: (enabled: boolean) => void;
  setBulletinEnabled: (enabled: boolean) => void;
  setInvoiceEnabled: (enabled: boolean) => void;
  setPaymentEnabled: (enabled: boolean) => void;
  setReminderEnabled: (enabled: boolean) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      // Default values
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      bulletinEnabled: true,
      invoiceEnabled: true,
      paymentEnabled: true,
      reminderEnabled: true,
      // Actions
      setEmailEnabled: (enabled) => set({ emailEnabled: enabled }),
      setPushEnabled: (enabled) => set({ pushEnabled: enabled }),
      setSmsEnabled: (enabled) => set({ smsEnabled: enabled }),
      setBulletinEnabled: (enabled) => set({ bulletinEnabled: enabled }),
      setInvoiceEnabled: (enabled) => set({ invoiceEnabled: enabled }),
      setPaymentEnabled: (enabled) => set({ paymentEnabled: enabled }),
      setReminderEnabled: (enabled) => set({ reminderEnabled: enabled }),
    }),
    {
      name: 'notification-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const useEmailNotifications = () => useNotificationStore((s) => s.emailEnabled);
export const usePushNotifications = () => useNotificationStore((s) => s.pushEnabled);
export const useSmsNotifications = () => useNotificationStore((s) => s.smsEnabled);
export const useBulletinNotifications = () => useNotificationStore((s) => s.bulletinEnabled);
export const useInvoiceNotifications = () => useNotificationStore((s) => s.invoiceEnabled);
export const usePaymentNotifications = () => useNotificationStore((s) => s.paymentEnabled);
export const useReminderNotifications = () => useNotificationStore((s) => s.reminderEnabled);

// Action selectors
export const useSetEmailNotifications = () => useNotificationStore((s) => s.setEmailEnabled);
export const useSetPushNotifications = () => useNotificationStore((s) => s.setPushEnabled);
export const useSetSmsNotifications = () => useNotificationStore((s) => s.setSmsEnabled);
export const useSetBulletinNotifications = () => useNotificationStore((s) => s.setBulletinEnabled);
export const useSetInvoiceNotifications = () => useNotificationStore((s) => s.setInvoiceEnabled);
export const useSetPaymentNotifications = () => useNotificationStore((s) => s.setPaymentEnabled);
export const useSetReminderNotifications = () => useNotificationStore((s) => s.setReminderEnabled);
