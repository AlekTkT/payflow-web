/**
 * Données de démonstration centralisées pour PayFlow
 * Toutes les données sont cohérentes entre elles avec des IDs et relations valides
 */

import type {
  Company,
  Employee,
  MonthlyVariables,
  Payslip,
  Invoice,
  EmployeeWithDetails,
  InvoiceWithDetails,
} from '../database.types';

// ============ CONSTANTES D'IDS ============
// IDs fixes pour garantir la cohérence des relations

export const DEMO_IDS = {
  // Société A (Prestataire de paie) - TalentFlow
  SOCIETE_A: '11111111-1111-1111-1111-111111111111',

  // Sociétés B (Clients)
  SOCIETE_B_TECHCORP: '22222222-2222-2222-2222-222222222222',
  SOCIETE_B_GREEN: '33333333-3333-3333-3333-333333333333',
  SOCIETE_B_DATAMINDS: '44444444-4444-4444-4444-444444444444',

  // Employés
  EMP_MARIE_DUPONT: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  EMP_THOMAS_MARTIN: 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  EMP_SOPHIE_BERNARD: 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  EMP_LUCAS_PETIT: 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  EMP_EMMA_LAURENT: 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa',

  // Users pour login
  USER_ADMIN: 'demo-admin_app',
  USER_SOCIETE_A: 'demo-societe_a',
  USER_SOCIETE_B: 'demo-societe_b',
  USER_EMPLOYE: 'demo-employe',
};

// ============ ENTREPRISES ============

