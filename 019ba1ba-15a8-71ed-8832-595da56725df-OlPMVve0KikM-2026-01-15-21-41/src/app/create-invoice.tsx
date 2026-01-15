import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { X, Check, Euro, Building2, Calendar, ChevronDown, Users, FileText } from 'lucide-react-native';
import { useCreateInvoice, useCompanies, useEmployees } from '@/lib/hooks/usePayflow';

const MONTHS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
];

export default function CreateInvoiceScreen() {
  const now = new Date();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const createInvoice = useCreateInvoice();
  const { data: companies } = useCompanies();
  const { data: employees } = useEmployees();

  const clientCompanies = companies?.filter(c => c.type === 'client') ?? [];
  const selectedClient = clientCompanies.find(c => c.id === selectedClientId);

  // Get employees for selected client
  const clientEmployees = employees?.filter(e => e.client_company_id === selectedClientId) ?? [];

  // Calculate invoice amount based on employees
  const calculatedAmount = clientEmployees.reduce((sum, emp) => {
    const monthlyRate = emp.hourly_rate * 151.67;
    const margin = monthlyRate * 0.1; // 10% margin
    return sum + monthlyRate + margin;
  }, 0);

  const finalAmount = customAmount ? parseFloat(customAmount) : calculatedAmount;

  // Generate invoice number
  const invoiceNumber = `FAC-${selectedYear}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;

  // Due date (15 days after invoice)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);

  const handleSubmit = async () => {
    if (!selectedClientId) {
      return;
    }

    try {
      await createInvoice.mutateAsync({
        invoice_number: invoiceNumber,
        client_company_id: selectedClientId,
        issuer_company_id: '11111111-1111-1111-1111-111111111111',
        month: selectedMonth,
        year: selectedYear,
        amount: finalAmount,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'draft',
      });
      router.back();
    } catch (error) {
      console.error('Erreur création facture:', error);
    }
  };

  const isFormValid = selectedClientId.length > 0 && finalAmount > 0;

  const selectedMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label ?? '';

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <X size={24} color="#64748b" />
          </Pressable>
          <Text className="text-lg font-bold text-slate-900">Créer une facture</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 py-6">
            {/* Icon Header */}
            <View className="items-center mb-6">
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' }}
              >
                <Euro size={36} color="white" />
              </LinearGradient>
              <Text className="text-lg font-bold text-slate-900 mt-3">Nouvelle facture</Text>
              <Text className="text-slate-500 text-sm text-center mt-1">
                Générez une facture pour une société cliente
              </Text>
            </View>

            {/* Invoice Info Preview */}
            <View className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-200">
              <View className="flex-row items-center gap-2 mb-3">
                <FileText size={18} color="#64748b" />
                <Text className="font-semibold text-slate-700">Aperçu facture</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-500">Numéro</Text>
                <Text className="font-mono font-semibold text-slate-900">{invoiceNumber}</Text>
              </View>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-slate-500">Émetteur</Text>
                <Text className="font-semibold text-slate-900">TalentFlow SAS</Text>
              </View>
            </View>

            {/* Form */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Destinataire</Text>

              <View>
                <Text className="text-sm font-medium text-slate-700 mb-2">
                  Société cliente *
                </Text>
                <Pressable
                  onPress={() => setShowClientPicker(!showClientPicker)}
                  className="flex-row items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                >
                  <View className="flex-row items-center gap-3">
                    <Building2 size={20} color="#94a3b8" />
                    <Text className={`text-base ${selectedClient ? 'text-slate-900' : 'text-slate-400'}`}>
                      {selectedClient?.name ?? 'Sélectionner une société'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color="#64748b" />
                </Pressable>
                {showClientPicker && (
                  <View className="mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {clientCompanies.map((company) => (
                      <Pressable
                        key={company.id}
                        onPress={() => {
                          setSelectedClientId(company.id);
                          setShowClientPicker(false);
                        }}
                        className={`px-4 py-3 border-b border-slate-100 ${selectedClientId === company.id ? 'bg-amber-50' : ''}`}
                      >
                        <Text className={`text-base ${selectedClientId === company.id ? 'text-amber-600 font-medium' : 'text-slate-700'}`}>
                          {company.name}
                        </Text>
                        <Text className="text-xs text-slate-400">
                          SIRET: {company.siret ?? 'Non renseigné'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {selectedClient && (
                <View className="mt-4 bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Users size={16} color="#d97706" />
                    <Text className="font-medium text-amber-800">
                      {clientEmployees.length} employé{clientEmployees.length > 1 ? 's' : ''} concerné{clientEmployees.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  {clientEmployees.slice(0, 3).map((emp) => (
                    <Text key={emp.id} className="text-sm text-amber-700 ml-6">
                      • {emp.full_name} - {emp.position}
                    </Text>
                  ))}
                  {clientEmployees.length > 3 && (
                    <Text className="text-sm text-amber-600 ml-6 mt-1">
                      + {clientEmployees.length - 3} autre{clientEmployees.length - 3 > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Période</Text>

              <View>
                <Text className="text-sm font-medium text-slate-700 mb-2">
                  Mois de facturation
                </Text>
                <Pressable
                  onPress={() => setShowMonthPicker(!showMonthPicker)}
                  className="flex-row items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                >
                  <View className="flex-row items-center gap-3">
                    <Calendar size={20} color="#94a3b8" />
                    <Text className="text-base text-slate-900">
                      {selectedMonthLabel} {selectedYear}
                    </Text>
                  </View>
                  <ChevronDown size={20} color="#64748b" />
                </Pressable>
                {showMonthPicker && (
                  <View className="mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden max-h-48">
                    <ScrollView nestedScrollEnabled>
                      {MONTHS.map((month) => (
                        <Pressable
                          key={month.value}
                          onPress={() => {
                            setSelectedMonth(month.value);
                            setShowMonthPicker(false);
                          }}
                          className={`px-4 py-3 border-b border-slate-100 ${selectedMonth === month.value ? 'bg-amber-50' : ''}`}
                        >
                          <Text className={`text-base ${selectedMonth === month.value ? 'text-amber-600 font-medium' : 'text-slate-700'}`}>
                            {month.label} {selectedYear}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Montant</Text>

              <View className="gap-4">
                {selectedClientId && (
                  <View className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <Text className="text-sm text-slate-500 mb-2">Montant calculé automatiquement</Text>
                    <Text className="text-2xl font-bold text-slate-900">{calculatedAmount.toFixed(2)}€</Text>
                    <Text className="text-xs text-slate-400 mt-1">
                      Basé sur les taux horaires + 10% de marge
                    </Text>
                  </View>
                )}

                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Montant personnalisé (optionnel)
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <Euro size={20} color="#94a3b8" />
                    <TextInput
                      value={customAmount}
                      onChangeText={setCustomAmount}
                      keyboardType="decimal-pad"
                      className="flex-1 py-3 ml-3 text-base text-slate-900"
                      placeholder={calculatedAmount.toFixed(2)}
                      placeholderTextColor="#94a3b8"
                    />
                    <Text className="text-slate-500">€</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Summary */}
            <View className="bg-amber-50 rounded-2xl p-5 border-2 border-amber-200">
              <View className="flex-row items-center gap-2 mb-4">
                <Euro size={20} color="#d97706" />
                <Text className="text-lg font-bold text-slate-900">Récapitulatif</Text>
              </View>

              <View className="gap-3">
                <View className="flex-row justify-between items-center py-2 border-b border-amber-200">
                  <Text className="text-slate-600">Client</Text>
                  <Text className="font-semibold text-slate-900">{selectedClient?.name ?? '-'}</Text>
                </View>
                <View className="flex-row justify-between items-center py-2 border-b border-amber-200">
                  <Text className="text-slate-600">Période</Text>
                  <Text className="font-semibold text-slate-900">{selectedMonthLabel} {selectedYear}</Text>
                </View>
                <View className="flex-row justify-between items-center py-2 border-b border-amber-200">
                  <Text className="text-slate-600">Échéance</Text>
                  <Text className="font-semibold text-slate-900">
                    {dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center pt-3">
                  <Text className="text-lg font-bold text-slate-900">Montant HT</Text>
                  <Text className="text-2xl font-bold text-amber-600">{finalAmount.toFixed(2)}€</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View className="px-5 py-4 border-t border-slate-100 flex-row gap-3">
          <Pressable
            onPress={() => router.back()}
            className="flex-1 py-4 rounded-xl bg-slate-100 active:bg-slate-200"
          >
            <Text className="text-center font-semibold text-slate-700">Annuler</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            disabled={!isFormValid || createInvoice.isPending}
            className={`flex-1 flex-row items-center justify-center gap-2 py-4 rounded-xl ${
              isFormValid && !createInvoice.isPending ? 'bg-amber-500 active:bg-amber-600' : 'bg-slate-300'
            }`}
          >
            {createInvoice.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Check size={20} color="white" />
                <Text className="font-semibold text-white">Créer</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
