-- =====================================================
-- PayFlow - Script SQL Complet pour Mode Réel
-- =====================================================
-- Ce script configure votre base Supabase pour PayFlow
-- Exécutez-le dans le SQL Editor de Supabase
-- =====================================================

-- ÉTAPE 1: Nettoyer les anciennes tables (si elles existent)
-- =====================================================
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS payslips CASCADE;
DROP TABLE IF EXISTS monthly_variables CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Supprimer les anciens types
DROP TYPE IF EXISTS user_type CASCADE;
DROP TYPE IF EXISTS company_type CASCADE;
DROP TYPE IF EXISTS variable_status CASCADE;
DROP TYPE IF EXISTS payslip_status CASCADE;
DROP TYPE IF EXISTS invoice_status CASCADE;
DROP TYPE IF EXISTS invitation_status CASCADE;

-- ÉTAPE 2: Créer les types ENUM
-- =====================================================
CREATE TYPE user_type AS ENUM ('admin_app', 'societe_a', 'societe_b', 'employe');
CREATE TYPE company_type AS ENUM ('prestataire', 'client');
CREATE TYPE variable_status AS ENUM ('draft', 'submitted', 'validated');
CREATE TYPE payslip_status AS ENUM ('draft', 'generated', 'sent', 'viewed');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- ÉTAPE 3: Créer les tables
-- =====================================================

-- Table des entreprises
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type company_type NOT NULL,
    parent_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    siret TEXT,
    urssaf_number TEXT,
    legal_status TEXT, -- SAS, SARL, SA, etc.
    address TEXT,
    postal_code TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    contact_name TEXT,
    plan TEXT DEFAULT 'Starter', -- Starter, Pro, Business, Essai
    subscription_amount DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, trial, expired, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des utilisateurs (étend auth.users de Supabase)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    user_type user_type NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    employee_id UUID, -- Lien vers l'employé si user_type = 'employe'
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des employés
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    employer_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    contract_type TEXT NOT NULL DEFAULT 'CDI', -- CDI, CDD, Freelance
    hire_date DATE NOT NULL,
    status TEXT DEFAULT 'active', -- active, inactive
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter la référence employee_id après création de la table employees
ALTER TABLE users ADD CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Table des variables mensuelles
CREATE TABLE monthly_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month VARCHAR(2) NOT NULL, -- '01' à '12'
    year INTEGER NOT NULL,
    hours_worked DECIMAL(10,2) NOT NULL DEFAULT 151.67,
    overtime_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    vacation_days INTEGER NOT NULL DEFAULT 0,
    sick_days INTEGER NOT NULL DEFAULT 0,
    bonuses DECIMAL(10,2) NOT NULL DEFAULT 0,
    status variable_status NOT NULL DEFAULT 'draft',
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, month, year)
);

-- Table des bulletins de paie
CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    monthly_variables_id UUID REFERENCES monthly_variables(id) ON DELETE SET NULL,
    month VARCHAR(2) NOT NULL,
    year INTEGER NOT NULL,
    gross_salary DECIMAL(10,2) NOT NULL,
    net_salary DECIMAL(10,2) NOT NULL,
    pdf_url TEXT,
    status payslip_status NOT NULL DEFAULT 'generated',
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, month, year)
);