export const DEMO_COMPANIES: Company[] = [
  // Société A - Le prestataire de paie
  {
    id: DEMO_IDS.SOCIETE_A,
    name: 'TalentFlow SAS',
    type: 'prestataire',
    parent_company_id: null,
    siret: '12345678901234',
    urssaf_number: 'URF123456789',
    legal_status: 'SAS',
    address: '10 rue de la Paix',
    postal_code: '75001',
    city: 'Paris',
    phone: '01 23 45 67 89',
    email: 'contact@talentflow.fr',
    contact_name: 'Jean Directeur',
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  // Société B #1 - TechCorp (client principal)
  {
    id: DEMO_IDS.SOCIETE_B_TECHCORP,
    name: 'TechCorp Industries',
    type: 'client',
    parent_company_id: DEMO_IDS.SOCIETE_A,
    siret: '98765432109876',
    urssaf_number: 'URF987654321',
    legal_status: 'SA',
    address: '25 avenue des Champs-Élysées',
    postal_code: '75008',
    city: 'Paris',
    phone: '01 98 76 54 32',
    email: 'rh@techcorp.fr',
    contact_name: 'Marie RH',
    created_at: '2023-03-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  // Société B #2 - Green Solutions
  {
    id: DEMO_IDS.SOCIETE_B_GREEN,
    name: 'Green Solutions',
    type: 'client',
    parent_company_id: DEMO_IDS.SOCIETE_A,
    siret: '55555555555555',
    urssaf_number: 'URF555555555',
    legal_status: 'SARL',
    address: '5 rue Verte',
    postal_code: '69001',
    city: 'Lyon',
    phone: '04 55 55 55 55',
    email: 'contact@greensolutions.fr',
    contact_name: 'Paul Vert',
    created_at: '2023-06-15T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  // Société B #3 - DataMinds
  {
    id: DEMO_IDS.SOCIETE_B_DATAMINDS,
    name: 'DataMinds Consulting',
    type: 'client',
    parent_company_id: DEMO_IDS.SOCIETE_A,
    siret: '44444444444444',
    urssaf_number: 'URF444444444',
    legal_status: 'SAS',
    address: '100 boulevard Data',
    postal_code: '31000',
    city: 'Toulouse',
    phone: '05 44 44 44 44',
    email: 'info@dataminds.fr',
    contact_name: 'Sophie Data',
    created_at: '2023-09-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
];

// Helper pour récupérer une entreprise par ID
const getCompany = (id: string): Company => DEMO_COMPANIES.find(c => c.id === id)!;

// ============ EMPLOYÉS ============

export const DEMO_EMPLOYEES: EmployeeWithDetails[] = [
  // Marie Dupont - Dev Senior chez TechCorp (utilisée pour le profil Employé)
  {
    id: DEMO_IDS.EMP_MARIE_DUPONT,
    user_id: DEMO_IDS.USER_EMPLOYE,
    employer_company_id: DEMO_IDS.SOCIETE_A,
    client_company_id: DEMO_IDS.SOCIETE_B_TECHCORP,
    full_name: 'Marie Dupont',
    position: 'Développeuse Senior',
    hourly_rate: 45.00,
    contract_type: 'CDI',
    hire_date: '2023-03-15',
    created_at: '2023-03-15T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    employer_company: getCompany(DEMO_IDS.SOCIETE_A),
    client_company: getCompany(DEMO_IDS.SOCIETE_B_TECHCORP),
  },
  // Thomas Martin - Chef de projet chez TechCorp
  {
    id: DEMO_IDS.EMP_THOMAS_MARTIN,
    user_id: null,
    employer_company_id: DEMO_IDS.SOCIETE_A,
    client_company_id: DEMO_IDS.SOCIETE_B_TECHCORP,
    full_name: 'Thomas Martin',
    position: 'Chef de Projet',
    hourly_rate: 52.00,
    contract_type: 'CDI',
    hire_date: '2022-09-01',
    created_at: '2022-09-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    employer_company: getCompany(DEMO_IDS.SOCIETE_A),
    client_company: getCompany(DEMO_IDS.SOCIETE_B_TECHCORP),
  },
  // Sophie Bernard - Consultante RH chez Green Solutions
  {
    id: DEMO_IDS.EMP_SOPHIE_BERNARD,
    user_id: null,
    employer_company_id: DEMO_IDS.SOCIETE_A,
    client_company_id: DEMO_IDS.SOCIETE_B_GREEN,
    full_name: 'Sophie Bernard',
    position: 'Consultante RH',
    hourly_rate: 38.00,
    contract_type: 'CDI',
    hire_date: '2024-01-10',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
    employer_company: getCompany(DEMO_IDS.SOCIETE_A),
    client_company: getCompany(DEMO_IDS.SOCIETE_B_GREEN),
  },
  // Lucas Petit - Data Analyst chez DataMinds
  {
    id: DEMO_IDS.EMP_LUCAS_PETIT,
    user_id: null,
    employer_company_id: DEMO_IDS.SOCIETE_A,
    client_company_id: DEMO_IDS.SOCIETE_B_DATAMINDS,
    full_name: 'Lucas Petit',
    position: 'Data Analyst',
    hourly_rate: 42.00,
    contract_type: 'CDI',
    hire_date: '2023-06-20',
    created_at: '2023-06-20T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    employer_company: getCompany(DEMO_IDS.SOCIETE_A),
    client_company: getCompany(DEMO_IDS.SOCIETE_B_DATAMINDS),
  },
  // Emma Laurent - UX Designer chez TechCorp
  {
    id: DEMO_IDS.EMP_EMMA_LAURENT,
    user_id: null,
    employer_company_id: DEMO_IDS.SOCIETE_A,
    client_company_id: DEMO_IDS.SOCIETE_B_TECHCORP,
    full_name: 'Emma Laurent',
    position: 'UX Designer',
    hourly_rate: 40.00,
    contract_type: 'CDI',
    hire_date: '2023-11-01',
    created_at: '2023-11-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    employer_company: getCompany(DEMO_IDS.SOCIETE_A),
    client_company: getCompany(DEMO_IDS.SOCIETE_B_TECHCORP),
  },
];

// Helper pour récupérer un employé par ID
const getEmployee = (id: string): EmployeeWithDetails => DEMO_EMPLOYEES.find(e => e.id === id)!;

// ============ VARIABLES MENSUELLES ============

const currentYear = new Date().getFullYear();
const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
const lastMonth = String(new Date().getMonth() || 12).padStart(2, '0');
const lastMonthYear = new Date().getMonth() === 0 ? currentYear - 1 : currentYear;

export const DEMO_MONTHLY_VARIABLES: MonthlyVariables[] = [
  // Mois courant - Marie Dupont (validée)
  {
    id: 'mv-marie-current',
    employee_id: DEMO_IDS.EMP_MARIE_DUPONT,
    month: currentMonth,
    year: currentYear,
    hours_worked: 151.67,
    overtime_hours: 8,
    vacation_days: 0,
    sick_days: 0,
    bonuses: 500,
    status: 'validated',
    submitted_by: DEMO_IDS.USER_SOCIETE_B,
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Mois courant - Thomas Martin (soumise, en attente de validation)
  {
    id: 'mv-thomas-current',
    employee_id: DEMO_IDS.EMP_THOMAS_MARTIN,
    month: currentMonth,
    year: currentYear,
    hours_worked: 160,
    overtime_hours: 12,
    vacation_days: 0,
    sick_days: 0,
    bonuses: 750,
    status: 'submitted',
    submitted_by: DEMO_IDS.USER_SOCIETE_B,
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Mois courant - Sophie Bernard (brouillon)
  {
    id: 'mv-sophie-current',
    employee_id: DEMO_IDS.EMP_SOPHIE_BERNARD,
    month: currentMonth,
    year: currentYear,
    hours_worked: 140,
    overtime_hours: 0,
    vacation_days: 2,
    sick_days: 0,
    bonuses: 0,
    status: 'draft',
    submitted_by: null,
    submitted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Mois courant - Lucas Petit (validée)
  {
    id: 'mv-lucas-current',
    employee_id: DEMO_IDS.EMP_LUCAS_PETIT,
    month: currentMonth,
    year: currentYear,
    hours_worked: 151.67,
    overtime_hours: 5,
    vacation_days: 0,
    sick_days: 1,
    bonuses: 200,
    status: 'validated',
    submitted_by: DEMO_IDS.USER_SOCIETE_B,
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Mois courant - Emma Laurent (soumise)
  {
    id: 'mv-emma-current',
    employee_id: DEMO_IDS.EMP_EMMA_LAURENT,
    month: currentMonth,
    year: currentYear,
    hours_worked: 151.67,
    overtime_hours: 0,
    vacation_days: 0,
    sick_days: 0,
    bonuses: 0,
    status: 'submitted',
    submitted_by: DEMO_IDS.USER_SOCIETE_B,
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Mois précédent - tous validés
  {
    id: 'mv-marie-last',
    employee_id: DEMO_IDS.EMP_MARIE_DUPONT,
    month: lastMonth,
    year: lastMonthYear,
    hours_worked: 151.67,
    overtime_hours: 5,
    vacation_days: 0,
    sick_days: 0,
    bonuses: 0,
    status: 'validated',
    submitted_by: DEMO_IDS.USER_SOCIETE_B,
    submitted_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 25).toISOString(),
    created_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 20).toISOString(),
    updated_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 28).toISOString(),
  },
  {
    id: 'mv-thomas-last',
    employee_id: DEMO_IDS.EMP_THOMAS_MARTIN,
    month: lastMonth,
    year: lastMonthYear,
    hours_worked: 160,
    overtime_hours: 10,
    vacation_days: 0,
    sick_days: 0,
    bonuses: 500,
    status: 'validated',
    submitted_by: DEMO_IDS.USER_SOCIETE_B,
    submitted_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 25).toISOString(),
    created_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 20).toISOString(),
    updated_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 28).toISOString(),
  },
];

// ============ BULLETINS DE PAIE ============

type PayslipWithEmployee = Payslip & { employee: Employee };

export const DEMO_PAYSLIPS: PayslipWithEmployee[] = [
  // Mois courant - Marie Dupont
  {
    id: 'ps-marie-current',
    employee_id: DEMO_IDS.EMP_MARIE_DUPONT,
    monthly_variables_id: 'mv-marie-current',
    month: currentMonth,
    year: currentYear,
    gross_salary: 7185, // (151.67 + 8) * 45 + 500
    net_salary: 5604,
    pdf_url: null,
    status: 'generated',
    sent_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: getEmployee(DEMO_IDS.EMP_MARIE_DUPONT),
  },
  // Mois courant - Lucas Petit
  {
    id: 'ps-lucas-current',
    employee_id: DEMO_IDS.EMP_LUCAS_PETIT,
    monthly_variables_id: 'mv-lucas-current',
    month: currentMonth,
    year: currentYear,
    gross_salary: 6780, // (151.67 + 5) * 42 + 200 - (1 jour maladie)
    net_salary: 5288,
    pdf_url: null,
    status: 'sent',
    sent_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: getEmployee(DEMO_IDS.EMP_LUCAS_PETIT),
  },
  // Mois précédent - Marie Dupont
  {
    id: 'ps-marie-last',
    employee_id: DEMO_IDS.EMP_MARIE_DUPONT,
    monthly_variables_id: 'mv-marie-last',
    month: lastMonth,
    year: lastMonthYear,
    gross_salary: 7050,
    net_salary: 5499,
    pdf_url: null,
    status: 'viewed',
    sent_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 28).toISOString(),
    created_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 28).toISOString(),
    updated_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 28).toISOString(),
    employee: getEmployee(DEMO_IDS.EMP_MARIE_DUPONT),
  },
  // Mois précédent - Thomas Martin
  {
    id: 'ps-thomas-last',
    employee_id: DEMO_IDS.EMP_THOMAS_MARTIN,
    monthly_variables_id: 'mv-thomas-last',
    month: lastMonth,
    year: lastMonthYear,
    gross_salary: 9340, // (160 + 10) * 52 + 500
    net_salary: 7285,
    pdf_url: null,
    status: 'viewed',
    sent_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 28).toISOString(),
    created_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 28).toISOString(),
    updated_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 28).toISOString(),
    employee: getEmployee(DEMO_IDS.EMP_THOMAS_MARTIN),
  },
];

