-- =============================================
-- PayFlow - Script de configuration Supabase
-- =============================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- Dashboard > SQL Editor > New Query > Coller ce script > Run

-- 1. CRÉATION DES TYPES ENUM
-- =============================================

CREATE TYPE user_type AS ENUM ('admin_app', 'societe_a', 'societe_b', 'employe');
CREATE TYPE company_type AS ENUM ('prestataire', 'client');
CREATE TYPE variable_status AS ENUM ('draft', 'submitted', 'validated');
CREATE TYPE payslip_status AS ENUM ('generated', 'sent', 'viewed');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- 2. TABLE USERS (utilisateurs)
-- =============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  user_type user_type NOT NULL DEFAULT 'employe',
  company_id UUID,
  phone TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE COMPANIES (entreprises)
-- =============================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type company_type NOT NULL,
  parent_company_id UUID REFERENCES companies(id),
  siret TEXT,
  urssaf_number TEXT,
  legal_status TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  contact_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter la foreign key après création de la table
ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id);

-- 4. TABLE EMPLOYEES (employés/salariés portés)
-- =============================================

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  employer_company_id UUID NOT NULL REFERENCES companies(id),
  client_company_id UUID NOT NULL REFERENCES companies(id),
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  contract_type TEXT NOT NULL,
  hire_date DATE NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE MONTHLY_VARIABLES (variables mensuelles)
-- =============================================

CREATE TABLE monthly_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  hours_worked DECIMAL(10,2) NOT NULL,
  overtime_hours DECIMAL(10,2) DEFAULT 0,
  vacation_days INTEGER DEFAULT 0,
  sick_days INTEGER DEFAULT 0,
  bonuses DECIMAL(10,2) DEFAULT 0,
  status variable_status DEFAULT 'draft',
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, month, year)
);

-- 6. TABLE PAYSLIPS (bulletins de paie)
-- =============================================

CREATE TABLE payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  monthly_variables_id UUID REFERENCES monthly_variables(id),
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  gross_salary DECIMAL(10,2) NOT NULL,
  net_salary DECIMAL(10,2) NOT NULL,
  pdf_url TEXT,
  status payslip_status DEFAULT 'generated',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLE INVOICES (factures)
-- =============================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  client_company_id UUID NOT NULL REFERENCES companies(id),
  issuer_company_id UUID NOT NULL REFERENCES companies(id),
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status invoice_status DEFAULT 'draft',
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLE INVITATIONS (invitations utilisateurs)
-- =============================================

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_type user_type NOT NULL,
  company_id UUID REFERENCES companies(id),
  employee_id UUID REFERENCES employees(id),
  invited_by UUID NOT NULL REFERENCES users(id),
  status invitation_status DEFAULT 'pending',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. INDEX POUR PERFORMANCES
-- =============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_employees_employer ON employees(employer_company_id);
CREATE INDEX idx_employees_client ON employees(client_company_id);
CREATE INDEX idx_payslips_employee ON payslips(employee_id);
CREATE INDEX idx_payslips_month_year ON payslips(month, year);
CREATE INDEX idx_invoices_client ON invoices(client_company_id);
CREATE INDEX idx_invoices_issuer ON invoices(issuer_company_id);
CREATE INDEX idx_monthly_variables_employee ON monthly_variables(employee_id);

-- 10. TRIGGER POUR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payslips_updated_at BEFORE UPDATE ON payslips FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_monthly_variables_updated_at BEFORE UPDATE ON monthly_variables FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 11. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture (à ajuster selon vos besoins)
CREATE POLICY "Allow read access" ON users FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON employees FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON payslips FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON invoices FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON monthly_variables FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON invitations FOR SELECT USING (true);

-- Politique pour permettre l'écriture (à ajuster selon vos besoins)
CREATE POLICY "Allow insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow insert" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON companies FOR UPDATE USING (true);
CREATE POLICY "Allow insert" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON employees FOR UPDATE USING (true);
CREATE POLICY "Allow insert" ON payslips FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON payslips FOR UPDATE USING (true);
CREATE POLICY "Allow insert" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON invoices FOR UPDATE USING (true);
CREATE POLICY "Allow insert" ON monthly_variables FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON monthly_variables FOR UPDATE USING (true);
CREATE POLICY "Allow insert" ON invitations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update" ON invitations FOR UPDATE USING (true);

-- 12. DONNÉES DE TEST (optionnel)
-- =============================================

-- Société A (Prestataire de paie)
INSERT INTO companies (id, name, type, siret, legal_status, address, postal_code, city, phone, email, contact_name)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'TalentFlow SAS', 'prestataire', '123 456 789 00012', 'SAS', '15 rue de la Paie', '75001', 'Paris', '01 23 45 67 89', 'contact@talentflow.fr', 'Jean Martin');

-- Société B (Client employeur)
INSERT INTO companies (id, name, type, parent_company_id, siret, legal_status, address, postal_code, city, phone, email, contact_name)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'TechCorp Industries', 'client', '11111111-1111-1111-1111-111111111111', '987 654 321 00034', 'SARL', '42 avenue des Techs', '69001', 'Lyon', '04 56 78 90 12', 'rh@techcorp.fr', 'Sophie Durand');

-- Utilisateur Admin App
INSERT INTO users (id, email, full_name, user_type)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@payflow.fr', 'Admin PayFlow', 'admin_app');

-- Utilisateur Société A
INSERT INTO users (id, email, full_name, user_type, company_id)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'admin@talentflow.fr', 'Jean Martin', 'societe_a', '11111111-1111-1111-1111-111111111111');

-- Utilisateur Société B
INSERT INTO users (id, email, full_name, user_type, company_id)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'sophie@techcorp.fr', 'Sophie Durand', 'societe_b', '22222222-2222-2222-2222-222222222222');

-- Employé
INSERT INTO employees (id, employer_company_id, client_company_id, full_name, position, hourly_rate, contract_type, hire_date, email, phone)
VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Marie Dupont', 'Développeuse Senior', 45.00, 'CDI', '2023-01-15', 'marie.dupont@email.com', '06 12 34 56 78');

-- Utilisateur Employé
INSERT INTO users (id, email, full_name, user_type, company_id)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'marie.dupont@email.com', 'Marie Dupont', 'employe', '11111111-1111-1111-1111-111111111111');

-- Mettre à jour l'employé avec le user_id
UPDATE employees SET user_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

-- Bulletin de paie de test
INSERT INTO payslips (employee_id, month, year, gross_salary, net_salary, status)
VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '01', 2025, 4500.00, 3510.00, 'sent'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '12', 2024, 4500.00, 3510.00, 'viewed');

-- Facture de test
INSERT INTO invoices (invoice_number, client_company_id, issuer_company_id, month, year, amount, due_date, status)
VALUES
  ('FAC-2025-001', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '01', 2025, 5850.00, '2025-02-15', 'sent');

-- =============================================
-- FIN DU SCRIPT
-- =============================================
