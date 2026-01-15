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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import {
  X,
  Mail,
  UserPlus,
  Building2,
  Users,
  User,
  Shield,
  ChevronDown,
  Check,
  Clock,
  XCircle,
  Send,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore, useIsAdmin } from '@/lib/state/auth-store';
import type { UserType, Invitation, Company, Employee } from '@/lib/database.types';

type InvitationType = 'societe_a' | 'societe_b' | 'employe';

const USER_TYPE_LABELS: Record<UserType, string> = {
  admin_app: 'Admin App',
  societe_a: 'Société A (Prestataire)',
  societe_b: 'Société B (Client)',
  employe: 'Employé',
};

const USER_TYPE_COLORS: Record<UserType, string> = {
  admin_app: '#8b5cf6',
  societe_a: '#3b82f6',
  societe_b: '#10b981',
  employe: '#f59e0b',
};

// Demo data
const DEMO_INVITATIONS: Invitation[] = [
  {
    id: '1',
    email: 'nouveau@societe-a.fr',
    user_type: 'societe_a',
    company_id: 'demo-company-a',
    employee_id: null,
    invited_by: 'demo-admin',
    status: 'pending',
    token: 'abc123',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    accepted_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'client@societe-b.fr',
    user_type: 'societe_b',
    company_id: 'demo-company-b',
    employee_id: null,
    invited_by: 'demo-admin',
    status: 'accepted',
    token: 'def456',
    expires_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    accepted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEMO_COMPANIES: Company[] = [
  {
    id: 'demo-company-a',
    name: 'PayFlow Services',
    type: 'prestataire',
    parent_company_id: null,
    siret: '12345678901234',
    urssaf_number: 'URF123',
    legal_status: 'SAS',
    address: '123 Rue de la Paie',
    postal_code: '75001',
    city: 'Paris',
    phone: '0123456789',
    email: 'contact@payflow.fr',
    contact_name: 'Jean Martin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
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
];

export default function AdminInvitationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();
  const user = useAuthStore((s) => s.user);

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedType, setSelectedType] = useState<InvitationType>('societe_a');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Fetch invitations
  const { data: invitations = [], isLoading: loadingInvitations, refetch } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return DEMO_INVITATIONS;
      }
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
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
        return DEMO_COMPANIES;
      }
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data as Company[]) || [];
    },
  });

  // Fetch employees (for employee invitations)
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-invitations'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return DEMO_EMPLOYEES;
      }
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .is('user_id', null)
        .order('full_name');
      if (error) throw error;
      return (data as Employee[]) || [];
    },
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
        // Simulate creation in demo mode
        const newInvitation: Invitation = {
          id: Date.now().toString(),
          email: data.email,
          user_type: data.user_type,
          company_id: data.company_id,
          employee_id: data.employee_id,
          invited_by: user?.id || 'demo-admin',
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
      setShowForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', 'Invitation envoyée avec succès');
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

  const handleSendInvitation = () => {
    if (!email.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Veuillez entrer un email');
      return;
    }

    if (selectedType === 'societe_b' && !selectedCompanyId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Veuillez sélectionner une société cliente');
      return;
    }

    if (selectedType === 'employe' && !selectedEmployeeId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Veuillez sélectionner un employé');
      return;
    }

    createInvitation.mutate({
      email: email.trim().toLowerCase(),
      user_type: selectedType,
      company_id: selectedType === 'societe_b' ? selectedCompanyId :
                  selectedType === 'societe_a' ? companies.find(c => c.type === 'prestataire')?.id || null : null,
      employee_id: selectedType === 'employe' ? selectedEmployeeId : null,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color="#f59e0b" />;
      case 'accepted':
        return <Check size={16} color="#10b981" />;
      case 'expired':
      case 'cancelled':
        return <XCircle size={16} color="#ef4444" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'accepted':
        return 'Acceptée';
      case 'expired':
        return 'Expirée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (selectedType === 'societe_a') return c.type === 'prestataire';
    if (selectedType === 'societe_b') return c.type === 'client';
    return true;
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  if (!isAdmin && user?.user_type !== 'admin_app') {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Shield size={64} color="#ef4444" />
        <Text className="text-white text-xl font-bold mt-4">Accès refusé</Text>
        <Text className="text-slate-400 text-center mt-2 px-8">
          Seuls les administrateurs peuvent accéder à cette page
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 bg-slate-700 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-medium">Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 items-center justify-center rounded-full bg-slate-800"
            >
              <X size={20} color="#94a3b8" />
            </Pressable>
            <View className="ml-4">
              <Text className="text-white text-xl font-bold">Invitations</Text>
              <Text className="text-slate-400 text-sm">Gérer les accès utilisateurs</Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowForm(!showForm);
            }}
            className="w-10 h-10 items-center justify-center rounded-full bg-blue-500"
          >
            <UserPlus size={20} color="white" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={loadingInvitations} onRefresh={onRefresh} tintColor="#3b82f6" />
          }
        >
          {/* New Invitation Form */}
          {showForm && (
            <Animated.View entering={FadeInDown.springify()}>
              <BlurView
                intensity={20}
                tint="dark"
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                }}
              >
                <View className="p-5">
                  <Text className="text-white text-lg font-semibold mb-4">
                    Nouvelle invitation
                  </Text>

                  {/* Email */}
                  <View className="mb-4">
                    <Text className="text-slate-300 text-sm font-medium mb-2">Email</Text>
                    <View className="flex-row items-center bg-slate-800/50 rounded-xl px-4 border border-slate-700/50">
                      <Mail size={18} color="#64748b" />
                      <TextInput
                        className="flex-1 py-3.5 px-3 text-white"
                        placeholder="email@exemple.com"
                        placeholderTextColor="#64748b"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  {/* Type Dropdown */}
                  <View className="mb-4">
                    <Text className="text-slate-300 text-sm font-medium mb-2">Type d'accès</Text>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setShowTypeDropdown(!showTypeDropdown);
                      }}
                      className="flex-row items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3.5 border border-slate-700/50"
                    >
                      <View className="flex-row items-center">
                        {selectedType === 'societe_a' && <Building2 size={18} color={USER_TYPE_COLORS.societe_a} />}
                        {selectedType === 'societe_b' && <Users size={18} color={USER_TYPE_COLORS.societe_b} />}
                        {selectedType === 'employe' && <User size={18} color={USER_TYPE_COLORS.employe} />}
                        <Text className="text-white ml-3">{USER_TYPE_LABELS[selectedType]}</Text>
                      </View>
                      <ChevronDown size={18} color="#64748b" />
                    </Pressable>

                    {showTypeDropdown && (
                      <View className="mt-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                        {(['societe_a', 'societe_b', 'employe'] as InvitationType[]).map((type) => (
                          <Pressable
                            key={type}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setSelectedType(type);
                              setShowTypeDropdown(false);
                              setSelectedCompanyId(null);
                              setSelectedEmployeeId(null);
                            }}
                            className="flex-row items-center px-4 py-3 border-b border-slate-700/50"
                          >
                            {type === 'societe_a' && <Building2 size={18} color={USER_TYPE_COLORS.societe_a} />}
                            {type === 'societe_b' && <Users size={18} color={USER_TYPE_COLORS.societe_b} />}
                            {type === 'employe' && <User size={18} color={USER_TYPE_COLORS.employe} />}
                            <Text className="text-white ml-3">{USER_TYPE_LABELS[type]}</Text>
                            {selectedType === type && <Check size={16} color="#3b82f6" className="ml-auto" />}
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Company Dropdown (for Société B) */}
                  {selectedType === 'societe_b' && (
                    <View className="mb-4">
                      <Text className="text-slate-300 text-sm font-medium mb-2">Société cliente</Text>
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          setShowCompanyDropdown(!showCompanyDropdown);
                        }}
                        className="flex-row items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3.5 border border-slate-700/50"
                      >
                        <Text className={selectedCompanyId ? 'text-white' : 'text-slate-500'}>
                          {selectedCompanyId
                            ? companies.find((c) => c.id === selectedCompanyId)?.name
                            : 'Sélectionner une société'}
                        </Text>
                        <ChevronDown size={18} color="#64748b" />
                      </Pressable>

                      {showCompanyDropdown && (
                        <View className="mt-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden max-h-48">
                          <ScrollView>
                            {filteredCompanies.map((company) => (
                              <Pressable
                                key={company.id}
                                onPress={() => {
                                  Haptics.selectionAsync();
                                  setSelectedCompanyId(company.id);
                                  setShowCompanyDropdown(false);
                                }}
                                className="px-4 py-3 border-b border-slate-700/50"
                              >
                                <Text className="text-white">{company.name}</Text>
                                {company.city && (
                                  <Text className="text-slate-400 text-xs mt-0.5">{company.city}</Text>
                                )}
                              </Pressable>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Employee Dropdown (for Employé) */}
                  {selectedType === 'employe' && (
                    <View className="mb-4">
                      <Text className="text-slate-300 text-sm font-medium mb-2">Employé</Text>
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          setShowEmployeeDropdown(!showEmployeeDropdown);
                        }}
                        className="flex-row items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3.5 border border-slate-700/50"
                      >
                        <Text className={selectedEmployeeId ? 'text-white' : 'text-slate-500'}>
                          {selectedEmployeeId
                            ? employees.find((e) => e.id === selectedEmployeeId)?.full_name
                            : 'Sélectionner un employé'}
                        </Text>
                        <ChevronDown size={18} color="#64748b" />
                      </Pressable>

                      {showEmployeeDropdown && (
                        <View className="mt-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden max-h-48">
                          <ScrollView>
                            {employees.length === 0 ? (
                              <View className="px-4 py-3">
                                <Text className="text-slate-400 text-center">
                                  Aucun employé sans compte
                                </Text>
                              </View>
                            ) : (
                              employees.map((employee) => (
                                <Pressable
                                  key={employee.id}
                                  onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedEmployeeId(employee.id);
                                    setShowEmployeeDropdown(false);
                                  }}
                                  className="px-4 py-3 border-b border-slate-700/50"
                                >
                                  <Text className="text-white">{employee.full_name}</Text>
                                  <Text className="text-slate-400 text-xs mt-0.5">{employee.position}</Text>
                                </Pressable>
                              ))
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Send Button */}
                  <Pressable
                    onPress={handleSendInvitation}
                    disabled={createInvitation.isPending}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                  >
                    <LinearGradient
                      colors={['#3b82f6', '#2563eb']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        borderRadius: 12,
                        paddingVertical: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
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
              </BlurView>
            </Animated.View>
          )}

          {/* Invitations List */}
          <Text className="text-slate-400 text-sm font-medium mb-3 ml-1">
            Invitations ({invitations.length})
          </Text>

          {loadingInvitations ? (
            <View className="py-10">
              <ActivityIndicator color="#3b82f6" />
            </View>
          ) : invitations.length === 0 ? (
            <View className="bg-slate-800/30 rounded-2xl p-8 items-center">
              <Mail size={48} color="#475569" />
              <Text className="text-slate-400 text-center mt-4">
                Aucune invitation envoyée
              </Text>
            </View>
          ) : (
            invitations.map((invitation, index) => (
              <Animated.View
                key={invitation.id}
                entering={SlideInRight.delay(index * 50).springify()}
              >
                <BlurView
                  intensity={15}
                  tint="dark"
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <View className="p-4">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-white font-medium">{invitation.email}</Text>
                        <View className="flex-row items-center mt-1">
                          <View
                            className="px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: USER_TYPE_COLORS[invitation.user_type] + '20' }}
                          >
                            <Text
                              className="text-xs font-medium"
                              style={{ color: USER_TYPE_COLORS[invitation.user_type] }}
                            >
                              {USER_TYPE_LABELS[invitation.user_type]}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        {getStatusIcon(invitation.status)}
                        <Text className="text-slate-400 text-xs ml-1.5">
                          {getStatusLabel(invitation.status)}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-700/30">
                      <Text className="text-slate-500 text-xs">
                        {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
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
                          className="flex-row items-center"
                        >
                          <Trash2 size={14} color="#ef4444" />
                          <Text className="text-red-400 text-xs ml-1">Annuler</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </BlurView>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
