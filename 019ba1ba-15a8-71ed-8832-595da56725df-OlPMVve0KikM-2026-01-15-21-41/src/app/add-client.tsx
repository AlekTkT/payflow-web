import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { X, Check, Building2, FileText, Hash, CreditCard, MapPin, Phone, Mail, User } from 'lucide-react-native';
import { useCreateCompany } from '@/lib/hooks/usePayflow';

interface ClientForm {
  name: string;
  legalStatus: string;
  siret: string;
  urssafNumber: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  contactName: string;
}

export default function AddClientScreen() {
  const [form, setForm] = useState<ClientForm>({
    name: '',
    legalStatus: '',
    siret: '',
    urssafNumber: '',
    address: '',
    postalCode: '',
    city: '',
    phone: '',
    email: '',
    contactName: '',
  });

  const createCompany = useCreateCompany();

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      return;
    }

    try {
      await createCompany.mutateAsync({
        name: form.name.trim(),
        type: 'client',
        parent_company_id: '11111111-1111-1111-1111-111111111111',
        siret: form.siret.trim() || undefined,
        urssaf_number: form.urssafNumber.trim() || undefined,
        legal_status: form.legalStatus.trim() || undefined,
        address: form.address.trim() || undefined,
        postal_code: form.postalCode.trim() || undefined,
        city: form.city.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        contact_name: form.contactName.trim() || undefined,
      });
      router.back();
    } catch (error) {
      console.error('Erreur création client:', error);
    }
  };

  const isFormValid = form.name.trim().length > 0;

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
          <Text className="text-lg font-bold text-slate-900">Nouveau client</Text>
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
                <Building2 size={36} color="white" />
              </LinearGradient>
              <Text className="text-lg font-bold text-slate-900 mt-3">Ajouter une société cliente</Text>
              <Text className="text-slate-500 text-sm text-center mt-1">
                Renseignez les informations de la société
              </Text>
            </View>

            {/* Form Sections */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Informations générales</Text>

              <View className="gap-4">
                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Nom de la société *
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <Building2 size={20} color="#94a3b8" />
                    <TextInput
                      value={form.name}
                      onChangeText={(text) => setForm({ ...form, name: text })}
                      className="flex-1 py-3 ml-3 text-base text-slate-900"
                      placeholder="Ex: TechCorp Industries"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Statut juridique
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <FileText size={20} color="#94a3b8" />
                    <TextInput
                      value={form.legalStatus}
                      onChangeText={(text) => setForm({ ...form, legalStatus: text })}
                      className="flex-1 py-3 ml-3 text-base text-slate-900"
                      placeholder="Ex: SAS, SARL, SA..."
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Identifiants légaux</Text>

              <View className="gap-4">
                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Numéro SIRET
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <Hash size={20} color="#94a3b8" />
                    <TextInput
                      value={form.siret}
                      onChangeText={(text) => setForm({ ...form, siret: text })}
                      keyboardType="number-pad"
                      maxLength={14}
                      className="flex-1 py-3 ml-3 text-base text-slate-900"
                      placeholder="14 chiffres"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <Text className="text-xs text-slate-400 mt-1">
                    Identifiant unique de l'établissement
                  </Text>
                </View>

                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Numéro URSSAF
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <CreditCard size={20} color="#94a3b8" />
                    <TextInput
                      value={form.urssafNumber}
                      onChangeText={(text) => setForm({ ...form, urssafNumber: text })}
                      className="flex-1 py-3 ml-3 text-base text-slate-900"
                      placeholder="Numéro d'affiliation URSSAF"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Adresse</Text>

              <View className="gap-4">
                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Adresse
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <MapPin size={20} color="#94a3b8" />
                    <TextInput
                      value={form.address}
                      onChangeText={(text) => setForm({ ...form, address: text })}
                      className="flex-1 py-3 ml-3 text-base text-slate-900"
                      placeholder="Numéro et rue"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-2">
                      Code postal
                    </Text>
                    <TextInput
                      value={form.postalCode}
                      onChangeText={(text) => setForm({ ...form, postalCode: text })}
                      keyboardType="number-pad"
                      maxLength={5}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900"
                      placeholder="75000"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-700 mb-2">
                      Ville
                    </Text>
                    <TextInput
                      value={form.city}
                      onChangeText={(text) => setForm({ ...form, city: text })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900"
                      placeholder="Paris"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-slate-900 mb-4">Contact</Text>

              <View className="gap-4">
                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Nom du contact
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <User size={20} color="#94a3b8" />
                    <TextInput
                      value={form.contactName}
                      onChangeText={(text) => setForm({ ...form, contactName: text })}
                      className="flex-1 py-3 ml-3 text-base text-slate-900"
                      placeholder="Responsable RH"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Téléphone
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <Phone size={20} color="#94a3b8" />
                    <TextInput
                      value={form.phone}
                      onChangeText={(text) => setForm({ ...form, phone: text })}
                      keyboardType="phone-pad"
                      className="flex-1 py-3 ml-3 text-base text-slate-900"
                      placeholder="01 23 45 67 89"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Email
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                    <Mail size={20} color="#94a3b8" />
                    <TextInput
                      value={form.email}
                      onChangeText={(text) => setForm({ ...form, email: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="flex-1 py-3 ml-3 text-base text-slate-900"
                      placeholder="contact@entreprise.com"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
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
            disabled={!isFormValid || createCompany.isPending}
            className={`flex-1 flex-row items-center justify-center gap-2 py-4 rounded-xl ${
              isFormValid && !createCompany.isPending ? 'bg-indigo-500 active:bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            {createCompany.isPending ? (
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