// ============ FACTURES ============

export const DEMO_INVOICES: InvoiceWithDetails[] = [
  // Mois courant - TechCorp (envoyée, en attente)
  {
    id: 'inv-techcorp-current',
    invoice_number: `FAC-${currentYear}-0001`,
    client_company_id: DEMO_IDS.SOCIETE_B_TECHCORP,
    issuer_company_id: DEMO_IDS.SOCIETE_A,
    month: currentMonth,
    year: currentYear,
    amount: 24850.00, // 3 employés
    due_date: new Date(currentYear, parseInt(currentMonth) - 1, 15).toISOString().split('T')[0],
    status: 'sent',
    paid_at: null,
    pdf_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client_company: getCompany(DEMO_IDS.SOCIETE_B_TECHCORP),
    issuer_company: getCompany(DEMO_IDS.SOCIETE_A),
  },
  // Mois courant - Green Solutions (payée)
  {
    id: 'inv-green-current',
    invoice_number: `FAC-${currentYear}-0002`,
    client_company_id: DEMO_IDS.SOCIETE_B_GREEN,
    issuer_company_id: DEMO_IDS.SOCIETE_A,
    month: currentMonth,
    year: currentYear,
    amount: 5320.00, // 1 employé
    due_date: new Date(currentYear, parseInt(currentMonth) - 1, 12).toISOString().split('T')[0],
    status: 'paid',
    paid_at: new Date(currentYear, parseInt(currentMonth) - 1, 10).toISOString(),
    pdf_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client_company: getCompany(DEMO_IDS.SOCIETE_B_GREEN),
    issuer_company: getCompany(DEMO_IDS.SOCIETE_A),
  },
  // Mois courant - DataMinds (envoyée)
  {
    id: 'inv-dataminds-current',
    invoice_number: `FAC-${currentYear}-0003`,
    client_company_id: DEMO_IDS.SOCIETE_B_DATAMINDS,
    issuer_company_id: DEMO_IDS.SOCIETE_A,
    month: currentMonth,
    year: currentYear,
    amount: 6780.00, // 1 employé
    due_date: new Date(currentYear, parseInt(currentMonth) - 1, 18).toISOString().split('T')[0],
    status: 'sent',
    paid_at: null,
    pdf_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client_company: getCompany(DEMO_IDS.SOCIETE_B_DATAMINDS),
    issuer_company: getCompany(DEMO_IDS.SOCIETE_A),
  },
  // Mois précédent - TechCorp (payée)
  {
    id: 'inv-techcorp-last',
    invoice_number: `FAC-${lastMonthYear}-0045`,
    client_company_id: DEMO_IDS.SOCIETE_B_TECHCORP,
    issuer_company_id: DEMO_IDS.SOCIETE_A,
    month: lastMonth,
    year: lastMonthYear,
    amount: 23500.00,
    due_date: new Date(lastMonthYear, parseInt(lastMonth) - 1, 15).toISOString().split('T')[0],
    status: 'paid',
    paid_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 14).toISOString(),
    pdf_url: null,
    created_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 1).toISOString(),
    updated_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 14).toISOString(),
    client_company: getCompany(DEMO_IDS.SOCIETE_B_TECHCORP),
    issuer_company: getCompany(DEMO_IDS.SOCIETE_A),
  },
  // Mois précédent - Green Solutions (en retard)
  {
    id: 'inv-green-last',
    invoice_number: `FAC-${lastMonthYear}-0044`,
    client_company_id: DEMO_IDS.SOCIETE_B_GREEN,
    issuer_company_id: DEMO_IDS.SOCIETE_A,
    month: lastMonth,
    year: lastMonthYear,
    amount: 5100.00,
    due_date: new Date(lastMonthYear, parseInt(lastMonth) - 1, 12).toISOString().split('T')[0],
    status: 'overdue',
    paid_at: null,
    pdf_url: null,
    created_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 1).toISOString(),
    updated_at: new Date(lastMonthYear, parseInt(lastMonth) - 1, 1).toISOString(),
    client_company: getCompany(DEMO_IDS.SOCIETE_B_GREEN),
    issuer_company: getCompany(DEMO_IDS.SOCIETE_A),
  },
];

