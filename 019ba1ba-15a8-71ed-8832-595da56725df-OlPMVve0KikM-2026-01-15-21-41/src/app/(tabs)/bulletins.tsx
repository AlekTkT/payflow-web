import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FileText, Eye, Send, Check, Clock, Filter, Search } from 'lucide-react-native';
import { useUserType } from '@/lib/state/app-store';
import { Badge } from '@/components/payflow/ui';
import { usePayslips, useEmployees } from '@/lib/hooks/usePayflow';

// Helper to format month name
const getMonthName = (month: string, year: number) => {
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};

function BulletinCard({
  id,
  employee,
  month,
  grossSalary,
  netSalary,
  status,
  showEmployee = true,
}: {
  id: string;
  employee?: string;
  month: string;
  grossSalary: number;
  netSalary: number;
  status: string;
  showEmployee?: boolean;
}) {
  const statusConfig = {
    generated: { label: 'Généré', variant: 'neutral' as const, icon: Clock },
    sent: { label: 'Envoyé', variant: 'success' as const, icon: Send },
    viewed: { label: 'Consulté', variant: 'success' as const, icon: Check },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.generated;

  const handleView = () => {
    router.push(`/payslip-viewer?id=${id}`);
  };

  const handleSend = async () => {
    // Navigate to viewer with share action to generate and share PDF
    router.push(`/payslip-viewer?id=${id}&action=share`);
  };

  return (
    <View className="bg-white rounded-xl p-4 border border-slate-100">
      <View className="flex-row items-start gap-3">
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
        >
          <FileText size={24} color="white" />
        </LinearGradient>
        <View className="flex-1">
          <Text className="font-semibold text-slate-900">Bulletin - {month}</Text>
          {showEmployee && employee && (
            <Text className="text-sm text-slate-500">{employee}</Text>
          )}
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-xs text-slate-400">Brut: {grossSalary.toLocaleString()}€</Text>
            <Text className="text-xs text-slate-400">•</Text>
            <Text className="text-xs font-medium text-emerald-600">Net: {netSalary.toLocaleString()}€</Text>
          </View>
        </View>
        <Badge label={config.label} variant={config.variant} />
      </View>
      <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-100">
        <Pressable
          onPress={handleView}
          className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-500 active:bg-indigo-600"
        >
          <Eye size={16} color="white" />
          <Text className="text-sm font-medium text-white">Voir PDF</Text>
        </Pressable>
        <Pressable
          onPress={handleSend}
          className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-500 active:bg-indigo-600"
        >
          <Send size={16} color="white" />
          <Text className="text-sm font-medium text-white">Envoyer</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PrestataireBulletins() {
  const { data: payslips, isLoading } = usePayslips();

  const sentOrViewed = payslips?.filter(p => p.status === 'sent' || p.status === 'viewed') ?? [];
  const generated = payslips?.filter(p => p.status === 'generated') ?? [];

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
            <Text className="text-2xl font-bold text-slate-900">Bulletins de paie</Text>
            <Text className="text-slate-500 mt-0.5">Générez et envoyez les bulletins</Text>
          </View>
          <Pressable
            onPress={() => router.push('/generate-payslip')}
            className="bg-indigo-500 rounded-xl px-4 py-3 flex-row items-center gap-2 active:bg-indigo-600"
          >
            <FileText size={18} color="white" />
            <Text className="text-white font-semibold">Générer</Text>
          </Pressable>
        </View>

        {/* Search and Filter */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white rounded-xl px-4 py-3 flex-row items-center gap-3 border border-slate-200">
            <Search size={20} color="#94a3b8" />
            <Text className="text-slate-400 flex-1">Rechercher un bulletin...</Text>
          </View>
          <Pressable className="bg-white rounded-xl px-4 py-3 border border-slate-200 active:bg-slate-50">
            <Filter size={20} color="#64748b" />
          </Pressable>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100">
            <Text className="text-2xl font-bold text-indigo-600">{payslips?.length ?? 0}</Text>
            <Text className="text-sm text-slate-500">Ce mois</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100">
            <Text className="text-2xl font-bold text-emerald-600">
              {sentOrViewed.length}
            </Text>
            <Text className="text-sm text-slate-500">Envoyés</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100">
            <Text className="text-2xl font-bold text-amber-600">
              {generated.length}
            </Text>
            <Text className="text-sm text-slate-500">À envoyer</Text>
          </View>
        </View>

        {/* Bulletins List */}
        <View className="gap-3">
          {payslips?.map((payslip) => (
            <BulletinCard
              key={payslip.id}
              id={payslip.id}
              employee={payslip.employee?.full_name}
              month={getMonthName(payslip.month, payslip.year)}
              grossSalary={Number(payslip.gross_salary)}
              netSalary={Number(payslip.net_salary)}
              status={payslip.status}
            />
          ))}
        </View>

        {(!payslips || payslips.length === 0) && (
          <View className="bg-white rounded-xl p-8 border border-slate-100 items-center">
            <Text className="text-slate-500">Aucun bulletin trouvé</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function EmployeeBulletins() {
  const { data: payslips, isLoading } = usePayslips();
  const { data: employees } = useEmployees();

  // Filter for Marie Dupont's payslips (demo employee)
  const employee = employees?.find(e => e.full_name === 'Marie Dupont');
  const employeePayslips = payslips?.filter(p => p.employee_id === employee?.id) ?? [];

  // Calculate yearly totals
  const yearlyGross = employeePayslips.reduce((sum, p) => sum + Number(p.gross_salary), 0);
  const yearlyNet = employeePayslips.reduce((sum, p) => sum + Number(p.net_salary), 0);
  const yearlyCharges = yearlyGross - yearlyNet;

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
        <View className="mb-6">
          <Text className="text-2xl font-bold text-slate-900">Mes bulletins</Text>
          <Text className="text-slate-500 mt-0.5">Consultez vos bulletins de paie</Text>
        </View>

        {/* Summary Card */}
        <View className="bg-white rounded-2xl p-5 mb-6 border border-slate-100">
          <Text className="text-sm text-slate-500 mb-1">Cumul net imposable 2024</Text>
          <Text className="text-3xl font-bold text-slate-900">{yearlyNet.toLocaleString()}€</Text>
          <View className="flex-row gap-4 mt-3 pt-3 border-t border-slate-100">
            <View className="flex-1">
              <Text className="text-xs text-slate-400">Brut annuel</Text>
              <Text className="font-semibold text-slate-900">{yearlyGross.toLocaleString()}€</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-400">Charges</Text>
              <Text className="font-semibold text-slate-900">{yearlyCharges.toLocaleString()}€</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-slate-400">Bulletins</Text>
              <Text className="font-semibold text-slate-900">{employeePayslips.length}</Text>
            </View>
          </View>
        </View>

        {/* Bulletins List */}
        <View className="gap-3">
          {employeePayslips.map((payslip) => (
            <BulletinCard
              key={payslip.id}
              id={payslip.id}
              month={getMonthName(payslip.month, payslip.year)}
              grossSalary={Number(payslip.gross_salary)}
              netSalary={Number(payslip.net_salary)}
              status={payslip.status}
              showEmployee={false}
            />
          ))}
        </View>

        {employeePayslips.length === 0 && (
          <View className="bg-white rounded-xl p-8 border border-slate-100 items-center">
            <Text className="text-slate-500">Aucun bulletin trouvé</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function BulletinsScreen() {
  const userType = useUserType();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {userType === 'employe' ? <EmployeeBulletins /> : <PrestataireBulletins />}
    </SafeAreaView>
  );
}
