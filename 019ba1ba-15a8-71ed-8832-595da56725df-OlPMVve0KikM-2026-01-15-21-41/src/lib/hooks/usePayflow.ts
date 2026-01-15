import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../supabase';
import { useDeletionHistoryStore } from '../state/deletion-history-store';
import { useAppMode } from '../state/app-store';
import { mutableDemoData, DEMO_IDS } from '../data/demo-data';
import type {
  Company,
  Employee,
  MonthlyVariables,
  Payslip,
  Invoice,
  EmployeeWithDetails,
  InvoiceWithDetails,
  MonthlyVariablesInsert,
  MonthlyVariablesUpdate,
  PayslipInsert,
  InvoiceInsert,
  InvoiceUpdate,
  CompanyInsert,
  EmployeeInsert,
} from '../database.types';

// Helper to check if real mode is available
export function isRealModeAvailable(): boolean {
  return isSupabaseConfigured;
}

// Re-export DEMO_IDS for convenience
export { DEMO_IDS } from '../data/demo-data';

// Type for payslip with employee
type PayslipWithEmployee = Payslip & { employee: Employee };

// ============ COMPANIES ============

export function useCompanies() {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['companies', appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        return mutableDemoData.companies;
      }
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Company[];
    },
  });
}

export function useCompany(id: string) {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['companies', id, appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        return mutableDemoData.companies.find(c => c.id === id) ?? null;
      }
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Company;
    },
    enabled: !!id,
  });
}

export function useClientCompanies(prestatireId: string) {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['clientCompanies', prestatireId, appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        return mutableDemoData.companies.filter(c => c.type === 'client' && c.parent_company_id === prestatireId);
      }
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('type', 'client')
        .eq('parent_company_id', prestatireId)
        .order('name');
      if (error) throw error;
      return data as Company[];
    },
    enabled: !!prestatireId,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async (company: CompanyInsert) => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const newCompany: Company = {
          id: `mock-${Date.now()}`,
          name: company.name,
          type: company.type,
          parent_company_id: company.parent_company_id ?? null,
          siret: company.siret ?? null,
          urssaf_number: company.urssaf_number ?? null,
          legal_status: company.legal_status ?? null,
          address: company.address ?? null,
          postal_code: company.postal_code ?? null,
          city: company.city ?? null,
          phone: company.phone ?? null,
          email: company.email ?? null,
          contact_name: company.contact_name ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mutableDemoData.companies.push(newCompany);
        return newCompany;
      }
      const { data, error } = await supabase
        .from('companies')
        .insert(company as never)
        .select()
        .single();
      if (error) throw error;
      return data as Company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['clientCompanies'] });
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async (employee: EmployeeInsert) => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const employerCompany = mutableDemoData.companies.find(c => c.id === employee.employer_company_id);
        const clientCompany = mutableDemoData.companies.find(c => c.id === employee.client_company_id);
        const newEmployee: EmployeeWithDetails = {
          id: `mock-emp-${Date.now()}`,
          user_id: employee.user_id ?? null,
          employer_company_id: employee.employer_company_id,
          client_company_id: employee.client_company_id,
          full_name: employee.full_name,
          position: employee.position,
          hourly_rate: employee.hourly_rate,
          contract_type: employee.contract_type,
          hire_date: employee.hire_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          employer_company: employerCompany ?? mutableDemoData.companies[0],
          client_company: clientCompany ?? mutableDemoData.companies[1],
        };
        mutableDemoData.employees.push(newEmployee);
        return newEmployee;
      }
      const { data, error } = await supabase
        .from('employees')
        .insert(employee as never)
        .select()
        .single();
      if (error) throw error;
      return data as Employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

// ============ EMPLOYEES ============

