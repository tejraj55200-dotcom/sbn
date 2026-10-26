import React, { useState, useEffect, useCallback } from 'react';
import { AuthSession, SubmissionRecord, DataSchema, UserAccount, ConnectionConfig } from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { DynamicForm } from './components/DynamicForm';
import { UnifiedDataViewer } from './components/UnifiedDataViewer';
import { UserManagement } from './components/UserManagement';
import { SchemaManager } from './components/SchemaManager';
import { ConnectionSettingsModal } from './components/ConnectionSettingsModal';
import { SetupGuideModal } from './components/SetupGuideModal';
import { CODE_GS_SOURCE } from './config/CodeGsSource';
import { ShieldAlert, BookOpen, Layers, Users, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => api.getCurrentSession());
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>(() => api.getConnectionConfig());
  const [activeTab, setActiveTab] = useState<string>('submissions');
  const [schemas, setSchemas] = useState<DataSchema[]>(() => api.getSchemas());
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [preselectedFormSchemaId, setPreselectedFormSchemaId] = useState<string | undefined>();

  // Fetch submissions based on current auth role
  const loadSubmissions = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await api.getSubmissions();
      if (res.success && res.data) {
        setSubmissions(res.data);
      }
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Fetch users if Admin
  const loadUsers = useCallback(async () => {
    if (!session || session.role !== 'Admin') return;
    try {
      const res = await api.getUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    }
  }, [session]);

  // Initial load and reaction to session changes
  useEffect(() => {
    if (session) {
      // Set appropriate default tab
      if (session.role === 'Admin') {
        setActiveTab('submissions');
      } else {
        setActiveTab('new_entry');
      }
      loadSubmissions();
      loadUsers();
    }
  }, [session, loadSubmissions, loadUsers]);

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    api.clearSession();
    setSession(null);
  };

  const handleConfigUpdated = (newConfig: ConnectionConfig) => {
    setConnectionConfig(newConfig);
    // Reload data if logged in
    if (session) {
      loadSubmissions();
      loadUsers();
    }
  };

  const handleResetData = () => {
    api.resetSandboxData();
    setSchemas(api.getSchemas());
    loadSubmissions();
    loadUsers();
  };

  const handleSchemasUpdated = () => {
    setSchemas(api.getSchemas());
  };

  const handleSelectSchemaForSubmission = (schemaId: string) => {
    setPreselectedFormSchemaId(schemaId);
    setActiveTab('new_entry');
  };

  const handleSubmissionSuccess = (record: SubmissionRecord) => {
    setSubmissions((prev) => [record, ...prev]);
  };

  // If unauthenticated, show Login portal
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onOpenSetupGuide={() => setShowSetupGuide(true)}
          onOpenConnectionModal={() => setShowConnectionModal(true)}
          connectionConfig={connectionConfig}
        />

        <ConnectionSettingsModal
          isOpen={showConnectionModal}
          onClose={() => setShowConnectionModal(false)}
          config={connectionConfig}
          onConfigUpdated={handleConfigUpdated}
          onResetData={handleResetData}
        />

        <SetupGuideModal
          isOpen={showSetupGuide}
          onClose={() => setShowSetupGuide(false)}
          codeGsSource={CODE_GS_SOURCE}
        />
      </div>
    );
  }

  const isAdmin = session.role === 'Admin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Navigation */}
      <Header
        session={session}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenConnectionModal={() => setShowConnectionModal(true)}
        onOpenSetupGuide={() => setShowSetupGuide(true)}
        connectionConfig={connectionConfig}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Context Breadcrumb / Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-850">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <span className="text-white font-medium">
              {isAdmin ? 'System Administration Console' : 'User Operations Portal'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-300">
              Role: <strong className={isAdmin ? 'text-indigo-400' : 'text-emerald-400'}>{session.role}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Storage Backend:</span>
            <span className="font-mono text-slate-300">
              {connectionConfig.mode === 'live' ? 'Google Sheets Web App API (Live)' : 'Local High-Fidelity Sandbox'}
            </span>
          </div>
        </div>

        {/* View Switcher based on Active Tab & RBAC */}
        {isAdmin && activeTab === 'submissions' && (
          <UnifiedDataViewer
            submissions={submissions}
            schemas={schemas}
            session={session}
            users={users}
            loading={loading}
            onRefresh={loadSubmissions}
            title="Consolidated Enterprise Data Feed"
            subtitle="Aggregated chronological timeline syncing 7 dynamic Google Sheet collection tabs in real-time."
          />
        )}

        {isAdmin && activeTab === 'schemas' && (
          <SchemaManager
            schemas={schemas}
            onSchemaUpdated={handleSchemasUpdated}
            onSelectSchemaForSubmission={handleSelectSchemaForSubmission}
          />
        )}

        {isAdmin && activeTab === 'users' && (
          <UserManagement
            users={users}
            submissions={submissions}
            onRefreshUsers={loadUsers}
          />
        )}

        {/* Common Form Submission View */}
        {activeTab === 'new_entry' && (
          <DynamicForm
            schemas={schemas}
            session={session}
            selectedSchemaId={preselectedFormSchemaId}
            onSubmissionSuccess={handleSubmissionSuccess}
            onNavigateToRecords={() => setActiveTab(isAdmin ? 'submissions' : 'my_submissions')}
          />
        )}

        {/* Standard User Personal Portal */}
        {!isAdmin && activeTab === 'my_submissions' && (
          <UnifiedDataViewer
            submissions={submissions}
            schemas={schemas}
            session={session}
            loading={loading}
            onRefresh={loadSubmissions}
            title="My Personal Submission Portal"
            subtitle={`Strictly scoped records submitted by @${session.username}. Real-time synchronization across all active formats.`}
          />
        )}

      </main>

      {/* Global Modals */}
      <ConnectionSettingsModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        config={connectionConfig}
        onConfigUpdated={handleConfigUpdated}
        onResetData={handleResetData}
      />

      <SetupGuideModal
        isOpen={showSetupGuide}
        onClose={() => setShowSetupGuide(false)}
        codeGsSource={CODE_GS_SOURCE}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            SheetFlow RBAC · Powered by Google Sheets & Apps Script Web App API
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSetupGuide(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Setup Instructions & Code.gs
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setShowConnectionModal(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Endpoint Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
