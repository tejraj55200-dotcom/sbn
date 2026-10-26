import React, { useState } from 'react';
import { DataSchema, AuthSession, SubmissionRecord } from '../types';
import { api } from '../services/api';
import { Send, CheckCircle2, AlertCircle, FileSpreadsheet, Sparkles, RefreshCw } from 'lucide-react';

interface DynamicFormProps {
  schemas: DataSchema[];
  session: AuthSession;
  selectedSchemaId?: string;
  onSubmissionSuccess?: (record: SubmissionRecord) => void;
  onNavigateToRecords?: () => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  schemas,
  session,
  selectedSchemaId,
  onSubmissionSuccess,
  onNavigateToRecords,
}) => {
  const [activeSchemaId, setActiveSchemaId] = useState<string>(
    selectedSchemaId || schemas[0]?.id || ''
  );
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successRecord, setSuccessRecord] = useState<SubmissionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeSchema = schemas.find((s) => s.id === activeSchemaId) || schemas[0];

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  const handleSchemaSelect = (schemaId: string) => {
    setActiveSchemaId(schemaId);
    setFormData({});
    setSuccessRecord(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchema) return;

    // Validate required fields
    for (const field of activeSchema.fields) {
      if (field.required) {
        const val = formData[field.key];
        if (val === undefined || val === null || val === '') {
          setError(`Required field missing: "${field.label}"`);
          return;
        }
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.submitRecord(activeSchema.id, formData);
      if (res.success && res.data) {
        setSuccessRecord(res.data);
        setFormData({});
        if (onSubmissionSuccess) {
          onSubmissionSuccess(res.data);
        }
      } else {
        setError(res.error || 'Failed to submit record.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving to sheet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrefillSample = () => {
    if (!activeSchema) return;
    const sample: Record<string, any> = {};
    activeSchema.fields.forEach((f) => {
      if (f.type === 'date') {
        sample[f.key] = new Date().toISOString().slice(0, 10);
      } else if (f.type === 'number') {
        sample[f.key] = f.placeholder ? parseInt(f.placeholder) || 10 : 25;
      } else if (f.type === 'select' && f.options?.length) {
        sample[f.key] = f.options[0];
      } else if (f.type === 'boolean') {
        sample[f.key] = true;
      } else if (f.type === 'textarea') {
        sample[f.key] = `Automated verification completed by ${session.fullName}. All compliance requirements reviewed.`;
      } else {
        sample[f.key] = f.placeholder || `Sample ${f.label}`;
      }
    });
    setFormData(sample);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Schema Selector Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Dynamic Data Collection
            </h2>
            <p className="text-xs text-slate-400">
              Select one of {schemas.length} configurable data schemas to submit to Google Sheets
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrefillSample}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium px-2.5 py-1.5 rounded bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pre-fill Sample Data</span>
          </button>
        </div>

        {/* Scrollable Schema Segmented Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {schemas.map((schema) => {
            const isSelected = schema.id === activeSchemaId;
            return (
              <button
                key={schema.id}
                onClick={() => handleSchemaSelect(schema.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-slate-800 text-white border-indigo-500 shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: schema.color }}
                />
                <span>{schema.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Sheet & Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        
        {/* Schema Header Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: activeSchema?.color }}
              />
              <h3 className="text-base font-bold text-white">
                {activeSchema?.name}
              </h3>
              <span className="text-xs text-slate-400">· {activeSchema?.category}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {activeSchema?.description}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded border border-slate-800 self-start sm:self-auto">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Target Sheet Tab:</span>
            <code className="text-emerald-300 font-mono font-medium">
              {activeSchema?.sheetTab}
            </code>
          </div>
        </div>

        {/* Success Banner */}
        {successRecord && (
          <div className="p-4 mb-6 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 text-xs flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-emerald-300">
                  Record Transmitted & Appended to Google Sheet
                </div>
                <div className="text-emerald-300/80 mt-1 font-mono">
                  ID: <span className="font-bold">{successRecord.id}</span> · Tagged to:{' '}
                  <span className="font-bold">{successRecord.submitted_by}</span> (
                  {successRecord.user_role})
                </div>
              </div>
            </div>
            {onNavigateToRecords && (
              <button
                type="button"
                onClick={onNavigateToRecords}
                className="whitespace-nowrap px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded font-medium transition-colors"
              >
                View in Timeline
              </button>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 mb-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Fields Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeSchema?.fields.map((field) => {
              const value = formData[field.key] ?? field.defaultValue ?? '';
              const isFullWidth = field.type === 'textarea';

              return (
                <div
                  key={field.key}
                  className={isFullWidth ? 'md:col-span-2' : 'col-span-1'}
                >
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {field.label}
                    {field.required && (
                      <span className="text-rose-400 ml-1 font-bold">*</span>
                    )}
                    {field.unit && (
                      <span className="text-slate-500 ml-1.5 font-normal font-mono">
                        ({field.unit})
                      </span>
                    )}
                  </label>

                  {/* Render based on field type */}
                  {field.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      required={field.required}
                      value={value}
                      placeholder={field.placeholder}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={value}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    >
                      <option value="">-- Choose Option --</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'boolean' ? (
                    <div className="flex items-center gap-3 pt-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                      <span className="text-xs text-slate-300">
                        {value ? 'Verified / True' : 'Unchecked / False'}
                      </span>
                    </div>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      step={field.type === 'number' ? 'any' : undefined}
                      required={field.required}
                      value={value}
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        handleFieldChange(
                          field.key,
                          field.type === 'number'
                            ? e.target.value === ''
                              ? ''
                              : Number(e.target.value)
                            : e.target.value
                        )
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-sans"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* User Tag & System Meta Notice */}
          <div className="pt-4 mt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Auto-stamped by:{' '}
              <span className="font-mono text-slate-200 font-medium">
                {session.username}
              </span>{' '}
              ({session.role}) · Dept:{' '}
              <span className="text-slate-300">{session.department}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({});
                  setError(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg text-xs transition-colors flex items-center gap-2 shadow-sm shadow-indigo-600/30"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Appending to Google Sheet...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit & Append Row</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
