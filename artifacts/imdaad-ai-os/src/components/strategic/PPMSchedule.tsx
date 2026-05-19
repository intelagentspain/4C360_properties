import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Bot,
  Brain,
  Calendar,
  Camera,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileText,
  Gauge,
  MapPin,
  Mic,
  Package,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  User,
  Users,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import type { ToastFn } from '@/lib/ui';

type PpmTab =
  | 'overview'
  | 'assets'
  | 'plans'
  | 'schedule'
  | 'execution'
  | 'compliance'
  | 'workforce'
  | 'inventory'
  | 'ai'
  | 'reports';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
type StrategyType = 'Time-based' | 'Usage-based' | 'Condition-based' | 'Predictive' | 'Regulatory';
type TaskStatus =
  | 'Scheduled'
  | 'Assigned'
  | 'In Progress'
  | 'Awaiting Evidence'
  | 'Verification Pending'
  | 'Completed'
  | 'Escalated'
  | 'Overdue';
type VerificationStatus = 'Passed' | 'Rejected' | 'Pending' | 'AI Review';

type PPMAsset = {
  id: string;
  name: string;
  category: string;
  property: string;
  location: string;
  manufacturer: string;
  model: string;
  serial: string;
  warranty: string;
  linkedVendor: string;
  linkedTeam: string;
  linkedProject?: string;
  healthScore: number;
  riskLevel: RiskLevel;
  maintenanceStrategy: string[];
  strategyTypes: StrategyType[];
  nextDue: string;
  overdueTasks: number;
  openIssues: number;
  predictedFailureRisk: number;
  aiNarrative: string;
};

type PPMPlan = {
  id: string;
  name: string;
  frequency: string;
  assetCategory: string;
  riskLevel: RiskLevel;
  complianceRequirement: string;
  checklist: string[];
  requiredEvidence: string[];
  estimatedDuration: string;
  requiredCertifications: string[];
  requiredParts: string[];
  escalationTriggers: string[];
};

type PPMTask = {
  id: string;
  assetId: string;
  ppmPlanId: string;
  asset: string;
  plan: string;
  property: string;
  dueDate: string;
  assignedTeam: string;
  assignedTech: string;
  status: TaskStatus;
  compliance: number;
  healthImpact: number;
  verificationStatus: VerificationStatus;
  riskLevel: RiskLevel;
  predictedFailureRisk: number;
  partsReadiness: 'Ready' | 'Low Stock' | 'Pending Delivery';
  sla: string;
  evidenceRequired: number;
  evidenceUploaded: number;
};

type MaintenanceExecution = {
  id: string;
  taskId: string;
  asset: string;
  technician: string;
  status: TaskStatus;
  progress: number;
  checklistComplete: number;
  evidence: string[];
  readings: { label: string; value: string; status: RiskLevel | 'normal' }[];
  partsUsed: string[];
  completionTime: string;
  verificationResult: VerificationStatus;
  gps: string;
  aiFindings: string;
  escalationHistory: string[];
};

type InventoryPart = {
  id: string;
  name: string;
  stock: number;
  reorderThreshold: number;
  linkedAssets: string[];
  supplier: string;
  leadTime: string;
  status: 'Available' | 'Low Stock' | 'Pending Order';
  nextRisk: string;
};

type AssetPrediction = {
  assetId: string;
  asset: string;
  predictionType: string;
  riskLevel: RiskLevel;
  confidence: number;
  recommendation: string;
  costExposure: string;
  timeToFailure: string;
};

type WorkforceMember = {
  name: string;
  team: string;
  certifications: string[];
  workload: number;
  completionRate: number;
  qualityScore: number;
  rejectionRate: number;
  utilization: number;
  aiNote: string;
};

type ReportCard = {
  title: string;
  cadence: string;
  owner: string;
  insight: string;
};

type Props = {
  onToast: ToastFn;
};

const tabs: { id: PpmTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'assets', label: 'Assets & Strategies' },
  { id: 'plans', label: 'PPM Plans' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'execution', label: 'Execution' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'workforce', label: 'Workforce' },
  { id: 'inventory', label: 'Inventory & Parts' },
  { id: 'ai', label: 'AI Insights' },
  { id: 'reports', label: 'Reports' },
];

const lifecycle = [
  'Asset',
  'Maintenance Strategy',
  'PPM Schedule',
  'Checklist',
  'Assignment',
  'Execution',
  'Evidence',
  'Verification',
  'KPI Impact',
  'Asset Health',
  'AI Prediction',
];

const assetGroups = [
  { category: 'HVAC', health: 82, overdue: 7, risk: 'High', nextDue: 'Today 14:00', trend: '-4 pts' },
  { category: 'Lift', health: 76, overdue: 5, risk: 'Critical', nextDue: 'Overdue 3d', trend: '-8 pts' },
  { category: 'Fire', health: 94, overdue: 1, risk: 'Medium', nextDue: 'Tomorrow', trend: '+2 pts' },
  { category: 'Electrical', health: 87, overdue: 2, risk: 'Medium', nextDue: '16 May', trend: 'Stable' },
  { category: 'Plumbing', health: 85, overdue: 1, risk: 'Low', nextDue: '18 May', trend: '+1 pt' },
  { category: 'Pools', health: 79, overdue: 2, risk: 'High', nextDue: 'Today 16:30', trend: '-5 pts' },
  { category: 'Security', health: 74, overdue: 0, risk: 'High', nextDue: '20 May', trend: '-6 pts' },
  { category: 'BMS', health: 88, overdue: 0, risk: 'Low', nextDue: '22 May', trend: '+3 pts' },
];

