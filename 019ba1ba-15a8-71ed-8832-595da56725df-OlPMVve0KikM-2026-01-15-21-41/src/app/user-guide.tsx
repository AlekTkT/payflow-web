import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Building2,
  Users,
  FileText,
  Receipt,
  ChevronRight,
  Calculator,
  Shield,
  Smartphone,
  CreditCard,
  Mail,
  UserPlus,
  Send,
  Eye,
  Download,
  CheckCircle,
} from 'lucide-react-native';
import { useUserType } from '@/lib/state/app-store';

type GuideStep = {
  title: string;
  description: string;
  icon?: React.ReactNode;
};

type GuideSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string[];
  steps: GuideStep[];
};

// ============ GUIDE ADMIN APP ============
const ADMIN_GUIDE: GuideSection[] = [
  {
    id: 'dashboard',
    title: 'Tableau de bord',
    icon: <Shield size={24} color="white" />,
    color: ['#8b5cf6', '#7c3aed'],
    steps: [
      {
        title: 'Accéder au tableau de bord',
        description: 'Sur l\'onglet Accueil, vous visualisez les statistiques globales de la plateforme : nombre de prestataires actifs, revenus mensuels et invitations en attente.',
      },
      {
        title: 'Voir les prestataires',
        description: 'La liste des prestataires affiche leur nom, statut d\'abonnement (Actif, Essai, Expiré), nombre de clients et d\'employés gérés.',
      },
      {
        title: 'Accéder aux détails',
        description: 'Appuyez sur un prestataire pour voir sa fiche détaillée : informations de contact, historique d\'abonnement et statistiques d\'utilisation.',
      },
    ],
  },
  {
    id: 'invitations',
    title: 'Inviter un prestataire',
    icon: <UserPlus size={24} color="white" />,
    color: ['#6366f1', '#8b5cf6'],
    steps: [
      {
        title: 'Accéder aux invitations',
        description: 'Allez dans Paramètres > Inviter une Société A pour envoyer une invitation à un nouveau prestataire de paie.',
      },
      {
        title: 'Renseigner l\'email',
        description: 'Entrez l\'adresse email du responsable du cabinet de paie. Vérifiez bien l\'orthographe avant d\'envoyer.',
      },
      {
        title: 'Envoyer l\'invitation',
        description: 'Appuyez sur "Envoyer". Le prestataire recevra un email avec un lien valide 7 jours pour créer son compte.',
      },
      {
        title: 'Suivre les invitations',
        description: 'Retrouvez toutes les invitations envoyées dans la section Invitations avec leur statut : En attente, Acceptée, Expirée.',
      },
    ],
  },
  {
    id: 'abonnements',
    title: 'Gérer les abonnements',
    icon: <CreditCard size={24} color="white" />,
    color: ['#10b981', '#059669'],
    steps: [
      {
        title: 'Voir l\'abonnement actuel',
        description: 'Ouvrez la fiche d\'un prestataire. Son plan actuel (Essai, Starter, Pro, Business) et sa date de renouvellement sont affichés.',
      },
      {
        title: 'Modifier un abonnement',
        description: 'Appuyez sur "Modifier l\'abonnement" pour changer de plan. La facturation au prorata est calculée automatiquement.',
      },
      {
        title: 'Prolonger un essai',
        description: 'Pour un prestataire en période d\'essai, appuyez sur "Prolonger l\'essai" pour accorder jusqu\'à 14 jours supplémentaires.',
      },
      {
        title: 'Gérer les impayés',
        description: 'Les prestataires en retard de paiement sont signalés en rouge. Vous pouvez les contacter ou suspendre leur compte.',
      },
    ],
  },
  {
    id: 'suspension',
    title: 'Suspendre / Réactiver',
    icon: <Shield size={24} color="white" />,
    color: ['#ef4444', '#dc2626'],
    steps: [
      {
        title: 'Suspendre un compte',
        description: 'Ouvrez la fiche du prestataire et appuyez sur "Suspendre le compte". Cette action bloque immédiatement tous les accès.',
      },
      {
        title: 'Conséquences',
        description: 'Le prestataire et tous ses utilisateurs (clients, employés) n\'auront plus accès à l\'application. Les données sont conservées.',
      },
      {
        title: 'Réactiver un compte',
        description: 'Sur la fiche d\'un prestataire suspendu, appuyez sur "Réactiver le compte". L\'accès est rétabli immédiatement.',
      },
    ],
  },
];

