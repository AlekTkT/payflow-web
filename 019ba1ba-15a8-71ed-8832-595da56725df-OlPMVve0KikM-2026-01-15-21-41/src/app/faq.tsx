import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CreditCard,
  FileText,
  Users,
  Building2,
  Smartphone,
  Mail,
  Shield,
  Calculator,
  Receipt,
} from 'lucide-react-native';
import { useUserType } from '@/lib/state/app-store';

type FAQItem = {
  question: string;
  answer: string;
};

type FAQCategory = {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string[];
  items: FAQItem[];
};

// ============ FAQ ADMIN APP ============
const ADMIN_FAQ: FAQCategory[] = [
  {
    id: 'plateforme',
    title: 'Gestion de la plateforme',
    icon: <Shield size={24} color="white" />,
    color: ['#8b5cf6', '#7c3aed'],
    items: [
      {
        question: 'Quel est mon rôle en tant qu\'Admin App ?',
        answer: 'Vous êtes l\'administrateur de la plateforme PayFlow. Vous gérez les prestataires de paie (Sociétés A) qui utilisent notre solution, leurs abonnements et les accès à la plateforme.',
      },
      {
        question: 'Comment accéder aux statistiques globales ?',
        answer: 'Sur l\'onglet Accueil, vous avez accès au tableau de bord avec le nombre de prestataires actifs, les revenus mensuels de la plateforme et les invitations en attente.',
      },
      {
        question: 'Puis-je voir les données des clients finaux ?',
        answer: 'Non, pour des raisons de confidentialité, vous n\'avez pas accès aux données des entreprises clientes ni aux bulletins de paie des employés. Vous gérez uniquement les prestataires.',
      },
    ],
  },
  {
    id: 'prestataires',
    title: 'Gestion des prestataires',
    icon: <Building2 size={24} color="white" />,
    color: ['#6366f1', '#8b5cf6'],
    items: [
      {
        question: 'Comment inviter un nouveau prestataire ?',
        answer: 'Allez dans Paramètres > Inviter une Société A. Entrez l\'email du responsable du cabinet de paie et envoyez l\'invitation. Il recevra un email avec un lien pour créer son compte.',
      },
      {
        question: 'Comment voir la liste des prestataires ?',
        answer: 'Sur l\'onglet Accueil, vous voyez la liste de tous les prestataires inscrits avec leur statut (Actif, Essai, Expiré), le nombre de clients et d\'employés qu\'ils gèrent.',
      },
      {
        question: 'Comment suspendre un prestataire ?',
        answer: 'Ouvrez la fiche du prestataire concerné et appuyez sur "Suspendre le compte". Cette action bloque immédiatement l\'accès du prestataire et de tous ses utilisateurs.',
      },
      {
        question: 'Puis-je réactiver un compte suspendu ?',
        answer: 'Oui, ouvrez la fiche du prestataire suspendu et appuyez sur "Réactiver le compte". L\'accès sera rétabli immédiatement.',
      },
    ],
  },
  {
    id: 'abonnements',
    title: 'Abonnements et facturation',
    icon: <CreditCard size={24} color="white" />,
    color: ['#10b981', '#059669'],
    items: [
      {
        question: 'Quels sont les plans d\'abonnement disponibles ?',
        answer: '• Essai gratuit : 14 jours, toutes fonctionnalités, jusqu\'à 5 employés\n• Starter (49€/mois) : jusqu\'à 10 employés\n• Pro (149€/mois) : jusqu\'à 50 employés\n• Business (299€/mois) : employés illimités',
      },
      {
        question: 'Comment changer le plan d\'un prestataire ?',
        answer: 'Ouvrez la fiche du prestataire, puis appuyez sur "Modifier l\'abonnement". Sélectionnez le nouveau plan. Le changement et la facturation au prorata sont automatiques.',
      },
      {
        question: 'Comment gérer un impayé ?',
        answer: 'Les prestataires en retard de paiement sont signalés en rouge dans la liste. Vous pouvez les contacter via l\'application ou suspendre leur compte après 15 jours de retard.',
      },
      {
        question: 'Comment prolonger une période d\'essai ?',
        answer: 'Ouvrez la fiche du prestataire en période d\'essai et appuyez sur "Prolonger l\'essai". Vous pouvez accorder jusqu\'à 14 jours supplémentaires.',
      },
    ],
  },
  {
    id: 'invitations',
    title: 'Invitations',
    icon: <Mail size={24} color="white" />,
    color: ['#f59e0b', '#d97706'],
    items: [
      {
        question: 'Combien de temps une invitation est-elle valide ?',
        answer: 'Une invitation est valide pendant 7 jours. Passé ce délai, elle expire automatiquement et vous devez en envoyer une nouvelle.',
      },
      {
        question: 'Comment renvoyer une invitation expirée ?',
        answer: 'Dans la section Invitations, retrouvez l\'invitation expirée et appuyez sur "Renvoyer". Une nouvelle invitation sera envoyée avec un nouveau délai de 7 jours.',
      },
      {
        question: 'Puis-je annuler une invitation ?',
        answer: 'Oui, dans la section Invitations, appuyez sur l\'invitation en attente puis sur "Annuler". Le lien d\'invitation sera immédiatement désactivé.',
      },
    ],
  },
];