export function useEmployees() {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['employees', appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        return mutableDemoData.employees;
      }
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          employer_company:companies!employer_company_id(*),
          client_company:companies!client_company_id(*)
        `)
        .order('full_name');
      if (error) throw error;
      return data as EmployeeWithDetails[];
    },
  });
}

export function useEmployeesByClientCompany(clientCompanyId: string) {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['employees', 'company', clientCompanyId, appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        return mutableDemoData.employees.filter(e => e.client_company_id === clientCompanyId);
      }
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          employer_company:companies!employer_company_id(*),
          client_company:companies!client_company_id(*)
        `)
        .eq('client_company_id', clientCompanyId)
        .order('full_name');
      if (error) throw error;
      return data as EmployeeWithDetails[];
    },
    enabled: !!clientCompanyId,
  });
}

export function useEmployee(id: string) {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['employees', id, appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        return mutableDemoData.employees.find(e => e.id === id) ?? null;
      }
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          employer_company:companies!employer_company_id(*),
          client_company:companies!client_company_id(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as EmployeeWithDetails;
    },
    enabled: !!id,
  });
}

// ============ MONTHLY VARIABLES ============

export function useMonthlyVariables(employeeId: string, month?: string, year?: number) {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['monthlyVariables', 'employee', employeeId, month, year, appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        let result = mutableDemoData.monthlyVariables.filter(mv => mv.employee_id === employeeId);
        if (month) result = result.filter(mv => mv.month === month);
        if (year) result = result.filter(mv => mv.year === year);
        return result;
      }
      let query = supabase
        .from('monthly_variables')
        .select('*')
        .eq('employee_id', employeeId);

      if (month) query = query.eq('month', month);
      if (year) query = query.eq('year', year);

      const { data, error } = await query.order('year', { ascending: false }).order('month', { ascending: false });
      if (error) throw error;
      return data as MonthlyVariables[];
    },
    enabled: !!employeeId,
  });
}

// Get all monthly variables (for Société A to see all submitted variables)
export type MonthlyVariablesWithEmployee = MonthlyVariables & {
  employee: EmployeeWithDetails;
};

export function useAllMonthlyVariables(month?: string, year?: number, status?: 'draft' | 'submitted' | 'validated') {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['monthlyVariables', 'all', month, year, status, appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        let result = [...mutableDemoData.monthlyVariables];
        if (month) result = result.filter(mv => mv.month === month);
        if (year) result = result.filter(mv => mv.year === year);
        if (status) result = result.filter(mv => mv.status === status);

        // Join with employee data
        return result.map(mv => {
          const employee = mutableDemoData.employees.find(e => e.id === mv.employee_id);
          return {
            ...mv,
            employee: employee ?? mutableDemoData.employees[0],
          };
        }) as MonthlyVariablesWithEmployee[];
      }

      let query = supabase
        .from('monthly_variables')
        .select(`
          *,
          employee:employees(
            *,
            employer_company:companies!employer_company_id(*),
            client_company:companies!client_company_id(*)
          )
        `);

      if (month) query = query.eq('month', month);
      if (year) query = query.eq('year', year);
      if (status) query = query.eq('status', status);

      const { data, error } = await query.order('updated_at', { ascending: false });
      if (error) throw error;
      return data as MonthlyVariablesWithEmployee[];
    },
  });
}

// Get monthly variables by client company (for Société B to see their employees' variables)
export function useMonthlyVariablesByClientCompany(clientCompanyId: string, month?: string, year?: number) {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['monthlyVariables', 'client', clientCompanyId, month, year, appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const clientEmployees = mutableDemoData.employees.filter(e => e.client_company_id === clientCompanyId);
        const clientEmployeeIds = clientEmployees.map(e => e.id);

        let result = mutableDemoData.monthlyVariables.filter(mv => clientEmployeeIds.includes(mv.employee_id));
        if (month) result = result.filter(mv => mv.month === month);
        if (year) result = result.filter(mv => mv.year === year);

        return result.map(mv => {
          const employee = clientEmployees.find(e => e.id === mv.employee_id);
          return {
            ...mv,
            employee: employee ?? clientEmployees[0],
          };
        }) as MonthlyVariablesWithEmployee[];
      }

      // First get employees for this client company
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id')
        .eq('client_company_id', clientCompanyId);

      if (employeesError) throw employeesError;
      const employeeIds = (employeesData as { id: string }[]).map(e => e.id);

      if (employeeIds.length === 0) return [];

      let query = supabase
        .from('monthly_variables')
        .select(`
          *,
          employee:employees(
            *,
            employer_company:companies!employer_company_id(*),
            client_company:companies!client_company_id(*)
          )
        `)
        .in('employee_id', employeeIds);

      if (month) query = query.eq('month', month);
      if (year) query = query.eq('year', year);

      const { data, error } = await query.order('updated_at', { ascending: false });
      if (error) throw error;
      return data as MonthlyVariablesWithEmployee[];
    },
    enabled: !!clientCompanyId,
  });
}

