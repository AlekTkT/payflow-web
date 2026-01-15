import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FileText, ShieldCheck, Receipt } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

type LegalSection = 'cgu' | 'cgv' | 'privacy' | null;

const CGU_CONTENT = `
Dernière mise à jour : 11 janvier 2025

1. OBJET

Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions d'utilisation de l'application mobile PayFlow (ci-après "l'Application") éditée par la société PayFlow Cloud SAS.

L'utilisation de l'Application implique l'acceptation pleine et entière des présentes CGU.

2. DESCRIPTION DU SERVICE

PayFlow est une application de gestion de paie permettant :
• Aux prestataires de paie (Société A) de gérer les bulletins de salaire de leurs clients
• Aux entreprises clientes (Société B) de saisir les variables mensuelles de leurs employés
• Aux employés de consulter leurs bulletins de paie

3. ACCÈS AU SERVICE

3.1 Inscription
L'accès à l'Application nécessite une inscription préalable. L'inscription se fait par invitation :
• Les prestataires de paie sont invités par l'administrateur PayFlow
• Les entreprises clientes sont invitées par leur prestataire de paie
• Les employés sont invités par leur prestataire ou entreprise

3.2 Identifiants
L'utilisateur est responsable de la confidentialité de ses identifiants de connexion. Toute utilisation de l'Application avec ses identifiants est réputée faite par l'utilisateur lui-même.

3.3 Conditions d'accès
L'utilisateur doit disposer d'un terminal mobile compatible et d'une connexion Internet pour accéder à l'Application.

4. OBLIGATIONS DE L'UTILISATEUR

L'utilisateur s'engage à :
• Fournir des informations exactes et à jour lors de son inscription
• Ne pas utiliser l'Application à des fins illicites ou non autorisées
• Ne pas tenter de contourner les mesures de sécurité de l'Application
• Respecter les droits de propriété intellectuelle de PayFlow
• Ne pas diffuser de contenus illicites, diffamatoires ou portant atteinte aux droits des tiers

5. PROPRIÉTÉ INTELLECTUELLE

L'ensemble des éléments composant l'Application (textes, graphismes, logiciels, images, etc.) sont la propriété exclusive de PayFlow Cloud SAS ou de ses partenaires.

Toute reproduction, représentation, modification ou distribution de ces éléments, sans autorisation préalable écrite, est strictement interdite.

6. DONNÉES PERSONNELLES

Le traitement des données personnelles est décrit dans notre Politique de Confidentialité, accessible depuis l'Application.

7. RESPONSABILITÉ

7.1 PayFlow s'efforce d'assurer la disponibilité et le bon fonctionnement de l'Application, mais ne peut garantir une disponibilité permanente.

7.2 PayFlow ne saurait être tenue responsable :
• Des dommages résultant d'une utilisation non conforme de l'Application
• Des interruptions temporaires du service pour maintenance
• De la perte de données résultant d'une défaillance technique

7.3 L'utilisateur est seul responsable de l'exactitude des données qu'il saisit dans l'Application.

8. MODIFICATION DES CGU

PayFlow se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification par notification dans l'Application.

9. RÉSILIATION

PayFlow peut suspendre ou résilier l'accès d'un utilisateur en cas de non-respect des présentes CGU, sans préavis ni indemnité.

10. LOI APPLICABLE

Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.

11. CONTACT

Pour toute question relative aux présentes CGU :
Email : contact@payflowcloud.app
Site web : https://payflowcloud.app
`;

