import { DataSchema } from '../types';

export const DEFAULT_SCHEMAS: DataSchema[] = [
  {
    id: 'daily_operations',
    name: 'Daily Operations Report',
    sheetTab: 'Data_DailyOperations',
    category: 'Operations',
    description: 'Track daily shift productivity, completed deliverables, and operating blockers.',
    color: '#3B82F6', // Blue
    fields: [
      { key: 'shift', label: 'Shift Schedule', type: 'select', required: true, options: ['Morning (08:00 - 16:00)', 'Afternoon (16:00 - 00:00)', 'Night (00:00 - 08:00)'] },
      { key: 'reportDate', label: 'Report Date', type: 'date', required: true },
      { key: 'tasksCompleted', label: 'Completed Deliverables', type: 'textarea', required: true, placeholder: 'List main tasks executed today...' },
      { key: 'hoursLogged', label: 'Productive Hours', type: 'number', required: true, unit: 'hrs', placeholder: '8' },
      { key: 'blockers', label: 'Roadblocks or Escalations', type: 'text', required: false, placeholder: 'None or describe impediments' },
      { key: 'handoffNotes', label: 'Next Shift Handoff Notes', type: 'textarea', required: false, placeholder: 'Instructions for incoming team' },
    ],
  },
  {
    id: 'inventory_assets',
    name: 'Inventory & Asset Log',
    sheetTab: 'Data_InventoryAssets',
    category: 'Logistics',
    description: 'Log movements, replenishment, intake, and audits across warehouse facilities.',
    color: '#10B981', // Emerald
    fields: [
      { key: 'itemSku', label: 'Item SKU / Asset Tag', type: 'text', required: true, placeholder: 'SKU-88219-X' },
      { key: 'itemName', label: 'Item Name & Specs', type: 'text', required: true, placeholder: 'Hydraulic Sensor Module V2' },
      { key: 'movementType', label: 'Movement Type', type: 'select', required: true, options: ['Stock Inbound', 'Stock Outbound / Dispatch', 'Damaged / Scrapped', 'Cycle Count Adjustment', 'Internal Transfer'] },
      { key: 'quantity', label: 'Quantity Adjusted', type: 'number', required: true, unit: 'units', placeholder: '25' },
      { key: 'warehouseLocation', label: 'Warehouse Zone / Bay', type: 'select', required: true, options: ['North Wing - Rack A', 'North Wing - Rack B', 'South Hub - Cold Storage', 'East Dock - Staging', 'Quarantine Hold'] },
      { key: 'referenceDoc', label: 'PO / Waybill Number', type: 'text', required: false, placeholder: 'PO-2026-904' },
    ],
  },
  {
    id: 'expense_records',
    name: 'Expense & Reimbursement Record',
    sheetTab: 'Data_ExpenseRecords',
    category: 'Finance',
    description: 'Submit business expenditures, travel claims, and vendor purchasing invoices.',
    color: '#F59E0B', // Amber
    fields: [
      { key: 'expenseCategory', label: 'Expense Category', type: 'select', required: true, options: ['Travel & Lodging', 'Client Meals & Entertainment', 'Software & Cloud Services', 'Office Hardware & Tools', 'Contractor Services', 'Logistics & Courier'] },
      { key: 'amount', label: 'Total Amount', type: 'number', required: true, placeholder: '240.50' },
      { key: 'currency', label: 'Currency', type: 'select', required: true, options: ['USD', 'EUR', 'GBP', 'CAD', 'SGD'] },
      { key: 'merchant', label: 'Vendor / Merchant Name', type: 'text', required: true, placeholder: 'e.g. AWS Cloud Services, Delta Air' },
      { key: 'expenseDate', label: 'Date Incurred', type: 'date', required: true },
      { key: 'receiptRef', label: 'Receipt / Invoice Number', type: 'text', required: true, placeholder: 'REC-991204' },
      { key: 'justification', label: 'Business Purpose & Project', type: 'textarea', required: true, placeholder: 'Explain business justification...' },
    ],
  },
  {
    id: 'safety_inspection',
    name: 'Site & Facility Safety Inspection',
    sheetTab: 'Data_SafetyInspections',
    category: 'Compliance',
    description: 'Mandatory workplace hazard audits, PPE checks, and equipment safety reviews.',
    color: '#EF4444', // Red
    fields: [
      { key: 'facilityZone', label: 'Facility Zone / Building', type: 'select', required: true, options: ['Main Assembly Floor', 'Chemical Storage Depot', 'Loading Dock 01', 'Electrical Substation B', 'Server Data Center Room'] },
      { key: 'hazardLevel', label: 'Observed Hazard Level', type: 'select', required: true, options: ['Level 0 - Compliant / Clean', 'Level 1 - Minor Advisory', 'Level 2 - Moderate Risk (Fix in 24h)', 'Level 3 - Critical Stop Work'] },
      { key: 'checkpointsPassed', label: 'Checkpoints Passed', type: 'number', required: true, placeholder: '12', unit: '/ 12' },
      { key: 'fireExtinguisherChecked', label: 'Fire Extinguishers & Exits Clear', type: 'boolean', required: true, defaultValue: true },
      { key: 'correctiveAction', label: 'Required Corrective Action', type: 'textarea', required: false, placeholder: 'Specify immediate rectification required...' },
      { key: 'supervisorSignoff', label: 'Supervisor / Lead Witness', type: 'text', required: true, placeholder: 'Lead Inspector Name' },
    ],
  },
  {
    id: 'quality_audit',
    name: 'Client Feedback & Quality Audit',
    sheetTab: 'Data_QualityAudits',
    category: 'Quality',
    description: 'Record client satisfaction scores, defect inspection reports, and SLA audits.',
    color: '#8B5CF6', // Purple
    fields: [
      { key: 'clientName', label: 'Client / Account Name', type: 'text', required: true, placeholder: 'Apex Global Logistics' },
      { key: 'projectCode', label: 'Project ID / Contract Ref', type: 'text', required: true, placeholder: 'PRJ-ALPHA-2026' },
      { key: 'satisfactionScore', label: 'Satisfaction Rating (1-10)', type: 'number', required: true, placeholder: '9', unit: 'pts' },
      { key: 'slaMet', label: 'All SLAs Met on Schedule', type: 'boolean', required: true, defaultValue: true },
      { key: 'feedbackSummary', label: 'Audit Findings & Feedback', type: 'textarea', required: true, placeholder: 'Detail client statements or QA inspector notes...' },
      { key: 'followUpAction', label: 'Required Follow-up', type: 'text', required: false, placeholder: 'Scheduled review meeting / root cause analysis' },
    ],
  },
  {
    id: 'it_requests',
    name: 'IT Equipment & Access Request',
    sheetTab: 'Data_ITRequests',
    category: 'IT & Security',
    description: 'Workstation hardware provisioning, software licensing, and cloud permission requests.',
    color: '#06B6D4', // Cyan
    fields: [
      { key: 'requestType', label: 'Request Classification', type: 'select', required: true, options: ['Laptop / Workstation Hardware', 'Peripheral (Monitor / Dock)', 'Cloud & Database Access Grant', 'Software License Seat', 'Security Token / YubiKey'] },
      { key: 'urgency', label: 'Urgency Level', type: 'select', required: true, options: ['Standard (3-5 business days)', 'Elevated (24-48 hours)', 'Critical Production Blocker'] },
      { key: 'specifications', label: 'Specification Details', type: 'textarea', required: true, placeholder: 'Specify exact model, RAM, OS, or AWS IAM role needed...' },
      { key: 'approverEmail', label: 'Department Manager Approver', type: 'text', required: true, placeholder: 'manager@enterprise.com' },
      { key: 'budgetCode', label: 'Cost Center / Budget Code', type: 'text', required: false, placeholder: 'CC-OPS-410' },
    ],
  },
  {
    id: 'milestone_updates',
    name: 'Project Milestone & Sprint Update',
    sheetTab: 'Data_MilestoneUpdates',
    category: 'Engineering',
    description: 'Deliverable sprint check-ins, sprint velocity, and deadline tracking.',
    color: '#EC4899', // Pink
    fields: [
      { key: 'projectName', label: 'Project Title', type: 'text', required: true, placeholder: 'NextGen Core Migration' },
      { key: 'milestonePhase', label: 'Current Phase / Sprint', type: 'select', required: true, options: ['Sprint Planning', 'Active Development', 'QA & Integration Testing', 'Security Audit', 'Staging Dry Run', 'Production Deployed'] },
      { key: 'percentComplete', label: 'Completion Percentage', type: 'number', required: true, unit: '%', placeholder: '75' },
      { key: 'targetReleaseDate', label: 'Target Release Date', type: 'date', required: true },
      { key: 'keyAccomplishments', label: 'Sprint Accomplishments', type: 'textarea', required: true, placeholder: 'Summarize completed user stories and pull requests...' },
      { key: 'risksAndMitigation', label: 'Risks & Mitigations', type: 'textarea', required: false, placeholder: 'Dependencies or timeline risks...' },
    ],
  },
];
