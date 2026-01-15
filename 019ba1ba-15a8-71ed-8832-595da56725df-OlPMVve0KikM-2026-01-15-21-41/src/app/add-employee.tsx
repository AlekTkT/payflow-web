import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { X, Check, User, Briefcase, Euro, Calendar, Building2, ChevronDown, AlertTriangle, Crown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useCreateEmployee, useCompanies } from '@/lib/hooks/usePayflow';
import { useSubscriptionStore, PLANS, PlanType } from '@/lib/state/subscription-store';
import { UpgradeModal } from '@/components/UpgradeModal';

// Company ID pour la démo (Société A)
const DEMO_COMPANY_ID = 'company-a-1';

interface EmployeeForm {
  fullName: string;
  position: string;
  hourlyRate: string;
  contractType: string;
  hireDate: string;
  clientCompanyId: string;
  socialSecurityNumber: string;
  email: string;
  phone: string;
  address: string;
}

const CONTRACT_TYPES = ['CDI', 'CDD', 'Intérim', 'Stage', 'Alternance'];

export default function AddEmployeeScreen() {
  const [form, setForm] = useState<EmployeeForm>({
    fullName: '',
    position: '',
    hourlyRate: '',
    contractType: 'CDI',
    hireDate: new Date().toISOString().split('T')[0],
    clientCompanyId: '',
    socialSecurityNumber: '',
    email: '',
    phone: '',
    address: '',
  });

  const [showContractPicker, setShowContractPicker] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const createEmployee = useCreateEmployee();
  const { data: companies } = useCompanies();

  // Subscription checks
  const canAddEmployee = useSubscriptionStore((s) => s.canAddEmployee(DEMO_COMPANY_ID));
  const subscription = useSubscriptionStore((s) => s.getSubscription(DEMO_COMPANY_ID));
  const updateEmployeeCount = useSubscriptionStore((s) => s.updateEmployeeCount);

  const currentPlan = subscription?.plan || 'professional';
  const planConfig = PLANS[currentPlan];

  const clientCompanies = companies?.filter(c => c.type === 'client') ?? [];
  const selectedClient = clientCompanies.find(c => c.id === form.clientCompanyId);

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.position.trim() || !form.hourlyRate || !form.clientCompanyId) {
      return;
    }

    // Check subscription limits
    if (!canAddEmployee.allowed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowUpgradeModal(true);
      return;
    }

    try {
      await createEmployee.mutateAsync({
        full_name: form.fullName.trim(),
        position: form.position.trim(),
        hourly_rate: parseFloat(form.hourlyRate),
        contract_type: form.contractType,
        hire_date: form.hireDate,
        employer_company_id: '11111111-1111-1111-1111-111111111111',
        client_company_id: form.clientCompanyId,
      });

      // Update employee count in subscription
      updateEmployeeCount(DEMO_COMPANY_ID, (subscription?.employeeCount || 0) + 1);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Erreur création employé:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const isFormValid = form.fullName.trim().length > 0 &&
    form.position.trim().length > 0 &&
    parseFloat(form.hourlyRate) > 0 &&
    form.clientCompanyId.length > 0;

  // Calculate estimated monthly salary
  const hourlyRate = parseFloat(form.hourlyRate) || 0;
  const estimatedGross = hourlyRate * 151.67;
  const estimatedNet = estimatedGross * 0.78; // Approximate

  // Calculate usage percentage
  const usagePercent = planConfig.employeeLimit !== Infinity
    ? Math.min(100, ((subscription?.employeeCount || 0) / planConfig.employeeLimit) * 100)
    : 0;
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = !canAddEmployee.allowed;

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
          <Text className="text-lg font-bold text-slate-900">Nouvel employé</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 py-6">
            {/* Subscription Warning Banner */}
            {(isNearLimit || isAtLimit) && (
              <Pressable
                onPress={() => setShowUpgradeModal(true)}
                className={`mb-6 rounded-xl p-4 flex-row items-center gap-3 ${
                  isAtLimit ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                }`}
              >
                {isAtLimit ? (
                  <AlertTriangle size={24} color="#ef4444" />
                ) : (
                  <Crown size={24} color="#f59e0b" />
                )}
                <View className="flex-1">
                  <Text className={`font-semibold ${isAtLimit ? 'text-red-800' : 'text-amber-800'}`}>
                    {isAtLimit ? 'Limite atteinte' : 'Limite proche'}
                  </Text>
                  <Text className={`text-sm ${isAtLimit ? 'text-red-700' : 'text-amber-700'}`}>
                    {canAddEmployee.currentCount}/{canAddEmployee.limit} employés • {isAtLimit ? 'Passez au plan supérieur' : 'Pensez à upgrader'}
                  </Text>
                </View>
                <Text className={`font-medium ${isAtLimit ? 'text-red-600' : 'text-amber-600'}`}>
                  Upgrade
                </Text>
              </Pressable>
            )}

            {/* Icon Header */}
            <View className="items-center mb-6">
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' }}
              >
                <User size={36} color="white" />
              </LinearGradient>
              <Text className="text-lg font-bold text-slate-900 mt-3">Ajouter un salarié</Text>
              <Text className="text-slate-500 text-sm text-center mt-1">
                Renseignez les informations du nouveau collaborateur
              </Text>
            </View>

            {/* Form Sections */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Identité</Text>

              <View className="gap-4">
                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Nom complet *
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <User size={20} color="#94a3b8" />
                    <TextInput
                      value={form.fullName}
                      onChangeText={(text) => setForm({ ...form, fullName: text })}
                      className="flex-1 py-3 ml-3 text-base text-slate-900"
                      placeholder="Ex: Jean Dupont"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    N° Sécurité sociale
                  </Text>
                  <TextInput
                    value={form.socialSecurityNumber}
                    onChangeText={(text) => setForm({ ...form, socialSecurityNumber: text })}
                    keyboardType="number-pad"
                    maxLength={15}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900"
                    placeholder="1 XX XX XX XXX XXX XX"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Contrat</Text>

              <View className="gap-4">
                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Poste / Fonction *
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <Briefcase size={20} color="#94a3b8" />
                    <TextInput
                      value={form.position}
                      onChangeText={(text) => setForm({ ...form, position: text })}
                      className="flex-1 py-3 ml-3 text-base text-slate-900"
                      placeholder="Ex: Développeur Senior"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Type de contrat *
                  </Text>
                  <Pressable
                    onPress={() => setShowContractPicker(!showContractPicker)}
                    className="flex-row items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                  >
                    <Text className="text-base text-slate-900">{form.contractType}</Text>
                    <ChevronDown size={20} color="#64748b" />
                  </Pressable>
                  {showContractPicker && (
                    <View className="mt-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
                      {CONTRACT_TYPES.map((type) => (
                        <Pressable
                          key={type}
                          onPress={() => {
                            setForm({ ...form, contractType: type });
                            setShowContractPicker(false);
                          }}
                          className={`px-4 py-3 border-b border-slate-100 ${form.contractType === type ? 'bg-indigo-50' : ''}`}
                        >
                          <Text className={`text-base ${form.contractType === type ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                            {type}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

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
                            setForm({ ...form, clientCompanyId: company.id });
                            setShowClientPicker(false);
                          }}
                          className={`px-4 py-3 border-b border-slate-100 ${form.clientCompanyId === company.id ? 'bg-indigo-50' : ''}`}
                        >
                          <Text className={`text-base ${form.clientCompanyId === company.id ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                            {company.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Date d'embauche *
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <Calendar size={20} color="#94a3b8" />
                    <TextInput
                      value={form.hireDate}
                      onChangeText={(text) => setForm({ ...form, hireDate: text })}
                      className="flex-1 py-3 ml-3 text-base text-slate-900"
                      placeholder="AAAA-MM-JJ"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Rémunération</Text>

              <View className="gap-4">
                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Taux horaire brut (€) *
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <Euro size={20} color="#94a3b8" />
                    <TextInput
                      value={form.hourlyRate}
                      onChangeText={(text) => setForm({ ...form, hourlyRate: text })}
                      keyboardType="decimal-pad"
                      className="flex-1 py-3 ml-3 text-base text-slate-900"
                      placeholder="Ex: 45.00"
                      placeholderTextColor="#94a3b8"
                    />
                    <Text className="text-slate-500">€/h</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Salary Preview */}
            {hourlyRate > 0 && (
              <View className="bg-emerald-50 rounded-2xl p-5 border-2 border-emerald-200 mb-6">
                <View className="flex-row items-center gap-2 mb-4">
                  <Euro size={20} color="#059669" />
                  <Text className="text-lg font-bold text-slate-900">Estimation mensuelle</Text>
                </View>

                <View className="gap-3">
                  <View className="flex-row justify-between items-center py-2 border-b border-emerald-200">
                    <Text className="text-slate-600">Base mensuelle (151,67h)</Text>
                    <Text className="font-semibold text-slate-900">{estimatedGross.toFixed(2)}€</Text>
                  </View>
                  <View className="flex-row justify-between items-center pt-2">
                    <Text className="text-lg font-bold text-slate-900">Net estimé</Text>
                    <Text className="text-2xl font-bold text-emerald-600">{estimatedNet.toFixed(2)}€</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Contact Info */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Contact (optionnel)</Text>

              <View className="gap-4">
                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Email
                  </Text>
                  <TextInput
                    value={form.email}
                    onChangeText={(text) => setForm({ ...form, email: text })}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900"
                    placeholder="email@exemple.com"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Téléphone
                  </Text>
                  <TextInput
                    value={form.phone}
                    onChangeText={(text) => setForm({ ...form, phone: text })}
                    keyboardType="phone-pad"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900"
                    placeholder="06 12 34 56 78"
                    placeholderTextColor="#94a3b8"
                  />
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
            disabled={!isFormValid || createEmployee.isPending}
            className={`flex-1 flex-row items-center justify-center gap-2 py-4 rounded-xl ${
              isFormValid && !createEmployee.isPending
                ? isAtLimit
                  ? 'bg-amber-500 active:bg-amber-600'
                  : 'bg-emerald-500 active:bg-emerald-600'
                : 'bg-slate-300'
            }`}
          >
            {createEmployee.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : isAtLimit ? (
              <>
                <Crown size={20} color="white" />
                <Text className="font-semibold text-white">Upgrade requis</Text>
              </>
            ) : (
              <>
                <Check size={20} color="white" />
                <Text className="font-semibold text-white">Créer</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={currentPlan}
        reason={canAddEmployee.reason}
        currentCount={canAddEmployee.currentCount}
        limit={canAddEmployee.limit}
        companyId={DEMO_COMPANY_ID}
      />
    </SafeAreaView>
  );
}