// ============ GUIDE SOCIÉTÉ A (PRESTATAIRE) ============
const SOCIETE_A_GUIDE: GuideSection[] = [
  {
    id: 'clients',
    title: 'Ajouter un client',
    icon: <Building2 size={24} color="white" />,
    color: ['#6366f1', '#8b5cf6'],
    steps: [
      {
        title: 'Accéder à Mes clients',
        description: 'Sur l\'onglet Accueil, appuyez sur "Mes clients" pour voir la liste de vos entreprises clientes.',
      },
      {
        title: 'Créer un nouveau client',
        description: 'Appuyez sur le bouton "+" pour ajouter un client. Renseignez : raison sociale, SIRET, adresse complète.',
      },
      {
        title: 'Ajouter les contacts',
        description: 'Renseignez le nom, email et téléphone du contact RH principal. Ces informations serviront pour les communications.',
      },
      {
        title: 'Inviter le client',
        description: 'Allez dans Paramètres > Inviter des utilisateurs > Société B. Sélectionnez le client et envoyez une invitation email.',
      },
    ],
  },
  {
    id: 'employees',
    title: 'Gérer les employés',
    icon: <Users size={24} color="white" />,
    color: ['#10b981', '#059669'],
    steps: [
      {
        title: 'Ajouter un employé',
        description: 'Dans l\'onglet Employés, appuyez sur "Ajouter". Renseignez : nom, poste, taux horaire, type de contrat et date d\'embauche.',
      },
      {
        title: 'Rattacher au client',
        description: 'Sélectionnez l\'entreprise cliente où l\'employé est en mission. Ce rattachement détermine qui saisit les variables.',
      },
      {
        title: 'Inviter l\'employé',
        description: 'Pour lui donner accès à ses bulletins, allez dans Paramètres > Inviter des utilisateurs > Employé et entrez son email.',
      },
      {
        title: 'Modifier un employé',
        description: 'Appuyez sur la fiche de l\'employé pour modifier ses informations. Les changements de taux s\'appliquent aux prochains bulletins.',
      },
    ],
  },
  {
    id: 'variables',
    title: 'Valider les variables',
    icon: <Calculator size={24} color="white" />,
    color: ['#8b5cf6', '#7c3aed'],
    steps: [
      {
        title: 'Voir les variables à valider',
        description: 'Sur l\'Accueil, le nombre de variables soumises par vos clients s\'affiche. Appuyez dessus pour y accéder.',
      },
      {
        title: 'Vérifier les saisies',
        description: 'Pour chaque employé, vérifiez les heures travaillées, heures sup, congés, absences et primes saisies par le client.',
      },
      {
        title: 'Corriger si nécessaire',
        description: 'Vous pouvez modifier les valeurs avant validation. Appuyez sur un champ pour le corriger.',
      },
      {
        title: 'Valider',
        description: 'Appuyez sur "Valider" pour chaque saisie vérifiée. Une fois validée, la variable est prête pour la génération du bulletin.',
      },
    ],
  },
  {
    id: 'bulletins',
    title: 'Générer les bulletins',
    icon: <FileText size={24} color="white" />,
    color: ['#ec4899', '#db2777'],
    steps: [
      {
        title: 'Accéder à la génération',
        description: 'Dans l\'onglet Bulletins, appuyez sur "Générer" pour créer un nouveau bulletin de paie.',
      },
      {
        title: 'Sélectionner l\'employé',
        description: 'Choisissez l\'employé et le mois. Seuls les employés avec des variables validées sont disponibles.',
      },
      {
        title: 'Vérifier le calcul',
        description: 'Le brut et le net sont calculés automatiquement. Vérifiez les montants avant de confirmer.',
      },
      {
        title: 'Envoyer le bulletin',
        description: 'Sur la carte du bulletin, appuyez sur "Envoyer" pour l\'envoyer par email à l\'employé.',
      },
    ],
  },
  {
    id: 'invoices',
    title: 'Facturer vos clients',
    icon: <Receipt size={24} color="white" />,
    color: ['#f59e0b', '#d97706'],
    steps: [
      {
        title: 'Créer une facture',
        description: 'Dans l\'onglet Factures, appuyez sur "Créer une facture". Sélectionnez le client et le mois de prestation.',
      },
      {
        title: 'Définir le montant',
        description: 'Renseignez le montant de vos prestations. Le numéro de facture et la TVA sont calculés automatiquement.',
      },
      {
        title: 'Envoyer la facture',
        description: 'Appuyez sur "Envoyer" pour transmettre la facture au client par email.',
      },
      {
        title: 'Suivre les paiements',
        description: 'Chaque facture affiche son statut. Marquez-la comme payée lorsque vous recevez le règlement.',
      },
    ],
  },
];