const CGV_CONTENT = `
Dernière mise à jour : 11 janvier 2025

1. OBJET

Les présentes Conditions Générales de Vente (CGV) définissent les conditions dans lesquelles PayFlow Cloud SAS fournit ses services de gestion de paie aux professionnels (ci-après "le Client").

2. IDENTIFICATION DU PRESTATAIRE

PayFlow Cloud SAS
Capital social : 10 000 €
RCS Paris : XXX XXX XXX
Siège social : 10 rue de la Paix, 75001 Paris
Email : contact@payflowcloud.app
Site web : https://payflowcloud.app

3. SERVICES PROPOSÉS

PayFlow propose les services suivants :
• Application mobile de gestion de paie
• Génération et envoi de bulletins de paie
• Gestion des variables mensuelles
• Facturation des clients
• Archivage des documents

4. OFFRES ET TARIFS

4.1 Plans d'abonnement

ESSAI GRATUIT
• Durée : 14 jours
• Accès à toutes les fonctionnalités
• Jusqu'à 5 employés

STARTER - 49€ HT/mois
• Jusqu'à 10 employés
• Support par email
• Archivage 1 an

PRO - 149€ HT/mois
• Jusqu'à 50 employés
• Support prioritaire
• Archivage 3 ans
• Export comptable

BUSINESS - 299€ HT/mois
• Employés illimités
• Support dédié
• Archivage illimité
• API disponible
• Formation incluse

4.2 Les tarifs sont exprimés en euros hors taxes. La TVA applicable (20%) sera ajoutée au montant HT.

5. COMMANDE ET PAIEMENT

5.1 Souscription
La souscription s'effectue en ligne via l'Application ou le site web payflowcloud.app.

5.2 Paiement
Le paiement s'effectue mensuellement par prélèvement automatique ou carte bancaire. Les factures sont émises le 1er de chaque mois.

5.3 Retard de paiement
En cas de retard de paiement :
• Des pénalités de retard seront appliquées au taux de 3 fois le taux d'intérêt légal
• Une indemnité forfaitaire de 40€ pour frais de recouvrement sera due
• L'accès au service pourra être suspendu après mise en demeure restée sans effet pendant 15 jours

6. DURÉE ET RENOUVELLEMENT

6.1 L'abonnement est souscrit pour une durée d'un mois, renouvelable tacitement.

6.2 Le Client peut résilier son abonnement à tout moment depuis les paramètres de l'Application. La résiliation prend effet à la fin de la période en cours.

7. DROIT DE RÉTRACTATION

Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contrats de fourniture de contenus numériques fournis sur un support immatériel dont l'exécution a commencé avec l'accord du consommateur.

8. OBLIGATIONS DU PRESTATAIRE

PayFlow s'engage à :
• Fournir un service conforme à la description
• Assurer la disponibilité du service (objectif 99,5%)
• Sécuriser les données conformément aux standards en vigueur
• Fournir un support technique selon le plan souscrit
• Conserver les données pendant la durée d'archivage prévue

9. OBLIGATIONS DU CLIENT

Le Client s'engage à :
• Fournir des informations exactes et complètes
• Payer les factures dans les délais
• Respecter les CGU de l'Application
• Ne pas revendre ou sous-licencier le service

10. RESPONSABILITÉ

10.1 La responsabilité de PayFlow est limitée aux dommages directs et prévisibles, dans la limite du montant des sommes versées par le Client au cours des 12 derniers mois.

10.2 PayFlow ne saurait être tenue responsable des dommages indirects, pertes de données, manque à gagner ou préjudice d'image.

11. DONNÉES PERSONNELLES

Le traitement des données personnelles est décrit dans notre Politique de Confidentialité.

12. PROPRIÉTÉ INTELLECTUELLE

Le Client conserve la propriété de ses données. PayFlow conserve la propriété de l'Application et de ses composants.

13. CONFIDENTIALITÉ

Les parties s'engagent à maintenir confidentielles les informations échangées dans le cadre du contrat.

14. FORCE MAJEURE

Aucune partie ne sera responsable d'un manquement à ses obligations résultant d'un cas de force majeure au sens de l'article 1218 du Code civil.

15. MODIFICATION DES CGV

PayFlow se réserve le droit de modifier les présentes CGV. Le Client sera informé 30 jours avant l'entrée en vigueur des nouvelles conditions.

16. LOI APPLICABLE ET LITIGES

Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux de Paris seront compétents.

17. CONTACT

Service commercial : commercial@payflowcloud.app
Service client : support@payflowcloud.app
Site web : https://payflowcloud.app
`;

