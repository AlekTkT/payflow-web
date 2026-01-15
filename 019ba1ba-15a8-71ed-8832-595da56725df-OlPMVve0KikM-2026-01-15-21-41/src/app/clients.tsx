import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  X,
  Plus,
  Search,
  Building2,
  Users,
  Euro,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle,
  Trash2,
  History,
  AlertTriangle,
} from 'lucide-react-native';
import { useCompanies, useEmployees, useInvoices, useDeleteCompany, useDeleteEmployee } from '@/lib/hooks/usePayflow';
import { useUserType } from '@/lib/state/app-store';
import { useIsAdmin } from '@/lib/state/auth-store';
import type { Company, EmployeeWithDetails, InvoiceWithDetails } from '@/lib/database.types';

export default function ClientsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'company' | 'employee'; item: Company | EmployeeWithDetails } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const userType = useUserType();
  const isAdmin = useIsAdmin();
  const isAdminView = isAdmin || userType === 'admin_app';

  const { data: companies, isLoading: loadingCompanies } = useCompanies();
  const { data: employees } = useEmployees();
  const { data: invoices } = useInvoices();

  const deleteCompanyMutation = useDeleteCompany();
  const deleteEmployeeMutation = useDeleteEmployee();

  // Pour l'admin: afficher les prestataires (Sociétés A / type = 'prestataire')
  // Pour la Société A: afficher les clients (Sociétés B / type = 'client')
  const filteredCompanyType = isAdminView ? 'prestataire' : 'client';
  const targetCompanies = companies?.filter(c => c.type === filteredCompanyType) ?? [];

  const filteredCompanies = targetCompanies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCompany = targetCompanies.find(c => c.id === selectedCompanyId);
  const selectedCompanyEmployees = employees?.filter(e =>
    isAdminView ? e.employer_company_id === selectedCompanyId : e.client_company_id === selectedCompanyId
  ) ?? [];
  const selectedCompanyInvoices = invoices?.filter(i =>
    isAdminView ? i.issuer_company_id === selectedCompanyId : i.client_company_id === selectedCompanyId
  ) ?? [];

  // Labels selon le contexte
  const pageTitle = isAdminView ? 'Prestataires' : 'Clients';
  const entityLabel = isAdminView ? 'prestataire' : 'client';

  const handleDeleteCompany = (company: Company) => {
    setItemToDelete({ type: 'company', item: company });
    setShowDeleteModal(true);
  };

  const handleDeleteEmployee = (employee: EmployeeWithDetails) => {
    setItemToDelete({ type: 'employee', item: employee });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'company') {
      await deleteCompanyMutation.mutateAsync({
        company: itemToDelete.item as Company,
        reason: deleteReason || undefined,
      });
      setSelectedCompanyId(null);
    } else {
      await deleteEmployeeMutation.mutateAsync({
        employee: itemToDelete.item as EmployeeWithDetails,
        reason: deleteReason || undefined,
      });
    }

    setShowDeleteModal(false);
    setItemToDelete(null);
    setDeleteReason('');
  };

  const DeleteConfirmationModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-5">
        <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
          {/* Header */}
          <View className="bg-red-50 p-6 items-center">
            <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-3">
              <AlertTriangle size={32} color="#ef4444" />
            </View>
            <Text className="text-xl font-bold text-slate-900">Confirmer la suppression</Text>
          </View>

          {/* Content */}
          <View className="p-5">
            <Text className="text-slate-600 text-center mb-4">
              {itemToDelete?.type === 'company'
                ? `Voulez-vous vraiment supprimer ${isAdminView ? 'le prestataire' : 'la société'} "${(itemToDelete?.item as Company)?.name}" ? ${isAdminView ? 'Tous les clients et employés associés seront également supprimés.' : 'Tous les employés associés seront également supprimés.'}`
                : `Voulez-vous vraiment supprimer l'employé "${(itemToDelete?.item as EmployeeWithDetails)?.full_name}" ?`}
            </Text>

            <Text className="text-sm text-slate-500 mb-2">Motif de suppression (optionnel)</Text>
            <TextInput
              value={deleteReason}
              onChangeText={setDeleteReason}
              placeholder="Ex: Fin de contrat, Fermeture..."
              placeholderTextColor="#94a3b8"
              className="bg-slate-100 rounded-xl px-4 py-3 text-slate-900 mb-4"
              multiline
            />

            <View className="bg-amber-50 rounded-xl p-3 mb-4 flex-row items-start gap-2">
              <History size={18} color="#f59e0b" />
              <Text className="text-amber-800 text-sm flex-1">
                Cette action est réversible. L'historique sera conservé et consultable.
              </Text>
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                  setDeleteReason('');
                }}
                className="flex-1 bg-slate-100 rounded-xl py-3.5 active:bg-slate-200"
              >
                <Text className="text-center font-semibold text-slate-700">Annuler</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                disabled={deleteCompanyMutation.isPending || deleteEmployeeMutation.isPending}
                className="flex-1 bg-red-500 rounded-xl py-3.5 active:bg-red-600"
              >
                <Text className="text-center font-semibold text-white">
                  {deleteCompanyMutation.isPending || deleteEmployeeMutation.isPending ? 'Suppression...' : 'Supprimer'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loadingCompanies) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-500 mt-3">Chargement...</Text>
      </SafeAreaView>
    );
  }

  // Company detail view
  if (selectedCompany) {
    const totalInvoiced = selectedCompanyInvoices.reduce((sum: number, inv: InvoiceWithDetails) => sum + Number(inv.amount), 0);
    const pendingInvoices = selectedCompanyInvoices.filter((i: InvoiceWithDetails) => i.status === 'sent' || i.status === 'overdue');
    const paidInvoices = selectedCompanyInvoices.filter((i: InvoiceWithDetails) => i.status === 'paid');

    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <DeleteConfirmationModal />
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
          <Pressable onPress={() => setSelectedCompanyId(null)} className="p-2 -ml-2">
            <X size={24} color="#64748b" />
          </Pressable>
          <Text className="text-lg font-bold text-slate-900">Détails {entityLabel}</Text>
          <Pressable
            onPress={() => handleDeleteCompany(selectedCompany)}
            className="p-2 -mr-2 active:bg-red-50 rounded-full"
          >
            <Trash2 size={22} color="#ef4444" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-5">
            {/* Company Header Card */}
            <View className="bg-white rounded-2xl p-5 mb-4 border border-slate-100">
              <View className="flex-row items-center gap-4 mb-4">
                <LinearGradient
                  colors={isAdminView ? ['#8b5cf6', '#a855f7'] : ['#6366f1', '#8b5cf6']}
                  style={{ width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="text-white font-bold text-2xl">{selectedCompany.name.charAt(0)}</Text>
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-slate-900">{selectedCompany.name}</Text>
                  <Text className="text-slate-500">{selectedCompany.legal_status ?? (isAdminView ? 'Prestataire' : 'Entreprise')}</Text>
                </View>
              </View>

              {/* Contact info */}
              <View className="gap-3 pt-4 border-t border-slate-100">
                {selectedCompany.address && (
                  <View className="flex-row items-center gap-3">
                    <MapPin size={18} color="#64748b" />
                    <Text className="text-slate-600 flex-1">
                      {selectedCompany.address}, {selectedCompany.postal_code} {selectedCompany.city}
                    </Text>
                  </View>
                )}
                {selectedCompany.phone && (
                  <View className="flex-row items-center gap-3">
                    <Phone size={18} color="#64748b" />
                    <Text className="text-slate-600">{selectedCompany.phone}</Text>
                  </View>
                )}
                {selectedCompany.email && (
                  <View className="flex-row items-center gap-3">
                    <Mail size={18} color="#64748b" />
                    <Text className="text-slate-600">{selectedCompany.email}</Text>
                  </View>
                )}
              </View>

              {/* SIRET / Contact */}
              <View className="flex-row gap-4 pt-4 mt-4 border-t border-slate-100">
                <View className="flex-1">
                  <Text className="text-xs text-slate-400">SIRET</Text>
                  <Text className="font-medium text-slate-900">{selectedCompany.siret ?? 'N/A'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-slate-400">Contact</Text>
                  <Text className="font-medium text-slate-900">{selectedCompany.contact_name ?? 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100">
                <View className="flex-row items-center gap-2 mb-2">
                  <Users size={18} color="#6366f1" />
                  <Text className="text-xs text-slate-500">{isAdminView ? 'Clients' : 'Employés'}</Text>
                </View>
                <Text className="text-2xl font-bold text-slate-900">{selectedCompanyEmployees.length}</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100">
                <View className="flex-row items-center gap-2 mb-2">
                  <Euro size={18} color="#10b981" />
                  <Text className="text-xs text-slate-500">Total facturé</Text>
                </View>
                <Text className="text-2xl font-bold text-emerald-600">{(totalInvoiced / 1000).toFixed(1)}K€</Text>
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100">
                <View className="flex-row items-center gap-2 mb-2">
                  <AlertCircle size={18} color="#f59e0b" />
                  <Text className="text-xs text-slate-500">En attente</Text>
                </View>
                <Text className="text-2xl font-bold text-amber-600">{pendingInvoices.length}</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100">
                <View className="flex-row items-center gap-2 mb-2">
                  <CheckCircle size={18} color="#10b981" />
                  <Text className="text-xs text-slate-500">Payées</Text>
                </View>
                <Text className="text-2xl font-bold text-emerald-600">{paidInvoices.length}</Text>
              </View>
            </View>

            {/* Employees/Clients Section */}
            <View className="bg-white rounded-2xl p-5 mb-4 border border-slate-100">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-slate-900">{isAdminView ? 'Clients gérés' : 'Employés'}</Text>
                {!isAdminView && (
                  <Pressable
                    onPress={() => router.push('/add-employee')}
                    className="flex-row items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg"
                  >
                    <Plus size={14} color="#6366f1" />
                    <Text className="text-sm font-medium text-indigo-600">Ajouter</Text>
                  </Pressable>
                )}
              </View>

              {selectedCompanyEmployees.length === 0 ? (
                <View className="py-6 items-center">
                  <Users size={32} color="#cbd5e1" />
                  <Text className="text-slate-400 mt-2">{isAdminView ? 'Aucun client' : 'Aucun employé'}</Text>
                </View>
              ) : (
                <View className="gap-3">
                  {selectedCompanyEmployees.map((emp: EmployeeWithDetails) => (
                    <View
                      key={emp.id}
                      className="flex-row items-center justify-between py-3 border-b border-slate-100"
                    >
                      <View className="flex-row items-center gap-3 flex-1">
                        <LinearGradient
                          colors={['#6366f1', '#8b5cf6']}
                          style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Text className="text-white font-semibold text-sm">
                            {emp.full_name.split(' ').map((n: string) => n[0]).join('')}
                          </Text>
                        </LinearGradient>
                        <View className="flex-1">
                          <Text className="font-semibold text-slate-900">{emp.full_name}</Text>
                          <Text className="text-sm text-slate-500">{emp.position}</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-3">
                        <Text className="font-medium text-indigo-600">{emp.hourly_rate}€/h</Text>
                        {!isAdminView && (
                          <Pressable
                            onPress={() => handleDeleteEmployee(emp)}
                            className="p-2 active:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={18} color="#ef4444" />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Invoices Section */}
            <View className="bg-white rounded-2xl p-5 border border-slate-100">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-slate-900">Factures</Text>
                {!isAdminView && (
                  <Pressable
                    onPress={() => router.push('/create-invoice')}
                    className="flex-row items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg"
                  >
                    <Plus size={14} color="#6366f1" />
                    <Text className="text-sm font-medium text-indigo-600">Créer</Text>
                  </Pressable>
                )}
              </View>

              {selectedCompanyInvoices.length === 0 ? (
                <View className="py-6 items-center">
                  <FileText size={32} color="#cbd5e1" />
                  <Text className="text-slate-400 mt-2">Aucune facture</Text>
                </View>
              ) : (
                <View className="gap-3">
                  {selectedCompanyInvoices.map((inv: InvoiceWithDetails) => {
                    const statusConfig: Record<string, { label: string; color: string }> = {
                      draft: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700' },
                      sent: { label: 'Envoyée', color: 'bg-amber-100 text-amber-800' },
                      paid: { label: 'Payée', color: 'bg-emerald-100 text-emerald-800' },
                      overdue: { label: 'En retard', color: 'bg-red-100 text-red-800' },
                    };
                    const config = statusConfig[inv.status] || statusConfig.draft;

                    return (
                      <View
                        key={inv.id}
                        className="flex-row items-center justify-between py-3 border-b border-slate-100"
                      >
                        <View className="flex-row items-center gap-3">
                          <View className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center">
                            <FileText size={20} color="#64748b" />
                          </View>
                          <View>
                            <Text className="font-semibold text-slate-900">{inv.invoice_number}</Text>
                            <Text className="text-sm text-slate-500">
                              {inv.month}/{inv.year}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="font-bold text-slate-900">{Number(inv.amount).toLocaleString()}€</Text>
                          <View className={`px-2 py-0.5 rounded mt-1 ${config.color.split(' ')[0]}`}>
                            <Text className={`text-xs font-medium ${config.color.split(' ')[1]}`}>
                              {config.label}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Companies list view
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <X size={24} color="#64748b" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">{pageTitle}</Text>
        {!isAdminView && (
          <Pressable
            onPress={() => router.push('/add-client')}
            className="p-2 -mr-2"
          >
            <Plus size={24} color="#6366f1" />
          </Pressable>
        )}
        {isAdminView && <View className="w-10" />}
      </View>

      {/* Search */}
      <View className="px-5 py-3 bg-white border-b border-slate-100">
        <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 gap-3">
          <Search size={20} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Rechercher un ${entityLabel}...`}
            placeholderTextColor="#94a3b8"
            className="flex-1 text-slate-900"
          />
        </View>
      </View>

      {/* Stats Summary */}
      <View className="flex-row gap-3 px-5 py-4">
        <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100">
          <Text className="text-2xl font-bold text-indigo-600">{targetCompanies.length}</Text>
          <Text className="text-sm text-slate-500">{isAdminView ? 'Prestataires actifs' : 'Clients actifs'}</Text>
        </View>
        <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100">
          <Text className="text-2xl font-bold text-emerald-600">{employees?.length ?? 0}</Text>
          <Text className="text-sm text-slate-500">Employés total</Text>
        </View>
      </View>

      {/* Companies List */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="gap-3 pb-6">
          {filteredCompanies.map((company: Company) => {
            const companyEmployees = employees?.filter(e =>
              isAdminView ? e.employer_company_id === company.id : e.client_company_id === company.id
            ) ?? [];
            const companyInvoices = invoices?.filter(i =>
              isAdminView ? i.issuer_company_id === company.id : i.client_company_id === company.id
            ) ?? [];
            const hasPending = companyInvoices.some(i => i.status === 'sent' || i.status === 'overdue');
            const totalAmount = companyInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

            return (
              <Pressable
                key={company.id}
                onPress={() => setSelectedCompanyId(company.id)}
                className="bg-white rounded-xl p-4 border border-slate-100 active:bg-slate-50"
              >
                <View className="flex-row items-center gap-4">
                  <LinearGradient
                    colors={isAdminView ? ['#8b5cf6', '#a855f7'] : ['#6366f1', '#8b5cf6']}
                    style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text className="text-white font-bold text-lg">{company.name.charAt(0)}</Text>
                  </LinearGradient>
                  <View className="flex-1">
                    <Text className="font-semibold text-slate-900 text-base">{company.name}</Text>
                    <Text className="text-sm text-slate-500">{company.city ?? 'France'}</Text>
                    <View className="flex-row items-center gap-3 mt-1">
                      <View className="flex-row items-center gap-1">
                        <Users size={12} color="#64748b" />
                        <Text className="text-xs text-slate-500">
                          {companyEmployees.length} {isAdminView ? 'clients' : 'employés'}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Euro size={12} color="#64748b" />
                        <Text className="text-xs text-slate-500">{(totalAmount / 1000).toFixed(1)}K€</Text>
                      </View>
                    </View>
                  </View>
                  <View className="items-end">
                    <View className={`px-2 py-1 rounded-lg mb-2 ${hasPending ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                      <Text className={`text-xs font-semibold ${hasPending ? 'text-amber-800' : 'text-emerald-800'}`}>
                        {hasPending ? 'En attente' : 'À jour'}
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#94a3b8" />
                  </View>
                </View>
              </Pressable>
            );
          })}

          {filteredCompanies.length === 0 && (
            <View className="bg-white rounded-xl p-8 border border-slate-100 items-center">
              <Building2 size={40} color="#cbd5e1" />
              <Text className="text-slate-500 mt-3">
                {searchQuery ? `Aucun ${entityLabel} trouvé` : `Aucun ${entityLabel}`}
              </Text>
              {!isAdminView && (
                <Pressable
                  onPress={() => router.push('/add-client')}
                  className="mt-4 bg-indigo-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-medium">Ajouter un {entityLabel}</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
