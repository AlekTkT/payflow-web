import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { X, Check, Clock, Calendar, Euro } from 'lucide-react-native';

interface VariablesForm {
  hoursWorked: string;
  overtimeHours: string;
  vacationDays: string;
  sickDays: string;
  bonuses: string;
}

export default function VariableEntryScreen() {
  const [form, setForm] = useState<VariablesForm>({
    hoursWorked: '151.67',
    overtimeHours: '0',
    vacationDays: '0',
    sickDays: '0',
    bonuses: '0',
  });

  const hourlyRate = 45;
  const baseHours = 151.67;

  const calculateSalary = () => {
    const hours = parseFloat(form.hoursWorked) || 0;
    const overtime = parseFloat(form.overtimeHours) || 0;
    const bonuses = parseFloat(form.bonuses) || 0;

    const baseSalary = hours * hourlyRate;
    const overtimePay = overtime * hourlyRate * 1.25;
    const gross = baseSalary + overtimePay + bonuses;

    return {
      baseSalary: baseSalary.toFixed(2),
      overtimePay: overtimePay.toFixed(2),
      bonuses: bonuses.toFixed(2),
      gross: gross.toFixed(2),
    };
  };

  const salary = calculateSalary();

  const handleSubmit = () => {
    // Here you would call the mutation to save to Supabase
    router.back();
  };

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
            {/* Employee Info */}
            <View className="flex-row items-center gap-4 mb-6">
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text className="text-white font-bold text-xl">MD</Text>
              </LinearGradient>
              <View>
                <Text className="text-lg font-bold text-slate-900">Marie Dupont</Text>
                <Text className="text-slate-500">Développeuse Senior</Text>
                <Text className="text-xs text-slate-400 mt-0.5">Taux: {hourlyRate}€/h</Text>
              </View>
            </View>

            {/* Period */}
            <View className="bg-slate-50 rounded-xl p-4 mb-6 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Calendar size={20} color="#64748b" />
                <Text className="font-medium text-slate-700">Janvier 2025</Text>
              </View>
              <View className="flex-row items-center gap-1 bg-amber-100 px-2 py-1 rounded">
                <Clock size={14} color="#92400e" />
                <Text className="text-xs font-medium text-amber-800">Échéance: 5 janv.</Text>
              </View>
            </View>

            {/* Form Sections */}
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
            className="flex-1 flex-row items-center justify-center gap-2 py-4 rounded-xl bg-indigo-500 active:bg-indigo-600"
          >
            <Check size={20} color="white" />
            <Text className="font-semibold text-white">Valider</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