// ============ FAQ SOCIÉTÉ A (PRESTATAIRE) ============
const SOCIETE_A_FAQ: FAQCategory[] = [
  {
    id: 'clients',
    title: 'Gestion des clients',
    icon: <Building2 size={24} color="white" />,
    color: ['#6366f1', '#8b5cf6'],
    items: [
      {
        question: 'Comment ajouter un nouveau client ?',
        answer: 'Allez dans l\'onglet Accueil > Mes clients, puis appuyez sur le bouton "+". Remplissez les informations de l\'entreprise (raison sociale, SIRET, adresse, contact RH) et validez.',
      },
      {
        question: 'Comment inviter un client à saisir ses variables ?',
        answer: 'Allez dans Paramètres > Inviter des utilisateurs. Sélectionnez "Société B (Client)", choisissez l\'entreprise concernée, entrez l\'email du responsable RH et envoyez l\'invitation.',
      },
      {
        question: 'Puis-je avoir plusieurs contacts par client ?',
        answer: 'Oui, vous pouvez inviter plusieurs personnes d\'une même entreprise cliente. Chacune aura son propre accès pour saisir les variables ou consulter les informations.',
      },
      {
        question: 'Comment modifier les informations d\'un client ?',
        answer: 'Ouvrez la fiche du client depuis Mes clients, puis appuyez sur "Modifier". Vous pouvez mettre à jour les informations légales, l\'adresse et les contacts.',
      },
      {
        question: 'Comment supprimer un client ?',
        answer: 'Ouvrez la fiche du client, appuyez sur le menu (...) puis "Supprimer". Attention : tous les employés et données associés seront également supprimés. Cette action est irréversible.',
      },
    ],
  },
  {
    id: 'employees',
    title: 'Gestion des employés',
    icon: <Users size={24} color="white" />,
    color: ['#10b981', '#059669'],
    items: [
      {
        question: 'Comment ajouter un employé ?',
        answer: 'Allez dans l\'onglet Employés et appuyez sur "Ajouter". Renseignez : nom complet, poste, taux horaire, type de contrat (CDI/CDD), date d\'embauche et entreprise cliente de rattachement.',
      },
      {
        question: 'Comment permettre à un employé de consulter ses bulletins ?',
        answer: 'Allez dans Paramètres > Inviter des utilisateurs > Employé. Sélectionnez l\'employé dans la liste et entrez son email. Il recevra une invitation pour créer son compte.',
      },
      {
        question: 'Puis-je modifier le taux horaire d\'un employé ?',
        answer: 'Oui, ouvrez la fiche de l\'employé et modifiez le taux horaire. Le nouveau taux sera appliqué aux prochains bulletins. Les bulletins déjà générés ne sont pas modifiés.',
      },
      {
        question: 'Comment gérer un changement de client pour un employé ?',
        answer: 'Ouvrez la fiche de l\'employé et modifiez l\'entreprise cliente de rattachement. L\'historique des bulletins précédents reste conservé.',
      },
      {
        question: 'Comment gérer le départ d\'un employé ?',
        answer: 'Générez son dernier bulletin de paie avec le solde de tout compte, puis vous pouvez archiver ou supprimer sa fiche depuis le menu de l\'employé.',
      },
    ],
  },
  {
    id: 'variables',
    title: 'Variables mensuelles',
    icon: <Calculator size={24} color="white" />,
    color: ['#8b5cf6', '#7c3aed'],
    items: [
      {
        question: 'Qui peut saisir les variables mensuelles ?',
        answer: 'Soit vous les saisissez directement, soit votre client (Société B) les saisit depuis son espace. Dans ce cas, vous devez les valider avant de générer les bulletins.',
      },
      {
        question: 'Quels sont les différents statuts des variables ?',
        answer: '• Brouillon : saisie en cours, non finalisée\n• Soumis : envoyé par le client, en attente de votre validation\n• Validé : approuvé, prêt pour la génération du bulletin',
      },
      {
        question: 'Comment valider les variables soumises par un client ?',
        answer: 'Sur l\'onglet Accueil, le nombre de variables à valider s\'affiche. Appuyez dessus pour accéder à la liste, vérifiez chaque saisie et appuyez sur "Valider".',
      },
      {
        question: 'Puis-je modifier des variables soumises par un client ?',
        answer: 'Oui, vous pouvez corriger les variables avant de les valider. Une fois validées, vous devez les repasser en brouillon pour les modifier.',
      },
      {
        question: 'Quelle est la date limite de saisie ?',
        answer: 'Vous définissez la date limite pour vos clients. Nous recommandons entre le 20 et le 25 du mois pour avoir le temps de générer les bulletins avant la fin du mois.',
      },
    ],
  },
  {
    id: 'bulletins',
    title: 'Bulletins de paie',
    icon: <FileText size={24} color="white" />,
    color: ['#ec4899', '#db2777'],
    items: [
      {
        question: 'Comment générer un bulletin de paie ?',
        answer: 'Allez dans l\'onglet Bulletins > "Générer". Sélectionnez l\'employé et le mois. Les variables doivent être validées au préalable. Le calcul du brut et du net est automatique.',
      },
      {
        question: 'Comment envoyer un bulletin à un employé ?',
        answer: 'Sur la carte du bulletin, appuyez sur "Envoyer". Le bulletin sera envoyé par email et apparaîtra dans l\'espace PayFlow de l\'employé s\'il a un compte.',
      },
      {
        question: 'Puis-je modifier un bulletin déjà généré ?',
        answer: 'Non, un bulletin généré ne peut pas être modifié. En cas d\'erreur, supprimez le bulletin et générez-en un nouveau avec les variables corrigées.',
      },
      {
        question: 'Dans quel format sont les bulletins ?',
        answer: 'Les bulletins sont générés au format PDF conforme à la législation française. Ils contiennent toutes les mentions légales obligatoires.',
      },
      {
        question: 'Comment envoyer plusieurs bulletins en masse ?',
        answer: 'Dans l\'onglet Bulletins, sélectionnez plusieurs bulletins en cochant les cases, puis appuyez sur "Envoyer la sélection".',
      },
    ],
  },
  {
    id: 'invoices',
    title: 'Facturation clients',
    icon: <Receipt size={24} color="white" />,
    color: ['#f59e0b', '#d97706'],
    items: [
      {
        question: 'Comment créer une facture pour un client ?',
        answer: 'Allez dans l\'onglet Factures > "Créer une facture". Sélectionnez le client, le mois et le montant de vos prestations. Un numéro de facture unique est généré automatiquement.',
      },
      {
        question: 'Comment suivre les paiements de mes clients ?',
        answer: 'Dans l\'onglet Factures, chaque facture affiche son statut : Envoyée, Payée ou En retard. Appuyez sur une facture pour la marquer comme payée.',
      },
      {
        question: 'Puis-je personnaliser mes factures ?',
        answer: 'Oui, dans Paramètres > Paramètres de facturation. Vous pouvez ajouter votre logo, personnaliser les mentions légales, les coordonnées bancaires et le taux de TVA.',
      },
      {
        question: 'Comment relancer un client en retard de paiement ?',
        answer: 'Ouvrez la facture en retard et appuyez sur "Envoyer une relance". Un email de rappel sera envoyé au client avec le montant dû et les pénalités éventuelles.',
      },
    ],
  },
];