export function useCreateMonthlyVariables() {
  const queryClient = useQueryClient();
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async (variables: MonthlyVariablesInsert) => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const newVar: MonthlyVariables = {
          id: `mock-mv-${Date.now()}`,
          employee_id: variables.employee_id,
          month: variables.month,
          year: variables.year,
          hours_worked: variables.hours_worked,
          overtime_hours: variables.overtime_hours ?? 0,
          vacation_days: variables.vacation_days ?? 0,
          sick_days: variables.sick_days ?? 0,
          bonuses: variables.bonuses ?? 0,
          status: variables.status ?? 'draft',
          submitted_by: variables.submitted_by ?? null,
          submitted_at: variables.submitted_at ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mutableDemoData.monthlyVariables.push(newVar);
        return newVar;
      }
      const { data, error } = await supabase
        .from('monthly_variables')
        .insert(variables as never)
        .select()
        .single();
      if (error) throw error;
      return data as MonthlyVariables;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['monthlyVariables'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyVariables', 'employee', data.employee_id] });
    },
  });
}

export function useUpsertMonthlyVariables() {
  const queryClient = useQueryClient();
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async (variables: MonthlyVariablesInsert) => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const existingIndex = mutableDemoData.monthlyVariables.findIndex(
          mv => mv.employee_id === variables.employee_id && mv.month === variables.month && mv.year === variables.year
        );
        const newVar: MonthlyVariables = {
          id: existingIndex >= 0 ? mutableDemoData.monthlyVariables[existingIndex].id : `mock-mv-${Date.now()}`,
          employee_id: variables.employee_id,
          month: variables.month,
          year: variables.year,
          hours_worked: variables.hours_worked,
          overtime_hours: variables.overtime_hours ?? 0,
          vacation_days: variables.vacation_days ?? 0,
          sick_days: variables.sick_days ?? 0,
          bonuses: variables.bonuses ?? 0,
          status: variables.status ?? 'draft',
          submitted_by: variables.submitted_by ?? null,
          submitted_at: variables.submitted_at ?? null,
          created_at: existingIndex >= 0 ? mutableDemoData.monthlyVariables[existingIndex].created_at : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (existingIndex >= 0) {
          mutableDemoData.monthlyVariables[existingIndex] = newVar;
        } else {
          mutableDemoData.monthlyVariables.push(newVar);
        }
        return newVar;
      }

      // First check if entry exists
      const { data: existing } = await supabase
        .from('monthly_variables')
        .select('id')
        .eq('employee_id', variables.employee_id)
        .eq('month', variables.month)
        .eq('year', variables.year)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('monthly_variables')
          .update(variables as never)
          .eq('id', (existing as { id: string }).id)
          .select()
          .single();
        if (error) throw error;
        return data as MonthlyVariables;
      } else {
        const { data, error } = await supabase
          .from('monthly_variables')
          .insert(variables as never)
          .select()
          .single();
        if (error) throw error;
        return data as MonthlyVariables;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['monthlyVariables'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyVariables', 'employee', data.employee_id] });
    },
  });
}

