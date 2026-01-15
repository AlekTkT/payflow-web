import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Search, Filter, Plus, ChevronRight, Building2, Users, UserPlus, Mail, Phone, Calendar, X } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { useUserType, useAppMode } from '@/lib/state/app-store';
import { useSocietesA, SocieteA, useRealEmployees, useSocietesB } from '@/lib/state/data-store';
import { Badge } from '@/components/payflow/ui';
import { useEmployees } from '@/lib/hooks/usePayflow';

function EmployeeCard({
  name,
  position,
  company,
  hourlyRate,
  onPress,
}: {
  name: string;
  position: string;
  company: string;
  hourlyRate: number;
  onPress?: () => void;
}) {
  const initials = name.split(' ').map(n => n[0]).join('');

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl p-4 border border-slate-100 flex-row items-center gap-4 active:bg-slate-50"
    >
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={{ width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text className="text-white font-bold text-lg">{initials}</Text>
      </LinearGradient>
      <View className="flex-1">
        <Text className="font-semibold text-slate-900 text-base">{name}</Text>
        <Text className="text-sm text-slate-500">{position}</Text>
        <Text className="text-xs text-slate-400 mt-0.5">{company}</Text>
      </View>
      <View className="items-end">
        <Text className="font-semibold text-slate-900">{hourlyRate}€/h</Text>
        <Badge label="Actif" variant="success" />
      </View>
      <ChevronRight size={20} color="#94a3b8" />
    </Pressable>
  );
}

export default function EmployeesScreen() {
  const userType = useUserType();

  // Admin App sees Sociétés A list
  if (userType === 'admin_app') {
    return <AdminAppSocietesA />;
  }

  // Société A and B see employees
  return <EmployeesList />;
}

function EmployeesList() {
  const userType = useUserType();
  const appMode = useAppMode();
  const isPrestataire = userType === 'societe_a';
  const { data: demoEmployees, isLoading } = useEmployees();
  const storedEmployees = useRealEmployees();
  const storedSocietesB = useSocietesB();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Use stored data in real mode, demo data in demo mode
  // Filter employees based on user type and search
  const baseDemoEmployees = isPrestataire
    ? demoEmployees
    : demoEmployees?.filter(e => e.client_company?.name === 'TechCorp Industries');

  const filteredEmployees = appMode === 'real'
    ? storedEmployees.filter(e => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const societeB = storedSocietesB.find(s => s.id === e.societeBId);
        return (
          e.fullName.toLowerCase().includes(query) ||
          e.position.toLowerCase().includes(query) ||
          societeB?.name?.toLowerCase().includes(query)
        );
      })
    : null;

  const filteredDemoEmployees = appMode === 'demo'
    ? baseDemoEmployees?.filter(e => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          e.full_name.toLowerCase().includes(query) ||
          e.position.toLowerCase().includes(query) ||
          e.client_company?.name?.toLowerCase().includes(query)
        );
      })
    : null;

  if (appMode === 'demo' && isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-slate-500 mt-3">Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state for real mode
  if (appMode === 'real' && storedEmployees.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-2 pb-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-2xl font-bold text-slate-900">
                  {isPrestataire ? 'Employés' : 'Mes employés'}
                </Text>
                <Text className="text-slate-500 mt-0.5">
                  {isPrestataire ? 'Tous les employés gérés' : 'Employés mis à disposition'}
                </Text>
              </View>
              {isPrestataire && (
                <Pressable
                  onPress={() => router.push('/add-employee')}
                  className="bg-indigo-500 rounded-xl px-4 py-3 flex-row items-center gap-2 active:bg-indigo-600"
                >
                  <Plus size={18} color="white" />
                  <Text className="text-white font-semibold">Ajouter</Text>
                </Pressable>
              )}
            </View>

            {/* Empty State */}
            <View className="bg-white rounded-2xl p-8 border border-slate-100 items-center mt-4">
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}
              >
                <Users size={40} color="white" />
              </LinearGradient>
              <Text className="text-xl font-bold text-slate-900 mb-2 text-center">Aucun employé</Text>
              <Text className="text-slate-500 text-center mb-6 px-4">
                {isPrestataire
                  ? 'Ajoutez vos premiers employés pour commencer à gérer leur paie et leurs contrats.'
                  : 'Vos employés apparaîtront ici une fois qu\'ils seront ajoutés par votre prestataire de paie.'}
              </Text>
              {isPrestataire && (
                <Pressable
                  onPress={() => router.push('/add-employee')}
                  className="bg-indigo-500 rounded-xl px-6 py-3 flex-row items-center gap-2 active:bg-indigo-600"
                >
                  <UserPlus size={18} color="white" />
                  <Text className="text-white font-semibold">Ajouter un employé</Text>
                </Pressable>
              )}
            </View>

            {/* Info Card */}
            {!isPrestataire && (
              <View className="bg-blue-50 rounded-2xl p-5 border border-blue-100 mt-6">
                <View className="flex-row items-center gap-3 mb-3">
                  <Users size={24} color="#3b82f6" />
                  <Text className="text-lg font-semibold text-blue-900">En attente</Text>
                </View>
                <Text className="text-blue-700">
                  Votre prestataire ajoutera les employés mis à disposition pour votre entreprise. Vous pourrez ensuite saisir leurs variables mensuelles.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-2 pb-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-2xl font-bold text-slate-900">
                {isPrestataire ? 'Employés' : 'Mes employés'}
              </Text>
              <Text className="text-slate-500 mt-0.5">
                {isPrestataire ? 'Tous les employés gérés' : 'Employés mis à disposition'}
              </Text>
            </View>
            {isPrestataire && (
              <Pressable
                onPress={() => router.push('/add-employee')}
                className="bg-indigo-500 rounded-xl px-4 py-3 flex-row items-center gap-2 active:bg-indigo-600"
              >
                <Plus size={18} color="white" />
                <Text className="text-white font-semibold">Ajouter</Text>
              </Pressable>
            )}
          </View>

          {/* Search and Filter */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-white rounded-xl px-4 py-3 flex-row items-center gap-3 border border-slate-200">
              <Search size={20} color="#94a3b8" />
              <TextInput
                className="flex-1 text-slate-900"
                placeholder="Rechercher un employé..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={18} color="#94a3b8" />
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setShowFilters(!showFilters);
              }}
              className={`bg-white rounded-xl px-4 py-3 border ${showFilters ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'} active:bg-slate-50`}
            >
              <Filter size={20} color={showFilters ? '#6366f1' : '#64748b'} />
            </Pressable>
          </View>

          {/* Stats Summary */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100">
              <Text className="text-2xl font-bold text-indigo-600">
                {appMode === 'real' ? storedEmployees.length : (baseDemoEmployees?.length ?? 0)}
              </Text>
              <Text className="text-sm text-slate-500">Total employés</Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100">
              <Text className="text-2xl font-bold text-emerald-600">
                {appMode === 'real'
                  ? storedEmployees.filter(e => e.status === 'active').length
                  : (baseDemoEmployees?.length ?? 0)}
              </Text>
              <Text className="text-sm text-slate-500">Actifs</Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100">
              <Text className="text-2xl font-bold text-amber-600">0</Text>
              <Text className="text-sm text-slate-500">En congé</Text>
            </View>
          </View>

          {/* Search Results Count */}
          {searchQuery.length > 0 && (
            <Text className="text-sm text-slate-500 mb-3">
              {appMode === 'real'
                ? (filteredEmployees?.length ?? 0)
                : (filteredDemoEmployees?.length ?? 0)} résultat(s) pour "{searchQuery}"
            </Text>
          )}

          {/* Employee List */}
          <View className="gap-3">
            {appMode === 'real' ? (
              filteredEmployees?.map((employee) => {
                const societeB = storedSocietesB.find(s => s.id === employee.societeBId);
                return (
                  <EmployeeCard
                    key={employee.id}
                    name={employee.fullName}
                    position={employee.position}
                    company={societeB?.name ?? 'N/A'}
                    hourlyRate={employee.hourlyRate}
                    onPress={() => router.push(`/employee-detail?id=${employee.id}`)}
                  />
                );
              })
            ) : (
              filteredDemoEmployees?.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  name={employee.full_name}
                  position={employee.position}
                  company={employee.client_company?.name ?? 'N/A'}
                  hourlyRate={Number(employee.hourly_rate)}
                  onPress={() => router.push(`/employee-detail?id=${employee.id}`)}
                />
              ))
            )}
          </View>

          {((appMode === 'real' && (!filteredEmployees || filteredEmployees.length === 0)) ||
            (appMode === 'demo' && (!filteredDemoEmployees || filteredDemoEmployees.length === 0))) && (
            <View className="bg-white rounded-xl p-8 border border-slate-100 items-center">
              <Text className="text-slate-500">
                {searchQuery ? 'Aucun employé trouvé pour cette recherche' : 'Aucun employé trouvé'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Demo data for Sociétés A
const DEMO_SOCIETES_A = [
  {
    id: '1',
    name: 'TalentFlow SAS',
    email: 'contact@talentflow.fr',
    phone: '+33 1 23 45 67 89',
    status: 'active',
    plan: 'Pro',
    amount: 99,
    employeesCount: 45,
    clientsCount: 8,
    since: '2024-01-15',
    siret: '123 456 789 00012',
    address: '15 Rue de la Paix, 75002 Paris',
  },
  {
    id: '2',
    name: 'PayPro Services',
    email: 'admin@paypro.fr',
    phone: '+33 1 98 76 54 32',
    status: 'active',
    plan: 'Business',
    amount: 199,
    employeesCount: 120,
    clientsCount: 15,
    since: '2024-02-01',
    siret: '987 654 321 00034',
    address: '42 Avenue des Champs-Élysées, 75008 Paris',
  },
  {
    id: '3',
    name: 'RH Solutions',
    email: 'info@rhsolutions.fr',
    phone: '+33 4 56 78 90 12',
    status: 'active',
    plan: 'Pro',
    amount: 99,
    employeesCount: 32,
    clientsCount: 5,
    since: '2024-03-10',
    siret: '456 789 012 00056',
    address: '8 Boulevard Haussmann, 75009 Paris',
  },
  {
    id: '4',
    name: 'Portage Expert',
    email: 'contact@portage-expert.fr',
    phone: '+33 1 11 22 33 44',
    status: 'trial',
    plan: 'Essai',
    amount: 0,
    employeesCount: 8,
    clientsCount: 2,
    since: '2024-12-01',
    siret: '111 222 333 00078',
    address: '25 Rue du Commerce, 75015 Paris',
  },
  {
    id: '5',
    name: 'FlexWork SARL',
    email: 'hello@flexwork.fr',
    phone: '+33 6 77 88 99 00',
    status: 'active',
    plan: 'Starter',
    amount: 49,
    employeesCount: 15,
    clientsCount: 3,
    since: '2024-06-20',
    siret: '555 666 777 00090',
    address: '100 Rue de Rivoli, 75001 Paris',
  },
  {
    id: '6',
    name: 'PortaSalaire',
    email: 'contact@portasalaire.fr',
    phone: '+33 1 55 66 77 88',
    status: 'active',
    plan: 'Pro',
    amount: 99,
    employeesCount: 58,
    clientsCount: 10,
    since: '2024-04-05',
    siret: '888 999 000 00012',
    address: '5 Place de la République, 75003 Paris',
  },
];

type FilterType = 'all' | 'active' | 'trial' | 'expired';

function SocieteACard({
  societe,
  onPress,
  onEmail,
  onCall,
}: {
  societe: typeof DEMO_SOCIETES_A[0];
  onPress?: () => void;
  onEmail?: () => void;
  onCall?: () => void;
}) {
  const planColors: Record<string, [string, string]> = {
    'Starter': ['#8b5cf6', '#7c3aed'],
    'Pro': ['#6366f1', '#4f46e5'],
    'Business': ['#3b82f6', '#2563eb'],
    'Essai': ['#f59e0b', '#d97706'],
  };

  const colors = planColors[societe.plan] || ['#6366f1', '#4f46e5'];
  const isActive = societe.status === 'active';
  const isTrial = societe.status === 'trial';

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl p-4 border border-slate-100 active:bg-slate-50"
    >
      <View className="flex-row items-start gap-4">
        <LinearGradient
          colors={colors}
          style={{ width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text className="text-white font-bold text-xl">{societe.name.charAt(0)}</Text>
        </LinearGradient>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-slate-900 text-lg">{societe.name}</Text>
            <View className={`px-2.5 py-1 rounded-lg ${isActive ? 'bg-emerald-100' : isTrial ? 'bg-amber-100' : 'bg-red-100'}`}>
              <Text className={`text-xs font-semibold ${isActive ? 'text-emerald-800' : isTrial ? 'text-amber-800' : 'text-red-800'}`}>
                {societe.plan}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-4 mt-2">
            <View className="flex-row items-center gap-1">
              <Users size={14} color="#64748b" />
              <Text className="text-sm text-slate-500">{societe.employeesCount} employés</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Building2 size={14} color="#64748b" />
              <Text className="text-sm text-slate-500">{societe.clientsCount} clients</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1 mt-1">
            <Calendar size={12} color="#94a3b8" />
            <Text className="text-xs text-slate-400">Depuis le {new Date(societe.since).toLocaleDateString('fr-FR')}</Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onEmail?.();
            }}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 active:bg-slate-100"
          >
            <Mail size={14} color="#64748b" />
            <Text className="text-xs text-slate-600">Email</Text>
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onCall?.();
            }}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 active:bg-slate-100"
          >
            <Phone size={14} color="#64748b" />
            <Text className="text-xs text-slate-600">Appeler</Text>
          </Pressable>
        </View>
        <View className="items-end">
          <Text className="font-bold text-slate-900">{societe.amount > 0 ? `${societe.amount}€/mois` : 'Gratuit'}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function AdminAppSocietesA() {
  const appMode = useAppMode();
  const storedSocietesA = useSocietesA();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Use stored data in real mode, demo data in demo mode
  const societesA: SocieteA[] = appMode === 'real' ? storedSocietesA : DEMO_SOCIETES_A as SocieteA[];

  const filterTabs: { label: string; value: FilterType }[] = [
    { label: 'Toutes', value: 'all' },
    { label: 'Actives', value: 'active' },
    { label: 'Essai', value: 'trial' },
  ];

  // Filter by status and search query
  const filteredSocietes = societesA.filter(s => {
    // Status filter
    const matchesStatus = activeFilter === 'all' ||
      (activeFilter === 'active' && s.status === 'active') ||
      (activeFilter === 'trial' && s.status === 'trial');

    // Search filter
    if (!searchQuery.trim()) return matchesStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      s.plan.toLowerCase().includes(query) ||
      s.address.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const totalRevenue = societesA.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0);
  const totalEmployees = societesA.reduce((sum, s) => sum + s.employeesCount, 0);

  const handleEmail = (email: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const subject = encodeURIComponent(`PayFlow - ${name}`);
    Linking.openURL(`mailto:${email}?subject=${subject}`).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email');
    });
  };

  const handleCall = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cleanPhone = phone.replace(/\s/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Erreur', 'Impossible de passer l\'appel');
    });
  };

  const handleSocietePress = (societe: SocieteA) => {
    Haptics.selectionAsync();
    Alert.alert(
      societe.name,
      `Plan: ${societe.plan}\nEmail: ${societe.email}\nTéléphone: ${societe.phone}\nSIRET: ${societe.siret}\nAdresse: ${societe.address}\n\nEmployés: ${societe.employeesCount}\nClients: ${societe.clientsCount}`,
      [
        { text: 'Fermer', style: 'cancel' },
        { text: 'Appeler', onPress: () => handleCall(societe.phone) },
        { text: 'Email', onPress: () => handleEmail(societe.email, societe.name) },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-2 pb-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-2xl font-bold text-slate-900">Sociétés A</Text>
              <Text className="text-slate-500 mt-0.5">Vos clients abonnés</Text>
            </View>
            <Pressable
              onPress={() => router.push('/invite-user')}
              className="bg-violet-500 rounded-xl px-4 py-3 flex-row items-center gap-2 active:bg-violet-600"
            >
              <UserPlus size={18} color="white" />
              <Text className="text-white font-semibold">Inviter</Text>
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-white rounded-xl px-4 py-3 flex-row items-center gap-3 border border-slate-200">
              <Search size={20} color="#94a3b8" />
              <TextInput
                className="flex-1 text-slate-900"
                placeholder="Rechercher une société..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={18} color="#94a3b8" />
                </Pressable>
              )}
            </View>
            <Pressable className="bg-white rounded-xl px-4 py-3 border border-slate-200 active:bg-slate-50">
              <Filter size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* Summary Stats */}
          <View className="bg-white rounded-2xl p-5 mb-6 border border-slate-100">
            <Text className="text-sm text-slate-500 mb-1">Revenus mensuels récurrents</Text>
            <Text className="text-3xl font-bold text-slate-900">{totalRevenue}€</Text>
            <View className="flex-row gap-4 mt-3 pt-3 border-t border-slate-100">
              <Pressable
                className="flex-1"
                onPress={() => setActiveFilter('active')}
              >
                <Text className="text-xs text-slate-400">Sociétés actives</Text>
                <Text className="font-semibold text-emerald-600">{societesA.filter(s => s.status === 'active').length}</Text>
              </Pressable>
              <Pressable
                className="flex-1"
                onPress={() => setActiveFilter('trial')}
              >
                <Text className="text-xs text-slate-400">En essai</Text>
                <Text className="font-semibold text-amber-600">{societesA.filter(s => s.status === 'trial').length}</Text>
              </Pressable>
              <View className="flex-1">
                <Text className="text-xs text-slate-400">Total employés</Text>
                <Text className="font-semibold text-violet-600">{totalEmployees}</Text>
              </View>
            </View>
          </View>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} className="mb-4">
            <View className="flex-row gap-2">
              {filterTabs.map((tab) => (
                <Pressable
                  key={tab.value}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveFilter(tab.value);
                  }}
                  className={`px-4 py-2 rounded-lg ${activeFilter === tab.value ? 'bg-violet-500' : 'bg-white border border-slate-200'}`}
                >
                  <Text className={`text-sm font-medium ${activeFilter === tab.value ? 'text-white' : 'text-slate-600'}`}>{tab.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Search Results Count */}
          {searchQuery.length > 0 && (
            <Text className="text-sm text-slate-500 mb-3">
              {filteredSocietes.length} résultat(s) pour "{searchQuery}"
            </Text>
          )}

          {/* Sociétés List */}
          {societesA.length > 0 ? (
            <View className="gap-3">
              {filteredSocietes.map((societe) => (
                <SocieteACard
                  key={societe.id}
                  societe={societe}
                  onPress={() => handleSocietePress(societe)}
                  onEmail={() => handleEmail(societe.email, societe.name)}
                  onCall={() => handleCall(societe.phone)}
                />
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-8 border border-slate-100 items-center">
              <View className="w-16 h-16 rounded-full bg-violet-100 items-center justify-center mb-4">
                <Building2 size={32} color="#8b5cf6" />
              </View>
              <Text className="text-lg font-semibold text-slate-900 mb-2">Aucune société</Text>
              <Text className="text-slate-500 text-center mb-4">
                Invitez votre première Société A pour commencer à gérer vos abonnements.
              </Text>
              <Pressable
                onPress={() => router.push('/invite-user')}
                className="bg-violet-500 rounded-xl px-6 py-3 flex-row items-center gap-2 active:bg-violet-600"
              >
                <UserPlus size={18} color="white" />
                <Text className="text-white font-semibold">Inviter une société</Text>
              </Pressable>
            </View>
          )}

          {filteredSocietes.length === 0 && societesA.length > 0 && (
            <View className="bg-white rounded-xl p-8 border border-slate-100 items-center">
              <Text className="text-slate-500">
                {searchQuery ? 'Aucune société trouvée pour cette recherche' : 'Aucune société trouvée'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