// ============ FAQ SOCIÉTÉ B (CLIENT) ============
const SOCIETE_B_FAQ: FAQCategory[] = [
  {
    id: 'variables',
    title: 'Saisie des variables',
    icon: <Calculator size={24} color="white" />,
    color: ['#6366f1', '#8b5cf6'],
    items: [
      {
        question: 'Comment saisir les variables mensuelles ?',
        answer: 'Sur l\'onglet Accueil, appuyez sur "Saisir les variables". Sélectionnez un employé et renseignez : heures travaillées, heures supplémentaires, congés, absences maladie et primes.',
      },
      {
        question: 'Quelle est la date limite de saisie ?',
        answer: 'Votre prestataire de paie définit la date limite, généralement entre le 20 et le 25 du mois. Vous recevez une notification de rappel quelques jours avant.',
      },
      {
        question: 'Puis-je modifier une saisie déjà soumise ?',
        answer: 'Non, une fois soumise, vous ne pouvez plus modifier la saisie directement. Contactez votre prestataire qui pourra la repasser en brouillon pour correction.',
      },
      {
        question: 'Comment saisir des heures supplémentaires ?',
        answer: 'Dans le formulaire de saisie, renseignez le nombre d\'heures supplémentaires dans le champ dédié. La majoration (25% ou 50%) est calculée automatiquement par le prestataire.',
      },
      {
        question: 'Comment déclarer une absence maladie ?',
        answer: 'Renseignez le nombre de jours d\'absence dans le champ "Jours maladie". N\'oubliez pas de transmettre l\'arrêt de travail à votre prestataire de paie.',
      },
      {
        question: 'Comment ajouter une prime exceptionnelle ?',
        answer: 'Dans le champ "Primes" du formulaire de saisie, indiquez le montant brut de la prime. Vous pouvez ajouter un commentaire pour préciser le motif.',
      },
    ],
  },
  {
    id: 'employees',
    title: 'Mes employés',
    icon: <Users size={24} color="white" />,
    color: ['#10b981', '#059669'],
    items: [
      {
        question: 'Comment voir la liste de mes employés ?',
        answer: 'Allez dans l\'onglet Employés. Vous y trouvez tous les salariés dont la paie est gérée par votre prestataire pour votre entreprise.',
      },
      {
        question: 'Comment ajouter un nouvel employé ?',
        answer: 'Contactez votre prestataire de paie. C\'est lui qui crée les fiches employés avec toutes les informations nécessaires (contrat, taux horaire, etc.).',
      },
      {
        question: 'Un employé quitte l\'entreprise, que faire ?',
        answer: 'Informez votre prestataire de paie dès que possible. Il se chargera du dernier bulletin, du solde de tout compte et des documents de fin de contrat.',
      },
      {
        question: 'Puis-je inviter mes employés sur PayFlow ?',
        answer: 'Oui, allez dans Paramètres > Inviter des employés. Entrez leur email et ils recevront un accès pour consulter leurs bulletins de paie.',
      },
    ],
  },
  {
    id: 'invoices',
    title: 'Mes factures',
    icon: <Receipt size={24} color="white" />,
    color: ['#f59e0b', '#d97706'],
    items: [
      {
        question: 'Où consulter mes factures ?',
        answer: 'Allez dans l\'onglet Factures. Vous y trouvez toutes les factures émises par votre prestataire de paie pour ses services de gestion.',
      },
      {
        question: 'Comment télécharger une facture ?',
        answer: 'Appuyez sur la facture souhaitée puis sur "Voir PDF" pour l\'ouvrir. Vous pouvez ensuite la télécharger ou la partager.',
      },
      {
        question: 'Je ne comprends pas le montant d\'une facture',
        answer: 'Le montant correspond aux services de gestion de paie (nombre d\'employés × tarif convenu). Contactez votre prestataire pour des explications détaillées.',
      },
      {
        question: 'Comment signaler un paiement effectué ?',
        answer: 'Votre prestataire met à jour le statut de la facture lorsqu\'il reçoit votre paiement. Si le statut n\'est pas mis à jour, contactez-le.',
      },
    ],
  },
  {
    id: 'compte',
    title: 'Mon compte',
    icon: <Building2 size={24} color="white" />,
    color: ['#8b5cf6', '#7c3aed'],
    items: [
      {
        question: 'Comment modifier les informations de mon entreprise ?',
        answer: 'Allez dans Paramètres > Mon entreprise. Vous pouvez mettre à jour l\'adresse et les contacts. Pour modifier le SIRET ou la raison sociale, contactez votre prestataire.',
      },
      {
        question: 'Comment ajouter un autre utilisateur de mon entreprise ?',
        answer: 'Contactez votre prestataire de paie pour qu\'il envoie une invitation à votre collègue. Chaque utilisateur aura son propre accès.',
      },
      {
        question: 'Comment contacter mon prestataire de paie ?',
        answer: 'Dans Paramètres > Aide, vous trouverez les coordonnées de votre prestataire. Vous pouvez également lui envoyer un message via l\'application.',
      },
    ],
  },
];