export function useUpdateMonthlyVariables() {
  const queryClient = useQueryClient();
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async ({ id, ...updates }: MonthlyVariablesUpdate & { id: string }) => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const index = mutableDemoData.monthlyVariables.findIndex(mv => mv.id === id);
        if (index >= 0) {
          mutableDemoData.monthlyVariables[index] = { ...mutableDemoData.monthlyVariables[index], ...updates, updated_at: new Date().toISOString() };
          return mutableDemoData.monthlyVariables[index];
        }
        throw new Error('Monthly variables not found');
      }
      const { data, error } = await supabase
        .from('monthly_variables')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as MonthlyVariables;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['monthlyVariables'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyVariables', 'employee', data.employee_id] });
    },
  });
}

// ============ PAYSLIPS ============

export function usePayslips(employeeId?: string) {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['payslips', employeeId ?? 'all', appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        if (employeeId) {
          return mutableDemoData.payslips.filter(p => p.employee_id === employeeId);
        }
        return mutableDemoData.payslips;
      }
      let query = supabase
        .from('payslips')
        .select(`
          *,
          employee:employees(*)
        `);

      if (employeeId) query = query.eq('employee_id', employeeId);

      const { data, error } = await query.order('year', { ascending: false }).order('month', { ascending: false });
      if (error) throw error;
      return data as PayslipWithEmployee[];
    },
  });
}

export function useCreatePayslip() {
  const queryClient = useQueryClient();
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async (payslip: PayslipInsert) => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const employee = mutableDemoData.employees.find(e => e.id === payslip.employee_id);
        const newPayslip: PayslipWithEmployee = {
          id: `mock-ps-${Date.now()}`,
          employee_id: payslip.employee_id,
          monthly_variables_id: payslip.monthly_variables_id ?? null,
          month: payslip.month,
          year: payslip.year,
          gross_salary: payslip.gross_salary,
          net_salary: payslip.net_salary,
          pdf_url: payslip.pdf_url ?? null,
          status: payslip.status ?? 'generated',
          sent_at: payslip.sent_at ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          employee: employee ?? mutableDemoData.employees[0],
        };
        mutableDemoData.payslips.push(newPayslip);
        return newPayslip;
      }
      const { data, error } = await supabase
        .from('payslips')
        .insert(payslip as never)
        .select()
        .single();
      if (error) throw error;
      return data as Payslip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    },
  });
}

export function useUpsertPayslip() {
  const queryClient = useQueryClient();
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async (payslip: PayslipInsert) => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const existingIndex = mutableDemoData.payslips.findIndex(
          p => p.employee_id === payslip.employee_id && p.month === payslip.month && p.year === payslip.year
        );
        const employee = mutableDemoData.employees.find(e => e.id === payslip.employee_id);
        const newPayslip: PayslipWithEmployee = {
          id: existingIndex >= 0 ? mutableDemoData.payslips[existingIndex].id : `mock-ps-${Date.now()}`,
          employee_id: payslip.employee_id,
          monthly_variables_id: payslip.monthly_variables_id ?? null,
          month: payslip.month,
          year: payslip.year,
          gross_salary: payslip.gross_salary,
          net_salary: payslip.net_salary,
          pdf_url: payslip.pdf_url ?? null,
          status: payslip.status ?? 'generated',
          sent_at: payslip.sent_at ?? null,
          created_at: existingIndex >= 0 ? mutableDemoData.payslips[existingIndex].created_at : new Date().toISOString(),
          updated_at: new Date().toISOString(),
          employee: employee ?? mutableDemoData.employees[0],
        };
        if (existingIndex >= 0) {
          mutableDemoData.payslips[existingIndex] = newPayslip;
        } else {
          mutableDemoData.payslips.push(newPayslip);
        }
        return newPayslip;
      }

      // First check if entry exists
      const { data: existing } = await supabase
        .from('payslips')
        .select('id')
        .eq('employee_id', payslip.employee_id)
        .eq('month', payslip.month)
        .eq('year', payslip.year)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('payslips')
          .update(payslip as never)
          .eq('id', (existing as { id: string }).id)
          .select()
          .single();
        if (error) throw error;
        return data as Payslip;
      } else {
        const { data, error } = await supabase
          .from('payslips')
          .insert(payslip as never)
          .select()
          .single();
        if (error) throw error;
        return data as Payslip;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    },
  });
}

