import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Euro, Download, Eye, Plus, Filter, Search, Clock, Check, AlertTriangle, CreditCard, RefreshCw, FileText, Send, X, UserPlus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useUserType, useAppMode } from '@/lib/state/app-store';
import { useSubscriptionInvoices, usePayFlowInvoices, useDataStore, useClientInvoices, useRealEmployees } from '@/lib/state/data-store';
import { Badge } from '@/components/payflow/ui';
import { useInvoices, useEmployees, useUpdateInvoice } from '@/lib/hooks/usePayflow';

type FilterType = 'all' | 'sent' | 'paid' | 'overdue';

function InvoiceCard({
  id,
  number,
  client,
  amount,
  dueDate,
  employeeCount,
  status,
  showClient = true,
  isClientView = false,
}: {
  id: string;
  number: string;
  client?: string;
  amount: number;
  dueDate: string;
  employeeCount: number;
  status: string;
  showClient?: boolean;
  isClientView?: boolean;
}) {
  const updateInvoice = useUpdateInvoice();

  const statusConfig = {
    draft: { label: 'Brouillon', variant: 'neutral' as const },
    sent: { label: 'En attente', variant: 'warning' as const },
    paid: { label: 'Payée', variant: 'success' as const },
    overdue: { label: 'En retard', variant: 'danger' as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleView = () => {
    router.push(`/invoice-viewer?id=${id}`);
  };

  const handleDownload = () => {
    router.push(`/invoice-viewer?id=${id}&action=share`);
  };

  const handleMarkAsPaid = async () => {
    try {
      await updateInvoice.mutateAsync({
        id,
        status: 'paid',
        paid_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur mise à jour facture:', error);
    }
  };

  return (
    <View className="bg-white rounded-xl p-4 border border-slate-100">
      <View className="flex-row items-start gap-3">
        <LinearGradient
          colors={status === 'overdue' ? ['#ef4444', '#dc2626'] : ['#6366f1', '#8b5cf6']}
          style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
        >
          <Euro size={24} color="white" />
        </LinearGradient>
        <View className="flex-1">
          <Text className="font-semibold text-slate-900">{number}</Text>
          {showClient && client && (
            <Text className="text-sm text-slate-500">{client}</Text>
          )}
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-xs text-slate-400">{employeeCount} employés</Text>
            <Text className="text-xs text-slate-400">•</Text>
            <Text className="text-xs text-slate-400">Échéance: {formatDate(dueDate)}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-lg font-bold text-slate-900">{(amount / 1000).toFixed(1)}K€</Text>
          <Badge label={config.label} variant={config.variant} />
        </View>
      </View>
      <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-100">
        <Pressable
          onPress={handleView}
          className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg bg-slate-50 active:bg-slate-100"
        >
          <Eye size={16} color="#64748b" />
          <Text className="text-sm font-medium text-slate-600">Voir</Text>
        </Pressable>
        <Pressable
          onPress={handleDownload}
          className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg bg-slate-50 active:bg-slate-100"
        >
          <Download size={16} color="#64748b" />
          <Text className="text-sm font-medium text-slate-600">PDF</Text>
        </Pressable>
        {!isClientView && status === 'sent' && (
          <Pressable
            onPress={handleMarkAsPaid}
            disabled={updateInvoice.isPending}
            className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500 active:bg-emerald-600"
          >
            {updateInvoice.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Check size={16} color="white" />
                <Text className="text-sm font-medium text-white">Payée</Text>
              </>
            )}
          </Pressable>
        )}
        {isClientView && status === 'sent' && (
          <Pressable className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg bg-indigo-500 active:bg-indigo-600">
            <Euro size={16} color="white" />
            <Text className="text-sm font-medium text-white">Payer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function PrestaireInvoices() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: employees } = useEmployees();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingInvoices = invoices?.filter(i => i.status === 'sent' || i.status === 'overdue') ?? [];
  const totalPending = pendingInvoices.reduce((sum, i) => sum + Number(i.amount), 0);

  // Filter invoices based on active filter and search
  const filteredInvoices = invoices?.filter(invoice => {
    const matchesStatus = activeFilter === 'all' || invoice.status === activeFilter;
    if (!searchQuery.trim()) return matchesStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(query) ||
      invoice.client_company?.name?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  }) ?? [];

  const filterTabs: { label: string; value: FilterType }[] = [
    { label: 'Toutes', value: 'all' },
    { label: 'En attente', value: 'sent' },
    { label: 'Payées', value: 'paid' },
    { label: 'En retard', value: 'overdue' },
  ];

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-500 mt-3">Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="px-5 pt-2 pb-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-slate-900">Facturation</Text>
            <Text className="text-slate-500 mt-0.5">Gérez vos factures clients</Text>
          </View>
          <Pressable
            onPress={() => router.push('/create-invoice')}
            className="bg-indigo-500 rounded-xl px-4 py-3 flex-row items-center gap-2 active:bg-indigo-600"
          >
            <Plus size={18} color="white" />
            <Text className="text-white font-semibold">Créer</Text>
          </Pressable>
        </View>

        {/* Search and Filter */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white rounded-xl px-4 py-3 flex-row items-center gap-3 border border-slate-200">
            <Search size={20} color="#94a3b8" />
            <TextInput
              className="flex-1 text-slate-900"
              placeholder="Rechercher une facture..."
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

        {/* Summary Card */}
        <View className="bg-white rounded-2xl p-5 mb-6 border border-slate-100">
          <Text className="text-sm text-slate-500 mb-1">Total en attente de paiement</Text>
          <Text className="text-3xl font-bold text-slate-900">{(totalPending / 1000).toFixed(0)}K€</Text>
          <View className="flex-row gap-4 mt-3 pt-3 border-t border-slate-100">
            <Pressable className="flex-1" onPress={() => setActiveFilter('sent')}>
              <Text className="text-xs text-slate-400">En attente</Text>
              <Text className={`font-semibold ${activeFilter === 'sent' ? 'text-indigo-600' : 'text-amber-600'}`}>
                {invoices?.filter(i => i.status === 'sent').length ?? 0} factures
              </Text>
            </Pressable>
            <Pressable className="flex-1" onPress={() => setActiveFilter('overdue')}>
              <Text className="text-xs text-slate-400">En retard</Text>
              <Text className={`font-semibold ${activeFilter === 'overdue' ? 'text-indigo-600' : 'text-red-600'}`}>
                {invoices?.filter(i => i.status === 'overdue').length ?? 0} factures
              </Text>
            </Pressable>
            <Pressable className="flex-1" onPress={() => setActiveFilter('paid')}>
              <Text className="text-xs text-slate-400">Payées</Text>
              <Text className={`font-semibold ${activeFilter === 'paid' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                {invoices?.filter(i => i.status === 'paid').length ?? 0} factures
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} className="mb-4">
          <View className="flex-row gap-2">
            {filterTabs.map((tab) => (
              <Pressable
                key={tab.value}
                onPress={() => setActiveFilter(tab.value)}
                className={`px-4 py-2 rounded-lg ${activeFilter === tab.value ? 'bg-indigo-500' : 'bg-white border border-slate-200'}`}
              >
                <Text className={`text-sm font-medium ${activeFilter === tab.value ? 'text-white' : 'text-slate-600'}`}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Invoices List */}
        <View className="gap-3">
          {filteredInvoices.map((invoice) => {
            const clientEmployees = employees?.filter(e => e.client_company_id === invoice.client_company_id) ?? [];
            return (
              <InvoiceCard
                key={invoice.id}
                id={invoice.id}
                number={invoice.invoice_number}
                client={invoice.client_company?.name}
                amount={Number(invoice.amount)}
                dueDate={invoice.due_date}
                employeeCount={clientEmployees.length}
                status={invoice.status}
              />
            );
          })}
        </View>

        {filteredInvoices.length === 0 && (
          <View className="bg-white rounded-xl p-8 border border-slate-100 items-center">
            <Text className="text-slate-500">
              {activeFilter === 'all' ? 'Aucune facture trouvée' : `Aucune facture ${filterTabs.find(t => t.value === activeFilter)?.label.toLowerCase()}`}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function ClientInvoices() {
  const appMode = useAppMode();
  const { data: invoices, isLoading } = useInvoices();
  const { data: employees } = useEmployees();

  // Real mode data
  const storedInvoices = useClientInvoices();

  // In real mode, use stored data; in demo mode, use demo data
  const clientInvoices = appMode === 'real'
    ? storedInvoices
    : (invoices?.filter(i => i.client_company?.name === 'TechCorp Industries') ?? []);

  const pendingInvoice = appMode === 'real'
    ? storedInvoices.find(i => i.status === 'sent')
    : clientInvoices.find(i => (i as { status: string }).status === 'sent');

  const isLoadingState = appMode === 'demo' && isLoading;

  if (isLoadingState) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-500 mt-3">Chargement...</Text>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handlePayNow = () => {
    if (!pendingInvoice) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const amount = appMode === 'real' ? (pendingInvoice as { amount: number }).amount : Number((pendingInvoice as { amount: number }).amount);
    Alert.alert(
      'Payer la facture',
      `Procéder au paiement de ${(amount / 1000).toFixed(1)}K€ ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Payer',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Paiement', 'Vous allez être redirigé vers la page de paiement.');
          },
        },
      ]
    );
  };

  // Empty state for real mode
  if (appMode === 'real' && storedInvoices.length === 0) {
    return (
      <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-2 pb-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-slate-900">Mes factures</Text>
            <Text className="text-slate-500 mt-0.5">Historique de facturation</Text>
          </View>

          {/* Empty State */}
          <View className="bg-white rounded-2xl p-8 border border-slate-100 items-center mt-4">
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}
            >
              <Euro size={40} color="white" />
            </LinearGradient>
            <Text className="text-xl font-bold text-slate-900 mb-2 text-center">Aucune facture</Text>
            <Text className="text-slate-500 text-center mb-4 px-4">
              Vos factures apparaitront ici une fois qu'elles seront émises par votre prestataire de paie.
            </Text>
          </View>

          {/* Info */}
          <View className="bg-blue-50 rounded-2xl p-5 border border-blue-100 mt-6">
            <View className="flex-row items-center gap-3 mb-3">
              <Clock size={24} color="#3b82f6" />
              <Text className="text-lg font-semibold text-blue-900">En attente</Text>
            </View>
            <Text className="text-blue-700">
              Votre prestataire émettra des factures mensuelles pour les prestations de vos employés. Vous pourrez les consulter et les payer ici.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="px-5 pt-2 pb-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-slate-900">Mes factures</Text>
          <Text className="text-slate-500 mt-0.5">{appMode === 'real' ? 'Historique de facturation' : 'Factures de TalentFlow SAS'}</Text>
        </View>

        {/* Summary Card */}
        {pendingInvoice && (
          <View className="bg-white rounded-2xl p-5 mb-6 border border-slate-100">
            <Text className="text-sm text-slate-500 mb-1">Facture en cours</Text>
            <Text className="text-3xl font-bold text-slate-900">
              {appMode === 'real'
                ? `${((pendingInvoice as { amount: number }).amount / 1000).toFixed(1)}K€`
                : `${(Number((pendingInvoice as { amount: number }).amount) / 1000).toFixed(1)}K€`}
            </Text>
            <View className="flex-row items-center gap-2 mt-2">
              <View className="bg-amber-100 px-2 py-1 rounded">
                <Text className="text-xs font-medium text-amber-800">
                  Échéance: {formatDate(appMode === 'real' ? (pendingInvoice as { dueDate: string }).dueDate : (pendingInvoice as { due_date: string }).due_date)}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handlePayNow}
              className="bg-indigo-500 rounded-xl py-3 mt-4 active:bg-indigo-600"
            >
              <Text className="text-white font-semibold text-center">Payer maintenant</Text>
            </Pressable>
          </View>
        )}

        {/* Invoices History */}
        <Text className="text-lg font-bold text-slate-900 mb-4">Historique</Text>
        <View className="gap-3">
          {appMode === 'real' ? (
            storedInvoices.map((invoice) => (
              <View key={invoice.id} className="bg-white rounded-xl p-4 border border-slate-100">
                <View className="flex-row items-start gap-3">
                  <LinearGradient
                    colors={invoice.status === 'overdue' ? ['#ef4444', '#dc2626'] : ['#6366f1', '#8b5cf6']}
                    style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Euro size={24} color="white" />
                  </LinearGradient>
                  <View className="flex-1">
                    <Text className="font-semibold text-slate-900">{invoice.invoiceNumber}</Text>
                    <Text className="text-sm text-slate-500">{invoice.societeBName}</Text>
                    <Text className="text-xs text-slate-400">Échéance: {formatDate(invoice.dueDate)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-lg font-bold text-slate-900">{(invoice.amount / 1000).toFixed(1)}K€</Text>
                    <Badge
                      label={invoice.status === 'paid' ? 'Payée' : invoice.status === 'sent' ? 'En attente' : 'En retard'}
                      variant={invoice.status === 'paid' ? 'success' : invoice.status === 'sent' ? 'warning' : 'danger'}
                    />
                  </View>
                </View>
              </View>
            ))
          ) : (
            clientInvoices.map((invoice) => {
              const inv = invoice as { id: string; invoice_number: string; amount: number; due_date: string; status: string; client_company_id: string };
              const clientEmployeesList = employees?.filter(e => e.client_company_id === inv.client_company_id) ?? [];
              return (
                <InvoiceCard
                  key={inv.id}
                  id={inv.id}
                  number={inv.invoice_number}
                  amount={Number(inv.amount)}
                  dueDate={inv.due_date}
                  employeeCount={clientEmployeesList.length}
                  status={inv.status}
                  showClient={false}
                  isClientView
                />
              );
            })
          )}
        </View>

        {clientInvoices.length === 0 && appMode === 'demo' && (
          <View className="bg-white rounded-xl p-8 border border-slate-100 items-center">
            <Text className="text-slate-500">Aucune facture trouvée</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Demo data for Admin App subscriptions
const DEMO_SUBSCRIPTIONS = [
  {
    id: '1',
    invoiceNumber: 'SUB-2024-001',
    societeA: 'TalentFlow SAS',
    plan: 'Pro',
    amount: 99,
    period: 'Janvier 2025',
    status: 'paid',
    paidAt: '2025-01-05',
    dueDate: '2025-01-15',
  },
  {
    id: '2',
    invoiceNumber: 'SUB-2024-002',
    societeA: 'PayPro Services',
    plan: 'Business',
    amount: 199,
    period: 'Janvier 2025',
    status: 'paid',
    paidAt: '2025-01-03',
    dueDate: '2025-01-15',
  },
  {
    id: '3',
    invoiceNumber: 'SUB-2024-003',
    societeA: 'RH Solutions',
    plan: 'Pro',
    amount: 99,
    period: 'Janvier 2025',
    status: 'sent',
    paidAt: null,
    dueDate: '2025-01-15',
  },
  {
    id: '4',
    invoiceNumber: 'SUB-2024-004',
    societeA: 'FlexWork SARL',
    plan: 'Starter',
    amount: 49,
    period: 'Janvier 2025',
    status: 'overdue',
    paidAt: null,
    dueDate: '2025-01-10',
  },
  {
    id: '5',
    invoiceNumber: 'SUB-2024-005',
    societeA: 'PortaSalaire',
    plan: 'Pro',
    amount: 99,
    period: 'Janvier 2025',
    status: 'paid',
    paidAt: '2025-01-08',
    dueDate: '2025-01-15',
  },
  {
    id: '6',
    invoiceNumber: 'SUB-2023-012',
    societeA: 'TalentFlow SAS',
    plan: 'Pro',
    amount: 99,
    period: 'Décembre 2024',
    status: 'paid',
    paidAt: '2024-12-05',
    dueDate: '2024-12-15',
  },
  {
    id: '7',
    invoiceNumber: 'SUB-2023-011',
    societeA: 'PayPro Services',
    plan: 'Business',
    amount: 199,
    period: 'Décembre 2024',
    status: 'paid',
    paidAt: '2024-12-04',
    dueDate: '2024-12-15',
  },
];

type SubscriptionFilterType = 'all' | 'sent' | 'paid' | 'overdue';

function SubscriptionCard({
  subscription,
  onMarkAsPaid,
  onSendReminder,
  onView,
  onDownload,
}: {
  subscription: typeof DEMO_SUBSCRIPTIONS[0];
  onMarkAsPaid?: () => void;
  onSendReminder?: () => void;
  onView?: () => void;
  onDownload?: () => void;
}) {
  const statusConfig = {
    draft: { label: 'Brouillon', variant: 'neutral' as const, color: '#64748b' },
    sent: { label: 'En attente', variant: 'warning' as const, color: '#f59e0b' },
    paid: { label: 'Payée', variant: 'success' as const, color: '#10b981' },
    overdue: { label: 'En retard', variant: 'danger' as const, color: '#ef4444' },
  };

  const config = statusConfig[subscription.status as keyof typeof statusConfig] || statusConfig.draft;
  const planColors: Record<string, [string, string]> = {
    'Starter': ['#8b5cf6', '#7c3aed'],
    'Pro': ['#6366f1', '#4f46e5'],
    'Business': ['#3b82f6', '#2563eb'],
  };
  const colors = planColors[subscription.plan] || ['#6366f1', '#4f46e5'];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <View className="bg-white rounded-xl p-4 border border-slate-100">
      <View className="flex-row items-start gap-3">
        <LinearGradient
          colors={colors}
          style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
        >
          <CreditCard size={22} color="white" />
        </LinearGradient>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-slate-900">{subscription.societeA}</Text>
            <Badge label={config.label} variant={config.variant} />
          </View>
          <View className="flex-row items-center gap-2 mt-1">
            <View className="bg-slate-100 px-2 py-0.5 rounded">
              <Text className="text-xs text-slate-600">{subscription.plan}</Text>
            </View>
            <Text className="text-xs text-slate-400">{subscription.period}</Text>
          </View>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-xs text-slate-400">#{subscription.invoiceNumber}</Text>
            {subscription.status === 'paid' && subscription.paidAt && (
              <Text className="text-xs text-emerald-600">Payé le {formatDate(subscription.paidAt)}</Text>
            )}
            {subscription.status !== 'paid' && (
              <Text className={`text-xs ${subscription.status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`}>
                Échéance: {formatDate(subscription.dueDate)}
              </Text>
            )}
          </View>
        </View>
        <Text className="text-lg font-bold text-slate-900">{subscription.amount}€</Text>
      </View>
      <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-100">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onView?.();
          }}
          className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg bg-slate-50 active:bg-slate-100"
        >
          <Eye size={16} color="#64748b" />
          <Text className="text-sm font-medium text-slate-600">Voir</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDownload?.();
          }}
          className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg bg-slate-50 active:bg-slate-100"
        >
          <Download size={16} color="#64748b" />
          <Text className="text-sm font-medium text-slate-600">PDF</Text>
        </Pressable>
        {subscription.status === 'sent' && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onMarkAsPaid?.();
            }}
            className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500 active:bg-emerald-600"
          >
            <Check size={16} color="white" />
            <Text className="text-sm font-medium text-white">Encaissée</Text>
          </Pressable>
        )}
        {subscription.status === 'overdue' && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onSendReminder?.();
            }}
            className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg bg-amber-500 active:bg-amber-600"
          >
            <Send size={16} color="white" />
            <Text className="text-sm font-medium text-white">Relancer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function AdminAppSubscriptions() {
  const appMode = useAppMode();
  const storedSubscriptions = useSubscriptionInvoices();
  const updateSubscriptionInvoice = useDataStore(s => s.updateSubscriptionInvoice);
  const [activeFilter, setActiveFilter] = useState<SubscriptionFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [demoSubscriptions, setDemoSubscriptions] = useState(DEMO_SUBSCRIPTIONS);

  // Use stored data in real mode, demo data in demo mode
  const subscriptions = appMode === 'real' ? storedSubscriptions : demoSubscriptions;

  const filterTabs: { label: string; value: SubscriptionFilterType }[] = [
    { label: 'Toutes', value: 'all' },
    { label: 'En attente', value: 'sent' },
    { label: 'Payées', value: 'paid' },
    { label: 'En retard', value: 'overdue' },
  ];

  // Filter by status and search query
  const filteredSubscriptions = subscriptions.filter(s => {
    // Status filter
    const matchesStatus = activeFilter === 'all' || s.status === activeFilter;

    // Search filter
    if (!searchQuery.trim()) return matchesStatus;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      s.societeA.toLowerCase().includes(query) ||
      s.plan.toLowerCase().includes(query) ||
      s.invoiceNumber.toLowerCase().includes(query) ||
      s.period.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const totalPaid = subscriptions.filter(s => s.status === 'paid')
    .reduce((sum, s) => sum + s.amount, 0);

  // Find email for a societe (mock data)
  const getSocieteEmail = (name: string) => {
    const emails: Record<string, string> = {
      'TalentFlow SAS': 'contact@talentflow.fr',
      'PayPro Services': 'admin@paypro.fr',
      'RH Solutions': 'info@rhsolutions.fr',
      'FlexWork SARL': 'hello@flexwork.fr',
      'PortaSalaire': 'contact@portasalaire.fr',
    };
    return emails[name] || 'contact@example.fr';
  };

  const handleMarkAsPaid = (subscriptionId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (appMode === 'real') {
      updateSubscriptionInvoice(subscriptionId, {
        status: 'paid',
        paidAt: new Date().toISOString().split('T')[0]
      });
    } else {
      setDemoSubscriptions(prev => prev.map(s =>
        s.id === subscriptionId
          ? { ...s, status: 'paid', paidAt: new Date().toISOString().split('T')[0] }
          : s
      ));
    }
    Alert.alert('Succès', 'La facture a été marquée comme encaissée');
  };

  const handleSendReminder = (subscription: typeof DEMO_SUBSCRIPTIONS[0]) => {
    const email = getSocieteEmail(subscription.societeA);
    const subject = encodeURIComponent(`Rappel - Facture ${subscription.invoiceNumber} en retard`);
    const body = encodeURIComponent(
      `Bonjour,\n\nNous vous rappelons que la facture ${subscription.invoiceNumber} d'un montant de ${subscription.amount}€ pour ${subscription.period} est en retard de paiement.\n\nMerci de procéder au règlement dans les plus brefs délais.\n\nCordialement,\nL'équipe PayFlow`
    );

    Alert.alert(
      'Relancer le client',
      `Envoyer un rappel à ${subscription.societeA} pour la facture ${subscription.invoiceNumber} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer par email',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`).catch(() => {
              Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email');
            });
          },
        },
      ]
    );
  };

  const handleViewSubscription = (subscription: typeof DEMO_SUBSCRIPTIONS[0]) => {
    Alert.alert(
      `Facture ${subscription.invoiceNumber}`,
      `Société: ${subscription.societeA}\nPlan: ${subscription.plan}\nMontant: ${subscription.amount}€\nPériode: ${subscription.period}\nStatut: ${subscription.status === 'paid' ? 'Payée' : subscription.status === 'sent' ? 'En attente' : 'En retard'}\n${subscription.paidAt ? `Payée le: ${new Date(subscription.paidAt).toLocaleDateString('fr-FR')}` : `Échéance: ${new Date(subscription.dueDate).toLocaleDateString('fr-FR')}`}`,
      [{ text: 'Fermer' }]
    );
  };

  const handleDownloadPDF = async (subscription: typeof DEMO_SUBSCRIPTIONS[0]) => {
    Alert.alert(
      'Télécharger PDF',
      `Générer le PDF de la facture ${subscription.invoiceNumber} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Générer',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Succès', `PDF de la facture ${subscription.invoiceNumber} généré`);
          },
        },
      ]
    );
  };

  const handleGenerateAllInvoices = () => {
    Alert.alert(
      'Générer toutes les factures',
      'Voulez-vous générer les factures du mois pour toutes les Sociétés A ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Générer',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Succès', 'Toutes les factures du mois ont été générées');
          },
        },
      ]
    );
  };

  const handleSendAllReminders = () => {
    const overdueCount = subscriptions.filter(s => s.status === 'overdue').length;
    if (overdueCount === 0) {
      Alert.alert('Information', 'Aucune facture en retard à relancer');
      return;
    }

    Alert.alert(
      'Relancer les impayés',
      `Envoyer un rappel pour ${overdueCount} facture(s) en retard ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Relancer tout',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Succès', `${overdueCount} rappel(s) envoyé(s)`);
          },
        },
      ]
    );
  };

  const handleExportAccounting = () => {
    Alert.alert(
      'Export comptable',
      'Exporter les données pour la comptabilité ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Exporter CSV',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Succès', 'Export comptable généré');
          },
        },
      ]
    );
  };

  const handleGenerateNewInvoices = () => {
    Alert.alert(
      'Générer factures',
      'Générer les factures d\'abonnement pour le mois en cours ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Générer',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Succès', 'Nouvelles factures générées');
          },
        },
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
              <Text className="text-2xl font-bold text-slate-900">Abonnements</Text>
              <Text className="text-slate-500 mt-0.5">Factures des Sociétés A</Text>
            </View>
            <Pressable
              onPress={handleGenerateNewInvoices}
              className="bg-violet-500 rounded-xl px-4 py-3 flex-row items-center gap-2 active:bg-violet-600"
            >
              <RefreshCw size={18} color="white" />
              <Text className="text-white font-semibold">Générer</Text>
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-white rounded-xl px-4 py-3 flex-row items-center gap-3 border border-slate-200">
              <Search size={20} color="#94a3b8" />
              <TextInput
                className="flex-1 text-slate-900"
                placeholder="Rechercher une facture..."
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

          {/* Summary */}
          <View className="bg-white rounded-2xl p-5 mb-6 border border-slate-100">
            <Text className="text-sm text-slate-500 mb-1">Revenus ce mois</Text>
            <Text className="text-3xl font-bold text-slate-900">{totalPaid}€</Text>
            <View className="flex-row gap-4 mt-3 pt-3 border-t border-slate-100">
              <Pressable
                className="flex-1"
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveFilter('sent');
                }}
              >
                <Text className="text-xs text-slate-400">En attente</Text>
                <Text className={`font-semibold ${activeFilter === 'sent' ? 'text-violet-600' : 'text-amber-600'}`}>
                  {subscriptions.filter(s => s.status === 'sent').length} factures
                </Text>
              </Pressable>
              <Pressable
                className="flex-1"
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveFilter('overdue');
                }}
              >
                <Text className="text-xs text-slate-400">En retard</Text>
                <Text className={`font-semibold ${activeFilter === 'overdue' ? 'text-violet-600' : 'text-red-600'}`}>
                  {subscriptions.filter(s => s.status === 'overdue').length} factures
                </Text>
              </Pressable>
              <Pressable
                className="flex-1"
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveFilter('paid');
                }}
              >
                <Text className="text-xs text-slate-400">Payées</Text>
                <Text className={`font-semibold ${activeFilter === 'paid' ? 'text-violet-600' : 'text-emerald-600'}`}>
                  {subscriptions.filter(s => s.status === 'paid').length} factures
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="flex-row gap-3 mb-6">
            <Pressable
              onPress={handleGenerateAllInvoices}
              className="flex-1 bg-white rounded-xl p-4 border border-slate-100 items-center active:bg-slate-50"
            >
              <View className="w-10 h-10 rounded-full bg-violet-100 items-center justify-center mb-2">
                <FileText size={20} color="#8b5cf6" />
              </View>
              <Text className="text-sm font-medium text-slate-700">Générer toutes</Text>
              <Text className="text-xs text-slate-400">Factures du mois</Text>
            </Pressable>
            <Pressable
              onPress={handleSendAllReminders}
              className="flex-1 bg-white rounded-xl p-4 border border-slate-100 items-center active:bg-slate-50"
            >
              <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mb-2">
                <Send size={20} color="#f59e0b" />
              </View>
              <Text className="text-sm font-medium text-slate-700">Relancer</Text>
              <Text className="text-xs text-slate-400">Impayés</Text>
            </Pressable>
            <Pressable
              onPress={handleExportAccounting}
              className="flex-1 bg-white rounded-xl p-4 border border-slate-100 items-center active:bg-slate-50"
            >
              <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mb-2">
                <Download size={20} color="#10b981" />
              </View>
              <Text className="text-sm font-medium text-slate-700">Exporter</Text>
              <Text className="text-xs text-slate-400">Comptabilité</Text>
            </Pressable>
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
              {filteredSubscriptions.length} résultat(s) pour "{searchQuery}"
            </Text>
          )}

          {/* Subscriptions List */}
          {subscriptions.length > 0 ? (
            <View className="gap-3">
              {filteredSubscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  onMarkAsPaid={() => handleMarkAsPaid(subscription.id)}
                  onSendReminder={() => handleSendReminder(subscription)}
                  onView={() => handleViewSubscription(subscription)}
                  onDownload={() => handleDownloadPDF(subscription)}
                />
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-8 border border-slate-100 items-center">
              <View className="w-16 h-16 rounded-full bg-violet-100 items-center justify-center mb-4">
                <CreditCard size={32} color="#8b5cf6" />
              </View>
              <Text className="text-lg font-semibold text-slate-900 mb-2">Aucun abonnement</Text>
              <Text className="text-slate-500 text-center mb-4">
                Les factures d'abonnement apparaîtront ici lorsque vous aurez des Sociétés A actives.
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

          {filteredSubscriptions.length === 0 && subscriptions.length > 0 && (
            <View className="bg-white rounded-xl p-8 border border-slate-100 items-center">
              <Text className="text-slate-500">
                {searchQuery ? 'Aucune facture trouvée pour cette recherche' : 'Aucune facture trouvée'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Demo data for Société A's PayFlow subscription invoices
const DEMO_PAYFLOW_INVOICES = [
  {
    id: '1',
    invoiceNumber: 'PF-2025-001',
    plan: 'Pro',
    amount: 99,
    period: 'Janvier 2025',
    status: 'sent',
    dueDate: '2025-01-15',
    paidAt: null,
  },
  {
    id: '2',
    invoiceNumber: 'PF-2024-012',
    plan: 'Pro',
    amount: 99,
    period: 'Décembre 2024',
    status: 'paid',
    dueDate: '2024-12-15',
    paidAt: '2024-12-10',
  },
  {
    id: '3',
    invoiceNumber: 'PF-2024-011',
    plan: 'Pro',
    amount: 99,
    period: 'Novembre 2024',
    status: 'paid',
    dueDate: '2024-11-15',
    paidAt: '2024-11-08',
  },
  {
    id: '4',
    invoiceNumber: 'PF-2024-010',
    plan: 'Pro',
    amount: 99,
    period: 'Octobre 2024',
    status: 'paid',
    dueDate: '2024-10-15',
    paidAt: '2024-10-12',
  },
];

function PayFlowInvoiceCard({
  invoice,
}: {
  invoice: typeof DEMO_PAYFLOW_INVOICES[0];
}) {
  const statusConfig = {
    sent: { label: 'À payer', variant: 'warning' as const },
    paid: { label: 'Payée', variant: 'success' as const },
  };

  const config = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.sent;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleView = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      `Facture ${invoice.invoiceNumber}`,
      `Abonnement PayFlow - Plan ${invoice.plan}\nPériode: ${invoice.period}\nMontant: ${invoice.amount}€\n${invoice.paidAt ? `Payée le: ${formatDate(invoice.paidAt)}` : `Échéance: ${formatDate(invoice.dueDate)}`}`,
      [{ text: 'Fermer' }]
    );
  };

  const handleDownloadPDF = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Télécharger PDF',
      `Générer le PDF de la facture ${invoice.invoiceNumber} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Générer',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Succès', `PDF de la facture ${invoice.invoiceNumber} généré`);
          },
        },
      ]
    );
  };

  const handlePay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Payer la facture',
      `Procéder au paiement de ${invoice.amount}€ pour ${invoice.period} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Payer',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Paiement', 'Vous allez être redirigé vers la page de paiement.');
          },
        },
      ]
    );
  };

  return (
    <View className="bg-white rounded-xl p-4 border border-slate-100">
      <View className="flex-row items-start gap-3">
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          style={{ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
        >
          <CreditCard size={20} color="white" />
        </LinearGradient>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-slate-900">Abonnement PayFlow</Text>
            <Badge label={config.label} variant={config.variant} />
          </View>
          <Text className="text-sm text-slate-500">{invoice.period} • Plan {invoice.plan}</Text>
          <Text className="text-xs text-slate-400 mt-0.5">#{invoice.invoiceNumber}</Text>
        </View>
        <Text className="text-lg font-bold text-slate-900">{invoice.amount}€</Text>
      </View>
      <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-100">
        <Pressable
          onPress={handleView}
          className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg bg-slate-50 active:bg-slate-100"
        >
          <Eye size={16} color="#64748b" />
          <Text className="text-sm font-medium text-slate-600">Voir</Text>
        </Pressable>
        <Pressable
          onPress={handleDownloadPDF}
          className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg bg-slate-50 active:bg-slate-100"
        >
          <Download size={16} color="#64748b" />
          <Text className="text-sm font-medium text-slate-600">PDF</Text>
        </Pressable>
        {invoice.status === 'sent' && (
          <Pressable
            onPress={handlePay}
            className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-lg bg-indigo-500 active:bg-indigo-600"
          >
            <Euro size={16} color="white" />
            <Text className="text-sm font-medium text-white">Payer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function SocieteAPayFlowInvoices() {
  const appMode = useAppMode();
  const storedPayFlowInvoices = usePayFlowInvoices();

  // Use stored data in real mode, demo data in demo mode
  const invoices = appMode === 'real' ? storedPayFlowInvoices : DEMO_PAYFLOW_INVOICES;
  const pendingInvoice = invoices.find(i => i.status === 'sent');

  const handlePayNow = () => {
    if (!pendingInvoice) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Payer la facture',
      `Procéder au paiement de ${pendingInvoice.amount}€ pour ${pendingInvoice.period} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Payer',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Paiement', 'Vous allez être redirigé vers la page de paiement.');
          },
        },
      ]
    );
  };

  // Empty state for real mode
  if (appMode === 'real' && storedPayFlowInvoices.length === 0) {
    return (
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-lg font-bold text-slate-900">Mon abonnement PayFlow</Text>
            <Text className="text-sm text-slate-500">Factures de l'application</Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-6 border border-slate-100 items-center">
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
          >
            <CreditCard size={28} color="white" />
          </LinearGradient>
          <Text className="text-base font-semibold text-slate-900 mb-1 text-center">Aucune facture d'abonnement</Text>
          <Text className="text-sm text-slate-500 text-center">
            Vos factures d'abonnement PayFlow apparaîtront ici.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-lg font-bold text-slate-900">Mon abonnement PayFlow</Text>
          <Text className="text-sm text-slate-500">Factures de l'application</Text>
        </View>
        {invoices.length > 0 && (
          <View className="bg-violet-100 px-3 py-1.5 rounded-lg">
            <Text className="text-sm font-semibold text-violet-700">Plan {invoices[0]?.plan || 'Pro'}</Text>
          </View>
        )}
      </View>

      {pendingInvoice && (
        <View className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200">
          <View className="flex-row items-center gap-2 mb-2">
            <AlertTriangle size={18} color="#f59e0b" />
            <Text className="font-semibold text-amber-800">Facture en attente</Text>
          </View>
          <Text className="text-sm text-amber-700">
            Votre facture de {pendingInvoice.amount}€ pour {pendingInvoice.period} est en attente de paiement.
          </Text>
          <Pressable
            onPress={handlePayNow}
            className="bg-amber-500 rounded-lg py-2.5 mt-3 active:bg-amber-600"
          >
            <Text className="text-white font-semibold text-center">Payer maintenant</Text>
          </Pressable>
        </View>
      )}

      <View className="gap-3">
        {invoices.map((invoice) => (
          <PayFlowInvoiceCard key={invoice.id} invoice={invoice} />
        ))}
      </View>
    </View>
  );
}

export default function InvoicesScreen() {
  const userType = useUserType();

  // Admin App sees subscriptions management
  if (userType === 'admin_app') {
    return <AdminAppSubscriptions />;
  }

  // Société B sees their invoices from Société A
  if (userType === 'societe_b') {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <ClientInvoices />
      </SafeAreaView>
    );
  }

  // Société A sees client invoices (without PayFlow subscription section - moved to settings)
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <PrestaireInvoices />
    </SafeAreaView>
  );
}