// ============ FAQ EMPLOYÉ ============
const EMPLOYE_FAQ: FAQCategory[] = [
  {
    id: 'bulletins',
    title: 'Mes bulletins de paie',
    icon: <FileText size={24} color="white" />,
    color: ['#6366f1', '#8b5cf6'],
    items: [
      {
        question: 'Où consulter mes bulletins de paie ?',
        answer: 'Allez dans l\'onglet Bulletins. Tous vos bulletins y sont classés du plus récent au plus ancien. Appuyez sur un bulletin pour le consulter.',
      },
      {
        question: 'Comment télécharger un bulletin ?',
        answer: 'Appuyez sur le bulletin souhaité puis sur "Voir PDF". Le bulletin s\'ouvrira et vous pourrez le télécharger sur votre téléphone ou le partager.',
      },
      {
        question: 'Je n\'ai pas reçu mon bulletin ce mois-ci',
        answer: 'Les bulletins sont généralement disponibles entre le 25 et le dernier jour du mois. Si vous ne le voyez pas après cette date, contactez votre service RH.',
      },
      {
        question: 'Comment partager un bulletin (pour un prêt, un dossier...) ?',
        answer: 'Ouvrez le bulletin, appuyez sur "Envoyer" et choisissez le mode de partage : email, message, ou enregistrement sur votre téléphone.',
      },
      {
        question: 'Puis-je recevoir mes bulletins par email ?',
        answer: 'Oui, si votre gestionnaire de paie a activé cette option. Vous recevez alors une notification email à chaque nouveau bulletin disponible.',
      },
    ],
  },
  {
    id: 'cumuls',
    title: 'Cumuls et fiscalité',
    icon: <Calculator size={24} color="white" />,
    color: ['#10b981', '#059669'],
    items: [
      {
        question: 'Où voir mon cumul net imposable ?',
        answer: 'Sur l\'onglet Bulletins, en haut de l\'écran, vous voyez votre cumul net imposable depuis le début de l\'année. Ce montant est utile pour votre déclaration d\'impôts.',
      },
      {
        question: 'Comment est calculé le net imposable ?',
        answer: 'Le net imposable = salaire brut - cotisations sociales déductibles + CSG/CRDS non déductible. Ce montant figure sur chaque bulletin et se cumule sur l\'année.',
      },
      {
        question: 'Où trouver mon brut annuel ?',
        answer: 'En haut de l\'écran Bulletins, vous voyez également votre cumul brut annuel, utile pour vérifier votre rémunération totale.',
      },
      {
        question: 'Comment obtenir une attestation de salaire ?',
        answer: 'Contactez votre service RH ou votre gestionnaire de paie via la section Paramètres > Aide. Ils vous fourniront les attestations nécessaires.',
      },
    ],
  },
  {
    id: 'profil',
    title: 'Mon profil',
    icon: <Smartphone size={24} color="white" />,
    color: ['#8b5cf6', '#7c3aed'],
    items: [
      {
        question: 'Comment modifier mes coordonnées bancaires ?',
        answer: 'Allez dans Paramètres > Mes coordonnées bancaires. Mettez à jour votre RIB. Le changement sera pris en compte pour le prochain virement de salaire.',
      },
      {
        question: 'Comment mettre à jour mon adresse ?',
        answer: 'Allez dans Paramètres > Mon profil et modifiez votre adresse. N\'oubliez pas de valider pour que le changement apparaisse sur vos prochains bulletins.',
      },
      {
        question: 'Une information sur mon bulletin est incorrecte',
        answer: 'Si vous constatez une erreur (nom, numéro de sécurité sociale...), contactez immédiatement votre service RH pour faire corriger l\'information.',
      },
      {
        question: 'Comment changer mon mot de passe ?',
        answer: 'Allez dans Paramètres > Sécurité > Modifier le mot de passe. Entrez votre ancien mot de passe puis le nouveau (minimum 8 caractères).',
      },
    ],
  },
  {
    id: 'aide',
    title: 'Aide et contact',
    icon: <HelpCircle size={24} color="white" />,
    color: ['#f59e0b', '#d97706'],
    items: [
      {
        question: 'J\'ai une question sur mon bulletin',
        answer: 'Pour toute question sur les montants, les calculs ou les cotisations de votre bulletin, contactez votre service RH qui pourra vous expliquer les détails.',
      },
      {
        question: 'Qui contacter en cas de problème technique ?',
        answer: 'Pour un problème avec l\'application (connexion, affichage...), contactez le support PayFlow à support@payflowcloud.app.',
      },
      {
        question: 'Comment signaler une erreur de paie ?',
        answer: 'Contactez votre service RH dès que possible. Si l\'erreur est confirmée, une régularisation sera faite sur le bulletin suivant.',
      },
    ],
  },
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} className="bg-white rounded-xl border border-slate-100 mb-2 overflow-hidden">
      <View className="flex-row items-center justify-between p-4">
        <Text className="font-medium text-slate-900 flex-1 pr-4">{item.question}</Text>
        {isOpen ? (
          <ChevronUp size={20} color="#6366f1" />
        ) : (
          <ChevronDown size={20} color="#94a3b8" />
        )}
      </View>
      {isOpen && (
        <View className="px-4 pb-4 pt-0 border-t border-slate-100">
          <Text className="text-slate-600 leading-6 mt-3">{item.answer}</Text>
        </View>
      )}
    </Pressable>
  );
}