// ============ INVOICES ============

export function useInvoices(companyId?: string, role?: 'client' | 'issuer') {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['invoices', companyId ?? 'all', role ?? 'all', appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        let result = [...mutableDemoData.invoices];
        if (companyId && role === 'client') {
          result = result.filter(i => i.client_company_id === companyId);
        } else if (companyId && role === 'issuer') {
          result = result.filter(i => i.issuer_company_id === companyId);
        }
        return result;
      }
      let query = supabase
        .from('invoices')
        .select(`
          *,
          client_company:companies!client_company_id(*),
          issuer_company:companies!issuer_company_id(*)
        `);

      if (companyId && role === 'client') {
        query = query.eq('client_company_id', companyId);
      } else if (companyId && role === 'issuer') {
        query = query.eq('issuer_company_id', companyId);
      }

      const { data, error } = await query.order('due_date', { ascending: false });
      if (error) throw error;
      return data as InvoiceWithDetails[];
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async (invoice: InvoiceInsert) => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const clientCompany = mutableDemoData.companies.find(c => c.id === invoice.client_company_id);
        const issuerCompany = mutableDemoData.companies.find(c => c.id === invoice.issuer_company_id);
        const newInvoice: InvoiceWithDetails = {
          id: `mock-inv-${Date.now()}`,
          invoice_number: invoice.invoice_number,
          client_company_id: invoice.client_company_id,
          issuer_company_id: invoice.issuer_company_id,
          month: invoice.month,
          year: invoice.year,
          amount: invoice.amount,
          due_date: invoice.due_date,
          status: invoice.status ?? 'draft',
          paid_at: invoice.paid_at ?? null,
          pdf_url: invoice.pdf_url ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          client_company: clientCompany ?? mutableDemoData.companies[1],
          issuer_company: issuerCompany ?? mutableDemoData.companies[0],
        };
        mutableDemoData.invoices.push(newInvoice);
        return newInvoice;
      }
      const { data, error } = await supabase
        .from('invoices')
        .insert(invoice as never)
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async ({ id, ...updates }: InvoiceUpdate & { id: string }) => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const index = mutableDemoData.invoices.findIndex(i => i.id === id);
        if (index >= 0) {
          mutableDemoData.invoices[index] = { ...mutableDemoData.invoices[index], ...updates, updated_at: new Date().toISOString() };
          return mutableDemoData.invoices[index];
        }
        throw new Error('Invoice not found');
      }
      const { data, error } = await supabase
        .from('invoices')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// ============ STATS ============

interface PrestaireStats {
  clientsCount: number;
  employeesCount: number;
  pendingInvoicesCount: number;
  pendingInvoicesAmount: number;
  monthlyRevenue: number;
}

