import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ChevronRight,
  User,
  Building2,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  Moon,
  Globe,
  FileText,
  CreditCard,
  Users,
  Briefcase,
  Upload,
  History,
  Database,
  TestTube,
  Shield,
  UserPlus,
  Scale,
  MessageCircle,
} from 'lucide-react-native';
import { useAppStore, useUserType, useAppMode, useSetAppMode } from '@/lib/state/app-store';
import { useAuthStore, useAuthUser } from '@/lib/state/auth-store';
import { isRealModeAvailable } from '@/lib/hooks/usePayflow';
import { useTheme, useLanguage, useActualTheme, useTranslation } from '@/lib/state/theme-store';
import type { UserType } from '@/lib/database.types';

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 py-4 border-b border-slate-100 active:opacity-70"
    >
      <View className={`w-10 h-10 rounded-xl items-center justify-center ${danger ? 'bg-red-100' : 'bg-slate-100'}`}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className={`font-medium ${danger ? 'text-red-600' : 'text-slate-900'}`}>{title}</Text>
        {subtitle && <Text className="text-sm text-slate-500">{subtitle}</Text>}
      </View>
      {showArrow && <ChevronRight size={20} color="#94a3b8" />}
    </Pressable>
  );
}

function AppModeSelector() {
  const appMode = useAppMode();
  const setAppMode = useSetAppMode();
  const realModeAvailable = isRealModeAvailable();

  const options: { value: 'demo' | 'real'; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: 'demo',
      label: 'Mode Démonstration',
      description: 'Données fictives, accès à tous les rôles',
      icon: <TestTube size={18} color={appMode === 'demo' ? '#6366f1' : '#64748b'} />
    },
    {
      value: 'real',
      label: 'Mode Réel',
      description: realModeAvailable ? 'Données Supabase, accès limité à votre rôle' : 'Supabase non configuré',
      icon: <Database size={18} color={appMode === 'real' ? '#6366f1' : '#64748b'} />
    },
  ];

  return (
    <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
      <Text className="text-sm font-medium text-slate-500 mb-3">Mode de l'application</Text>
      <View className="gap-2">
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => {
              if (option.value === 'real' && !realModeAvailable) {
                Alert.alert(
                  'Mode non disponible',
                  'La connexion Supabase n\'est pas configurée. Veuillez configurer vos variables d\'environnement EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans l\'onglet ENV.'
                );
                return;
              }
              setAppMode(option.value);
            }}
            className={`flex-row items-center gap-3 p-3 rounded-xl border ${
              appMode === option.value
                ? 'bg-indigo-50 border-indigo-200'
                : option.value === 'real' && !realModeAvailable
                  ? 'bg-slate-100 border-transparent opacity-50'
                  : 'bg-slate-50 border-transparent'
            }`}
          >
            <View className="w-8 h-8 rounded-lg bg-white items-center justify-center border border-slate-200">
              {option.icon}
            </View>
            <View className="flex-1">
              <Text
                className={`font-medium ${
                  appMode === option.value ? 'text-indigo-700' : 'text-slate-700'
                }`}
              >
                {option.label}
              </Text>
              <Text className="text-xs text-slate-500">{option.description}</Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                appMode === option.value ? 'border-indigo-500' : 'border-slate-300'
              }`}
            >
              {appMode === option.value && (
                <View className="w-3 h-3 rounded-full bg-indigo-500" />
              )}
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function UserTypeSelector() {
  const userType = useUserType();
  const setUserType = useAppStore((s) => s.setUserType);

  const options: { value: UserType; label: string; description: string }[] = [
    { value: 'admin_app', label: 'Admin App', description: 'Administrateur de l\'application' },
    { value: 'societe_a', label: 'Société A', description: 'Prestataire de paie' },
    { value: 'societe_b', label: 'Société B', description: 'Client employeur' },
    { value: 'employe', label: 'Employé', description: 'Salarié porté' },
  ];

  return (
    <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
      <Text className="text-sm font-medium text-slate-500 mb-3">Simuler un rôle</Text>
      <View className="gap-2">
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setUserType(option.value)}
            className={`flex-row items-center gap-3 p-3 rounded-xl border ${
              userType === option.value
                ? 'bg-indigo-50 border-indigo-200'
                : 'bg-slate-50 border-transparent'
            }`}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                userType === option.value ? 'border-indigo-500' : 'border-slate-300'
              }`}
            >
              {userType === option.value && (
                <View className="w-3 h-3 rounded-full bg-indigo-500" />
              )}
            </View>
            <View className="flex-1">
              <Text
                className={`font-medium ${
                  userType === option.value ? 'text-indigo-700' : 'text-slate-700'
                }`}
              >
                {option.label}
              </Text>
              <Text className="text-xs text-slate-500">{option.description}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const userType = useUserType();
  const appMode = useAppMode();
  const authUser = useAuthUser();
  const logout = useAuthStore((s) => s.logout);
  const actualTheme = useActualTheme();
  const language = useLanguage();
  const { t } = useTranslation();

  const isDemo = appMode === 'demo';

  const languageNames: Record<string, string> = {
    fr: 'Français',
    en: 'English',
    es: 'Español',
    de: 'Deutsch',
    it: 'Italiano',
  };

  const themeNames: Record<string, string> = {
    light: 'Thème clair',
    dark: 'Thème sombre',
  };

  const userName = authUser?.full_name || (userType === 'admin_app'
    ? 'Admin PayFlow'
    : userType === 'societe_a'
      ? 'Admin TalentFlow'
      : userType === 'societe_b'
        ? 'RH TechCorp'
        : 'Marie Dupont');

  const userRole = userType === 'admin_app'
    ? 'Administrateur PayFlow'
    : userType === 'societe_a'
      ? 'Prestataire de paie'
      : userType === 'societe_b'
        ? 'Responsable RH'
        : 'Salarié porté';

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/login');
        },
      },
    ]);
  };

  // ============ ADMIN APP ============
  if (userType === 'admin_app') {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-2 pb-6">
            <Text className="text-2xl font-bold text-slate-900 mb-6">Paramètres</Text>

            {/* Profile Card */}
            <Pressable
              onPress={() => router.push('/settings-detail?section=profile')}
              className="bg-white rounded-2xl p-5 mb-6 border border-slate-100 active:opacity-70"
            >
              <View className="flex-row items-center gap-4">
                <LinearGradient
                  colors={['#8b5cf6', '#a855f7']}
                  style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="text-white font-bold text-xl">
                    {userName.split(' ').map(n => n[0]).join('')}
                  </Text>
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-900">{userName}</Text>
                  <Text className="text-slate-500">{userRole}</Text>
                  <View className="flex-row items-center gap-1 mt-1">
                    <View className="w-2 h-2 rounded-full bg-emerald-500" />
                    <Text className="text-xs text-emerald-600">Connecté</Text>
                    {isDemo && (
                      <View className="ml-2 px-2 py-0.5 rounded-full bg-amber-100">
                        <Text className="text-xs text-amber-700 font-medium">Démo</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
              </View>
            </Pressable>

            {/* Administration PayFlow */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Administration PayFlow</Text>
              <SettingsItem
                icon={<Shield size={20} color="#8b5cf6" />}
                title="Inviter une Société A"
                subtitle="Envoyer des accès prestataires"
                onPress={() => router.push('/invite-user')}
              />
              <SettingsItem
                icon={<Users size={20} color="#64748b" />}
                title="Gérer les prestataires"
                subtitle="Sociétés A inscrites"
                onPress={() => router.push('/clients')}
              />
              <SettingsItem
                icon={<CreditCard size={20} color="#64748b" />}
                title="Facturation abonnements"
                subtitle="Factures PayFlow aux Sociétés A"
                onPress={() => router.push('/subscription')}
              />
            </View>

            {/* Mon compte */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Mon compte</Text>
              <SettingsItem
                icon={<User size={20} color="#64748b" />}
                title="Mon profil"
                subtitle="Informations personnelles"
                onPress={() => router.push('/settings-detail?section=profile')}
              />
              <SettingsItem
                icon={<Bell size={20} color="#64748b" />}
                title="Notifications"
                subtitle="Gérer les alertes"
                onPress={() => router.push('/settings-detail?section=notifications')}
              />
              <SettingsItem
                icon={<Lock size={20} color="#64748b" />}
                title="Sécurité"
                subtitle="Mot de passe et 2FA"
                onPress={() => router.push('/settings-detail?section=security')}
              />
            </View>

            {/* Application */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Application</Text>
              <SettingsItem
                icon={<MessageCircle size={20} color="#6366f1" />}
                title="Assistant PayFlow"
                subtitle="Chat intelligent, aide et documents"
                onPress={() => router.push('/chat-assistant')}
              />
              <SettingsItem
                icon={<Moon size={20} color="#64748b" />}
                title={t('settings.appearance')}
                subtitle={themeNames[actualTheme]}
                onPress={() => router.push('/settings-detail?section=appearance')}
              />
              <SettingsItem
                icon={<Globe size={20} color="#64748b" />}
                title={t('settings.language')}
                subtitle={languageNames[language]}
                onPress={() => router.push('/settings-detail?section=language')}
              />
              <SettingsItem
                icon={<HelpCircle size={20} color="#64748b" />}
                title={t('settings.help')}
                subtitle={t('settings.help_subtitle')}
                onPress={() => router.push('/settings-detail?section=help')}
              />
              <SettingsItem
                icon={<Scale size={20} color="#64748b" />}
                title="Informations légales"
                subtitle="CGU, CGV, Confidentialité"
                onPress={() => router.push('/legal')}
              />
            </View>

            {/* Déconnexion */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <SettingsItem
                icon={<LogOut size={20} color="#ef4444" />}
                title="Se déconnecter"
                showArrow={false}
                danger
                onPress={handleLogout}
              />
            </View>

            {/* Mode démo - Admin only */}
            {isDemo && <UserTypeSelector />}
            <AppModeSelector />

            <Text className="text-center text-slate-400 text-xs mt-4 mb-2">
              PayFlow v1.0.0
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============ SOCIÉTÉ A (Prestataire) ============
  if (userType === 'societe_a') {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-2 pb-6">
            <Text className="text-2xl font-bold text-slate-900 mb-6">Paramètres</Text>

            {/* Profile Card */}
            <Pressable
              onPress={() => router.push('/settings-detail?section=profile')}
              className="bg-white rounded-2xl p-5 mb-6 border border-slate-100 active:opacity-70"
            >
              <View className="flex-row items-center gap-4">
                <LinearGradient
                  colors={['#3b82f6', '#6366f1']}
                  style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="text-white font-bold text-xl">
                    {userName.split(' ').map(n => n[0]).join('')}
                  </Text>
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-900">{userName}</Text>
                  <Text className="text-slate-500">{userRole}</Text>
                  <View className="flex-row items-center gap-1 mt-1">
                    <View className="w-2 h-2 rounded-full bg-emerald-500" />
                    <Text className="text-xs text-emerald-600">Connecté</Text>
                    {isDemo && (
                      <View className="ml-2 px-2 py-0.5 rounded-full bg-amber-100">
                        <Text className="text-xs text-amber-700 font-medium">Démo</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
              </View>
            </Pressable>

            {/* Mon entreprise */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Mon entreprise</Text>
              <SettingsItem
                icon={<Building2 size={20} color="#3b82f6" />}
                title="Informations société"
                subtitle="TalentFlow SAS"
                onPress={() => router.push('/settings-detail?section=company')}
              />
              <SettingsItem
                icon={<FileText size={20} color="#64748b" />}
                title="Modèles de documents"
                subtitle="Bulletins, factures"
                onPress={() => router.push('/settings-detail?section=templates')}
              />
              <SettingsItem
                icon={<CreditCard size={20} color="#64748b" />}
                title="Paramètres de facturation"
                subtitle="TVA, mentions légales"
                onPress={() => router.push('/settings-detail?section=billing')}
              />
            </View>

            {/* Gestion clients & employés */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Gestion</Text>
              <SettingsItem
                icon={<UserPlus size={20} color="#10b981" />}
                title="Inviter des utilisateurs"
                subtitle="Sociétés B et employés"
                onPress={() => router.push('/invite-user')}
              />
              <SettingsItem
                icon={<Users size={20} color="#64748b" />}
                title="Gestion des clients"
                subtitle="Entreprises clientes"
                onPress={() => router.push('/clients')}
              />
              <SettingsItem
                icon={<Briefcase size={20} color="#64748b" />}
                title="Gestion des employés"
                subtitle="Salariés portés"
                onPress={() => router.push('/settings-detail?section=employees')}
              />
              <SettingsItem
                icon={<History size={20} color="#64748b" />}
                title="Historique des suppressions"
                subtitle="Clients et employés supprimés"
                onPress={() => router.push('/deletion-history')}
              />
            </View>

            {/* Abonnement PayFlow */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Abonnement</Text>
              <SettingsItem
                icon={<CreditCard size={20} color="#8b5cf6" />}
                title="Mon abonnement PayFlow"
                subtitle="Factures et paiements"
                onPress={() => router.push('/subscription')}
              />
            </View>

            {/* Mon compte */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Mon compte</Text>
              <SettingsItem
                icon={<User size={20} color="#64748b" />}
                title="Mon profil"
                subtitle="Informations personnelles"
                onPress={() => router.push('/settings-detail?section=profile')}
              />
              <SettingsItem
                icon={<Bell size={20} color="#64748b" />}
                title="Notifications"
                subtitle="Gérer les alertes"
                onPress={() => router.push('/settings-detail?section=notifications')}
              />
              <SettingsItem
                icon={<Lock size={20} color="#64748b" />}
                title="Sécurité"
                subtitle="Mot de passe et 2FA"
                onPress={() => router.push('/settings-detail?section=security')}
              />
            </View>

            {/* Application */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Application</Text>
              <SettingsItem
                icon={<MessageCircle size={20} color="#6366f1" />}
                title="Assistant PayFlow"
                subtitle="Chat intelligent, aide et documents"
                onPress={() => router.push('/chat-assistant')}
              />
              <SettingsItem
                icon={<Moon size={20} color="#64748b" />}
                title={t('settings.appearance')}
                subtitle={themeNames[actualTheme]}
                onPress={() => router.push('/settings-detail?section=appearance')}
              />
              <SettingsItem
                icon={<Globe size={20} color="#64748b" />}
                title={t('settings.language')}
                subtitle={languageNames[language]}
                onPress={() => router.push('/settings-detail?section=language')}
              />
              <SettingsItem
                icon={<HelpCircle size={20} color="#64748b" />}
                title={t('settings.help')}
                subtitle={t('settings.help_subtitle')}
                onPress={() => router.push('/settings-detail?section=help')}
              />
              <SettingsItem
                icon={<Scale size={20} color="#64748b" />}
                title="Informations légales"
                subtitle="CGU, CGV, Confidentialité"
                onPress={() => router.push('/legal')}
              />
            </View>

            {/* Déconnexion */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <SettingsItem
                icon={<LogOut size={20} color="#ef4444" />}
                title="Se déconnecter"
                showArrow={false}
                danger
                onPress={handleLogout}
              />
            </View>

            <Text className="text-center text-slate-400 text-xs mt-4 mb-2">
              PayFlow v1.0.0
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============ SOCIÉTÉ B (Client employeur) ============
  if (userType === 'societe_b') {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-2 pb-6">
            <Text className="text-2xl font-bold text-slate-900 mb-6">Paramètres</Text>

            {/* Profile Card */}
            <Pressable
              onPress={() => router.push('/settings-detail?section=profile')}
              className="bg-white rounded-2xl p-5 mb-6 border border-slate-100 active:opacity-70"
            >
              <View className="flex-row items-center gap-4">
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="text-white font-bold text-xl">
                    {userName.split(' ').map(n => n[0]).join('')}
                  </Text>
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-900">{userName}</Text>
                  <Text className="text-slate-500">{userRole}</Text>
                  <View className="flex-row items-center gap-1 mt-1">
                    <View className="w-2 h-2 rounded-full bg-emerald-500" />
                    <Text className="text-xs text-emerald-600">Connecté</Text>
                    {isDemo && (
                      <View className="ml-2 px-2 py-0.5 rounded-full bg-amber-100">
                        <Text className="text-xs text-amber-700 font-medium">Démo</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
              </View>
            </Pressable>

            {/* Mon entreprise */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Mon entreprise</Text>
              <SettingsItem
                icon={<Building2 size={20} color="#10b981" />}
                title="Informations société"
                subtitle="TechCorp Industries"
                onPress={() => router.push('/settings-detail?section=company')}
              />
              <SettingsItem
                icon={<Upload size={20} color="#64748b" />}
                title="Documents entreprise"
                subtitle="KBIS, CNI gérant, RIB, contrat"
                onPress={() => router.push('/settings-detail?section=company-documents')}
              />
            </View>

            {/* Ressources humaines */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Ressources Humaines</Text>
              <SettingsItem
                icon={<UserPlus size={20} color="#f59e0b" />}
                title="Inviter des employés"
                subtitle="Envoyer des accès aux salariés"
                onPress={() => router.push('/invite-user?type=employe')}
              />
              <SettingsItem
                icon={<Users size={20} color="#64748b" />}
                title="Mon équipe"
                subtitle="Collaborateurs rattachés"
                onPress={() => router.push('/settings-detail?section=team')}
              />
              <SettingsItem
                icon={<FileText size={20} color="#64748b" />}
                title="Contrats"
                subtitle="Gestion des contrats"
                onPress={() => router.push('/settings-detail?section=contracts')}
              />
            </View>

            {/* Mon compte */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Mon compte</Text>
              <SettingsItem
                icon={<User size={20} color="#64748b" />}
                title="Mon profil"
                subtitle="Informations personnelles"
                onPress={() => router.push('/settings-detail?section=profile')}
              />
              <SettingsItem
                icon={<Bell size={20} color="#64748b" />}
                title="Notifications"
                subtitle="Gérer les alertes"
                onPress={() => router.push('/settings-detail?section=notifications')}
              />
              <SettingsItem
                icon={<Lock size={20} color="#64748b" />}
                title="Sécurité"
                subtitle="Mot de passe et 2FA"
                onPress={() => router.push('/settings-detail?section=security')}
              />
            </View>

            {/* Application */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Application</Text>
              <SettingsItem
                icon={<MessageCircle size={20} color="#6366f1" />}
                title="Assistant PayFlow"
                subtitle="Chat intelligent, aide et documents"
                onPress={() => router.push('/chat-assistant')}
              />
              <SettingsItem
                icon={<Moon size={20} color="#64748b" />}
                title={t('settings.appearance')}
                subtitle={themeNames[actualTheme]}
                onPress={() => router.push('/settings-detail?section=appearance')}
              />
              <SettingsItem
                icon={<Globe size={20} color="#64748b" />}
                title={t('settings.language')}
                subtitle={languageNames[language]}
                onPress={() => router.push('/settings-detail?section=language')}
              />
              <SettingsItem
                icon={<HelpCircle size={20} color="#64748b" />}
                title={t('settings.help')}
                subtitle={t('settings.help_subtitle')}
                onPress={() => router.push('/settings-detail?section=help')}
              />
              <SettingsItem
                icon={<Scale size={20} color="#64748b" />}
                title="Informations légales"
                subtitle="CGU, CGV, Confidentialité"
                onPress={() => router.push('/legal')}
              />
            </View>

            {/* Déconnexion */}
            <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
              <SettingsItem
                icon={<LogOut size={20} color="#ef4444" />}
                title="Se déconnecter"
                showArrow={false}
                danger
                onPress={handleLogout}
              />
            </View>

            <Text className="text-center text-slate-400 text-xs mt-4 mb-2">
              PayFlow v1.0.0
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============ EMPLOYÉ ============
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-2 pb-6">
          <Text className="text-2xl font-bold text-slate-900 mb-6">Paramètres</Text>

          {/* Profile Card */}
          <Pressable
            onPress={() => router.push('/settings-detail?section=profile')}
            className="bg-white rounded-2xl p-5 mb-6 border border-slate-100 active:opacity-70"
          >
            <View className="flex-row items-center gap-4">
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="text-white font-bold text-xl">
                  {userName.split(' ').map(n => n[0]).join('')}
                </Text>
              </LinearGradient>
              <View className="flex-1">
                <Text className="text-lg font-bold text-slate-900">{userName}</Text>
                <Text className="text-slate-500">{userRole}</Text>
                <View className="flex-row items-center gap-1 mt-1">
                  <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Text className="text-xs text-emerald-600">Connecté</Text>
                  {isDemo && (
                    <View className="ml-2 px-2 py-0.5 rounded-full bg-amber-100">
                      <Text className="text-xs text-amber-700 font-medium">Démo</Text>
                    </View>
                  )}
                </View>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </View>
          </Pressable>

          {/* Mon travail */}
          <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
            <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Mon travail</Text>
            <SettingsItem
              icon={<Briefcase size={20} color="#f59e0b" />}
              title="Mon contrat"
              subtitle="Informations contractuelles"
              onPress={() => router.push('/settings-detail?section=mycontract')}
            />
            <SettingsItem
              icon={<FileText size={20} color="#64748b" />}
              title="Mes documents"
              subtitle="Bulletins, contrats"
              onPress={() => router.push('/settings-detail?section=documents')}
            />
          </View>

          {/* Mes informations */}
          <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
            <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Mes informations</Text>
            <SettingsItem
              icon={<CreditCard size={20} color="#64748b" />}
              title="Coordonnées bancaires"
              subtitle="RIB et paiements"
              onPress={() => router.push('/settings-detail?section=bank')}
            />
            <SettingsItem
              icon={<Upload size={20} color="#64748b" />}
              title="Mes justificatifs"
              subtitle="CNI, Carte Vitale, RIB"
              onPress={() => router.push('/settings-detail?section=employee-documents')}
            />
          </View>

          {/* Mon compte */}
          <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
            <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Mon compte</Text>
            <SettingsItem
              icon={<User size={20} color="#64748b" />}
              title="Mon profil"
              subtitle="Informations personnelles"
              onPress={() => router.push('/settings-detail?section=profile')}
            />
            <SettingsItem
              icon={<Bell size={20} color="#64748b" />}
              title="Notifications"
              subtitle="Gérer les alertes"
              onPress={() => router.push('/settings-detail?section=notifications')}
            />
            <SettingsItem
              icon={<Lock size={20} color="#64748b" />}
              title="Sécurité"
              subtitle="Mot de passe et 2FA"
              onPress={() => router.push('/settings-detail?section=security')}
            />
          </View>

          {/* Application */}
          <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
            <Text className="text-xs font-medium text-slate-400 uppercase tracking-wider pt-4 pb-2">Application</Text>
            <SettingsItem
              icon={<MessageCircle size={20} color="#6366f1" />}
              title="Assistant PayFlow"
              subtitle="Chat intelligent, aide et documents"
              onPress={() => router.push('/chat-assistant')}
            />
            <SettingsItem
              icon={<Moon size={20} color="#64748b" />}
              title={t('settings.appearance')}
              subtitle={themeNames[actualTheme]}
              onPress={() => router.push('/settings-detail?section=appearance')}
            />
            <SettingsItem
              icon={<Globe size={20} color="#64748b" />}
              title={t('settings.language')}
              subtitle={languageNames[language]}
              onPress={() => router.push('/settings-detail?section=language')}
            />
            <SettingsItem
              icon={<HelpCircle size={20} color="#64748b" />}
              title={t('settings.help')}
              subtitle={t('settings.help_subtitle')}
              onPress={() => router.push('/settings-detail?section=help')}
            />
            <SettingsItem
              icon={<Scale size={20} color="#64748b" />}
              title="Informations légales"
              subtitle="CGU, CGV, Confidentialité"
              onPress={() => router.push('/legal')}
            />
          </View>

          {/* Déconnexion */}
          <View className="bg-white rounded-2xl px-4 mb-6 border border-slate-100">
            <SettingsItem
              icon={<LogOut size={20} color="#ef4444" />}
              title="Se déconnecter"
              showArrow={false}
              danger
              onPress={handleLogout}
            />
          </View>

          <Text className="text-center text-slate-400 text-xs mt-4 mb-2">
            PayFlow v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