// ============ FACTURES PAYFLOW (Abonnement Société A) ============

export interface PayFlowSubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  plan: string;
  amount: number;
  period: string;
  status: 'sent' | 'paid';
  dueDate: string;
  paidAt: string | null;
}

export const DEMO_PAYFLOW_INVOICES: PayFlowSubscriptionInvoice[] = [
  {
    id: 'pf-inv-1',
    invoiceNumber: 'PF-2025-001',
    plan: 'Business',
    amount: 299,
    period: 'Janvier 2025',
    status: 'paid',
    dueDate: '2025-01-05',
    paidAt: '2025-01-03',
  },
  {
    id: 'pf-inv-2',
    invoiceNumber: 'PF-2024-012',
    plan: 'Business',
    amount: 299,
    period: 'Décembre 2024',
    status: 'paid',
    dueDate: '2024-12-05',
    paidAt: '2024-12-04',
  },
];

// ============ SOCIÉTÉS A (pour Admin App) ============

export interface SocieteAForAdmin {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  plan: 'Starter' | 'Pro' | 'Business' | 'Essai';
  amount: number;
  employeesCount: number;
  clientsCount: number;
  since: string;
  siret: string;
  address: string;
}

export const DEMO_SOCIETES_A_FOR_ADMIN: SocieteAForAdmin[] = [
  {
    id: DEMO_IDS.SOCIETE_A,
    name: 'TalentFlow SAS',
    email: 'contact@talentflow.fr',
    phone: '01 23 45 67 89',
    status: 'active',
    plan: 'Business',
    amount: 299,
    employeesCount: 5,
    clientsCount: 3,
    since: '2023-01-15',
    siret: '12345678901234',
    address: '10 rue de la Paix, 75001 Paris',
  },
  {
    id: 'societe-a-demo-2',
    name: 'PayMaster Pro',
    email: 'contact@paymaster.fr',
    phone: '01 44 55 66 77',
    status: 'active',
    plan: 'Pro',
    amount: 149,
    employeesCount: 12,
    clientsCount: 5,
    since: '2023-06-01',
    siret: '55667788990011',
    address: '50 avenue Victor Hugo, 75016 Paris',
  },
  {
    id: 'societe-a-demo-3',
    name: 'GestionPaie Lyon',
    email: 'contact@gestionpaie-lyon.fr',
    phone: '04 78 99 00 11',
    status: 'trial',
    plan: 'Essai',
    amount: 0,
    employeesCount: 3,
    clientsCount: 1,
    since: '2025-01-01',
    siret: '33445566778899',
    address: '15 rue de la République, 69001 Lyon',
  },
];