// ============ GUIDE SOCIÉTÉ B (CLIENT) ============
const SOCIETE_B_GUIDE: GuideSection[] = [
  {
    id: 'variables',
    title: 'Saisir les variables',
    icon: <Calculator size={24} color="white" />,
    color: ['#6366f1', '#8b5cf6'],
    steps: [
      {
        title: 'Accéder à la saisie',
        description: 'Sur l\'onglet Accueil, appuyez sur "Saisir les variables" ou sur le nombre d\'employés en attente de saisie.',
      },
      {
        title: 'Sélectionner un employé',
        description: 'Choisissez l\'employé pour lequel vous souhaitez saisir les variables du mois.',
      },
      {
        title: 'Renseigner les heures',
        description: 'Indiquez les heures travaillées (base 151.67h) et les heures supplémentaires éventuelles.',
      },
      {
        title: 'Ajouter congés et absences',
        description: 'Renseignez le nombre de jours de congés payés et d\'absences maladie si applicable.',
      },
      {
        title: 'Ajouter les primes',
        description: 'Si l\'employé a droit à une prime ce mois-ci, indiquez le montant brut dans le champ Primes.',
      },
      {
        title: 'Soumettre',
        description: 'Appuyez sur "Soumettre" pour envoyer la saisie à votre prestataire. Vous ne pourrez plus la modifier après.',
      },
    ],
  },
  {
    id: 'employees',
    title: 'Consulter mes employés',
    icon: <Users size={24} color="white" />,
    color: ['#10b981', '#059669'],
    steps: [
      {
        title: 'Voir la liste',
        description: 'Dans l\'onglet Employés, vous voyez tous les salariés de votre entreprise gérés par le prestataire.',
      },
      {
        title: 'Consulter une fiche',
        description: 'Appuyez sur un employé pour voir ses informations : poste, taux horaire, type de contrat, date d\'embauche.',
      },
      {
        title: 'Demander un ajout',
        description: 'Pour ajouter un nouvel employé, contactez votre prestataire de paie qui créera sa fiche.',
      },
    ],
  },
  {
    id: 'invoices',
    title: 'Consulter mes factures',
    icon: <Receipt size={24} color="white" />,
    color: ['#f59e0b', '#d97706'],
    steps: [
      {
        title: 'Accéder aux factures',
        description: 'Dans l\'onglet Factures, vous trouvez toutes les factures de votre prestataire de paie.',
      },
      {
        title: 'Voir le détail',
        description: 'Appuyez sur une facture pour voir le détail : période, montant HT, TVA, total TTC.',
      },
      {
        title: 'Télécharger le PDF',
        description: 'Appuyez sur "Voir PDF" pour ouvrir la facture. Vous pouvez ensuite la télécharger ou la partager.',
      },
    ],
  },
  {
    id: 'invite',
    title: 'Inviter mes employés',
    icon: <UserPlus size={24} color="white" />,
    color: ['#8b5cf6', '#7c3aed'],
    steps: [
      {
        title: 'Accéder aux invitations',
        description: 'Allez dans Paramètres > Inviter des employés pour donner accès à vos salariés.',
      },
      {
        title: 'Entrer l\'email',
        description: 'Saisissez l\'adresse email de l\'employé. Assurez-vous qu\'il s\'agit bien de son email personnel ou professionnel.',
      },
      {
        title: 'Envoyer',
        description: 'Appuyez sur "Envoyer". L\'employé recevra un email pour créer son compte et accéder à ses bulletins.',
      },
    ],
  },
];

