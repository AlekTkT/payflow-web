import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { X, Check, FileText, User, Euro, Calendar, ChevronDown, Clock, Briefcase, Building2, Search, Send, Download, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useUpsertPayslip, useUpsertMonthlyVariables, useEmployees, useCompanies, useMonthlyVariables, useUpdateMonthlyVariables } from '@/lib/hooks/usePayflow';

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

// French payslip deduction rates (simplified)
const DEDUCTIONS = {
  csg_crds: 0.098, // CSG + CRDS
  assurance_maladie: 0.007,
  assurance_chomage: 0.024,
  retraite_base: 0.069,
  retraite_complementaire: 0.039,
  prevoyance: 0.015,
};

type GenerationStep = 'form' | 'generating' | 'success';

export default function GeneratePayslipScreen() {
  const now = new Date();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [generationStep, setGenerationStep] = useState<GenerationStep>('form');
  const [generatedPayslipId, setGeneratedPayslipId] = useState<string | null>(null);

  // Variable fields
  const [hoursWorked, setHoursWorked] = useState(151.67);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [vacationDays, setVacationDays] = useState(0);
  const [sickDays, setSickDays] = useState(0);
  const [bonuses, setBonuses] = useState(0);

  const upsertPayslip = useUpsertPayslip();
  const upsertMonthlyVariables = useUpsertMonthlyVariables();
  const updateMonthlyVariables = useUpdateMonthlyVariables();
  const { data: employees } = useEmployees();
  const { data: companies } = useCompanies();

  const selectedEmployee = employees?.find(e => e.id === selectedEmployeeId);
  const employerCompany = companies?.find(c => c.id === selectedEmployee?.employer_company_id);
  const clientCompany = companies?.find(c => c.id === selectedEmployee?.client_company_id);

  // Load existing monthly variables for the selected employee and period
  const { data: existingVariables, isLoading: loadingVariables } = useMonthlyVariables(
    selectedEmployeeId,
    selectedMonth,
    selectedYear
  );

  // Check if variables were submitted by Société B
  const existingVar = existingVariables?.[0];
  const hasSubmittedVariables = existingVar?.status === 'submitted';
  const hasValidatedVariables = existingVar?.status === 'validated';

  // Auto-fill form when existing variables are loaded
  useEffect(() => {
    if (existingVar) {
      setHoursWorked(existingVar.hours_worked);
      setOvertimeHours(existingVar.overtime_hours);
      setVacationDays(existingVar.vacation_days);
      setSickDays(existingVar.sick_days);
      setBonuses(existingVar.bonuses);
    } else {
      // Reset to defaults if no existing variables
      setHoursWorked(151.67);
      setOvertimeHours(0);
      setVacationDays(0);
      setSickDays(0);
      setBonuses(0);
    }
  }, [existingVar]);

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (!searchQuery.trim()) return employees;

    const query = searchQuery.toLowerCase().trim();
    return employees.filter(employee =>
      employee.full_name.toLowerCase().includes(query) ||
      employee.position.toLowerCase().includes(query)
    );
  }, [employees, searchQuery]);

  // Calculate salary
  const hourlyRate = selectedEmployee?.hourly_rate ?? 0;
  const baseSalary = hoursWorked * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * 1.25;
  const grossSalary = baseSalary + overtimePay + bonuses;

  // Calculate deductions
  const totalDeductionRate = Object.values(DEDUCTIONS).reduce((sum, rate) => sum + rate, 0);
  const totalDeductions = grossSalary * totalDeductionRate;
  const netSalary = grossSalary - totalDeductions;

  // Employer charges (approximate)
  const employerCharges = grossSalary * 0.42;

  const handleSubmit = async () => {
    if (!selectedEmployeeId) {
      return;
    }

    setGenerationStep('generating');

    try {
      // First create or update monthly variables record
      const monthlyVariables = await upsertMonthlyVariables.mutateAsync({
        employee_id: selectedEmployeeId,
        month: selectedMonth,
        year: selectedYear,
        hours_worked: hoursWorked,
        overtime_hours: overtimeHours,
        vacation_days: vacationDays,
        sick_days: sickDays,
        bonuses: bonuses,
        status: 'validated',
      });

      // Then create or update payslip with the monthly_variables_id
      const payslip = await upsertPayslip.mutateAsync({
        employee_id: selectedEmployeeId,
        monthly_variables_id: monthlyVariables.id,
        month: selectedMonth,
        year: selectedYear,
        gross_salary: Math.round(grossSalary * 100) / 100,
        net_salary: Math.round(netSalary * 100) / 100,
        status: 'generated',
      });

      setGeneratedPayslipId(payslip.id);
      setGenerationStep('success');
    } catch (error) {
      console.error('Erreur génération bulletin:', error);
      setGenerationStep('form');
    }
  };

  const handleViewPayslip = () => {
    if (generatedPayslipId) {
      router.replace(`/payslip-viewer?id=${generatedPayslipId}`);
    }
  };

  const handleDistributeToClient = () => {
    if (generatedPayslipId) {
      router.replace(`/payslip-viewer?id=${generatedPayslipId}&action=share`);
    }
  };

  const handleGenerateAnother = () => {
    setGenerationStep('form');
    setGeneratedPayslipId(null);
    setSelectedEmployeeId('');
  };

  const isFormValid = selectedEmployeeId.length > 0;
  const isLoading = upsertPayslip.isPending || upsertMonthlyVariables.isPending;

  const selectedMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label ?? '';

  // Success Screen
  if (generationStep === 'success') {
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
              Bulletin généré !
            </Text>
            <Text className="text-slate-500 text-center mb-2">
              Le bulletin de {selectedEmployee?.full_name} pour {selectedMonthLabel} {selectedYear} a été créé et stocké.
            </Text>
            <View className="flex-row items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg mb-8">
              <Building2 size={16} color="#6366f1" />
              <Text className="text-indigo-700 text-sm font-medium">
                Stocké dans {employerCompany?.name ?? 'Société A'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="w-full gap-3">
              <Pressable
                onPress={handleViewPayslip}
                className="flex-row items-center justify-center gap-2 py-4 px-6 bg-indigo-500 rounded-xl active:bg-indigo-600"
              >
                <Download size={20} color="white" />
                <Text className="font-semibold text-white">Voir le bulletin</Text>
              </Pressable>

              <Pressable
                onPress={handleDistributeToClient}
                className="flex-row items-center justify-center gap-2 py-4 px-6 bg-emerald-500 rounded-xl active:bg-emerald-600"
              >
                <Send size={20} color="white" />
                <Text className="font-semibold text-white">
                  Distribuer à {clientCompany?.name ?? 'Société B'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleGenerateAnother}
                className="flex-row items-center justify-center gap-2 py-4 px-6 bg-slate-100 rounded-xl active:bg-slate-200"
              >
                <FileText size={20} color="#64748b" />
                <Text className="font-semibold text-slate-700">Générer un autre bulletin</Text>
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

  // Generating Screen
  if (generationStep === 'generating') {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}
        >
          <ActivityIndicator size="large" color="white" />
        </LinearGradient>
        <Text className="text-xl font-bold text-slate-900 mb-2">Génération en cours...</Text>
        <Text className="text-slate-500 text-center px-8">
          Création du bulletin de paie pour {selectedEmployee?.full_name}
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
          <Text className="text-lg font-bold text-slate-900">Générer un bulletin</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 py-6">
            {/* Icon Header */}
            <View className="items-center mb-6">
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' }}
              >
                <FileText size={36} color="white" />
              </LinearGradient>
              <Text className="text-lg font-bold text-slate-900 mt-3">Bulletin de paie</Text>
              <Text className="text-slate-500 text-sm text-center mt-1">
                Générez un bulletin cohérent avec les variables du salarié
              </Text>
            </View>

            {/* Employee Selection with Search */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Salarié</Text>

              <View>
                <Text className="text-sm font-medium text-slate-700 mb-2">
                  Rechercher un employé *
                </Text>

                {/* Search Input */}
                <Pressable
                  onPress={() => setShowEmployeePicker(true)}
                  className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-2"
                >
                  <Search size={20} color="#94a3b8" />
                  <Text className={`flex-1 ml-3 text-base ${selectedEmployee ? 'text-slate-900' : 'text-slate-400'}`}>
                    {selectedEmployee?.full_name ?? 'Rechercher par nom, poste...'}
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
                      <Text className="text-lg font-bold text-slate-900">Sélectionner un salarié</Text>
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
                          placeholder="Rechercher par nom, poste, email..."
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
                        {filteredEmployees.length} salarié{filteredEmployees.length > 1 ? 's' : ''} trouvé{filteredEmployees.length > 1 ? 's' : ''}
                      </Text>
                    </View>

                    {/* Employee List */}
                    <ScrollView className="flex-1">
                      {filteredEmployees.length === 0 ? (
                        <View className="items-center justify-center py-12">
                          <User size={48} color="#cbd5e1" />
                          <Text className="text-slate-400 mt-3">Aucun salarié trouvé</Text>
                        </View>
                      ) : (
                        filteredEmployees.map((employee) => {
                          const empCompany = companies?.find(c => c.id === employee.employer_company_id);
                          const cltCompany = companies?.find(c => c.id === employee.client_company_id);

                          return (
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
                                  <View className="flex-row items-center gap-2 mt-1">
                                    <Text className="text-xs text-slate-400">
                                      {empCompany?.name ?? 'N/A'} → {cltCompany?.name ?? 'N/A'}
                                    </Text>
                                  </View>
                                </View>
                                {selectedEmployeeId === employee.id && (
                                  <Check size={20} color="#6366f1" />
                                )}
                              </View>
                            </Pressable>
                          );
                        })
                      )}
                    </ScrollView>
                  </SafeAreaView>
                </Modal>
              </View>

              {/* Employee Info Card */}
              {selectedEmployee && (
                <View className="mt-4 bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                  <View className="flex-row items-center gap-3 mb-3">
                    <LinearGradient
                      colors={['#6366f1', '#8b5cf6']}
                      style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text className="text-white font-bold">
                        {selectedEmployee.full_name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </LinearGradient>
                    <View className="flex-1">
                      <Text className="font-semibold text-slate-900">{selectedEmployee.full_name}</Text>
                      <Text className="text-sm text-slate-500">{selectedEmployee.position}</Text>
                    </View>
                  </View>
                  <View className="gap-2">
                    <View className="flex-row items-center gap-2">
                      <Building2 size={14} color="#6366f1" />
                      <Text className="text-sm text-slate-600">
                        Employeur: {employerCompany?.name ?? 'N/A'}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Briefcase size={14} color="#6366f1" />
                      <Text className="text-sm text-slate-600">
                        Client: {clientCompany?.name ?? 'N/A'}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Euro size={14} color="#6366f1" />
                      <Text className="text-sm text-slate-600">
                        Taux horaire: {selectedEmployee.hourly_rate}€/h
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Period Selection */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Période</Text>

              <View>
                <Text className="text-sm font-medium text-slate-700 mb-2">
                  Mois du bulletin
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
            </View>

            {/* Variables Summary */}
            {selectedEmployee && (
              <>
                <View className="mb-6">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-bold text-slate-900">Variables du mois</Text>
                    {loadingVariables ? (
                      <ActivityIndicator size="small" color="#6366f1" />
                    ) : hasSubmittedVariables ? (
                      <View className="flex-row items-center gap-1 bg-blue-100 px-2 py-1 rounded">
                        <Clock size={14} color="#2563eb" />
                        <Text className="text-xs font-medium text-blue-700">Soumises par {clientCompany?.name ?? 'Client'}</Text>
                      </View>
                    ) : hasValidatedVariables ? (
                      <View className="flex-row items-center gap-1 bg-emerald-100 px-2 py-1 rounded">
                        <Check size={14} color="#059669" />
                        <Text className="text-xs font-medium text-emerald-700">Validées</Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center gap-1 bg-amber-100 px-2 py-1 rounded">
                        <AlertCircle size={14} color="#d97706" />
                        <Text className="text-xs font-medium text-amber-700">Non saisies</Text>
                      </View>
                    )}
                  </View>

                  {/* Info banner if variables submitted by client */}
                  {hasSubmittedVariables && (
                    <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                      <View className="flex-row items-start gap-2">
                        <AlertCircle size={18} color="#3b82f6" />
                        <View className="flex-1">
                          <Text className="font-semibold text-blue-900">Variables transmises par {clientCompany?.name ?? 'le client'}</Text>
                          <Text className="text-sm text-blue-700 mt-1">
                            Ces variables ont été saisies par le client et sont prêtes à être validées pour générer le bulletin.
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  <View className="bg-slate-50 rounded-xl p-4 border border-slate-200 gap-3">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-2">
                        <Clock size={16} color="#64748b" />
                        <Text className="text-slate-600">Heures normales</Text>
                      </View>
                      <Text className="font-semibold text-slate-900">{hoursWorked}h</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-2">
                        <Clock size={16} color="#f59e0b" />
                        <Text className="text-slate-600">Heures supplémentaires</Text>
                      </View>
                      <Text className="font-semibold text-amber-600">{overtimeHours}h</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-2">
                        <Calendar size={16} color="#10b981" />
                        <Text className="text-slate-600">Congés payés</Text>
                      </View>
                      <Text className="font-semibold text-slate-900">{vacationDays} jours</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center gap-2">
                        <Euro size={16} color="#6366f1" />
                        <Text className="text-slate-600">Primes</Text>
                      </View>
                      <Text className="font-semibold text-indigo-600">{bonuses}€</Text>
                    </View>
                  </View>
                </View>

                {/* Salary Breakdown */}
                <View className="bg-indigo-50 rounded-2xl p-5 border-2 border-indigo-200">
                  <View className="flex-row items-center gap-2 mb-4">
                    <Euro size={20} color="#6366f1" />
                    <Text className="text-lg font-bold text-slate-900">Calcul du bulletin</Text>
                  </View>

                  <View className="gap-3">
                    {/* Gross calculation */}
                    <View className="bg-white rounded-xl p-3">
                      <Text className="text-xs font-medium text-slate-500 mb-2">SALAIRE BRUT</Text>
                      <View className="flex-row justify-between items-center py-1">
                        <Text className="text-slate-600">Salaire de base ({hoursWorked}h × {hourlyRate}€)</Text>
                        <Text className="font-medium text-slate-900">{baseSalary.toFixed(2)}€</Text>
                      </View>
                      {overtimeHours > 0 && (
                        <View className="flex-row justify-between items-center py-1">
                          <Text className="text-slate-600">Heures sup. ({overtimeHours}h × {(hourlyRate * 1.25).toFixed(2)}€)</Text>
                          <Text className="font-medium text-slate-900">{overtimePay.toFixed(2)}€</Text>
                        </View>
                      )}
                      {bonuses > 0 && (
                        <View className="flex-row justify-between items-center py-1">
                          <Text className="text-slate-600">Primes et bonus</Text>
                          <Text className="font-medium text-slate-900">{bonuses.toFixed(2)}€</Text>
                        </View>
                      )}
                      <View className="flex-row justify-between items-center pt-2 mt-2 border-t border-slate-200">
                        <Text className="font-semibold text-slate-900">Total brut</Text>
                        <Text className="font-bold text-slate-900">{grossSalary.toFixed(2)}€</Text>
                      </View>
                    </View>

                    {/* Deductions */}
                    <View className="bg-white rounded-xl p-3">
                      <Text className="text-xs font-medium text-slate-500 mb-2">COTISATIONS SALARIALES</Text>
                      <View className="flex-row justify-between items-center py-1">
                        <Text className="text-slate-600">CSG + CRDS (9.8%)</Text>
                        <Text className="font-medium text-red-600">-{(grossSalary * DEDUCTIONS.csg_crds).toFixed(2)}€</Text>
                      </View>
                      <View className="flex-row justify-between items-center py-1">
                        <Text className="text-slate-600">Assurance maladie (0.7%)</Text>
                        <Text className="font-medium text-red-600">-{(grossSalary * DEDUCTIONS.assurance_maladie).toFixed(2)}€</Text>
                      </View>
                      <View className="flex-row justify-between items-center py-1">
                        <Text className="text-slate-600">Assurance chômage (2.4%)</Text>
                        <Text className="font-medium text-red-600">-{(grossSalary * DEDUCTIONS.assurance_chomage).toFixed(2)}€</Text>
                      </View>
                      <View className="flex-row justify-between items-center py-1">
                        <Text className="text-slate-600">Retraite base (6.9%)</Text>
                        <Text className="font-medium text-red-600">-{(grossSalary * DEDUCTIONS.retraite_base).toFixed(2)}€</Text>
                      </View>
                      <View className="flex-row justify-between items-center py-1">
                        <Text className="text-slate-600">Retraite complémentaire (3.9%)</Text>
                        <Text className="font-medium text-red-600">-{(grossSalary * DEDUCTIONS.retraite_complementaire).toFixed(2)}€</Text>
                      </View>
                      <View className="flex-row justify-between items-center py-1">
                        <Text className="text-slate-600">Prévoyance (1.5%)</Text>
                        <Text className="font-medium text-red-600">-{(grossSalary * DEDUCTIONS.prevoyance).toFixed(2)}€</Text>
                      </View>
                      <View className="flex-row justify-between items-center pt-2 mt-2 border-t border-slate-200">
                        <Text className="font-semibold text-slate-900">Total cotisations</Text>
                        <Text className="font-bold text-red-600">-{totalDeductions.toFixed(2)}€</Text>
                      </View>
                    </View>

                    {/* Net salary */}
                    <View className="flex-row justify-between items-center pt-3 border-t-2 border-indigo-300">
                      <Text className="text-xl font-bold text-slate-900">Net à payer</Text>
                      <Text className="text-3xl font-bold text-indigo-600">{netSalary.toFixed(2)}€</Text>
                    </View>

                    {/* Employer charges info */}
                    <View className="bg-slate-100 rounded-lg p-3 mt-2">
                      <Text className="text-xs text-slate-500">
                        Charges patronales estimées: {employerCharges.toFixed(2)}€ (42% du brut)
                      </Text>
                      <Text className="text-xs text-slate-500 mt-1">
                        Coût total employeur: {(grossSalary + employerCharges).toFixed(2)}€
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Storage Info */}
                <View className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Building2 size={18} color="#3b82f6" />
                    <Text className="font-semibold text-blue-900">Stockage du bulletin</Text>
                  </View>
                  <Text className="text-sm text-blue-700">
                    Ce bulletin sera stocké dans {employerCompany?.name ?? 'Société A'} et pourra ensuite être distribué à {clientCompany?.name ?? 'Société B'}.
                  </Text>
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
                <FileText size={20} color="white" />
                <Text className="font-semibold text-white">Générer le bulletin</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
