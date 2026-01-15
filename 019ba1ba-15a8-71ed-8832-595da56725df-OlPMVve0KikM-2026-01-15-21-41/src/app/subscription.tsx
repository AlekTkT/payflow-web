import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowLeft,
  CreditCard,
  Check,
  Eye,
  Download,
  Euro,
  AlertTriangle,
  Crown,
  Users,
  Zap,
  Sparkles,
  ArrowRight,
  Calendar,
  RefreshCw,
  Loader2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppMode, useUserType } from '@/lib/state/app-store';
import { usePayFlowInvoices } from '@/lib/state/data-store';
import { Badge } from '@/components/payflow/ui';
import {
  PLANS,
  PlanType,
  useSubscriptionStore,
  usePlanLimits,
} from '@/lib/state/subscription-store';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  hasEntitlement,
  isRevenueCatEnabled,
} from '@/lib/revenuecatClient';
import type { PurchasesPackage } from 'react-native-purchases';

// Company ID pour la démo (Société A)
const DEMO_COMPANY_ID = 'company-a-1';

// Demo data for PayFlow subscription invoices
const DEMO_PAYFLOW_INVOICES = [
  {
    id: '1',
    invoiceNumber: 'PF-2025-001',
    plan: 'Professional',
    amount: 695,
    period: 'Janvier 2025',
    status: 'sent',
    dueDate: '2025-01-15',
    paidAt: null,
  },
  {
    id: '2',
    invoiceNumber: 'PF-2024-012',
    plan: 'Professional',
    amount: 695,
    period: 'Décembre 2024',
    status: 'paid',
    dueDate: '2024-12-15',
    paidAt: '2024-12-10',
  },
  {
    id: '3',
    invoiceNumber: 'PF-2024-011',
    plan: 'Professional',
    amount: 695,
    period: 'Novembre 2024',
    status: 'paid',
    dueDate: '2024-11-15',
    paidAt: '2024-11-08',
  },
];

