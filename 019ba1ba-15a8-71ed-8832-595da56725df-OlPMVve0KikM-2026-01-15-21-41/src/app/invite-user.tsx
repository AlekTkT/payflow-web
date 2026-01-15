import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import {
  X,
  Mail,
  UserPlus,
  Building2,
  Users,
  User,
  ChevronDown,
  Check,
  Clock,
  XCircle,
  Send,
  Trash2,
  MessageCircle,
  Phone,
  Copy,
  Link,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/lib/state/auth-store';
import { useUserType } from '@/lib/state/app-store';
import type { UserType, Invitation, Company, Employee } from '@/lib/database.types';

type InvitableType = 'societe_a' | 'societe_b' | 'employe';

const USER_TYPE_LABELS: Record<UserType, string> = {
  admin_app: 'Administrateur',
  societe_a: 'Société A (Prestataire)',
  societe_b: 'Société B (Client)',
  employe: 'Employé',
};

const USER_TYPE_COLORS: Record<UserType, readonly [string, string]> = {
  admin_app: ['#8b5cf6', '#7c3aed'] as const,
  societe_a: ['#3b82f6', '#2563eb'] as const,
  societe_b: ['#10b981', '#059669'] as const,
  employe: ['#f59e0b', '#d97706'] as const,
};

const USER_TYPE_DESCRIPTIONS: Record<InvitableType, string> = {
  societe_a: 'Gérer la paie et les bulletins',
  societe_b: 'Gérer les employés et factures',
  employe: 'Consulter bulletins et variables',
};

// Demo data
const DEMO_INVITATIONS: Invitation[] = [
  {
    id: '1',
    email: 'nouveau@societe-b.fr',
    user_type: 'societe_b',
    company_id: 'demo-company-b',
    employee_id: null,
    invited_by: 'demo-societe-a',
    status: 'pending',
    token: 'abc123',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    accepted_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'employe@test.fr',
    user_type: 'employe',
    company_id: null,
    employee_id: 'demo-employee-1',
    invited_by: 'demo-societe-a',
    status: 'accepted',
    token: 'def456',
    expires_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEMO_COMPANIES: Company[] = [
  {
    id: 'demo-company-b',
    name: 'Client Corp',
    type: 'client',
    parent_company_id: 'demo-company-a',
    siret: '98765432109876',
    urssaf_number: 'URF456',
    legal_status: 'SARL',
    address: '456 Avenue du Business',
    postal_code: '69001',
    city: 'Lyon',
    phone: '0987654321',
    email: 'contact@clientcorp.fr',
    contact_name: 'Marie Dupont',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEMO_EMPLOYEES: Employee[] = [
  {
    id: 'demo-employee-1',
    user_id: null,
    employer_company_id: 'demo-company-a',
    client_company_id: 'demo-company-b',
    full_name: 'Pierre Durand',
    position: 'Développeur',
    hourly_rate: 45,
    contract_type: 'CDI',
    hire_date: '2024-01-15',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-employee-2',
    user_id: null,
    employer_company_id: 'demo-company-a',
    client_company_id: 'demo-company-b',
    full_name: 'Sophie Martin',
    position: 'Designer',
    hourly_rate: 40,
    contract_type: 'CDI',
    hire_date: '2024-02-01',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function InviteUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const queryClient = useQueryClient();
  const currentUserType = useUserType();
  const user = useAuthStore((s) => s.user);

  const [showForm, setShowForm] = useState(true);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [inviteMethod, setInviteMethod] = useState<'email' | 'whatsapp' | 'sms' | 'link'>('link');
  const [selectedType, setSelectedType] = useState<InvitableType>(
    params.type === 'employe' ? 'employe' :
    params.type === 'societe_b' ? 'societe_b' :
    params.type === 'societe_a' ? 'societe_a' :
    currentUserType === 'admin_app' ? 'societe_a' :
    currentUserType === 'societe_b' ? 'employe' : 'societe_b'
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Determine what types can be invited based on current user
  const getInvitableTypes = (): InvitableType[] => {
    if (currentUserType === 'admin_app') {
      return ['societe_a'];
    }
    if (currentUserType === 'societe_a') {
      return ['societe_b', 'employe'];
    }
    if (currentUserType === 'societe_b') {
      return ['employe'];
    }
    return [];
  };

  const invitableTypes = getInvitableTypes();

  // Get title based on current user
  const getTitle = () => {
    if (currentUserType === 'admin_app') return 'Inviter une Société A';
    if (currentUserType === 'societe_a') return 'Inviter un utilisateur';
    if (currentUserType === 'societe_b') return 'Inviter un employé';
    return 'Invitations';
  };

  const getSubtitle = () => {
    if (currentUserType === 'admin_app') return 'Ajouter un nouveau prestataire de paie';
    if (currentUserType === 'societe_a') return 'Ajouter un client ou un employé';
    if (currentUserType === 'societe_b') return 'Donner accès à vos employés';
    return 'Gérer les accès utilisateurs';
  };

  // Fetch invitations
  const { data: invitations = [], isLoading: loadingInvitations, refetch } = useQuery({
    queryKey: ['invitations', currentUserType, user?.id],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return DEMO_INVITATIONS.filter(inv => {
          if (currentUserType === 'admin_app') return inv.user_type === 'societe_a';
          if (currentUserType === 'societe_a') return inv.user_type === 'societe_b' || inv.user_type === 'employe';
          if (currentUserType === 'societe_b') return inv.user_type === 'employe';
          return false;
        });
      }
      const { data, error } = await (supabase
        .from('invitations') as any)
        .select('*')
        .eq('invited_by', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as Invitation[]) || [];
    },
  });

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ['companies-for-invitations'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return DEMO_COMPANIES.filter(c => c.type === 'client');
      }
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('type', 'client')
        .order('name');
      if (error) throw error;
      return (data as Company[]) || [];
    },
    enabled: currentUserType === 'societe_a',
  });

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-invitations'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return DEMO_EMPLOYEES.filter(e => !e.user_id);
      }
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .is('user_id', null)
        .order('full_name');
      if (error) throw error;
      return (data as Employee[]) || [];
    },
    enabled: currentUserType === 'societe_a' || currentUserType === 'societe_b',
  });

  // Create invitation mutation
  const createInvitation = useMutation({
    mutationFn: async (data: {
      email: string;
      user_type: UserType;
      company_id: string | null;
      employee_id: string | null;
    }) => {
      if (!isSupabaseConfigured) {
        const newInvitation: Invitation = {
          id: Date.now().toString(),
          email: data.email,
          user_type: data.user_type,
          company_id: data.company_id,
          employee_id: data.employee_id,
          invited_by: user?.id || 'demo-user',
          status: 'pending',
          token: Math.random().toString(36).substring(7),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null,
          created_at: new Date().toISOString(),
        };
        DEMO_INVITATIONS.unshift(newInvitation);
        return newInvitation;
      }

      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: invitation, error } = await (supabase
        .from('invitations') as any)
        .insert({
          email: data.email,
          user_type: data.user_type,
          company_id: data.company_id,
          employee_id: data.employee_id,
          invited_by: user?.id,
          token,
          expires_at: expiresAt,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return invitation as Invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setEmail('');
      setSelectedCompanyId(null);
      setSelectedEmployeeId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Invitation envoyée avec succès !');
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', error.message);
    },
  });

  // Cancel invitation mutation
  const cancelInvitation = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) {
        const idx = DEMO_INVITATIONS.findIndex((i) => i.id === id);
        if (idx !== -1) {
          DEMO_INVITATIONS[idx].status = 'cancelled';
        }
        return;
      }

      const { error } = await (supabase
        .from('invitations') as any)
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const generateInviteLink = () => {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    return `https://app.payflowcloud.app/accept-invite?token=${token}`;
  };

  const handleGenerateLink = () => {
    // Validation for employee type
    if (selectedType === 'employe' && !selectedEmployeeId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Veuillez sélectionner un employé');
      return;
    }

    if (selectedType === 'societe_b' && !selectedCompanyId && currentUserType === 'societe_a') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Veuillez sélectionner une société cliente');
      return;
    }

    const link = generateInviteLink();
    setGeneratedLink(link);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCopyLink = async () => {
    if (generatedLink) {
      await Clipboard.setStringAsync(generatedLink);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Copié !', 'Le lien d\'invitation a été copié.');
    }
  };

  const handleShareLink = async () => {
    if (generatedLink) {
      const message = `Vous êtes invité(e) à rejoindre PayFlow Cloud en tant que ${USER_TYPE_LABELS[selectedType]}.\n\nCliquez sur ce lien pour créer votre compte:\n${generatedLink}`;
      try {
        await Share.share({
          message,
          title: 'Invitation PayFlow Cloud',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // User cancelled
      }
    }
  };

  const handleSendViaWhatsApp = () => {
    if (!phoneNumber.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone');
      return;
    }

    const link = generatedLink || generateInviteLink();
    const message = `Vous êtes invité(e) à rejoindre PayFlow Cloud en tant que ${USER_TYPE_LABELS[selectedType]}.\n\nCliquez sur ce lien pour créer votre compte:\n${link}`;
    const cleanPhone = phoneNumber.replace(/\s/g, '').replace(/^\+/, '');
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp.');
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSendViaSMS = () => {
    if (!phoneNumber.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone');
      return;
    }

    const link = generatedLink || generateInviteLink();
    const message = `Invitation PayFlow Cloud: ${link}`;
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    const smsUrl = `sms:${cleanPhone}&body=${encodeURIComponent(message)}`;

    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application SMS.');
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSendViaEmail = () => {
    if (!email.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Veuillez entrer un email');
      return;
    }

    createInvitation.mutate({
      email: email.trim().toLowerCase(),
      user_type: selectedType,
      company_id: selectedType === 'societe_b' ? selectedCompanyId : null,
      employee_id: selectedType === 'employe' ? selectedEmployeeId : null,
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: '#f59e0b', label: 'En attente', bg: '#fef3c7' };
      case 'accepted':
        return { icon: Check, color: '#10b981', label: 'Acceptée', bg: '#d1fae5' };
      case 'expired':
        return { icon: XCircle, color: '#ef4444', label: 'Expirée', bg: '#fee2e2' };
      case 'cancelled':
        return { icon: XCircle, color: '#6b7280', label: 'Annulée', bg: '#f3f4f6' };
      default:
        return { icon: Clock, color: '#6b7280', label: status, bg: '#f3f4f6' };
    }
  };

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (invitableTypes.length === 0) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center px-6">
        <View className="w-20 h-20 rounded-full bg-slate-200 items-center justify-center mb-4">
          <User size={40} color="#94a3b8" />
        </View>
        <Text className="text-slate-900 text-xl font-bold text-center mb-2">
          Accès non autorisé
        </Text>
        <Text className="text-slate-500 text-center mb-6">
          Vous n'avez pas la permission d'envoyer des invitations
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-slate-900 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-5 py-4 bg-white border-b border-slate-100">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
            >
              <X size={20} color="#64748b" />
            </Pressable>
            <View className="flex-1 mx-4">
              <Text className="text-slate-900 text-lg font-bold">{getTitle()}</Text>
              <Text className="text-slate-500 text-sm">{getSubtitle()}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={loadingInvitations} onRefresh={onRefresh} tintColor="#6366f1" />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Type Selection Cards */}
          {invitableTypes.length > 1 && (
            <View className="px-5 pt-5">
              <Text className="text-slate-700 font-semibold mb-3">Type d'accès</Text>
              <View className="flex-row gap-3">
                {invitableTypes.map((type) => {
                  const isSelected = selectedType === type;
                  const colors = USER_TYPE_COLORS[type];
                  return (
                    <Pressable
                      key={type}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedType(type);
                        setSelectedCompanyId(null);
                        setSelectedEmployeeId(null);
                        setGeneratedLink(null);
                      }}
                      className="flex-1"
                    >
                      <LinearGradient
                        colors={isSelected ? [...colors] : ['#f8fafc', '#f1f5f9']}
                        style={{
                          borderRadius: 16,
                          padding: 16,
                          borderWidth: isSelected ? 0 : 1,
                          borderColor: '#e2e8f0',
                        }}
                      >
                        <View className="items-center">
                          {type === 'societe_b' && <Users size={24} color={isSelected ? 'white' : colors[0]} />}
                          {type === 'employe' && <User size={24} color={isSelected ? 'white' : colors[0]} />}
                          {type === 'societe_a' && <Building2 size={24} color={isSelected ? 'white' : colors[0]} />}
                          <Text className={`font-semibold mt-2 text-center ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {type === 'societe_b' ? 'Client' : type === 'employe' ? 'Employé' : 'Prestataire'}
                          </Text>
                          <Text className={`text-xs mt-1 text-center ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                            {USER_TYPE_DESCRIPTIONS[type]}
                          </Text>
                        </View>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Selection Dropdowns */}
          <View className="px-5 pt-5">
            {/* Company Dropdown for Société B */}
            {selectedType === 'societe_b' && currentUserType === 'societe_a' && (
              <Animated.View entering={FadeInDown.springify()} className="mb-4">
                <Text className="text-slate-700 font-medium mb-2">Société cliente</Text>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowCompanyDropdown(!showCompanyDropdown);
                  }}
                  className="bg-white rounded-xl px-4 py-4 border border-slate-200 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Building2 size={20} color="#64748b" />
                    <Text className={`ml-3 ${selectedCompanyId ? 'text-slate-900' : 'text-slate-400'}`}>
                      {selectedCompanyId
                        ? companies.find((c) => c.id === selectedCompanyId)?.name
                        : 'Sélectionner une société'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color="#64748b" />
                </Pressable>

                {showCompanyDropdown && companies.length > 0 && (
                  <View className="mt-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {companies.map((company) => (
                      <Pressable
                        key={company.id}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedCompanyId(company.id);
                          setShowCompanyDropdown(false);
                          setGeneratedLink(null);
                        }}
                        className="px-4 py-3 border-b border-slate-100 flex-row items-center justify-between active:bg-slate-50"
                      >
                        <View>
                          <Text className="text-slate-900 font-medium">{company.name}</Text>
                          {company.city && <Text className="text-slate-500 text-sm">{company.city}</Text>}
                        </View>
                        {selectedCompanyId === company.id && <Check size={18} color="#10b981" />}
                      </Pressable>
                    ))}
                  </View>
                )}
              </Animated.View>
            )}

            {/* Employee Dropdown */}
            {selectedType === 'employe' && (
              <Animated.View entering={FadeInDown.springify()} className="mb-4">
                <Text className="text-slate-700 font-medium mb-2">Employé à inviter</Text>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setShowEmployeeDropdown(!showEmployeeDropdown);
                  }}
                  className="bg-white rounded-xl px-4 py-4 border border-slate-200 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <User size={20} color="#64748b" />
                    <Text className={`ml-3 ${selectedEmployeeId ? 'text-slate-900' : 'text-slate-400'}`}>
                      {selectedEmployeeId
                        ? employees.find((e) => e.id === selectedEmployeeId)?.full_name
                        : 'Sélectionner un employé'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color="#64748b" />
                </Pressable>

                {showEmployeeDropdown && (
                  <View className="mt-2 bg-white rounded-xl border border-slate-200 overflow-hidden max-h-48">
                    <ScrollView nestedScrollEnabled>
                      {employees.length === 0 ? (
                        <View className="px-4 py-6 items-center">
                          <Text className="text-slate-400 text-center">Aucun employé sans compte</Text>
                        </View>
                      ) : (
                        employees.map((employee) => (
                          <Pressable
                            key={employee.id}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setSelectedEmployeeId(employee.id);
                              setShowEmployeeDropdown(false);
                              setGeneratedLink(null);
                            }}
                            className="px-4 py-3 border-b border-slate-100 flex-row items-center justify-between active:bg-slate-50"
                          >
                            <View>
                              <Text className="text-slate-900 font-medium">{employee.full_name}</Text>
                              <Text className="text-slate-500 text-sm">{employee.position}</Text>
                            </View>
                            {selectedEmployeeId === employee.id && <Check size={18} color="#10b981" />}
                          </Pressable>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </Animated.View>
            )}
          </View>

          {/* Generate Link Section */}
          <View className="px-5 pt-2">
            <View className="bg-white rounded-2xl p-5 border border-slate-200">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                  <Link size={20} color="#6366f1" />
                </View>
                <View className="ml-3">
                  <Text className="text-slate-900 font-semibold">Lien d'invitation</Text>
                  <Text className="text-slate-500 text-sm">Générez et partagez le lien</Text>
                </View>
              </View>

              {!generatedLink ? (
                <Pressable
                  onPress={handleGenerateLink}
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <LinearGradient
                    colors={['#6366f1', '#4f46e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                  >
                    <Sparkles size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">Générer le lien</Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <Animated.View entering={FadeInUp.springify()}>
                  {/* Link Display */}
                  <View className="bg-slate-50 rounded-xl p-3 mb-4">
                    <Text className="text-slate-600 text-xs font-mono" numberOfLines={2}>
                      {generatedLink}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3 mb-4">
                    <Pressable
                      onPress={handleCopyLink}
                      className="flex-1 bg-slate-100 rounded-xl py-3 flex-row items-center justify-center active:bg-slate-200"
                    >
                      <Copy size={18} color="#64748b" />
                      <Text className="text-slate-700 font-medium ml-2">Copier</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleShareLink}
                      className="flex-1 bg-indigo-500 rounded-xl py-3 flex-row items-center justify-center active:bg-indigo-600"
                    >
                      <Send size={18} color="white" />
                      <Text className="text-white font-medium ml-2">Partager</Text>
                    </Pressable>
                  </View>

                  {/* Alternative Methods */}
                  <Text className="text-slate-500 text-sm font-medium mb-3">Ou envoyer via :</Text>

                  {/* Phone input */}
                  <View className="flex-row items-center bg-slate-50 rounded-xl px-4 border border-slate-200 mb-3">
                    <Phone size={18} color="#64748b" />
                    <TextInput
                      className="flex-1 py-3.5 px-3 text-slate-900"
                      placeholder="+33 6 12 34 56 78"
                      placeholderTextColor="#94a3b8"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={handleSendViaWhatsApp}
                      className="flex-1 bg-emerald-500 rounded-xl py-3 flex-row items-center justify-center active:bg-emerald-600"
                    >
                      <MessageCircle size={18} color="white" />
                      <Text className="text-white font-medium ml-2">WhatsApp</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSendViaSMS}
                      className="flex-1 bg-blue-500 rounded-xl py-3 flex-row items-center justify-center active:bg-blue-600"
                    >
                      <Phone size={18} color="white" />
                      <Text className="text-white font-medium ml-2">SMS</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              )}
            </View>
          </View>

          {/* Email Section */}
          <View className="px-5 pt-4">
            <View className="bg-white rounded-2xl p-5 border border-slate-200">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center">
                  <Mail size={20} color="#f59e0b" />
                </View>
                <View className="ml-3">
                  <Text className="text-slate-900 font-semibold">Invitation par email</Text>
                  <Text className="text-slate-500 text-sm">Envoyer directement par email</Text>
                </View>
              </View>

              <View className="flex-row items-center bg-slate-50 rounded-xl px-4 border border-slate-200 mb-4">
                <Mail size={18} color="#64748b" />
                <TextInput
                  className="flex-1 py-3.5 px-3 text-slate-900"
                  placeholder="email@exemple.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Pressable
                onPress={handleSendViaEmail}
                disabled={createInvitation.isPending}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                >
                  {createInvitation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Send size={18} color="white" />
                      <Text className="text-white font-semibold ml-2">Envoyer l'invitation</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Invitations History */}
          <View className="px-5 pt-6">
            <Text className="text-slate-900 font-bold text-lg mb-4">
              Historique ({invitations.length})
            </Text>

            {loadingInvitations ? (
              <View className="py-10 items-center">
                <ActivityIndicator color="#6366f1" />
              </View>
            ) : invitations.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center border border-slate-200">
                <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
                  <Mail size={32} color="#cbd5e1" />
                </View>
                <Text className="text-slate-900 font-semibold text-center mb-1">
                  Aucune invitation
                </Text>
                <Text className="text-slate-500 text-center text-sm">
                  Vos invitations envoyées apparaîtront ici
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {invitations.map((invitation, index) => {
                  const statusConfig = getStatusConfig(invitation.status);
                  const StatusIcon = statusConfig.icon;
                  const typeColors = USER_TYPE_COLORS[invitation.user_type];

                  return (
                    <Animated.View
                      key={invitation.id}
                      entering={FadeInUp.delay(index * 50).springify()}
                    >
                      <View className="bg-white rounded-xl p-4 border border-slate-200">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-row items-center flex-1">
                            <LinearGradient
                              colors={[...typeColors]}
                              style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
                            >
                              {invitation.user_type === 'employe' && <User size={18} color="white" />}
                              {invitation.user_type === 'societe_b' && <Users size={18} color="white" />}
                              {invitation.user_type === 'societe_a' && <Building2 size={18} color="white" />}
                              {invitation.user_type === 'admin_app' && <Building2 size={18} color="white" />}
                            </LinearGradient>
                            <View className="ml-3 flex-1">
                              <Text className="text-slate-900 font-medium" numberOfLines={1}>
                                {invitation.email}
                              </Text>
                              <Text className="text-slate-500 text-sm">
                                {USER_TYPE_LABELS[invitation.user_type]}
                              </Text>
                            </View>
                          </View>
                          <View
                            className="flex-row items-center px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: statusConfig.bg }}
                          >
                            <StatusIcon size={14} color={statusConfig.color} />
                            <Text className="text-xs font-medium ml-1" style={{ color: statusConfig.color }}>
                              {statusConfig.label}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
                          <Text className="text-slate-400 text-xs">
                            {new Date(invitation.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Text>
                          {invitation.status === 'pending' && (
                            <Pressable
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                Alert.alert(
                                  'Annuler l\'invitation',
                                  'Êtes-vous sûr de vouloir annuler cette invitation ?',
                                  [
                                    { text: 'Non', style: 'cancel' },
                                    {
                                      text: 'Oui, annuler',
                                      style: 'destructive',
                                      onPress: () => cancelInvitation.mutate(invitation.id),
                                    },
                                  ]
                                );
                              }}
                              className="flex-row items-center active:opacity-70"
                            >
                              <Trash2 size={14} color="#ef4444" />
                              <Text className="text-red-500 text-xs font-medium ml-1">Annuler</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
