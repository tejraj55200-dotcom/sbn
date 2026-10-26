export type UserRole = 'Admin' | 'User';

export type UserStatus = 'Active' | 'Disabled';

export interface UserAccount {
  username: string;
  fullName: string;
  department: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthSession {
  username: string;
  fullName: string;
  department: string;
  role: UserRole;
  token: string;
  loginTime: string;
}

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean';

export interface SchemaField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select
  defaultValue?: string | number | boolean;
  unit?: string; // e.g. "USD", "Hours", "Units"
}

export interface DataSchema {
  id: string; // e.g. 'daily_reports'
  name: string; // e.g. 'Daily Operations Report'
  sheetTab: string; // e.g. 'Data_DailyReports'
  category: string; // e.g. 'Operations'
  description: string;
  color: string; // visual accent indicator
  fields: SchemaField[];
}

export interface SubmissionRecord {
  id: string;
  timestamp: string;
  submitted_by: string;
  user_role: UserRole;
  schema_id: string;
  schema_name: string;
  data: Record<string, any>;
}

export interface ConnectionConfig {
  mode: 'simulator' | 'live';
  webAppUrl: string;
  lastConnectedAt?: string;
  sheetId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