// ============ GUIDE EMPLOYÉ ============
const EMPLOYE_GUIDE: GuideSection[] = [
  {
    id: 'bulletins',
    title: 'Consulter mes bulletins',
    icon: <FileText size={24} color="white" />,
    color: ['#6366f1', '#8b5cf6'],
    steps: [
      {
        title: 'Accéder aux bulletins',
        description: 'Dans l\'onglet Bulletins, vous trouvez tous vos bulletins de paie classés du plus récent au plus ancien.',
        icon: <FileText size={20} color="#6366f1" />,
      },
      {
        title: 'Voir le résumé',
        description: 'En haut de l\'écran, consultez votre cumul net imposable, brut annuel et nombre de bulletins de l\'année.',
        icon: <Calculator size={20} color="#6366f1" />,
      },
      {
        title: 'Ouvrir un bulletin',
        description: 'Appuyez sur "Voir PDF" pour afficher le bulletin complet avec tous les détails de votre rémunération.',
        icon: <Eye size={20} color="#6366f1" />,
      },
    ],
  },
  {
    id: 'download',
    title: 'Télécharger et partager',
    icon: <Download size={24} color="white" />,
    color: ['#10b981', '#059669'],
    steps: [
      {
        title: 'Télécharger un bulletin',
        description: 'Une fois le bulletin ouvert, appuyez sur l\'icône de téléchargement pour l\'enregistrer sur votre téléphone.',
        icon: <Download size={20} color="#10b981" />,
      },
      {
        title: 'Partager par email',
        description: 'Appuyez sur "Envoyer" puis sélectionnez votre application email pour envoyer le bulletin en pièce jointe.',
        icon: <Mail size={20} color="#10b981" />,
      },
      {
        title: 'Autres options de partage',
        description: 'Vous pouvez aussi partager via WhatsApp, Messages ou toute autre application de votre choix.',
        icon: <Send size={20} color="#10b981" />,
      },
    ],
  },
  {
    id: 'profile',
    title: 'Modifier mon profil',
    icon: <Smartphone size={24} color="white" />,
    color: ['#8b5cf6', '#7c3aed'],
    steps: [
      {
        title: 'Accéder au profil',
        description: 'Allez dans l\'onglet Paramètres, puis appuyez sur "Mon profil" en haut de l\'écran.',
      },
      {
        title: 'Modifier mes informations',
        description: 'Vous pouvez mettre à jour votre adresse et votre numéro de téléphone. Les modifications sont envoyées à votre gestionnaire.',
      },
      {
        title: 'Changer mon RIB',
        description: 'Dans Paramètres > Mes coordonnées bancaires, mettez à jour votre RIB pour recevoir votre salaire sur un autre compte.',
      },
    ],
  },
  {
    id: 'security',
    title: 'Sécurité du compte',
    icon: <Shield size={24} color="white" />,
    color: ['#f59e0b', '#d97706'],
    steps: [
      {
        title: 'Changer de mot de passe',
        description: 'Allez dans Paramètres > Sécurité > Modifier le mot de passe. Choisissez un mot de passe d\'au moins 8 caractères.',
      },
      {
        title: 'Activer la double authentification',
        description: 'Pour plus de sécurité, activez l\'authentification à deux facteurs (2FA) dans les paramètres de sécurité.',
      },
      {
        title: 'Se déconnecter',
        description: 'Pour vous déconnecter, allez dans Paramètres et appuyez sur "Se déconnecter" en bas de l\'écran.',
      },
    ],
  },
];