export function usePrestaireStats(companyId: string) {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['stats', companyId, appMode],
    queryFn: async (): Promise<PrestaireStats> => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const clientCompanies = mutableDemoData.companies.filter(c => c.parent_company_id === companyId);
        const employees = mutableDemoData.employees.filter(e => e.employer_company_id === companyId);
        const pendingInvoices = mutableDemoData.invoices.filter(i => i.issuer_company_id === companyId && (i.status === 'sent' || i.status === 'overdue'));
        const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const paidInvoices = mutableDemoData.invoices.filter(i => i.issuer_company_id === companyId && i.status === 'paid');
        const monthlyRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

        return {
          clientsCount: clientCompanies.length,
          employeesCount: employees.length,
          pendingInvoicesCount: pendingInvoices.length,
          pendingInvoicesAmount: pendingAmount,
          monthlyRevenue,
        };
      }

      const { count: clientsCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('parent_company_id', companyId);

      const { count: employeesCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('employer_company_id', companyId);

      const { data: pendingInvoicesData } = await supabase
        .from('invoices')
        .select('amount')
        .eq('issuer_company_id', companyId)
        .in('status', ['sent', 'overdue']);

      const pendingInvoices = (pendingInvoicesData ?? []) as { amount: number }[];
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const pendingCount = pendingInvoices.length;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: paidInvoicesData } = await supabase
        .from('invoices')
        .select('amount')
        .eq('issuer_company_id', companyId)
        .eq('status', 'paid')
        .gte('paid_at', startOfMonth);

      const paidInvoices = (paidInvoicesData ?? []) as { amount: number }[];
      const monthlyRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

      return {
        clientsCount: clientsCount ?? 0,
        employeesCount: employeesCount ?? 0,
        pendingInvoicesCount: pendingCount,
        pendingInvoicesAmount: pendingAmount,
        monthlyRevenue,
      };
    },
    enabled: !!companyId,
  });
}

interface ClientStats {
  employeesCount: number;
  validatedVariables: number;
  totalEmployees: number;
  pendingInvoiceAmount: number;
  monthlyBudget: number;
}

export function useClientStats(companyId: string) {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['stats', companyId, appMode],
    queryFn: async (): Promise<ClientStats> => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const employees = mutableDemoData.employees.filter(e => e.client_company_id === companyId);
        const now = new Date();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentYear = now.getFullYear();
        const validatedVars = mutableDemoData.monthlyVariables.filter(
          mv => employees.some(e => e.id === mv.employee_id) && mv.month === currentMonth && mv.year === currentYear && mv.status === 'validated'
        );
        const pendingInvoices = mutableDemoData.invoices.filter(i => i.client_company_id === companyId && (i.status === 'sent' || i.status === 'overdue'));
        const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const monthlyBudget = employees.reduce((sum, e) => sum + (e.hourly_rate * 151.67), 0);

        return {
          employeesCount: employees.length,
          validatedVariables: validatedVars.length,
          totalEmployees: employees.length,
          pendingInvoiceAmount: pendingAmount,
          monthlyBudget,
        };
      }

      const { count: employeesCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('client_company_id', companyId);

      const now = new Date();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const currentYear = now.getFullYear();

      const { data: employeesData } = await supabase
        .from('employees')
        .select('id')
        .eq('client_company_id', companyId);

      const employees = (employeesData ?? []) as { id: string }[];
      const employeeIds = employees.map(e => e.id);

      let validatedCount = 0;
      if (employeeIds.length > 0) {
        const { count } = await supabase
          .from('monthly_variables')
          .select('*', { count: 'exact', head: true })
          .in('employee_id', employeeIds)
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .eq('status', 'validated');
        validatedCount = count ?? 0;
      }

      const { data: pendingInvoicesData } = await supabase
        .from('invoices')
        .select('amount')
        .eq('client_company_id', companyId)
        .in('status', ['sent', 'overdue']);

      const pendingInvoices = (pendingInvoicesData ?? []) as { amount: number }[];
      const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

      const { data: employeeRatesData } = await supabase
        .from('employees')
        .select('hourly_rate')
        .eq('client_company_id', companyId);

      const employeeRates = (employeeRatesData ?? []) as { hourly_rate: number }[];
      const monthlyBudget = employeeRates.reduce((sum, e) => sum + (e.hourly_rate * 151.67), 0);

      return {
        employeesCount: employeesCount ?? 0,
        validatedVariables: validatedCount,
        totalEmployees: employeeIds.length,
        pendingInvoiceAmount: pendingAmount,
        monthlyBudget,
      };
    },
    enabled: !!companyId,
  });
}