const assets: PPMAsset[] = [
  {
    id: 'asset-chiller-c04',
    name: 'Chiller Unit C-04',
    category: 'HVAC',
    property: 'Business Bay Tower Complex',
    location: 'B1 Chiller Plant',
    manufacturer: 'Trane',
    model: 'CVHF-910',
    serial: 'CH-C04-9981',
    warranty: 'Valid until Jul 2027',
    linkedVendor: 'CoolTech MEP',
    linkedTeam: 'MEP Team Alpha',
    linkedProject: 'Cooling Optimization Programme',
    healthScore: 72,
    riskLevel: 'high',
    maintenanceStrategy: ['Quarterly HVAC Service', 'Monthly Condition Check', 'AI pressure anomaly monitoring'],
    strategyTypes: ['Time-based', 'Condition-based', 'Predictive'],
    nextDue: 'Today 14:00',
    overdueTasks: 1,
    openIssues: 2,
    predictedFailureRisk: 68,
    aiNarrative:
      'Pressure delta has drifted for 3 readings in a row. AI recommends completing the quarterly PPM and checking refrigerant level before weekend load increases.',
  },
  {
    id: 'asset-lift-a2',
    name: 'Lift - Cluster A Block 2',
    category: 'Lift',
    property: 'JLT North Cluster',
    location: 'Tower 5 lift core',
    manufacturer: 'Otis',
    model: 'Gen2 Premier',
    serial: 'LF-A2-4410',
    warranty: 'Expired Mar 2026',
    linkedVendor: 'Vertical Mobility Services',
    linkedTeam: 'Lift Team Alpha',
    healthScore: 68,
    riskLevel: 'critical',
    maintenanceStrategy: ['Lift Safety Inspection', 'Usage counter review', 'Predictive motor vibration monitoring'],
    strategyTypes: ['Usage-based', 'Regulatory', 'Predictive'],
    nextDue: 'Overdue 3d',
    overdueTasks: 3,
    openIssues: 4,
    predictedFailureRisk: 79,
    aiNarrative:
      'Door cycle count and motor vibration both crossed the warning threshold. Maintenance should be accelerated and technician capacity rebalanced.',
  },
  {
    id: 'asset-fire-fp01',
    name: 'Fire Panel FP-01',
    category: 'Fire',
    property: 'Marina Vista',
    location: 'Basement fire command room',
    manufacturer: 'Honeywell',
    model: 'Notifier NFS2',
    serial: 'FP-01-2207',
    warranty: 'Valid until Nov 2028',
    linkedVendor: 'SafeLine Fire Systems',
    linkedTeam: 'Fire Compliance Team',
    healthScore: 91,
    riskLevel: 'medium',
    maintenanceStrategy: ['Fire 6-Month Inspection', 'Regulatory test certificate', 'Battery health check'],
    strategyTypes: ['Time-based', 'Regulatory'],
    nextDue: 'Tomorrow',
    overdueTasks: 1,
    openIssues: 1,
    predictedFailureRisk: 22,
    aiNarrative:
      'Panel is healthy, but the last inspection has incomplete photo evidence. Compliance score will recover once verification is closed.',
  },
  {
    id: 'asset-ahu-a2',
    name: 'AHU - Block A Floor 2',
    category: 'HVAC',
    property: 'Lawnz Residences',
    location: 'Block A L2 plant room',
    manufacturer: 'Carrier',
    model: '39HQ',
    serial: 'AHU-A2-7721',
    warranty: 'Valid until Jan 2027',
    linkedVendor: 'CoolTech MEP',
    linkedTeam: 'MEP Team Beta',
    healthScore: 76,
    riskLevel: 'high',
    maintenanceStrategy: ['Monthly filter inspection', 'Quarterly HVAC Service', 'Condition-based pressure trend'],
    strategyTypes: ['Time-based', 'Condition-based'],
    nextDue: 'Today 11:30',
    overdueTasks: 2,
    openIssues: 3,
    predictedFailureRisk: 61,
    aiNarrative:
      'Repeated filter clogging suggests cleaning quality is inconsistent. AI recommends checklist tightening and supervisor verification.',
  },
  {
    id: 'asset-generator-g12',
    name: 'Generator G-12',
    category: 'Electrical',
    property: 'Gate Avenue DIFC',
    location: 'Service yard',
    manufacturer: 'Cummins',
    model: 'C550D5',
    serial: 'GEN-G12-0184',
    warranty: 'Valid until Sep 2029',
    linkedVendor: 'PowerGrid Services',
    linkedTeam: 'Electrical Team Delta',
    healthScore: 88,
    riskLevel: 'low',
    maintenanceStrategy: ['Generator Load Test', 'Monthly fuel level check', 'Quarterly battery inspection'],
    strategyTypes: ['Time-based', 'Regulatory'],
    nextDue: '16 May',
    overdueTasks: 0,
    openIssues: 0,
    predictedFailureRisk: 18,
    aiNarrative:
      'Generator is stable. Maintain monthly load test cadence and keep battery replacement stock above threshold.',
  },
  {
    id: 'asset-intercom-gate',
    name: 'Gate Intercom System',
    category: 'Security',
    property: 'Jumeirah Village Circle',
    location: 'Main resident gate',
    manufacturer: 'Comelit',
    model: 'IP Gateway 8501',
    serial: 'SEC-GATE-3302',
    warranty: 'Expired Dec 2025',
    linkedVendor: 'SecureAccess Systems',
    linkedTeam: 'Security Systems Team',
    healthScore: 69,
    riskLevel: 'high',
    maintenanceStrategy: ['Monthly connectivity test', 'Firmware patch check', 'Condition-based call failure monitoring'],
    strategyTypes: ['Time-based', 'Condition-based'],
    nextDue: '20 May',
    overdueTasks: 0,
    openIssues: 2,
    predictedFailureRisk: 57,
    aiNarrative:
      'Call failure rate increased after the last firmware update. AI recommends vendor review before peak visitor traffic.',
  },
];

const ppmPlans: PPMPlan[] = [
  {
    id: 'plan-hvac-quarterly',
    name: 'Quarterly HVAC Service',
    frequency: 'Quarterly',
    assetCategory: 'HVAC',
    riskLevel: 'high',
    complianceRequirement: 'Cooling plant operating readiness',
    checklist: ['Verify isolation and access', 'Record chilled water pressure', 'Inspect coils and strainers', 'Confirm temperature differential', 'Upload before/after photos'],
    requiredEvidence: ['Pressure reading', 'Temperature differential', 'Photo evidence', 'Supervisor sign-off'],
    estimatedDuration: '90 min',
    requiredCertifications: ['HVAC Level 2', 'Permit to Work'],
    requiredParts: ['R-410A Refrigerant', 'HVAC filter set'],
    escalationTriggers: ['Pressure outside operating range', 'Missing photo evidence', 'Repeated dirty filter finding'],
  },
  {
    id: 'plan-lift-safety',
    name: 'Lift Safety Inspection',
    frequency: 'Monthly',
    assetCategory: 'Lift',
    riskLevel: 'critical',
    complianceRequirement: 'Lift safety and passenger availability',
    checklist: ['Inspect landing doors', 'Test emergency phone', 'Check door alignment', 'Record motor vibration', 'Capture technician signature'],
    requiredEvidence: ['Door alignment photo', 'Vibration reading', 'Safety checklist signature'],
    estimatedDuration: '60 min',
    requiredCertifications: ['Lift Competent Person', 'Electrical Safety'],
    requiredParts: ['Door roller set', 'Sensor battery'],
    escalationTriggers: ['Door fault detected', 'Motor vibration above threshold', 'Safety phone failure'],
  },
  {
    id: 'plan-fire-panel',
    name: 'Fire 6-Month Inspection',
    frequency: '6-monthly',
    assetCategory: 'Fire',
    riskLevel: 'high',
    complianceRequirement: 'Fire and life safety readiness',
    checklist: ['Check panel status', 'Test alarm loop', 'Verify battery condition', 'Confirm civil defence label', 'Upload certificate'],
    requiredEvidence: ['Panel photo', 'Battery reading', 'Inspection certificate'],
    estimatedDuration: '45 min',
    requiredCertifications: ['Fire Systems Technician'],
    requiredParts: ['Fire sensor battery'],
    escalationTriggers: ['Alarm loop failure', 'Expired certificate', 'Missing authority evidence'],
  },
  {
    id: 'plan-generator-load',
    name: 'Generator Load Test',
    frequency: 'Monthly',
    assetCategory: 'Electrical',
    riskLevel: 'medium',
    complianceRequirement: 'Emergency power availability',
    checklist: ['Check oil and fuel level', 'Run load test', 'Record voltage stability', 'Inspect battery', 'Upload meter photos'],
    requiredEvidence: ['Load test reading', 'Meter photo', 'Battery condition photo'],
    estimatedDuration: '75 min',
    requiredCertifications: ['Electrical LV', 'Generator Operations'],
    requiredParts: ['Battery terminal kit', 'Fuel filter'],
    escalationTriggers: ['Voltage instability', 'Battery below threshold', 'Failed start sequence'],
  },
  {
    id: 'plan-pool-filtration',
    name: 'Pool Filtration Maintenance',
    frequency: 'Weekly',
    assetCategory: 'Pools',
    riskLevel: 'medium',
    complianceRequirement: 'Water quality and amenity readiness',
    checklist: ['Inspect pump pressure', 'Backwash filter', 'Check chemical dosing', 'Record water clarity', 'Upload water test strip'],
    requiredEvidence: ['Pressure reading', 'Water test photo'],
    estimatedDuration: '35 min',
    requiredCertifications: ['Pool Plant Operator'],
    requiredParts: ['Filter media', 'Test strips'],
    escalationTriggers: ['Low chlorine', 'High pump pressure', 'Cloudy water finding'],
  },
];

