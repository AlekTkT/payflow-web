import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'fr' | 'en' | 'es' | 'de' | 'it';

interface ThemeState {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'fr',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const useTheme = () => useThemeStore((s) => s.theme);
export const useSetTheme = () => useThemeStore((s) => s.setTheme);
export const useLanguage = () => useThemeStore((s) => s.language);
export const useSetLanguage = () => useThemeStore((s) => s.setLanguage);

// Hook to get the actual theme based on system preference
export function useActualTheme(): 'light' | 'dark' {
  const theme = useTheme();
  const systemColorScheme = useColorScheme();

  if (theme === 'system') {
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }
  return theme;
}

// Translations
export const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Settings
    'settings.title': 'Paramètres',
    'settings.profile': 'Mon profil',
    'settings.profile_subtitle': 'Informations personnelles',
    'settings.company': 'Mon entreprise',
    'settings.notifications': 'Notifications',
    'settings.notifications_subtitle': 'Gérer les alertes',
    'settings.security': 'Sécurité',
    'settings.security_subtitle': 'Mot de passe et 2FA',
    'settings.appearance': 'Apparence',
    'settings.appearance_subtitle': 'Thème clair',
    'settings.language': 'Langue',
    'settings.language_subtitle': 'Français',
    'settings.help': 'Aide et support',
    'settings.help_subtitle': 'FAQ, contact',
    'settings.logout': 'Se déconnecter',
    'settings.logout_confirm': 'Êtes-vous sûr de vouloir vous déconnecter ?',
    'settings.logout_title': 'Déconnexion',
    'settings.cancel': 'Annuler',
    'settings.disconnect': 'Déconnecter',
    'settings.demo_mode': 'Mode Démonstration',
    'settings.real_mode': 'Mode Réel',
    'settings.app_mode': 'Mode de l\'application',
    'settings.simulate_role': 'Simuler un rôle',
    'settings.connected': 'Connecté',
    'settings.demo': 'Démo',

    // Theme
    'theme.title': 'Thème de l\'application',
    'theme.light': 'Clair',
    'theme.dark': 'Sombre',
    'theme.system': 'Auto',
    'theme.auto_description': 'Le mode automatique suit les paramètres de votre appareil',

    // Language
    'language.french': 'Français',
    'language.english': 'English',
    'language.spanish': 'Español',
    'language.german': 'Deutsch',
    'language.italian': 'Italiano',

    // Common
    'common.save': 'Enregistrer',
    'common.success': 'Succès',
    'common.error': 'Erreur',
    'common.loading': 'Chargement...',
    'common.back': 'Retour',

    // Admin
    'admin.invite_societe_a': 'Inviter une Société A',
    'admin.invite_subtitle': 'Envoyer des accès prestataires',
    'admin.dashboard': 'Dashboard',
    'admin.societes_a': 'Sociétés A',
    'admin.subscriptions': 'Abonnements',