function PayFlowInvoiceCard({
  invoice,
}: {
  invoice: typeof DEMO_PAYFLOW_INVOICES[0];
}) {
  const statusConfig = {
    sent: { label: 'À payer', variant: 'warning' as const },
    paid: { label: 'Payée', variant: 'success' as const },
  };

  const config = statusConfig[invoice.status as keyof typeof statusConfig] || statusConfig.sent;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleView = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      `Facture ${invoice.invoiceNumber}`,
      `Abonnement PayFlow - Plan ${invoice.plan}\nPériode: ${invoice.period}\nMontant: ${invoice.amount}€ HT\n${invoice.paidAt ? `Payée le: ${formatDate(invoice.paidAt)}` : `Échéance: ${formatDate(invoice.dueDate)}`}`,
      [{ text: 'Fermer' }]
    );
  };

  const handleDownloadPDF = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('PDF généré', `Facture ${invoice.invoiceNumber} téléchargée`);
  };

  const handlePay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Payer la facture',
      `Procéder au paiement de ${invoice.amount}€ HT pour ${invoice.period} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Payer par carte',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Paiement', 'Redirection vers Stripe...');
          },
        },
      ]
    );
  };

  return (
    <View className="bg-white rounded-xl p-4 border border-slate-100">
      <View className="flex-row items-start gap-3">
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          style={{ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
        >
          <CreditCard size={20} color="white" />
        </LinearGradient>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-slate-900">Abonnement PayFlow</Text>
            <Badge label={config.label} variant={config.variant} />
          </View>
          <Text className="text-sm text-slate-500">{invoice.period} • {invoice.plan}</Text>
          <Text className="text-xs text-slate-400 mt-0.5">#{invoice.invoiceNumber}</Text>
        </View>
        <Text className="text-lg font-bold text-slate-900">{invoice.amount}€</Text>
      </View>
      <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-100">
        <Pressable
          onPress={handleView}
          className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-50 active:bg-slate-100"
        >
          <Eye size={16} color="#64748b" />
          <Text className="text-sm font-medium text-slate-600">Voir</Text>
        </Pressable>
        <Pressable
          onPress={handleDownloadPDF}
          className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-50 active:bg-slate-100"
        >
          <Download size={16} color="#64748b" />
          <Text className="text-sm font-medium text-slate-600">PDF</Text>
        </Pressable>
        {invoice.status === 'sent' && (
          <Pressable
            onPress={handlePay}
            className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-500 active:bg-indigo-600"
          >
            <Euro size={16} color="white" />
            <Text className="text-sm font-medium text-white">Payer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function PlanCard({
  planId,
  isCurrentPlan,
  onSelect,
}: {
  planId: PlanType;
  isCurrentPlan: boolean;
  onSelect: () => void;
}) {
  const plan = PLANS[planId];
  const isPopular = 'popular' in plan && plan.popular;

  return (
    <Pressable
      onPress={onSelect}
      disabled={isCurrentPlan}
      className={`relative rounded-2xl border-2 overflow-hidden ${
        isCurrentPlan
          ? 'border-emerald-500 bg-emerald-50'
          : isPopular
            ? 'border-indigo-500 bg-white'
            : 'border-slate-200 bg-white'
      }`}
    >
      {isPopular && !isCurrentPlan && (
        <View className="absolute top-0 right-0 bg-indigo-500 px-3 py-1 rounded-bl-xl">
          <Text className="text-white text-xs font-bold">POPULAIRE</Text>
        </View>
      )}
      {isCurrentPlan && (
        <View className="absolute top-0 right-0 bg-emerald-500 px-3 py-1 rounded-bl-xl">
          <Text className="text-white text-xs font-bold">ACTUEL</Text>
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
            {planId === 'trial' && <Zap size={24} color={plan.color} />}
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

        <View className="gap-2 mb-4">
          {plan.features.slice(1, 4).map((feature, i) => (
            <View key={i} className="flex-row items-center gap-2">
              <Check size={16} color="#10b981" />
              <Text className="text-slate-600 text-sm">{feature}</Text>
            </View>
          ))}
        </View>

        {!isCurrentPlan && (
          <View
            className="py-3 rounded-xl flex-row items-center justify-center gap-2"
            style={{ backgroundColor: isPopular ? '#6366f1' : '#f1f5f9' }}
          >
            <Text className={`font-semibold ${isPopular ? 'text-white' : 'text-slate-700'}`}>
              {planId === 'enterprise' ? 'Nous contacter' : 'Choisir ce plan'}
            </Text>
            <ArrowRight size={18} color={isPopular ? 'white' : '#64748b'} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function SubscriptionScreen() {
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const appMode = useAppMode();
  const userType = useUserType();
  const storedPayFlowInvoices = usePayFlowInvoices();

  const subscription = useSubscriptionStore((s) => s.getSubscription(DEMO_COMPANY_ID));
  const upgradePlan = useSubscriptionStore((s) => s.upgradePlan);
  const getDaysRemaining = useSubscriptionStore((s) => s.getDaysRemaining);
  const planLimits = usePlanLimits(DEMO_COMPANY_ID);

  // Charger les offres RevenueCat
  useEffect(() => {
    loadOfferings();
    checkPremiumStatus();
  }, []);

  const loadOfferings = async () => {
    setIsLoading(true);
    const result = await getOfferings();
    if (result.ok && result.data.current) {
      setPackages(result.data.current.availablePackages);
    }
    setIsLoading(false);
  };

  const checkPremiumStatus = async () => {
    const result = await hasEntitlement('premium');
    if (result.ok) {
      setIsPremium(result.data);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPurchasing(true);

    const result = await purchasePackage(pkg);

    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsPremium(true);

      // Mettre à jour le plan local
      const planId = pkg.identifier === '$rc_monthly' ? 'starter' : 'professional';
      upgradePlan(DEMO_COMPANY_ID, planId);

      Alert.alert(
        'Achat réussi !',
        `Vous avez maintenant accès au plan ${PLANS[planId].name}.`,
        [{ text: 'OK' }]
      );
    } else if (result.reason === 'web_not_supported') {
      Alert.alert(
        'Non disponible sur le web',
        'Les achats in-app ne sont disponibles que sur l\'application mobile iOS ou Android.',
        [{ text: 'OK' }]
      );
    } else if (result.reason !== 'sdk_error') {
      // L'utilisateur a annulé, ne rien faire
    }

    setIsPurchasing(false);
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRestoring(true);

    const result = await restorePurchases();

    if (result.ok) {
      const hasPremium = Object.keys(result.data.entitlements.active).length > 0;
      setIsPremium(hasPremium);

      if (hasPremium) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Achats restaurés', 'Vos achats ont été restaurés avec succès.');
      } else {
        Alert.alert('Aucun achat trouvé', 'Aucun achat précédent n\'a été trouvé pour ce compte.');
      }
    } else if (result.reason === 'web_not_supported') {
      Alert.alert(
        'Non disponible sur le web',
        'La restauration des achats n\'est disponible que sur l\'application mobile.',
        [{ text: 'OK' }]
      );
    }

    setIsRestoring(false);
  };

  // Use stored data in real mode, demo data in demo mode
  const invoices = appMode === 'real' ? storedPayFlowInvoices : DEMO_PAYFLOW_INVOICES;
  const pendingInvoice = invoices.find(i => i.status === 'sent');

  const currentPlan = subscription?.plan || 'professional';
  const currentPlanConfig = PLANS[currentPlan];
  const daysRemaining = getDaysRemaining(DEMO_COMPANY_ID);

  const handleSelectPlan = (planId: PlanType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (planId === 'enterprise') {
      Alert.alert(
        'Plan Enterprise',
        'Pour le plan Enterprise, contactez notre équipe commerciale à contact@payflowcloud.app',
        [{ text: 'OK' }]
      );
      return;
    }

    // Trouver le package correspondant
    const packageId = planId === 'starter' ? '$rc_monthly' : '$rc_custom_professional';
    const pkg = packages.find(p => p.identifier === packageId);

    if (pkg) {
      handlePurchase(pkg);
    } else if (!isRevenueCatEnabled()) {
      // Mode démo ou RevenueCat non configuré
      Alert.alert(
        `Passer au plan ${PLANS[planId].name}`,
        `Votre abonnement sera de ${PLANS[planId].price}€/mois HT.\n\nVous aurez accès à ${PLANS[planId].employeeLimit} employés.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Confirmer',
            onPress: () => {
              upgradePlan(DEMO_COMPANY_ID, planId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Succès', `Vous êtes maintenant sur le plan ${PLANS[planId].name} !`);
            },
          },
        ]
      );
    } else {
      Alert.alert('Erreur', 'Produit non disponible. Veuillez réessayer.');
    }
  };

  const handlePayNow = () => {
    if (!pendingInvoice) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Payer la facture',
      `Procéder au paiement de ${pendingInvoice.amount}€ HT ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Payer par carte',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Paiement', 'Redirection vers Stripe...');
          },
        },
      ]
    );
  };

  // Vue Admin - Gestion des abonnements des Sociétés A
  const isAdmin = userType === 'admin_app';

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-4 px-5 py-4 border-b border-slate-100 bg-white">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
        >
          <ArrowLeft size={20} color="#64748b" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900">
            {isAdmin ? 'Gestion des abonnements' : 'Mon abonnement'}
          </Text>
          <Text className="text-sm text-slate-500">
            {isAdmin ? 'Factures PayFlow aux Sociétés A' : 'Gérez votre plan PayFlow'}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-6">
          {/* Current Plan Card */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <LinearGradient
              colors={[currentPlanConfig.color, `${currentPlanConfig.color}dd`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, padding: 20, marginBottom: 24 }}
            >
              <View className="flex-row items-center gap-3 mb-4">
                <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center">
                  {currentPlan === 'trial' && <Zap size={28} color="white" />}
                  {currentPlan === 'starter' && <Zap size={28} color="white" />}
                  {currentPlan === 'professional' && <Sparkles size={28} color="white" />}
                  {currentPlan === 'enterprise' && <Crown size={28} color="white" />}
                </View>
                <View className="flex-1">
                  <Text className="text-white/80 text-sm">Plan actuel</Text>
                  <Text className="text-white text-2xl font-bold">{currentPlanConfig.name}</Text>
                </View>
                <View className="bg-white/20 px-4 py-2 rounded-xl">
                  <Text className="text-white font-bold text-lg">{currentPlanConfig.priceLabel}</Text>
                </View>
              </View>

              {/* Usage Stats */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-white/10 rounded-xl p-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Users size={16} color="white" />
                    <Text className="text-white/80 text-xs">Employés</Text>
                  </View>
                  <Text className="text-white text-xl font-bold">
                    {planLimits?.employeeCount || 0}/{currentPlanConfig.employeeLimit === Infinity ? '∞' : currentPlanConfig.employeeLimit}
                  </Text>
                  {currentPlanConfig.employeeLimit !== Infinity && (
                    <View className="h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                      <View
                        className="h-full bg-white rounded-full"
                        style={{ width: `${planLimits?.percentUsed || 0}%` }}
                      />
                    </View>
                  )}
                </View>

                <View className="flex-1 bg-white/10 rounded-xl p-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Calendar size={16} color="white" />
                    <Text className="text-white/80 text-xs">
                      {subscription?.status === 'trial' ? 'Essai restant' : 'Prochain paiement'}
                    </Text>
                  </View>
                  <Text className="text-white text-xl font-bold">
                    {daysRemaining !== null ? `${daysRemaining} jours` : '-'}
                  </Text>
                </View>
              </View>

              {/* Trial Warning */}
              {subscription?.status === 'trial' && daysRemaining !== null && daysRemaining <= 7 && (
                <View className="bg-white/20 rounded-xl p-3 flex-row items-center gap-2">
                  <AlertTriangle size={18} color="white" />
                  <Text className="text-white text-sm flex-1">
                    Votre essai se termine dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}. Passez à un plan payant pour continuer.
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Upgrade Section */}
          {!isAdmin && (
            <>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-slate-900">
                  {showAllPlans ? 'Tous les plans' : 'Passer au niveau supérieur'}
                </Text>
                <Pressable onPress={() => setShowAllPlans(!showAllPlans)}>
                  <Text className="text-indigo-600 font-medium">
                    {showAllPlans ? 'Voir moins' : 'Voir tous'}
                  </Text>
                </Pressable>
              </View>

              <View className="gap-4 mb-6">
                {(showAllPlans
                  ? (['starter', 'professional', 'enterprise'] as PlanType[])
                  : (['starter', 'professional', 'enterprise'] as PlanType[]).filter(
                      (p) => PLANS[p].employeeLimit > currentPlanConfig.employeeLimit
                    ).slice(0, 2)
                ).map((planId, index) => (
                  <Animated.View key={planId} entering={FadeInDown.delay(200 + index * 100).springify()}>
                    <PlanCard
                      planId={planId}
                      isCurrentPlan={currentPlan === planId}
                      onSelect={() => handleSelectPlan(planId)}
                    />
                  </Animated.View>
                ))}
              </View>
            </>
          )}

          {/* Pending Invoice Alert */}
          {pendingInvoice && (
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <View className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200">
                <View className="flex-row items-center gap-2 mb-2">
                  <AlertTriangle size={18} color="#f59e0b" />
                  <Text className="font-semibold text-amber-800">Facture en attente</Text>
                </View>
                <Text className="text-sm text-amber-700">
                  Votre facture de {pendingInvoice.amount}€ HT pour {pendingInvoice.period} est en attente de paiement.
                </Text>
                <Pressable
                  onPress={handlePayNow}
                  className="bg-amber-500 rounded-lg py-2.5 mt-3 active:bg-amber-600"
                >
                  <Text className="text-white font-semibold text-center">Payer maintenant</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Invoices History */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-slate-900">Historique des factures</Text>
            <View className="bg-slate-100 px-3 py-1 rounded-full">
              <Text className="text-sm text-slate-600">{invoices.length} factures</Text>
            </View>
          </View>

          {invoices.length > 0 ? (
            <View className="gap-3">
              {invoices.map((invoice, index) => (
                <Animated.View key={invoice.id} entering={FadeInDown.delay(400 + index * 50).springify()}>
                  <PayFlowInvoiceCard invoice={invoice} />
                </Animated.View>
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-8 border border-slate-100 items-center">
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
              >
                <CreditCard size={32} color="white" />
              </LinearGradient>
              <Text className="text-lg font-semibold text-slate-900 mb-2 text-center">Aucune facture</Text>
              <Text className="text-sm text-slate-500 text-center">
                Vos factures d'abonnement PayFlow apparaîtront ici.
              </Text>
            </View>
          )}

          {/* Contact info */}
          <View className="mt-6 bg-slate-100 rounded-xl p-4">
            <Text className="text-slate-600 text-sm text-center">
              Des questions sur votre abonnement ?{'\n'}
              Contactez-nous à{' '}
              <Text className="text-indigo-600 font-medium">contact@payflowcloud.app</Text>
            </Text>
          </View>

          {/* Restore Purchases */}
          {isRevenueCatEnabled() && (
            <Pressable
              onPress={handleRestore}
              disabled={isRestoring}
              className="mt-4 py-3 flex-row items-center justify-center gap-2 active:opacity-70"
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <RefreshCw size={16} color="#6366f1" />
              )}
              <Text className="text-indigo-600 font-medium">
                {isRestoring ? 'Restauration...' : 'Restaurer mes achats'}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Loading overlay */}
      {isPurchasing && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-2xl p-6 items-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="text-slate-900 font-medium mt-3">Traitement en cours...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