const ppmTasks: PPMTask[] = [
  {
    id: 'task-001',
    assetId: 'asset-chiller-c04',
    ppmPlanId: 'plan-hvac-quarterly',
    asset: 'Chiller Unit C-04',
    plan: 'Quarterly HVAC Service',
    property: 'Business Bay Tower Complex',
    dueDate: 'Today 14:00',
    assignedTeam: 'MEP Team Alpha',
    assignedTech: 'Ahmed K.',
    status: 'In Progress',
    compliance: 84,
    healthImpact: 6,
    verificationStatus: 'AI Review',
    riskLevel: 'high',
    predictedFailureRisk: 68,
    partsReadiness: 'Low Stock',
    sla: 'Due today',
    evidenceRequired: 4,
    evidenceUploaded: 2,
  },
  {
    id: 'task-002',
    assetId: 'asset-lift-a2',
    ppmPlanId: 'plan-lift-safety',
    asset: 'Lift - Cluster A Block 2',
    plan: 'Lift Safety Inspection',
    property: 'JLT North Cluster',
    dueDate: 'Overdue 3d',
    assignedTeam: 'Lift Team Alpha',
    assignedTech: 'Mariam Saleh',
    status: 'Overdue',
    compliance: 61,
    healthImpact: -8,
    verificationStatus: 'Pending',
    riskLevel: 'critical',
    predictedFailureRisk: 79,
    partsReadiness: 'Pending Delivery',
    sla: 'Breached',
    evidenceRequired: 3,
    evidenceUploaded: 0,
  },
  {
    id: 'task-003',
    assetId: 'asset-fire-fp01',
    ppmPlanId: 'plan-fire-panel',
    asset: 'Fire Panel FP-01',
    plan: 'Fire 6-Month Inspection',
    property: 'Marina Vista',
    dueDate: 'Tomorrow',
    assignedTeam: 'Fire Compliance Team',
    assignedTech: 'Sara N.',
    status: 'Awaiting Evidence',
    compliance: 92,
    healthImpact: 2,
    verificationStatus: 'Rejected',
    riskLevel: 'medium',
    predictedFailureRisk: 22,
    partsReadiness: 'Ready',
    sla: 'On track',
    evidenceRequired: 3,
    evidenceUploaded: 2,
  },
  {
    id: 'task-004',
    assetId: 'asset-ahu-a2',
    ppmPlanId: 'plan-hvac-quarterly',
    asset: 'AHU - Block A Floor 2',
    plan: 'Monthly Filter Inspection',
    property: 'Lawnz Residences',
    dueDate: 'Today 11:30',
    assignedTeam: 'MEP Team Beta',
    assignedTech: 'Ibrahim P.',
    status: 'Escalated',
    compliance: 77,
    healthImpact: -4,
    verificationStatus: 'Pending',
    riskLevel: 'high',
    predictedFailureRisk: 61,
    partsReadiness: 'Ready',
    sla: 'At risk',
    evidenceRequired: 2,
    evidenceUploaded: 1,
  },
  {
    id: 'task-005',
    assetId: 'asset-generator-g12',
    ppmPlanId: 'plan-generator-load',
    asset: 'Generator G-12',
    plan: 'Generator Load Test',
    property: 'Gate Avenue DIFC',
    dueDate: '16 May',
    assignedTeam: 'Electrical Team Delta',
    assignedTech: 'Omar H.',
    status: 'Scheduled',
    compliance: 96,
    healthImpact: 3,
    verificationStatus: 'Pending',
    riskLevel: 'low',
    predictedFailureRisk: 18,
    partsReadiness: 'Ready',
    sla: 'On track',
    evidenceRequired: 3,
    evidenceUploaded: 0,
  },
  {
    id: 'task-006',
    assetId: 'asset-intercom-gate',
    ppmPlanId: 'plan-hvac-quarterly',
    asset: 'Gate Intercom System',
    plan: 'Monthly Connectivity Test',
    property: 'Jumeirah Village Circle',
    dueDate: '20 May',
    assignedTeam: 'Security Systems Team',
    assignedTech: 'Nadia R.',
    status: 'Assigned',
    compliance: 82,
    healthImpact: 2,
    verificationStatus: 'Pending',
    riskLevel: 'high',
    predictedFailureRisk: 57,
    partsReadiness: 'Ready',
    sla: 'On track',
    evidenceRequired: 2,
    evidenceUploaded: 0,
  },
];

const executions: MaintenanceExecution[] = [
  {
    id: 'exec-001',
    taskId: 'task-001',
    asset: 'Chiller Unit C-04',
    technician: 'Ahmed K.',
    status: 'In Progress',
    progress: 68,
    checklistComplete: 6,
    evidence: ['Pressure gauge photo', 'Chiller exterior photo'],
    readings: [
      { label: 'Chilled water pressure', value: '5.8 bar', status: 'high' },
      { label: 'Temperature differential', value: '4.1 C', status: 'medium' },
      { label: 'Condenser approach', value: 'Normal', status: 'normal' },
    ],
    partsUsed: ['HVAC filter set'],
    completionTime: '43 min elapsed',
    verificationResult: 'AI Review',
    gps: 'Inside B1 Chiller Plant geofence',
    aiFindings: 'Pressure reading is above the expected range. AI recommends refrigerant and strainer check before verification.',
    escalationHistory: ['AI flagged abnormal pressure trend', 'Supervisor notified at 10:42'],
  },
  {
    id: 'exec-002',
    taskId: 'task-003',
    asset: 'Fire Panel FP-01',
    technician: 'Sara N.',
    status: 'Awaiting Evidence',
    progress: 82,
    checklistComplete: 8,
    evidence: ['Panel photo', 'Battery meter photo'],
    readings: [
      { label: 'Battery voltage', value: '25.6 V', status: 'normal' },
      { label: 'Alarm loop', value: 'Pass', status: 'normal' },
    ],
    partsUsed: ['Fire sensor battery'],
    completionTime: 'Completed 08:55',
    verificationResult: 'Rejected',
    gps: 'Inside Marina Vista fire command room',
    aiFindings: 'Certificate upload is missing. Compliance cannot close until certificate evidence is attached.',
    escalationHistory: ['Evidence rejected by AI', 'Fire Compliance Lead requested certificate'],
  },
  {
    id: 'exec-003',
    taskId: 'task-004',
    asset: 'AHU - Block A Floor 2',
    technician: 'Ibrahim P.',
    status: 'Escalated',
    progress: 54,
    checklistComplete: 4,
    evidence: ['Filter photo'],
    readings: [
      { label: 'Differential pressure', value: 'High', status: 'high' },
      { label: 'Filter condition', value: 'Clogged', status: 'high' },
    ],
    partsUsed: [],
    completionTime: 'Escalated 11:05',
    verificationResult: 'Pending',
    gps: 'Inside Block A L2 plant room',
    aiFindings: 'Repeated filter blockage detected. AI recommends checklist update and stock reservation for filter sets.',
    escalationHistory: ['Technician escalated clogged filter', 'Inventory checked: filter sets available'],
  },
];