function CategoryDetail({ category, onBack }: { category: FAQCategory; onBack: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="px-5 pb-8">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <LinearGradient
            colors={category.color as [string, string]}
            style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
          >
            {category.icon}
          </LinearGradient>
          <Text className="text-2xl font-bold text-slate-900 ml-4">{category.title}</Text>
        </View>

        {/* Questions */}
        {category.items.map((item, index) => (
          <FAQAccordion
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function CategoryCard({ category, onPress }: { category: FAQCategory; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mb-3">
      <View className="bg-white rounded-xl p-4 border border-slate-100 flex-row items-center">
        <LinearGradient
          colors={category.color as [string, string]}
          style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
        >
          {category.icon}
        </LinearGradient>
        <View className="flex-1 ml-4">
          <Text className="font-semibold text-slate-900">{category.title}</Text>
          <Text className="text-sm text-slate-500 mt-0.5">{category.items.length} questions</Text>
        </View>
        <ChevronDown size={20} color="#94a3b8" style={{ transform: [{ rotate: '-90deg' }] }} />
      </View>
    </Pressable>
  );
}

export default function FAQScreen() {
  const userType = useUserType();
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | null>(null);

  const getFAQ = () => {
    switch (userType) {
      case 'admin_app':
        return { title: 'FAQ', subtitle: 'Gestion de la plateforme PayFlow', faq: ADMIN_FAQ };
      case 'societe_a':
        return { title: 'FAQ', subtitle: 'Gestion de paie et facturation', faq: SOCIETE_A_FAQ };
      case 'societe_b':
        return { title: 'FAQ', subtitle: 'Saisie des variables et factures', faq: SOCIETE_B_FAQ };
      case 'employe':
        return { title: 'FAQ', subtitle: 'Vos bulletins de paie', faq: EMPLOYE_FAQ };
      default:
        return { title: 'FAQ', subtitle: '', faq: EMPLOYE_FAQ };
    }
  };

  const { title, subtitle, faq } = getFAQ();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-slate-100 bg-white">
        <Pressable
          onPress={() => {
            if (selectedCategory) {
              setSelectedCategory(null);
            } else {
              router.back();
            }
          }}
          className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
        >
          <ArrowLeft size={20} color="#334155" />
        </Pressable>
        <View className="flex-1 ml-4">
          <Text className="text-xl font-bold text-slate-900">
            {selectedCategory ? selectedCategory.title : title}
          </Text>
          {!selectedCategory && subtitle && (
            <Text className="text-sm text-slate-500">{subtitle}</Text>
          )}
        </View>
      </View>

      {selectedCategory ? (
        <CategoryDetail category={selectedCategory} onBack={() => setSelectedCategory(null)} />
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 py-6">
            {/* Header Card */}
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 20, marginBottom: 24 }}
            >
              <View className="flex-row items-center gap-3 mb-2">
                <HelpCircle size={28} color="white" />
                <Text className="text-white text-lg font-bold">Besoin d'aide ?</Text>
              </View>
              <Text className="text-white/80 text-sm leading-5">
                Trouvez rapidement les réponses à vos questions les plus fréquentes.
              </Text>
            </LinearGradient>

            {/* Categories */}
            <Text className="text-sm font-semibold text-slate-500 uppercase mb-3">
              Catégories
            </Text>
            {faq.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={() => setSelectedCategory(category)}
              />
            ))}

            {/* Contact Support */}
            <View className="mt-6 bg-white rounded-xl p-5 border border-slate-100">
              <Text className="font-semibold text-slate-900 mb-2">Vous n'avez pas trouvé votre réponse ?</Text>
              <Text className="text-sm text-slate-500 mb-4">Notre équipe support est disponible du lundi au vendredi, de 9h à 18h.</Text>
              <Pressable
                onPress={() => {/* Open email */}}
                className="flex-row items-center justify-center gap-2 bg-indigo-500 rounded-xl py-3 active:bg-indigo-600"
              >
                <Mail size={18} color="white" />
                <Text className="text-white font-semibold">Contacter le support</Text>
              </Pressable>
              <Text className="text-xs text-slate-400 text-center mt-3">support@payflowcloud.app</Text>
            </View>

            {/* Website */}
            <View className="mt-4 items-center">
              <Text className="text-xs text-slate-400">https://payflowcloud.app</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
