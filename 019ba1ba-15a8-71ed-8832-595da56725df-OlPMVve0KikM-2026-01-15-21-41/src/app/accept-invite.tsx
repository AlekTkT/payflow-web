import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  Phone,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/lib/state/auth-store';
import { useAppStore } from '@/lib/state/app-store';
import type { UserType, Invitation } from '@/lib/database.types';

const USER_TYPE_LABELS: Record<UserType, string> = {
  admin_app: 'Administrateur',
  societe_a: 'Société A (Prestataire de paie)',
  societe_b: 'Société B (Client)',
  employe: 'Employé',
};

export default function AcceptInviteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const setUser = useAuthStore((s) => s.setUser);
  const setUserType = useAppStore((s) => s.setUserType);
  const setCompanyId = useAppStore((s) => s.setCompanyId);
  const setUserId = useAppStore((s) => s.setUserId);

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load invitation details
  useEffect(() => {
    const loadInvitation = async () => {
      const token = params.token;
      if (!token) {
        setInvitationError('Lien d\'invitation invalide');
        setIsLoadingInvitation(false);
        return;
      }

      try {
        if (!isSupabaseConfigured) {
          // Demo mode - simulate finding invitation
          setInvitation({
            id: 'demo-inv',
            email: 'nouveau@exemple.fr',
            user_type: 'societe_b',
            company_id: 'demo-company',
            employee_id: null,
            invited_by: 'demo-admin',
            status: 'pending',
            token: token,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            accepted_at: null,
            created_at: new Date().toISOString(),
          });
          setIsLoadingInvitation(false);
          return;
        }

        const { data, error: fetchError } = await (supabase
          .from('invitations') as any)
          .select('*')
          .eq('token', token)
          .single();

        if (fetchError || !data) {
          setInvitationError('Invitation non trouvée ou expirée');
          setIsLoadingInvitation(false);
          return;
        }

        const inv = data as Invitation;

        // Check if already accepted
        if (inv.status === 'accepted') {
          setInvitationError('Cette invitation a déjà été utilisée');
          setIsLoadingInvitation(false);
          return;
        }

        // Check if expired
        if (new Date(inv.expires_at) < new Date()) {
          setInvitationError('Cette invitation a expiré');
          setIsLoadingInvitation(false);
          return;
        }

        // Check if cancelled
        if (inv.status === 'cancelled') {
          setInvitationError('Cette invitation a été annulée');
          setIsLoadingInvitation(false);
          return;
        }

        setInvitation(inv);
      } catch (err) {
        setInvitationError('Erreur lors du chargement de l\'invitation');
      } finally {
        setIsLoadingInvitation(false);
      }
    };

    loadInvitation();
  }, [params.token]);

  const handleSubmit = async () => {
    // Validation
    if (!fullName.trim()) {
      setError('Veuillez entrer votre nom complet');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!invitation) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        // Demo mode - simulate account creation
        const demoUser = {
          id: 'demo-user-' + Date.now(),
          email: invitation.email,
          full_name: fullName,
          user_type: invitation.user_type,
          company_id: invitation.company_id,
          employee_id: invitation.employee_id,
        };

        setUser(demoUser);
        setUserType(invitation.user_type);
        setUserId(demoUser.id);
        if (invitation.company_id) {
          setCompanyId(invitation.company_id);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Compte créé !',
          'Votre compte a été créé avec succès. Bienvenue sur PayFlow !',
          [{ text: 'Continuer', onPress: () => router.replace('/(tabs)') }]
        );
        return;
      }

      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            user_type: invitation.user_type,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('Un compte existe déjà avec cet email. Utilisez la connexion.');
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte');
      }

      // Step 2: Create user in users table
      const { error: userError } = await (supabase.from('users') as any).insert({
        id: authData.user.id,
        email: invitation.email,
        full_name: fullName,
        user_type: invitation.user_type,
        company_id: invitation.company_id,
      });

      if (userError) {
        console.error('Error creating user:', userError);
        // Continue anyway - the user record might already exist
      }

      // Step 3: If employee invitation, link user to employee
      if (invitation.employee_id) {
        await (supabase.from('employees') as any)
          .update({ user_id: authData.user.id })
          .eq('id', invitation.employee_id);
      }

      // Step 4: Mark invitation as accepted
      await (supabase.from('invitations') as any)
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      // Step 5: Set user state
      setUser({
        id: authData.user.id,
        email: invitation.email,
        full_name: fullName,
        user_type: invitation.user_type,
        company_id: invitation.company_id,
        employee_id: invitation.employee_id,
      });
      setUserType(invitation.user_type);
      setUserId(authData.user.id);
      if (invitation.company_id) {
        setCompanyId(invitation.company_id);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Compte créé !',
        'Votre compte a été créé avec succès. Bienvenue sur PayFlow !',
        [{ text: 'Continuer', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoadingInvitation) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-400 mt-4">Chargement de l'invitation...</Text>
      </View>
    );
  }

  // Error state
  if (invitationError) {
    return (
      <View className="flex-1 bg-slate-900">
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#334155']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-red-500/20 items-center justify-center mb-6">
            <XCircle size={48} color="#ef4444" />
          </View>
          <Text className="text-white text-2xl font-bold text-center mb-2">
            Invitation invalide
          </Text>
          <Text className="text-slate-400 text-center mb-8">
            {invitationError}
          </Text>
          <Pressable
            onPress={() => router.replace('/login')}
            className="bg-indigo-500 px-8 py-4 rounded-xl"
          >
            <Text className="text-white font-semibold">Aller à la connexion</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative circles */}
      <View
        className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-10"
        style={{ backgroundColor: '#10b981' }}
      />
      <View
        className="absolute bottom-20 -left-20 w-40 h-40 rounded-full opacity-10"
        style={{ backgroundColor: '#6366f1' }}
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="items-center mb-8"
            >
              <View className="w-20 h-20 rounded-2xl bg-emerald-500/20 items-center justify-center mb-4">
                <CheckCircle size={44} color="#10b981" strokeWidth={1.5} />
              </View>
              <Text className="text-3xl font-bold text-white tracking-tight">
                Bienvenue !
              </Text>
              <Text className="text-slate-400 text-base mt-1 text-center">
                Créez votre compte PayFlow
              </Text>
            </Animated.View>

            {/* Invitation Info */}
            <Animated.View entering={FadeInUp.delay(150).springify()} className="mb-4">
              <BlurView
                intensity={15}
                tint="dark"
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(16,185,129,0.2)',
                }}
              >
                <View className="p-4">
                  <Text className="text-emerald-400 text-sm font-medium mb-1">
                    Invitation pour
                  </Text>
                  <Text className="text-white font-semibold">{invitation?.email}</Text>
                  <View className="flex-row items-center mt-2">
                    <Building2 size={14} color="#64748b" />
                    <Text className="text-slate-400 text-sm ml-2">
                      {USER_TYPE_LABELS[invitation?.user_type ?? 'employe']}
                    </Text>
                  </View>
                </View>
              </BlurView>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInUp.delay(200).springify()}>
              <BlurView
                intensity={20}
                tint="dark"
                style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <View className="p-6">
                  {/* Full Name */}
                  <View className="mb-4">
                    <Text className="text-slate-300 text-sm font-medium mb-2 ml-1">
                      Nom complet
                    </Text>
                    <View className="flex-row items-center bg-slate-800/50 rounded-xl px-4 border border-slate-700/50">
                      <User size={20} color="#64748b" />
                      <TextInput
                        className="flex-1 py-4 px-3 text-white text-base"
                        placeholder="Jean Dupont"
                        placeholderTextColor="#64748b"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  {/* Phone (optional) */}
                  <View className="mb-4">
                    <Text className="text-slate-300 text-sm font-medium mb-2 ml-1">
                      Téléphone <Text className="text-slate-500">(optionnel)</Text>
                    </Text>
                    <View className="flex-row items-center bg-slate-800/50 rounded-xl px-4 border border-slate-700/50">
                      <Phone size={20} color="#64748b" />
                      <TextInput
                        className="flex-1 py-4 px-3 text-white text-base"
                        placeholder="+33 6 12 34 56 78"
                        placeholderTextColor="#64748b"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  {/* Password */}
                  <View className="mb-4">
                    <Text className="text-slate-300 text-sm font-medium mb-2 ml-1">
                      Mot de passe
                    </Text>
                    <View className="flex-row items-center bg-slate-800/50 rounded-xl px-4 border border-slate-700/50">
                      <Lock size={20} color="#64748b" />
                      <TextInput
                        className="flex-1 py-4 px-3 text-white text-base"
                        placeholder="Minimum 8 caractères"
                        placeholderTextColor="#64748b"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                      />
                      <Pressable
                        onPress={() => {
                          setShowPassword(!showPassword);
                          Haptics.selectionAsync();
                        }}
                        hitSlop={8}
                      >
                        {showPassword ? (
                          <EyeOff size={20} color="#64748b" />
                        ) : (
                          <Eye size={20} color="#64748b" />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {/* Confirm Password */}
                  <View className="mb-4">
                    <Text className="text-slate-300 text-sm font-medium mb-2 ml-1">
                      Confirmer le mot de passe
                    </Text>
                    <View className="flex-row items-center bg-slate-800/50 rounded-xl px-4 border border-slate-700/50">
                      <Lock size={20} color="#64748b" />
                      <TextInput
                        className="flex-1 py-4 px-3 text-white text-base"
                        placeholder="••••••••"
                        placeholderTextColor="#64748b"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <Pressable
                        onPress={() => {
                          setShowConfirmPassword(!showConfirmPassword);
                          Haptics.selectionAsync();
                        }}
                        hitSlop={8}
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} color="#64748b" />
                        ) : (
                          <Eye size={20} color="#64748b" />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {/* Error */}
                  {error && (
                    <Animated.View entering={FadeInDown.springify()}>
                      <Text className="text-red-400 text-sm text-center mb-4">
                        {error}
                      </Text>
                    </Animated.View>
                  )}

                  {/* Submit Button */}
                  <Pressable
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                  >
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        borderRadius: 12,
                        paddingVertical: 16,
                        alignItems: 'center',
                      }}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white font-semibold text-base">
                          Créer mon compte
                        </Text>
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>
              </BlurView>
            </Animated.View>

            {/* Back to login link */}
            <Animated.View
              entering={FadeInUp.delay(300).springify()}
              className="items-center mt-6"
            >
              <Pressable onPress={() => router.replace('/login')}>
                <Text className="text-slate-400 text-sm">
                  Vous avez déjà un compte ?{' '}
                  <Text className="text-indigo-400 font-medium">Se connecter</Text>
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