// ============ DELETION HOOKS ============

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  const addDeletion = useDeletionHistoryStore.getState().addDeletion;
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async ({ company, reason }: { company: Company; reason?: string }) => {
      addDeletion({
        type: 'company',
        deletedBy: 'Société A',
        reason,
        data: company,
      });

      if (appMode === 'demo' || !isSupabaseConfigured) {
        const index = mutableDemoData.companies.findIndex((c) => c.id === company.id);
        if (index !== -1) {
          mutableDemoData.companies.splice(index, 1);
        }
        return company;
      }

      const { error } = await supabase.from('companies').delete().eq('id', company.id);
      if (error) throw error;
      return company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['clientCompanies'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const addDeletion = useDeletionHistoryStore.getState().addDeletion;
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async ({ employee, reason }: { employee: EmployeeWithDetails; reason?: string }) => {
      addDeletion({
        type: 'employee',
        deletedBy: 'Société A',
        reason,
        data: employee,
      });

      if (appMode === 'demo' || !isSupabaseConfigured) {
        const index = mutableDemoData.employees.findIndex((e) => e.id === employee.id);
        if (index !== -1) {
          mutableDemoData.employees.splice(index, 1);
        }
        return employee;
      }

      const { error } = await supabase.from('employees').delete().eq('id', employee.id);
      if (error) throw error;
      return employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
    },
  });
}

export function useRestoreCompany() {
  const queryClient = useQueryClient();
  const restoreItem = useDeletionHistoryStore.getState().restoreItem;
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async (deletionId: string) => {
      const restored = restoreItem(deletionId);
      if (!restored || restored.type !== 'company') {
        throw new Error('Company not found in deletion history');
      }

      const company = restored.data as Company;

      if (appMode === 'demo' || !isSupabaseConfigured) {
        mutableDemoData.companies.push(company);
        return company;
      }

      const { data, error } = await supabase
        .from('companies')
        .insert(company as never)
        .select()
        .single();
      if (error) throw error;
      return data as Company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['clientCompanies'] });
    },
  });
}

