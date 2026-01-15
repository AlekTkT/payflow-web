import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Check, FileText, Euro, Calendar, Clock, Briefcase, Building2, Send, Download, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useUpsertPayslip, useUpsertMonthlyVariables, useEmployee, useCompanies, useMonthlyVariables } from '@/lib/hooks/usePayflow';

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
  csg_crds: 0.098,
  assurance_maladie: 0.007,
  assurance_chomage: 0.024,
  retraite_base: 0.069,
  retraite_complementaire: 0.039,
  prevoyance: 0.015,
};

type ValidationStep = 'review' | 'generating' | 'success';

export default function ValidateVariablesScreen() {
  const params = useLocalSearchParams<{ employeeId: string; month: string; year: string }>();
  const employeeId = params.employeeId ?? '';
  const month = params.month ?? String(new Date().getMonth() + 1).padStart(2, '0');
  const year = parseInt(params.year ?? String(new Date().getFullYear()));

  const [validationStep, setValidationStep] = useState<ValidationStep>('review');
  const [generatedPayslipId, setGeneratedPayslipId] = useState<string | null>(null);

  const upsertPayslip = useUpsertPayslip();
  const upsertMonthlyVariables = useUpsertMonthlyVariables();

  const { data: employee, isLoading: loadingEmployee } = useEmployee(employeeId);
  const { data: companies } = useCompanies();
  const { data: existingVariables, isLoading: loadingVariables } = useMonthlyVariables(employeeId, month, year);

  const employerCompany = companies?.find(c => c.id === employee?.employer_company_id);
  const clientCompany = companies?.find(c => c.id === employee?.client_company_id);

  const existingVar = existingVariables?.[0];
  const hasSubmittedVariables = existingVar?.status === 'submitted';

  // Variables values
  const hoursWorked = existingVar?.hours_worked ?? 151.67;
  const overtimeHours = existingVar?.overtime_hours ?? 0;
  const vacationDays = existingVar?.vacation_days ?? 0;
  const sickDays = existingVar?.sick_days ?? 0;
  const bonuses = existingVar?.bonuses ?? 0;

  // Calculate salary
  const hourlyRate = employee?.hourly_rate ?? 0;
  const baseSalary = hoursWorked * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * 1.25;
  const grossSalary = baseSalary + overtimePay + bonuses;

  // Calculate deductions
  const totalDeductionRate = Object.values(DEDUCTIONS).reduce((sum, rate) => sum + rate, 0);
  const totalDeductions = grossSalary * totalDeductionRate;
  const netSalary = grossSalary - totalDeductions;

  // Employer charges
  const employerCharges = grossSalary * 0.42;

  const selectedMonthLabel = MONTHS.find(m => m.value === month)?.label ?? '';

  const handleValidateAndGenerate = async () => {
    if (!employeeId || !existingVar) return;

    setValidationStep('generating');

    try {
      // Update monthly variables status to validated
      const monthlyVariables = await upsertMonthlyVariables.mutateAsync({
        employee_id: employeeId,
        month: month,
        year: year,
        hours_worked: hoursWorked,
        overtime_hours: overtimeHours,
        vacation_days: vacationDays,
        sick_days: sickDays,
        bonuses: bonuses,
        status: 'validated',
      });

      // Create payslip
      const payslip = await upsertPayslip.mutateAsync({
        employee_id: employeeId,
        monthly_variables_id: monthlyVariables.id,
        month: month,
        year: year,
        gross_salary: Math.round(grossSalary * 100) / 100,
        net_salary: Math.round(netSalary * 100) / 100,
        status: 'generated',
      });

      setGeneratedPayslipId(payslip.id);
      setValidationStep('success');
    } catch (error) {
      console.error('Erreur validation/génération:', error);
      setValidationStep('review');
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

  const isLoading = loadingEmployee || loadingVariables;
  const isPending = upsertPayslip.isPending || upsertMonthlyVariables.isPending;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-500 mt-3">Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (!employee) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top']}>
        <AlertCircle size={48} color="#ef4444" />
        <Text className="text-slate-900 font-semibold mt-3">Employé non trouvé</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-indigo-600 font-medium">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Success Screen
  if (validationStep === 'success') {
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
              Le bulletin de {employee.full_name} pour {selectedMonthLabel} {year} a été créé.
            </Text>
            <View className="flex-row items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg mb-8">
              <Check size={16} color="#059669" />
              <Text className="text-emerald-700 text-sm font-medium">
                Variables validées
              </Text>
            </View>

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
                  Envoyer à {employee.full_name}
                </Text>
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
  if (validationStep === 'generating') {
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
          Validation des variables et création du bulletin pour {employee.full_name}
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
          <Text className="text-lg font-bold text-slate-900">Valider les variables</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 py-6">
            {/* Employee Info Card */}
            <View className="bg-indigo-50 rounded-2xl p-5 mb-6 border border-indigo-200">
              <View className="flex-row items-center gap-4 mb-4">
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="text-white font-bold text-xl">
                    {employee.full_name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-slate-900">{employee.full_name}</Text>
                  <Text className="text-slate-600">{employee.position}</Text>
                </View>
              </View>

              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Building2 size={16} color="#6366f1" />
                  <Text className="text-sm text-slate-600">
                    Employeur: {employerCompany?.name ?? 'N/A'}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Briefcase size={16} color="#6366f1" />
                  <Text className="text-sm text-slate-600">
                    Client: {clientCompany?.name ?? 'N/A'}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Euro size={16} color="#6366f1" />
                  <Text className="text-sm text-slate-600">
                    Taux horaire: {employee.hourly_rate}€/h
                  </Text>
                </View>
              </View>
            </View>

            {/* Period */}
            <View className="bg-slate-50 rounded-xl p-4 mb-6 flex-row items-center justify-between border border-slate-200">
              <View className="flex-row items-center gap-3">
                <Calendar size={20} color="#6366f1" />
                <Text className="font-semibold text-slate-900">{selectedMonthLabel} {year}</Text>
              </View>
              {hasSubmittedVariables && (
                <View className="flex-row items-center gap-1 bg-blue-100 px-2 py-1 rounded-lg">
                  <Clock size={14} color="#2563eb" />
                  <Text className="text-xs font-medium text-blue-700">Soumises par client</Text>
                </View>
              )}
            </View>

            {/* Info Banner */}
            {hasSubmittedVariables && (
              <View className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                <View className="flex-row items-start gap-2">
                  <AlertCircle size={18} color="#3b82f6" />
                  <View className="flex-1">
                    <Text className="font-semibold text-blue-900">Variables transmises par {clientCompany?.name ?? 'le client'}</Text>
                    <Text className="text-sm text-blue-700 mt-1">
                      Vérifiez les informations ci-dessous avant de valider et générer le bulletin de paie.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Variables Summary */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Variables du mois</Text>

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
                    <Calendar size={16} color="#ef4444" />
                    <Text className="text-slate-600">Arrêt maladie</Text>
                  </View>
                  <Text className="font-semibold text-slate-900">{sickDays} jours</Text>
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
                    <Text className="text-slate-600">Total cotisations ({(totalDeductionRate * 100).toFixed(1)}%)</Text>
                    <Text className="font-medium text-red-600">-{totalDeductions.toFixed(2)}€</Text>
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
            onPress={handleValidateAndGenerate}
            disabled={isPending || !hasSubmittedVariables}
            className={`flex-1 flex-row items-center justify-center gap-2 py-4 rounded-xl ${
              hasSubmittedVariables && !isPending ? 'bg-emerald-500 active:bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Check size={20} color="white" />
                <Text className="font-semibold text-white">Valider et générer</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