    // User types
    'user.admin_app': 'Administrateur App',
    'user.societe_a': 'Société A',
    'user.societe_a_desc': 'Prestataire de paie',
    'user.societe_b': 'Société B',
    'user.societe_b_desc': 'Client employeur',
    'user.employe': 'Employé',
    'user.employe_desc': 'Salarié porté',
  },
  en: {
    // Settings
    'settings.title': 'Settings',
    'settings.profile': 'My profile',
    'settings.profile_subtitle': 'Personal information',
    'settings.company': 'My company',
    'settings.notifications': 'Notifications',
    'settings.notifications_subtitle': 'Manage alerts',
    'settings.security': 'Security',
    'settings.security_subtitle': 'Password and 2FA',
    'settings.appearance': 'Appearance',
    'settings.appearance_subtitle': 'Light theme',
    'settings.language': 'Language',
    'settings.language_subtitle': 'English',
    'settings.help': 'Help and support',
    'settings.help_subtitle': 'FAQ, contact',
    'settings.logout': 'Log out',
    'settings.logout_confirm': 'Are you sure you want to log out?',
    'settings.logout_title': 'Log out',
    'settings.cancel': 'Cancel',
    'settings.disconnect': 'Log out',
    'settings.demo_mode': 'Demo Mode',
    'settings.real_mode': 'Real Mode',
    'settings.app_mode': 'Application mode',
    'settings.simulate_role': 'Simulate a role',
    'settings.connected': 'Connected',
    'settings.demo': 'Demo',

    // Theme
    'theme.title': 'Application theme',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'Auto',
    'theme.auto_description': 'Auto mode follows your device settings',

    // Language
    'language.french': 'Français',
    'language.english': 'English',
    'language.spanish': 'Español',
    'language.german': 'Deutsch',
    'language.italian': 'Italiano',

    // Common
    'common.save': 'Save',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.loading': 'Loading...',
    'common.back': 'Back',

    // Admin
    'admin.invite_societe_a': 'Invite a Company A',
    'admin.invite_subtitle': 'Send provider access',
    'admin.dashboard': 'Dashboard',
    'admin.societes_a': 'Companies A',
    'admin.subscriptions': 'Subscriptions',

    // User types
    'user.admin_app': 'App Administrator',
    'user.societe_a': 'Company A',
    'user.societe_a_desc': 'Payroll provider',
    'user.societe_b': 'Company B',
    'user.societe_b_desc': 'Client employer',
    'user.employe': 'Employee',
    'user.employe_desc': 'Ported employee',
  },
  es: {
    'settings.title': 'Configuración',
    'settings.profile': 'Mi perfil',
    'settings.profile_subtitle': 'Información personal',
    'settings.company': 'Mi empresa',
    'settings.notifications': 'Notificaciones',
    'settings.notifications_subtitle': 'Gestionar alertas',
    'settings.security': 'Seguridad',
    'settings.security_subtitle': 'Contraseña y 2FA',
    'settings.appearance': 'Apariencia',
    'settings.appearance_subtitle': 'Tema claro',
    'settings.language': 'Idioma',
    'settings.language_subtitle': 'Español',
    'settings.help': 'Ayuda y soporte',
    'settings.help_subtitle': 'FAQ, contacto',
    'settings.logout': 'Cerrar sesión',
    'settings.logout_confirm': '¿Estás seguro de que quieres cerrar sesión?',
    'settings.logout_title': 'Cerrar sesión',
    'settings.cancel': 'Cancelar',
    'settings.disconnect': 'Desconectar',
    'settings.demo_mode': 'Modo Demo',
    'settings.real_mode': 'Modo Real',
    'settings.app_mode': 'Modo de la aplicación',
    'settings.simulate_role': 'Simular un rol',
    'settings.connected': 'Conectado',
    'settings.demo': 'Demo',
    'theme.title': 'Tema de la aplicación',
    'theme.light': 'Claro',
    'theme.dark': 'Oscuro',
    'theme.system': 'Auto',
    'theme.auto_description': 'El modo automático sigue la configuración de tu dispositivo',
    'language.french': 'Français',
    'language.english': 'English',
    'language.spanish': 'Español',
    'language.german': 'Deutsch',
    'language.italian': 'Italiano',
    'common.save': 'Guardar',
    'common.success': 'Éxito',
    'common.error': 'Error',
    'common.loading': 'Cargando...',
    'common.back': 'Atrás',
    'admin.invite_societe_a': 'Invitar una Empresa A',
    'admin.invite_subtitle': 'Enviar acceso de proveedor',
    'admin.dashboard': 'Panel',
    'admin.societes_a': 'Empresas A',
    'admin.subscriptions': 'Suscripciones',
    'user.admin_app': 'Administrador App',
    'user.societe_a': 'Empresa A',
    'user.societe_a_desc': 'Proveedor de nóminas',
    'user.societe_b': 'Empresa B',
    'user.societe_b_desc': 'Cliente empleador',
    'user.employe': 'Empleado',
    'user.employe_desc': 'Empleado portado',
  },
  de: {
    'settings.title': 'Einstellungen',
    'settings.profile': 'Mein Profil',
    'settings.profile_subtitle': 'Persönliche Informationen',
    'settings.company': 'Mein Unternehmen',
    'settings.notifications': 'Benachrichtigungen',
    'settings.notifications_subtitle': 'Warnungen verwalten',
    'settings.security': 'Sicherheit',
    'settings.security_subtitle': 'Passwort und 2FA',
    'settings.appearance': 'Erscheinungsbild',
    'settings.appearance_subtitle': 'Helles Thema',
    'settings.language': 'Sprache',
    'settings.language_subtitle': 'Deutsch',
    'settings.help': 'Hilfe und Support',
    'settings.help_subtitle': 'FAQ, Kontakt',
    'settings.logout': 'Abmelden',
    'settings.logout_confirm': 'Sind Sie sicher, dass Sie sich abmelden möchten?',
    'settings.logout_title': 'Abmelden',
    'settings.cancel': 'Abbrechen',
    'settings.disconnect': 'Trennen',
    'settings.demo_mode': 'Demo-Modus',
    'settings.real_mode': 'Echter Modus',
    'settings.app_mode': 'App-Modus',
    'settings.simulate_role': 'Eine Rolle simulieren',
    'settings.connected': 'Verbunden',
    'settings.demo': 'Demo',
    'theme.title': 'App-Thema',
    'theme.light': 'Hell',
    'theme.dark': 'Dunkel',
    'theme.system': 'Auto',
    'theme.auto_description': 'Der automatische Modus folgt Ihren Geräteeinstellungen',
    'language.french': 'Français',
    'language.english': 'English',
    'language.spanish': 'Español',
    'language.german': 'Deutsch',
    'language.italian': 'Italiano',
    'common.save': 'Speichern',
    'common.success': 'Erfolg',
    'common.error': 'Fehler',
    'common.loading': 'Wird geladen...',
    'common.back': 'Zurück',
    'admin.invite_societe_a': 'Unternehmen A einladen',
    'admin.invite_subtitle': 'Anbieterzugang senden',
    'admin.dashboard': 'Dashboard',
    'admin.societes_a': 'Unternehmen A',
    'admin.subscriptions': 'Abonnements',
    'user.admin_app': 'App-Administrator',
    'user.societe_a': 'Unternehmen A',
    'user.societe_a_desc': 'Gehaltsabrechnung Anbieter',
    'user.societe_b': 'Unternehmen B',
    'user.societe_b_desc': 'Kundenarbeitgeber',
    'user.employe': 'Mitarbeiter',
    'user.employe_desc': 'Portierter Mitarbeiter',
  },
  it: {
    'settings.title': 'Impostazioni',
    'settings.profile': 'Il mio profilo',
    'settings.profile_subtitle': 'Informazioni personali',
    'settings.company': 'La mia azienda',
    'settings.notifications': 'Notifiche',
    'settings.notifications_subtitle': 'Gestisci avvisi',
    'settings.security': 'Sicurezza',
    'settings.security_subtitle': 'Password e 2FA',
    'settings.appearance': 'Aspetto',
    'settings.appearance_subtitle': 'Tema chiaro',
    'settings.language': 'Lingua',
    'settings.language_subtitle': 'Italiano',
    'settings.help': 'Aiuto e supporto',
    'settings.help_subtitle': 'FAQ, contatto',
    'settings.logout': 'Esci',
    'settings.logout_confirm': 'Sei sicuro di voler uscire?',
    'settings.logout_title': 'Esci',
    'settings.cancel': 'Annulla',
    'settings.disconnect': 'Disconnetti',
    'settings.demo_mode': 'Modalità Demo',
    'settings.real_mode': 'Modalità Reale',
    'settings.app_mode': 'Modalità app',
    'settings.simulate_role': 'Simula un ruolo',
    'settings.connected': 'Connesso',
    'settings.demo': 'Demo',
    'theme.title': 'Tema dell\'app',
    'theme.light': 'Chiaro',
    'theme.dark': 'Scuro',
    'theme.system': 'Auto',
    'theme.auto_description': 'La modalità automatica segue le impostazioni del dispositivo',
    'language.french': 'Français',
    'language.english': 'English',
    'language.spanish': 'Español',
    'language.german': 'Deutsch',
    'language.italian': 'Italiano',
    'common.save': 'Salva',
    'common.success': 'Successo',
    'common.error': 'Errore',
    'common.loading': 'Caricamento...',
    'common.back': 'Indietro',
    'admin.invite_societe_a': 'Invita un\'azienda A',
    'admin.invite_subtitle': 'Invia accesso fornitore',
    'admin.dashboard': 'Dashboard',
    'admin.societes_a': 'Aziende A',
    'admin.subscriptions': 'Abbonamenti',
    'user.admin_app': 'Amministratore App',
    'user.societe_a': 'Azienda A',
    'user.societe_a_desc': 'Fornitore buste paga',
    'user.societe_b': 'Azienda B',
    'user.societe_b_desc': 'Cliente datore di lavoro',
    'user.employe': 'Dipendente',
    'user.employe_desc': 'Dipendente portato',
  },
};

// Translation hook
export function useTranslation() {
  const language = useLanguage();

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.fr[key] || key;
  };

  return { t, language };
}
