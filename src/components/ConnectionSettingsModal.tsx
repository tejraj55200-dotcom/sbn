import React, { useState } from 'react';
import { ConnectionConfig } from '../types';
import { api } from '../services/api';
import {
  Server,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface ConnectionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConnectionConfig;
  onConfigUpdated: (newConfig: ConnectionConfig) => void;
  onResetData: () => void;
}

export const ConnectionSettingsModal: React.FC<ConnectionSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
  onResetData,
}) => {
  const [mode, setMode] = useState<'simulator' | 'live'>(config.mode);
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!webAppUrl.trim()) {
      setTestResult({
        success: false,
        error: 'Please enter a Google Apps Script Web App URL first.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.testLiveConnection(webAppUrl.trim());
      setTestResult({
        success: res.success,
        message: res.message || 'Connected successfully to Google Apps Script Web App!',
        error: res.error,
        data: res.data,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'Connection test failed.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const updated: ConnectionConfig = {
      mode,
      webAppUrl: webAppUrl.trim(),
      lastConnectedAt: testResult?.success ? new Date().toISOString() : config.lastConnectedAt,
    };
    api.saveConnectionConfig(updated);
    onConfigUpdated(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Backend Connection & Endpoint Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Mode Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Execution Architecture Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('simulator')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  mode === 'simulator'
                    ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Local Sandbox Engine
                </div>
                <div className="text-[11px] text-slate-400 leading-normal">
                  In-memory simulation with pre-seeded users and 7 multi-schema data formats. Zero deployment needed.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode('live')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  mode === 'live'
                    ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Live Apps Script API
                </div>
                <div className="text-[11px] text-slate-400 leading-normal">
                  Connects directly to your deployed Google Sheet Apps Script Web App URL via real HTTP fetch calls.
                </div>
              </button>
            </div>
          </div>

          {/* Web App URL input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold">
                Google Apps Script Web App URL
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Ends with /exec
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={webAppUrl}
                onChange={(e) => {
                  setWebAppUrl(e.target.value);
                  setTestResult(null);
                }}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !webAppUrl}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-indigo-300 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>Test Live</span>
              </button>
            </div>
          </div>

          {/* Test connection results */}
          {testResult && (
            <div
              className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                testResult.success
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">
                    {testResult.success ? 'Google Sheet Web App Connected' : 'Connection Error'}
                  </div>
                  <div className="mt-1">
                    {testResult.message || testResult.error}
                  </div>
                  {testResult.data && (
                    <div className="mt-2 pt-2 border-t border-emerald-800/80 font-mono text-[11px] text-emerald-200">
                      <div>Spreadsheet: <span className="font-bold">{testResult.data.spreadsheetTitle}</span></div>
                      <div>Sheets: {testResult.data.activeSheets?.join(', ')}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sandbox Reset Option */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-slate-300 font-medium">Reset Sandbox Database</div>
              <div className="text-[11px] text-slate-500">
                Restores default users, passwords, and 9 sample records.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onResetData();
                setTestResult({
                  success: true,
                  message: 'Local sandbox database reset to pristine factory state.',
                });
              }}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset State</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium shadow-sm shadow-indigo-600/30"
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};
