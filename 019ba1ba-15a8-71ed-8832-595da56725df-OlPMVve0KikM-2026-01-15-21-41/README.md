# PayFlow Cloud - Application de Gestion de Paie

Application mobile de gestion de paie pour les entreprises de portage salarial, construite avec Expo et React Native.

**URL de production** : [app.payflowcloud.app](https://app.payflowcloud.app)

## Fonctionnalités

- **4 types d'utilisateurs** :
  - **Admin App** : Administration globale de l'application PayFlow (SaaS), gestion des Sociétés A abonnées et facturation des abonnements
  - **Société A (Prestataire)** : Gestion des clients, employés, bulletins de paie et facturation + accès aux factures d'abonnement PayFlow
  - **Société B (Client)** : Saisie des variables de paie, consultation des factures
  - **Employé** : Consultation des bulletins de paie et informations contractuelles

- **Système d'authentification** :
  - Écran de connexion avec email/mot de passe
  - Connexion Google (OAuth)
  - Accès sur invitation uniquement
  - Gestion des rôles et permissions

- **Système d'invitations hiérarchique** :
  - **Admin App** → peut inviter des Sociétés A via Email, WhatsApp, SMS ou lien partageable
  - **Société A** → peut inviter des Sociétés B et des Employés
  - **Société B** → peut inviter des Employés
  - **Liens d'invitation** : https://app.payflowcloud.app/accept-invite?token=...
  - Suivi du statut des invitations (en attente, acceptée, expirée, annulée)
  - Options de partage : Copier le lien, Partager via iOS/Android, WhatsApp, SMS, Email

- **Navigation adaptée par rôle** :
  - **Admin App** : Dashboard SaaS, Sociétés A (clients abonnés), Abonnements (factures), Paramètres
  - **Société A** : Tableau de bord, Employés, Bulletins, Factures (clients + abonnement PayFlow), Paramètres
  - **Société B** : Tableau de bord, Employés, Factures, Paramètres
  - **Employé** : Accueil, Bulletins, Paramètres

- **Gestion Admin App (SaaS)** :
  - Dashboard avec métriques : revenus mensuels, téléchargements, sociétés actives
  - Liste des Sociétés A avec leurs plans (Starter, Pro, Business, Essai)
  - **Recherche fonctionnelle** des Sociétés A par nom, email, plan ou adresse
  - **Boutons Email/Appeler fonctionnels** pour contacter les Sociétés A
  - Gestion des abonnements et facturation automatique mensuelle
  - Relance des impayés et export comptable
  - Répartition des abonnements par plan

- **Onglet Abonnements Admin App (entièrement fonctionnel)** :
  - **Recherche** par société, plan, numéro de facture ou période
  - **Bouton Générer** : génération des factures d'abonnement
  - **Boutons Voir/PDF** : visualisation et téléchargement des factures
  - **Bouton Encaissée** : marquer une facture comme payée
  - **Bouton Relancer** : envoyer un rappel par email aux impayés
  - **Actions rapides** : Générer toutes, Relancer impayés, Exporter comptabilité
  - Filtres par statut avec retour haptique

- **Factures d'abonnement PayFlow** :
  - Admin App génère les factures mensuelles pour les Sociétés A
  - Société A peut consulter et payer ses factures d'abonnement
  - **Boutons fonctionnels** : Voir, PDF, Payer
  - Historique des paiements et rappels d'échéance

- **Barres de recherche fonctionnelles** :
  - **Sociétés A** : recherche par nom, email, plan, adresse
  - **Abonnements** : recherche par société, plan, numéro de facture, période
  - **Factures** : recherche par numéro de facture, nom du client
  - **Employés** : recherche par nom, poste, société

- **Flux de saisie des variables (Société B → Société A)** :
  - La Société B saisit les variables mensuelles de ses employés (heures, primes, absences)
  - Les variables sont automatiquement transmises à la Société A
  - La Société A valide les variables et génère les bulletins de paie
  - Statuts des variables : Brouillon → Soumis → Validé

- **Gestion complète** :
  - Tableau de bord avec statistiques en temps réel
  - Liste des variables en attente de validation pour Société A
  - Gestion des employés avec fiches détaillées (infos personnelles, contrat, documents)
  - Variables de paie mensuelles avec suivi du statut
  - Génération et envoi des bulletins de paie (PDF)
  - Facturation et suivi des paiements
  - Upload et téléchargement de documents (carte identité, carte vitale, RIB, etc.)
  - **Suppression de sociétés clientes et d'employés avec historique**
  - **Restauration des éléments supprimés depuis l'historique**

- **Modals de création** :
  - **+Client** : Ajout d'une société cliente avec statut juridique, SIRET, numéro URSSAF, adresse et contact
  - **+Ajouter un employé** : Création d'un nouveau salarié avec poste, taux horaire, type de contrat, société cliente
  - **+Créer facture** : Génération de facture de la société A vers une société B avec calcul automatique
  - **Générer bulletin** : Création d'un bulletin de paie avec auto-remplissage des variables soumises par le client
  - **Saisir variables (Client)** : Saisie des variables mensuelles par la Société B avec transmission automatique

- **Documents générés avec titres personnalisés** :
  - **Factures** : Titre affiché = "Nom de la société B - Mois Année"
  - **Bulletins de paie** : Titre affiché = Nom et prénom de l'employé

- **Suppression avec historique** (Société A uniquement) :
  - Suppression des sociétés clientes (Société B) avec confirmation
  - Suppression des employés avec confirmation
  - Motif de suppression optionnel
  - Historique consultable dans Paramètres > Administration
  - Possibilité de restaurer les éléments supprimés

- **Paramètres de l'application** :
  - **Apparence** : Thème clair, sombre ou automatique (suit les paramètres système)
  - **Langue** : Français, English, Español, Deutsch, Italiano (persisté)
  - Préférences sauvegardées localement

- **Assistant PayFlow (Chatbot intelligent)** :
  - Accessible depuis les paramètres de tous les modes utilisateurs
  - Répond aux questions spécifiques à chaque rôle (Admin, Société A, Société B, Employé)
  - Utilise les données de l'application pour des réponses contextualisées
  - Permet d'accéder directement aux documents demandés (bulletins, factures)
  - Suggestions d'actions rapides adaptées au profil de l'utilisateur
  - Interface de chat moderne avec animations

## Configuration Supabase - Mode Réel

### Étape 1 : Créer un projet Supabase

1. Rendez-vous sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL et la clé anonyme (anon key)

### Étape 2 : Configurer la base de données

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Cliquez sur **New Query**
3. Copiez le contenu du fichier `supabase-complete-setup.sql`
4. Cliquez sur **Run** pour exécuter le script

Ce script crée :
- 8 tables : users, companies, employees, monthly_variables, payslips, invoices, invitations, subscription_invoices
- Les types ENUM pour les rôles et statuts
- Les politiques de sécurité (RLS) pour chaque table
- Les index pour les performances
- Les triggers pour updated_at

### Étape 3 : Créer le premier utilisateur Admin

1. Dans Supabase, allez dans **Authentication** > **Users**
2. Cliquez sur **Add user** > **Create new user**
3. Entrez votre email et mot de passe
4. Cochez **Auto Confirm User**
5. Cliquez sur **Create user** et copiez l'**ID utilisateur** (UUID)

6. Retournez dans **SQL Editor** et exécutez :
```sql
INSERT INTO users (id, email, full_name, user_type)
VALUES (
    'COLLEZ_L_ID_ICI',
    'votre@email.com',
    'Votre Nom',
    'admin_app'
);
```

### Étape 4 : Configurer les variables d'environnement

Ajoutez ces variables dans l'onglet **ENV** de Vibecode :

```
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

### Étape 5 : Tester le Mode Réel

1. Dans l'app, allez dans **Paramètres**
2. En bas, sélectionnez **Mode Réel**
3. Déconnectez-vous et reconnectez-vous avec vos identifiants

## Structure du Projet

```
src/
├── app/                    # Routes Expo Router
│   ├── (tabs)/            # Navigation par onglets
│   │   ├── index.tsx      # Tableau de bord
│   │   ├── employees.tsx  # Gestion des employés
│   │   ├── bulletins.tsx  # Bulletins de paie
│   │   ├── invoices.tsx   # Facturation
│   │   └── settings.tsx   # Paramètres
│   ├── login.tsx          # Écran de connexion
│   ├── invite-user.tsx    # Écran d'invitation (adapté selon rôle)
│   ├── add-client.tsx     # Modal ajout client
│   ├── add-employee.tsx   # Modal ajout employé
│   ├── create-invoice.tsx # Modal création facture
│   ├── generate-payslip.tsx # Modal génération bulletin (avec auto-remplissage)
│   ├── variable-entry.tsx # Modal saisie variables (Société A)
│   ├── client-variable-entry.tsx # Modal saisie variables (Société B)
│   ├── employee-detail.tsx # Fiche détaillée employé
│   ├── payslip-viewer.tsx # Visualisation bulletin PDF
│   ├── invoice-viewer.tsx # Visualisation facture PDF
│   ├── settings-detail.tsx # Détail paramètres et documents
│   ├── deletion-history.tsx # Historique des suppressions
│   ├── chat-assistant.tsx # Assistant intelligent (chatbot)
│   └── _layout.tsx        # Layout racine
├── components/
│   └── payflow/
│       └── ui.tsx         # Composants UI réutilisables
└── lib/
    ├── supabase.ts        # Client Supabase
    ├── database.types.ts  # Types TypeScript
    ├── hooks/
    │   └── usePayflow.ts  # Hooks React Query (variables, suppression, etc.)
    └── state/
        ├── app-store.ts   # Store Zustand (utilisateur)
        ├── auth-store.ts  # Store Zustand (authentification)
        └── deletion-history-store.ts # Store historique suppressions
```

## Technologies

- **Expo SDK 53** + React Native 0.76.7
- **Supabase** : Backend, base de données PostgreSQL, authentification
- **React Query** : Gestion des données serveur et cache
- **Zustand** : État local de l'application
- **NativeWind** : Styling avec Tailwind CSS
- **Expo Router** : Navigation basée sur les fichiers

## Modes de l'Application

### Mode Démonstration
L'application inclut un mode démonstration accessible dans les Paramètres. Vous pouvez basculer entre les 4 types d'utilisateurs (Admin App, Société A, Société B, Employé) pour voir les différentes interfaces avec des données de démonstration.

### Mode Réel
En mode réel, l'application démarre avec une base de données vierge, prête à accueillir vos premiers utilisateurs. Les données sont stockées localement et persistent entre les sessions :
- **Admin App** : Dashboard vide avec invitation à créer la première Société A
- **Sociétés A** : Liste vide, remplissage au fur et à mesure des inscriptions
- **Abonnements** : Factures générées automatiquement lors des inscriptions
- **Invitations** : Système fonctionnel d'invitation par email, WhatsApp ou SMS

### Identifiants de test (mode démo)

- **Admin App** : sciscialek@gmail.com / Lancing58 (ou admin@payflow.fr / demo123)
- **Société A** : societe-a@payflow.fr / demo123
- **Société B** : societe-b@payflow.fr / demo123
- **Employé** : employe@payflow.fr / demo123

## Base de Données

Le schéma de base de données inclut :

- `companies` : Entreprises (prestataires et clients) avec SIRET, URSSAF, statut juridique
- `users` : Utilisateurs liés à Supabase Auth
- `employees` : Employés avec leur affectation et taux horaire
- `monthly_variables` : Variables de paie mensuelles (heures, primes, absences)
- `payslips` : Bulletins de paie générés avec brut/net
- `invoices` : Factures clients avec suivi des paiements

Des données de démonstration sont incluses dans le script SQL.
