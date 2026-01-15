import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Building2,
  Users,
  RotateCcw,
  Calendar,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react-native';
import { useDeletionHistoryStore, type DeletionRecord } from '@/lib/state/deletion-history-store';
import { useRestoreCompany, useRestoreEmployee } from '@/lib/hooks/usePayflow';
import type { Company, EmployeeWithDetails } from '@/lib/database.types';

type FilterType = 'all' | 'company' | 'employee';

export default function DeletionHistoryScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [itemToRestore, setItemToRestore] = useState<DeletionRecord | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const deletions = useDeletionHistoryStore((s) => s.deletions);
  const restoreCompanyMutation = useRestoreCompany();
  const restoreEmployeeMutation = useRestoreEmployee();

  const filteredDeletions = filter === 'all'
    ? deletions
    : deletions.filter((d) => d.type === filter);

  const companyCount = deletions.filter((d) => d.type === 'company').length;
  const employeeCount = deletions.filter((d) => d.type === 'employee').length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRestore = async () => {
    if (!itemToRestore) return;

    if (itemToRestore.type === 'company') {
      await restoreCompanyMutation.mutateAsync(itemToRestore.id);
    } else {
      await restoreEmployeeMutation.mutateAsync(itemToRestore.id);
    }

    setShowRestoreModal(false);
    setItemToRestore(null);
  };

  const RestoreConfirmationModal = () => (
    <Modal
      visible={showRestoreModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRestoreModal(false)}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-5">
        <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
          {/* Header */}
          <View className="bg-emerald-50 p-6 items-center">
            <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-3">
              <RotateCcw size={32} color="#10b981" />
            </View>
            <Text className="text-xl font-bold text-slate-900">Restaurer l'élément</Text>
          </View>

          {/* Content */}
          <View className="p-5">
            <Text className="text-slate-600 text-center mb-6">
              {itemToRestore?.type === 'company'
                ? `Voulez-vous restaurer la société "${(itemToRestore?.data as Company)?.name}" ?`
                : `Voulez-vous restaurer l'employé "${(itemToRestore?.data as EmployeeWithDetails)?.full_name}" ?`}
            </Text>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setShowRestoreModal(false);
                  setItemToRestore(null);
                }}
                className="flex-1 bg-slate-100 rounded-xl py-3.5 active:bg-slate-200"
              >
                <Text className="text-center font-semibold text-slate-700">Annuler</Text>
              </Pressable>
              <Pressable
                onPress={handleRestore}
                disabled={restoreCompanyMutation.isPending || restoreEmployeeMutation.isPending}
                className="flex-1 bg-emerald-500 rounded-xl py-3.5 active:bg-emerald-600"
              >
                <Text className="text-center font-semibold text-white">
                  {restoreCompanyMutation.isPending || restoreEmployeeMutation.isPending
                    ? 'Restauration...'
                    : 'Restaurer'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const DeletionCard = ({ deletion }: { deletion: DeletionRecord }) => {
    const isCompany = deletion.type === 'company';
    const name = isCompany
      ? (deletion.data as Company).name
      : (deletion.data as EmployeeWithDetails).full_name;
    const subtitle = isCompany
      ? (deletion.data as Company).city ?? 'Entreprise'
      : (deletion.data as EmployeeWithDetails).position;

    return (
      <View className="bg-white rounded-xl p-4 border border-slate-100 mb-3">
        <View className="flex-row items-center gap-3">
          <LinearGradient
            colors={isCompany ? ['#f59e0b', '#fbbf24'] : ['#6366f1', '#8b5cf6']}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isCompany ? (
              <Building2 size={24} color="white" />
            ) : (
              <Users size={24} color="white" />
            )}
          </LinearGradient>
          <View className="flex-1">
            <Text className="font-semibold text-slate-900">{name}</Text>
            <Text className="text-sm text-slate-500">{subtitle}</Text>
            <View className="flex-row items-center gap-1 mt-1">
              <Calendar size={12} color="#94a3b8" />
              <Text className="text-xs text-slate-400">{formatDate(deletion.deletedAt)}</Text>
            </View>
          </View>
          <View className="items-end">
            <View className={`px-2.5 py-1 rounded-lg ${isCompany ? 'bg-amber-100' : 'bg-indigo-100'}`}>
              <Text className={`text-xs font-medium ${isCompany ? 'text-amber-800' : 'text-indigo-800'}`}>
                {isCompany ? 'Société' : 'Employé'}
              </Text>
            </View>
          </View>
        </View>

        {deletion.reason && (
          <View className="mt-3 pt-3 border-t border-slate-100">
            <Text className="text-xs text-slate-400 mb-1">Motif</Text>
            <Text className="text-sm text-slate-600">{deletion.reason}</Text>
          </View>
        )}

        <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-100">
          <Pressable
            onPress={() => {
              setItemToRestore(deletion);
              setShowRestoreModal(true);
            }}
            className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-50 active:bg-emerald-100"
          >
            <RotateCcw size={16} color="#10b981" />
            <Text className="text-sm font-medium text-emerald-700">Restaurer</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <RestoreConfirmationModal />

      {/* Header */}
      <View className="px-5 pt-2 pb-4 flex-row items-center border-b border-slate-200 bg-white">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3 active:bg-slate-200"
        >
          <ArrowLeft size={20} color="#64748b" />
        </Pressable>
        <Text className="text-xl font-bold text-slate-900 flex-1">Historique des suppressions</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-4">
          {/* Stats */}
          <View className="flex-row gap-3 mb-4">
            <Pressable
              onPress={() => setFilter('all')}
              className={`flex-1 rounded-xl p-4 border ${
                filter === 'all' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'
              }`}
            >
              <Text className={`text-2xl font-bold ${filter === 'all' ? 'text-indigo-600' : 'text-slate-900'}`}>
                {deletions.length}
              </Text>
              <Text className="text-sm text-slate-500">Total</Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('company')}
              className={`flex-1 rounded-xl p-4 border ${
                filter === 'company' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'
              }`}
            >
              <Text className={`text-2xl font-bold ${filter === 'company' ? 'text-amber-600' : 'text-slate-900'}`}>
                {companyCount}
              </Text>
              <Text className="text-sm text-slate-500">Sociétés</Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('employee')}
              className={`flex-1 rounded-xl p-4 border ${
                filter === 'employee' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'
              }`}
            >
              <Text className={`text-2xl font-bold ${filter === 'employee' ? 'text-indigo-600' : 'text-slate-900'}`}>
                {employeeCount}
              </Text>
              <Text className="text-sm text-slate-500">Employés</Text>
            </Pressable>
          </View>

          {/* List */}
          {filteredDeletions.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 border border-slate-100 items-center">
              <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
                <Trash2 size={32} color="#cbd5e1" />
              </View>
              <Text className="text-lg font-semibold text-slate-900 mb-1">Aucune suppression</Text>
              <Text className="text-slate-500 text-center">
                L'historique des suppressions apparaîtra ici.
              </Text>
            </View>
          ) : (
            filteredDeletions.map((deletion) => (
              <DeletionCard key={deletion.id} deletion={deletion} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
