import React, { useState } from 'react';
import { api } from '../services/api';
import { AuthSession, ConnectionConfig } from '../types';
import { Database, ShieldCheck, KeyRound, AlertCircle, ArrowRight, Server } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession) => void;
  onOpenSetupGuide: () => void;
  onOpenConnectionModal: () => void;
  connectionConfig: ConnectionConfig;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onOpenSetupGuide,
  onOpenConnectionModal,
  connectionConfig,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login(username, password);
      if (res.success && res.data) {
        onLoginSuccess(res.data);
      } else {
        setError(res.error || 'Login failed. Check credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center items-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md">
        
        {/* Brand Kicker */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-950">
            <Database className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            SheetFlow Portal
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Role-based enterprise portal backed by Google Sheets & Apps Script Web App API.
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
          
          {/* Top banner indicator for connection mode */}
          <div className="flex items-center justify-between text-xs text-slate-400 pb-4 mb-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionConfig.mode === 'live' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className="font-mono">
                {connectionConfig.mode === 'live' ? 'Live Apps Script Mode' : 'Local Sandbox Engine'}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenConnectionModal}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              <Server className="w-3 h-3" />
              Configure Endpoint
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or sarah_ops"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password / Access Token
                </label>
                <span className="text-[11px] text-slate-500">Admin-Managed Only</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/30"
            >
              {loading ? (
                <span>Validating Session...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick preset logins for reviewer ease */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 mb-2.5 flex items-center justify-between">
              <span>Quick Test Accounts</span>
              <span className="text-indigo-400 lowercase font-normal">Click to fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickSelect('admin', 'admin123')}
                className="p-2 text-left rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all"
              >
                <div className="font-semibold text-indigo-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  admin
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">Global Admin role</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('sarah_ops', 'user123')}
                className="p-2 text-left rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all"
              >
                <div className="font-semibold text-emerald-300">sarah_ops</div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">Logistics (User)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('john_doe', 'user123')}
                className="p-2 text-left rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all"
              >
                <div className="font-semibold text-cyan-300">john_doe</div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">Facility (User)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('marcus_qa', 'user123')}
                className="p-2 text-left rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all"
                title="Test Disabled account detection"
              >
                <div className="font-semibold text-rose-300">marcus_qa</div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">Disabled account test</div>
              </button>
            </div>
          </div>

          {/* Strict RBAC & No Public Registration Notice */}
          <div className="mt-5 p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-medium text-slate-300">Strict RBAC Policy:</span> Public self-registration and self-serve password resets are disabled by design. User accounts and roles are provisioned exclusively by Administrators in the <code className="font-mono text-slate-300">Users</code> Google Sheet.
          </div>
        </div>

        {/* Footer Link to Setup & Documentation */}
        <div className="text-center mt-6 text-xs text-slate-500">
          Need to deploy your Google Sheet and Apps Script?{' '}
          <button
            onClick={onOpenSetupGuide}
            className="text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-4"
          >
            Open Setup Guide & Code.gs
          </button>
        </div>

      </div>
    </div>
  );
};
