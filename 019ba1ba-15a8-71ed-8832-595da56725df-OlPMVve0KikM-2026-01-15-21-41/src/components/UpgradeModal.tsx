import React from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  X,
  Check,
  Crown,
  Zap,
  Users,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PLANS, PlanType, useSubscriptionStore } from '@/lib/state/subscription-store';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  currentPlan: PlanType;
  reason?: string;
  currentCount?: number;
  limit?: number;
  companyId: string;
}

export function UpgradeModal({
  visible,
  onClose,
  currentPlan,
  reason,
  currentCount,
  limit,
  companyId,
}: UpgradeModalProps) {
  const upgradePlan = useSubscriptionStore((s) => s.upgradePlan);

  const currentPlanConfig = PLANS[currentPlan];

  // Plans disponibles pour l'upgrade
  const availablePlans = (['starter', 'professional', 'enterprise'] as PlanType[]).filter(
    (plan) => {
      const config = PLANS[plan];
      return config.employeeLimit > currentPlanConfig.employeeLimit;
    }
  );

  const handleSelectPlan = (plan: PlanType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (plan === 'enterprise') {
      // Pour Enterprise, rediriger vers le contact
      onClose();
      router.push('/subscription');
    } else {
      // Pour les autres plans, simuler l'upgrade (en production, ça irait vers RevenueCat)
      upgradePlan(companyId, plan);
      onClose();
      router.push('/subscription');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />

        <Animated.View
          entering={FadeInUp.springify()}
          className="bg-white rounded-t-3xl max-h-[85%]"
        >
          {/* Header */}
          <View className="relative">
            <LinearGradient
              colors={['#6366f1', '#8b5cf6', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingTop: 24,
                paddingBottom: 32,
                paddingHorizontal: 20,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
            >
              <Pressable
                onPress={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 items-center justify-center"
              >
                <X size={18} color="white" />
              </Pressable>

              <View className="items-center">
                <View className="w-16 h-16 rounded-2xl bg-white/20 items-center justify-center mb-4">
                  <Crown size={32} color="white" />
                </View>
                <Text className="text-white text-2xl font-bold text-center">
                  Passez au niveau supérieur
                </Text>
                {reason && (
                  <View className="mt-3 bg-white/20 rounded-xl px-4 py-2">
                    <Text className="text-white/90 text-sm text-center">{reason}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Current usage indicator */}
            {currentCount !== undefined && limit !== undefined && (
              <View className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg px-6 py-3 border border-slate-100">
                <View className="flex-row items-center gap-2">
                  <Users size={18} color="#6366f1" />
                  <Text className="text-slate-900 font-semibold">
                    {currentCount}/{limit} employés
                  </Text>
                </View>
              </View>
            )}
          </View>

          <ScrollView
            className="flex-1 px-5"
            contentContainerStyle={{ paddingTop: 40, paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Plans */}
            <View className="gap-4">
              {availablePlans.map((planId, index) => {
                const plan = PLANS[planId];
                const isPopular = 'popular' in plan && plan.popular;

                return (
                  <Animated.View
                    key={planId}
                    entering={FadeInDown.delay(index * 100).springify()}
                  >
                    <Pressable
                      onPress={() => handleSelectPlan(planId)}
                      className={`relative rounded-2xl border-2 overflow-hidden ${
                        isPopular ? 'border-indigo-500' : 'border-slate-200'
                      }`}
                    >
                      {isPopular && (
                        <View className="absolute top-0 right-0 bg-indigo-500 px-3 py-1 rounded-bl-xl">
                          <Text className="text-white text-xs font-bold">POPULAIRE</Text>
                        </View>
                      )}

                      <View className="p-5">
                        <View className="flex-row items-start justify-between mb-3">
                          <View>
                            <Text className="text-lg font-bold text-slate-900">{plan.name}</Text>
                            <View className="flex-row items-baseline gap-1 mt-1">
                              <Text className="text-2xl font-bold" style={{ color: plan.color }}>
                                {plan.price === -1 ? 'Sur devis' : `${plan.price}€`}
                              </Text>
                              {plan.price !== -1 && (
                                <Text className="text-slate-500 text-sm">/mois HT</Text>
                              )}
                            </View>
                          </View>

                          <View
                            className="w-12 h-12 rounded-xl items-center justify-center"
                            style={{ backgroundColor: `${plan.color}15` }}
                          >
                            {planId === 'starter' && <Zap size={24} color={plan.color} />}
                            {planId === 'professional' && <Sparkles size={24} color={plan.color} />}
                            {planId === 'enterprise' && <Crown size={24} color={plan.color} />}
                          </View>
                        </View>

                        <View className="bg-slate-50 rounded-xl p-3 mb-3">
                          <View className="flex-row items-center gap-2">
                            <Users size={16} color="#64748b" />
                            <Text className="text-slate-700 font-medium">
                              {plan.employeeLimit === Infinity
                                ? 'Employés illimités'
                                : `Jusqu'à ${plan.employeeLimit} employés`}
                            </Text>
                          </View>
                        </View>

                        <View className="gap-2">
                          {plan.features.slice(1, 4).map((feature, i) => (
                            <View key={i} className="flex-row items-center gap-2">
                              <Check size={16} color="#10b981" />
                              <Text className="text-slate-600 text-sm">{feature}</Text>
                            </View>
                          ))}
                        </View>

                        <View
                          className="mt-4 py-3 rounded-xl flex-row items-center justify-center gap-2"
                          style={{ backgroundColor: isPopular ? '#6366f1' : '#f1f5f9' }}
                        >
                          <Text
                            className={`font-semibold ${
                              isPopular ? 'text-white' : 'text-slate-700'
                            }`}
                          >
                            {planId === 'enterprise' ? 'Nous contacter' : 'Choisir ce plan'}
                          </Text>
                          <ArrowRight size={18} color={isPopular ? 'white' : '#64748b'} />
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            {/* Current plan info */}
            <View className="mt-6 bg-amber-50 rounded-xl p-4 flex-row items-start gap-3">
              <AlertTriangle size={20} color="#f59e0b" />
              <View className="flex-1">
                <Text className="text-amber-800 font-medium">Plan actuel : {currentPlanConfig.name}</Text>
                <Text className="text-amber-700 text-sm mt-1">
                  {currentPlan === 'trial'
                    ? 'Votre essai gratuit vous permet de tester toutes les fonctionnalités.'
                    : `Votre plan permet jusqu'à ${currentPlanConfig.employeeLimit} employés.`}
                </Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Composant simplifié pour afficher une bannière d'upgrade
export function UpgradeBanner({
  companyId,
  onUpgradePress,
}: {
  companyId: string;
  onUpgradePress: () => void;
}) {
  const subscription = useSubscriptionStore((s) => s.getSubscription(companyId));
  const getDaysRemaining = useSubscriptionStore((s) => s.getDaysRemaining);

  if (!subscription) return null;

  const daysRemaining = getDaysRemaining(companyId);
  const plan = PLANS[subscription.plan];
  const usagePercent = (subscription.employeeCount / plan.employeeLimit) * 100;

  // Afficher la bannière si essai ou proche de la limite
  const showTrialBanner = subscription.status === 'trial' && daysRemaining !== null && daysRemaining <= 7;
  const showLimitBanner = usagePercent >= 80;

  if (!showTrialBanner && !showLimitBanner) return null;

  return (
    <Pressable onPress={onUpgradePress}>
      <LinearGradient
        colors={showTrialBanner ? ['#f59e0b', '#d97706'] : ['#6366f1', '#8b5cf6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          marginHorizontal: 20,
          marginBottom: 16,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
            {showTrialBanner ? (
              <AlertTriangle size={22} color="white" />
            ) : (
              <Zap size={22} color="white" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold">
              {showTrialBanner
                ? `Plus que ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} d'essai`
                : `${subscription.employeeCount}/${plan.employeeLimit} employés`}
            </Text>
            <Text className="text-white/80 text-sm">
              {showTrialBanner
                ? 'Passez à un plan payant pour continuer'
                : 'Passez au plan supérieur pour plus de capacité'}
            </Text>
          </View>
          <ArrowRight size={20} color="white" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
