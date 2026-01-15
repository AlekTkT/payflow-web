import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Switch, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import {
  X,
  User,
  Building2,
  Bell,
  Lock,
  Moon,
  Globe,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Save,
  Eye,
  EyeOff,
  ChevronRight,
  Shield,
  Smartphone,
  MessageSquare,
  FileText,
  ExternalLink,
  Check,
  Sun,
  Upload,
  Camera,
  Image as ImageIcon,
  CreditCard,
  Trash2,
  BellRing,
  BookOpen,
  MessageCircleQuestion,
} from 'lucide-react-native';
import { useUserType, useAppStore, useAppMode } from '@/lib/state/app-store';
import { useCompanies, useEmployees } from '@/lib/hooks/usePayflow';
import { useRealEmployees, useSocietesB } from '@/lib/state/data-store';
import { useTheme, useSetTheme, useLanguage, useSetLanguage, useActualTheme, useTranslation, type Theme, type Language } from '@/lib/state/theme-store';
import {
  useEmailNotifications,
  usePushNotifications,
  useSmsNotifications,
  useBulletinNotifications,
  useInvoiceNotifications,
  usePaymentNotifications,
  useReminderNotifications,
  useSetEmailNotifications,
  useSetPushNotifications,
  useSetSmsNotifications,
  useSetBulletinNotifications,
  useSetInvoiceNotifications,
  useSetPaymentNotifications,
  useSetReminderNotifications,
} from '@/lib/state/notification-store';

type SettingsSection = 'profile' | 'company' | 'notifications' | 'security' | 'appearance' | 'language' | 'help' | 'employees' | 'templates' | 'billing' | 'team' | 'contracts' | 'documents' | 'bank' | 'mycontract' | 'company-documents' | 'employee-documents';

// Document upload component
interface DocumentUploadItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  uploaded?: boolean;
  fileName?: string;
  uploadDate?: string;
}

