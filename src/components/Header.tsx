import React from 'react';
import { AuthSession, ConnectionConfig } from '../types';
import { Database, LogOut, ShieldCheck, UserCheck, Settings, ExternalLink } from 'lucide-react';

interface HeaderProps {
  session: AuthSession;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenConnectionModal: () => void;
  onOpenSetupGuide: () => void;
  connectionConfig: ConnectionConfig;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenConnectionModal,
  onOpenSetupGuide,
  connectionConfig,
}) => {
  const isAdmin = session.role === 'Admin';

  const navItems = isAdmin
    ? [
        { id: 'submissions', label: 'Unified Feed' },
        { id: 'new_entry', label: 'New Submission' },
        { id: 'schemas', label: 'Data Schemas' },
        { id: 'users', label: 'User Directory' },
      ]
    : [
        { id: 'new_entry', label: 'Submit Form' },
        { id: 'my_submissions', label: 'My Submissions' },
      ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab(isAdmin ? 'submissions' : 'new_entry')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
                SheetFlow <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">RBAC</span>
              </div>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single-line text) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap transition-colors py-1 ${
                  isActive
                    ? 'text-white font-semibold border-b-2 border-indigo-500'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <button
            onClick={onOpenSetupGuide}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 whitespace-nowrap transition-colors py-1 text-sm font-medium"
          >
            <span>Setup & Code.gs</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </nav>

        {/* Zone 3: Connection Status & Account Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Connection status indicator */}
          <button
            onClick={onOpenConnectionModal}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors"
            title="Configure Google Apps Script API endpoint"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionConfig.mode === 'live' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-xs">
              {connectionConfig.mode === 'live' ? 'Live Apps Script' : 'Local Sandbox'}
            </span>
            <Settings className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User profile capsule & logout */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800 text-xs">
            <div className="text-right hidden lg:block">
              <div className="font-medium text-slate-200 truncate max-w-[130px]">
                {session.fullName || session.username}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 justify-end">
                {isAdmin ? (
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                ) : (
                  <UserCheck className="w-3 h-3 text-emerald-400" />
                )}
                <span>{session.role} · {session.department}</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center gap-4 pt-3 mt-3 border-t border-slate-800 text-xs overflow-x-auto pb-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded transition-colors ${
              activeTab === item.id
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          onClick={onOpenSetupGuide}
          className="whitespace-nowrap text-slate-400 hover:text-slate-200 px-2.5 py-1"
        >
          Setup Guide
        </button>
      </div>
    </header>
  );
};
