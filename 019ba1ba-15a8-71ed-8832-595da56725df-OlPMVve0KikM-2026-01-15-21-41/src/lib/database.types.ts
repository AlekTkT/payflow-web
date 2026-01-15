export type UserType = 'admin_app' | 'societe_a' | 'societe_b' | 'employe';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          user_type: UserType;
          company_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          user_type: UserType;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          user_type?: UserType;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          type: 'prestataire' | 'client';
          parent_company_id: string | null;
          siret: string | null;
          urssaf_number: string | null;
          legal_status: string | null;
          address: string | null;
          postal_code: string | null;
          city: string | null;
          phone: string | null;
          email: string | null;
          contact_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'prestataire' | 'client';
          parent_company_id?: string | null;
          siret?: string | null;
          urssaf_number?: string | null;
          legal_status?: string | null;
          address?: string | null;
          postal_code?: string | null;
          city?: string | null;
          phone?: string | null;
          email?: string | null;
          contact_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'prestataire' | 'client';
          parent_company_id?: string | null;
          siret?: string | null;
          urssaf_number?: string | null;
          legal_status?: string | null;
          address?: string | null;
          postal_code?: string | null;
          city?: string | null;
          phone?: string | null;
          email?: string | null;
          contact_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          user_id: string | null;
          employer_company_id: string;
          client_company_id: string;
          full_name: string;
          position: string;
          hourly_rate: number;
          contract_type: string;
          hire_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          employer_company_id: string;
          client_company_id: string;
          full_name: string;
          position: string;
          hourly_rate: number;
          contract_type: string;
          hire_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          employer_company_id?: string;
          client_company_id?: string;
          full_name?: string;
          position?: string;
          hourly_rate?: number;
          contract_type?: string;
          hire_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      monthly_variables: {
        Row: {
          id: string;
          employee_id: string;
          month: string;
          year: number;
          hours_worked: number;
          overtime_hours: number;
          vacation_days: number;
          sick_days: number;
          bonuses: number;
          status: 'draft' | 'submitted' | 'validated';
          submitted_by: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          month: string;
          year: number;
          hours_worked: number;
          overtime_hours?: number;
          vacation_days?: number;
          sick_days?: number;
          bonuses?: number;
          status?: 'draft' | 'submitted' | 'validated';
          submitted_by?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          month?: string;
          year?: number;
          hours_worked?: number;
          overtime_hours?: number;
          vacation_days?: number;
          sick_days?: number;
          bonuses?: number;
          status?: 'draft' | 'submitted' | 'validated';
          submitted_by?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payslips: {
        Row: {
          id: string;
          employee_id: string;
          monthly_variables_id: string | null;
          month: string;
          year: number;
          gross_salary: number;
          net_salary: number;
          pdf_url: string | null;
          status: 'generated' | 'sent' | 'viewed';
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          monthly_variables_id?: string | null;
          month: string;
          year: number;
          gross_salary: number;
          net_salary: number;
          pdf_url?: string | null;
          status?: 'generated' | 'sent' | 'viewed';
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          monthly_variables_id?: string | null;
          month?: string;
          year?: number;
          gross_salary?: number;
          net_salary?: number;
          pdf_url?: string | null;
          status?: 'generated' | 'sent' | 'viewed';
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          client_company_id: string;
          issuer_company_id: string;
          month: string;
          year: number;
          amount: number;
          due_date: string;
          status: 'draft' | 'sent' | 'paid' | 'overdue';
          paid_at: string | null;
          pdf_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          client_company_id: string;
          issuer_company_id: string;
          month: string;
          year: number;
          amount: number;
          due_date: string;
          status?: 'draft' | 'sent' | 'paid' | 'overdue';
          paid_at?: string | null;
          pdf_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          client_company_id?: string;
          issuer_company_id?: string;
          month?: string;
          year?: number;
          amount?: number;
          due_date?: string;
          status?: 'draft' | 'sent' | 'paid' | 'overdue';
          paid_at?: string | null;
          pdf_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_type: UserType;
      company_type: 'prestataire' | 'client';
      variable_status: 'draft' | 'submitted' | 'validated';
      payslip_status: 'generated' | 'sent' | 'viewed';
      invoice_status: 'draft' | 'sent' | 'paid' | 'overdue';
    };
  };
};

// Utility types for easier usage
export type User = Database['public']['Tables']['users']['Row'];
export type Company = Database['public']['Tables']['companies']['Row'];
export type Employee = Database['public']['Tables']['employees']['Row'];
export type MonthlyVariables = Database['public']['Tables']['monthly_variables']['Row'];
export type Payslip = Database['public']['Tables']['payslips']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
export type MonthlyVariablesInsert = Database['public']['Tables']['monthly_variables']['Insert'];
export type PayslipInsert = Database['public']['Tables']['payslips']['Insert'];
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];
export type EmployeeUpdate = Database['public']['Tables']['employees']['Update'];
export type MonthlyVariablesUpdate = Database['public']['Tables']['monthly_variables']['Update'];
export type PayslipUpdate = Database['public']['Tables']['payslips']['Update'];
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];

// Invitation types for user management
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface Invitation {
  id: string;
  email: string;
  user_type: UserType;
  company_id: string | null;
  employee_id: string | null;
  invited_by: string;
  status: InvitationStatus;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface InvitationInsert {
  id?: string;
  email: string;
  user_type: UserType;
  company_id?: string | null;
  employee_id?: string | null;
  invited_by: string;
  status?: InvitationStatus;
  token: string;
  expires_at: string;
  accepted_at?: string | null;
  created_at?: string;
}

// Extended types with relations
export interface EmployeeWithDetails extends Employee {
  employer_company?: Company;
  client_company?: Company;
  user?: User;
}

export interface InvoiceWithDetails extends Invoice {
  client_company?: Company;
  issuer_company?: Company;
  employee_count?: number;
}

export interface PayslipWithDetails extends Payslip {
  employee?: Employee;
  monthly_variables?: MonthlyVariables;
}
