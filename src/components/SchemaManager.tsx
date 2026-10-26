import React, { useState } from 'react';
import { DataSchema, SchemaField, FieldType } from '../types';
import { api } from '../services/api';
import {
  FileSpreadsheet,
  Plus,
  Layers,
  CheckCircle2,
  X,
  Trash2,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface SchemaManagerProps {
  schemas: DataSchema[];
  onSchemaUpdated: () => void;
  onSelectSchemaForSubmission?: (schemaId: string) => void;
}

export const SchemaManager: React.FC<SchemaManagerProps> = ({
  schemas,
  onSchemaUpdated,
  onSelectSchemaForSubmission,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inspectSchema, setInspectSchema] = useState<DataSchema | null>(null);

  // New Schema Builder State
  const [schemaName, setSchemaName] = useState('');
  const [schemaCategory, setSchemaCategory] = useState('Operations');
  const [schemaDesc, setSchemaDesc] = useState('');
  const [sheetTab, setSheetTab] = useState('');
  const [schemaColor, setSchemaColor] = useState('#6366F1');
  const [fields, setFields] = useState<SchemaField[]>([
    { key: 'title', label: 'Title / Subject', type: 'text', required: true, placeholder: 'Enter title' },
    { key: 'category', label: 'Category', type: 'select', required: true, options: ['Tier 1', 'Tier 2', 'Tier 3'] },
    { key: 'metricValue', label: 'Score / Value', type: 'number', required: false, placeholder: '0' },
  ]);

  const handleAddField = () => {
    const nextIdx = fields.length + 1;
    setFields([
      ...fields,
      {
        key: `customField_${nextIdx}`,
        label: `Custom Field ${nextIdx}`,
        type: 'text',
        required: false,
        placeholder: 'Enter value...',
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    if (fields.length <= 1) return;
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: keyof SchemaField, val: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: val };
    setFields(updated);
  };

  const handleSaveSchema = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemaName.trim()) return;

    const id = schemaName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    const tab = sheetTab.trim() || `Data_${schemaName.replace(/\s+/g, '')}`;

    const newSchema: DataSchema = {
      id,
      name: schemaName.trim(),
      sheetTab: tab,
      category: schemaCategory.trim() || 'General',
      description: schemaDesc.trim() || 'Dynamic user submission schema',
      color: schemaColor,
      fields: fields.map((f) => ({
        ...f,
        key: f.key.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      })),
    };

    api.saveSchema(newSchema);
    onSchemaUpdated();
    setShowCreateModal(false);

    // Reset
    setSchemaName('');
    setSchemaDesc('');
    setSheetTab('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add Schema Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Configurable Dynamic Schemas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Administer collection formats. Each schema corresponds to a dedicated Google Sheet tab with transactional row sync.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Schema</span>
        </button>
      </div>

      {/* Grid of Schemas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schemas.map((schema) => (
          <div
            key={schema.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: schema.color }}
                  />
                  <span className="text-xs text-slate-400 font-medium">
                    {schema.category}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {schema.fields.length} Fields
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1.5">
                {schema.name}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {schema.description}
              </p>

              {/* Target Sheet Tab */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 mb-4 flex items-center gap-2 text-xs">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-500">Sheet:</span>
                <code className="text-emerald-300 font-mono text-[11px] truncate">
                  {schema.sheetTab}
                </code>
              </div>

              {/* Field types chip list */}
              <div className="space-y-1 mb-4">
                <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  Field Blueprint:
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {schema.fields.slice(0, 4).map((f) => (
                    <span
                      key={f.key}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-mono"
                    >
                      {f.label} ({f.type})
                    </span>
                  ))}
                  {schema.fields.length > 4 && (
                    <span className="text-[11px] px-2 py-0.5 text-slate-500 font-mono">
                      +{schema.fields.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => setInspectSchema(schema)}
                className="text-slate-400 hover:text-white font-medium"
              >
                Inspect Schema Blueprint
              </button>

              {onSelectSchemaForSubmission && (
                <button
                  onClick={() => onSelectSchemaForSubmission(schema.id)}
                  className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded font-medium transition-colors"
                >
                  Open Form
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Inspect Blueprint Modal */}
      {inspectSchema && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: inspectSchema.color }}
                  />
                  <span>{inspectSchema.name}</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Target Sheet Tab: {inspectSchema.sheetTab}
                </span>
              </div>
              <button
                onClick={() => setInspectSchema(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Schema Fields ({inspectSchema.fields.length})
                </h4>
                <div className="space-y-2">
                  {inspectSchema.fields.map((f, i) => (
                    <div
                      key={f.key}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{f.label}</span>
                          {f.required && (
                            <span className="text-[10px] text-rose-400 font-bold uppercase">
                              Required
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Key: <code className="text-indigo-300">{f.key}</code> · Type:{' '}
                          <code className="text-emerald-300">{f.type}</code>
                          {f.unit && ` (${f.unit})`}
                        </div>
                        {f.options && (
                          <div className="text-[11px] text-slate-500 mt-1">
                            Options: {f.options.join(', ')}
                          </div>
                        )}
                      </div>
                      <span className="text-slate-600 font-mono">#{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectSchema(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Schema Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Register New Dynamic Collection Schema</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchema} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Schema Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Environmental Chamber Audit"
                    value={schemaName}
                    onChange={(e) => setSchemaName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Operations / Compliance / Engineering"
                    value={schemaCategory}
                    onChange={(e) => setSchemaCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Target Google Sheet Tab Name (Auto-created if absent)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Data_EnvironmentalAudit"
                  value={sheetTab}
                  onChange={(e) => setSheetTab(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Description & Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain purpose of this form..."
                  value={schemaDesc}
                  onChange={(e) => setSchemaDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Field Builder */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                    Schema Fields ({fields.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Field</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Field Label"
                          value={f.label}
                          onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-white text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Key (e.g. hazardLevel)"
                          value={f.key}
                          onChange={(e) => handleFieldChange(idx, 'key', e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-indigo-300 font-mono text-xs"
                        />
                        <select
                          value={f.type}
                          onChange={(e) => handleFieldChange(idx, 'type', e.target.value as FieldType)}
                          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-white text-xs"
                        >
                          <option value="text">Text Input</option>
                          <option value="number">Numeric Value</option>
                          <option value="date">Date Picker</option>
                          <option value="select">Dropdown Select</option>
                          <option value="textarea">Multi-line Text</option>
                          <option value="boolean">Checkbox Boolean</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <input
                            type="checkbox"
                            checked={f.required}
                            onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                            className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <span>Required Field</span>
                        </label>

                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveField(idx)}
                            className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg"
                >
                  Register Schema & Tab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
