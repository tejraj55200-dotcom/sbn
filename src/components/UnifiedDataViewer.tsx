import React, { useState, useMemo } from 'react';
import { SubmissionRecord, DataSchema, AuthSession, UserAccount } from '../types';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Clock,
  User,
  Eye,
  X,
  Layers,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

interface UnifiedDataViewerProps {
  submissions: SubmissionRecord[];
  schemas: DataSchema[];
  session: AuthSession;
  users?: UserAccount[];
  loading?: boolean;
  onRefresh?: () => void;
  title?: string;
  subtitle?: string;
}

export const UnifiedDataViewer: React.FC<UnifiedDataViewerProps> = ({
  submissions,
  schemas,
  session,
  users = [],
  loading = false,
  onRefresh,
  title = 'Unified Multi-Schema Timeline',
  subtitle = 'Consolidated chronological stream syncing submissions across all active Google Sheet tabs.',
}) => {
  const isAdmin = session.role === 'Admin';

  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [selectedSchemaFilter, setSelectedSchemaFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeViewMode, setActiveViewMode] = useState<'timeline' | 'table'>('timeline');
  const [inspectRecord, setInspectRecord] = useState<SubmissionRecord | null>(null);

  // Filter records
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((rec) => {
      // User filter (admin only; for standard user this is already server/simulator filtered)
      if (isAdmin && selectedUserFilter !== 'ALL') {
        if (rec.submitted_by.toLowerCase() !== selectedUserFilter.toLowerCase()) {
          return false;
        }
      }

      // Schema filter
      if (selectedSchemaFilter !== 'ALL' && rec.schema_id !== selectedSchemaFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = rec.id.toLowerCase().includes(q);
        const matchesUser = rec.submitted_by.toLowerCase().includes(q);
        const matchesSchema = rec.schema_name.toLowerCase().includes(q);
        const matchesData = JSON.stringify(rec.data).toLowerCase().includes(q);
        if (!matchesId && !matchesUser && !matchesSchema && !matchesData) {
          return false;
        }
      }

      return true;
    });
  }, [submissions, isAdmin, selectedUserFilter, selectedSchemaFilter, searchQuery]);

  // Schema lookup map
  const schemaMap = useMemo(() => {
    const map = new Map<string, DataSchema>();
    schemas.forEach((s) => map.set(s.id, s));
    return map;
  }, [schemas]);

  // Distinct user submitters in dataset
  const distinctSubmitters = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => set.add(s.submitted_by));
    return Array.from(set).sort();
  }, [submissions]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) return;

    // Collect all unique data keys
    const allDataKeys = new Set<string>();
    filteredSubmissions.forEach((r) => {
      Object.keys(r.data).forEach((k) => allDataKeys.add(k));
    });
    const dataKeysArray = Array.from(allDataKeys);

    const headers = ['Record_ID', 'Timestamp_ISO', 'Submitted_By', 'User_Role', 'Schema_Name', ...dataKeysArray];
    const rows = filteredSubmissions.map((r) => {
      const row = [
        `"${r.id}"`,
        `"${r.timestamp}"`,
        `"${r.submitted_by}"`,
        `"${r.user_role}"`,
        `"${r.schema_name}"`,
      ];
      dataKeysArray.forEach((k) => {
        const val = r.data[k];
        const formatted = val === undefined || val === null ? '' : String(val).replace(/"/g, '""');
        row.push(`"${formatted}"`);
      });
      return row.join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `sheetflow_export_${selectedUserFilter}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredSubmissions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `sheetflow_submissions_${selectedUserFilter}_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Global Actions: Export & Refresh */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors flex items-center gap-1.5"
              title="Refresh from Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={filteredSubmissions.length === 0}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={filteredSubmissions.length === 0}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            <span>JSON</span>
          </button>

          {/* View mode toggle */}
          <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setActiveViewMode('timeline')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                activeViewMode === 'timeline'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                activeViewMode === 'table'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Table Grid
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records, keys, or IDs..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Schema Selector Filter */}
          <div>
            <select
              value={selectedSchemaFilter}
              onChange={(e) => setSelectedSchemaFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Schemas ({schemas.length} Formats)</option>
              {schemas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter (Admin Only Feature) */}
          {isAdmin ? (
            <div>
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-indigo-500/40 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Users (Admin Global View)</option>
                {distinctSubmitters.map((u) => {
                  const match = users.find((user) => user.username === u);
                  return (
                    <option key={u} value={u}>
                      User: @{u} {match ? `(${match.fullName})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div className="flex items-center px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400">
              <User className="w-3.5 h-3.5 text-emerald-400 mr-2" />
              <span>Personal Scope: <span className="text-white font-mono font-medium">@{session.username}</span></span>
            </div>
          )}

          {/* Counter / Active Scope */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400">
            <span>Showing:</span>
            <span className="font-mono text-white font-semibold tabular-nums">
              {filteredSubmissions.length} of {submissions.length} rows
            </span>
          </div>

        </div>

        {/* Quick Filter Tag Indicators (Zero-pill text styling) */}
        {(selectedSchemaFilter !== 'ALL' || selectedUserFilter !== 'ALL' || searchQuery) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active filters:</span>
            {selectedSchemaFilter !== 'ALL' && (
              <span className="text-indigo-300 font-medium">
                Format: {schemaMap.get(selectedSchemaFilter)?.name || selectedSchemaFilter}
              </span>
            )}
            {selectedSchemaFilter !== 'ALL' && selectedUserFilter !== 'ALL' && (
              <span aria-hidden="true">·</span>
            )}
            {selectedUserFilter !== 'ALL' && (
              <span className="text-emerald-300 font-medium">
                User: @{selectedUserFilter}
              </span>
            )}
            {searchQuery && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300">"{searchQuery}"</span>
              </>
            )}
            <button
              onClick={() => {
                setSelectedSchemaFilter('ALL');
                setSelectedUserFilter('ALL');
                setSearchQuery('');
              }}
              className="ml-auto text-xs text-slate-400 hover:text-white underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
          <div className="text-sm text-slate-300">Synchronizing data from Google Sheets...</div>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-3">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No submission records match your filter</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try resetting your filters or submit a new form entry in one of the active schemas.
          </p>
        </div>
      ) : activeViewMode === 'timeline' ? (
        /* Unified Chronological Timeline View */
        <div className="space-y-3">
          {filteredSubmissions.map((record) => {
            const schema = schemaMap.get(record.schema_id);
            const accentColor = schema?.color || '#6366F1';
            const dateObj = new Date(record.timestamp);
            const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateFormatted = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <div
                key={record.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span className="font-bold text-white text-sm">
                      {record.schema_name}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      · {record.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1 font-mono">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-300 font-medium">@{record.submitted_by}</span>
                      <span className="text-slate-500">({record.user_role})</span>
                    </div>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <div className="flex items-center gap-1 text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{dateFormatted} {timeFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* Data Fields Preview Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {Object.entries(record.data).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/70">
                      <div className="text-[11px] font-medium text-slate-400 capitalize truncate mb-1">
                        {k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                      </div>
                      <div className="text-slate-200 font-medium truncate font-mono">
                        {typeof v === 'boolean'
                          ? v ? 'Yes' : 'No'
                          : String(v || '—')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inspect Action */}
                <div className="mt-3 pt-2 flex items-center justify-between text-xs text-slate-400">
                  <div className="text-[11px] text-slate-500 font-mono">
                    Sheet Tab: <code className="text-slate-400">{schema?.sheetTab || `Data_${record.schema_id}`}</code>
                  </div>
                  <button
                    onClick={() => setInspectRecord(record)}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Inspect Raw Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High-Density Spreadsheet Table Grid View */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Format Schema</th>
                  <th className="py-3 px-4">Submitted By</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Payload Summary</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-sans">
                {filteredSubmissions.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-indigo-300 whitespace-nowrap">
                      {row.id}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-white">
                      {row.schema_name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300">
                      @{row.submitted_by}{' '}
                      <span className="text-[10px] text-slate-500">({row.user_role})</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono">
                      {new Date(row.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate font-mono text-[11px]">
                      {Object.entries(row.data)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setInspectRecord(row)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium text-xs transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Inspector Drawer / Modal */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <span>Record Details</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                    {inspectRecord.id}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Schema: {inspectRecord.schema_name}
                </div>
              </div>
              <button
                onClick={() => setInspectRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Metadata Cluster */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <div>
                  <div className="text-slate-500 text-[11px] mb-1">Submitted By</div>
                  <div className="font-mono font-medium text-white">
                    @{inspectRecord.submitted_by} ({inspectRecord.user_role})
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px] mb-1">Timestamp (UTC)</div>
                  <div className="font-mono text-slate-300">
                    {new Date(inspectRecord.timestamp).toISOString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px] mb-1">Target Google Sheet</div>
                  <div className="font-mono text-emerald-400">
                    Data_{inspectRecord.schema_id}
                  </div>
                </div>
              </div>

              {/* Parsed Fields */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Form Field Values
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(inspectRecord.data).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800"
                    >
                      <div className="text-[11px] text-slate-400 font-mono mb-1 font-semibold">
                        {key}
                      </div>
                      <div className="text-white text-xs whitespace-pre-wrap break-words">
                        {typeof val === 'boolean' ? (val ? 'true (Verified)' : 'false') : String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON Payload */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Google Apps Script JSON Payload
                </h4>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {JSON.stringify(inspectRecord, null, 2)}
                </pre>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-800 flex justify-end bg-slate-950/60">
              <button
                onClick={() => setInspectRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
