import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Check, Clock, Calendar, Euro, AlertCircle, CheckCircle2, ChevronDown, Search, User } from 'lucide-react-native';
import { useEmployees, useUpsertMonthlyVariables, useMonthlyVariables } from '@/lib/hooks/usePayflow';
import { useCompanyId } from '@/lib/state/app-store';

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

interface VariablesForm {
  hoursWorked: string;
  overtimeHours: string;
  vacationDays: string;
  sickDays: string;
  bonuses: string;
}

type SubmitStep = 'form' | 'submitting' | 'success';

export default function ClientVariableEntryScreen() {
  const params = useLocalSearchParams<{ employeeId?: string }>();
  const companyId = useCompanyId();
  const now = new Date();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(params.employeeId ?? '');
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitStep, setSubmitStep] = useState<SubmitStep>('form');

  const [form, setForm] = useState<VariablesForm>({
    hoursWorked: '151.67',
    overtimeHours: '0',
    vacationDays: '0',
    sickDays: '0',
    bonuses: '0',
  });

  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const upsertMonthlyVariables = useUpsertMonthlyVariables();

  // Filter employees for the client company (Société B)
  // In demo mode, filter for TechCorp Industries
  const clientEmployees = employees?.filter(e =>
    companyId ? e.client_company_id === companyId : e.client_company?.name === 'TechCorp Industries'
  ) ?? [];

  const filteredEmployees = searchQuery.trim()
    ? clientEmployees.filter(e =>
        e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.position.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : clientEmployees;

  const selectedEmployee = employees?.find(e => e.id === selectedEmployeeId);

  // Load existing variables for the selected employee and period
  const { data: existingVariables } = useMonthlyVariables(
    selectedEmployeeId,
    selectedMonth,
    selectedYear
  );

  // Update form when existing variables are loaded
  useEffect(() => {
    if (existingVariables && existingVariables.length > 0) {
      const vars = existingVariables[0];
      setForm({
        hoursWorked: String(vars.hours_worked),
        overtimeHours: String(vars.overtime_hours),
        vacationDays: String(vars.vacation_days),
        sickDays: String(vars.sick_days),
        bonuses: String(vars.bonuses),
      });
    } else {
      setForm({
        hoursWorked: '151.67',
        overtimeHours: '0',
        vacationDays: '0',
        sickDays: '0',
        bonuses: '0',
      });
    }
  }, [existingVariables]);

  const hourlyRate = selectedEmployee?.hourly_rate ?? 0;
  const baseHours = 151.67;

  const calculateSalary = () => {
    const hours = parseFloat(form.hoursWorked) || 0;
    const overtime = parseFloat(form.overtimeHours) || 0;
    const bonusAmount = parseFloat(form.bonuses) || 0;

    const baseSalary = hours * hourlyRate;
    const overtimePay = overtime * hourlyRate * 1.25;
    const gross = baseSalary + overtimePay + bonusAmount;

    return {
      baseSalary: baseSalary.toFixed(2),
      overtimePay: overtimePay.toFixed(2),
      bonuses: bonusAmount.toFixed(2),
      gross: gross.toFixed(2),
    };
  };

  const salary = calculateSalary();

  const handleSubmit = async () => {
    if (!selectedEmployeeId) return;

    setSubmitStep('submitting');

    try {
      await upsertMonthlyVariables.mutateAsync({
        employee_id: selectedEmployeeId,
        month: selectedMonth,
        year: selectedYear,
        hours_worked: parseFloat(form.hoursWorked) || 151.67,
        overtime_hours: parseFloat(form.overtimeHours) || 0,
        vacation_days: parseInt(form.vacationDays) || 0,
        sick_days: parseInt(form.sickDays) || 0,
        bonuses: parseFloat(form.bonuses) || 0,
        status: 'submitted', // Submitted by Société B, waiting for validation by Société A
      });

      setSubmitStep('success');
    } catch (error) {
      console.error('Erreur soumission variables:', error);
      setSubmitStep('form');
    }
  };

  const handleSubmitAnother = () => {
    setSubmitStep('form');
    setSelectedEmployeeId('');
    setForm({
      hoursWorked: '151.67',
      overtimeHours: '0',
      vacationDays: '0',
      sickDays: '0',
      bonuses: '0',
    });
  };

  const isFormValid = selectedEmployeeId.length > 0;
  const isLoading = upsertMonthlyVariables.isPending;
  const selectedMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label ?? '';

  const existingStatus = existingVariables?.[0]?.status;

  if (loadingEmployees) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-500 mt-3">Chargement...</Text>
      </SafeAreaView>
    );
  }

  // Success Screen
  if (submitStep === 'success') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center">
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={{ width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}
            >
              <CheckCircle2 size={56} color="white" />
            </LinearGradient>

            <Text className="text-2xl font-bold text-slate-900 mb-2 text-center">
              Variables soumises !
            </Text>
            <Text className="text-slate-500 text-center mb-2">
              Les variables de {selectedEmployee?.full_name} pour {selectedMonthLabel} {selectedYear} ont été transmises.
            </Text>
            <View className="flex-row items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg mb-8">
              <Clock size={16} color="#d97706" />
              <Text className="text-amber-700 text-sm font-medium">
                En attente de validation par le prestataire
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="w-full gap-3">
              <Pressable
                onPress={handleSubmitAnother}
                className="flex-row items-center justify-center gap-2 py-4 px-6 bg-indigo-500 rounded-xl active:bg-indigo-600"
              >
                <User size={20} color="white" />
                <Text className="font-semibold text-white">Saisir pour un autre employé</Text>
              </Pressable>

              <Pressable
                onPress={() => router.back()}
                className="py-3"
              >
                <Text className="text-center text-slate-500">Retour au tableau de bord</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Submitting Screen
  if (submitStep === 'submitting') {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}
        >
          <ActivityIndicator size="large" color="white" />
        </LinearGradient>
        <Text className="text-xl font-bold text-slate-900 mb-2">Soumission en cours...</Text>
        <Text className="text-slate-500 text-center px-8">
          Transmission des variables pour {selectedEmployee?.full_name}
        </Text>
      </SafeAreaView>
    );
  }

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
          <Text className="text-lg font-bold text-slate-900">Saisie des variables</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 py-6">
            {/* Employee Selection */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Employé</Text>

              <Pressable
                onPress={() => setShowEmployeePicker(true)}
                className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
              >
                <Search size={20} color="#94a3b8" />
                <Text className={`flex-1 ml-3 text-base ${selectedEmployee ? 'text-slate-900' : 'text-slate-400'}`}>
                  {selectedEmployee?.full_name ?? 'Sélectionner un employé...'}
                </Text>
                <ChevronDown size={20} color="#64748b" />
              </Pressable>

              {/* Employee Picker Modal */}
              <Modal
                visible={showEmployeePicker}
                animationType="slide"
                presentationStyle="pageSheet"
              >
                <SafeAreaView className="flex-1 bg-white">
                  <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100">
                    <Text className="text-lg font-bold text-slate-900">Sélectionner un employé</Text>
                    <Pressable onPress={() => setShowEmployeePicker(false)} className="p-2 -mr-2">
                      <X size={24} color="#64748b" />
                    </Pressable>
                  </View>

                  {/* Search Bar */}
                  <View className="px-5 py-3 border-b border-slate-100">
                    <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3">
                      <Search size={20} color="#94a3b8" />
                      <TextInput
                        className="flex-1 ml-3 text-base text-slate-900"
                        placeholder="Rechercher par nom, poste..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                      />
                      {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery('')}>
                          <X size={18} color="#94a3b8" />
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {/* Results Count */}
                  <View className="px-5 py-2">
                    <Text className="text-sm text-slate-500">
                      {filteredEmployees.length} employé{filteredEmployees.length > 1 ? 's' : ''} dans votre entreprise
                    </Text>
                  </View>

                  {/* Employee List */}
                  <ScrollView className="flex-1">
                    {filteredEmployees.length === 0 ? (
                      <View className="items-center justify-center py-12">
                        <User size={48} color="#cbd5e1" />
                        <Text className="text-slate-400 mt-3">Aucun employé trouvé</Text>
                      </View>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <Pressable
                          key={employee.id}
                          onPress={() => {
                            setSelectedEmployeeId(employee.id);
                            setShowEmployeePicker(false);
                            setSearchQuery('');
                          }}
                          className={`px-5 py-4 border-b border-slate-100 ${selectedEmployeeId === employee.id ? 'bg-indigo-50' : ''}`}
                        >
                          <View className="flex-row items-center gap-3">
                            <LinearGradient
                              colors={selectedEmployeeId === employee.id ? ['#6366f1', '#8b5cf6'] : ['#94a3b8', '#64748b']}
                              style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Text className="text-white font-bold">
                                {employee.full_name.split(' ').map(n => n[0]).join('')}
                              </Text>
                            </LinearGradient>
                            <View className="flex-1">
                              <Text className={`text-base font-medium ${selectedEmployeeId === employee.id ? 'text-indigo-600' : 'text-slate-900'}`}>
                                {employee.full_name}
                              </Text>
                              <Text className="text-sm text-slate-500">
                                {employee.position} • {employee.hourly_rate}€/h
                              </Text>
                            </View>
                            {selectedEmployeeId === employee.id && (
                              <Check size={20} color="#6366f1" />
                            )}
                          </View>
                        </Pressable>
                      ))
                    )}
                  </ScrollView>
                </SafeAreaView>
              </Modal>
            </View>

            {/* Employee Info */}
            {selectedEmployee && (
              <View className="flex-row items-center gap-4 mb-6 bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="text-white font-bold text-xl">
                    {selectedEmployee.full_name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-900">{selectedEmployee.full_name}</Text>
                  <Text className="text-slate-500">{selectedEmployee.position}</Text>
                  <Text className="text-xs text-slate-400 mt-0.5">Taux: {hourlyRate}€/h</Text>
                </View>
              </View>
            )}

            {/* Period Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-slate-700 mb-2">Période</Text>
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
                        className={`px-4 py-3 border-b border-slate-100 ${selectedMonth === month.value ? 'bg-indigo-50' : ''}`}
                      >
                        <Text className={`text-base ${selectedMonth === month.value ? 'text-indigo-600 font-medium' : 'text-slate-700'}`}>
                          {month.label} {selectedYear}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Status Banner */}
            {existingStatus && (
              <View className={`rounded-xl p-4 mb-6 flex-row items-center gap-3 ${
                existingStatus === 'validated' ? 'bg-emerald-50 border border-emerald-200' :
                existingStatus === 'submitted' ? 'bg-amber-50 border border-amber-200' :
                'bg-slate-50 border border-slate-200'
              }`}>
                {existingStatus === 'validated' ? (
                  <>
                    <CheckCircle2 size={20} color="#059669" />
                    <View className="flex-1">
                      <Text className="font-medium text-emerald-800">Variables validées</Text>
                      <Text className="text-sm text-emerald-600">Le bulletin peut être généré par le prestataire</Text>
                    </View>
                  </>
                ) : existingStatus === 'submitted' ? (
                  <>
                    <Clock size={20} color="#d97706" />
                    <View className="flex-1">
                      <Text className="font-medium text-amber-800">En attente de validation</Text>
                      <Text className="text-sm text-amber-600">Vous pouvez modifier les variables</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <AlertCircle size={20} color="#64748b" />
                    <View className="flex-1">
                      <Text className="font-medium text-slate-700">Brouillon</Text>
                      <Text className="text-sm text-slate-500">Non encore soumis</Text>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Form Sections */}
            {selectedEmployee && (
              <>
                <View className="mb-6">
                  <Text className="text-lg font-bold text-slate-900 mb-4">Temps de travail</Text>

                  <View className="gap-4">
                    <View>
                      <Text className="text-sm font-medium text-slate-700 mb-2">
                        Heures normales travaillées
                      </Text>
                      <TextInput
                        value={form.hoursWorked}
                        onChangeText={(text) => setForm({ ...form, hoursWorked: text })}
                        keyboardType="decimal-pad"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900"
                        placeholder="151.67"
                      />
                      <Text className="text-xs text-slate-400 mt-1">Base mensuelle: {baseHours}h</Text>
                    </View>

                    <View>
                      <Text className="text-sm font-medium text-slate-700 mb-2">
                        Heures supplémentaires
                      </Text>
                      <TextInput
                        value={form.overtimeHours}
                        onChangeText={(text) => setForm({ ...form, overtimeHours: text })}
                        keyboardType="decimal-pad"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900"
                        placeholder="0"
                      />
                      <Text className="text-xs text-slate-400 mt-1">Majorées à 25%</Text>
                    </View>
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-lg font-bold text-slate-900 mb-4">Absences</Text>

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-slate-700 mb-2">
                        Congés payés (jours)
                      </Text>
                      <TextInput
                        value={form.vacationDays}
                        onChangeText={(text) => setForm({ ...form, vacationDays: text })}
                        keyboardType="number-pad"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900"
                        placeholder="0"
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-sm font-medium text-slate-700 mb-2">
                        Arrêt maladie (jours)
                      </Text>
                      <TextInput
                        value={form.sickDays}
                        onChangeText={(text) => setForm({ ...form, sickDays: text })}
                        keyboardType="number-pad"
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900"
                        placeholder="0"
                      />
                    </View>
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-lg font-bold text-slate-900 mb-4">Rémunération variable</Text>

                  <View>
                    <Text className="text-sm font-medium text-slate-700 mb-2">
                      Primes et bonus (€)
                    </Text>
                    <TextInput
                      value={form.bonuses}
                      onChangeText={(text) => setForm({ ...form, bonuses: text })}
                      keyboardType="decimal-pad"
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900"
                      placeholder="0"
                    />
                    <Text className="text-xs text-slate-400 mt-1">
                      Prime exceptionnelle, prime de performance, etc.
                    </Text>
                  </View>
                </View>

                {/* Salary Preview */}
                <View className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200">
                  <View className="flex-row items-center gap-2 mb-4">
                    <Euro size={20} color="#6366f1" />
                    <Text className="text-lg font-bold text-slate-900">Aperçu salarial estimé</Text>
                  </View>

                  <View className="gap-3">
                    <View className="flex-row justify-between items-center py-2 border-b border-slate-200">
                      <Text className="text-slate-600">Salaire de base</Text>
                      <Text className="font-semibold text-slate-900">{salary.baseSalary}€</Text>
                    </View>
                    <View className="flex-row justify-between items-center py-2 border-b border-slate-200">
                      <Text className="text-slate-600">Heures supplémentaires</Text>
                      <Text className="font-semibold text-slate-900">{salary.overtimePay}€</Text>
                    </View>
                    <View className="flex-row justify-between items-center py-2 border-b border-slate-200">
                      <Text className="text-slate-600">Primes</Text>
                      <Text className="font-semibold text-slate-900">{salary.bonuses}€</Text>
                    </View>
                    <View className="flex-row justify-between items-center pt-3">
                      <Text className="text-lg font-bold text-slate-900">Brut estimé</Text>
                      <Text className="text-2xl font-bold text-indigo-600">{salary.gross}€</Text>
                    </View>
                  </View>
                </View>

                {/* Info Banner */}
                <View className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <View className="flex-row items-start gap-2">
                    <AlertCircle size={18} color="#3b82f6" />
                    <View className="flex-1">
                      <Text className="font-semibold text-blue-900">Transmission automatique</Text>
                      <Text className="text-sm text-blue-700 mt-1">
                        Ces variables seront automatiquement transmises au prestataire ({selectedEmployee.employer_company?.name ?? 'Société A'}) pour la génération du bulletin de paie.
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
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
            disabled={!isFormValid || isLoading}
            className={`flex-1 flex-row items-center justify-center gap-2 py-4 rounded-xl ${
              isFormValid && !isLoading ? 'bg-indigo-500 active:bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Check size={20} color="white" />
                <Text className="font-semibold text-white">
                  {existingStatus === 'submitted' ? 'Mettre à jour' : 'Soumettre'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
