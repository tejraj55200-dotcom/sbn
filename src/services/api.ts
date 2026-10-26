import {
  AuthSession,
  UserAccount,
  DataSchema,
  SubmissionRecord,
  ConnectionConfig,
  ApiResponse,
} from '../types';
import { DEFAULT_SCHEMAS } from '../config/schemas';
import { INITIAL_USERS, MOCK_PASSWORDS, INITIAL_SUBMISSIONS } from './mockData';

const STORAGE_KEYS = {
  SESSION: 'sheetflow_session',
  CONNECTION: 'sheetflow_connection_config',
  USERS: 'sheetflow_db_users',
  SCHEMAS: 'sheetflow_db_schemas',
  SUBMISSIONS: 'sheetflow_db_submissions',
};

// Default connection configuration
const DEFAULT_CONNECTION: ConnectionConfig = {
  mode: 'simulator',
  webAppUrl: '',
};

class ApiService {
  private connection: ConnectionConfig;

  constructor() {
    this.connection = this.loadConnectionConfig();
    this.initLocalStorageIfEmpty();
  }

  // --- Connection Configuration ---
  public loadConnectionConfig(): ConnectionConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONNECTION);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse connection config from localStorage', e);
    }
    return DEFAULT_CONNECTION;
  }

  public saveConnectionConfig(config: ConnectionConfig): void {
    this.connection = config;
    localStorage.setItem(STORAGE_KEYS.CONNECTION, JSON.stringify(config));
  }

  public getConnectionConfig(): ConnectionConfig {
    return this.connection;
  }

  // Ping test to verify Google Apps Script Web App URL
  public async testLiveConnection(url: string): Promise<ApiResponse> {
    if (!url || !url.startsWith('http')) {
      return { success: false, error: 'Please enter a valid HTTP(S) URL.' };
    }

    try {
      // Apps Script web apps respond to GET with CORS support
      const endpoint = `${url}${url.includes('?') ? '&' : '?'}action=ping&_t=${Date.now()}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP Error ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: data.success ?? true,
        data: data,
        message: data.message || 'Connected successfully to Google Apps Script Web App.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Connection failed: ${err.message || 'Network error or CORS issue. Ensure Web App is deployed with access: Anyone.'}`,
      };
    }
  }

  // --- Session Management ---
  public getCurrentSession(): AuthSession | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse session from storage', e);
    }
    return null;
  }

  public saveSession(session: AuthSession): void {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  }

  public clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }

  // --- Authentication ---
  public async login(username: string, password: string): Promise<ApiResponse<AuthSession>> {
    const isLive = this.connection.mode === 'live' && this.connection.webAppUrl;

    if (isLive) {
      try {
        const response = await fetch(this.connection.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'login',
            username,
            password,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          return { success: false, error: result.error || 'Authentication failed' };
        }

        const session: AuthSession = result.session;
        this.saveSession(session);
        return { success: true, data: session };
      } catch (err: any) {
        return {
          success: false,
          error: `Google Apps Script API error: ${err.message || 'Check connection settings.'}`,
        };
      }
    }

    // Simulator Mode Auth
    const users = this.getLocalUsers();
    const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());

    if (!user) {
      return { success: false, error: 'User not found in system.' };
    }

    if (user.status !== 'Active') {
      return { success: false, error: 'Account is currently disabled by administrator.' };
    }

    const expectedPass = MOCK_PASSWORDS[user.username] || 'user123';
    if (password !== expectedPass && password !== 'admin123' && password !== 'user123') {
      return { success: false, error: 'Invalid password. Try "admin123" for admin or "user123" for users.' };
    }

    const session: AuthSession = {
      username: user.username,
      fullName: user.fullName,
      department: user.department,
      role: user.role,
      token: `STOKEN_${btoa(`${user.username}:${user.role}:${Date.now()}`)}`,
      loginTime: new Date().toISOString(),
    };

    // Update last login
    user.lastLogin = new Date().toISOString();
    this.saveLocalUsers(users);

    this.saveSession(session);
    return { success: true, data: session };
  }

  // --- Submissions (RBAC Enforced) ---
  public async getSubmissions(filters?: {
    userFilter?: string;
    schemaId?: string;
    search?: string;
  }): Promise<ApiResponse<SubmissionRecord[]>> {
    const session = this.getCurrentSession();
    if (!session) {
      return { success: false, error: 'Session expired. Please log in.' };
    }

    const isLive = this.connection.mode === 'live' && this.connection.webAppUrl;

    if (isLive) {
      try {
        const queryParams = new URLSearchParams({
          action: 'getSubmissions',
          auth_user: session.username,
          auth_token: session.token,
          ...(filters?.userFilter ? { user_filter: filters.userFilter } : {}),
          ...(filters?.schemaId ? { schema_id: filters.schemaId } : {}),
          ...(filters?.search ? { search: filters.search } : {}),
          _t: Date.now().toString(),
        });

        const url = `${this.connection.webAppUrl}${this.connection.webAppUrl.includes('?') ? '&' : '?'}${queryParams.toString()}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
          return { success: false, error: data.error };
        }

        return { success: true, data: data.submissions || [] };
      } catch (err: any) {
        return { success: false, error: `Failed to fetch submissions: ${err.message}` };
      }
    }

    // Simulator Mode (Strict RBAC Enforcement)
    let records = this.getLocalSubmissions();

    // Standard User can ONLY view their own records!
    if (session.role !== 'Admin') {
      records = records.filter(
        (r) => r.submitted_by.toLowerCase() === session.username.toLowerCase()
      );
    } else if (filters?.userFilter && filters.userFilter !== 'ALL') {
      records = records.filter(
        (r) => r.submitted_by.toLowerCase() === filters.userFilter?.toLowerCase()
      );
    }

    if (filters?.schemaId && filters.schemaId !== 'ALL') {
      records = records.filter((r) => r.schema_id === filters.schemaId);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      records = records.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.submitted_by.toLowerCase().includes(q) ||
          r.schema_name.toLowerCase().includes(q) ||
          JSON.stringify(r.data).toLowerCase().includes(q)
      );
    }

    // Sort descending by timestamp
    records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { success: true, data: records };
  }

  // --- Submit Record ---
  public async submitRecord(
    schemaId: string,
    formData: Record<string, any>
  ): Promise<ApiResponse<SubmissionRecord>> {
    const session = this.getCurrentSession();
    if (!session) {
      return { success: false, error: 'Session expired. Please log in.' };
    }

    const isLive = this.connection.mode === 'live' && this.connection.webAppUrl;

    if (isLive) {
      try {
        const payload = {
          action: 'submit',
          auth_user: session.username,
          auth_token: session.token,
          schema_id: schemaId,
          data: formData,
        };

        const response = await fetch(this.connection.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!result.success) {
          return { success: false, error: result.error || 'Submission failed' };
        }

        return {
          success: true,
          data: result.record,
          message: 'Record successfully recorded to Google Sheet.',
        };
      } catch (err: any) {
        return { success: false, error: `Submission failed: ${err.message}` };
      }
    }

    // Simulator Mode
    const schemas = this.getSchemas();
    const schema = schemas.find((s) => s.id === schemaId);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const recordId = `REC-${dateStr}-${randStr}`;

    const newRecord: SubmissionRecord = {
      id: recordId,
      timestamp: now.toISOString(),
      submitted_by: session.username,
      user_role: session.role,
      schema_id: schemaId,
      schema_name: schema ? schema.name : schemaId,
      data: formData,
    };

    const currentSubmissions = this.getLocalSubmissions();
    currentSubmissions.unshift(newRecord);
    this.saveLocalSubmissions(currentSubmissions);

    return {
      success: true,
      data: newRecord,
      message: 'Record recorded successfully to Google Sheet.',
    };
  }

  // --- User Management (Admin Only) ---
  public async getUsers(): Promise<ApiResponse<UserAccount[]>> {
    const session = this.getCurrentSession();
    if (!session || session.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin role required.' };
    }

    const isLive = this.connection.mode === 'live' && this.connection.webAppUrl;
    if (isLive) {
      try {
        const queryParams = new URLSearchParams({
          action: 'getUsers',
          auth_user: session.username,
          auth_token: session.token,
          _t: Date.now().toString(),
        });

        const response = await fetch(`${this.connection.webAppUrl}?${queryParams.toString()}`);
        const result = await response.json();
        if (!result.success) {
          return { success: false, error: result.error };
        }
        return { success: true, data: result.users };
      } catch (err: any) {
        return { success: false, error: `Failed to fetch users: ${err.message}` };
      }
    }

    return { success: true, data: this.getLocalUsers() };
  }

  public async createUser(userData: {
    username: string;
    fullName: string;
    department: string;
    role: 'Admin' | 'User';
    password?: string;
  }): Promise<ApiResponse<UserAccount>> {
    const session = this.getCurrentSession();
    if (!session || session.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin role required.' };
    }

    const isLive = this.connection.mode === 'live' && this.connection.webAppUrl;
    if (isLive) {
      try {
        const response = await fetch(this.connection.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'createUser',
            auth_user: session.username,
            auth_token: session.token,
            userData,
          }),
        });
        const result = await response.json();
        if (!result.success) return { success: false, error: result.error };
        return { success: true, data: result.user };
      } catch (err: any) {
        return { success: false, error: `Failed to create user: ${err.message}` };
      }
    }

    const users = this.getLocalUsers();
    if (users.some((u) => u.username.toLowerCase() === userData.username.trim().toLowerCase())) {
      return { success: false, error: 'Username already exists.' };
    }

    const newUser: UserAccount = {
      username: userData.username.trim(),
      fullName: userData.fullName.trim() || userData.username,
      department: userData.department.trim() || 'Operations',
      role: userData.role,
      status: 'Active',
      createdAt: new Date().toISOString(),
      lastLogin: undefined,
    };

    users.push(newUser);
    this.saveLocalUsers(users);

    if (userData.password) {
      MOCK_PASSWORDS[newUser.username] = userData.password;
    }

    return { success: true, data: newUser, message: 'User created in Users sheet.' };
  }

  public async updateUserStatus(
    targetUsername: string,
    status: 'Active' | 'Disabled',
    newPassword?: string
  ): Promise<ApiResponse> {
    const session = this.getCurrentSession();
    if (!session || session.role !== 'Admin') {
      return { success: false, error: 'Unauthorized: Admin role required.' };
    }

    const isLive = this.connection.mode === 'live' && this.connection.webAppUrl;
    if (isLive) {
      try {
        const response = await fetch(this.connection.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'updateUserStatus',
            auth_user: session.username,
            auth_token: session.token,
            targetUsername,
            status,
            newPassword,
          }),
        });
        return await response.json();
      } catch (err: any) {
        return { success: false, error: `Update failed: ${err.message}` };
      }
    }

    const users = this.getLocalUsers();
    const user = users.find((u) => u.username.toLowerCase() === targetUsername.toLowerCase());
    if (!user) {
      return { success: false, error: 'Target user not found.' };
    }

    user.status = status;
    this.saveLocalUsers(users);

    if (newPassword) {
      MOCK_PASSWORDS[user.username] = newPassword;
    }

    return { success: true, message: `Status updated to ${status}.` };
  }

  // --- Schemas ---
  public getSchemas(): DataSchema[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SCHEMAS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse schemas', e);
    }
    return DEFAULT_SCHEMAS;
  }

  public saveSchema(newSchema: DataSchema): ApiResponse<DataSchema> {
    const schemas = this.getSchemas();
    const index = schemas.findIndex((s) => s.id === newSchema.id);
    if (index >= 0) {
      schemas[index] = newSchema;
    } else {
      schemas.push(newSchema);
    }
    localStorage.setItem(STORAGE_KEYS.SCHEMAS, JSON.stringify(schemas));
    return { success: true, data: newSchema };
  }

  // --- Local Storage Helpers ---
  private initLocalStorageIfEmpty(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SCHEMAS)) {
      localStorage.setItem(STORAGE_KEYS.SCHEMAS, JSON.stringify(DEFAULT_SCHEMAS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
    }
  }

  public resetSandboxData(): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.SCHEMAS, JSON.stringify(DEFAULT_SCHEMAS));
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
  }

  private getLocalUsers(): UserAccount[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      return stored ? JSON.parse(stored) : INITIAL_USERS;
    } catch (e) {
      return INITIAL_USERS;
    }
  }

  private saveLocalUsers(users: UserAccount[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  private getLocalSubmissions(): SubmissionRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      return stored ? JSON.parse(stored) : INITIAL_SUBMISSIONS;
    } catch (e) {
      return INITIAL_SUBMISSIONS;
    }
  }

  private saveLocalSubmissions(records: SubmissionRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(records));
  }
}

export const api = new ApiService();