function DocumentUploadCard({
  item,
  onUpload,
  onDelete,
}: {
  item: DocumentUploadItem;
  onUpload: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-100">
      <View className="flex-row items-start gap-3">
        <View className={`w-12 h-12 rounded-xl items-center justify-center ${item.uploaded ? 'bg-emerald-100' : 'bg-slate-100'}`}>
          {item.uploaded ? <Check size={24} color="#10b981" /> : item.icon}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-semibold text-slate-900">{item.name}</Text>
            {item.required && (
              <View className="bg-red-100 px-2 py-0.5 rounded">
                <Text className="text-xs text-red-600 font-medium">Requis</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-slate-500 mt-1">{item.description}</Text>

          {item.uploaded && item.fileName && (
            <View className="mt-2 bg-slate-50 rounded-lg p-2">
              <Text className="text-xs text-slate-600" numberOfLines={1}>{item.fileName}</Text>
              <Text className="text-xs text-slate-400 mt-0.5">Ajouté le {item.uploadDate}</Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row gap-2 mt-3">
        {item.uploaded ? (
          <>
            <Pressable
              onPress={() => onUpload(item.id)}
              className="flex-1 flex-row items-center justify-center gap-2 bg-slate-100 rounded-xl py-3 active:bg-slate-200"
            >
              <Upload size={16} color="#64748b" />
              <Text className="text-slate-700 font-medium">Remplacer</Text>
            </Pressable>
            <Pressable
              onPress={() => onDelete(item.id)}
              className="flex-row items-center justify-center gap-2 bg-red-50 rounded-xl px-4 py-3 active:bg-red-100"
            >
              <Trash2 size={16} color="#ef4444" />
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => onUpload(item.id)}
            className="flex-1 flex-row items-center justify-center gap-2 bg-indigo-500 rounded-xl py-3 active:bg-indigo-600"
          >
            <Upload size={16} color="white" />
            <Text className="text-white font-medium">Ajouter le document</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function ProfileSettings() {
  const userType = useUserType();
  const { data: employees } = useEmployees();

  const employee = employees?.find(e => e.full_name === 'Marie Dupont');

  // Profile data
  const fullName = userType === 'societe_a' ? 'Admin TalentFlow' :
    userType === 'societe_b' ? 'Jean Martin' :
    employee?.full_name ?? 'Marie Dupont';

  const initialEmail = userType === 'societe_a' ? 'admin@talentflow.fr' :
    userType === 'societe_b' ? 'rh@techcorp.fr' :
    'marie.dupont@email.com';

  const initialPhone = '+33 6 12 34 56 78';
  const initialAddress = '15 Rue de la Paix';
  const initialPostalCode = '75002';
  const initialCity = 'Paris';

  const position = userType === 'societe_a' ? 'Administrateur' :
    userType === 'societe_b' ? 'Responsable RH' :
    employee?.position ?? 'Développeuse Senior';

  // Editable state for employee
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [postalCode, setPostalCode] = useState(initialPostalCode);
  const [city, setCity] = useState(initialCity);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Modifications enregistrées',
      'Vos informations ont été mises à jour avec succès.',
      [{ text: 'OK', onPress: () => setIsEditing(false) }]
    );
    setHasChanges(false);
  };

  const handleCancel = () => {
    setEmail(initialEmail);
    setPhone(initialPhone);
    setAddress(initialAddress);
    setPostalCode(initialPostalCode);
    setCity(initialCity);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleFieldChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setHasChanges(true);
  };

  // For employee, show editable profile
  if (userType === 'employe') {
    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          {/* Avatar */}
          <View className="items-center mb-6">
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={{ width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text className="text-white font-bold text-3xl">
                {fullName.split(' ').map(n => n[0]).join('')}
              </Text>
            </LinearGradient>
            <Text className="text-lg font-bold text-slate-900 mt-3">{fullName}</Text>
            <Text className="text-slate-500">{position}</Text>
          </View>

          {/* Edit Toggle */}
          {!isEditing ? (
            <Pressable
              onPress={() => setIsEditing(true)}
              className="bg-indigo-500 rounded-xl py-3 mb-4 flex-row items-center justify-center gap-2 active:bg-indigo-600"
            >
              <User size={18} color="white" />
              <Text className="text-white font-semibold">Modifier mes informations</Text>
            </Pressable>
          ) : (
            <View className="bg-indigo-50 rounded-2xl p-4 mb-4 border border-indigo-100 flex-row items-start gap-3">
              <User size={20} color="#6366f1" />
              <View className="flex-1">
                <Text className="text-sm text-indigo-800 font-medium">Mode édition activé</Text>
                <Text className="text-xs text-indigo-600 mt-1">
                  Modifiez vos informations puis enregistrez les changements.
                </Text>
              </View>
            </View>
          )}

          {/* Identité - Non modifiable */}
          <View className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="font-semibold text-slate-900">Identité</Text>
              <View className="flex-row items-center gap-1">
                <Lock size={14} color="#94a3b8" />
                <Text className="text-xs text-slate-400">Non modifiable</Text>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-slate-500 mb-2">Nom complet</Text>
              <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
                <User size={20} color="#94a3b8" />
                <Text className="flex-1 ml-3 text-slate-700">{fullName}</Text>
                <Lock size={16} color="#94a3b8" />
              </View>
            </View>

            <View>
              <Text className="text-sm text-slate-500 mb-2">Poste</Text>
              <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
                <Building2 size={20} color="#94a3b8" />
                <Text className="flex-1 ml-3 text-slate-700">{position}</Text>
                <Lock size={16} color="#94a3b8" />
              </View>
            </View>
          </View>

          {/* Contact - Modifiable */}
          <View className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
            <Text className="font-semibold text-slate-900 mb-4">Coordonnées</Text>

            <View className="mb-4">
              <Text className="text-sm text-slate-500 mb-2">Email</Text>
              <View className="flex-row items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <Mail size={20} color={isEditing ? '#6366f1' : '#64748b'} />
                <TextInput
                  value={email}
                  onChangeText={(v) => handleFieldChange(setEmail, v)}
                  className="flex-1 ml-3 text-slate-900"
                  editable={isEditing}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="votre@email.com"
                />
              </View>
            </View>

            <View>
              <Text className="text-sm text-slate-500 mb-2">Téléphone</Text>
              <View className="flex-row items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <Phone size={20} color={isEditing ? '#6366f1' : '#64748b'} />
                <TextInput
                  value={phone}
                  onChangeText={(v) => handleFieldChange(setPhone, v)}
                  className="flex-1 ml-3 text-slate-900"
                  editable={isEditing}
                  keyboardType="phone-pad"
                  placeholder="+33 6 XX XX XX XX"
                />
              </View>
            </View>
          </View>

          {/* Adresse - Modifiable */}
          <View className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
            <Text className="font-semibold text-slate-900 mb-4">Adresse</Text>

            <View className="mb-4">
              <Text className="text-sm text-slate-500 mb-2">Rue</Text>
              <View className="flex-row items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <MapPin size={20} color={isEditing ? '#6366f1' : '#64748b'} />
                <TextInput
                  value={address}
                  onChangeText={(v) => handleFieldChange(setAddress, v)}
                  className="flex-1 ml-3 text-slate-900"
                  editable={isEditing}
                  placeholder="Numéro et nom de rue"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm text-slate-500 mb-2">Code postal</Text>
                <View className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                  <TextInput
                    value={postalCode}
                    onChangeText={(v) => handleFieldChange(setPostalCode, v)}
                    className="text-slate-900"
                    editable={isEditing}
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholder="75000"
                  />
                </View>
              </View>
              <View className="flex-[2]">
                <Text className="text-sm text-slate-500 mb-2">Ville</Text>
                <View className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                  <TextInput
                    value={city}
                    onChangeText={(v) => handleFieldChange(setCity, v)}
                    className="text-slate-900"
                    editable={isEditing}
                    placeholder="Ville"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {isEditing && (
            <View className="gap-3">
              <Pressable
                onPress={handleSave}
                disabled={!hasChanges}
                className={`rounded-xl py-4 flex-row items-center justify-center gap-2 ${
                  hasChanges ? 'bg-indigo-500 active:bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <Save size={20} color="white" />
                <Text className="text-white font-semibold">Enregistrer les modifications</Text>
              </Pressable>
              <Pressable
                onPress={handleCancel}
                className="rounded-xl py-4 flex-row items-center justify-center gap-2 border border-slate-200 active:bg-slate-50"
              >
                <X size={20} color="#64748b" />
                <Text className="text-slate-600 font-semibold">Annuler</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // For Société A, Société B, and Admin App - editable profile
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        {/* Avatar */}
        <View className="items-center mb-6">
          <LinearGradient
            colors={userType === 'admin_app' ? ['#8b5cf6', '#a855f7'] : ['#6366f1', '#8b5cf6']}
            style={{ width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text className="text-white font-bold text-3xl">
              {fullName.split(' ').map(n => n[0]).join('')}
            </Text>
          </LinearGradient>
          <Text className="text-lg font-bold text-slate-900 mt-3">{fullName}</Text>
          <Text className="text-slate-500">{position}</Text>
        </View>

        {/* Edit Toggle */}
        {!isEditing ? (
          <Pressable
            onPress={() => setIsEditing(true)}
            className="bg-indigo-500 rounded-xl py-3 mb-4 flex-row items-center justify-center gap-2 active:bg-indigo-600"
          >
            <User size={18} color="white" />
            <Text className="text-white font-semibold">Modifier mes informations</Text>
          </Pressable>
        ) : (
          <View className="bg-indigo-50 rounded-2xl p-4 mb-4 border border-indigo-100 flex-row items-start gap-3">
            <User size={20} color="#6366f1" />
            <View className="flex-1">
              <Text className="text-sm text-indigo-800 font-medium">Mode édition activé</Text>
              <Text className="text-xs text-indigo-600 mt-1">
                Modifiez vos informations puis enregistrez les changements.
              </Text>
            </View>
          </View>
        )}

        {/* Identité - Non modifiable */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-semibold text-slate-900">Identité</Text>
            <View className="flex-row items-center gap-1">
              <Lock size={14} color="#94a3b8" />
              <Text className="text-xs text-slate-400">Non modifiable</Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">Nom complet</Text>
            <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
              <User size={20} color="#94a3b8" />
              <Text className="flex-1 ml-3 text-slate-700">{fullName}</Text>
              <Lock size={16} color="#94a3b8" />
            </View>
          </View>

          <View>
            <Text className="text-sm text-slate-500 mb-2">Rôle</Text>
            <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
              <Building2 size={20} color="#94a3b8" />
              <Text className="flex-1 ml-3 text-slate-700">{position}</Text>
              <Lock size={16} color="#94a3b8" />
            </View>
          </View>
        </View>

        {/* Contact - Modifiable */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
          <Text className="font-semibold text-slate-900 mb-4">Coordonnées</Text>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">Email</Text>
            <View className="flex-row items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
              <Mail size={20} color={isEditing ? '#6366f1' : '#64748b'} />
              <TextInput
                value={email}
                onChangeText={(v) => handleFieldChange(setEmail, v)}
                className="flex-1 ml-3 text-slate-900"
                editable={isEditing}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="votre@email.com"
              />
            </View>
          </View>

          <View>
            <Text className="text-sm text-slate-500 mb-2">Téléphone</Text>
            <View className="flex-row items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
              <Phone size={20} color={isEditing ? '#6366f1' : '#64748b'} />
              <TextInput
                value={phone}
                onChangeText={(v) => handleFieldChange(setPhone, v)}
                className="flex-1 ml-3 text-slate-900"
                editable={isEditing}
                keyboardType="phone-pad"
                placeholder="+33 6 XX XX XX XX"
              />
            </View>
          </View>
        </View>

        {/* Adresse - Modifiable */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
          <Text className="font-semibold text-slate-900 mb-4">Adresse</Text>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">Rue</Text>
            <View className="flex-row items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
              <MapPin size={20} color={isEditing ? '#6366f1' : '#64748b'} />
              <TextInput
                value={address}
                onChangeText={(v) => handleFieldChange(setAddress, v)}
                className="flex-1 ml-3 text-slate-900"
                editable={isEditing}
                placeholder="Numéro et nom de rue"
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm text-slate-500 mb-2">Code postal</Text>
              <View className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <TextInput
                  value={postalCode}
                  onChangeText={(v) => handleFieldChange(setPostalCode, v)}
                  className="text-slate-900"
                  editable={isEditing}
                  keyboardType="number-pad"
                  maxLength={5}
                  placeholder="75000"
                />
              </View>
            </View>
            <View className="flex-[2]">
              <Text className="text-sm text-slate-500 mb-2">Ville</Text>
              <View className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <TextInput
                  value={city}
                  onChangeText={(v) => handleFieldChange(setCity, v)}
                  className="text-slate-900"
                  editable={isEditing}
                  placeholder="Ville"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {isEditing && (
          <View className="gap-3">
            <Pressable
              onPress={handleSave}
              disabled={!hasChanges}
              className={`rounded-xl py-4 flex-row items-center justify-center gap-2 ${
                hasChanges ? 'bg-indigo-500 active:bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <Save size={20} color="white" />
              <Text className="text-white font-semibold">Enregistrer les modifications</Text>
            </Pressable>
            <Pressable
              onPress={handleCancel}
              className="rounded-xl py-4 flex-row items-center justify-center gap-2 border border-slate-200 active:bg-slate-50"
            >
              <X size={20} color="#64748b" />
              <Text className="text-slate-600 font-semibold">Annuler</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function CompanySettings() {
  const userType = useUserType();
  const { data: companies } = useCompanies();
  const companiesList = Array.isArray(companies) ? companies : [];

  const company = userType === 'societe_a'
    ? companiesList.find((c: { type: string }) => c.type === 'prestataire')
    : companiesList.find((c: { name: string }) => c.name === 'TechCorp Industries');

  // Company data is provided during invitation and is read-only
  const companyName = company?.name ?? '';
  const siret = company?.siret ?? '';
  const address = company?.address ?? '';
  const postalCode = company?.postal_code ?? '';
  const city = company?.city ?? '';
  const companyPhone = company?.phone ?? '';
  const companyEmail = company?.email ?? '';

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        {/* Company Header */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-slate-100">
          <View className="flex-row items-center gap-4">
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={{ width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
            >
              <Building2 size={32} color="white" />
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-lg font-bold text-slate-900">{company?.name ?? 'Entreprise'}</Text>
              <Text className="text-slate-500">{company?.legal_status ?? 'SAS'}</Text>
            </View>
          </View>
        </View>

        {/* Info Banner - Read Only */}
        <View className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100 flex-row items-start gap-3">
          <Lock size={20} color="#3b82f6" />
          <View className="flex-1">
            <Text className="text-sm text-blue-800 font-medium">Informations légales enregistrées</Text>
            <Text className="text-xs text-blue-600 mt-1">
              Ces informations ont été fournies lors de votre inscription. Contactez votre prestataire de paie pour toute modification.
            </Text>
          </View>
        </View>

        {/* Company Info - Read Only */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-semibold text-slate-900">Informations légales</Text>
            <Lock size={16} color="#94a3b8" />
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">Raison sociale</Text>
            <View className="bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
              <Text className="text-slate-700">{companyName || '—'}</Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">SIRET</Text>
            <View className="bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
              <Text className="text-slate-700">{siret || '—'}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4 mt-6">
            <Text className="font-semibold text-slate-900">Adresse</Text>
            <Lock size={16} color="#94a3b8" />
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">Adresse</Text>
            <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
              <MapPin size={20} color="#94a3b8" />
              <Text className="flex-1 ml-3 text-slate-700">{address || '—'}</Text>
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm text-slate-500 mb-2">Code postal</Text>
              <View className="bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
                <Text className="text-slate-700">{postalCode || '—'}</Text>
              </View>
            </View>
            <View className="flex-[2]">
              <Text className="text-sm text-slate-500 mb-2">Ville</Text>
              <View className="bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
                <Text className="text-slate-700">{city || '—'}</Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-4 mt-6">
            <Text className="font-semibold text-slate-900">Contact</Text>
            <Lock size={16} color="#94a3b8" />
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">Téléphone</Text>
            <View className="bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
              <Text className="text-slate-700">{companyPhone || '—'}</Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">Email</Text>
            <View className="bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
              <Text className="text-slate-700">{companyEmail || '—'}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function NotificationsSettings() {
  // Get preferences from store
  const emailNotifs = useEmailNotifications();
  const pushNotifs = usePushNotifications();
  const smsNotifs = useSmsNotifications();
  const bulletinNotif = useBulletinNotifications();
  const invoiceNotif = useInvoiceNotifications();
  const paymentNotif = usePaymentNotifications();
  const reminderNotif = useReminderNotifications();

  // Get setters from store
  const setEmailNotifs = useSetEmailNotifications();
  const setPushNotifs = useSetPushNotifications();
  const setSmsNotifs = useSetSmsNotifications();
  const setBulletinNotif = useSetBulletinNotifications();
  const setInvoiceNotif = useSetInvoiceNotifications();
  const setPaymentNotif = useSetPaymentNotifications();
  const setReminderNotif = useSetReminderNotifications();

  const handleToggle = (setter: (v: boolean) => void, newValue: boolean, title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(newValue);

    // Show feedback toast
    if (newValue) {
      Alert.alert(
        'Notifications activées',
        `Vous recevrez désormais les notifications pour "${title}".`,
        [{ text: 'OK' }]
      );
    }
  };

  const NotificationToggle = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
    showStatus = false
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
    showStatus?: boolean;
  }) => (
    <View className="flex-row items-center justify-between py-4 border-b border-slate-100">
      <View className="flex-row items-center gap-3 flex-1">
        <View className={`w-10 h-10 rounded-xl items-center justify-center ${value ? 'bg-indigo-100' : 'bg-slate-100'}`}>
          {icon}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-medium text-slate-900">{title}</Text>
            {showStatus && value && (
              <View className="bg-emerald-100 px-2 py-0.5 rounded">
                <Text className="text-xs text-emerald-700 font-medium">Actif</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-slate-500">{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
        thumbColor={value ? '#6366f1' : '#94a3b8'}
      />
    </View>
  );

  const allNotificationsEnabled = emailNotifs || pushNotifs || smsNotifs;
  const enabledTypesCount = [bulletinNotif, invoiceNotif, paymentNotif, reminderNotif].filter(Boolean).length;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        {/* Status Banner */}
        <View className={`rounded-2xl p-4 mb-4 border flex-row items-center gap-3 ${
          allNotificationsEnabled
            ? 'bg-emerald-50 border-emerald-100'
            : 'bg-amber-50 border-amber-100'
        }`}>
          <View className={`w-10 h-10 rounded-full items-center justify-center ${
            allNotificationsEnabled ? 'bg-emerald-500' : 'bg-amber-500'
          }`}>
            {allNotificationsEnabled
              ? <BellRing size={20} color="white" />
              : <Bell size={20} color="white" />
            }
          </View>
          <View className="flex-1">
            <Text className={`font-semibold ${allNotificationsEnabled ? 'text-emerald-900' : 'text-amber-900'}`}>
              {allNotificationsEnabled ? 'Notifications actives' : 'Notifications désactivées'}
            </Text>
            <Text className={`text-sm ${allNotificationsEnabled ? 'text-emerald-700' : 'text-amber-700'}`}>
              {allNotificationsEnabled
                ? `${enabledTypesCount} type(s) de notification activé(s)`
                : 'Activez au moins un canal pour recevoir des alertes'
              }
            </Text>
          </View>
        </View>

        {/* Channels */}
        <View className="bg-white rounded-2xl px-4 mb-4 border border-slate-100">
          <Text className="text-sm font-medium text-slate-500 pt-4 pb-2">Canaux de notification</Text>
          <NotificationToggle
            icon={<Mail size={20} color={emailNotifs ? '#6366f1' : '#64748b'} />}
            title="Email"
            subtitle="Recevoir par email"
            value={emailNotifs}
            onValueChange={(v) => handleToggle(setEmailNotifs, v, 'Email')}
            showStatus
          />
          <NotificationToggle
            icon={<Smartphone size={20} color={pushNotifs ? '#6366f1' : '#64748b'} />}
            title="Notifications push"
            subtitle="Alertes sur l'appareil"
            value={pushNotifs}
            onValueChange={(v) => handleToggle(setPushNotifs, v, 'Notifications push')}
            showStatus
          />
          <NotificationToggle
            icon={<MessageSquare size={20} color={smsNotifs ? '#6366f1' : '#64748b'} />}
            title="SMS"
            subtitle="Messages importants"
            value={smsNotifs}
            onValueChange={(v) => handleToggle(setSmsNotifs, v, 'SMS')}
            showStatus
          />
        </View>

        {/* Notification Types */}
        <View className="bg-white rounded-2xl px-4 border border-slate-100">
          <Text className="text-sm font-medium text-slate-500 pt-4 pb-2">Types de notifications</Text>
          <NotificationToggle
            icon={<FileText size={20} color={bulletinNotif ? '#6366f1' : '#64748b'} />}
            title="Bulletins de paie"
            subtitle="Nouveau bulletin disponible"
            value={bulletinNotif}
            onValueChange={(v) => handleToggle(setBulletinNotif, v, 'Bulletins de paie')}
          />
          <NotificationToggle
            icon={<FileText size={20} color={invoiceNotif ? '#6366f1' : '#64748b'} />}
            title="Factures"
            subtitle="Nouvelle facture reçue"
            value={invoiceNotif}
            onValueChange={(v) => handleToggle(setInvoiceNotif, v, 'Factures')}
          />
          <NotificationToggle
            icon={<Check size={20} color={paymentNotif ? '#6366f1' : '#64748b'} />}
            title="Paiements"
            subtitle="Confirmation de paiement"
            value={paymentNotif}
            onValueChange={(v) => handleToggle(setPaymentNotif, v, 'Paiements')}
          />
          <NotificationToggle
            icon={<Bell size={20} color={reminderNotif ? '#6366f1' : '#64748b'} />}
            title="Rappels"
            subtitle="Échéances et deadlines"
            value={reminderNotif}
            onValueChange={(v) => handleToggle(setReminderNotif, v, 'Rappels')}
          />
        </View>

        {/* Info */}
        <View className="bg-blue-50 rounded-2xl p-4 mt-4 border border-blue-100 flex-row items-start gap-3">
          <Shield size={20} color="#3b82f6" />
          <View className="flex-1">
            <Text className="text-sm text-blue-800">
              Vos préférences sont sauvegardées automatiquement et synchronisées sur tous vos appareils.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    Alert.alert('Succès', 'Mot de passe modifié avec succès');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        {/* Password Change */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-slate-100">
          <Text className="font-semibold text-slate-900 mb-4">Changer le mot de passe</Text>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">Mot de passe actuel</Text>
            <View className="flex-row items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
              <Lock size={20} color="#64748b" />
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                className="flex-1 ml-3 text-slate-900"
                placeholder="••••••••"
                secureTextEntry={!showCurrentPassword}
              />
              <Pressable onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                {showCurrentPassword ? <EyeOff size={20} color="#64748b" /> : <Eye size={20} color="#64748b" />}
              </Pressable>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">Nouveau mot de passe</Text>
            <View className="flex-row items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
              <Lock size={20} color="#64748b" />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                className="flex-1 ml-3 text-slate-900"
                placeholder="••••••••"
                secureTextEntry={!showNewPassword}
              />
              <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
                {showNewPassword ? <EyeOff size={20} color="#64748b" /> : <Eye size={20} color="#64748b" />}
              </Pressable>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">Confirmer le mot de passe</Text>
            <View className="flex-row items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
              <Lock size={20} color="#64748b" />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                className="flex-1 ml-3 text-slate-900"
                placeholder="••••••••"
                secureTextEntry
              />
            </View>
          </View>

          <Pressable
            onPress={handleChangePassword}
            className="bg-indigo-500 rounded-xl py-3 flex-row items-center justify-center gap-2 active:bg-indigo-600"
          >
            <Text className="text-white font-semibold">Modifier le mot de passe</Text>
          </Pressable>
        </View>

        {/* Security Options */}
        <View className="bg-white rounded-2xl px-4 border border-slate-100">
          <Text className="text-sm font-medium text-slate-500 pt-4 pb-2">Options de sécurité</Text>

          <View className="flex-row items-center justify-between py-4 border-b border-slate-100">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
                <Shield size={20} color="#64748b" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-slate-900">Authentification 2FA</Text>
                <Text className="text-sm text-slate-500">Double authentification</Text>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={setTwoFactorEnabled}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={twoFactorEnabled ? '#6366f1' : '#94a3b8'}
            />
          </View>

          <View className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
                <Smartphone size={20} color="#64748b" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-slate-900">Biométrie</Text>
                <Text className="text-sm text-slate-500">Face ID / Touch ID</Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
              thumbColor={biometricEnabled ? '#6366f1' : '#94a3b8'}
            />
          </View>
        </View>

        {/* Sessions */}
        <View className="bg-white rounded-2xl p-5 mt-4 border border-slate-100">
          <Text className="font-semibold text-slate-900 mb-4">Sessions actives</Text>
          <View className="flex-row items-center justify-between py-3 border-b border-slate-100">
            <View className="flex-row items-center gap-3">
              <Smartphone size={20} color="#64748b" />
              <View>
                <Text className="font-medium text-slate-900">iPhone 15 Pro</Text>
                <Text className="text-xs text-slate-500">Paris, France • Maintenant</Text>
              </View>
            </View>
            <View className="bg-emerald-100 px-2 py-1 rounded">
              <Text className="text-xs font-medium text-emerald-700">Actif</Text>
            </View>
          </View>
          <Pressable className="mt-4">
            <Text className="text-red-500 font-medium text-center">Déconnecter toutes les sessions</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function AppearanceSettings() {
  const theme = useTheme();
  const setTheme = useSetTheme();
  const actualTheme = useActualTheme();
  const { t } = useTranslation();

  const ThemeOption = ({ value, label, icon }: { value: Theme; label: string; icon: React.ReactNode }) => (
    <Pressable
      onPress={() => setTheme(value)}
      className={`flex-1 items-center p-4 rounded-xl border ${
        theme === value ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-transparent'
      }`}
    >
      <View className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
        theme === value ? 'bg-indigo-500' : 'bg-slate-200'
      }`}>
        {icon}
      </View>
      <Text className={`font-medium ${theme === value ? 'text-indigo-700' : 'text-slate-600'}`}>{label}</Text>
      {theme === value && (
        <View className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 items-center justify-center">
          <Check size={12} color="white" />
        </View>
      )}
    </Pressable>
  );

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="font-semibold text-slate-900 mb-4">{t('theme.title')}</Text>

          <View className="flex-row gap-3">
            <ThemeOption
              value="light"
              label={t('theme.light')}
              icon={<Sun size={24} color={theme === 'light' ? 'white' : '#64748b'} />}
            />
            <ThemeOption
              value="dark"
              label={t('theme.dark')}
              icon={<Moon size={24} color={theme === 'dark' ? 'white' : '#64748b'} />}
            />
            <ThemeOption
              value="system"
              label={t('theme.system')}
              icon={<Smartphone size={24} color={theme === 'system' ? 'white' : '#64748b'} />}
            />
          </View>

          <Text className="text-sm text-slate-500 mt-4 text-center">
            {t('theme.auto_description')}
          </Text>

          {/* Current Theme Preview */}
          <View className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <Text className="text-sm text-slate-500 mb-2">Aperçu du thème actuel</Text>
            <View className="flex-row items-center gap-2">
              <View className={`w-4 h-4 rounded-full ${actualTheme === 'dark' ? 'bg-slate-800' : 'bg-white border border-slate-300'}`} />
              <Text className="text-slate-700 font-medium">
                {actualTheme === 'dark' ? 'Mode sombre activé' : 'Mode clair activé'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function LanguageSettings() {
  const language = useLanguage();
  const setLanguage = useSetLanguage();

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  ];

  const handleLanguageChange = (code: Language) => {
    setLanguage(code);
    Alert.alert(
      code === 'fr' ? 'Langue modifiée' :
      code === 'en' ? 'Language changed' :
      code === 'es' ? 'Idioma cambiado' :
      code === 'de' ? 'Sprache geändert' :
      'Lingua cambiata',
      code === 'fr' ? 'La langue a été changée en Français.' :
      code === 'en' ? 'Language has been changed to English.' :
      code === 'es' ? 'El idioma ha sido cambiado a Español.' :
      code === 'de' ? 'Die Sprache wurde auf Deutsch geändert.' :
      'La lingua è stata cambiata in Italiano.'
    );
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {languages.map((lang, index) => (
            <Pressable
              key={lang.code}
              onPress={() => handleLanguageChange(lang.code)}
              className={`flex-row items-center justify-between p-4 ${
                index < languages.length - 1 ? 'border-b border-slate-100' : ''
              } ${language === lang.code ? 'bg-indigo-50' : ''}`}
            >
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">{lang.flag}</Text>
                <Text className={`font-medium ${language === lang.code ? 'text-indigo-700' : 'text-slate-900'}`}>
                  {lang.name}
                </Text>
              </View>
              {language === lang.code && (
                <View className="w-6 h-6 rounded-full bg-indigo-500 items-center justify-center">
                  <Check size={14} color="white" />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Info */}
        <View className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <Text className="text-sm text-slate-500 text-center">
            {language === 'fr' ? 'La langue de l\'application sera modifiée immédiatement.' :
             language === 'en' ? 'The app language will be changed immediately.' :
             language === 'es' ? 'El idioma de la aplicación se cambiará inmediatamente.' :
             language === 'de' ? 'Die App-Sprache wird sofort geändert.' :
             'La lingua dell\'app verrà cambiata immediatamente.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function HelpSettings() {
  const HelpItem = ({ icon, title, subtitle, onPress }: { icon: React.ReactNode; title: string; subtitle: string; onPress?: () => void }) => (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 py-4 border-b border-slate-100 active:opacity-70"
    >
      <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-medium text-slate-900">{title}</Text>
        <Text className="text-sm text-slate-500">{subtitle}</Text>
      </View>
      <ChevronRight size={20} color="#94a3b8" />
    </Pressable>
  );

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        {/* Guide et FAQ */}
        <View className="bg-white rounded-2xl px-4 mb-4 border border-slate-100">
          <HelpItem
            icon={<BookOpen size={20} color="#6366f1" />}
            title="Guide d'utilisation"
            subtitle="Apprenez à utiliser PayFlow"
            onPress={() => router.push('/user-guide')}
          />
          <HelpItem
            icon={<MessageCircleQuestion size={20} color="#6366f1" />}
            title="FAQ"
            subtitle="Questions fréquentes"
            onPress={() => router.push('/faq')}
          />
        </View>

        {/* Support */}
        <View className="bg-white rounded-2xl px-4 mb-4 border border-slate-100">
          <Text className="text-sm font-medium text-slate-500 pt-4 pb-2">Support</Text>
          <HelpItem
            icon={<MessageSquare size={20} color="#64748b" />}
            title="Contacter le support"
            subtitle="Assistance personnalisée"
            onPress={() => Alert.alert('Support', 'Email: support@payflow.fr\nTél: 01 23 45 67 89')}
          />
          <HelpItem
            icon={<ExternalLink size={20} color="#64748b" />}
            title="Site web"
            subtitle="www.payflow.fr"
            onPress={() => Alert.alert('Site web', 'Ouverture du site web...')}
          />
        </View>

        {/* Legal */}
        <View className="bg-white rounded-2xl px-4 border border-slate-100">
          <Text className="text-sm font-medium text-slate-500 pt-4 pb-2">Légal</Text>
          <HelpItem
            icon={<FileText size={20} color="#64748b" />}
            title="Conditions d'utilisation"
            subtitle="CGU et CGV"
            onPress={() => router.push('/legal')}
          />
          <HelpItem
            icon={<Shield size={20} color="#64748b" />}
            title="Politique de confidentialité"
            subtitle="Protection des données"
            onPress={() => router.push('/legal')}
          />
        </View>

        {/* App Info */}
        <View className="mt-6 items-center">
          <Text className="text-slate-400 text-sm">PayFlow v1.0.0</Text>
          <Text className="text-slate-300 text-xs mt-1">© 2024 PayFlow. Tous droits réservés.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// === SOCIÉTÉ A SETTINGS ===

function EmployeesSettings() {
  const { data: employees } = useEmployees();
  const employeesList = Array.isArray(employees) ? employees : [];

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <View className="p-4 border-b border-slate-100">
            <Text className="font-semibold text-slate-900">Salariés portés ({employeesList.length})</Text>
          </View>
          {employeesList.map((employee: { id: string; full_name: string; position: string }, index: number) => (
            <View
              key={employee.id}
              className={`flex-row items-center gap-4 p-4 ${index < employeesList.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                <Text className="text-indigo-600 font-medium">
                  {employee.full_name?.split(' ').map((n: string) => n[0]).join('') ?? '?'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium text-slate-900">{employee.full_name}</Text>
                <Text className="text-sm text-slate-500">{employee.position}</Text>
              </View>
              <View className="px-2 py-1 rounded bg-emerald-100">
                <Text className="text-xs font-medium text-emerald-700">Actif</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function TemplatesSettings() {
  const templates = [
    { id: 1, name: 'Bulletin de paie standard', type: 'bulletin', lastModified: '15/01/2024' },
    { id: 2, name: 'Facture prestation', type: 'invoice', lastModified: '10/01/2024' },
    { id: 3, name: 'Contrat CDI', type: 'contract', lastModified: '05/01/2024' },
    { id: 4, name: 'Avenant salaire', type: 'amendment', lastModified: '01/01/2024' },
  ];

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {templates.map((template, index) => (
            <Pressable
              key={template.id}
              className={`flex-row items-center gap-4 p-4 active:bg-slate-50 ${index < templates.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
                <FileText size={20} color="#64748b" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-slate-900">{template.name}</Text>
                <Text className="text-sm text-slate-500">Modifié le {template.lastModified}</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function BillingSettings() {
  const [tvaRate, setTvaRate] = useState('20');
  const [paymentDelay, setPaymentDelay] = useState('30');
  const [legalMention, setLegalMention] = useState('TVA non applicable, art. 293 B du CGI');

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        <View className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
          <Text className="font-semibold text-slate-900 mb-4">Paramètres TVA</Text>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">Taux de TVA (%)</Text>
            <TextInput
              value={tvaRate}
              onChangeText={setTvaRate}
              className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-slate-900"
              keyboardType="numeric"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">Délai de paiement (jours)</Text>
            <TextInput
              value={paymentDelay}
              onChangeText={setPaymentDelay}
              className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-slate-900"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="font-semibold text-slate-900 mb-4">Mentions légales</Text>
          <TextInput
            value={legalMention}
            onChangeText={setLegalMention}
            className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-slate-900"
            multiline
            numberOfLines={3}
          />
        </View>

        <Pressable className="bg-indigo-500 rounded-xl py-4 mt-6 flex-row items-center justify-center gap-2 active:bg-indigo-600">
          <Save size={20} color="white" />
          <Text className="text-white font-semibold">Enregistrer</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// === SOCIÉTÉ B SETTINGS ===

function TeamSettings() {
  const appMode = useAppMode();
  const { data: demoEmployees } = useEmployees();
  const storedEmployees = useRealEmployees();
  const storedSocietesB = useSocietesB();

  const employees = appMode === 'real' ? storedEmployees : demoEmployees;
  const employeesList = Array.isArray(employees) ? employees : [];

  // Empty state for real mode
  if (appMode === 'real' && storedEmployees.length === 0) {
    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          <View className="bg-white rounded-2xl p-8 border border-slate-100 items-center">
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
            >
              <User size={36} color="white" />
            </LinearGradient>
            <Text className="text-xl font-bold text-slate-900 mb-2 text-center">Aucun collaborateur</Text>
            <Text className="text-slate-500 text-center px-4">
              Les employés mis à disposition par votre prestataire apparaîtront ici une fois ajoutés.
            </Text>
          </View>

          <View className="bg-blue-50 rounded-2xl p-4 mt-4 border border-blue-100 flex-row items-start gap-3">
            <User size={20} color="#3b82f6" />
            <View className="flex-1">
              <Text className="text-sm text-blue-800">
                Votre prestataire de paie ajoutera les employés qui travailleront pour votre entreprise.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        <View className="bg-indigo-50 rounded-2xl p-4 mb-4 border border-indigo-100">
          <Text className="font-semibold text-indigo-900">Collaborateurs rattachés</Text>
          <Text className="text-sm text-indigo-700 mt-1">
            {employeesList.length} salarié(s) porté(s) travaillent pour votre entreprise
          </Text>
        </View>

        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {appMode === 'real' ? (
            storedEmployees.map((employee, index: number) => {
              const societeB = storedSocietesB.find(s => s.id === employee.societeBId);
              return (
                <View
                  key={employee.id}
                  className={`flex-row items-center gap-4 p-4 ${index < storedEmployees.length - 1 ? 'border-b border-slate-100' : ''}`}
                >
                  <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                    <Text className="text-indigo-600 font-medium">
                      {employee.fullName?.split(' ').map((n: string) => n[0]).join('') ?? '?'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-slate-900">{employee.fullName}</Text>
                    <Text className="text-sm text-slate-500">{employee.position}</Text>
                  </View>
                  <ChevronRight size={20} color="#94a3b8" />
                </View>
              );
            })
          ) : (
            (employeesList as { id: string; full_name: string; position: string }[]).map((employee, index: number) => (
              <View
                key={employee.id}
                className={`flex-row items-center gap-4 p-4 ${index < employeesList.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                  <Text className="text-indigo-600 font-medium">
                    {employee.full_name?.split(' ').map((n: string) => n[0]).join('') ?? '?'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-slate-900">{employee.full_name}</Text>
                  <Text className="text-sm text-slate-500">{employee.position}</Text>
                </View>
                <ChevronRight size={20} color="#94a3b8" />
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function ContractsSettings() {
  const appMode = useAppMode();

  // Demo contracts data
  const demoContracts = [
    { id: 1, employee: 'Marie Dupont', type: 'CDI', startDate: '01/03/2023', status: 'active' },
    { id: 2, employee: 'Pierre Martin', type: 'CDD', startDate: '15/06/2023', status: 'active' },
    { id: 3, employee: 'Sophie Bernard', type: 'CDI', startDate: '01/09/2022', status: 'ended' },
  ];

  // Empty state for real mode
  if (appMode === 'real') {
    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          <View className="bg-white rounded-2xl p-8 border border-slate-100 items-center">
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
            >
              <FileText size={36} color="white" />
            </LinearGradient>
            <Text className="text-xl font-bold text-slate-900 mb-2 text-center">Aucun contrat</Text>
            <Text className="text-slate-500 text-center px-4">
              Les contrats de vos collaborateurs apparaîtront ici une fois qu'ils seront créés par votre prestataire.
            </Text>
          </View>

          <View className="bg-blue-50 rounded-2xl p-4 mt-4 border border-blue-100 flex-row items-start gap-3">
            <FileText size={20} color="#3b82f6" />
            <View className="flex-1">
              <Text className="text-sm text-blue-800">
                Les contrats seront générés automatiquement lors de l'ajout d'employés à votre entreprise.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {demoContracts.map((contract, index) => (
            <Pressable
              key={contract.id}
              className={`flex-row items-center gap-4 p-4 active:bg-slate-50 ${index < demoContracts.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
                <FileText size={20} color="#64748b" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-slate-900">{contract.employee}</Text>
                <Text className="text-sm text-slate-500">{contract.type} - Depuis le {contract.startDate}</Text>
              </View>
              <View className={`px-2 py-1 rounded ${contract.status === 'active' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                <Text className={`text-xs font-medium ${contract.status === 'active' ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {contract.status === 'active' ? 'Actif' : 'Terminé'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// === EMPLOYÉ SETTINGS ===

function DocumentsSettings() {
  const documents = [
    { id: 1, name: 'Bulletin Décembre 2024', type: 'bulletin', date: '31/12/2024' },
    { id: 2, name: 'Bulletin Novembre 2024', type: 'bulletin', date: '30/11/2024' },
    { id: 3, name: 'Contrat de travail', type: 'contract', date: '01/03/2023' },
    { id: 4, name: 'Avenant n°1', type: 'amendment', date: '01/09/2023' },
    { id: 5, name: 'Attestation employeur', type: 'certificate', date: '15/01/2024' },
  ];

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {documents.map((doc, index) => (
            <Pressable
              key={doc.id}
              className={`flex-row items-center gap-4 p-4 active:bg-slate-50 ${index < documents.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <View className="w-10 h-10 rounded-xl bg-indigo-100 items-center justify-center">
                <FileText size={20} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-slate-900">{doc.name}</Text>
                <Text className="text-sm text-slate-500">{doc.date}</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function BankSettings() {
  const [iban, setIban] = useState('FR76 1234 5678 9012 3456 7890 123');
  const [bic, setBic] = useState('BNPAFRPP');
  const [bankName, setBankName] = useState('BNP Paribas');

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        <View className="bg-amber-50 rounded-2xl p-4 mb-4 border border-amber-100 flex-row items-center gap-3">
          <Shield size={20} color="#d97706" />
          <View className="flex-1">
            <Text className="text-sm text-amber-800">
              Vos coordonnées bancaires sont utilisées uniquement pour le versement de vos salaires.
            </Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="font-semibold text-slate-900 mb-4">Coordonnées bancaires</Text>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">IBAN</Text>
            <TextInput
              value={iban}
              onChangeText={setIban}
              className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-slate-900"
              autoCapitalize="characters"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">BIC / SWIFT</Text>
            <TextInput
              value={bic}
              onChangeText={setBic}
              className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-slate-900"
              autoCapitalize="characters"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm text-slate-500 mb-2">Nom de la banque</Text>
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 text-slate-900"
            />
          </View>
        </View>

        <Pressable className="bg-indigo-500 rounded-xl py-4 mt-6 flex-row items-center justify-center gap-2 active:bg-indigo-600">
          <Save size={20} color="white" />
          <Text className="text-white font-semibold">Enregistrer</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function MyContractSettings() {
  const contractInfo = {
    type: 'CDI',
    startDate: '01/03/2023',
    position: 'Développeuse Senior',
    hourlyRate: 45,
    weeklyHours: 35,
    employer: 'TechCorp Industries',
    portage: 'TalentFlow SAS',
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        <View className="bg-indigo-50 rounded-2xl p-4 mb-4 border border-indigo-100">
          <View className="flex-row items-center gap-2">
            <View className="bg-indigo-500 px-2 py-1 rounded">
              <Text className="text-white text-xs font-medium">{contractInfo.type}</Text>
            </View>
            <Text className="text-indigo-700">Depuis le {contractInfo.startDate}</Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-5 border border-slate-100 mb-4">
          <Text className="font-semibold text-slate-900 mb-4">Informations contractuelles</Text>

          <View className="py-3 border-b border-slate-100">
            <Text className="text-sm text-slate-500">Poste</Text>
            <Text className="font-medium text-slate-900 mt-1">{contractInfo.position}</Text>
          </View>

          <View className="py-3 border-b border-slate-100">
            <Text className="text-sm text-slate-500">Taux journalier</Text>
            <Text className="font-medium text-slate-900 mt-1">{contractInfo.hourlyRate * 7} € / jour</Text>
          </View>

          <View className="py-3 border-b border-slate-100">
            <Text className="text-sm text-slate-500">Durée hebdomadaire</Text>
            <Text className="font-medium text-slate-900 mt-1">{contractInfo.weeklyHours}h / semaine</Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-5 border border-slate-100">
          <Text className="font-semibold text-slate-900 mb-4">Parties prenantes</Text>

          <View className="py-3 border-b border-slate-100">
            <Text className="text-sm text-slate-500">Entreprise cliente</Text>
            <Text className="font-medium text-slate-900 mt-1">{contractInfo.employer}</Text>
          </View>

          <View className="py-3">
            <Text className="text-sm text-slate-500">Société de portage</Text>
            <Text className="font-medium text-slate-900 mt-1">{contractInfo.portage}</Text>
          </View>
        </View>

        <Pressable className="border border-indigo-200 bg-indigo-50 rounded-xl py-4 mt-6 flex-row items-center justify-center gap-2 active:bg-indigo-100">
          <FileText size={20} color="#6366f1" />
          <Text className="text-indigo-600 font-semibold">Télécharger mon contrat</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// === DOCUMENT UPLOAD SETTINGS ===

function CompanyDocumentsSettings() {
  const appMode = useAppMode();

  // Demo documents for demo mode
  const demoDocuments: DocumentUploadItem[] = [
    {
      id: 'kbis',
      name: 'Extrait KBIS',
      description: 'Document officiel de moins de 3 mois',
      icon: <FileText size={24} color="#64748b" />,
      required: true,
      uploaded: true,
      fileName: 'kbis_techcorp_2024.pdf',
      uploadDate: '15/12/2024',
    },
    {
      id: 'id_manager',
      name: 'Carte d\'identité du gérant',
      description: 'Recto/verso en cours de validité',
      icon: <User size={24} color="#64748b" />,
      required: true,
      uploaded: false,
    },
    {
      id: 'contract_signed',
      name: 'Contrat signé avec Société A',
      description: 'Convention de portage signée',
      icon: <FileText size={24} color="#64748b" />,
      required: true,
      uploaded: true,
      fileName: 'contrat_portage_talentflow.pdf',
      uploadDate: '01/03/2023',
    },
    {
      id: 'rib_company',
      name: 'RIB de l\'entreprise',
      description: 'Relevé d\'identité bancaire',
      icon: <CreditCard size={24} color="#64748b" />,
      required: true,
      uploaded: true,
      fileName: 'rib_techcorp.pdf',
      uploadDate: '01/03/2023',
    },
  ];

  // Real mode documents - start empty
  const realDocuments: DocumentUploadItem[] = [
    {
      id: 'kbis',
      name: 'Extrait KBIS',
      description: 'Document officiel de moins de 3 mois',
      icon: <FileText size={24} color="#64748b" />,
      required: true,
      uploaded: false,
    },
    {
      id: 'id_manager',
      name: 'Carte d\'identité du gérant',
      description: 'Recto/verso en cours de validité',
      icon: <User size={24} color="#64748b" />,
      required: true,
      uploaded: false,
    },
    {
      id: 'contract_signed',
      name: 'Contrat signé avec Société A',
      description: 'Convention de portage signée',
      icon: <FileText size={24} color="#64748b" />,
      required: true,
      uploaded: false,
    },
    {
      id: 'rib_company',
      name: 'RIB de l\'entreprise',
      description: 'Relevé d\'identité bancaire',
      icon: <CreditCard size={24} color="#64748b" />,
      required: true,
      uploaded: false,
    },
  ];

  const [documents, setDocuments] = useState<DocumentUploadItem[]>(
    appMode === 'real' ? realDocuments : demoDocuments
  );

  const handleUpload = async (id: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setDocuments(docs =>
          docs.map(doc =>
            doc.id === id
              ? {
                  ...doc,
                  uploaded: true,
                  fileName: file.name,
                  uploadDate: new Date().toLocaleDateString('fr-FR'),
                }
              : doc
          )
        );
        Alert.alert('Succès', 'Document ajouté avec succès');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le document');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Supprimer le document',
      'Êtes-vous sûr de vouloir supprimer ce document ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setDocuments(docs =>
              docs.map(doc =>
                doc.id === id
                  ? { ...doc, uploaded: false, fileName: undefined, uploadDate: undefined }
                  : doc
              )
            );
          },
        },
      ]
    );
  };

  const uploadedCount = documents.filter(d => d.uploaded).length;
  const requiredCount = documents.filter(d => d.required).length;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        {/* Progress */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-semibold text-slate-900">Progression</Text>
            <Text className="text-indigo-600 font-medium">{uploadedCount}/{documents.length}</Text>
          </View>
          <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${(uploadedCount / documents.length) * 100}%` }}
            />
          </View>
          {uploadedCount < requiredCount && (
            <Text className="text-sm text-amber-600 mt-2">
              {requiredCount - uploadedCount} document(s) requis manquant(s)
            </Text>
          )}
        </View>

        {/* Info */}
        <View className="bg-indigo-50 rounded-2xl p-4 mb-4 border border-indigo-100 flex-row items-start gap-3">
          <Shield size={20} color="#6366f1" />
          <View className="flex-1">
            <Text className="text-sm text-indigo-800">
              Ces documents sont nécessaires pour la mise en place du portage salarial. Formats acceptés : PDF, JPG, PNG.
            </Text>
          </View>
        </View>

        {/* Document Cards */}
        {documents.map(doc => (
          <DocumentUploadCard
            key={doc.id}
            item={doc}
            onUpload={handleUpload}
            onDelete={handleDelete}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function EmployeeDocumentsSettings() {
  const appMode = useAppMode();

  // Demo documents for demo mode
  const demoDocuments: DocumentUploadItem[] = [
    {
      id: 'id_card',
      name: 'Carte d\'identité',
      description: 'Recto/verso en cours de validité',
      icon: <User size={24} color="#64748b" />,
      required: true,
      uploaded: true,
      fileName: 'cni_marie_dupont.pdf',
      uploadDate: '01/03/2023',
    },
    {
      id: 'carte_vitale',
      name: 'Carte Vitale',
      description: 'Attestation de droits ou carte',
      icon: <Shield size={24} color="#64748b" />,
      required: true,
      uploaded: true,
      fileName: 'carte_vitale_attestation.pdf',
      uploadDate: '01/03/2023',
    },
    {
      id: 'rib_employee',
      name: 'RIB personnel',
      description: 'Pour le versement du salaire',
      icon: <CreditCard size={24} color="#64748b" />,
      required: true,
      uploaded: true,
      fileName: 'rib_marie_dupont.pdf',
      uploadDate: '01/03/2023',
    },
    {
      id: 'address_proof',
      name: 'Justificatif de domicile',
      description: 'De moins de 3 mois (optionnel)',
      icon: <FileText size={24} color="#64748b" />,
      required: false,
      uploaded: false,
    },
  ];

  // Real mode documents - start empty
  const realDocuments: DocumentUploadItem[] = [
    {
      id: 'id_card',
      name: 'Carte d\'identité',
      description: 'Recto/verso en cours de validité',
      icon: <User size={24} color="#64748b" />,
      required: true,
      uploaded: false,
    },
    {
      id: 'carte_vitale',
      name: 'Carte Vitale',
      description: 'Attestation de droits ou carte',
      icon: <Shield size={24} color="#64748b" />,
      required: true,
      uploaded: false,
    },
    {
      id: 'rib_employee',
      name: 'RIB personnel',
      description: 'Pour le versement du salaire',
      icon: <CreditCard size={24} color="#64748b" />,
      required: true,
      uploaded: false,
    },
    {
      id: 'address_proof',
      name: 'Justificatif de domicile',
      description: 'De moins de 3 mois (optionnel)',
      icon: <FileText size={24} color="#64748b" />,
      required: false,
      uploaded: false,
    },
  ];

  const [documents, setDocuments] = useState<DocumentUploadItem[]>(
    appMode === 'real' ? realDocuments : demoDocuments
  );

  const handleUpload = async (id: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setDocuments(docs =>
          docs.map(doc =>
            doc.id === id
              ? {
                  ...doc,
                  uploaded: true,
                  fileName: file.name,
                  uploadDate: new Date().toLocaleDateString('fr-FR'),
                }
              : doc
          )
        );
        Alert.alert('Succès', 'Document ajouté avec succès');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le document');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Supprimer le document',
      'Êtes-vous sûr de vouloir supprimer ce document ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setDocuments(docs =>
              docs.map(doc =>
                doc.id === id
                  ? { ...doc, uploaded: false, fileName: undefined, uploadDate: undefined }
                  : doc
              )
            );
          },
        },
      ]
    );
  };

  const uploadedCount = documents.filter(d => d.uploaded).length;
  const requiredDocs = documents.filter(d => d.required);
  const requiredUploaded = requiredDocs.filter(d => d.uploaded).length;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-5">
        {/* Progress */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-semibold text-slate-900">Documents fournis</Text>
            <Text className="text-indigo-600 font-medium">{uploadedCount}/{documents.length}</Text>
          </View>
          <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${(uploadedCount / documents.length) * 100}%` }}
            />
          </View>
          {requiredUploaded === requiredDocs.length ? (
            <View className="flex-row items-center gap-2 mt-2">
              <Check size={16} color="#10b981" />
              <Text className="text-sm text-emerald-600">Tous les documents requis sont fournis</Text>
            </View>
          ) : (
            <Text className="text-sm text-amber-600 mt-2">
              {requiredDocs.length - requiredUploaded} document(s) requis manquant(s)
            </Text>
          )}
        </View>

        {/* Info */}
        <View className="bg-amber-50 rounded-2xl p-4 mb-4 border border-amber-100 flex-row items-start gap-3">
          <Shield size={20} color="#d97706" />
          <View className="flex-1">
            <Text className="text-sm text-amber-800">
              Vos documents personnels sont stockés de manière sécurisée et utilisés uniquement dans le cadre de votre contrat de travail.
            </Text>
          </View>
        </View>

        {/* Document Cards */}
        {documents.map(doc => (
          <DocumentUploadCard
            key={doc.id}
            item={doc}
            onUpload={handleUpload}
            onDelete={handleDelete}
          />
        ))}
      </View>
    </ScrollView>
  );
}

export default function SettingsDetailScreen() {
  const { section } = useLocalSearchParams<{ section: SettingsSection }>();

  const titles: Record<SettingsSection, string> = {
    profile: 'Mon profil',
    company: 'Mon entreprise',
    notifications: 'Notifications',
    security: 'Sécurité',
    appearance: 'Apparence',
    language: 'Langue',
    help: 'Aide et support',
    employees: 'Gestion des employés',
    templates: 'Modèles de documents',
    billing: 'Paramètres de facturation',
    team: 'Mon équipe',
    contracts: 'Gestion des contrats',
    documents: 'Mes documents',
    bank: 'Coordonnées bancaires',
    mycontract: 'Mon contrat',
    'company-documents': 'Documents entreprise',
    'employee-documents': 'Mes justificatifs',
  };

  const renderContent = () => {
    switch (section) {
      case 'profile':
        return <ProfileSettings />;
      case 'company':
        return <CompanySettings />;
      case 'notifications':
        return <NotificationsSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'language':
        return <LanguageSettings />;
      case 'help':
        return <HelpSettings />;
      case 'employees':
        return <EmployeesSettings />;
      case 'templates':
        return <TemplatesSettings />;
      case 'billing':
        return <BillingSettings />;
      case 'team':
        return <TeamSettings />;
      case 'contracts':
        return <ContractsSettings />;
      case 'documents':
        return <DocumentsSettings />;
      case 'bank':
        return <BankSettings />;
      case 'mycontract':
        return <MyContractSettings />;
      case 'company-documents':
        return <CompanyDocumentsSettings />;
      case 'employee-documents':
        return <EmployeeDocumentsSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <X size={24} color="#64748b" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">{titles[section ?? 'profile']}</Text>
        <View className="w-10" />
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}
