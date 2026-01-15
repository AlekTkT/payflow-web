-- PayFlow Database Schema
-- Run this SQL in your Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_type AS ENUM ('societe_a', 'societe_b', 'employe');
CREATE TYPE company_type AS ENUM ('prestataire', 'client');
CREATE TYPE variable_status AS ENUM ('draft', 'submitted', 'validated');
CREATE TYPE payslip_status AS ENUM ('generated', 'sent', 'viewed');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');

-- ============================================
-- TABLES
-- ============================================

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type company_type NOT NULL,
    parent_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    user_type user_type NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    employer_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    client_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    position TEXT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    contract_type TEXT NOT NULL DEFAULT 'CDI',
    hire_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly variables table
CREATE TABLE monthly_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month VARCHAR(2) NOT NULL, -- '01' to '12'
    year INTEGER NOT NULL,
    hours_worked DECIMAL(10,2) NOT NULL DEFAULT 151.67,
    overtime_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    vacation_days INTEGER NOT NULL DEFAULT 0,
    sick_days INTEGER NOT NULL DEFAULT 0,
    bonuses DECIMAL(10,2) NOT NULL DEFAULT 0,
    status variable_status NOT NULL DEFAULT 'draft',
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, month, year)
);

-- Payslips table
CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    monthly_variables_id UUID NOT NULL REFERENCES monthly_variables(id) ON DELETE CASCADE,
    month VARCHAR(2) NOT NULL,
    year INTEGER NOT NULL,
    gross_salary DECIMAL(10,2) NOT NULL,
    net_salary DECIMAL(10,2) NOT NULL,
    pdf_url TEXT,
    status payslip_status NOT NULL DEFAULT 'generated',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, month, year)
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT NOT NULL UNIQUE,
    client_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    issuer_company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    month VARCHAR(2) NOT NULL,
    year INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status NOT NULL DEFAULT 'draft',
    paid_at TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_companies_parent ON companies(parent_company_id);
CREATE INDEX idx_companies_type ON companies(type);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_employees_employer ON employees(employer_company_id);
CREATE INDEX idx_employees_client ON employees(client_company_id);
CREATE INDEX idx_monthly_variables_employee ON monthly_variables(employee_id);
CREATE INDEX idx_monthly_variables_period ON monthly_variables(year, month);
CREATE INDEX idx_payslips_employee ON payslips(employee_id);
CREATE INDEX idx_payslips_period ON payslips(year, month);
CREATE INDEX idx_invoices_client ON invoices(client_company_id);
CREATE INDEX idx_invoices_issuer ON invoices(issuer_company_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_variables_updated_at
    BEFORE UPDATE ON monthly_variables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payslips_updated_at
    BEFORE UPDATE ON payslips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Companies are viewable by authenticated users"
    ON companies FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Prestataires can manage companies"
    ON companies FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.user_type = 'societe_a'
        )
    );

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Prestataires can view all users"
    ON users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.user_type = 'societe_a'
        )
    );

-- Employees policies
CREATE POLICY "Prestataires can manage all employees"
    ON employees FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.user_type = 'societe_a'
        )
    );

CREATE POLICY "Clients can view their employees"
    ON employees FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.company_id = employees.client_company_id
        )
    );

CREATE POLICY "Employees can view their own record"
    ON employees FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Monthly variables policies
CREATE POLICY "Prestataires can manage all variables"
    ON monthly_variables FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.user_type = 'societe_a'
        )
    );

CREATE POLICY "Clients can manage their employees variables"
    ON monthly_variables FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN employees e ON e.client_company_id = u.company_id
            WHERE u.id = auth.uid()
            AND u.user_type = 'societe_b'
            AND e.id = monthly_variables.employee_id
        )
    );

-- Payslips policies
CREATE POLICY "Prestataires can manage all payslips"
    ON payslips FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.user_type = 'societe_a'
        )
    );

CREATE POLICY "Employees can view their own payslips"
    ON payslips FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.id = payslips.employee_id
            AND employees.user_id = auth.uid()
        )
    );

-- Invoices policies
CREATE POLICY "Prestataires can manage all invoices"
    ON invoices FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.user_type = 'societe_a'
        )
    );

CREATE POLICY "Clients can view their invoices"
    ON invoices FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.company_id = invoices.client_company_id
        )
    );

-- ============================================
-- SEED DATA (for demonstration)
-- ============================================

-- Insert prestataire company
INSERT INTO companies (id, name, type) VALUES
    ('11111111-1111-1111-1111-111111111111', 'TalentFlow SAS', 'prestataire');

-- Insert client companies
INSERT INTO companies (id, name, type, parent_company_id) VALUES
    ('22222222-2222-2222-2222-222222222222', 'TechCorp Industries', 'client', '11111111-1111-1111-1111-111111111111'),
    ('33333333-3333-3333-3333-333333333333', 'Green Solutions', 'client', '11111111-1111-1111-1111-111111111111'),
    ('44444444-4444-4444-4444-444444444444', 'DataMinds Consulting', 'client', '11111111-1111-1111-1111-111111111111');

-- Insert employees
INSERT INTO employees (id, employer_company_id, client_company_id, full_name, position, hourly_rate, contract_type, hire_date) VALUES
    ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Marie Dupont', 'Développeuse Senior', 45.00, 'CDI', '2023-03-15'),
    ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Thomas Martin', 'Chef de Projet', 52.00, 'CDI', '2022-09-01'),
    ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Sophie Bernard', 'Consultante RH', 38.00, 'CDI', '2024-01-10'),
    ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Lucas Petit', 'Data Analyst', 42.00, 'CDI', '2023-06-20'),
    ('aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Emma Laurent', 'UX Designer', 40.00, 'CDI', '2023-11-01');

-- Insert sample monthly variables
INSERT INTO monthly_variables (employee_id, month, year, hours_worked, overtime_hours, vacation_days, sick_days, bonuses, status) VALUES
    ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '01', 2025, 151.67, 0, 0, 0, 0, 'draft'),
    ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '01', 2025, 160.00, 8, 0, 0, 800, 'submitted'),
    ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '01', 2025, 147.00, 0, 3, 0, 200, 'validated'),
    ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '12', 2024, 151.67, 0, 2, 0, 500, 'validated'),
    ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '12', 2024, 160.00, 10, 0, 0, 800, 'validated');

-- Insert sample invoices
INSERT INTO invoices (invoice_number, client_company_id, issuer_company_id, month, year, amount, due_date, status) VALUES
    ('FAC-2025-0001', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '01', 2025, 89500.00, '2025-01-15', 'sent'),
    ('FAC-2025-0002', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '01', 2025, 52300.00, '2025-01-12', 'paid'),
    ('FAC-2025-0003', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '01', 2025, 124800.00, '2025-01-18', 'sent'),
    ('FAC-2024-0045', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '12', 2024, 87200.00, '2024-12-15', 'paid'),
    ('FAC-2024-0044', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '12', 2024, 51800.00, '2024-12-12', 'overdue');