// ============ INVITATIONS ============

export interface DemoInvitation {
  id: string;
  email: string;
  phone?: string;
  type: 'societe_a' | 'societe_b' | 'employe';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitedBy: string;
  invitedByType: 'admin_app' | 'societe_a' | 'societe_b';
  createdAt: string;
  expiresAt: string;
}

export const DEMO_INVITATIONS: DemoInvitation[] = [
  {
    id: 'demo-inv-1',
    email: 'nouveau.prestataire@example.fr',
    type: 'societe_a',
    status: 'pending',
    invitedBy: DEMO_IDS.USER_ADMIN,
    invitedByType: 'admin_app',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-inv-2',
    email: 'nouveau.client@techstartup.fr',
    type: 'societe_b',
    status: 'pending',
    invitedBy: DEMO_IDS.USER_SOCIETE_A,
    invitedByType: 'societe_a',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-inv-3',
    email: 'julie.moreau@email.com',
    type: 'employe',
    status: 'accepted',
    invitedBy: DEMO_IDS.USER_SOCIETE_A,
    invitedByType: 'societe_a',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============ STATISTIQUES CALCULÉES ============

export function getDemoStats() {
  const techCorpEmployees = DEMO_EMPLOYEES.filter(e => e.client_company_id === DEMO_IDS.SOCIETE_B_TECHCORP);
  const greenEmployees = DEMO_EMPLOYEES.filter(e => e.client_company_id === DEMO_IDS.SOCIETE_B_GREEN);
  const dataMindsEmployees = DEMO_EMPLOYEES.filter(e => e.client_company_id === DEMO_IDS.SOCIETE_B_DATAMINDS);

  return {
    societeA: {
      totalClients: 3,
      totalEmployees: DEMO_EMPLOYEES.length,
      pendingInvoices: DEMO_INVOICES.filter(i => i.status === 'sent' || i.status === 'overdue').length,
      pendingAmount: DEMO_INVOICES.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0),
      monthlyRevenue: DEMO_INVOICES.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0),
      validatedVariables: DEMO_MONTHLY_VARIABLES.filter(mv => mv.status === 'validated' && mv.month === currentMonth).length,
      submittedVariables: DEMO_MONTHLY_VARIABLES.filter(mv => mv.status === 'submitted' && mv.month === currentMonth).length,
    },
    societeB: {
      // TechCorp (défaut pour Société B login)
      employeesCount: techCorpEmployees.length,
      validatedVariables: DEMO_MONTHLY_VARIABLES.filter(
        mv => techCorpEmployees.some(e => e.id === mv.employee_id) && mv.status === 'validated' && mv.month === currentMonth
      ).length,
      pendingInvoice: DEMO_INVOICES.find(i => i.client_company_id === DEMO_IDS.SOCIETE_B_TECHCORP && i.status === 'sent'),
      monthlyBudget: techCorpEmployees.reduce((sum, e) => sum + (e.hourly_rate * 151.67), 0),
    },
    employe: {
      // Marie Dupont
      currentPayslip: DEMO_PAYSLIPS.find(p => p.employee_id === DEMO_IDS.EMP_MARIE_DUPONT && p.month === currentMonth),
      lastPayslip: DEMO_PAYSLIPS.find(p => p.employee_id === DEMO_IDS.EMP_MARIE_DUPONT && p.month === lastMonth),
      totalPayslips: DEMO_PAYSLIPS.filter(p => p.employee_id === DEMO_IDS.EMP_MARIE_DUPONT).length,
    },
    adminApp: {
      totalSocietesA: DEMO_SOCIETES_A_FOR_ADMIN.length,
      activeSocietesA: DEMO_SOCIETES_A_FOR_ADMIN.filter(s => s.status === 'active').length,
      trialSocietesA: DEMO_SOCIETES_A_FOR_ADMIN.filter(s => s.status === 'trial').length,
      totalRevenue: DEMO_SOCIETES_A_FOR_ADMIN.reduce((sum, s) => sum + s.amount, 0),
      pendingInvitations: DEMO_INVITATIONS.filter(i => i.status === 'pending').length,
    },
  };
}