const PRIVACY_CONTENT = `
Dernière mise à jour : 11 janvier 2025

1. INTRODUCTION

PayFlow Cloud SAS (ci-après "PayFlow", "nous") s'engage à protéger la vie privée des utilisateurs de l'application PayFlow. Cette Politique de Confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos données personnelles.

2. RESPONSABLE DU TRAITEMENT

PayFlow Cloud SAS
10 rue de la Paix, 75001 Paris
Email : dpo@payflowcloud.app
Délégué à la Protection des Données : dpo@payflowcloud.app

3. DONNÉES COLLECTÉES

3.1 Données d'identification
• Nom et prénom
• Adresse email
• Numéro de téléphone
• Adresse postale

3.2 Données professionnelles
• Nom de l'entreprise
• Fonction/poste
• Numéro SIRET
• Numéro de sécurité sociale (pour les employés)

3.3 Données de paie
• Salaire et rémunération
• Heures travaillées
• Congés et absences
• Coordonnées bancaires (RIB)

3.4 Données techniques
• Adresse IP
• Type d'appareil et système d'exploitation
• Identifiant de l'appareil
• Logs de connexion

4. FINALITÉS DU TRAITEMENT

Nous utilisons vos données pour :
• Fournir le service de gestion de paie
• Gérer votre compte utilisateur
• Générer les bulletins de paie
• Traiter les paiements et la facturation
• Vous contacter pour le support
• Améliorer nos services
• Respecter nos obligations légales

5. BASE LÉGALE

Le traitement de vos données repose sur :
• L'exécution du contrat (fourniture du service)
• Le consentement (communications marketing)
• Les obligations légales (conservation des documents de paie)
• L'intérêt légitime (amélioration du service, sécurité)

6. DESTINATAIRES DES DONNÉES

Vos données peuvent être partagées avec :
• Les autres utilisateurs autorisés (prestataire de paie, employeur, selon votre rôle)
• Nos sous-traitants techniques (hébergement, paiement)
• Les autorités compétentes (sur demande légale)

Nous ne vendons jamais vos données à des tiers.

7. TRANSFERTS DE DONNÉES

Vos données sont hébergées au sein de l'Union Européenne. En cas de transfert hors UE, nous mettons en place les garanties appropriées (clauses contractuelles types, décision d'adéquation).

8. DURÉE DE CONSERVATION

• Données de compte : durée de la relation contractuelle + 3 ans
• Bulletins de paie : 50 ans (obligation légale)
• Documents de paie employeur : 5 ans (obligation légale)
• Données de facturation : 10 ans (obligation légale)
• Logs de connexion : 1 an

9. SÉCURITÉ

Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles :
• Chiffrement des données en transit (TLS) et au repos
• Authentification forte (2FA disponible)
• Contrôle d'accès strict
• Sauvegardes régulières
• Tests de sécurité périodiques
• Sensibilisation du personnel

10. VOS DROITS

Conformément au RGPD, vous disposez des droits suivants :

10.1 Droit d'accès
Vous pouvez obtenir une copie de vos données personnelles.

10.2 Droit de rectification
Vous pouvez corriger vos données inexactes ou incomplètes.

10.3 Droit à l'effacement
Vous pouvez demander la suppression de vos données, sous réserve des obligations légales de conservation.

10.4 Droit à la limitation
Vous pouvez demander la limitation du traitement dans certains cas.

10.5 Droit à la portabilité
Vous pouvez recevoir vos données dans un format structuré et les transmettre à un autre responsable de traitement.

10.6 Droit d'opposition
Vous pouvez vous opposer au traitement de vos données pour des motifs légitimes.

10.7 Droit de retirer le consentement
Lorsque le traitement est basé sur le consentement, vous pouvez le retirer à tout moment.

Pour exercer vos droits : dpo@payflowcloud.app

11. COOKIES

L'Application utilise des cookies techniques nécessaires à son fonctionnement. Aucun cookie publicitaire n'est utilisé.

12. MODIFICATIONS

Nous pouvons modifier cette Politique de Confidentialité. Vous serez informé de toute modification substantielle par notification dans l'Application.

13. RÉCLAMATION

Si vous estimez que le traitement de vos données n'est pas conforme, vous pouvez introduire une réclamation auprès de la CNIL :
Commission Nationale de l'Informatique et des Libertés
3 Place de Fontenoy, TSA 80715
75334 Paris Cedex 07
www.cnil.fr

14. CONTACT

Pour toute question relative à cette Politique de Confidentialité :
Email : dpo@payflowcloud.app
Adresse : PayFlow Cloud SAS, 10 rue de la Paix, 75001 Paris
`;