export function useRestoreEmployee() {
  const queryClient = useQueryClient();
  const restoreItem = useDeletionHistoryStore.getState().restoreItem;
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async (deletionId: string) => {
      const restored = restoreItem(deletionId);
      if (!restored || restored.type !== 'employee') {
        throw new Error('Employee not found in deletion history');
      }

      const employee = restored.data as EmployeeWithDetails;

      if (appMode === 'demo' || !isSupabaseConfigured) {
        mutableDemoData.employees.push(employee);
        return employee;
      }

      const { employer_company, client_company, ...employeeData } = employee;
      const { data, error } = await supabase
        .from('employees')
        .insert(employeeData as never)
        .select()
        .single();
      if (error) throw error;
      return data as Employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

// ============ INVITATIONS ============

export interface InvitationData {
  id: string;
  email: string;
  phone: string | null;
  invite_type: 'admin_app' | 'societe_a' | 'societe_b' | 'employe';
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invited_by: string | null;
  invited_by_type: 'admin_app' | 'societe_a' | 'societe_b';
  company_id: string | null;
  token: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useInvitations(invitedBy?: string) {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['invitations', invitedBy ?? 'all', appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        if (invitedBy) {
          return mutableDemoData.invitations.filter(i => i.invitedBy === invitedBy);
        }
        return mutableDemoData.invitations;
      }

      let query = supabase.from('invitations').select('*');
      if (invitedBy) {
        query = query.eq('invited_by', invitedBy);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as InvitationData[];
    },
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async (invitation: {
      email: string;
      phone?: string;
      invite_type: 'societe_a' | 'societe_b' | 'employe';
      invited_by: string;
      invited_by_type: 'admin_app' | 'societe_a' | 'societe_b';
      company_id?: string;
    }) => {
      const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      if (appMode === 'demo' || !isSupabaseConfigured) {
        const newInvitation = {
          id: `mock-inv-${Date.now()}`,
          email: invitation.email,
          phone: invitation.phone,
          type: invitation.invite_type,
          status: 'pending' as const,
          invitedBy: invitation.invited_by,
          invitedByType: invitation.invited_by_type,
          createdAt: new Date().toISOString(),
          expiresAt,
        };
        mutableDemoData.invitations.push(newInvitation);
        return newInvitation;
      }

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          email: invitation.email,
          phone: invitation.phone ?? null,
          invite_type: invitation.invite_type,
          status: 'pending',
          invited_by: invitation.invited_by,
          invited_by_type: invitation.invited_by_type,
          company_id: invitation.company_id ?? null,
          token,
          expires_at: expiresAt,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data as InvitationData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useUpdateInvitation() {
  const queryClient = useQueryClient();
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'cancelled' }) => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const index = mutableDemoData.invitations.findIndex(i => i.id === id);
        if (index >= 0) {
          mutableDemoData.invitations[index] = {
            ...mutableDemoData.invitations[index],
            status,
          };
          return mutableDemoData.invitations[index];
        }
        throw new Error('Invitation not found');
      }

      const updateData: Record<string, unknown> = { status };
      if (status === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('invitations')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as InvitationData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

// ============ SUBSCRIPTION INVOICES (Admin -> Société A) ============

export interface SubscriptionInvoiceData {
  id: string;
  invoice_number: string;
  company_id: string;
  plan: string;
  amount: number;
  period: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubscriptionInvoices(companyId?: string) {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['subscriptionInvoices', companyId ?? 'all', appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        return mutableDemoData.payflowInvoices.map(inv => ({
          ...inv,
          company_id: DEMO_IDS.SOCIETE_A,
        }));
      }

      let query = supabase.from('subscription_invoices').select('*');
      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query.order('due_date', { ascending: false });
      if (error) throw error;
      return data as SubscriptionInvoiceData[];
    },
  });
}

export function useCreateSubscriptionInvoice() {
  const queryClient = useQueryClient();
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async (invoice: {
      company_id: string;
      plan: string;
      amount: number;
      period: string;
      due_date: string;
    }) => {
      const invoiceNumber = `PF-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

      if (appMode === 'demo' || !isSupabaseConfigured) {
        const newInvoice = {
          id: `mock-sub-inv-${Date.now()}`,
          invoiceNumber,
          plan: invoice.plan,
          amount: invoice.amount,
          period: invoice.period,
          status: 'sent' as const,
          dueDate: invoice.due_date,
          paidAt: null,
        };
        mutableDemoData.payflowInvoices.push(newInvoice);
        return newInvoice;
      }

      const { data, error } = await supabase
        .from('subscription_invoices')
        .insert({
          invoice_number: invoiceNumber,
          company_id: invoice.company_id,
          plan: invoice.plan,
          amount: invoice.amount,
          period: invoice.period,
          status: 'sent',
          due_date: invoice.due_date,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data as SubscriptionInvoiceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionInvoices'] });
    },
  });
}

export function useUpdateSubscriptionInvoice() {
  const queryClient = useQueryClient();
  const appMode = useAppMode();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'paid' | 'sent' }) => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        const index = mutableDemoData.payflowInvoices.findIndex(i => i.id === id);
        if (index >= 0) {
          mutableDemoData.payflowInvoices[index] = {
            ...mutableDemoData.payflowInvoices[index],
            status,
            paidAt: status === 'paid' ? new Date().toISOString() : null,
          };
          return mutableDemoData.payflowInvoices[index];
        }
        throw new Error('Invoice not found');
      }

      const updateData: Record<string, unknown> = { status };
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('subscription_invoices')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as SubscriptionInvoiceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionInvoices'] });
    },
  });
}

// ============ USERS ============

export function useUsers() {
  const appMode = useAppMode();

  return useQuery({
    queryKey: ['users', appMode],
    queryFn: async () => {
      if (appMode === 'demo' || !isSupabaseConfigured) {
        return [];
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: {
      id: string;
      email: string;
      full_name: string;
      user_type: 'admin_app' | 'societe_a' | 'societe_b' | 'employe';
      company_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          user_type: user.user_type,
          company_id: user.company_id ?? null,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
