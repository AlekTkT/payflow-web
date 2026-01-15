import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Building2,
  Users,
  Euro,
  FileText,
  Calendar,
  Plus,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  UserPlus,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Wallet,
  BarChart3,
  Bell,
} from 'lucide-react-native';
import { useUserType, useAppMode } from '@/lib/state/app-store';
import { useSocietesA, useSubscriptionInvoices, useRealPayslips, useSocietesB, useRealEmployees, useRealMonthlyVariables, useClientInvoices, type SocieteB, type RealPayslip } from '@/lib/state/data-store';
import { useCompanies, useEmployees, useInvoices, usePayslips, useAllMonthlyVariables, type MonthlyVariablesWithEmployee } from '@/lib/hooks/usePayflow';
import type { Company, Payslip } from '@/lib/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// Elegant stat card with glass effect
function GlassStatCard({
  icon,
  label,
  value,
  subtitle,
  colors,
  delay = 0,
  onPress
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  colors: readonly [string, string];
  delay?: number;
  onPress?: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} className="flex-1">
      <Pressable
        onPress={() => {
          if (onPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
          }
        }}
        style={({ pressed }) => ({ opacity: pressed && onPress ? 0.9 : 1, transform: [{ scale: pressed && onPress ? 0.98 : 1 }] })}
      >
        <LinearGradient
          colors={[...colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 16, minHeight: 110 }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              {icon}
            </View>
            {onPress && <ArrowUpRight size={16} color="rgba(255,255,255,0.6)" />}
          </View>
          <Text className="text-white/70 text-xs font-medium mb-1">{label}</Text>
          <Text className="text-white text-2xl font-bold">{value}</Text>
          {subtitle && <Text className="text-white/60 text-xs mt-1">{subtitle}</Text>}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Quick action button
function QuickAction({
  icon,
  label,
  onPress,
  delay = 0,
  variant = 'default'
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  delay?: number;
  variant?: 'default' | 'primary';
}) {
  return (
    <Animated.View entering={FadeInRight.delay(delay).springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        className={`flex-row items-center justify-between px-4 py-4 rounded-2xl ${
          variant === 'primary' ? 'bg-indigo-500' : 'bg-white border border-slate-100'
        }`}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <View className="flex-row items-center gap-3">
          <View className={`w-10 h-10 rounded-xl items-center justify-center ${
            variant === 'primary' ? 'bg-white/20' : 'bg-slate-50'
          }`}>
            {icon}
          </View>
          <Text className={`font-semibold ${variant === 'primary' ? 'text-white' : 'text-slate-900'}`}>
            {label}
          </Text>
        </View>
        <ChevronRight size={20} color={variant === 'primary' ? 'rgba(255,255,255,0.6)' : '#94a3b8'} />
      </Pressable>
    </Animated.View>
  );
}

// Activity item
function ActivityItem({
  icon,
  iconBg,
  title,
  subtitle,
  value,
  valueColor = 'text-slate-900',
  delay = 0
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  value?: string;
  valueColor?: string;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInRight.delay(delay).springify()}
      className="flex-row items-center py-3"
    >
      <View className={`w-11 h-11 rounded-full items-center justify-center ${iconBg}`}>
        {icon}
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-slate-900 font-semibold">{title}</Text>
        <Text className="text-slate-500 text-sm">{subtitle}</Text>
      </View>
      {value && (
        <Text className={`font-bold ${valueColor}`}>{value}</Text>
      )}
    </Animated.View>
  );
}

// Section header
function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-slate-900 text-lg font-bold">{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} className="flex-row items-center">
          <Text className="text-indigo-500 font-medium text-sm">{action}</Text>
          <ChevronRight size={16} color="#6366f1" />
        </Pressable>
      )}
    </View>
  );
}

