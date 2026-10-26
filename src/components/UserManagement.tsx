import React, { useState } from 'react';
import { UserAccount, SubmissionRecord } from '../types';
import { api } from '../services/api';
import {
  UserPlus,
  ShieldCheck,
  User,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface UserManagementProps {
  users: UserAccount[];
  submissions: SubmissionRecord[];
  onRefreshUsers: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  submissions,
  onRefreshUsers,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New User Form State
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    department: 'Operations',
    role: 'User' as 'Admin' | 'User',
    password: '',
  });

  // Calculate submission counts per user
  const submissionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    submissions.forEach((s) => {
      counts[s.submitted_by.toLowerCase()] = (counts[s.submitted_by.toLowerCase()] || 0) + 1;
    });
    return counts;
  }, [submissions]);

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await api.createUser(formData);
      if (res.success) {
        setMessage({ type: 'success', text: `User "${formData.username}" provisioned successfully in Users sheet.` });
        setShowAddModal(false);
        setFormData({
          username: '',
          fullName: '',
          department: 'Operations',
          role: 'User',
          password: '',
        });
        onRefreshUsers();
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to create user.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error creating user.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (user: UserAccount) => {
    const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';
    setLoading(true);
    setMessage(null);

    try {
      const res = await api.updateUserStatus(user.username, newStatus);
      if (res.success) {
        setMessage({ type: 'success', text: `User @${user.username} status set to ${newStatus}.` });
        onRefreshUsers();
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to update user status.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await api.updateUserStatus(resetModalUser.username, resetModalUser.status, newPassword);
      if (res.success) {
        setMessage({ type: 'success', text: `Password updated for @${resetModalUser.username} in Users sheet.` });
        setResetModalUser(null);
        setNewPassword('');
        onRefreshUsers();
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to reset password.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add User Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            User Directory & Access Control
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Admin-managed authentication roster synced directly with the <code className="text-slate-300 font-mono">Users</code> Google Sheet.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm shadow-indigo-600/30"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Global alert feedback */}
      {message && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sheet Verification Banner */}
      <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Google Sheet Target: <strong className="text-slate-200 font-mono">Users</strong> tab</span>
          <span aria-hidden="true">·</span>
          <span>Columns: <code className="text-slate-300 font-mono">Username, Password, Role, Status, FullName, Department, CreatedAt, LastLogin</code></span>
        </div>
        <div className="font-mono text-slate-300 text-xs font-semibold tabular-nums">
          {users.length} Active Accounts
        </div>
      </div>

      {/* Users High-Density Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Submissions</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {users.map((u) => {
                const subCount = submissionCounts[u.username.toLowerCase()] || 0;
                const isActive = u.status === 'Active';

                return (
                  <tr key={u.username} className="hover:bg-slate-800/50 transition-colors">
                    
                    {/* Username & Full Name */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">
                        {u.fullName || u.username}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        @{u.username}
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium">
                        {u.role === 'Admin' ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-indigo-300">Admin</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-300">User</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                      {u.department || 'Operations'}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-emerald-400' : 'bg-rose-500'
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            isActive ? 'text-emerald-300' : 'text-rose-400'
                          }`}
                        >
                          {u.status}
                        </span>
                      </div>
                    </td>

                    {/* Submissions count */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-200">
                      {subCount} records
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Never'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => setResetModalUser(u)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs inline-flex items-center gap-1"
                        title="Reset User Password"
                      >
                        <KeyRound className="w-3 h-3 text-slate-400" />
                        <span>Pass</span>
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20'
                        }`}
                      >
                        {isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Provision New User</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Username (Identifier) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. david_eng"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Miller"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="User">Standard User</option>
                    <option value="Admin">Global Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    required
                    placeholder="Operations"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Initial Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Temporary password..."
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Appending to Sheet...' : 'Add User to Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span>Reset Password: @{resetModalUser.username}</span>
              </h3>
              <button
                onClick={() => setResetModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-5 space-y-4 text-xs">
              <p className="text-slate-400">
                Enter a new password for <strong className="text-white">{resetModalUser.fullName}</strong>. This will be updated directly in the Google Sheet.
              </p>

              <div>
                <label className="block text-slate-300 font-medium mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="New password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
