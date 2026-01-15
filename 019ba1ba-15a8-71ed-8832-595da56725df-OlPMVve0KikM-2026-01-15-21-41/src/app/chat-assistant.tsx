import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  X,
  Send,
  Bot,
  User,
  FileText,
  Receipt,
  HelpCircle,
  Sparkles,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useUserType } from '@/lib/state/app-store';
import {
  mutableDemoData,
  DEMO_IDS,
  getDemoStats,
  DEMO_EMPLOYEES,
  DEMO_COMPANIES,
  DEMO_PAYSLIPS,
  DEMO_INVOICES,
  DEMO_PAYFLOW_INVOICES,
  DEMO_SOCIETES_A_FOR_ADMIN,
} from '@/lib/data/demo-data';
import type { UserType } from '@/lib/database.types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  documentLink?: {
    type: 'payslip' | 'invoice' | 'subscription';
    id: string;
    label: string;
  };
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  question: string;
}

// Fonction pour générer une réponse intelligente basée sur les données de l'app
function generateAIResponse(
  question: string,
  userType: UserType
): { content: string; documentLink?: Message['documentLink'] } {
  const q = question.toLowerCase();
  const stats = getDemoStats();
  const currentMonth = new Date().toLocaleString('fr-FR', { month: 'long' });
  const currentYear = new Date().getFullYear();

  // ============ ADMIN APP ============
  if (userType === 'admin_app') {
    // Sociétés A
    if (q.includes('société') || q.includes('societe') || q.includes('prestataire')) {
      if (q.includes('combien') || q.includes('nombre') || q.includes('total')) {
        return {
          content: `Vous avez actuellement ${stats.adminApp.totalSocietesA} Sociétés A inscrites sur la plateforme :\n\n• ${stats.adminApp.activeSocietesA} actives\n• ${stats.adminApp.trialSocietesA} en période d'essai\n\nLe revenu mensuel total des abonnements est de ${stats.adminApp.totalRevenue}€.`,
        };
      }
      if (q.includes('liste') || q.includes('voir') || q.includes('afficher')) {
        const list = DEMO_SOCIETES_A_FOR_ADMIN.map(
          (s) => `• ${s.name} - ${s.plan} (${s.status === 'active' ? 'Actif' : s.status === 'trial' ? 'Essai' : s.status})`
        ).join('\n');
        return {
          content: `Voici la liste des Sociétés A :\n\n${list}\n\nVous pouvez consulter les détails dans l'onglet "Sociétés A".`,
        };
      }
    }

    // Abonnements / Facturation
    if (q.includes('abonnement') || q.includes('facturation') || q.includes('revenu')) {
      return {
        content: `Récapitulatif des abonnements :\n\n• Revenu mensuel : ${stats.adminApp.totalRevenue}€\n• Sociétés actives : ${stats.adminApp.activeSocietesA}\n• Essais gratuits : ${stats.adminApp.trialSocietesA}\n\nVous pouvez gérer les abonnements dans l'onglet dédié.`,
      };
    }

    // Invitations
    if (q.includes('invitation')) {
      return {
        content: `Vous avez ${stats.adminApp.pendingInvitations} invitation(s) en attente.\n\nPour inviter une nouvelle Société A, rendez-vous dans Paramètres > "Inviter une Société A".`,
      };
    }
  }

  // ============ SOCIÉTÉ A ============
  if (userType === 'societe_a') {
    // Bulletins de paie
    if (q.includes('bulletin') || q.includes('fiche de paie') || q.includes('paie')) {
      if (q.includes('générer') || q.includes('créer') || q.includes('nouveau')) {
        return {
          content: `Pour générer un nouveau bulletin de paie :\n\n1. Allez dans l'onglet "Bulletins"\n2. Cliquez sur "Nouveau bulletin"\n3. Sélectionnez l'employé et la période\n4. Vérifiez les données et générez\n\nActuellement, ${stats.societeA.validatedVariables} variable(s) sont validées pour ${currentMonth}.`,
        };
      }
      if (q.includes('combien') || q.includes('nombre') || q.includes('total') || q.includes('en attente')) {
        const pending = mutableDemoData.payslips.filter((p) => p.status === 'generated').length;
        const sent = mutableDemoData.payslips.filter((p) => p.status === 'sent').length;
        return {
          content: `État des bulletins ce mois :\n\n• ${pending} bulletin(s) généré(s) à envoyer\n• ${sent} bulletin(s) déjà envoyé(s)\n• ${stats.societeA.validatedVariables} variable(s) validée(s) prête(s)\n• ${stats.societeA.submittedVariables} variable(s) en attente de validation`,
        };
      }
      // Recherche d'un bulletin spécifique
      for (const emp of DEMO_EMPLOYEES) {
        if (q.includes(emp.full_name.toLowerCase())) {
          const payslip = mutableDemoData.payslips.find(
            (p) => p.employee_id === emp.id
          );
          if (payslip) {
            return {
              content: `Bulletin de ${emp.full_name} (${currentMonth} ${currentYear}) :\n\n• Salaire brut : ${payslip.gross_salary.toLocaleString('fr-FR')}€\n• Salaire net : ${payslip.net_salary.toLocaleString('fr-FR')}€\n• Statut : ${payslip.status === 'generated' ? 'Généré' : payslip.status === 'sent' ? 'Envoyé' : 'Consulté'}\n\nCliquez ci-dessous pour voir le bulletin.`,
              documentLink: {
                type: 'payslip',
                id: payslip.id,
                label: `Bulletin ${emp.full_name}`,
              },
            };
          }
        }
      }
    }

    // Factures clients
    if (q.includes('facture') || q.includes('facturation')) {
      if (q.includes('impayé') || q.includes('retard') || q.includes('en attente')) {
        const pending = DEMO_INVOICES.filter(
          (i) => i.status === 'sent' || i.status === 'overdue'
        );
        const total = pending.reduce((sum, i) => sum + i.amount, 0);
        return {
          content: `Factures en attente de paiement :\n\n${pending
            .map(
              (i) =>
                `• ${i.client_company?.name} : ${i.amount.toLocaleString('fr-FR')}€ (${i.status === 'overdue' ? '⚠️ En retard' : 'En attente'})`
            )
            .join('\n')}\n\nTotal : ${total.toLocaleString('fr-FR')}€`,
        };
      }
      if (q.includes('créer') || q.includes('nouvelle') || q.includes('générer')) {
        return {
          content: `Pour créer une nouvelle facture :\n\n1. Allez dans l'onglet "Factures"\n2. Cliquez sur "Nouvelle facture"\n3. Sélectionnez le client et la période\n4. Vérifiez le montant et envoyez\n\nVos clients avec variables validées ce mois :\n• TechCorp Industries\n• DataMinds Consulting`,
        };
      }
      // Recherche facture client spécifique
      for (const company of DEMO_COMPANIES.filter((c) => c.type === 'client')) {
        if (q.includes(company.name.toLowerCase())) {
          const invoice = DEMO_INVOICES.find((i) => i.client_company_id === company.id);
          if (invoice) {
            return {
              content: `Facture ${company.name} :\n\n• N° : ${invoice.invoice_number}\n• Montant : ${invoice.amount.toLocaleString('fr-FR')}€\n• Échéance : ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}\n• Statut : ${invoice.status === 'paid' ? '✅ Payée' : invoice.status === 'overdue' ? '⚠️ En retard' : '⏳ En attente'}\n\nCliquez ci-dessous pour voir la facture.`,
              documentLink: {
                type: 'invoice',
                id: invoice.id,
                label: `Facture ${invoice.invoice_number}`,
              },
            };
          }
        }
      }
    }

    // Clients
    if (q.includes('client')) {
      if (q.includes('combien') || q.includes('nombre') || q.includes('liste')) {
        return {
          content: `Vous avez ${stats.societeA.totalClients} clients actifs :\n\n${DEMO_COMPANIES.filter(
            (c) => c.type === 'client'
          )
            .map((c) => `• ${c.name} (${c.city})`)
            .join('\n')}\n\nGérez vos clients dans Paramètres > "Gestion des clients".`,
        };
      }
    }

    // Employés
    if (q.includes('employé') || q.includes('salarié')) {
      if (q.includes('combien') || q.includes('nombre') || q.includes('total')) {
        return {
          content: `Vous gérez ${stats.societeA.totalEmployees} employés :\n\n${DEMO_EMPLOYEES.map(
            (e) => `• ${e.full_name} - ${e.position} (${e.client_company?.name})`
          ).join('\n')}\n\nConsultez les détails dans l'onglet "Employés".`,
        };
      }
    }

    // Abonnement PayFlow
    if (q.includes('abonnement') || q.includes('payflow')) {
      const invoice = DEMO_PAYFLOW_INVOICES[0];
      return {
        content: `Votre abonnement PayFlow :\n\n• Plan : ${invoice.plan}\n• Montant mensuel : ${invoice.amount}€\n• Prochaine échéance : 5 ${currentMonth}\n\nDernière facture : ${invoice.invoiceNumber} (${invoice.status === 'paid' ? '✅ Payée' : '⏳ En attente'})`,
        documentLink: {
          type: 'subscription',
          id: invoice.id,
          label: `Facture ${invoice.invoiceNumber}`,
        },
      };
    }
  }

  // ============ SOCIÉTÉ B ============
  if (userType === 'societe_b') {
    // Variables mensuelles
    if (q.includes('variable') || q.includes('heure') || q.includes('saisie')) {
      return {
        content: `État des variables mensuelles pour ${currentMonth} :\n\n• ${stats.societeB.validatedVariables} validée(s)\n• Employés : ${stats.societeB.employeesCount}\n\nPour saisir les variables, allez dans le tableau de bord et cliquez sur "Saisir les variables".`,
      };
    }

    // Factures
    if (q.includes('facture')) {
      const invoice = stats.societeB.pendingInvoice;
      if (invoice) {
        return {
          content: `Vous avez une facture en attente :\n\n• N° : ${invoice.invoice_number}\n• Montant : ${invoice.amount.toLocaleString('fr-FR')}€\n• Échéance : ${new Date(invoice.due_date).toLocaleDateString('fr-FR')}\n\nCliquez ci-dessous pour voir et payer.`,
          documentLink: {
            type: 'invoice',
            id: invoice.id,
            label: `Facture ${invoice.invoice_number}`,
          },
        };
      }
      return {
        content: `Vous n'avez pas de facture en attente actuellement. Consultez l'historique dans l'onglet "Factures".`,
      };
    }

    // Employés
    if (q.includes('employé') || q.includes('équipe') || q.includes('collaborateur')) {
      const employees = DEMO_EMPLOYEES.filter(
        (e) => e.client_company_id === DEMO_IDS.SOCIETE_B_TECHCORP
      );
      return {
        content: `Votre équipe (${employees.length} collaborateurs) :\n\n${employees
          .map((e) => `• ${e.full_name} - ${e.position}`)
          .join('\n')}\n\nGérez votre équipe dans Paramètres > "Équipe".`,
      };
    }
  }

  // ============ EMPLOYÉ ============
  if (userType === 'employe') {
    // Bulletins
    if (q.includes('bulletin') || q.includes('fiche de paie') || q.includes('paie') || q.includes('salaire')) {
      if (q.includes('dernier') || q.includes('récent') || q.includes('ce mois')) {
        const payslip = stats.employe.currentPayslip || stats.employe.lastPayslip;
        if (payslip) {
          const monthName = new Date(
            payslip.year,
            parseInt(payslip.month) - 1
          ).toLocaleString('fr-FR', { month: 'long' });
          return {
            content: `Votre bulletin de ${monthName} ${payslip.year} :\n\n• Salaire brut : ${payslip.gross_salary.toLocaleString('fr-FR')}€\n• Salaire net : ${payslip.net_salary.toLocaleString('fr-FR')}€\n• Statut : ${payslip.status === 'sent' ? 'Reçu' : payslip.status === 'viewed' ? 'Consulté' : 'Disponible'}\n\nCliquez ci-dessous pour consulter.`,
            documentLink: {
              type: 'payslip',
              id: payslip.id,
              label: `Bulletin ${monthName} ${payslip.year}`,
            },
          };
        }
      }
      if (q.includes('tous') || q.includes('historique') || q.includes('archive')) {
        return {
          content: `Vous avez ${stats.employe.totalPayslips} bulletin(s) disponibles.\n\nConsultez l'historique complet dans l'onglet "Bulletins".`,
        };
      }
      // Par défaut, montrer le dernier
      const payslip = stats.employe.currentPayslip || stats.employe.lastPayslip;
      if (payslip) {
        const monthName = new Date(
          payslip.year,
          parseInt(payslip.month) - 1
        ).toLocaleString('fr-FR', { month: 'long' });
        return {
          content: `Votre dernier bulletin (${monthName} ${payslip.year}) :\n\n• Net à payer : ${payslip.net_salary.toLocaleString('fr-FR')}€\n\nVoulez-vous le télécharger ?`,
          documentLink: {
            type: 'payslip',
            id: payslip.id,
            label: `Bulletin ${monthName}`,
          },
        };
      }
    }

    // Contrat
    if (q.includes('contrat')) {
      const employee = DEMO_EMPLOYEES.find((e) => e.id === DEMO_IDS.EMP_MARIE_DUPONT);
      if (employee) {
        return {
          content: `Informations de votre contrat :\n\n• Type : ${employee.contract_type}\n• Poste : ${employee.position}\n• Date d'embauche : ${new Date(employee.hire_date).toLocaleDateString('fr-FR')}\n• Entreprise cliente : ${employee.client_company?.name}\n\nConsultez les détails dans Paramètres > "Mon contrat".`,
        };
      }
    }
  }

  // ============ RÉPONSES GÉNÉRIQUES ============

  // Aide / Guide
  if (q.includes('aide') || q.includes('help') || q.includes('comment') || q.includes('guide')) {
    const guides: Record<UserType, string> = {
      admin_app: `En tant qu'administrateur, vous pouvez :\n\n• Gérer les Sociétés A\n• Suivre les abonnements\n• Envoyer des invitations\n\nConsultez le guide complet dans Paramètres > "Aide".`,
      societe_a: `En tant que prestataire de paie, vous pouvez :\n\n• Générer des bulletins de paie\n• Créer des factures clients\n• Gérer vos employés et clients\n\nConsultez le guide dans Paramètres > "Aide".`,
      societe_b: `En tant qu'employeur client, vous pouvez :\n\n• Saisir les variables mensuelles\n• Consulter vos factures\n• Gérer votre équipe\n\nConsultez le guide dans Paramètres > "Aide".`,
      employe: `En tant qu'employé, vous pouvez :\n\n• Consulter vos bulletins de paie\n• Télécharger vos documents\n• Mettre à jour vos informations\n\nConsultez le guide dans Paramètres > "Aide".`,
    };
    return { content: guides[userType] };
  }

  // FAQ
  if (q.includes('faq') || q.includes('question fréquent')) {
    return {
      content: `Consultez notre FAQ complète dans Paramètres > "Aide" > "FAQ".\n\nQuestions populaires :\n• Comment générer un bulletin ?\n• Comment ajouter un employé ?\n• Comment payer une facture ?`,
    };
  }

  // Contact / Support
  if (q.includes('contact') || q.includes('support') || q.includes('problème')) {
    return {
      content: `Pour contacter le support :\n\n📧 support@payflow.fr\n📞 01 23 45 67 89\n\nHoraires : Lun-Ven 9h-18h\n\nVous pouvez aussi consulter la FAQ dans les paramètres.`,
    };
  }

  // Salutations
  if (q.includes('bonjour') || q.includes('salut') || q.includes('hello') || q.includes('coucou')) {
    const greetings: Record<UserType, string> = {
      admin_app: `Bonjour ! Je suis votre assistant PayFlow.\n\nEn tant qu'administrateur, je peux vous aider avec :\n• Les Sociétés A et abonnements\n• Les invitations\n• Les statistiques\n\nQue puis-je faire pour vous ?`,
      societe_a: `Bonjour ! Je suis votre assistant PayFlow.\n\nJe peux vous aider avec :\n• Les bulletins de paie\n• Les factures clients\n• La gestion des employés\n\nQue souhaitez-vous faire ?`,
      societe_b: `Bonjour ! Je suis votre assistant PayFlow.\n\nJe peux vous aider avec :\n• La saisie des variables\n• Vos factures\n• La gestion d'équipe\n\nComment puis-je vous aider ?`,
      employe: `Bonjour ! Je suis votre assistant PayFlow.\n\nJe peux vous aider à :\n• Consulter vos bulletins\n• Télécharger vos documents\n• Trouver des informations\n\nQue cherchez-vous ?`,
    };
    return { content: greetings[userType] };
  }

  // Réponse par défaut
  const defaults: Record<UserType, string> = {
    admin_app: `Je n'ai pas compris votre demande. Voici ce que je peux faire :\n\n• Informations sur les Sociétés A\n• État des abonnements\n• Suivi des invitations\n\nEssayez par exemple : "Combien de sociétés actives ?"`,
    societe_a: `Je n'ai pas compris votre demande. Voici ce que je peux faire :\n\n• Rechercher des bulletins\n• État des factures\n• Informations employés/clients\n\nEssayez par exemple : "Factures en attente"`,
    societe_b: `Je n'ai pas compris votre demande. Voici ce que je peux faire :\n\n• État des variables mensuelles\n• Consulter vos factures\n• Informations équipe\n\nEssayez par exemple : "Ma facture en cours"`,
    employe: `Je n'ai pas compris votre demande. Voici ce que je peux faire :\n\n• Trouver vos bulletins\n• Informations contrat\n• Aide et support\n\nEssayez par exemple : "Mon dernier bulletin"`,
  };
  return { content: defaults[userType] };
}