// Export des données mock mutables pour les hooks
export const mutableDemoData = {
  companies: [...DEMO_COMPANIES],
  employees: [...DEMO_EMPLOYEES],
  monthlyVariables: [...DEMO_MONTHLY_VARIABLES],
  payslips: [...DEMO_PAYSLIPS],
  invoices: [...DEMO_INVOICES],
  invitations: [...DEMO_INVITATIONS],
  societesAForAdmin: [...DEMO_SOCIETES_A_FOR_ADMIN],
  payflowInvoices: [...DEMO_PAYFLOW_INVOICES],
};

// Fonction pour réinitialiser les données démo
export function resetDemoData() {
  mutableDemoData.companies = [...DEMO_COMPANIES];
  mutableDemoData.employees = [...DEMO_EMPLOYEES];
  mutableDemoData.monthlyVariables = [...DEMO_MONTHLY_VARIABLES];
  mutableDemoData.payslips = [...DEMO_PAYSLIPS];
  mutableDemoData.invoices = [...DEMO_INVOICES];
  mutableDemoData.invitations = [...DEMO_INVITATIONS];
  mutableDemoData.societesAForAdmin = [...DEMO_SOCIETES_A_FOR_ADMIN];
  mutableDemoData.payflowInvoices = [...DEMO_PAYFLOW_INVOICES];
}