const inventoryParts: InventoryPart[] = [
  {
    id: 'part-r410a',
    name: 'R-410A Refrigerant',
    stock: 4,
    reorderThreshold: 8,
    linkedAssets: ['Chiller Unit C-04', 'AHU - Block A Floor 2'],
    supplier: 'Cooling Supplies UAE',
    leadTime: '6 days',
    status: 'Low Stock',
    nextRisk: 'HVAC PPM completion risk in 9 days',
  },
  {
    id: 'part-fire-battery',
    name: 'Fire sensor battery',
    stock: 28,
    reorderThreshold: 15,
    linkedAssets: ['Fire Panel FP-01'],
    supplier: 'SafeLine Fire Systems',
    leadTime: '3 days',
    status: 'Available',
    nextRisk: 'No immediate risk',
  },
  {
    id: 'part-hvac-filter',
    name: 'HVAC filter set',
    stock: 12,
    reorderThreshold: 10,
    linkedAssets: ['AHU - Block A Floor 2', 'Chiller Unit C-04'],
    supplier: 'AirFlow Parts',
    leadTime: '4 days',
    status: 'Available',
    nextRisk: 'High usage expected this week',
  },
  {
    id: 'part-door-roller',
    name: 'Lift door roller set',
    stock: 0,
    reorderThreshold: 3,
    linkedAssets: ['Lift - Cluster A Block 2'],
    supplier: 'Vertical Mobility Services',
    leadTime: '11 days',
    status: 'Pending Order',
    nextRisk: 'Lift overdue maintenance cannot fully close',
  },
];

const predictions: AssetPrediction[] = [
  {
    assetId: 'asset-chiller-c04',
    asset: 'Chiller Unit C-04',
    predictionType: 'Pressure anomaly',
    riskLevel: 'high',
    confidence: 88,
    recommendation: 'Complete quarterly service today and inspect refrigerant level.',
    costExposure: 'AED 42k',
    timeToFailure: '14-21 days',
  },
  {
    assetId: 'asset-lift-a2',
    asset: 'Lift - Cluster A Block 2',
    predictionType: 'Motor degradation risk',
    riskLevel: 'critical',
    confidence: 91,
    recommendation: 'Reassign certified lift technician and reserve door roller set.',
    costExposure: 'AED 78k',
    timeToFailure: '7-10 days',
  },
  {
    assetId: 'asset-ahu-a2',
    asset: 'AHU - Block A Floor 2',
    predictionType: 'Filter blockage trend',
    riskLevel: 'high',
    confidence: 84,
    recommendation: 'Increase cleaning frequency and add supervisor photo verification.',
    costExposure: 'AED 18k',
    timeToFailure: '21-30 days',
  },
  {
    assetId: 'asset-intercom-gate',
    asset: 'Gate Intercom System',
    predictionType: 'Call failure escalation',
    riskLevel: 'medium',
    confidence: 76,
    recommendation: 'Ask vendor to validate firmware and call routing logs.',
    costExposure: 'AED 9k',
    timeToFailure: '30 days',
  },
];

const workforce: WorkforceMember[] = [
  {
    name: 'Ahmed K.',
    team: 'MEP Team Alpha',
    certifications: ['HVAC Level 2', 'Permit to Work'],
    workload: 86,
    completionRate: 91,
    qualityScore: 88,
    rejectionRate: 4,
    utilization: 94,
    aiNote: 'High workload for 7 days. Reassign non-critical AHU jobs to Team Beta.',
  },
  {
    name: 'Mariam Saleh',
    team: 'Lift Team Alpha',
    certifications: ['Lift Competent Person', 'Electrical Safety'],
    workload: 98,
    completionRate: 83,
    qualityScore: 81,
    rejectionRate: 9,
    utilization: 97,
    aiNote: 'Capacity is the main reason Lift Cluster A is overdue. Add vendor support this week.',
  },
  {
    name: 'Sara N.',
    team: 'Fire Compliance Team',
    certifications: ['Fire Systems Technician'],
    workload: 62,
    completionRate: 95,
    qualityScore: 92,
    rejectionRate: 3,
    utilization: 71,
    aiNote: 'Strong completion rate, but evidence certificate upload requires checklist enforcement.',
  },
];

const reports: ReportCard[] = [
  {
    title: 'PPM Compliance Report',
    cadence: 'Weekly',
    owner: 'Operations Director',
    insight: 'HVAC compliance is stable at 91%, while lift inspections need immediate recovery.',
  },
  {
    title: 'Asset Health Report',
    cadence: 'Monthly',
    owner: 'Asset Manager',
    insight: 'Six assets are below 75 health. Three are connected to repeated missed PPM.',
  },
  {
    title: 'Maintenance Execution Report',
    cadence: 'Daily',
    owner: 'FM Control Room',
    insight: 'Evidence rejection is the largest cause of delayed verification.',
  },
  {
    title: 'Inventory Risk Report',
    cadence: 'Weekly',
    owner: 'Storekeeper',
    insight: 'Refrigerant and lift door rollers are the two stock risks affecting critical PPM.',
  },
  {
    title: 'Predicted Failure Report',
    cadence: 'Monthly',
    owner: 'Reliability Lead',
    insight: 'Lift motor degradation and chiller pressure anomaly require action before failure.',
  },
];

const attentionItems = [
  { title: 'Lift Cluster A overdue by 3 days', impact: 'Passenger availability and SLA risk', severity: 'critical' as RiskLevel },
  { title: 'Chiller Unit C-04 predicted pressure issue', impact: 'Cooling failure risk in 14-21 days', severity: 'high' as RiskLevel },
  { title: 'Fire panel inspection incomplete', impact: 'Missing certificate evidence blocks compliance closure', severity: 'medium' as RiskLevel },
  { title: 'AHU Block A repeated filter clogging', impact: 'Checklist quality and stock usage issue', severity: 'high' as RiskLevel },
  { title: 'Gate Intercom health deteriorating', impact: 'Resident access calls may fail during peak hours', severity: 'high' as RiskLevel },
];

const pulseItems = [
  '3 HVAC units show abnormal pressure patterns and need condition checks before the weekend.',
  'Lift Team Alpha is overloaded for the next 7 days. AI recommends vendor support for overdue jobs.',
  'Generator PPM compliance improved 14% this month after schedule rebalancing.',
  'Repeated MEP rework is linked to incomplete cleaning evidence on AHU checklists.',
];

const executionFeed = [
  { text: 'Ahmed K. uploaded pressure reading for Chiller Unit C-04', time: 'Just now', tone: 'info' },
  { text: 'Fire Panel FP-01 inspection escalated for missing certificate', time: '8 min ago', tone: 'warning' },
  { text: 'Inventory alert: R-410A refrigerant below reorder threshold', time: '14 min ago', tone: 'critical' },
  { text: 'AI verified generator load test evidence', time: '26 min ago', tone: 'success' },
  { text: 'Lift Cluster A reassignment recommended due to team overload', time: '31 min ago', tone: 'warning' },
];

const riskTone: Record<RiskLevel, string> = {
  critical: 'border-red-500/40 bg-red-500/12 text-red-200',
  high: 'border-amber-500/40 bg-amber-500/12 text-amber-200',
  medium: 'border-sky-500/35 bg-sky-500/10 text-sky-200',
  low: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200',
};

const statusTone: Record<TaskStatus, string> = {
  Scheduled: 'border-blue-400/35 bg-blue-500/10 text-blue-200',
  Assigned: 'border-sky-400/35 bg-sky-500/10 text-sky-200',
  'In Progress': 'border-violet-400/40 bg-violet-500/12 text-violet-100',
  'Awaiting Evidence': 'border-amber-400/40 bg-amber-500/12 text-amber-100',
  'Verification Pending': 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100',
  Completed: 'border-emerald-400/40 bg-emerald-500/12 text-emerald-100',
  Escalated: 'border-red-400/40 bg-red-500/12 text-red-100',
  Overdue: 'border-red-400/40 bg-red-500/12 text-red-100',
};