function LegalContent({ content }: { content: string }) {
  const paragraphs = content.trim().split('\n\n');

  return (
    <View className="gap-4">
      {paragraphs.map((paragraph, index) => {
        const trimmed = paragraph.trim();

        // Title (starts with number followed by dot)
        if (/^\d+\.\s+[A-ZÉÈÀÙ]/.test(trimmed)) {
          return (
            <Text key={index} className="text-lg font-bold text-slate-900 mt-4">
              {trimmed}
            </Text>
          );
        }

        // Subtitle (starts with number.number)
        if (/^\d+\.\d+\s+/.test(trimmed)) {
          return (
            <Text key={index} className="font-semibold text-slate-800 mt-2">
              {trimmed}
            </Text>
          );
        }

        // Date line
        if (trimmed.startsWith('Dernière mise à jour')) {
          return (
            <Text key={index} className="text-sm text-slate-500 italic mb-2">
              {trimmed}
            </Text>
          );
        }

        // Bullet points
        if (trimmed.includes('•')) {
          const lines = trimmed.split('\n');
          return (
            <View key={index} className="gap-1">
              {lines.map((line, i) => (
                <Text key={i} className="text-slate-600 leading-6 pl-2">
                  {line}
                </Text>
              ))}
            </View>
          );
        }

        // Plan pricing (special format)
        if (trimmed.includes('€') && trimmed.includes('/mois')) {
          return (
            <View key={index} className="bg-indigo-50 rounded-xl p-4 my-2">
              <Text className="font-bold text-indigo-700">{trimmed.split('\n')[0]}</Text>
              {trimmed.split('\n').slice(1).map((line, i) => (
                <Text key={i} className="text-slate-600 text-sm">{line}</Text>
              ))}
            </View>
          );
        }

        // Regular paragraph
        return (
          <Text key={index} className="text-slate-600 leading-6">
            {trimmed}
          </Text>
        );
      })}
    </View>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  color,
  onPress
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string[];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="mb-3 active:opacity-80">
      <View className="bg-white rounded-xl p-4 border border-slate-100 flex-row items-center">
        <LinearGradient
          colors={color as [string, string]}
          style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
        >
          {icon}
        </LinearGradient>
        <View className="flex-1 ml-4">
          <Text className="font-semibold text-slate-900">{title}</Text>
          <Text className="text-sm text-slate-500 mt-0.5">{subtitle}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function LegalScreen() {
  const params = useLocalSearchParams<{ section?: string }>();
  const [selectedSection, setSelectedSection] = useState<LegalSection>(
    (params.section as LegalSection) || null
  );

  const getTitle = () => {
    switch (selectedSection) {
      case 'cgu':
        return "Conditions Générales d'Utilisation";
      case 'cgv':
        return "Conditions Générales de Vente";
      case 'privacy':
        return "Politique de Confidentialité";
      default:
        return "Informations légales";
    }
  };

  const getContent = () => {
    switch (selectedSection) {
      case 'cgu':
        return CGU_CONTENT;
      case 'cgv':
        return CGV_CONTENT;
      case 'privacy':
        return PRIVACY_CONTENT;
      default:
        return '';
    }
  };

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
          <Text className="text-xl font-bold text-slate-900" numberOfLines={1}>
            {getTitle()}
          </Text>
        </View>
      </View>

      {selectedSection ? (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 py-6">
            <LegalContent content={getContent()} />
          </View>
        </ScrollView>
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
              <Text className="text-white text-lg font-bold mb-2">PayFlow Cloud</Text>
              <Text className="text-white/80 text-sm leading-5">
                Consultez nos conditions d'utilisation, de vente et notre politique de confidentialité.
              </Text>
              <Text className="text-white/60 text-xs mt-3">
                https://payflowcloud.app
              </Text>
            </LinearGradient>

            {/* Sections */}
            <Text className="text-sm font-semibold text-slate-500 uppercase mb-3">
              Documents légaux
            </Text>

            <SectionCard
              title="Conditions Générales d'Utilisation"
              subtitle="Règles d'utilisation de l'application"
              icon={<FileText size={24} color="white" />}
              color={['#6366f1', '#8b5cf6']}
              onPress={() => setSelectedSection('cgu')}
            />

            <SectionCard
              title="Conditions Générales de Vente"
              subtitle="Tarifs, abonnements et paiement"
              icon={<Receipt size={24} color="white" />}
              color={['#10b981', '#059669']}
              onPress={() => setSelectedSection('cgv')}
            />

            <SectionCard
              title="Politique de Confidentialité"
              subtitle="Protection de vos données personnelles"
              icon={<ShieldCheck size={24} color="white" />}
              color={['#f59e0b', '#d97706']}
              onPress={() => setSelectedSection('privacy')}
            />

            {/* Contact */}
            <View className="mt-6 bg-white rounded-xl p-5 border border-slate-100">
              <Text className="font-semibold text-slate-900 mb-2">Contact</Text>
              <Text className="text-sm text-slate-600 mb-1">PayFlow Cloud SAS</Text>
              <Text className="text-sm text-slate-600 mb-1">10 rue de la Paix, 75001 Paris</Text>
              <Text className="text-sm text-slate-600 mb-1">contact@payflowcloud.app</Text>
              <Text className="text-sm text-indigo-600">https://payflowcloud.app</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