function MessageBubble({
  message,
  onDocumentPress,
}: {
  message: Message;
  onDocumentPress?: (link: Message['documentLink']) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center mr-2">
          <Bot size={18} color="#6366f1" />
        </View>
      )}
      <View
        className={`max-w-[80%] ${
          isUser
            ? 'bg-indigo-500 rounded-2xl rounded-br-md'
            : 'bg-white border border-slate-100 rounded-2xl rounded-bl-md'
        } px-4 py-3`}
      >
        <Text
          className={`${isUser ? 'text-white' : 'text-slate-800'} leading-5`}
        >
          {message.content}
        </Text>
        {message.documentLink && (
          <Pressable
            onPress={() => onDocumentPress?.(message.documentLink)}
            className="mt-3 flex-row items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2 active:bg-indigo-100"
          >
            {message.documentLink.type === 'payslip' ? (
              <FileText size={16} color="#6366f1" />
            ) : (
              <Receipt size={16} color="#6366f1" />
            )}
            <Text className="text-indigo-600 font-medium text-sm flex-1">
              {message.documentLink.label}
            </Text>
          </Pressable>
        )}
        <Text
          className={`text-xs mt-1 ${
            isUser ? 'text-indigo-200' : 'text-slate-400'
          }`}
        >
          {message.timestamp.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      {isUser && (
        <View className="w-8 h-8 rounded-full bg-slate-200 items-center justify-center ml-2">
          <User size={18} color="#64748b" />
        </View>
      )}
    </Animated.View>
  );
}

