import { useState } from 'react';
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from 'react-native-reanimated';
import { Mail, Lock, Eye, EyeOff, Shield, ChevronRight, Building2, Users, User, Sparkles, ArrowLeft, Fingerprint } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/lib/state/auth-store';
import { useAppStore } from '@/lib/state/app-store';
import type { UserType, User as UserDB } from '@/lib/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LoginMode = 'selection' | 'demo' | 'real';

const DEMO_ROLES = [
  {
    type: 'admin_app' as UserType,
    name: 'Admin PayFlow',
    description: 'Gestion complète de la plateforme',
    icon: Shield,
    gradient: ['#8b5cf6', '#7c3aed'] as const,
    email: 'admin@payflow.fr',
  },
  {
    type: 'societe_a' as UserType,
    name: 'Société A',
    description: 'Prestataire de paie',
    icon: Building2,
    gradient: ['#3b82f6', '#2563eb'] as const,
    email: 'societe-a@payflow.fr',
  },
  {
    type: 'societe_b' as UserType,
    name: 'Société B',
    description: 'Client employeur',
    icon: Users,
    gradient: ['#10b981', '#059669'] as const,
    email: 'societe-b@payflow.fr',
  },
  {
    type: 'employe' as UserType,
    name: 'Employé',
    description: 'Salarié porté',
    icon: User,
    gradient: ['#f59e0b', '#d97706'] as const,
    email: 'employe@payflow.fr',
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setUserType = useAppStore((s) => s.setUserType);
  const setCompanyId = useAppStore((s) => s.setCompanyId);
  const setUserId = useAppStore((s) => s.setUserId);
  const setAppMode = useAppStore((s) => s.setAppMode);

  const [loginMode, setLoginMode] = useState<LoginMode>('selection');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = (role: typeof DEMO_ROLES[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setUser({
      id: 'demo-' + role.type,
      email: role.email,
      full_name: role.name,
      user_type: role.type,
      company_id: role.type === 'societe_a' ? 'demo-company-a' :
                  role.type === 'societe_b' ? 'demo-company-b' : null,
      employee_id: role.type === 'employe' ? 'demo-employee' : null,
    });
    setUserType(role.type);
    setUserId('demo-' + role.type);
    setAppMode('demo');
    if (role.type === 'societe_a' || role.type === 'societe_b') {
      setCompanyId('demo-company-' + (role.type === 'societe_a' ? 'a' : 'b'));
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  const handleRealLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Admin override - always works regardless of Supabase config
      const adminCredentials: Record<string, { password: string; user_type: UserType; name: string }> = {
        'sciscialek@gmail.com': { password: 'Lancing58?', user_type: 'admin_app', name: 'Admin PayFlow' },
      };

      const normalizedEmail = email.toLowerCase().trim().replace(/\s+/g, '');
      const adminUser = adminCredentials[normalizedEmail];

      if (adminUser && password === adminUser.password) {
        setUser({
          id: 'admin-' + normalizedEmail,
          email: normalizedEmail,
          full_name: adminUser.name,
          user_type: adminUser.user_type,
          company_id: null,
          employee_id: null,
        });
        setUserType(adminUser.user_type);
        setUserId('admin-' + normalizedEmail);
        setAppMode('real');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
        return;
      }

      if (!isSupabaseConfigured) {
        throw new Error('Base de données non configurée. Contactez l\'administrateur.');
      }

      // Mode réel avec Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Récupérer les infos utilisateur depuis la table users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single<UserDB>();

        if (userError || !userData) {
          throw new Error('Compte non configuré. Contactez l\'administrateur.');
        }

        // Vérifier si c'est un employé
        let employeeId: string | null = null;
        if (userData.user_type === 'employe') {
          const { data: empData } = await supabase
            .from('employees')
            .select('id')
            .eq('user_id', authData.user.id)
            .single<{ id: string }>();
          employeeId = empData?.id ?? null;
        }

        setUser({
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          user_type: userData.user_type,
          company_id: userData.company_id,
          employee_id: employeeId,
        });
        setUserType(userData.user_type);
        setUserId(userData.id);
        setCompanyId(userData.company_id);
        setAppMode('real');

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isSupabaseConfigured) {
      Alert.alert(
        'Non disponible',
        'La connexion Google nécessite une configuration serveur.'
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion Google';
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mode Selection Screen - New elegant design
  if (loginMode === 'selection') {
    return (
      <View className="flex-1 bg-[#0a0f1a]">
        {/* Background gradient */}
        <LinearGradient
          colors={['#0a0f1a', '#111827', '#1f2937']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {/* Decorative orbs */}
        <Animated.View
          entering={FadeIn.delay(300).duration(1000)}
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full"
          style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)' }}
        />
        <Animated.View
          entering={FadeIn.delay(400).duration(1000)}
          className="absolute top-1/4 -left-16 w-48 h-48 rounded-full"
          style={{ backgroundColor: 'rgba(16, 185, 129, 0.06)' }}
        />
        <Animated.View
          entering={FadeIn.delay(500).duration(1000)}
          className="absolute bottom-32 right-8 w-32 h-32 rounded-full"
          style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)' }}
        />

        <SafeAreaView className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo Section */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="items-center mb-12"
            >
              <View className="mb-6">
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#6366f1',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                  }}
                >
                  <Shield size={44} color="white" strokeWidth={1.5} />
                </LinearGradient>
              </View>
              <Text className="text-4xl font-bold text-white tracking-tight mb-2">
                PayFlow
              </Text>
              <Text className="text-slate-400 text-lg text-center">
                Gestion de paie simplifiée
              </Text>
            </Animated.View>

            {/* Main Login Button */}
            <Animated.View entering={FadeInUp.delay(200).springify()} className="mb-4">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setLoginMode('real');
                }}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.95 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                })}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 20,
                    padding: 20,
                    shadowColor: '#10b981',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                  }}
                >
                  <View className="flex-row items-center">
                    <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center mr-4">
                      <Fingerprint size={28} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-xl font-bold">Se connecter</Text>
                      <Text className="text-white/70 text-sm mt-0.5">
                        Accès sécurisé à votre compte
                      </Text>
                    </View>
                    <ChevronRight size={24} color="rgba(255,255,255,0.7)" />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Info Card */}
            <Animated.View entering={FadeInUp.delay(300).springify()} className="mb-8">
              <View
                className="rounded-2xl p-4 border"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  borderColor: 'rgba(71, 85, 105, 0.3)'
                }}
              >
                <View className="flex-row items-center">
                  <Shield size={18} color="#64748b" />
                  <Text className="text-slate-400 text-sm ml-2 flex-1">
                    Accès sur invitation uniquement
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Demo Link */}
            <Animated.View
              entering={FadeInUp.delay(400).springify()}
              className="items-center"
            >
              <Text className="text-slate-500 text-sm text-center mb-4">
                Vous souhaitez découvrir PayFlow ?
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLoginMode('demo');
                }}
                className="flex-row items-center px-5 py-3 rounded-full"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
              >
                <Sparkles size={16} color="#818cf8" />
                <Text className="text-indigo-400 font-medium ml-2">
                  Essayer la démo
                </Text>
              </Pressable>
            </Animated.View>

            {/* Footer */}
            <Animated.View
              entering={FadeInUp.delay(500).springify()}
              className="items-center mt-12"
            >
              <Text className="text-slate-600 text-xs text-center leading-5">
                En continuant, vous acceptez nos{'\n'}
                conditions d'utilisation et politique de confidentialité
              </Text>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // Demo Role Selection Screen
  if (loginMode === 'demo') {
    return (
      <View className="flex-1 bg-[#0a0f1a]">
        <LinearGradient
          colors={['#0a0f1a', '#111827', '#1f2937']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {/* Decorative orbs */}
        <Animated.View
          entering={FadeIn.delay(200).duration(800)}
          className="absolute top-20 right-0 w-48 h-48 rounded-full"
          style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)' }}
        />

        <SafeAreaView className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="mb-8"
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLoginMode('selection');
                }}
                className="flex-row items-center mb-6 -ml-1"
                hitSlop={12}
              >
                <ArrowLeft size={20} color="#64748b" />
                <Text className="text-slate-400 text-base ml-1">Retour</Text>
              </Pressable>

              <Text className="text-3xl font-bold text-white mb-2">
                Mode Démo
              </Text>
              <Text className="text-slate-400 text-base leading-6">
                Explorez PayFlow avec des données fictives
              </Text>
            </Animated.View>

            {/* Demo Info Banner */}
            <Animated.View entering={FadeInUp.delay(150).springify()} className="mb-6">
              <LinearGradient
                colors={['rgba(99,102,241,0.12)', 'rgba(139,92,246,0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(99,102,241,0.2)',
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-indigo-500/20 items-center justify-center mr-3">
                    <Sparkles size={20} color="#a5b4fc" />
                  </View>
                  <Text className="text-indigo-300 text-sm flex-1 leading-5">
                    Données réinitialisées à chaque session
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Role Cards */}
            <View className="mb-6">
              <Text className="text-slate-500 text-sm font-medium mb-4 ml-1">
                CHOISISSEZ UN PROFIL
              </Text>
              {DEMO_ROLES.map((role, index) => (
                <Animated.View
                  key={role.type}
                  entering={FadeInUp.delay(200 + index * 60).springify()}
                  className="mb-3"
                >
                  <Pressable
                    onPress={() => handleDemoLogin(role)}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }]
                    })}
                  >
                    <View
                      className="rounded-2xl overflow-hidden border"
                      style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.6)',
                        borderColor: 'rgba(71, 85, 105, 0.3)'
                      }}
                    >
                      <View className="p-4 flex-row items-center">
                        <LinearGradient
                          colors={[...role.gradient]}
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 14,
                          }}
                        >
                          <role.icon size={26} color="white" />
                        </LinearGradient>
                        <View className="flex-1">
                          <Text className="text-white font-semibold text-base mb-0.5">
                            {role.name}
                          </Text>
                          <Text className="text-slate-400 text-sm">
                            {role.description}
                          </Text>
                        </View>
                        <View
                          className="w-9 h-9 rounded-full items-center justify-center"
                          style={{ backgroundColor: role.gradient[0] + '20' }}
                        >
                          <ChevronRight size={18} color={role.gradient[0]} />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // Real Login Form
  return (
    <View className="flex-1 bg-[#0a0f1a]">
      <LinearGradient
        colors={['#0a0f1a', '#111827', '#1f2937']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Decorative orbs */}
      <Animated.View
        entering={FadeIn.delay(200).duration(800)}
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
        style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}
      />
      <Animated.View
        entering={FadeIn.delay(300).duration(800)}
        className="absolute bottom-40 -left-12 w-40 h-40 rounded-full"
        style={{ backgroundColor: 'rgba(59, 130, 246, 0.06)' }}
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="mb-6"
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLoginMode('selection');
                  setEmail('');
                  setPassword('');
                  setError(null);
                }}
                className="flex-row items-center -ml-1"
                hitSlop={12}
              >
                <ArrowLeft size={20} color="#64748b" />
                <Text className="text-slate-400 text-base ml-1">Retour</Text>
              </Pressable>
            </Animated.View>

            {/* Header */}
            <Animated.View
              entering={FadeInDown.delay(150).springify()}
              className="mb-8"
            >
              <View className="mb-5">
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Lock size={30} color="white" strokeWidth={1.5} />
                </LinearGradient>
              </View>
              <Text className="text-3xl font-bold text-white mb-2">
                Connexion
              </Text>
              <Text className="text-slate-400 text-base">
                Accédez à votre espace PayFlow
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInUp.delay(200).springify()}>
              {/* Email Input */}
              <View className="mb-5">
                <Text className="text-slate-300 text-sm font-medium mb-2.5 ml-1">
                  Adresse email
                </Text>
                <View
                  className="flex-row items-center rounded-xl px-4 border"
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    borderColor: error ? 'rgba(239, 68, 68, 0.5)' : 'rgba(71, 85, 105, 0.4)'
                  }}
                >
                  <Mail size={20} color="#64748b" />
                  <TextInput
                    className="flex-1 py-4 px-3 text-white text-base"
                    placeholder="votre@email.com"
                    placeholderTextColor="#64748b"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError(null);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View className="mb-5">
                <Text className="text-slate-300 text-sm font-medium mb-2.5 ml-1">
                  Mot de passe
                </Text>
                <View
                  className="flex-row items-center rounded-xl px-4 border"
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.6)',
                    borderColor: error ? 'rgba(239, 68, 68, 0.5)' : 'rgba(71, 85, 105, 0.4)'
                  }}
                >
                  <Lock size={20} color="#64748b" />
                  <TextInput
                    className="flex-1 py-4 px-3 text-white text-base"
                    placeholder="••••••••"
                    placeholderTextColor="#64748b"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError(null);
                    }}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />
                  <Pressable
                    onPress={() => {
                      setShowPassword(!showPassword);
                      Haptics.selectionAsync();
                    }}
                    hitSlop={12}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#64748b" />
                    ) : (
                      <Eye size={20} color="#64748b" />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Error Message */}
              {error && (
                <Animated.View entering={FadeInDown.springify()} className="mb-4">
                  <View
                    className="rounded-xl p-3 flex-row items-center"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    <View className="w-8 h-8 rounded-full bg-red-500/20 items-center justify-center mr-3">
                      <Text className="text-red-400 text-sm">!</Text>
                    </View>
                    <Text className="text-red-400 text-sm flex-1">{error}</Text>
                  </View>
                </Animated.View>
              )}

              {/* Login Button */}
              <Pressable
                onPress={handleRealLogin}
                disabled={isLoading}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                })}
                className="mb-5"
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 14,
                    paddingVertical: 16,
                    alignItems: 'center',
                    shadowColor: '#10b981',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      Se connecter
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Divider */}
              <View className="flex-row items-center my-5">
                <View className="flex-1 h-px bg-slate-700/50" />
                <Text className="text-slate-500 mx-4 text-sm">ou</Text>
                <View className="flex-1 h-px bg-slate-700/50" />
              </View>

              {/* Google Button */}
              <Pressable
                onPress={handleGoogleLogin}
                disabled={isLoading}
                className="rounded-xl py-4 flex-row items-center justify-center border"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.9 : 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderColor: 'rgba(226, 232, 240, 0.5)'
                })}
              >
                <Text className="text-xl mr-3">G</Text>
                <Text className="text-slate-800 font-semibold text-base">
                  Continuer avec Google
                </Text>
              </Pressable>
            </Animated.View>

            {/* Footer */}
            <Animated.View
              entering={FadeInUp.delay(300).springify()}
              className="items-center mt-8 mb-6"
            >
              <Text className="text-slate-500 text-sm text-center leading-5">
                Accès sur invitation uniquement{'\n'}
                Contactez votre administrateur
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
