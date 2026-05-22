export interface UserMe {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  photo: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  roles: string[];
  permissions: string[];
  date_joined: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Permission {
  id: number;
  code: string;
  module: string;
  label: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  permissions: number[];
  permissions_detail: Permission[];
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  photo: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  roles: number[];
  role_names: string[];
  permission_codes: string[];
  date_joined: string;
  password?: string;
}

export interface DepartmentFunction {
  id: number;
  department: number;
  department_name: string;
  name: string;
  description: string;
  is_active: boolean;
  worker_count: number;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  color: string;
  leader: number | null;
  leader_name: string | null;
  meeting_day: string;
  is_active: boolean;
  worker_count: number;
  function_count: number;
  functions: DepartmentFunction[];
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: number;
  matricule: string;
  user: number | null;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: string;
  phone: string;
  email: string;
  photo: string | null;
  address: string;
  birth_date: string | null;
  join_date: string | null;
  status: string;
  status_display: string;
  department: number | null;
  department_name: string | null;
  function: number | null;
  function_name: string | null;
  created_at: string;
}

export interface ChurchEvent {
  id: number;
  name: string;
  type: string;
  type_display: string;
  date: string;
  start_time: string | null;
  location: string;
  description: string;
  department: number | null;
  department_name: string | null;
  attendance_count: number;
  present_count: number;
  created_at: string;
}

export interface Attendance {
  id: number;
  event: number;
  event_name: string;
  event_date: string;
  worker: number;
  worker_name: string;
  status: string;
  status_display: string;
  check_in_time: string | null;
  note: string;
}

export interface Task {
  id: number;
  worker: number | null;
  worker_name: string | null;
  department: number | null;
  department_name: string | null;
  title: string;
  description: string;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaisseAssignment {
  id: number;
  caisse: number;
  caisse_name: string;
  worker: number | null;
  worker_name: string | null;
  user: number | null;
  user_name: string | null;
  assignee_name: string;
  role: string;
  role_display: string;
  is_active: boolean;
  created_at: string;
}

export interface Caisse {
  id: number;
  name: string;
  code: string;
  type: string;
  type_display: string;
  description: string;
  currency: string;
  opening_balance: string;
  current_balance: string;
  is_active: boolean;
  transaction_count: number;
  assignments: CaisseAssignment[];
  created_at: string;
  updated_at: string;
}

export interface OfferingType {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: number;
  reference: string;
  caisse: number;
  caisse_name: string;
  direction: string;
  direction_display: string;
  category: string;
  category_display: string;
  offering_type: number | null;
  offering_type_name: string | null;
  amount: string;
  currency: string;
  date: string;
  label: string;
  contributor_worker: number | null;
  contributor_name: string;
  contributor_display: string;
  status: string;
  status_display: string;
  recorded_by: number | null;
  recorded_by_name: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor: number | null;
  actor_name: string;
  actor_label: string;
  action: string;
  action_display: string;
  module: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string;
  timestamp: string;
}

export interface ChurchProfile {
  id: number;
  name: string;
  slogan: string;
  logo: string | null;
  address: string;
  phone: string;
  email: string;
  default_currency: string;
}

export interface DashboardStats {
  workers: { total: number; active: number };
  departments: { total: number };
  caisses: { count: number; balances: { currency: string; total: number }[] };
  finance_month: {
    tithes: number;
    offerings: number;
    donations: number;
    expenses: number;
    in: number;
    out: number;
    net: number;
  };
  monthly_series: { month: string; in: number; out: number }[];
  offerings_by_type: { offering_type__name: string | null; total: number }[];
  workers_by_department: { department__name: string | null; count: number }[];
  attendance: { rate: number; present: number; total: number };
  tasks: { todo: number; in_progress: number; done: number };
  recent_transactions: Transaction[];
}