const scheduleViews = ['Timeline', 'Calendar', 'Asset View', 'Team View', 'Site Map'];

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function Badge({ children, tone = 'border-slate-500/30 bg-slate-500/10 text-slate-200' }: { children: string; tone?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${tone}`}>{children}</span>;
}

function ProgressBar({ value, tone = 'bg-cyan-400' }: { value: number; tone?: string }) {
  return (
    <div className="h-2 rounded-full bg-[#07101C]">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`h-full rounded-full ${tone}`}
      />
    </div>
  );
}

function SectionHeader({ icon: Icon, eyebrow, title, action }: { icon: LucideIcon; eyebrow?: string; title: string; action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-300">{eyebrow}</p>}
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
      </div>
      {action && <button className="text-sm font-bold text-blue-300 hover:text-white">{action}</button>}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <Sparkles className="h-4 w-4 text-violet-300" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">{label}</p>
      <p className="mt-2 font-['Syne'] text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </motion.div>
  );
}

function LifecycleStrip() {
  return (
    <div className="rounded-2xl border border-[#1C3050] bg-[#0B1728] p-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">
        <Activity className="h-4 w-4 text-red-300" />
        Connected PPM lifecycle
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {lifecycle.map((step, index) => (
          <div
            key={step}
            className="min-h-[52px] min-w-0 rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-slate-200"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-300">
              Step {String(index + 1).padStart(2, '0')}
            </p>
            <p className="mt-1 text-[12px] font-bold leading-snug">
              {step}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetHealthCard({ group }: { group: (typeof assetGroups)[number] }) {
  const tone = group.health >= 85 ? 'bg-emerald-400' : group.health >= 78 ? 'bg-amber-400' : 'bg-red-400';
  const risk = group.risk.toLowerCase() as RiskLevel;
  return (
    <div className="rounded-2xl border border-[#1C3050] bg-[#0B1728] p-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-bold text-white">{group.category}</h4>
          <p className="mt-1 text-xs text-slate-400">Next due: {group.nextDue}</p>
        </div>
        <Badge tone={riskTone[risk]}>{group.risk}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[11px] uppercase text-blue-300">Health</p>
          <p className="text-xl font-bold text-white">{group.health}%</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-blue-300">Overdue</p>
          <p className="text-xl font-bold text-white">{group.overdue}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-blue-300">Trend</p>
          <p className="text-sm font-bold text-slate-200">{group.trend}</p>
        </div>
      </div>
      <div className="mt-4">
        <ProgressBar value={group.health} tone={tone} />
      </div>
    </div>
  );
}

function AttentionRow({ title, impact, severity }: { title: string; impact: string; severity: RiskLevel }) {
  return (
    <button className="w-full rounded-xl border border-[#1C3050] bg-[#07101C] p-3 text-left transition hover:border-red-400/40 hover:bg-red-500/8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-400">{impact}</p>
        </div>
        <Badge tone={riskTone[severity]}>{severity}</Badge>
      </div>
    </button>
  );
}

function PlanCard({ plan, onUse }: { plan: PPMPlan; onUse: () => void }) {
  return (
    <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">{plan.assetCategory}</p>
          <h4 className="mt-2 text-lg font-bold text-white">{plan.name}</h4>
          <p className="mt-1 text-sm text-slate-400">{plan.complianceRequirement}</p>
        </div>
        <Badge tone={riskTone[plan.riskLevel]}>{plan.riskLevel}</Badge>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-[#07101C] p-3">
          <p className="text-[11px] uppercase text-blue-300">Frequency</p>
          <p className="mt-1 font-bold text-white">{plan.frequency}</p>
        </div>
        <div className="rounded-xl bg-[#07101C] p-3">
          <p className="text-[11px] uppercase text-blue-300">Duration</p>
          <p className="mt-1 font-bold text-white">{plan.estimatedDuration}</p>
        </div>
        <div className="rounded-xl bg-[#07101C] p-3">
          <p className="text-[11px] uppercase text-blue-300">Evidence</p>
          <p className="mt-1 font-bold text-white">{plan.requiredEvidence.length} items</p>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {plan.checklist.slice(0, 3).map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle className="h-4 w-4 text-emerald-300" />
            {item}
          </div>
        ))}
      </div>
      <button
        onClick={onUse}
        className="mt-5 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500"
      >
        Use plan
      </button>
    </div>
  );
}

function ScheduleTaskRow({ task, onOpen }: { task: PPMTask; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="w-full rounded-2xl border border-[#1C3050] bg-[#0B1728] p-4 text-left transition hover:border-blue-400/40">
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] lg:items-center">
        <div>
          <p className="font-bold text-white">{task.asset}</p>
          <p className="mt-1 text-sm text-slate-400">{task.plan} · {task.property}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-blue-300">Due</p>
          <p className="font-bold text-slate-200">{task.dueDate}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-blue-300">Assigned</p>
          <p className="font-bold text-slate-200">{task.assignedTech}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-blue-300">Asset health</p>
          <p className="font-bold text-slate-200">{task.compliance}% compliance</p>
        </div>
        <div>
          <p className="text-[11px] uppercase text-blue-300">Parts</p>
          <p className="font-bold text-slate-200">{task.partsReadiness}</p>
        </div>
        <div className="flex justify-start lg:justify-end">
          <Badge tone={statusTone[task.status]}>{task.status}</Badge>
        </div>
      </div>
    </button>
  );
}

function ExecutionCard({ execution, onOpen }: { execution: MaintenanceExecution; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5 text-left transition hover:border-cyan-400/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-bold text-white">{execution.asset}</h4>
          <p className="mt-1 text-sm text-slate-400">{execution.technician} · {execution.completionTime}</p>
        </div>
        <Badge tone={statusTone[execution.status]}>{execution.status}</Badge>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>Checklist {execution.checklistComplete}/10</span>
          <span>{execution.progress}%</span>
        </div>
        <ProgressBar value={execution.progress} tone="bg-cyan-400" />
      </div>
      <div className="mt-5 rounded-xl bg-[#07101C] p-3 text-sm text-slate-300">
        <Sparkles className="mr-2 inline h-4 w-4 text-violet-300" />
        {execution.aiFindings}
      </div>
    </button>
  );
}

function DrawerShell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.aside
      initial={{ x: 56, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 56, opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="fixed bottom-3 left-3 right-3 top-16 z-50 flex overflow-hidden rounded-2xl border border-[#1C3050] bg-[#07101C] shadow-2xl sm:bottom-4 sm:left-auto sm:right-4 sm:top-20 sm:w-[min(520px,calc(100vw-2rem))]"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-[#1C3050] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">PPM Intelligence</p>
              <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">{title}</h3>
              <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
            </div>
            <button onClick={onClose} className="shrink-0 rounded-xl border border-[#1C3050] p-2 text-slate-300 transition hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
          <div className="space-y-4">{children}</div>
        </div>
      </div>
    </motion.aside>
  );
}

function ProjectCopilot({ onClose }: { onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(
    'The most urgent PPM issue is Lift Cluster A. It is overdue, the assigned team is overloaded, and the required roller part is still pending delivery.'
  );

  const ask = () => {
    const lower = question.toLowerCase();
    if (lower.includes('parts') || lower.includes('stock')) {
      setAnswer('R-410A refrigerant and lift door rollers are the next inventory constraints. Reorder refrigerant today and escalate the lift roller delivery because it blocks overdue lift maintenance.');
    } else if (lower.includes('team') || lower.includes('overloaded')) {
      setAnswer('Lift Team Alpha is at 98% workload and should not receive more critical jobs this week. AI recommends vendor support for Lift Cluster A and moving two lower-risk HVAC jobs to MEP Team Beta.');
    } else if (lower.includes('risk') || lower.includes('asset')) {
      setAnswer('The highest-risk assets are Lift Cluster A, Chiller C-04, and AHU Block A. The common pattern is missed or incomplete PPM evidence combined with abnormal readings.');
    } else {
      setAnswer('PPM compliance is strong overall at 92%, but failure prevention depends on clearing 18 overdue tasks, closing missing evidence, and resolving the lift parts constraint.');
    }
  };

  return (
    <DrawerShell title="PPM Intelligence Copilot" subtitle="Ask about asset health, compliance, workforce, inventory, and predicted failures." onClose={onClose}>
      <div className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4">
        <p className="text-sm font-bold text-white">What matters now</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          AI is watching overdue tasks, abnormal readings, missing evidence, technician capacity, and part readiness across critical assets.
        </p>
      </div>
      <div className="space-y-2">
        {['Which assets are most at risk?', 'Why is Lift Cluster A overdue?', 'Which team is overloaded?', 'Which parts will run out next month?'].map((prompt) => (
          <button
            key={prompt}
            onClick={() => {
              setQuestion(prompt);
              setTimeout(ask, 0);
            }}
            className="w-full rounded-xl border border-[#1C3050] bg-[#0B1728] px-4 py-3 text-left text-sm font-bold text-slate-200 hover:border-violet-400/50"
          >
            {prompt}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">Copilot answer</p>
        <p className="mt-3 text-sm leading-6 text-slate-200">{answer}</p>
      </div>
      <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-[#1C3050] bg-[#07101C]/95 p-4 backdrop-blur">
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') ask();
            }}
            placeholder="Ask what is at risk, who is overloaded, or what to do next..."
            className="min-w-0 flex-1 rounded-xl border border-[#1C3050] bg-[#0B1728] px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
          />
          <button onClick={ask} className="rounded-xl bg-violet-600 px-4 py-3 text-white hover:bg-violet-500">
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </DrawerShell>
  );
}

export function PPMSchedule({ onToast }: Props) {
  const [activeTab, setActiveTab] = useState<PpmTab>('overview');
  const [selectedAsset, setSelectedAsset] = useState<PPMAsset | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<MaintenanceExecution | null>(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(false);
  const [planPrompt, setPlanPrompt] = useState('Create a quarterly maintenance plan for water-cooled chillers in residential towers.');
  const [scheduleView, setScheduleView] = useState('Timeline');

  const selectedExecutionTask = useMemo(
    () => (selectedExecution ? ppmTasks.find((task) => task.id === selectedExecution.taskId) : undefined),
    [selectedExecution]
  );

  const openExecution = (task: PPMTask) => {
    const execution = executions.find((item) => item.taskId === task.id);
    if (execution) {
      setSelectedExecution(execution);
    } else {
      onToast('Execution record will open once the technician starts this PPM.', 'info');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Settings} label="Active Assets" value={formatNumber(1842)} detail="Assets with active strategy" tone="bg-blue-500/15 text-blue-300" />
        <KpiCard icon={ShieldCheck} label="PPM Compliance" value="92%" detail="+4% vs last month" tone="bg-emerald-500/15 text-emerald-300" />
        <KpiCard icon={AlertTriangle} label="Overdue PPM" value="18" detail="7 are critical assets" tone="bg-amber-500/15 text-amber-300" />
        <KpiCard icon={Activity} label="Critical Assets" value="7" detail="Health below threshold" tone="bg-red-500/15 text-red-300" />
        <KpiCard icon={Brain} label="Predicted Failures" value="4" detail="Within 30 days" tone="bg-violet-500/15 text-violet-300" />
        <KpiCard icon={Gauge} label="Avg Asset Health" value="84%" detail="Across active estate" tone="bg-cyan-500/15 text-cyan-300" />
        <KpiCard icon={Zap} label="Open Escalations" value="6" detail="2 require manager action" tone="bg-red-500/15 text-red-300" />
        <KpiCard icon={CheckCircle} label="First-Time Completion" value="89%" detail="Evidence accepted first pass" tone="bg-emerald-500/15 text-emerald-300" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5">
          <SectionHeader icon={Gauge} title="Asset Health Summary" eyebrow="Live readiness by asset group" />
          <div className="grid gap-4 md:grid-cols-2">
            {assetGroups.map((group) => (
              <AssetHealthCard key={group.category} group={group} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5">
            <SectionHeader icon={AlertTriangle} title="What Needs Attention" eyebrow="Prevent failure before it happens" />
            <div className="space-y-3">
              {attentionItems.map((item) => (
                <AttentionRow key={item.title} {...item} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-5">
            <SectionHeader icon={Brain} title="AI Maintenance Pulse" eyebrow="Pattern detection" />
            <div className="space-y-3">
              {pulseItems.map((item) => (
                <div key={item} className="rounded-xl bg-[#07101C] p-3 text-sm leading-6 text-slate-200">
                  <Sparkles className="mr-2 inline h-4 w-4 text-violet-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5">
        <SectionHeader icon={Activity} title="Live Execution Feed" eyebrow="Field activity and AI checks" action="View execution" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {executionFeed.map((item) => (
            <div key={item.text} className="rounded-xl border border-[#1C3050] bg-[#07101C] p-4">
              <p className="text-sm font-bold text-white">{item.text}</p>
              <p className="mt-2 text-xs text-slate-500">{item.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAssets = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#1C3050] bg-[#0B1728] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Asset strategy control</h3>
            <p className="mt-1 text-sm text-slate-400">Every asset has a strategy, a plan, a team, parts, evidence rules, and AI prediction.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#1C3050] bg-[#07101C] px-3 py-2 text-slate-400">
            <Search className="h-4 w-4" />
            <span className="text-sm">Search assets, strategy, vendor...</span>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {assets.map((asset) => (
          <button
            key={asset.id}
            onClick={() => setSelectedAsset(asset)}
            className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5 text-left transition hover:border-blue-400/45"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">{asset.category}</p>
                <h4 className="mt-2 text-xl font-bold text-white">{asset.name}</h4>
                <p className="mt-1 text-sm text-slate-400">{asset.property} · {asset.location}</p>
              </div>
              <Badge tone={riskTone[asset.riskLevel]}>{asset.riskLevel}</Badge>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-3">
              <div className="rounded-xl bg-[#07101C] p-3">
                <p className="text-[11px] uppercase text-blue-300">Health</p>
                <p className="font-bold text-white">{asset.healthScore}%</p>
              </div>
              <div className="rounded-xl bg-[#07101C] p-3">
                <p className="text-[11px] uppercase text-blue-300">Risk</p>
                <p className="font-bold text-white">{asset.predictedFailureRisk}%</p>
              </div>
              <div className="rounded-xl bg-[#07101C] p-3">
                <p className="text-[11px] uppercase text-blue-300">Overdue</p>
                <p className="font-bold text-white">{asset.overdueTasks}</p>
              </div>
              <div className="rounded-xl bg-[#07101C] p-3">
                <p className="text-[11px] uppercase text-blue-300">Next due</p>
                <p className="font-bold text-white">{asset.nextDue}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {asset.strategyTypes.map((strategy) => (
                <Badge key={strategy}>{strategy}</Badge>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{asset.aiNarrative}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPlans = () => (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          {ppmPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onUse={() => onToast(`${plan.name} connected to eligible assets and schedule rules.`, 'success')}
            />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-red-400/30 bg-red-500/8 p-5">
        <SectionHeader icon={Bot} title="AI Assist: Generate PPM Plan" eyebrow="Best-practice plan builder" />
        <textarea
          value={planPrompt}
          onChange={(event) => setPlanPrompt(event.target.value)}
          className="min-h-[130px] w-full rounded-2xl border border-[#1C3050] bg-[#07101C] p-4 text-sm leading-6 text-white outline-none focus:border-red-400"
        />
        <button
          onClick={() => {
            setGeneratedPlan(true);
            onToast('AI generated a mobile-ready PPM plan with evidence and escalation triggers.', 'success');
          }}
          className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-500"
        >
          Generate PPM Plan
        </button>
        {generatedPlan && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl border border-[#1C3050] bg-[#0B1728] p-4">
            <p className="font-bold text-white">Water-Cooled Chiller Quarterly PPM</p>
            <p className="mt-2 text-sm text-slate-300">6 sections · 22 checks · 5 evidence items · 90 min · HVAC Level 2 required</p>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              {['Safety isolation and permit check', 'Operational pressure and temperature readings', 'Coil, strainer, and leak inspection', 'Parts and consumables verification', 'Escalation if abnormal pressure repeats'].map((item) => (
                <div key={item} className="rounded-xl bg-[#07101C] p-3">
                  <CheckCircle className="mr-2 inline h-4 w-4 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SectionHeader icon={Calendar} title="Operational PPM Schedule" eyebrow="Timeline, teams, assets, and readiness" />
          <div className="flex flex-wrap gap-2">
            {scheduleViews.map((view) => (
              <button
                key={view}
                onClick={() => setScheduleView(view)}
                className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                  scheduleView === view
                    ? 'border-red-400 bg-red-500/15 text-white'
                    : 'border-[#1C3050] bg-[#07101C] text-slate-300 hover:border-blue-400/40'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-4 text-sm text-cyan-100">
          {scheduleView} view shows asset, plan, property, due date, assignment, risk, compliance, health, failure risk, parts readiness, and SLA in one flow.
        </div>
      </div>
      <div className="space-y-4">
        {['Overdue', 'Today', 'This Week', 'This Month', 'Critical Assets'].map((group) => {
          const groupTasks =
            group === 'Overdue'
              ? ppmTasks.filter((task) => task.status === 'Overdue')
              : group === 'Today'
                ? ppmTasks.filter((task) => task.dueDate.startsWith('Today'))
                : group === 'Critical Assets'
                  ? ppmTasks.filter((task) => task.riskLevel === 'critical' || task.riskLevel === 'high')
                  : ppmTasks.slice(0, 3);
          return (
            <div key={group} className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-bold text-white">{group}</h4>
                <Badge>{`${groupTasks.length} tasks`}</Badge>
              </div>
              <div className="space-y-3">
                {groupTasks.map((task) => (
                  <ScheduleTaskRow key={`${group}-${task.id}`} task={task} onOpen={() => openExecution(task)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderExecution = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={Activity} label="Active Jobs" value="23" detail="7 critical assets" tone="bg-violet-500/15 text-violet-300" />
        <KpiCard icon={CheckCircle} label="Completed Today" value="41" detail="89% first-time complete" tone="bg-emerald-500/15 text-emerald-300" />
        <KpiCard icon={Camera} label="Verification Pending" value="12" detail="5 awaiting evidence" tone="bg-amber-500/15 text-amber-300" />
        <KpiCard icon={AlertTriangle} label="Failed Inspections" value="3" detail="2 repeated findings" tone="bg-red-500/15 text-red-300" />
        <KpiCard icon={Mic} label="Voice Notes" value="9" detail="AI summaries ready" tone="bg-blue-500/15 text-blue-300" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {executions.map((execution) => (
          <ExecutionCard key={execution.id} execution={execution} onOpen={() => setSelectedExecution(execution)} />
        ))}
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={ShieldCheck} label="PPM Compliance" value="92%" detail="Across planned jobs" tone="bg-emerald-500/15 text-emerald-300" />
        <KpiCard icon={Camera} label="Evidence Compliance" value="87%" detail="3 rejected today" tone="bg-amber-500/15 text-amber-300" />
        <KpiCard icon={FileText} label="Regulatory Compliance" value="96%" detail="Fire and lift tracked" tone="bg-cyan-500/15 text-cyan-300" />
        <KpiCard icon={Clock} label="SLA Compliance" value="90%" detail="Lift recovery needed" tone="bg-blue-500/15 text-blue-300" />
        <KpiCard icon={CheckCircle} label="Verification Success" value="89%" detail="First-pass acceptance" tone="bg-emerald-500/15 text-emerald-300" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5">
          <SectionHeader icon={BarChart2} title="Compliance by Asset Category" />
          <div className="space-y-4">
            {assetGroups.map((group) => (
              <div key={group.category}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-bold text-white">{group.category}</span>
                  <span className="text-slate-300">{Math.max(64, group.health + 6)}%</span>
                </div>
                <ProgressBar value={Math.max(64, group.health + 6)} tone={group.health >= 80 ? 'bg-emerald-400' : 'bg-amber-400'} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5">
          <SectionHeader icon={AlertTriangle} title="Compliance Exceptions" />
          <div className="space-y-3">
            {[
              'Lift inspections overdue in Tower 5.',
              '3 HVAC jobs rejected due to missing evidence.',
              'Fire panel certificate pending upload.',
              'AHU cleaning checklist needs photo enforcement.',
            ].map((item) => (
              <div key={item} className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkforce = () => (
    <div className="grid gap-4 xl:grid-cols-3">
      {workforce.map((member) => (
        <div key={member.name} className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-bold text-white">{member.name}</h4>
              <p className="mt-1 text-sm text-slate-400">{member.team}</p>
            </div>
            <Users className="h-5 w-5 text-blue-300" />
          </div>
          <div className="mt-5 space-y-4">
            {[
              ['Workload', member.workload],
              ['Completion', member.completionRate],
              ['Quality', member.qualityScore],
              ['Utilization', member.utilization],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-bold text-white">{value}%</span>
                </div>
                <ProgressBar value={Number(value)} tone={Number(value) > 92 ? 'bg-amber-400' : 'bg-emerald-400'} />
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {member.certifications.map((cert) => (
              <Badge key={cert}>{cert}</Badge>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-violet-500/10 p-3 text-sm leading-6 text-slate-200">
            <Brain className="mr-2 inline h-4 w-4 text-violet-300" />
            {member.aiNote}
          </div>
        </div>
      ))}
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5">
        <SectionHeader icon={Package} title="Inventory & Parts Readiness" eyebrow="Parts risk connected to PPM execution" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#1C3050] text-[11px] uppercase tracking-[0.16em] text-blue-300">
                <th className="py-3">Part</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Supplier</th>
                <th>Lead Time</th>
                <th>Status</th>
                <th>AI Risk</th>
              </tr>
            </thead>
            <tbody>
              {inventoryParts.map((part) => (
                <tr key={part.id} className="border-b border-[#1C3050]/70">
                  <td className="py-4 font-bold text-white">{part.name}</td>
                  <td className="text-slate-200">{part.stock}</td>
                  <td className="text-slate-300">{part.reorderThreshold}</td>
                  <td className="text-slate-300">{part.supplier}</td>
                  <td className="text-slate-300">{part.leadTime}</td>
                  <td>
                    <Badge
                      tone={
                        part.status === 'Available'
                          ? riskTone.low
                          : part.status === 'Low Stock'
                            ? riskTone.high
                            : riskTone.medium
                      }
                    >
                      {part.status}
                    </Badge>
                  </td>
                  <td className="text-slate-300">{part.nextRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-2xl border border-red-400/25 bg-red-500/8 p-5">
        <p className="font-bold text-white">AI reorder recommendation</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Reorder R-410A refrigerant today and escalate lift door roller delivery. Both parts are connected to critical PPM jobs and could increase predicted failure risk if delayed.
        </p>
      </div>
    </div>
  );

  const renderAiInsights = () => (
    <div className="grid gap-4 xl:grid-cols-2">
      {predictions.map((prediction) => (
        <div key={prediction.assetId} className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">{prediction.predictionType}</p>
              <h4 className="mt-2 text-xl font-bold text-white">{prediction.asset}</h4>
            </div>
            <Badge tone={riskTone[prediction.riskLevel]}>{prediction.riskLevel}</Badge>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#07101C] p-3">
              <p className="text-[11px] uppercase text-blue-300">Confidence</p>
              <p className="font-bold text-white">{prediction.confidence}%</p>
            </div>
            <div className="rounded-xl bg-[#07101C] p-3">
              <p className="text-[11px] uppercase text-blue-300">Exposure</p>
              <p className="font-bold text-white">{prediction.costExposure}</p>
            </div>
            <div className="rounded-xl bg-[#07101C] p-3">
              <p className="text-[11px] uppercase text-blue-300">Window</p>
              <p className="font-bold text-white">{prediction.timeToFailure}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-300">{prediction.recommendation}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500">Create maintenance action</button>
            <button className="rounded-xl border border-[#1C3050] px-4 py-2 text-sm font-bold text-slate-200 hover:border-blue-400/40">Escalate vendor</button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-5">
        <SectionHeader icon={FileText} title="AI Executive Summary" eyebrow="Report narrative" />
        <p className="text-sm leading-7 text-slate-200">
          HVAC compliance remains stable at 91%, but Lift Cluster A shows increased overdue maintenance and predicted failure exposure due to technician shortages and delayed spare parts. Evidence rejection is the largest controllable drag on compliance this week.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <div key={report.title} className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-5">
            <FileText className="h-6 w-6 text-blue-300" />
            <h4 className="mt-4 text-lg font-bold text-white">{report.title}</h4>
            <p className="mt-1 text-sm text-slate-400">{report.cadence} · {report.owner}</p>
            <p className="mt-4 text-sm leading-6 text-slate-300">{report.insight}</p>
            <button className="mt-5 rounded-xl border border-[#1C3050] px-4 py-2 text-sm font-bold text-slate-200 hover:border-red-400/40">
              Generate report
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'assets':
        return renderAssets();
      case 'plans':
        return renderPlans();
      case 'schedule':
        return renderSchedule();
      case 'execution':
        return renderExecution();
      case 'compliance':
        return renderCompliance();
      case 'workforce':
        return renderWorkforce();
      case 'inventory':
        return renderInventory();
      case 'ai':
        return renderAiInsights();
      case 'reports':
        return renderReports();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#07101C] text-slate-100">
      <div className="border-b border-[#1C3050] bg-[#09152A] px-6 py-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-red-300">
              <ClipboardCheck className="h-4 w-4" />
              PPM Intelligence
            </div>
            <h1 className="text-3xl font-bold text-white">Preventive Maintenance Control</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-200">
              Preventive maintenance planning, execution, compliance, asset health, and operational readiness.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setActiveTab('plans');
                setGeneratedPlan(true);
              }}
              className="rounded-xl border border-red-400/40 bg-red-500/12 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500/20"
            >
              <Bot className="mr-2 inline h-4 w-4" />
              Generate PPM Plan
            </button>
            <button
              onClick={() => setCopilotOpen(true)}
              className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-[0_14px_40px_rgba(124,58,237,0.28)] transition hover:bg-violet-500"
            >
              <Sparkles className="mr-2 inline h-4 w-4" />
              Open Copilot
            </button>
          </div>
        </div>
        <div className="mt-5">
          <LifecycleStrip />
        </div>
      </div>

      <div className="border-b border-[#1C3050] bg-[#09152A] px-6">
        <div className="flex flex-wrap gap-2 py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                activeTab === tab.id
                  ? 'bg-red-500/18 text-white ring-1 ring-red-400/45'
                  : 'text-blue-200 hover:bg-[#0E1E35] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="custom-scrollbar flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {renderCurrentTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedAsset && (
          <DrawerShell title={selectedAsset.name} subtitle={`${selectedAsset.property} · ${selectedAsset.location}`} onClose={() => setSelectedAsset(null)}>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Category', selectedAsset.category],
                ['Health', `${selectedAsset.healthScore}%`],
                ['Vendor', selectedAsset.linkedVendor],
                ['Team', selectedAsset.linkedTeam],
                ['Manufacturer', selectedAsset.manufacturer],
                ['Warranty', selectedAsset.warranty],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[#1C3050] bg-[#0B1728] p-4">
                  <p className="text-[11px] uppercase text-blue-300">{label}</p>
                  <p className="mt-1 font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4">
              <p className="font-bold text-white">AI health narrative</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{selectedAsset.aiNarrative}</p>
            </div>
            <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
              <p className="font-bold text-white">Maintenance strategies</p>
              <div className="mt-3 space-y-2">
                {selectedAsset.maintenanceStrategy.map((strategy) => (
                  <div key={strategy} className="rounded-xl bg-[#07101C] p-3 text-sm text-slate-200">
                    <ClipboardList className="mr-2 inline h-4 w-4 text-cyan-300" />
                    {strategy}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
              <p className="font-bold text-white">Linked tasks</p>
              <div className="mt-3 space-y-2">
                {ppmTasks
                  .filter((task) => task.assetId === selectedAsset.id)
                  .map((task) => (
                    <button key={task.id} onClick={() => openExecution(task)} className="w-full rounded-xl bg-[#07101C] p-3 text-left text-sm text-slate-200">
                      <span className="font-bold text-white">{task.plan}</span>
                      <span className="ml-2 text-slate-400">· {task.status}</span>
                    </button>
                  ))}
              </div>
            </div>
          </DrawerShell>
        )}

        {selectedExecution && (
          <DrawerShell title={selectedExecution.asset} subtitle={`${selectedExecution.technician} · ${selectedExecution.status}`} onClose={() => setSelectedExecution(null)}>
            <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
              <div className="mb-2 flex justify-between text-sm text-slate-400">
                <span>Execution progress</span>
                <span>{selectedExecution.progress}%</span>
              </div>
              <ProgressBar value={selectedExecution.progress} tone="bg-cyan-400" />
            </div>
            {selectedExecutionTask && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#1C3050] bg-[#0B1728] p-4">
                  <p className="text-[11px] uppercase text-blue-300">Evidence</p>
                  <p className="mt-1 font-bold text-white">{selectedExecutionTask.evidenceUploaded}/{selectedExecutionTask.evidenceRequired}</p>
                </div>
                <div className="rounded-xl border border-[#1C3050] bg-[#0B1728] p-4">
                  <p className="text-[11px] uppercase text-blue-300">Verification</p>
                  <p className="mt-1 font-bold text-white">{selectedExecution.verificationResult}</p>
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
              <p className="font-bold text-white">Readings</p>
              <div className="mt-3 space-y-2">
                {selectedExecution.readings.map((reading) => (
                  <div key={reading.label} className="flex items-center justify-between rounded-xl bg-[#07101C] p-3">
                    <span className="text-sm text-slate-300">{reading.label}</span>
                    <span className="font-bold text-white">{reading.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
              <p className="font-bold text-white">Evidence uploaded</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {selectedExecution.evidence.map((item) => (
                  <div key={item} className="rounded-xl border border-[#1C3050] bg-[#07101C] p-3 text-sm text-slate-300">
                    <Camera className="mb-2 h-4 w-4 text-cyan-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4">
              <p className="font-bold text-white">AI verification finding</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{selectedExecution.aiFindings}</p>
            </div>
            <div className="rounded-2xl border border-[#1C3050] bg-[#0E1E35] p-4">
              <p className="font-bold text-white">Execution context</p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <p><MapPin className="mr-2 inline h-4 w-4 text-blue-300" />{selectedExecution.gps}</p>
                <p><Truck className="mr-2 inline h-4 w-4 text-blue-300" />Parts used: {selectedExecution.partsUsed.length ? selectedExecution.partsUsed.join(', ') : 'None recorded'}</p>
                <p><User className="mr-2 inline h-4 w-4 text-blue-300" />Escalations: {selectedExecution.escalationHistory.join(' | ')}</p>
              </div>
            </div>
          </DrawerShell>
        )}

        {copilotOpen && <ProjectCopilot onClose={() => setCopilotOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