// Welcome header component
function WelcomeHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onAction
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100).springify()}
      className="flex-row items-start justify-between mb-6"
    >
      <View className="flex-1">
        <Text className="text-slate-900 text-2xl font-bold tracking-tight">{title}</Text>
        <Text className="text-slate-500 mt-1">{subtitle}</Text>
      </View>
      {onAction && actionLabel && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAction();
          }}
          className="bg-slate-900 rounded-2xl px-4 py-3 flex-row items-center gap-2"
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          {actionIcon}
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// Empty state component
function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  colors
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  colors: readonly [string, string];
}) {
  return (
    <Animated.View entering={FadeInDown.delay(200).springify()}>
      <View className="bg-white rounded-3xl p-8 items-center border border-slate-100">
        <LinearGradient
          colors={[...colors]}
          style={{ width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}
        >
          {icon}
        </LinearGradient>
        <Text className="text-xl font-bold text-slate-900 mb-2 text-center">{title}</Text>
        <Text className="text-slate-500 text-center mb-6 leading-relaxed">{description}</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAction();
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <LinearGradient
            colors={[...colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <Sparkles size={18} color="white" />
            <Text className="text-white font-semibold">{actionLabel}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// Demo data
const DEMO_SOCIETES_A = [
  { id: '1', name: 'TalentFlow SAS', status: 'active', plan: 'Pro', amount: 99, employees: 45, since: '2024-01-15' },
  { id: '2', name: 'PayPro Services', status: 'active', plan: 'Business', amount: 199, employees: 120, since: '2024-02-01' },
  { id: '3', name: 'RH Solutions', status: 'active', plan: 'Pro', amount: 99, employees: 32, since: '2024-03-10' },
  { id: '4', name: 'Portage Expert', status: 'trial', plan: 'Essai', amount: 0, employees: 8, since: '2024-12-01' },
  { id: '5', name: 'FlexWork SARL', status: 'active', plan: 'Starter', amount: 49, employees: 15, since: '2024-06-20' },
];

// ============================================
// ADMIN APP DASHBOARD
// ============================================
function AdminAppDashboard() {
  const appMode = useAppMode();
  const storedSocietesA = useSocietesA();
  const storedSubscriptions = useSubscriptionInvoices();

  const societesA = appMode === 'real' ? storedSocietesA : DEMO_SOCIETES_A.map(s => ({
    ...s,
    employeesCount: s.employees,
    clientsCount: 0,
    email: '',
    phone: '',
    siret: '',
    address: '',
  }));

  const activeSocietesA = societesA.filter(s => s.status === 'active').length;
  const trialSocietesA = societesA.filter(s => s.status === 'trial').length;
  const monthlyRevenue = societesA.reduce((sum, s) => sum + (s.status === 'active' ? s.amount : 0), 0);
  const totalEmployees = societesA.reduce((sum, s) => sum + (s.employeesCount || 0), 0);

  const starterCount = societesA.filter(s => s.plan === 'Starter').length;
  const proCount = societesA.filter(s => s.plan === 'Pro').length;
  const businessCount = societesA.filter(s => s.plan === 'Business').length;

  // Empty state
  if (appMode === 'real' && societesA.length === 0) {
    return (
      <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4 pb-8">
          <WelcomeHeader
            title="PayFlow Admin"
            subtitle="Gérez votre plateforme SaaS"
          />
          <EmptyState
            icon={<Building2 size={36} color="white" />}
            title="Bienvenue sur PayFlow"
            description="Votre tableau de bord est prêt. Invitez votre première Société A pour commencer à développer votre activité."
            actionLabel="Inviter une Société A"
            onAction={() => router.push('/invite-user')}
            colors={['#8b5cf6', '#6366f1'] as const}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="px-5 pt-4 pb-8">
        <WelcomeHeader
          title="PayFlow Admin"
          subtitle={`${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`}
          actionLabel="Inviter"
          actionIcon={<UserPlus size={16} color="white" />}
          onAction={() => router.push('/invite-user')}
        />

        {/* Stats Grid */}
        <View className="flex-row gap-3 mb-4">
          <GlassStatCard
            icon={<Euro size={20} color="white" />}
            label="Revenus mensuels"
            value={monthlyRevenue >= 1000 ? `${(monthlyRevenue / 1000).toFixed(1)}K€` : `${monthlyRevenue}€`}
            subtitle={`${activeSocietesA} abonnements`}
            colors={['#6366f1', '#8b5cf6'] as const}
            delay={100}
            onPress={() => router.push('/(tabs)/invoices')}
          />
          <GlassStatCard
            icon={<Building2 size={20} color="white" />}
            label="Sociétés actives"
            value={activeSocietesA}
            subtitle={trialSocietesA > 0 ? `${trialSocietesA} en essai` : 'Toutes actives'}
            colors={['#10b981', '#059669'] as const}
            delay={150}
            onPress={() => router.push('/(tabs)/employees')}
          />
        </View>

        <View className="flex-row gap-3 mb-6">
          <GlassStatCard
            icon={<Users size={20} color="white" />}
            label="Employés gérés"
            value={totalEmployees}
            subtitle="Sur la plateforme"
            colors={['#3b82f6', '#2563eb'] as const}
            delay={200}
          />
          <GlassStatCard
            icon={<TrendingUp size={20} color="white" />}
            label="Projection annuelle"
            value={`${((monthlyRevenue * 12) / 1000).toFixed(0)}K€`}
            subtitle="Revenu estimé"
            colors={['#f59e0b', '#d97706'] as const}
            delay={250}
          />
        </View>

        {/* Plan Distribution */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-6">
          <View className="bg-white rounded-2xl p-5 border border-slate-100">
            <SectionTitle title="Répartition des plans" />
            <View className="flex-row gap-3">
              <View className="flex-1 bg-violet-50 rounded-xl p-4 items-center border border-violet-100">
                <Text className="text-3xl font-bold text-violet-600">{starterCount}</Text>
                <Text className="text-xs text-violet-600 font-medium mt-1">Starter</Text>
                <Text className="text-xs text-violet-400">49€/mois</Text>
              </View>
              <View className="flex-1 bg-indigo-50 rounded-xl p-4 items-center border border-indigo-100">
                <Text className="text-3xl font-bold text-indigo-600">{proCount}</Text>
                <Text className="text-xs text-indigo-600 font-medium mt-1">Pro</Text>
                <Text className="text-xs text-indigo-400">99€/mois</Text>
              </View>
              <View className="flex-1 bg-blue-50 rounded-xl p-4 items-center border border-blue-100">
                <Text className="text-3xl font-bold text-blue-600">{businessCount}</Text>
                <Text className="text-xs text-blue-600 font-medium mt-1">Business</Text>
                <Text className="text-xs text-blue-400">199€/mois</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Recent Sociétés */}
        <Animated.View entering={FadeInDown.delay(350).springify()} className="mb-6">
          <View className="bg-white rounded-2xl p-5 border border-slate-100">
            <SectionTitle title="Sociétés récentes" action="Voir tout" onAction={() => router.push('/(tabs)/employees')} />
            {societesA.slice(0, 4).map((societe, index) => (
              <Pressable
                key={societe.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(tabs)/employees');
                }}
                className="flex-row items-center py-3 border-b border-slate-50"
              >
                <LinearGradient
                  colors={societe.status === 'active' ? ['#8b5cf6', '#7c3aed'] : ['#f59e0b', '#d97706']}
                  style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="text-white font-bold text-lg">{societe.name.charAt(0)}</Text>
                </LinearGradient>
                <View className="flex-1 ml-3">
                  <Text className="font-semibold text-slate-900">{societe.name}</Text>
                  <Text className="text-sm text-slate-500">{societe.employeesCount} employés</Text>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-slate-900">{societe.amount}€</Text>
                  <View className={`px-2 py-0.5 rounded-full ${societe.status === 'active' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    <Text className={`text-xs font-medium ${societe.status === 'active' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {societe.plan}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View className="gap-3">
          <QuickAction
            icon={<CreditCard size={20} color="#6366f1" />}
            label="Gérer les abonnements"
            onPress={() => router.push('/(tabs)/invoices')}
            delay={400}
          />
          <QuickAction
            icon={<BarChart3 size={20} color="#6366f1" />}
            label="Voir les statistiques"
            onPress={() => router.push('/(tabs)/employees')}
            delay={450}
          />
        </View>
      </View>
    </ScrollView>
  );
}

// ============================================
// PRESTATAIRE (SOCIÉTÉ A) DASHBOARD
// ============================================
function PrestataireDashboard() {
  const appMode = useAppMode();
  const { data: companies, isLoading: loadingCompanies } = useCompanies();
  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: submittedVariables } = useAllMonthlyVariables(undefined, undefined, 'submitted');

  const storedSocietesB = useSocietesB();
  const storedEmployees = useRealEmployees();
  const storedInvoices = useClientInvoices();
  const storedVariables = useRealMonthlyVariables();

  const clientCompanies = appMode === 'real' ? storedSocietesB : (companies?.filter(c => c.type === 'client') ?? []);
  const allEmployees = appMode === 'real' ? storedEmployees : (employees ?? []);
  const allInvoices = appMode === 'real' ? storedInvoices : (invoices ?? []);
  const pendingInvoices = appMode === 'real'
    ? storedInvoices.filter(i => i.status === 'sent' || i.status === 'overdue')
    : (invoices?.filter(i => i.status === 'sent' || i.status === 'overdue') ?? []);
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const pendingVariables = appMode === 'real'
    ? storedVariables.filter(v => v.status === 'submitted')
    : (submittedVariables ?? []);

  const isLoading = appMode === 'demo' && (loadingCompanies || loadingEmployees || loadingInvoices);

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-500 mt-4">Chargement...</Text>
      </View>
    );
  }

  // Empty state
  if (appMode === 'real' && storedSocietesB.length === 0) {
    return (
      <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4 pb-8">
          <WelcomeHeader
            title="Tableau de bord"
            subtitle="Gestion de paie"
          />
          <EmptyState
            icon={<Building2 size={36} color="white" />}
            title="Bienvenue sur PayFlow"
            description="Commencez par ajouter votre premier client pour gérer leurs employés et bulletins de paie."
            actionLabel="Ajouter un client"
            onAction={() => router.push('/add-client')}
            colors={['#6366f1', '#4f46e5'] as const}
          />

          <View className="mt-6 gap-3">
            <QuickAction
              icon={<UserPlus size={20} color="#6366f1" />}
              label="Inviter un client"
              onPress={() => router.push('/invite-user')}
              delay={300}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="px-5 pt-4 pb-8">
        <WelcomeHeader
          title="Tableau de bord"
          subtitle={`${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`}
          actionLabel="+ Client"
          actionIcon={<Plus size={16} color="white" />}
          onAction={() => router.push('/add-client')}
        />

        {/* Stats Grid */}
        <View className="flex-row gap-3 mb-4">
          <GlassStatCard
            icon={<Building2 size={20} color="white" />}
            label="Clients actifs"
            value={clientCompanies.length}
            subtitle="Entreprises"
            colors={['#6366f1', '#4f46e5'] as const}
            delay={100}
            onPress={() => router.push('/clients')}
          />
          <GlassStatCard
            icon={<Users size={20} color="white" />}
            label="Employés"
            value={allEmployees.length}
            subtitle="Salariés portés"
            colors={['#10b981', '#059669'] as const}
            delay={150}
            onPress={() => router.push('/(tabs)/employees')}
          />
        </View>

        <View className="flex-row gap-3 mb-6">
          <GlassStatCard
            icon={<FileText size={20} color="white" />}
            label="Factures"
            value={allInvoices.length}
            subtitle="Ce mois"
            colors={['#3b82f6', '#2563eb'] as const}
            delay={200}
            onPress={() => router.push('/(tabs)/invoices')}
          />
          <GlassStatCard
            icon={<Clock size={20} color="white" />}
            label="En attente"
            value={pendingInvoices.length}
            subtitle={pendingAmount > 0 ? `${(pendingAmount / 1000).toFixed(0)}K€` : 'Aucune'}
            colors={['#f59e0b', '#d97706'] as const}
            delay={250}
            onPress={() => router.push('/(tabs)/invoices')}
          />
        </View>

        {/* Variables to validate */}
        {pendingVariables.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-6">
            <View className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-blue-500" />
                  <Text className="text-lg font-bold text-slate-900">Variables à valider</Text>
                </View>
                <View className="bg-blue-500 px-3 py-1 rounded-full">
                  <Text className="text-xs font-bold text-white">{pendingVariables.length}</Text>
                </View>
              </View>
              <Text className="text-sm text-slate-600 mb-4">
                Variables saisies par vos clients en attente de validation
              </Text>
              {pendingVariables.slice(0, 3).map((variable, index) => {
                const varData = appMode === 'real' ? variable : variable as MonthlyVariablesWithEmployee;
                const name = appMode === 'real'
                  ? (varData as typeof storedVariables[0]).employeeName
                  : (varData as MonthlyVariablesWithEmployee).employee?.full_name;
                const hours = appMode === 'real'
                  ? (varData as typeof storedVariables[0]).hoursWorked
                  : (varData as MonthlyVariablesWithEmployee).hours_worked;
                const month = MONTH_NAMES[parseInt(variable.month) - 1];

                return (
                  <Pressable
                    key={variable.id}
                    onPress={() => router.push('/generate-payslip')}
                    className="flex-row items-center py-3 border-b border-blue-100"
                  >
                    <LinearGradient
                      colors={['#3b82f6', '#2563eb']}
                      style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text className="text-white font-bold">
                        {name?.split(' ').map(n => n[0]).join('') ?? '?'}
                      </Text>
                    </LinearGradient>
                    <View className="flex-1 ml-3">
                      <Text className="font-semibold text-slate-900">{name ?? 'Employé'}</Text>
                      <Text className="text-sm text-slate-500">{month} {variable.year}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className="bg-white px-2 py-1 rounded-lg">
                        <Text className="text-xs font-medium text-blue-700">{hours}h</Text>
                      </View>
                      <View className="bg-blue-500 px-3 py-1.5 rounded-lg">
                        <Text className="text-xs font-bold text-white">Valider</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Clients List */}
        <Animated.View entering={FadeInDown.delay(350).springify()} className="mb-6">
          <View className="bg-white rounded-2xl p-5 border border-slate-100">
            <SectionTitle title="Vos clients" action="Voir tout" onAction={() => router.push('/clients')} />
            {clientCompanies.length > 0 ? (
              clientCompanies.slice(0, 4).map((client, index) => {
                const clientData = appMode === 'real' ? client : client;
                const name = appMode === 'real'
                  ? (clientData as SocieteB).name
                  : (clientData as Company).name;
                const clientId = appMode === 'real'
                  ? (clientData as SocieteB).id
                  : (clientData as Company).id;
                const clientEmployees = appMode === 'real'
                  ? storedEmployees.filter(e => e.societeBId === clientId)
                  : employees?.filter(e => e.client_company_id === clientId) ?? [];

                return (
                  <Pressable
                    key={clientId}
                    onPress={() => router.push('/clients')}
                    className="flex-row items-center py-3 border-b border-slate-50"
                  >
                    <LinearGradient
                      colors={['#6366f1', '#8b5cf6']}
                      style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text className="text-white font-bold text-lg">{name.charAt(0)}</Text>
                    </LinearGradient>
                    <View className="flex-1 ml-3">
                      <Text className="font-semibold text-slate-900">{name}</Text>
                      <Text className="text-sm text-slate-500">{clientEmployees.length} employés</Text>
                    </View>
                    <ChevronRight size={20} color="#94a3b8" />
                  </Pressable>
                );
              })
            ) : (
              <View className="py-6 items-center">
                <Text className="text-slate-400">Aucun client</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View className="gap-3">
          <QuickAction
            icon={<FileText size={20} color="white" />}
            label="Générer des bulletins"
            onPress={() => router.push('/generate-payslip')}
            delay={400}
            variant="primary"
          />
          <QuickAction
            icon={<Euro size={20} color="#6366f1" />}
            label="Créer une facture"
            onPress={() => router.push('/create-invoice')}
            delay={450}
          />
          <QuickAction
            icon={<UserPlus size={20} color="#6366f1" />}
            label="Inviter un utilisateur"
            onPress={() => router.push('/invite-user')}
            delay={500}
          />
        </View>
      </View>
    </ScrollView>
  );
}

// ============================================
// CLIENT (SOCIÉTÉ B) DASHBOARD
// ============================================
function ClientDashboard() {
  const appMode = useAppMode();
  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();
  const { data: allVariables } = useAllMonthlyVariables();

  const storedEmployees = useRealEmployees();
  const storedInvoices = useClientInvoices();
  const storedVariables = useRealMonthlyVariables();

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYear = now.getFullYear();

  const clientEmployees = appMode === 'real'
    ? storedEmployees
    : (employees?.filter(e => e.client_company?.name === 'TechCorp Industries') ?? []);

  const clientInvoices = appMode === 'real'
    ? storedInvoices
    : (invoices?.filter(i => i.client_company?.name === 'TechCorp Industries') ?? []);

  const pendingInvoice = clientInvoices.find(i => (i as { status: string }).status === 'sent');

  const getEmployeeVariableStatus = (employeeId: string): 'draft' | 'submitted' | 'validated' | null => {
    if (appMode === 'real') {
      const vars = storedVariables.find(
        v => v.employeeId === employeeId && v.month === currentMonth && v.year === currentYear
      );
      return vars?.status ?? null;
    }
    const vars = allVariables?.find(
      (v: MonthlyVariablesWithEmployee) => v.employee_id === employeeId && v.month === currentMonth && v.year === currentYear
    );
    return vars?.status ?? null;
  };

  const submittedCount = clientEmployees.filter(e => getEmployeeVariableStatus((e as { id: string }).id) === 'submitted').length;
  const validatedCount = clientEmployees.filter(e => getEmployeeVariableStatus((e as { id: string }).id) === 'validated').length;
  const pendingCount = clientEmployees.filter(e => !getEmployeeVariableStatus((e as { id: string }).id)).length;

  const isLoading = appMode === 'demo' && (loadingEmployees || loadingInvoices);

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-500 mt-4">Chargement...</Text>
      </View>
    );
  }

  // Empty state
  if (appMode === 'real' && storedEmployees.length === 0) {
    return (
      <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4 pb-8">
          <WelcomeHeader
            title="Tableau de bord RH"
            subtitle="Gestion des variables"
          />
          <EmptyState
            icon={<Users size={36} color="white" />}
            title="Aucun employé"
            description="Vos employés apparaîtront ici une fois ajoutés par votre prestataire de paie."
            actionLabel="Contacter le prestataire"
            onAction={() => {}}
            colors={['#6366f1', '#4f46e5'] as const}
          />

          <Animated.View entering={FadeInDown.delay(300).springify()} className="mt-6">
            <View className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <View className="flex-row items-center gap-3 mb-2">
                <Clock size={20} color="#3b82f6" />
                <Text className="font-semibold text-blue-900">En attente</Text>
              </View>
              <Text className="text-blue-700 text-sm leading-relaxed">
                Votre prestataire ajoutera vos employés. Vous pourrez ensuite saisir leurs variables mensuelles.
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="px-5 pt-4 pb-8">
        <WelcomeHeader
          title="Tableau de bord RH"
          subtitle={`${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`}
          actionLabel="Saisir"
          actionIcon={<FileText size={16} color="white" />}
          onAction={() => router.push('/client-variable-entry')}
        />

        {/* Stats Grid */}
        <View className="flex-row gap-3 mb-4">
          <GlassStatCard
            icon={<Users size={20} color="white" />}
            label="Employés"
            value={clientEmployees.length}
            subtitle="Mis à disposition"
            colors={['#6366f1', '#4f46e5'] as const}
            delay={100}
            onPress={() => router.push('/(tabs)/employees')}
          />
          <GlassStatCard
            icon={<Euro size={20} color="white" />}
            label="Facture en cours"
            value={pendingInvoice ? `${((pendingInvoice as { amount: number }).amount / 1000).toFixed(1)}K€` : '0€'}
            subtitle={pendingInvoice ? 'À régler' : 'À jour'}
            colors={pendingInvoice ? ['#f59e0b', '#d97706'] as const : ['#10b981', '#059669'] as const}
            delay={150}
            onPress={() => router.push('/(tabs)/invoices')}
          />
        </View>

        {/* Variables status */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-6">
          <View className="bg-white rounded-2xl p-5 border border-slate-100">
            <SectionTitle title="Variables du mois" />
            <View className="flex-row gap-3">
              <View className="flex-1 bg-amber-50 rounded-xl p-4 items-center border border-amber-100">
                <Text className="text-2xl font-bold text-amber-600">{pendingCount}</Text>
                <Text className="text-xs text-amber-700 font-medium mt-1">À saisir</Text>
              </View>
              <View className="flex-1 bg-blue-50 rounded-xl p-4 items-center border border-blue-100">
                <Text className="text-2xl font-bold text-blue-600">{submittedCount}</Text>
                <Text className="text-xs text-blue-700 font-medium mt-1">Soumises</Text>
              </View>
              <View className="flex-1 bg-emerald-50 rounded-xl p-4 items-center border border-emerald-100">
                <Text className="text-2xl font-bold text-emerald-600">{validatedCount}</Text>
                <Text className="text-xs text-emerald-700 font-medium mt-1">Validées</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Employees to fill */}
        {pendingCount > 0 && (
          <Animated.View entering={FadeInDown.delay(250).springify()} className="mb-6">
            <View className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Bell size={18} color="#f59e0b" />
                  <Text className="font-bold text-slate-900">Variables à saisir</Text>
                </View>
                <View className="bg-amber-500 px-3 py-1 rounded-full">
                  <Text className="text-xs font-bold text-white">{pendingCount}</Text>
                </View>
              </View>
              <Text className="text-sm text-slate-600 mb-4">
                Saisissez les heures et variables de vos employés pour ce mois.
              </Text>
              <Pressable
                onPress={() => router.push('/client-variable-entry')}
                className="bg-amber-500 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">Saisir maintenant</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Employees List */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-6">
          <View className="bg-white rounded-2xl p-5 border border-slate-100">
            <SectionTitle title="Vos employés" action="Voir tout" onAction={() => router.push('/(tabs)/employees')} />
            {clientEmployees.slice(0, 4).map((emp, index) => {
              const empData = emp as { id: string; full_name?: string; position?: string; employeeName?: string; employeePosition?: string };
              const name = empData.full_name || empData.employeeName || 'Employé';
              const position = empData.position || empData.employeePosition || '';
              const status = getEmployeeVariableStatus(empData.id);

              return (
                <Pressable
                  key={empData.id}
                  onPress={() => router.push('/client-variable-entry')}
                  className="flex-row items-center py-3 border-b border-slate-50"
                >
                  <LinearGradient
                    colors={['#6366f1', '#8b5cf6']}
                    style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text className="text-white font-bold">
                      {name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </LinearGradient>
                  <View className="flex-1 ml-3">
                    <Text className="font-semibold text-slate-900">{name}</Text>
                    <Text className="text-sm text-slate-500">{position}</Text>
                  </View>
                  <View className={`px-2.5 py-1 rounded-full ${
                    status === 'validated' ? 'bg-emerald-100' :
                    status === 'submitted' ? 'bg-blue-100' : 'bg-amber-100'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      status === 'validated' ? 'text-emerald-700' :
                      status === 'submitted' ? 'text-blue-700' : 'text-amber-700'
                    }`}>
                      {status === 'validated' ? 'Validé' : status === 'submitted' ? 'Soumis' : 'À saisir'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View className="gap-3">
          <QuickAction
            icon={<FileText size={20} color="white" />}
            label="Saisir les variables"
            onPress={() => router.push('/client-variable-entry')}
            delay={350}
            variant="primary"
          />
          <QuickAction
            icon={<Euro size={20} color="#6366f1" />}
            label="Voir les factures"
            onPress={() => router.push('/(tabs)/invoices')}
            delay={400}
          />
        </View>
      </View>
    </ScrollView>
  );
}

// ============================================
// EMPLOYEE DASHBOARD
// ============================================
function EmployeeDashboard() {
  const appMode = useAppMode();
  const { data: payslips, isLoading } = usePayslips();
  const storedPayslips = useRealPayslips();

  const employeePayslips = appMode === 'real' ? storedPayslips : (payslips ?? []);
  const latestPayslip = employeePayslips[0];

  if (isLoading && appMode === 'demo') {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-500 mt-4">Chargement...</Text>
      </View>
    );
  }

  // Empty state
  if (employeePayslips.length === 0) {
    return (
      <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4 pb-8">
          <WelcomeHeader
            title="Mon espace"
            subtitle="Bulletins et informations"
          />
          <EmptyState
            icon={<FileText size={36} color="white" />}
            title="Aucun bulletin"
            description="Vos bulletins de paie apparaîtront ici une fois générés par votre employeur."
            actionLabel="Actualiser"
            onAction={() => {}}
            colors={['#6366f1', '#4f46e5'] as const}
          />
        </View>
      </ScrollView>
    );
  }

  const latestData = appMode === 'real'
    ? latestPayslip as RealPayslip
    : latestPayslip as Payslip;

  const netSalary = appMode === 'real'
    ? (latestData as RealPayslip)?.netSalary
    : Number((latestData as Payslip)?.net_salary);

  const month = appMode === 'real'
    ? (latestData as RealPayslip)?.month
    : (latestData as Payslip)?.month;

  const year = appMode === 'real'
    ? (latestData as RealPayslip)?.year
    : (latestData as Payslip)?.year;

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="px-5 pt-4 pb-8">
        <WelcomeHeader
          title="Mon espace"
          subtitle={`${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`}
        />

        {/* Main salary card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-6">
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white/70 font-medium">Dernier salaire net</Text>
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-medium">
                  {month && year ? `${MONTH_NAMES[parseInt(month) - 1]} ${year}` : 'N/A'}
                </Text>
              </View>
            </View>
            <Text className="text-white text-4xl font-bold mb-2">
              {netSalary ? `${netSalary.toLocaleString('fr-FR')}€` : 'N/A'}
            </Text>
            <Text className="text-white/60 text-sm">Versé sur votre compte</Text>
          </LinearGradient>
        </Animated.View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-6">
          <GlassStatCard
            icon={<FileText size={20} color="white" />}
            label="Bulletins"
            value={employeePayslips.length}
            subtitle="Disponibles"
            colors={['#10b981', '#059669'] as const}
            delay={150}
            onPress={() => router.push('/(tabs)/bulletins')}
          />
          <GlassStatCard
            icon={<Calendar size={20} color="white" />}
            label="Année"
            value={new Date().getFullYear()}
            subtitle="En cours"
            colors={['#3b82f6', '#2563eb'] as const}
            delay={200}
          />
        </View>

        {/* Recent payslips */}
        <Animated.View entering={FadeInDown.delay(250).springify()} className="mb-6">
          <View className="bg-white rounded-2xl p-5 border border-slate-100">
            <SectionTitle title="Derniers bulletins" action="Voir tout" onAction={() => router.push('/(tabs)/bulletins')} />
            {employeePayslips.slice(0, 3).map((payslip, index) => {
              const pData = appMode === 'real'
                ? payslip as RealPayslip
                : payslip as Payslip;
              const pMonth = appMode === 'real' ? (pData as RealPayslip).month : (pData as Payslip).month;
              const pYear = appMode === 'real' ? (pData as RealPayslip).year : (pData as Payslip).year;
              const pNet = appMode === 'real'
                ? (pData as RealPayslip).netSalary
                : Number((pData as Payslip).net_salary);

              return (
                <Pressable
                  key={pData.id}
                  onPress={() => router.push(`/payslip-viewer?id=${pData.id}`)}
                  className="flex-row items-center py-3 border-b border-slate-50"
                >
                  <View className="w-11 h-11 rounded-xl bg-indigo-50 items-center justify-center">
                    <FileText size={20} color="#6366f1" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="font-semibold text-slate-900">
                      {MONTH_NAMES[parseInt(pMonth) - 1]} {pYear}
                    </Text>
                    <Text className="text-sm text-slate-500">Bulletin de paie</Text>
                  </View>
                  <Text className="font-bold text-slate-900">{pNet?.toLocaleString('fr-FR')}€</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View className="gap-3">
          <QuickAction
            icon={<FileText size={20} color="white" />}
            label="Voir mes bulletins"
            onPress={() => router.push('/(tabs)/bulletins')}
            delay={300}
            variant="primary"
          />
          <QuickAction
            icon={<Wallet size={20} color="#6366f1" />}
            label="Mes informations"
            onPress={() => router.push('/(tabs)/settings')}
            delay={350}
          />
        </View>
      </View>
    </ScrollView>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function HomeScreen() {
  const userType = useUserType();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {userType === 'admin_app' && <AdminAppDashboard />}
      {userType === 'societe_a' && <PrestataireDashboard />}
      {userType === 'societe_b' && <ClientDashboard />}
      {userType === 'employe' && <EmployeeDashboard />}
    </SafeAreaView>
  );
}