export default function ChatAssistantScreen() {
  const userType = useUserType();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputScale = useSharedValue(1);

  // Actions rapides selon le type d'utilisateur
  const quickActions: Record<UserType, QuickAction[]> = {
    admin_app: [
      {
        icon: <HelpCircle size={18} color="#6366f1" />,
        label: 'Sociétés A',
        question: 'Combien de sociétés A sont actives ?',
      },
      {
        icon: <Receipt size={18} color="#6366f1" />,
        label: 'Revenus',
        question: 'Quel est le revenu mensuel des abonnements ?',
      },
    ],
    societe_a: [
      {
        icon: <FileText size={18} color="#6366f1" />,
        label: 'Bulletins',
        question: 'Quels bulletins sont en attente ?',
      },
      {
        icon: <Receipt size={18} color="#6366f1" />,
        label: 'Factures',
        question: 'Quelles factures sont impayées ?',
      },
    ],
    societe_b: [
      {
        icon: <FileText size={18} color="#6366f1" />,
        label: 'Variables',
        question: 'Quel est l\'état des variables mensuelles ?',
      },
      {
        icon: <Receipt size={18} color="#6366f1" />,
        label: 'Ma facture',
        question: 'Ai-je une facture en attente ?',
      },
    ],
    employe: [
      {
        icon: <FileText size={18} color="#6366f1" />,
        label: 'Mon bulletin',
        question: 'Où est mon dernier bulletin de paie ?',
      },
      {
        icon: <HelpCircle size={18} color="#6366f1" />,
        label: 'Mon contrat',
        question: 'Quelles sont les informations de mon contrat ?',
      },
    ],
  };

  // Message de bienvenue
  useEffect(() => {
    const welcomeMessages: Record<UserType, string> = {
      admin_app:
        'Bonjour ! Je suis votre assistant PayFlow. Je peux vous aider à gérer les Sociétés A, suivre les abonnements et bien plus. Comment puis-je vous aider ?',
      societe_a:
        'Bonjour ! Je suis votre assistant PayFlow. Je peux vous aider avec vos bulletins de paie, factures et la gestion de vos clients. Que souhaitez-vous faire ?',
      societe_b:
        'Bonjour ! Je suis votre assistant PayFlow. Je peux vous aider avec la saisie des variables, vos factures et la gestion de votre équipe. Comment puis-je vous aider ?',
      employe:
        'Bonjour ! Je suis votre assistant PayFlow. Je peux vous aider à retrouver vos bulletins de paie, documents et informations contractuelles. Que cherchez-vous ?',
    };

    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: welcomeMessages[userType],
        timestamp: new Date(),
      },
    ]);
  }, [userType]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simuler un délai de réflexion
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

    const response = generateAIResponse(input.trim(), userType);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      documentLink: response.documentLink,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleQuickAction = (action: QuickAction) => {
    setInput(action.question);
    setTimeout(() => handleSend(), 100);
  };

  const handleDocumentPress = (link: Message['documentLink']) => {
    if (!link) return;
    if (link.type === 'payslip') {
      router.push(`/payslip-viewer?id=${link.id}`);
    } else if (link.type === 'invoice') {
      router.push(`/invoice-viewer?id=${link.id}`);
    } else if (link.type === 'subscription') {
      router.push('/subscription');
    }
  };

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(inputScale.value) }],
  }));

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100 bg-white">
        <View className="flex-row items-center gap-3">
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} color="white" />
          </LinearGradient>
          <View>
            <Text className="text-lg font-bold text-slate-900">Assistant PayFlow</Text>
            <Text className="text-xs text-emerald-600">En ligne</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
        >
          <X size={20} color="#64748b" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onDocumentPress={handleDocumentPress}
            />
          ))}

          {isTyping && (
            <Animated.View
              entering={FadeInUp.duration(200)}
              className="flex-row items-center gap-2 mb-3"
            >
              <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center">
                <Bot size={18} color="#6366f1" />
              </View>
              <View className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            </Animated.View>
          )}

          {/* Quick Actions - visible seulement si peu de messages */}
          {messages.length <= 2 && !isTyping && (
            <View className="mt-4 mb-6">
              <Text className="text-sm text-slate-500 mb-3">
                Suggestions :
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {quickActions[userType].map((action, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleQuickAction(action)}
                    className="flex-row items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 active:bg-slate-50"
                  >
                    {action.icon}
                    <Text className="text-slate-700 font-medium">
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View className="h-4" />
        </ScrollView>

        {/* Input */}
        <View className="px-4 py-3 bg-white border-t border-slate-100">
          <Animated.View
            style={inputAnimatedStyle}
            className="flex-row items-end gap-2"
          >
            <View className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 min-h-[48px] max-h-[120px]">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Posez votre question..."
                placeholderTextColor="#94a3b8"
                multiline
                className="text-slate-900 text-base leading-5"
                onFocus={() => (inputScale.value = 1.02)}
                onBlur={() => (inputScale.value = 1)}
              />
            </View>
            <Pressable
              onPress={handleSend}
              disabled={!input.trim()}
              className="active:scale-95"
            >
              <LinearGradient
                colors={input.trim() ? ['#6366f1', '#8b5cf6'] : ['#cbd5e1', '#cbd5e1']}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={20} color="white" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
