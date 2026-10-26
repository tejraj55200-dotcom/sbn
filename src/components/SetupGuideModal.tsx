import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  X,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  Server,
  FileSpreadsheet,
} from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  codeGsSource: string;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  codeGsSource,
}) => {
  const [activeTab, setActiveTab] = useState<'deployment' | 'code' | 'sheets' | 'rbac'>('deployment');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeGsSource);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Google Sheets & Apps Script Architecture Guide
              </h3>
              <p className="text-xs text-slate-400">
                Complete walkthrough for deploying the backend Web App API and configuring RBAC sheets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/60 text-xs font-medium">
          <button
            onClick={() => setActiveTab('deployment')}
            className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'deployment'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>1. Step-by-Step Deployment</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>2. Code.gs Source Code</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sheets'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>3. Google Sheet Tab Schemas</span>
          </button>

          <button
            onClick={() => setActiveTab('rbac')}
            className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'rbac'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. RBAC & Security Design</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          
          {/* TAB 1: Step-by-step Deployment */}
          {activeTab === 'deployment' && (
            <div className="space-y-5">
              <div className="bg-indigo-950/40 border border-indigo-800/60 p-4 rounded-xl text-indigo-200 leading-relaxed">
                <span className="font-bold text-white">How it works:</span> Google Apps Script runs directly within your Google Drive account, turning any Google Spreadsheet into a high-concurrency JSON REST API capable of serving GET queries and transactional POST writes without any third-party subscription fees or database servers.
              </div>

              <div className="space-y-4">
                
                {/* Step 1 */}
                <div className="flex gap-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">
                      Create a New Google Spreadsheet
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      Go to <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-flex items-center gap-0.5">sheets.new <ExternalLink className="w-3 h-3" /></a> and create a blank spreadsheet. Name it <code className="text-white font-mono font-semibold">SheetFlow RBAC Hub</code> (or any name you prefer).
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">
                      Open Apps Script Code Editor
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      In your spreadsheet menu bar, click <strong className="text-white">Extensions</strong> &gt; <strong className="text-white">Apps Script</strong>. This opens the Google Apps Script project attached to your spreadsheet.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-white text-sm">
                      Paste the Backend Code (Code.gs)
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      Erase any template code inside <code className="text-white font-mono">Code.gs</code> and paste the full script provided in Tab 2 of this guide (or from the project repository at <code className="text-slate-300 font-mono">/google-apps-script/Code.gs</code>). Click the disk icon (<strong className="text-white">Save</strong>).
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-white text-sm">
                      Deploy as a Web App
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      Click the blue <strong className="text-white">Deploy</strong> button at the top right, then select <strong className="text-white">New deployment</strong>:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-400">
                      <li>Click the gear icon next to "Select type" and choose <strong className="text-white">Web app</strong>.</li>
                      <li>Description: <code className="text-slate-300 font-mono">SheetFlow RBAC API v1</code>.</li>
                      <li>Execute as: <strong className="text-white">Me</strong> (your Google account).</li>
                      <li>Who has access: <strong className="text-emerald-400">Anyone</strong> (critical for CORS browser requests).</li>
                    </ul>
                    <p className="text-slate-400 leading-relaxed">
                      Click <strong className="text-white">Deploy</strong>, authorize the Google permissions prompt, and copy the generated <strong className="text-white">Web App URL</strong> (it starts with <code className="font-mono text-indigo-300">https://script.google.com/macros/s/.../exec</code>).
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    5
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">
                      Connect SheetFlow Portal
                    </h4>
                    <p className="text-slate-400 leading-relaxed">
                      In the top bar of this application, click the connection badge or open <strong className="text-white">Endpoint Settings</strong>. Select <strong className="text-emerald-400">Live Apps Script API</strong>, paste your Web App URL, and click <strong className="text-white">Test Live</strong>!
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: Complete Code.gs */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Production Code.gs File
                  </h4>
                  <p className="text-xs text-slate-400">
                    Ready to paste into your Google Apps Script editor. Contains doGet, doPost, LockService, and RBAC filtering.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Entire Code.gs</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-[500px] leading-relaxed">
                  {codeGsSource}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Google Sheet Tab Schemas */}
          {activeTab === 'sheets' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-white text-sm">
                  Google Sheet Database Structure
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  When deployed, the script will automatically create these tabs and format headers if they do not exist yet:
                </p>
              </div>

              <div className="space-y-4">
                
                {/* Users Sheet */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>1. Users Sheet Tab</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                      Dedicated Auth Verification Table
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Maintained exclusively by Administrators. General users cannot self-register.
                  </p>
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                        <tr>
                          <th className="p-2">Col A: Username</th>
                          <th className="p-2">Col B: Password</th>
                          <th className="p-2">Col C: Role</th>
                          <th className="p-2">Col D: Status</th>
                          <th className="p-2">Col E: FullName</th>
                          <th className="p-2">Col F: Department</th>
                          <th className="p-2">Col G: CreatedAt</th>
                          <th className="p-2">Col H: LastLogin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-400">
                        <tr>
                          <td className="p-2 text-white">admin</td>
                          <td className="p-2">admin123</td>
                          <td className="p-2 text-indigo-400">Admin</td>
                          <td className="p-2 text-emerald-400">Active</td>
                          <td className="p-2">Eleanor Vance</td>
                          <td className="p-2">Exec Ops</td>
                          <td className="p-2">2026-01-10</td>
                          <td className="p-2">2026-10-26</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-white">sarah_ops</td>
                          <td className="p-2">user123</td>
                          <td className="p-2 text-slate-300">User</td>
                          <td className="p-2 text-emerald-400">Active</td>
                          <td className="p-2">Sarah Chen</td>
                          <td className="p-2">Logistics</td>
                          <td className="p-2">2026-02-14</td>
                          <td className="p-2">2026-10-26</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dynamic Data Sheets */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>2. Dynamic Data_* Tabs (Multi-Schema Storage)</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                      Transactional Append
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Each schema logs to its own dedicated tab prefixed with <code className="font-mono text-slate-300">Data_</code> (e.g. <code className="font-mono text-slate-300">Data_DailyOperations</code>, <code className="font-mono text-slate-300">Data_InventoryAssets</code>, <code className="font-mono text-slate-300">Data_ExpenseRecords</code>).
                  </p>
                  <p className="text-slate-400 text-xs">
                    Every data tab automatically shares standard audit columns in Columns A–E:
                  </p>
                  <div className="bg-slate-900 p-3 rounded border border-slate-800 font-mono text-indigo-300 text-[11px]">
                    ["ID", "Timestamp", "Submitted_By", "User_Role", "Schema_ID", ...FormSpecificFields]
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: RBAC & Security Design */}
          {activeTab === 'rbac' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white text-sm">
                  Role-Based Access Control Architecture
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  How SheetFlow enforces strict isolation between Admin and Standard User roles:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Admin Role Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Administrator Role Privileges</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
                    <li><strong>Global Read & Write:</strong> Query all submissions across every user and every schema.</li>
                    <li><strong>User Directory Administration:</strong> Provision new user accounts, deactivate compromised users (<code className="font-mono text-rose-400">Disabled</code>), and reset credentials directly in Google Sheets.</li>
                    <li><strong>Dynamic Schema Management:</strong> Register new collection schemas and automatically provision new Google Sheet tabs.</li>
                    <li><strong>Individual & Collective Export:</strong> Filter data by specific user, date range, or schema, and export cleanly formatted CSV or JSON files.</li>
                  </ul>
                </div>

                {/* Standard User Role Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Standard User Scoped Isolation</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
                    <li><strong>Strict Scoped Isolation:</strong> Can ONLY query records where <code className="font-mono text-slate-200">Submitted_By == currentUser</code>.</li>
                    <li><strong>Zero Cross-Tenant Leakage:</strong> Server-side enforcement in Apps Script rejects any attempt by a Standard User to query other users' records.</li>
                    <li><strong>No Self-Registration:</strong> Cannot self-signup or tamper with role assignment.</li>
                    <li><strong>Multi-Format Submission:</strong> Access to all active schemas with auto-stamped audit metadata.</li>
                  </ul>
                </div>

              </div>

              {/* LockService notice */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-white mb-1">
                  Transactional Concurrency Protection (LockService)
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In high-traffic environments, multiple simultaneous submissions to Google Sheets can cause row collision. SheetFlow's <code className="font-mono text-indigo-300">Code.gs</code> leverages <code className="font-mono text-indigo-300">LockService.getScriptLock().waitLock(30000)</code> around every write operation, guaranteeing atomic row appending and serial execution integrity.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="text-xs text-slate-500">
            SheetFlow RBAC · Google Apps Script Web App Engine
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