-- Table des factures
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    client_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    issuer_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    month VARCHAR(2) NOT NULL,
    year INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status NOT NULL DEFAULT 'draft',
    paid_at TIMESTAMPTZ,
    pdf_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des invitations
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    phone TEXT,
    invite_type user_type NOT NULL, -- Type d'utilisateur invité
    status invitation_status NOT NULL DEFAULT 'pending',
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    invited_by_type user_type NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL, -- Entreprise à laquelle l'invité sera rattaché
    token TEXT UNIQUE, -- Token unique pour le lien d'invitation
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des factures d'abonnement PayFlow (Admin -> Société A)
CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE, -- Société A facturée
    plan TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    period TEXT NOT NULL, -- "Janvier 2025", etc.
    status invoice_status NOT NULL DEFAULT 'sent',
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÉTAPE 4: Créer les index pour les performances
-- =====================================================
CREATE INDEX idx_companies_parent ON companies(parent_company_id);
CREATE INDEX idx_companies_type ON companies(type);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_employees_employer ON employees(employer_company_id);
CREATE INDEX idx_employees_client ON employees(client_company_id);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_monthly_variables_employee ON monthly_variables(employee_id);
CREATE INDEX idx_monthly_variables_period ON monthly_variables(year, month);
CREATE INDEX idx_payslips_employee ON payslips(employee_id);
CREATE INDEX idx_payslips_period ON payslips(year, month);
CREATE INDEX idx_invoices_client ON invoices(client_company_id);
CREATE INDEX idx_invoices_issuer ON invoices(issuer_company_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_subscription_invoices_company ON subscription_invoices(company_id);

-- ÉTAPE 5: Trigger pour mettre à jour updated_at automatiquement
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_variables_updated_at BEFORE UPDATE ON monthly_variables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payslips_updated_at BEFORE UPDATE ON payslips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_invoices_updated_at BEFORE UPDATE ON subscription_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ÉTAPE 6: Activer Row Level Security (RLS)
-- =====================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 7: Politiques de sécurité RLS
-- =====================================================

-- Fonction helper pour obtenir le type d'utilisateur
CREATE OR REPLACE FUNCTION get_user_type()
RETURNS user_type AS $$
BEGIN
    RETURN (SELECT user_type FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour obtenir l'ID de l'entreprise de l'utilisateur
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT company_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- COMPANIES Policies
CREATE POLICY "Tout le monde peut voir les entreprises" ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin peut tout gérer" ON companies FOR ALL TO authenticated USING (get_user_type() = 'admin_app');
CREATE POLICY "Société A peut gérer ses clients" ON companies FOR ALL TO authenticated
    USING (get_user_type() = 'societe_a' AND (type = 'client' OR id = get_user_company_id()));

-- USERS Policies
CREATE POLICY "Utilisateur voit son profil" ON users FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admin voit tous les utilisateurs" ON users FOR SELECT TO authenticated USING (get_user_type() = 'admin_app');
CREATE POLICY "Société A voit ses utilisateurs" ON users FOR SELECT TO authenticated
    USING (get_user_type() = 'societe_a');
CREATE POLICY "Utilisateur peut modifier son profil" ON users FOR UPDATE TO authenticated USING (id = auth.uid());

-- EMPLOYEES Policies
CREATE POLICY "Société A gère tous les employés" ON employees FOR ALL TO authenticated USING (get_user_type() = 'societe_a');
CREATE POLICY "Société B voit ses employés" ON employees FOR SELECT TO authenticated
    USING (get_user_type() = 'societe_b' AND client_company_id = get_user_company_id());
CREATE POLICY "Employé voit sa fiche" ON employees FOR SELECT TO authenticated
    USING (get_user_type() = 'employe' AND user_id = auth.uid());

-- MONTHLY_VARIABLES Policies
CREATE POLICY "Société A gère toutes les variables" ON monthly_variables FOR ALL TO authenticated USING (get_user_type() = 'societe_a');
CREATE POLICY "Société B gère les variables de ses employés" ON monthly_variables FOR ALL TO authenticated
    USING (get_user_type() = 'societe_b' AND EXISTS (
        SELECT 1 FROM employees WHERE employees.id = monthly_variables.employee_id AND employees.client_company_id = get_user_company_id()
    ));
CREATE POLICY "Employé voit ses variables" ON monthly_variables FOR SELECT TO authenticated
    USING (get_user_type() = 'employe' AND EXISTS (
        SELECT 1 FROM employees WHERE employees.id = monthly_variables.employee_id AND employees.user_id = auth.uid()
    ));

-- PAYSLIPS Policies
CREATE POLICY "Société A gère tous les bulletins" ON payslips FOR ALL TO authenticated USING (get_user_type() = 'societe_a');
CREATE POLICY "Employé voit ses bulletins" ON payslips FOR SELECT TO authenticated
    USING (get_user_type() = 'employe' AND EXISTS (
        SELECT 1 FROM employees WHERE employees.id = payslips.employee_id AND employees.user_id = auth.uid()
    ));

-- INVOICES Policies
CREATE POLICY "Société A gère toutes les factures" ON invoices FOR ALL TO authenticated USING (get_user_type() = 'societe_a');
CREATE POLICY "Société B voit ses factures" ON invoices FOR SELECT TO authenticated
    USING (get_user_type() = 'societe_b' AND client_company_id = get_user_company_id());

-- INVITATIONS Policies
CREATE POLICY "Admin gère les invitations Société A" ON invitations FOR ALL TO authenticated
    USING (get_user_type() = 'admin_app');
CREATE POLICY "Société A gère ses invitations" ON invitations FOR ALL TO authenticated
    USING (get_user_type() = 'societe_a' AND invited_by = auth.uid());
CREATE POLICY "Société B gère ses invitations" ON invitations FOR ALL TO authenticated
    USING (get_user_type() = 'societe_b' AND invited_by = auth.uid());

-- SUBSCRIPTION_INVOICES Policies
CREATE POLICY "Admin gère les factures d'abonnement" ON subscription_invoices FOR ALL TO authenticated
    USING (get_user_type() = 'admin_app');
CREATE POLICY "Société A voit ses factures d'abonnement" ON subscription_invoices FOR SELECT TO authenticated
    USING (get_user_type() = 'societe_a' AND company_id = get_user_company_id());

-- ÉTAPE 8: Données de démonstration (optionnel)
-- =====================================================
-- Décommentez cette section pour insérer des données de test

/*
-- Société A (Prestataire de paie)
INSERT INTO companies (id, name, type, siret, legal_status, address, postal_code, city, phone, email, contact_name, plan, subscription_amount, status)
VALUES ('11111111-1111-1111-1111-111111111111', 'TalentFlow SAS', 'prestataire', '12345678901234', 'SAS', '10 rue de la Paix', '75001', 'Paris', '01 23 45 67 89', 'contact@talentflow.fr', 'Jean Directeur', 'Business', 299, 'active');

-- Sociétés B (Clients)
INSERT INTO companies (id, name, type, parent_company_id, siret, legal_status, address, postal_code, city, phone, email, contact_name)
VALUES
    ('22222222-2222-2222-2222-222222222222', 'TechCorp Industries', 'client', '11111111-1111-1111-1111-111111111111', '98765432109876', 'SA', '25 avenue des Champs-Élysées', '75008', 'Paris', '01 98 76 54 32', 'rh@techcorp.fr', 'Marie RH'),
    ('33333333-3333-3333-3333-333333333333', 'Green Solutions', 'client', '11111111-1111-1111-1111-111111111111', '55555555555555', 'SARL', '5 rue Verte', '69001', 'Lyon', '04 55 55 55 55', 'contact@greensolutions.fr', 'Paul Vert'),
    ('44444444-4444-4444-4444-444444444444', 'DataMinds Consulting', 'client', '11111111-1111-1111-1111-111111111111', '44444444444444', 'SAS', '100 boulevard Data', '31000', 'Toulouse', '05 44 44 44 44', 'info@dataminds.fr', 'Sophie Data');

-- Employés
INSERT INTO employees (id, employer_company_id, client_company_id, full_name, email, position, hourly_rate, contract_type, hire_date)
VALUES
    ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Marie Dupont', 'marie.dupont@email.fr', 'Développeuse Senior', 45.00, 'CDI', '2023-03-15'),
    ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Thomas Martin', 'thomas.martin@email.fr', 'Chef de Projet', 52.00, 'CDI', '2022-09-01'),
    ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Sophie Bernard', 'sophie.bernard@email.fr', 'Consultante RH', 38.00, 'CDI', '2024-01-10'),
    ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Lucas Petit', 'lucas.petit@email.fr', 'Data Analyst', 42.00, 'CDI', '2023-06-20'),
    ('aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Emma Laurent', 'emma.laurent@email.fr', 'UX Designer', 40.00, 'CDI', '2023-11-01');
*/

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
-- Votre base de données est maintenant prête !
--
-- Prochaines étapes :
-- 1. Créez un utilisateur admin dans Authentication > Users
-- 2. Ajoutez-le manuellement dans la table 'users' avec user_type = 'admin_app'
-- =====================================================