function GuideCard({ section, onPress }: { section: GuideSection; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mb-3">
      <View className="bg-white rounded-xl p-4 border border-slate-100 flex-row items-center">
        <LinearGradient
          colors={section.color as [string, string]}
          style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
        >
          {section.icon}
        </LinearGradient>
        <View className="flex-1 ml-4">
          <Text className="font-semibold text-slate-900">{section.title}</Text>
          <Text className="text-sm text-slate-500 mt-0.5">{section.steps.length} étapes</Text>
        </View>
        <ChevronRight size={20} color="#94a3b8" />
      </View>
    </Pressable>
  );
}

function SectionDetail({ section }: { section: GuideSection }) {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="px-5 pb-8">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <LinearGradient
            colors={section.color as [string, string]}
            style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
          >
            {section.icon}
          </LinearGradient>
          <Text className="text-2xl font-bold text-slate-900 ml-4">{section.title}</Text>
        </View>

        {/* Steps */}
        <View className="gap-4">
          {section.steps.map((step, index) => (
            <View key={index} className="bg-white rounded-xl p-4 border border-slate-100">
              <View className="flex-row items-start gap-3">
                <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center">
                  <Text className="text-sm font-bold text-indigo-600">{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900 mb-1">{step.title}</Text>
                  <Text className="text-sm text-slate-600 leading-5">{step.description}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Tip */}
        <View className="mt-6 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <View className="flex-row items-center gap-2 mb-2">
            <CheckCircle size={18} color="#6366f1" />
            <Text className="font-semibold text-indigo-700">Conseil</Text>
          </View>
          <Text className="text-sm text-indigo-600">
            En cas de difficulté, consultez la FAQ ou contactez le support à support@payflowcloud.app
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default function UserGuideScreen() {
  const userType = useUserType();
  const [selectedSection, setSelectedSection] = useState<GuideSection | null>(null);

  const getGuide = () => {
    switch (userType) {
      case 'admin_app':
        return { title: 'Guide', subtitle: 'Gérez la plateforme PayFlow', guide: ADMIN_GUIDE };
      case 'societe_a':
        return { title: 'Guide', subtitle: 'Gérez la paie de vos clients', guide: SOCIETE_A_GUIDE };
      case 'societe_b':
        return { title: 'Guide', subtitle: 'Saisissez les variables mensuelles', guide: SOCIETE_B_GUIDE };
      case 'employe':
        return { title: 'Guide', subtitle: 'Consultez vos bulletins de paie', guide: EMPLOYE_GUIDE };
      default:
        return { title: 'Guide', subtitle: '', guide: EMPLOYE_GUIDE };
    }
  };

  const { title, subtitle, guide } = getGuide();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-slate-100 bg-white">
        <Pressable
          onPress={() => {
            if (selectedSection) {
              setSelectedSection(null);
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
            {selectedSection ? selectedSection.title : title}
          </Text>
          {!selectedSection && subtitle && (
            <Text className="text-sm text-slate-500">{subtitle}</Text>
          )}
        </View>
      </View>

      {selectedSection ? (
        <SectionDetail section={selectedSection} />
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 py-6">
            {/* Welcome Card */}
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 20, marginBottom: 24 }}
            >
              <Text className="text-white text-lg font-bold mb-2">Bienvenue sur PayFlow</Text>
              <Text className="text-white/80 text-sm leading-5">
                Suivez ces guides étape par étape pour maîtriser toutes les fonctionnalités de l'application.
              </Text>
            </LinearGradient>

            {/* Sections */}
            <Text className="text-sm font-semibold text-slate-500 uppercase mb-3">
              Guides disponibles
            </Text>
            {guide.map((section) => (
              <GuideCard
                key={section.id}
                section={section}
                onPress={() => setSelectedSection(section)}
              />
            ))}

            {/* Website */}
            <View className="mt-6 items-center">
              <Text className="text-xs text-slate-400">https://payflowcloud.app</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
