import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart2,
  Bot,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Flame,
  Mail,
  Map,
  MapPin,
  Minus,
  PlugZap,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  UploadCloud,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ToastFn } from '@/lib/ui';

type WorkforceTab =
  | 'overview'
  | 'workforce'
  | 'teams'
  | 'assignments'
  | 'performance'
  | 'certifications'
  | 'capacity'
  | 'ai'
  | 'reports';

type WorkforceStatus = 'Available' | 'Assigned' | 'On Site' | 'Inspecting' | 'Reviewing' | 'Offline' | 'On Leave';
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
type Trend = 'up' | 'down' | 'flat';
type StaffIntakeMode = 'single' | 'bulk' | 'api';

interface Certification {
  id: string;
  employeeId: string;
  type: string;
  expiryDate: string;
  status: 'Valid' | 'Expiring' | 'Expired' | 'Renewal Scheduled';
  projectSite: string;
  riskLevel: RiskLevel;
}

interface PerformanceMetric {
  employeeId: string;
  role: string;
  productivity: number;
  quality: number;
  responseTime: string;
  sla: number;
  rejectionRate: number;
  trend: Trend;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  teamId: string;
  certifications: string[];
  productivityScore: number;
  qualityScore: number;
  slaScore: number;
  utilization: number;
  currentAssignment: string;
  status: WorkforceStatus;
  assignedProjects: string[];
  assignedProperties: string[];
  risk: RiskLevel;
  lastActivity: string;
  manager: string;
  module: 'ProjectCommand' | 'FieldOps' | 'InspectPro' | 'ServiceDesk' | 'VendorIQ' | 'FacilityCore' | 'ResidentPortal' | 'OSH';
  incidentsLinked: number;
  openTasks: number;
  completedToday: number;
  aiInsight: string;
  incentivePoints: number;
  streakDays: number;
  badges: string[];
}

interface TeamRecord {
  id: string;
  name: string;
  manager: string;
  members: string[];
  projects: string[];
  productivity: number;
  quality: number;
  utilization: number;
  sla: number;
  inspectionAccuracy: number;
  residentSatisfaction: number;
  activeAssignments: number;
  workload: number;
  risk: RiskLevel;
  aiInsights: string[];
}

interface Assignment {
  id: string;
  type: 'inspection' | 'work order' | 'project task' | 'handover issue' | 'OSH incident' | 'resident request' | 'audit' | 'snag';
  assignedTo: string;
  linkedProject: string;
  linkedProperty: string;
  linkedIncident: string;
  status: 'Queued' | 'Assigned' | 'In Progress' | 'Review' | 'Completed' | 'Blocked';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string;
  sla: number;
}

interface ReportDefinition {
  title: string;
  owner: string;
  cadence: string;
  summary: string;
}

const tabs: { id: WorkforceTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'workforce', label: 'Workforce', icon: Users },
  { id: 'teams', label: 'Teams', icon: BriefcaseBusiness },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  { id: 'performance', label: 'Performance', icon: Target },
  { id: 'certifications', label: 'Certifications', icon: ShieldCheck },
  { id: 'capacity', label: 'Availability & Capacity', icon: Activity },
  { id: 'ai', label: 'AI Insights', icon: Bot },
  { id: 'reports', label: 'Reports', icon: FileText },
];

const teams: TeamRecord[] = [
  {
    id: 'team-mep-alpha',
    name: 'MEP Team Alpha',
    manager: 'Ahmed K.',
    members: ['emp-ahmed', 'emp-omar'],
    projects: ['Bayz 102 - Main Construction', 'Marina Residences - Smart Upgrade'],
    productivity: 91,
    quality: 88,
    utilization: 86,
    sla: 96,
    inspectionAccuracy: 91,
    residentSatisfaction: 84,
    activeAssignments: 42,
    workload: 112,
    risk: 'Medium',
    aiInsights: [
      'Highest SLA compliance across active delivery teams.',
      'Electrical inspection demand is 32% above planned load.',
      'Recommend shifting two HVAC work orders to FM Response Team before Friday.',
    ],
  },
  {
    id: 'team-handover',
    name: 'Handover Team',
    manager: 'Lina R.',
    members: ['emp-lina', 'emp-khalid'],
    projects: ['Lawnz Residences - Handover Programme'],
    productivity: 82,
    quality: 79,
    utilization: 74,
    sla: 89,
    inspectionAccuracy: 84,
    residentSatisfaction: 91,
    activeAssignments: 31,
    workload: 78,
    risk: 'Medium',
    aiInsights: [
      'QA rejection rate rose 18% in Tower A handover packages.',
      'Resident response quality is strong, but closure evidence needs review.',
    ],
  },
  {
    id: 'team-safety',
    name: 'Safety Inspection Unit',
    manager: 'Fatima A.',
    members: ['emp-fatima', 'emp-mariam'],
    projects: ['Bayz 102 - Main Construction', 'Lawnz Residences - Handover Programme'],
    productivity: 87,
    quality: 94,
    utilization: 92,
    sla: 93,
    inspectionAccuracy: 96,
    residentSatisfaction: 78,
    activeAssignments: 36,
    workload: 121,
    risk: 'High',
    aiInsights: [
      'Tower B inspection team is overloaded against authority SLA windows.',
      'Three electrical and fire safety certifications expire within 7 days.',
      'Add one certified inspector to evening shift for the next 5 days.',
    ],
  },
  {
    id: 'team-fm',
    name: 'FM Response Team',
    manager: 'Omar H.',
    members: ['emp-omar', 'emp-lina'],
    projects: ['Marina Residences - Smart Upgrade'],
    productivity: 84,
    quality: 86,
    utilization: 69,
    sla: 92,
    inspectionAccuracy: 82,
    residentSatisfaction: 89,
    activeAssignments: 25,
    workload: 71,
    risk: 'Low',
    aiInsights: [
      'Available nearby technicians can absorb HVAC repeat callouts.',
      'First-time fix performance improved 9% after parts-stock adjustment.',
    ],
  },
  {
    id: 'team-qaqc',
    name: 'QA/QC Team',
    manager: 'Khalid M.',
    members: ['emp-khalid'],
    projects: ['Bayz 102 - Main Construction', 'Lawnz Residences - Handover Programme'],
    productivity: 76,
    quality: 81,
    utilization: 95,
    sla: 84,
    inspectionAccuracy: 86,
    residentSatisfaction: 74,
    activeAssignments: 29,
    workload: 118,
    risk: 'High',
    aiInsights: [
      'Repeat QA rejection rate increasing for facade team.',
      'Project Bayz 102 is operating below required QA staffing.',
    ],
  },
  {
    id: 'team-contractor',
    name: 'Contractor Oversight Unit',
    manager: 'Mariam S.',
    members: ['emp-mariam', 'emp-ahmed'],
    projects: ['Bayz 102 - Main Construction'],
    productivity: 79,
    quality: 77,
    utilization: 88,
    sla: 81,
    inspectionAccuracy: 79,
    residentSatisfaction: 70,
    activeAssignments: 21,
    workload: 103,
    risk: 'High',
    aiInsights: [
      'Two vendors are affecting facade rework performance.',
      'Escalate contractor evidence gaps before next payment milestone.',
    ],
  },
];

const employees: Employee[] = [
  {
    id: 'emp-ahmed',
    name: 'Ahmed K.',
    role: 'Project Manager',
    email: 'ahmed.k@4c360.demo',
    teamId: 'team-mep-alpha',
    certifications: ['PMP', 'OSHAD', 'QA/QC'],
    productivityScore: 88,
    qualityScore: 86,
    slaScore: 91,
    utilization: 83,
    currentAssignment: 'Bayz 102 milestone recovery board',
    status: 'Assigned',
    assignedProjects: ['Bayz 102 - Main Construction'],
    assignedProperties: ['Bayz 102 Tower B'],
    risk: 'Medium',
    lastActivity: 'Approved blocker recovery plan 18 min ago',
    manager: 'Executive PMO',
    module: 'ProjectCommand',
    incidentsLinked: 4,
    openTasks: 17,
    completedToday: 6,
    aiInsight: 'Team utilization is healthy, but unresolved facade blockers are delaying downstream inspections.',
    incentivePoints: 1240,
    streakDays: 3,
    badges: ['SLA Hero', 'Recovery Lead'],
  },
  {
    id: 'emp-fatima',
    name: 'Fatima A.',
    role: 'Senior Inspector',
    email: 'fatima.a@4c360.demo',
    teamId: 'team-safety',
    certifications: ['OSHAD', 'Working at Height', 'Fire Safety'],
    productivityScore: 92,
    qualityScore: 96,
    slaScore: 95,
    utilization: 97,
    currentAssignment: 'Tower B critical OSH inspection sweep',
    status: 'Inspecting',
    assignedProjects: ['Bayz 102 - Main Construction'],
    assignedProperties: ['Bayz 102 Tower B', 'Lawnz Residences'],
    risk: 'High',
    lastActivity: 'Escalated critical OSH incident 7 min ago',
    manager: 'Safety Inspection Unit',
    module: 'OSH',
    incidentsLinked: 8,
    openTasks: 22,
    completedToday: 12,
    aiInsight: 'High output and excellent evidence quality, but sustained 97% utilization indicates burnout risk.',
    incentivePoints: 1485,
    streakDays: 5,
    badges: ['Quality Streak', 'Accuracy Pro'],
  },
  {
    id: 'emp-omar',
    name: 'Omar H.',
    role: 'HVAC Technician',
    email: 'omar.h@4c360.demo',
    teamId: 'team-fm',
    certifications: ['Electrical Safety', 'Confined Space'],
    productivityScore: 84,
    qualityScore: 87,
    slaScore: 94,
    utilization: 72,
    currentAssignment: 'Marina chiller valve corrective work order',
    status: 'On Site',
    assignedProjects: ['Marina Residences - Smart Upgrade'],
    assignedProperties: ['Marina Residences'],
    risk: 'Low',
    lastActivity: 'Resolved high-priority request 11 min ago',
    manager: 'FM Response Team',
    module: 'FacilityCore',
    incidentsLinked: 2,
    openTasks: 9,
    completedToday: 4,
    aiInsight: 'Best candidate for nearby HVAC spillover because SLA and first-time fix are both above target.',
    incentivePoints: 1015,
    streakDays: 4,
    badges: ['SLA Hero', 'Rapid Response'],
  },
  {
    id: 'emp-lina',
    name: 'Lina R.',
    role: 'Resident Support Lead',
    email: 'lina.r@4c360.demo',
    teamId: 'team-handover',
    certifications: ['Resident Care', 'Escalation Handling'],
    productivityScore: 81,
    qualityScore: 88,
    slaScore: 90,
    utilization: 69,
    currentAssignment: 'Lawnz handover complaint triage',
    status: 'Reviewing',
    assignedProjects: ['Lawnz Residences - Handover Programme'],
    assignedProperties: ['Lawnz Residences'],
    risk: 'Low',
    lastActivity: 'Closed resident escalation 25 min ago',
    manager: 'Customer Experience',
    module: 'ResidentPortal',
    incidentsLinked: 3,
    openTasks: 11,
    completedToday: 7,
    aiInsight: 'Resident satisfaction is strong; delayed FM staffing is the main cause of repeated escalations.',
    incentivePoints: 1125,
    streakDays: 3,
    badges: ['CX Champion', 'Handover Closer'],
  },
  {
    id: 'emp-khalid',
    name: 'Khalid M.',
    role: 'QA/QC Engineer',
    email: 'khalid.m@4c360.demo',
    teamId: 'team-qaqc',
    certifications: ['QA/QC', 'Concrete Testing', 'Facade QA'],
    productivityScore: 73,
    qualityScore: 78,
    slaScore: 82,
    utilization: 96,
    currentAssignment: 'Facade rejection evidence review',
    status: 'Reviewing',
    assignedProjects: ['Bayz 102 - Main Construction', 'Lawnz Residences - Handover Programme'],
    assignedProperties: ['Bayz 102 Tower A', 'Lawnz Residences'],
    risk: 'High',
    lastActivity: 'Rejected incomplete evidence 34 min ago',
    manager: 'QA/QC Team',
    module: 'InspectPro',
    incidentsLinked: 6,
    openTasks: 24,
    completedToday: 5,
    aiInsight: 'QA workload is above safe capacity and rejection turnaround is now influencing milestone adherence.',
    incentivePoints: 760,
    streakDays: 1,
    badges: ['Evidence Coach'],
  },
  {
    id: 'emp-mariam',
    name: 'Mariam S.',
    role: 'Fire Safety Inspector',
    email: 'mariam.s@4c360.demo',
    teamId: 'team-safety',
    certifications: ['Fire Safety', 'Crane Operator', 'Working at Height'],
    productivityScore: 89,
    qualityScore: 91,
    slaScore: 88,
    utilization: 84,
    currentAssignment: 'Lawnz fire-door final inspection',
    status: 'Inspecting',
    assignedProjects: ['Lawnz Residences - Handover Programme'],
    assignedProperties: ['Lawnz Residences'],
    risk: 'Medium',
    lastActivity: 'Uploaded authority evidence 42 min ago',
    manager: 'Safety Inspection Unit',
    module: 'OSH',
    incidentsLinked: 5,
    openTasks: 13,
    completedToday: 9,
    aiInsight: 'Strong inspection accuracy; certification renewal must be completed before next crane-access cycle.',
    incentivePoints: 1295,
    streakDays: 4,
    badges: ['Accuracy Pro', 'Safety Mentor'],
  },
  {
    id: 'emp-sara',
    name: 'Sara N.',
    role: 'Vendor Coordinator',
    email: 'sara.n@4c360.demo',
    teamId: 'team-contractor',
    certifications: ['Vendor Compliance', 'Contract Controls'],
    productivityScore: 78,
    qualityScore: 74,
    slaScore: 79,
    utilization: 81,
    currentAssignment: 'Facade contractor evidence recovery',
    status: 'Assigned',
    assignedProjects: ['Bayz 102 - Main Construction'],
    assignedProperties: ['Bayz 102 Tower A'],
    risk: 'High',
    lastActivity: 'Issued vendor escalation 1 hr ago',
    manager: 'Contractor Oversight Unit',
    module: 'VendorIQ',
    incidentsLinked: 7,
    openTasks: 18,
    completedToday: 3,
    aiInsight: 'Vendor response lag is now a project performance factor, not an admin follow-up.',
    incentivePoints: 690,
    streakDays: 1,
    badges: ['Vendor Recovery'],
  },
];

const assignments: Assignment[] = [
  { id: 'ASG-4102', type: 'inspection', assignedTo: 'Fatima A.', linkedProject: 'Bayz 102 - Main Construction', linkedProperty: 'Bayz 102 Tower B', linkedIncident: 'OSH-889', status: 'In Progress', priority: 'Critical', dueDate: 'Today 16:00', sla: 71 },
  { id: 'ASG-4103', type: 'work order', assignedTo: 'Omar H.', linkedProject: 'Marina Residences - Smart Upgrade', linkedProperty: 'Marina Residences', linkedIncident: 'WO-2217', status: 'In Progress', priority: 'High', dueDate: 'Today 18:30', sla: 92 },
  { id: 'ASG-4104', type: 'handover issue', assignedTo: 'Lina R.', linkedProject: 'Lawnz Residences - Handover Programme', linkedProperty: 'Lawnz Residences', linkedIncident: 'RP-1432', status: 'Review', priority: 'Medium', dueDate: 'Tomorrow 10:00', sla: 88 },
  { id: 'ASG-4105', type: 'project task', assignedTo: 'Ahmed K.', linkedProject: 'Bayz 102 - Main Construction', linkedProperty: 'Bayz 102 Tower B', linkedIncident: 'PC-312', status: 'Assigned', priority: 'High', dueDate: 'May 09', sla: 83 },
  { id: 'ASG-4106', type: 'snag', assignedTo: 'Khalid M.', linkedProject: 'Bayz 102 - Main Construction', linkedProperty: 'Bayz 102 Tower A', linkedIncident: 'QA-775', status: 'Blocked', priority: 'High', dueDate: 'Today 14:00', sla: 54 },
  { id: 'ASG-4107', type: 'audit', assignedTo: 'Mariam S.', linkedProject: 'Lawnz Residences - Handover Programme', linkedProperty: 'Lawnz Residences', linkedIncident: 'AUD-084', status: 'Queued', priority: 'Medium', dueDate: 'May 10', sla: 97 },
  { id: 'ASG-4108', type: 'resident request', assignedTo: 'Lina R.', linkedProject: 'Marina Residences - Smart Upgrade', linkedProperty: 'Marina Residences', linkedIncident: 'RP-1440', status: 'Completed', priority: 'Low', dueDate: 'Today 12:00', sla: 100 },
];

const certifications: Certification[] = [
  { id: 'CERT-01', employeeId: 'emp-fatima', type: 'OSHAD', expiryDate: 'May 13, 2026', status: 'Expiring', projectSite: 'Bayz 102 Tower B', riskLevel: 'High' },
  { id: 'CERT-02', employeeId: 'emp-mariam', type: 'Fire Safety', expiryDate: 'May 14, 2026', status: 'Expiring', projectSite: 'Lawnz Residences', riskLevel: 'High' },
  { id: 'CERT-03', employeeId: 'emp-omar', type: 'Electrical Safety', expiryDate: 'May 15, 2026', status: 'Expiring', projectSite: 'Marina Residences', riskLevel: 'Medium' },
  { id: 'CERT-04', employeeId: 'emp-khalid', type: 'QA/QC', expiryDate: 'Jun 02, 2026', status: 'Renewal Scheduled', projectSite: 'Bayz 102 Tower A', riskLevel: 'Medium' },
  { id: 'CERT-05', employeeId: 'emp-ahmed', type: 'PMP', expiryDate: 'Oct 30, 2026', status: 'Valid', projectSite: 'Bayz 102', riskLevel: 'Low' },
  { id: 'CERT-06', employeeId: 'emp-mariam', type: 'Crane Operator', expiryDate: 'May 11, 2026', status: 'Expiring', projectSite: 'Lawnz Residences', riskLevel: 'Critical' },
];

const performanceMetrics: PerformanceMetric[] = employees.map(employee => ({
  employeeId: employee.id,
  role: employee.role,
  productivity: employee.productivityScore,
  quality: employee.qualityScore,
  responseTime: employee.role.includes('Technician') ? '18m' : employee.role.includes('Support') ? '12m' : '42m',
  sla: employee.slaScore,
  rejectionRate: employee.id === 'emp-khalid' ? 18 : employee.id === 'emp-fatima' ? 2 : employee.id === 'emp-sara' ? 16 : 7,
  trend: employee.productivityScore >= 88 ? 'up' : employee.risk === 'High' ? 'down' : 'flat',
}));

const healthTrend = [
  { week: 'W1', productivity: 78, utilization: 71, completion: 86, risk: 16 },
  { week: 'W2', productivity: 81, utilization: 73, completion: 88, risk: 18 },
  { week: 'W3', productivity: 86, utilization: 79, completion: 91, risk: 21 },
  { week: 'W4', productivity: 84, utilization: 78, completion: 89, risk: 24 },
  { week: 'W5', productivity: 88, utilization: 82, completion: 92, risk: 22 },
  { week: 'W6', productivity: 84, utilization: 78, completion: 90, risk: 27 },
];

const capacityBySite = [
  { site: 'Bayz 102', required: 118, staffed: 92, utilization: 88, risk: 'High' },
  { site: 'Lawnz', required: 74, staffed: 68, utilization: 81, risk: 'Medium' },
  { site: 'Marina', required: 51, staffed: 58, utilization: 69, risk: 'Low' },
  { site: 'Tower B', required: 46, staffed: 32, utilization: 94, risk: 'Critical' },
  { site: 'Tower A', required: 39, staffed: 35, utilization: 86, risk: 'High' },
];

const productivityHeatmap = [
  { team: 'MEP Alpha', inspection: 88, workOrders: 94, handover: 74, osh: 82 },
  { team: 'Safety Unit', inspection: 96, workOrders: 78, handover: 81, osh: 93 },
  { team: 'Handover', inspection: 79, workOrders: 83, handover: 88, osh: 71 },
  { team: 'FM Response', inspection: 74, workOrders: 91, handover: 80, osh: 76 },
  { team: 'QA/QC', inspection: 82, workOrders: 69, handover: 77, osh: 73 },
];

const aiInsights = [
  {
    title: 'Bayz 102 productivity dropped 14% this week',
    detail: 'Facade rework evidence is blocking QA/QC reviews and forcing senior inspectors into repeat checks.',
    action: 'Rebalance inspections and escalate contractor evidence quality.',
    severity: 'Critical' as RiskLevel,
    module: 'ProjectCommand + VendorIQ',
  },
  {
    title: 'Tower A handover team has highest QA rejection rate',
    detail: 'Incomplete photo evidence is repeated across three inspectors and two subcontractor packages.',
    action: 'Schedule evidence-quality coaching and add supervisor review for next 20 snags.',
    severity: 'High' as RiskLevel,
    module: 'InspectPro + FieldOps',
  },
  {
    title: 'Resident complaints correlate with delayed FM staffing',
    detail: 'Requests logged after 15:00 wait longer because evening HVAC coverage is below target.',
    action: 'Move Omar H. to late shift twice this week and route low-risk tasks to available technicians.',
    severity: 'Medium' as RiskLevel,
    module: 'ResidentPortal + FacilityCore',
  },
  {
    title: 'Safety inspection backlog may impact authority SLA',
    detail: 'Tower B has 32% more critical inspection demand than certified staff capacity.',
    action: 'Bring one OSH-certified contractor online for 5 days and renew expiring credentials.',
    severity: 'High' as RiskLevel,
    module: 'OSH',
  },
];

type WorkforceCopilotPrompt = {
  question: string;
  answer: string;
  confidence: number;
  risk: RiskLevel;
  owner: string;
  target: string;
  signals: string[];
  actions: string[];
};

const workforceCopilotPrompts: WorkforceCopilotPrompt[] = [
  {
    question: 'Which teams are overloaded?',
    answer: 'Safety Inspection Unit, QA/QC Team, and Contractor Oversight Unit are above safe operating load. Safety is carrying 121 workload points at 92% utilization, QA/QC is at 118 with 95% utilization, and contractor oversight has vendor evidence gaps affecting downstream closures.',
    confidence: 94,
    risk: 'High',
    owner: 'COO / PMO',
    target: '3 teams',
    signals: [
      'Safety Inspection Unit has 36 active assignments and Tower B authority windows at risk.',
      'QA/QC Team is at 95% utilization with repeat facade rejection work.',
      'Contractor Oversight Unit is linked to vendor evidence delays and payment milestone exposure.',
    ],
    actions: ['Rebalance two inspections', 'Add certified backup', 'Escalate vendor evidence'],
  },
  {
    question: 'Why is SLA dropping in Tower B?',
    answer: 'Tower B SLA is dropping because certified inspection capacity is 30% below demand while QA rejection rework has increased. The highest pressure comes from OSH coverage, facade evidence reviews, and expiring safety credentials tied to active inspection windows.',
    confidence: 92,
    risk: 'Critical',
    owner: 'Safety Inspection Unit',
    target: 'Tower B',
    signals: [
      'Tower B requires 46 staffing units but only 32 are staffed.',
      'Critical OSH inspections are concentrated on Fatima A. at 97% utilization.',
      'Facade QA rework is forcing repeat inspections before authority submission.',
    ],
    actions: ['Assign OSH backup today', 'Move QA review to supervisor', 'Renew expiring credentials'],
  },
  {
    question: 'Who should take this inspection?',
    answer: 'For a critical OSH or authority inspection, Fatima A. is the strongest match on certification and quality, but the system recommends Mariam S. as backup to avoid pushing Fatima above safe load. For HVAC or low-risk FM work, route to Omar H. or FM Response Team capacity.',
    confidence: 89,
    risk: 'Medium',
    owner: 'Dispatch Lead',
    target: 'Best-fit assignee',
    signals: [
      'Fatima A. has 96 quality and 95 SLA but is already at 97% utilization.',
      'Mariam S. has Fire Safety and Working at Height coverage with 91 quality.',
      'Omar H. has low risk, 94 SLA, and nearby FM spillover capacity.',
    ],
    actions: ['Assign Mariam as backup', 'Protect Fatima workload', 'Route HVAC to Omar'],
  },
  {
    question: 'Which inspectors have highest rejection rate?',
    answer: 'Khalid M. and Sara N. are the two highest-risk rejection contributors. Khalid is linked to 18% rejection on facade evidence review, while Sara is linked to 16% vendor evidence gaps. Both are impacting Bayz 102 quality throughput.',
    confidence: 91,
    risk: 'High',
    owner: 'QA Director',
    target: '2 inspectors',
    signals: [
      'Khalid M. has 24 open tasks, 78 quality, and 18% rejection rate.',
      'Sara N. has contractor evidence recovery ownership and 16% rejection exposure.',
      'Tower A handover packages show repeated incomplete photo evidence.',
    ],
    actions: ['Start evidence coaching', 'Add supervisor review', 'Audit next 20 snags'],
  },
  {
    question: 'What is impacting productivity?',
    answer: 'Productivity is being pulled down by facade rework, overloaded certified inspectors, evening coverage gaps, and contractor evidence quality. Bayz 102 is the main drag because QA/QC reviews, OSH checks, and vendor remediation are blocking each other.',
    confidence: 90,
    risk: 'High',
    owner: 'Operations Control',
    target: 'Bayz 102',
    signals: [
      'Bayz 102 productivity dropped 14% this week.',
      'Tower B has 32% more critical inspection demand than certified staff capacity.',
      'Resident and FM queues are slower after 15:00 due to evening HVAC coverage gaps.',
    ],
    actions: ['Open recovery board', 'Shift evening coverage', 'Split QA backlog'],
  },
  {
    question: 'Which contractor is affecting performance?',
    answer: 'The facade contractor package under Contractor Oversight is the highest-impact performance drag. Vendor evidence gaps are delaying QA closure, pushing repeat inspections, and increasing risk before the next payment milestone.',
    confidence: 88,
    risk: 'High',
    owner: 'Contractor Oversight Unit',
    target: 'Facade package',
    signals: [
      'Two vendors are flagged for facade rework performance.',
      'Evidence gaps are linked to Bayz 102 milestone and payment exposure.',
      'Sara N. is carrying vendor recovery follow-up with elevated risk.',
    ],
    actions: ['Issue evidence notice', 'Hold payment gate', 'Schedule vendor huddle'],
  },
];

const reports: ReportDefinition[] = [
  { title: 'Workforce Productivity Report', owner: 'COO', cadence: 'Weekly', summary: 'Productivity, completion, utilization, and team-level ranking across the portfolio.' },
  { title: 'Project Staffing Report', owner: 'PMO', cadence: 'Daily', summary: 'Staffing gaps by project, property, assignment type, and milestone exposure.' },
  { title: 'Inspector Quality Report', owner: 'QA Director', cadence: 'Weekly', summary: 'Evidence quality, rejection rate, critical finding accuracy, and duration trends.' },
  { title: 'SLA Performance Report', owner: 'Operations', cadence: 'Daily', summary: 'SLA compliance by team, role, site, work order type, and resident impact.' },
  { title: 'Certification Compliance Report', owner: 'HSE', cadence: 'Weekly', summary: 'Expiring credentials, site exposure, renewal status, and coverage risk.' },
  { title: 'Workforce Utilization Report', owner: 'Resource Planning', cadence: 'Weekly', summary: 'Overload, underuse, shift balance, and available nearby capacity.' },
  { title: 'Team Performance Benchmark', owner: 'Executive', cadence: 'Monthly', summary: 'Team quality, SLA, productivity, project outcomes, and accountability signals.' },
];

const operationalFeed = [
  'Ahmed K. completed milestone blocker review for Bayz 102.',
  'Fatima A. completed 12 inspections today and escalated one critical OSH incident.',
  'MEP Team Alpha resolved 4 high-priority requests before SLA breach.',
  '2 inspectors rejected for incomplete evidence in Tower A handover.',
  'Omar H. accepted nearby HVAC spillover work order at Marina Residences.',
];

const statusClass: Record<WorkforceStatus, string> = {
  Available: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/30',
  Assigned: 'bg-blue-500/12 text-blue-300 border-blue-500/30',
  'On Site': 'bg-cyan-500/12 text-cyan-300 border-cyan-500/30',
  Inspecting: 'bg-violet-500/12 text-violet-300 border-violet-500/30',
  Reviewing: 'bg-amber-500/12 text-amber-300 border-amber-500/30',
  Offline: 'bg-slate-500/12 text-slate-300 border-slate-500/30',
  'On Leave': 'bg-rose-500/12 text-rose-300 border-rose-500/30',
};

const riskClass: Record<RiskLevel, string> = {
  Low: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/30',
  Medium: 'bg-amber-500/12 text-amber-300 border-amber-500/30',
  High: 'bg-orange-500/12 text-orange-300 border-orange-500/30',
  Critical: 'bg-red-500/12 text-red-300 border-red-500/35',
};

const priorityClass: Record<Assignment['priority'], string> = {
  Low: 'text-emerald-300',
  Medium: 'text-amber-300',
  High: 'text-orange-300',
  Critical: 'text-red-300',
};

function scoreColor(score: number): string {
  if (score >= 90) return '#38D98A';
  if (score >= 82) return '#00C6FF';
  if (score >= 75) return '#FF9B38';
  return '#FF4B4B';
}

function riskColor(risk: RiskLevel): string {
  return risk === 'Low' ? '#38D98A' : risk === 'Medium' ? '#FFCD57' : risk === 'High' ? '#FF9B38' : '#FF4B4B';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getTeam(teamId: string): TeamRecord {
  return teams.find(team => team.id === teamId) ?? teams[0];
}

function getEmployee(employeeId: string): Employee | undefined {
  return employees.find(employee => employee.id === employeeId);
}

function getTeamMembers(team: TeamRecord): Employee[] {
  return team.members
    .map(memberId => getEmployee(memberId))
    .filter((employee): employee is Employee => Boolean(employee));
}

function getSuggestedAwardPoints(team: TeamRecord): number {
  return Math.round((team.sla + team.quality + team.inspectionAccuracy + team.residentSatisfaction) / 2);
}

function getTeamBadges(team: TeamRecord, members: Employee[]): string[] {
  const badges = new Set<string>();
  if (team.sla >= 90) badges.add('SLA Hero');
  if (team.quality >= 88) badges.add('Quality Streak');
  if (team.residentSatisfaction >= 88) badges.add('CX Champion');
  if (team.inspectionAccuracy >= 90) badges.add('Accuracy Pro');
  members.forEach(member => member.badges.forEach(badge => badges.add(badge)));
  return Array.from(badges).slice(0, 5);
}

function getTeamRecognitionMessage(team: TeamRecord, employee: Employee, points: number): string {
  const firstName = employee.name.split(' ')[0];
  return `Hi ${firstName}, great work with ${team.name} on ${team.projects[0]}. ${points} recognition points are queued for the team based on SLA ${team.sla}%, quality ${team.quality}%, and CX ${team.residentSatisfaction}%. Keep the streak moving.`;
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === 'up') return <TrendingUp size={13} className="text-emerald-300" />;
  if (trend === 'down') return <TrendingDown size={13} className="text-red-300" />;
  return <Minus size={13} className="text-[#7A94B4]" />;
}

function SectionTitle({ icon, title, action }: { icon: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#00C6FF]">
          {icon}
        </div>
        <h3 className="text-[13px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
      </div>
      {action}
    </div>
  );
}

function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${className}`}>{children}</span>;
}

function MetricCard({ title, value, note, icon, tone = '#2E7FFF' }: { title: string; value: string; note: string; icon: ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-3 min-h-[108px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase text-[#7A94B4]">{title}</p>
          <p className="mt-2 text-[24px] font-extrabold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${tone}1f`, color: tone }}>
          {icon}
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-[#7A94B4]">{note}</p>
    </div>
  );
}

function ProgressBar({ value, color = '#00C6FF' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }} />
    </div>
  );
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-white/[0.08] bg-[#0D1E3A]/80 ${className}`}>{children}</section>;
}

function WorkforceProfileDrawer({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const team = getTeam(employee.teamId);
  const metric = performanceMetrics.find(item => item.employeeId === employee.id);
  const employeeCerts = certifications.filter(item => item.employeeId === employee.id);
  const employeeAssignments = assignments.filter(item => item.assignedTo === employee.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <motion.aside
        initial={{ x: 420, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 420, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[430px] flex-col overflow-hidden rounded-2xl border border-[#2E7FFF]/25 bg-[#0A1628] shadow-2xl"
      >
        <div className="z-10 flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0A1628]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#2E7FFF]/20 border border-[#2E7FFF]/35 flex items-center justify-center text-[#EEF3FA] font-bold">
              {getInitials(employee.name)}
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#EEF3FA] truncate" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{employee.name}</h3>
              <p className="text-[11px] text-[#7A94B4] truncate">{employee.role} - {employee.module}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-[#7A94B4] hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5 pb-6 custom-scrollbar">
          <Panel className="p-4">
            <SectionTitle icon={<User size={15} />} title="Profile" />
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div><p className="text-[#7A94B4]">Status</p><Pill className={statusClass[employee.status]}>{employee.status}</Pill></div>
              <div><p className="text-[#7A94B4]">Risk</p><Pill className={riskClass[employee.risk]}>{employee.risk}</Pill></div>
              <div><p className="text-[#7A94B4]">Team</p><p className="font-semibold text-[#EEF3FA]">{team.name}</p></div>
              <div><p className="text-[#7A94B4]">Reports to</p><p className="font-semibold text-[#EEF3FA]">{employee.manager}</p></div>
            </div>
          </Panel>

          <Panel className="p-4">
            <SectionTitle icon={<ClipboardList size={15} />} title="Current Assignments" />
            <div className="space-y-2">
              {employeeAssignments.map(item => (
                <div key={item.id} className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#EEF3FA]">{item.id}</span>
                    <span className={`text-[10px] font-bold ${priorityClass[item.priority]}`}>{item.priority}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#7A94B4]">{item.type} - {item.linkedProperty}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <ProgressBar value={item.sla} color={scoreColor(item.sla)} />
                    <span className="text-[10px] text-[#EEF3FA] w-8">{item.sla}%</span>
                  </div>
                </div>
              ))}
              {employeeAssignments.length === 0 && <p className="text-[11px] text-[#7A94B4]">No active assignment records in this view.</p>}
            </div>
          </Panel>

          <Panel className="p-4">
            <SectionTitle icon={<Target size={15} />} title="KPIs" />
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Productivity', employee.productivityScore],
                ['Quality', employee.qualityScore],
                ['SLA', employee.slaScore],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-3">
                  <p className="text-[10px] text-[#7A94B4]">{label}</p>
                  <p className="mt-1 text-[19px] font-extrabold" style={{ color: scoreColor(value as number), fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
                </div>
              ))}
            </div>
            {metric && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-[#7A94B4]">
                <span>Response: <b className="text-[#EEF3FA]">{metric.responseTime}</b></span>
                <span>Reject: <b className="text-[#EEF3FA]">{metric.rejectionRate}%</b></span>
                <span className="flex items-center gap-1">Trend: <TrendIcon trend={metric.trend} /></span>
              </div>
            )}
          </Panel>

          <Panel className="p-4">
            <SectionTitle icon={<Building2 size={15} />} title="Project Involvement" />
            <div className="space-y-2">
              {employee.assignedProjects.map(project => (
                <div key={project} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-[#EEF3FA]">{project}</span>
                  <span className="text-[#7A94B4]">{employee.assignedProperties.join(', ')}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <SectionTitle icon={<ClipboardCheck size={15} />} title="Inspections / Work Orders" />
            <div className="grid grid-cols-3 gap-2">
              <div><p className="text-[10px] text-[#7A94B4]">Open</p><p className="text-[18px] font-bold text-[#EEF3FA]">{employee.openTasks}</p></div>
              <div><p className="text-[10px] text-[#7A94B4]">Today</p><p className="text-[18px] font-bold text-emerald-300">{employee.completedToday}</p></div>
              <div><p className="text-[10px] text-[#7A94B4]">Incidents</p><p className="text-[18px] font-bold text-amber-300">{employee.incidentsLinked}</p></div>
            </div>
          </Panel>

          <Panel className="p-4">
            <SectionTitle icon={<ShieldCheck size={15} />} title="Certifications" />
            <div className="space-y-2">
              {employeeCerts.map(cert => (
                <div key={cert.id} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="font-semibold text-[#EEF3FA]">{cert.type}</span>
                  <Pill className={riskClass[cert.riskLevel]}>{cert.status}</Pill>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <SectionTitle icon={<Bot size={15} />} title="AI Insights" />
            <p className="text-[12px] leading-relaxed text-[#C8D6E8]">{employee.aiInsight}</p>
          </Panel>
        </div>
      </motion.aside>
    </div>
  );
}

function OverviewTab({ onEmployeeSelect, onToast }: { onEmployeeSelect: (employee: Employee) => void; onToast: ToastFn }) {
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [sentMailByTeam, setSentMailByTeam] = useState<Record<string, string[]>>({});
  const [teamAwardPoints, setTeamAwardPoints] = useState<Record<string, number>>({});
  const topTeams = teams.slice(0, 4);
  const riskAlerts = [
    'Tower B inspection team overloaded by 32% against planned capacity.',
    '3 electrical and fire safety certifications expire within 7 days.',
    'Project Bayz 102 operating below required QA staffing.',
    'Repeat QA rejection rate increasing for facade team.',
  ];

  const handleMailToggle = (team: TeamRecord, memberCount: number) => {
    const opening = activeTeamId !== team.id;
    setActiveTeamId(opening ? team.id : null);
    if (opening) onToast(`${team.name} mail queue opened for ${memberCount} staff`, 'info');
  };

  const handleSendMail = (team: TeamRecord, employee: Employee) => {
    const current = sentMailByTeam[team.id] ?? [];
    if (current.includes(employee.id)) return;
    setSentMailByTeam(prev => ({
      ...prev,
      [team.id]: [...(prev[team.id] ?? []), employee.id],
    }));
    onToast(`Recognition mail queued for ${employee.name}`, 'success');
  };

  const handleAwardPoints = (team: TeamRecord) => {
    const points = getSuggestedAwardPoints(team);
    setTeamAwardPoints(prev => ({ ...prev, [team.id]: (prev[team.id] ?? 0) + points }));
    onToast(`${points} incentive points awarded to ${team.name}`, 'success');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-9 gap-3">
        <MetricCard title="Active Workforce" value="1,284" note="Portfolio personnel across projects, sites, vendors, and service teams." icon={<Users size={17} />} tone="#2E7FFF" />
        <MetricCard title="On-Site Today" value="812" note="Checked into active properties and project work fronts." icon={<MapPin size={17} />} tone="#00C6FF" />
        <MetricCard title="Assigned to Projects" value="936" note="Linked to ProjectCommand, FieldOps, InspectPro, OSH, or FacilityCore." icon={<BriefcaseBusiness size={17} />} tone="#9C7CFF" />
        <MetricCard title="Open Assignments" value="427" note="Inspections, work orders, snags, audits, incidents, and resident requests." icon={<ClipboardList size={17} />} tone="#FF9B38" />
        <MetricCard title="Avg Productivity" value="84" note="Weighted by role output, quality, SLA, and completion context." icon={<Activity size={17} />} tone="#38D98A" />
        <MetricCard title="High-Risk Workforce" value="64" note="People or teams with overload, poor quality, or expiry exposure." icon={<AlertTriangle size={17} />} tone="#FF4B4B" />
        <MetricCard title="Certs Expiring" value="23" note="Credentials at risk across OSH, electrical, fire, and height work." icon={<ShieldCheck size={17} />} tone="#FFCD57" />
        <MetricCard title="SLA Compliance" value="92%" note="Operational SLA health across field execution and service teams." icon={<Clock size={17} />} tone="#00C6FF" />
        <MetricCard title="Utilization" value="78%" note="Live capacity balance across sites, projects, and shifts." icon={<GaugeIcon />} tone="#38D98A" />
      </div>

      <div className="grid grid-cols-[1.3fr_1fr] gap-4">
        <Panel className="p-4">
          <SectionTitle icon={<Activity size={15} />} title="Workforce Health Summary" />
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={healthTrend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="productivityFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#00C6FF" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00C6FF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="week" stroke="#4A6080" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis stroke="#4A6080" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(46,127,255,0.25)', borderRadius: 8, color: '#EEF3FA' }} />
                <Area type="monotone" dataKey="productivity" stroke="#00C6FF" fill="url(#productivityFill)" strokeWidth={2} />
                <Line type="monotone" dataKey="utilization" stroke="#38D98A" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="completion" stroke="#FFCD57" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="risk" stroke="#FF4B4B" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              ['Productivity trend', '+6 pts', '#00C6FF'],
              ['Utilization', '78%', '#38D98A'],
              ['Attendance/completion', '90%', '#FFCD57'],
              ['Risk indicators', '27', '#FF4B4B'],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-lg bg-white/[0.03] border border-white/[0.07] p-2">
                <p className="text-[10px] text-[#7A94B4]">{label}</p>
                <p className="text-[15px] font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionTitle icon={<Award size={15} />} title="Top Performing Teams" />
          <div className="space-y-3">
            {topTeams.map(team => {
              const teamMembers = getTeamMembers(team);
              const sentIds = sentMailByTeam[team.id] ?? [];
              const suggestedAward = getSuggestedAwardPoints(team);
              const earnedPoints = teamMembers.reduce((total, member) => total + member.incentivePoints, 0) + (teamAwardPoints[team.id] ?? 0);
              const streakDays = Math.max(3, ...teamMembers.map(member => member.streakDays));
              const badges = getTeamBadges(team, teamMembers);
              const active = activeTeamId === team.id;

              return (
                <div
                  key={team.id}
                  className={`w-full rounded-lg border bg-white/[0.03] p-3 text-left transition-colors ${
                    active ? 'border-[#2E7FFF]/50 shadow-[0_0_0_1px_rgba(46,127,255,0.12)]' : 'border-white/[0.07] hover:border-[#2E7FFF]/45'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-bold text-[#EEF3FA]">{team.name}</p>
                      <p className="truncate text-[10px] text-[#7A94B4]">{team.projects[0]}</p>
                    </div>
                    <Pill className={riskClass[team.risk]}>{team.risk}</Pill>
                  </div>

                  <div className="mt-3 grid grid-cols-5 gap-2 text-center">
                    {[
                      ['Prod', team.productivity],
                      ['SLA', team.sla],
                      ['Quality', team.quality],
                      ['Accuracy', team.inspectionAccuracy],
                      ['CX', team.residentSatisfaction],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-[12px] font-bold" style={{ color: scoreColor(value as number) }}>{value}</p>
                        <p className="text-[8px] text-[#7A94B4]">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-lg border border-[#38D98A]/15 bg-[#38D98A]/[0.045] p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                        <span className="inline-flex items-center gap-1 text-emerald-200"><Trophy size={11} /> {earnedPoints.toLocaleString()} pts</span>
                        <span className="inline-flex items-center gap-1 text-amber-200"><Flame size={11} /> {streakDays}-day streak</span>
                      </div>
                      <Pill className="border-emerald-500/25 bg-emerald-500/10 text-emerald-200">+{suggestedAward} this week</Pill>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {badges.slice(0, 3).map(badge => (
                        <Pill key={badge} className="border-[#00C6FF]/20 bg-[#00C6FF]/10 text-cyan-100"><Star size={9} /> {badge}</Pill>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleMailToggle(team, teamMembers.length)}
                      aria-expanded={active}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-bold transition-colors ${
                        active
                          ? 'border-[#2E7FFF]/50 bg-[#2E7FFF]/18 text-white'
                          : 'border-[#2E7FFF]/25 bg-[#2E7FFF]/10 text-blue-100 hover:border-[#2E7FFF]/55 hover:bg-[#2E7FFF]/18'
                      }`}
                    >
                      <Mail size={12} />
                      Mail staff
                      <span className="text-[#8AA6C8]">{sentIds.length}/{teamMembers.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAwardPoints(team)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-2 text-[10px] font-bold text-emerald-100 transition-colors hover:border-emerald-400/50 hover:bg-emerald-500/16"
                    >
                      <Award size={12} />
                      Award points
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -4 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -4 }}
                        transition={{ duration: 0.16 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 rounded-lg border border-[#2E7FFF]/20 bg-[#071224] p-2">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-[10px] font-bold uppercase text-[#7A94B4]">Demo mail queue</p>
                            <Pill className="border-white/[0.08] bg-white/[0.035] text-[#8AA6C8]">Queued only</Pill>
                          </div>
                          <div className="space-y-2">
                            {teamMembers.map(member => {
                              const sent = sentIds.includes(member.id);
                              return (
                                <div key={member.id} className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-white/[0.06] text-[10px] font-bold text-[#EEF3FA]">{getInitials(member.name)}</span>
                                        <div className="min-w-0">
                                          <p className="truncate text-[11px] font-bold text-[#EEF3FA]">{member.name}</p>
                                          <p className="truncate text-[9px] text-[#7A94B4]">{member.role} - {member.email}</p>
                                        </div>
                                      </div>
                                      <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-[#C8D6E8]">{getTeamRecognitionMessage(team, member, suggestedAward)}</p>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={sent}
                                      onClick={() => handleSendMail(team, member)}
                                      className={`shrink-0 rounded-lg border px-2 py-1.5 text-[9px] font-bold transition-colors ${
                                        sent
                                          ? 'border-emerald-500/25 bg-emerald-500/12 text-emerald-200'
                                          : 'border-[#2E7FFF]/25 bg-[#2E7FFF]/10 text-blue-100 hover:border-[#2E7FFF]/55 hover:bg-[#2E7FFF]/18'
                                      }`}
                                    >
                                      <span className="inline-flex items-center gap-1">
                                        {sent ? <CheckCircle size={10} /> : <Send size={10} />}
                                        {sent ? 'Queued' : 'Send queued mail'}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-[1fr_1fr_0.9fr] gap-4">
        <Panel className="p-4">
          <SectionTitle icon={<AlertTriangle size={15} />} title="Workforce Risk Alerts" />
          <div className="space-y-2">
            {riskAlerts.map((alert, index) => (
              <div key={alert} className="flex items-start gap-3 rounded-lg border border-red-500/15 bg-red-500/[0.055] p-3">
                <span className="mt-0.5 text-[10px] font-bold text-red-300">0{index + 1}</span>
                <p className="text-[12px] leading-relaxed text-[#EEF3FA]">{alert}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionTitle icon={<Zap size={15} />} title="Live Operational Feed" />
          <div className="space-y-2">
            {operationalFeed.map(item => (
              <div key={item} className="flex items-start gap-3 rounded-lg bg-white/[0.03] border border-white/[0.07] p-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#00C6FF]" />
                <p className="text-[12px] leading-relaxed text-[#C8D6E8]">{item}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionTitle icon={<UserCheck size={15} />} title="People To Watch" />
          <div className="space-y-2">
            {employees.filter(employee => employee.risk !== 'Low').slice(0, 4).map(employee => (
              <button key={employee.id} onClick={() => onEmployeeSelect(employee)} className="w-full rounded-lg border border-white/[0.07] bg-white/[0.03] p-3 text-left hover:border-[#2E7FFF]/45">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[11px] text-[#EEF3FA] font-bold">{getInitials(employee.name)}</span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-[#EEF3FA] truncate">{employee.name}</p>
                      <p className="text-[10px] text-[#7A94B4] truncate">{employee.currentAssignment}</p>
                    </div>
                  </div>
                  <span className="text-[18px] font-extrabold" style={{ color: scoreColor(employee.productivityScore) }}>{employee.productivityScore}</span>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function GaugeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 14a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m12 14 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WorkforceTabView({ onEmployeeSelect }: { onEmployeeSelect: (employee: Employee) => void }) {
  const [query, setQuery] = useState('');
  const filtered = employees.filter(employee => `${employee.name} ${employee.role} ${employee.currentAssignment} ${employee.assignedProjects.join(' ')}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Connected Operational Workforce</h3>
          <p className="text-[11px] text-[#7A94B4]">Every person is connected to projects, properties, assignments, KPIs, certifications, and operational events.</p>
        </div>
        <div className="relative w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search people, roles, projects..." className="w-full rounded-lg border border-white/[0.09] bg-white/[0.04] py-2 pl-9 pr-3 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF]/60" />
        </div>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-[1280px] w-full text-left">
            <thead className="bg-white/[0.035] text-[10px] uppercase text-[#7A94B4]">
              <tr>
                {['Employee', 'Role', 'Team', 'Property / Project', 'Current Assignment', 'Status', 'Productivity', 'Quality', 'SLA', 'Certifications', 'Utilization', 'Risk', 'Last Activity'].map(header => (
                  <th key={header} className="px-3 py-3 font-bold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filtered.map(employee => {
                const team = getTeam(employee.teamId);
                return (
                  <tr key={employee.id} className="hover:bg-white/[0.025]">
                    <td className="px-3 py-3">
                      <button onClick={() => onEmployeeSelect(employee)} className="flex items-center gap-2 text-left">
                        <span className="w-8 h-8 rounded-full bg-[#2E7FFF]/18 border border-[#2E7FFF]/25 flex items-center justify-center text-[10px] font-bold text-[#EEF3FA]">{getInitials(employee.name)}</span>
                        <span>
                          <span className="block text-[12px] font-bold text-[#EEF3FA]">{employee.name}</span>
                          <span className="block text-[10px] text-[#7A94B4]">{employee.module}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-[11px] text-[#C8D6E8]">{employee.role}</td>
                    <td className="px-3 py-3 text-[11px] text-[#C8D6E8]">{team.name}</td>
                    <td className="px-3 py-3 text-[11px] text-[#C8D6E8]">
                      <span className="block">{employee.assignedProperties[0]}</span>
                      <span className="text-[#7A94B4]">{employee.assignedProjects[0]}</span>
                    </td>
                    <td className="px-3 py-3 text-[11px] text-[#C8D6E8] max-w-[210px]">{employee.currentAssignment}</td>
                    <td className="px-3 py-3"><Pill className={statusClass[employee.status]}>{employee.status}</Pill></td>
                    <td className="px-3 py-3"><ScoreCell score={employee.productivityScore} /></td>
                    <td className="px-3 py-3"><ScoreCell score={employee.qualityScore} /></td>
                    <td className="px-3 py-3"><ScoreCell score={employee.slaScore} /></td>
                    <td className="px-3 py-3 text-[10px] text-[#C8D6E8]">{employee.certifications.slice(0, 2).join(', ')}</td>
                    <td className="px-3 py-3 min-w-[110px]"><ProgressBar value={employee.utilization} color={scoreColor(100 - Math.abs(78 - employee.utilization))} /></td>
                    <td className="px-3 py-3"><Pill className={riskClass[employee.risk]}>{employee.risk}</Pill></td>
                    <td className="px-3 py-3 text-[10px] text-[#7A94B4]">{employee.lastActivity}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ScoreCell({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-[12px] font-bold" style={{ color: scoreColor(score) }}>{score}</span>
      <div className="w-16"><ProgressBar value={score} color={scoreColor(score)} /></div>
    </div>
  );
}

function TeamsTab() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {teams.map(team => (
        <Panel key={team.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{team.name}</h3>
              <p className="mt-1 text-[11px] text-[#7A94B4]">Manager: {team.manager}</p>
            </div>
            <Pill className={riskClass[team.risk]}>{team.risk}</Pill>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ['Members', team.members.length],
              ['Active', team.activeAssignments],
              ['Load', `${team.workload}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-white/[0.03] border border-white/[0.07] p-2">
                <p className="text-[9px] text-[#7A94B4]">{label}</p>
                <p className="text-[16px] font-bold text-[#EEF3FA]">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {[
              ['Productivity', team.productivity],
              ['Quality', team.quality],
              ['SLA', team.sla],
              ['Utilization', team.utilization],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="text-[#7A94B4]">{label}</span>
                  <span className="font-bold text-[#EEF3FA]">{value}%</span>
                </div>
                <ProgressBar value={value as number} color={scoreColor(value as number)} />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase text-[#7A94B4]">Projects Assigned</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {team.projects.map(project => <Pill key={project} className="border-[#2E7FFF]/20 bg-[#2E7FFF]/10 text-blue-200">{project}</Pill>)}
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-[#00C6FF]/18 bg-[#00C6FF]/[0.055] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-cyan-200"><Bot size={12} /> AI Team Readout</div>
            <ul className="space-y-1.5">
              {team.aiInsights.map(insight => <li key={insight} className="text-[11px] leading-relaxed text-[#C8D6E8]">{insight}</li>)}
            </ul>
          </div>
        </Panel>
      ))}
    </div>
  );
}

function AssignmentsTab() {
  const statuses: Assignment['status'][] = ['Queued', 'Assigned', 'In Progress', 'Review', 'Blocked'];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1.15fr_0.85fr] gap-4">
        <Panel className="p-4">
          <SectionTitle icon={<ClipboardList size={15} />} title="Kanban View" action={<Pill className="border-[#2E7FFF]/25 bg-[#2E7FFF]/10 text-blue-200">Kanban - Table - Calendar - Site Map</Pill>} />
          <div className="grid grid-cols-5 gap-3">
            {statuses.map(status => (
              <div key={status} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-2 min-h-[260px]">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-bold text-[#EEF3FA]">{status}</p>
                  <span className="text-[10px] text-[#7A94B4]">{assignments.filter(item => item.status === status).length}</span>
                </div>
                <div className="space-y-2">
                  {assignments.filter(item => item.status === status).map(item => (
                    <div key={item.id} className="rounded-lg border border-white/[0.07] bg-[#0A1628]/70 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-[#EEF3FA]">{item.id}</span>
                        <span className={`text-[9px] font-bold ${priorityClass[item.priority]}`}>{item.priority}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-[#C8D6E8]">{item.type}</p>
                      <p className="mt-0.5 text-[9px] text-[#7A94B4]">{item.assignedTo} - {item.linkedProperty}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionTitle icon={<Map size={15} />} title="Site Map Staffing Risk" />
          <div className="relative h-[300px] rounded-lg overflow-hidden border border-white/[0.08] bg-[#071224]">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(46,127,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(46,127,255,0.18) 1px, transparent 1px)', backgroundSize: '34px 34px' }} />
            {capacityBySite.map((site, index) => (
              <div key={site.site} className="absolute rounded-lg border px-3 py-2 shadow-lg" style={{ left: `${12 + (index % 3) * 28}%`, top: `${18 + Math.floor(index / 3) * 38}%`, borderColor: `${riskColor(site.risk as RiskLevel)}66`, background: `${riskColor(site.risk as RiskLevel)}18` }}>
                <p className="text-[11px] font-bold text-[#EEF3FA]">{site.site}</p>
                <p className="text-[9px] text-[#C8D6E8]">{site.staffed}/{site.required} staffed</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/[0.035] text-[10px] uppercase text-[#7A94B4]">
            <tr>
              {['Assignment ID', 'Assigned To', 'Type', 'Project / Property', 'Priority', 'Due Date', 'Status', 'SLA', 'Linked Incident'].map(header => <th key={header} className="px-3 py-3">{header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {assignments.map(item => (
              <tr key={item.id}>
                <td className="px-3 py-3 text-[11px] font-bold text-[#EEF3FA]">{item.id}</td>
                <td className="px-3 py-3 text-[11px] text-[#C8D6E8]">{item.assignedTo}</td>
                <td className="px-3 py-3 text-[11px] text-[#C8D6E8]">{item.type}</td>
                <td className="px-3 py-3 text-[11px] text-[#C8D6E8]">{item.linkedProject}<span className="block text-[#7A94B4]">{item.linkedProperty}</span></td>
                <td className={`px-3 py-3 text-[11px] font-bold ${priorityClass[item.priority]}`}>{item.priority}</td>
                <td className="px-3 py-3 text-[11px] text-[#C8D6E8]">{item.dueDate}</td>
                <td className="px-3 py-3 text-[11px] text-[#C8D6E8]">{item.status}</td>
                <td className="px-3 py-3"><ScoreCell score={item.sla} /></td>
                <td className="px-3 py-3 text-[11px] text-[#7A94B4]">{item.linkedIncident}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function PerformanceTab() {
  const rankedTeams = [...teams].sort((a, b) => b.productivity + b.quality + b.sla - (a.productivity + a.quality + a.sla));
  const underperformers = employees.filter(employee => employee.productivityScore < 80 || employee.risk === 'High');
  const highPerformers = employees.filter(employee => employee.productivityScore >= 88 || employee.qualityScore >= 91);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[0.8fr_1.2fr] gap-4">
        <Panel className="p-4">
          <SectionTitle icon={<Award size={15} />} title="Team Ranking" />
          <div className="space-y-2">
            {rankedTeams.map((team, index) => (
              <div key={team.id} className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[18px] font-extrabold text-[#2E7FFF]">{index + 1}</span>
                    <div>
                      <p className="text-[12px] font-bold text-[#EEF3FA]">{team.name}</p>
                      <p className="text-[10px] text-[#7A94B4]">SLA {team.sla}% - Quality {team.quality}%</p>
                    </div>
                  </div>
                  <span className="text-[18px] font-extrabold" style={{ color: scoreColor(team.productivity) }}>{team.productivity}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionTitle icon={<Activity size={15} />} title="Productivity Heatmap" />
          <div className="space-y-2">
            {productivityHeatmap.map(row => (
              <div key={row.team} className="grid grid-cols-[120px_repeat(4,1fr)] gap-2 items-center">
                <p className="text-[11px] font-semibold text-[#C8D6E8]">{row.team}</p>
                {(['inspection', 'workOrders', 'handover', 'osh'] as const).map(key => (
                  <div key={key} className="h-9 rounded-md border flex items-center justify-center text-[11px] font-bold" style={{ background: `${scoreColor(row[key])}20`, borderColor: `${scoreColor(row[key])}45`, color: scoreColor(row[key]) }}>
                    {row[key]}
                  </div>
                ))}
              </div>
            ))}
            <div className="grid grid-cols-[120px_repeat(4,1fr)] gap-2 text-[9px] uppercase text-[#7A94B4]">
              <span />
              <span>Inspections</span>
              <span>Work Orders</span>
              <span>Handover</span>
              <span>OSH</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Panel className="p-4">
          <SectionTitle icon={<TrendingUp size={15} />} title="Quality Trends" />
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthTrend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="week" stroke="#4A6080" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis stroke="#4A6080" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(46,127,255,0.25)', borderRadius: 8, color: '#EEF3FA' }} />
                <Line type="monotone" dataKey="completion" stroke="#38D98A" strokeWidth={2} />
                <Line type="monotone" dataKey="productivity" stroke="#00C6FF" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel className="p-4">
          <SectionTitle icon={<Clock size={15} />} title="SLA Performance" />
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teams} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#4A6080" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} interval={0} />
                <YAxis stroke="#4A6080" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(46,127,255,0.25)', borderRadius: 8, color: '#EEF3FA' }} />
                <Bar dataKey="sla" radius={[6, 6, 0, 0]}>
                  {teams.map(team => <Cell key={team.id} fill={scoreColor(team.sla)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <PerformanceList title="Underperformers" icon={<AlertTriangle size={15} />} people={underperformers} />
        <PerformanceList title="High Performers" icon={<Star size={15} />} people={highPerformers} />
        <Panel className="p-4">
          <SectionTitle icon={<Bot size={15} />} title="AI Recommendations" />
          <div className="space-y-2">
            {[
              'MEP Team Alpha has highest SLA compliance. Use as benchmark for reactive work order flow.',
              'Tower B QA rejection rate increased 18%. Add supervisor review before evidence submission.',
              'Electrical inspection team overloaded by 32%. Reassign two InspectPro tasks to certified backup.',
              'Project Bayz 102 understaffed for current inspection demand.',
            ].map(item => <p key={item} className="rounded-lg border border-[#00C6FF]/15 bg-[#00C6FF]/[0.05] p-3 text-[11px] leading-relaxed text-[#C8D6E8]">{item}</p>)}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function PerformanceList({ title, icon, people }: { title: string; icon: ReactNode; people: Employee[] }) {
  return (
    <Panel className="p-4">
      <SectionTitle icon={icon} title={title} />
      <div className="space-y-2">
        {people.map(employee => (
          <div key={employee.id} className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-bold text-[#EEF3FA]">{employee.name}</p>
                <p className="text-[10px] text-[#7A94B4]">{employee.role} - {getTeam(employee.teamId).name}</p>
              </div>
              <span className="text-[18px] font-extrabold" style={{ color: scoreColor(employee.productivityScore) }}>{employee.productivityScore}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CertificationsTab() {
  return (
    <div className="grid grid-cols-[1fr_0.7fr] gap-4">
      <Panel className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/[0.035] text-[10px] uppercase text-[#7A94B4]">
            <tr>
              {['Certification', 'Expiry Date', 'Linked Employee', 'Project / Site', 'Risk Level', 'Renewal Status'].map(header => <th key={header} className="px-3 py-3">{header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {certifications.map(cert => {
              const employee = getEmployee(cert.employeeId);
              return (
                <tr key={cert.id}>
                  <td className="px-3 py-3 text-[12px] font-bold text-[#EEF3FA]">{cert.type}</td>
                  <td className="px-3 py-3 text-[11px] text-[#C8D6E8]">{cert.expiryDate}</td>
                  <td className="px-3 py-3 text-[11px] text-[#C8D6E8]">{employee?.name}</td>
                  <td className="px-3 py-3 text-[11px] text-[#C8D6E8]">{cert.projectSite}</td>
                  <td className="px-3 py-3"><Pill className={riskClass[cert.riskLevel]}>{cert.riskLevel}</Pill></td>
                  <td className="px-3 py-3 text-[11px] text-[#C8D6E8]">{cert.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <Panel className="p-4">
        <SectionTitle icon={<Bot size={15} />} title="Compliance AI" />
        <div className="space-y-3">
          {[
            ['Predict compliance gaps', 'Tower B will lose certified crane coverage if Mariam S. renewal slips past May 11.'],
            ['Recommend training', 'Schedule OSHAD refresher for Safety Inspection Unit and one contractor backup.'],
            ['Flag critical expiry risk', 'Fire Safety and Crane Operator certificates are linked to active handover milestones.'],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-lg border border-[#FFCD57]/20 bg-[#FFCD57]/[0.055] p-3">
              <p className="text-[11px] font-bold text-amber-200">{title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#C8D6E8]">{detail}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function CapacityTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_1fr] gap-4">
        <Panel className="p-4">
          <SectionTitle icon={<Activity size={15} />} title="Capacity Heatmap" />
          <div className="space-y-2">
            {capacityBySite.map(site => (
              <div key={site.site} className="grid grid-cols-[110px_1fr_80px] gap-3 items-center">
                <p className="text-[11px] font-semibold text-[#C8D6E8]">{site.site}</p>
                <ProgressBar value={site.utilization} color={riskColor(site.risk as RiskLevel)} />
                <Pill className={riskClass[site.risk as RiskLevel]}>{site.utilization}%</Pill>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-4">
          <SectionTitle icon={<MapPin size={15} />} title="Staffing By Site" />
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityBySite} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="site" stroke="#4A6080" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis stroke="#4A6080" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0A1628', border: '1px solid rgba(46,127,255,0.25)', borderRadius: 8, color: '#EEF3FA' }} />
                <Bar dataKey="required" fill="#4A6080" radius={[4, 4, 0, 0]} />
                <Bar dataKey="staffed" fill="#00C6FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          ['Which teams are overloaded?', 'Safety Inspection Unit, QA/QC Team, Contractor Oversight Unit.'],
          ['Which projects are understaffed?', 'Bayz 102 is short 26 planned staffing units. Tower B is critical.'],
          ['Who is available nearby?', 'Omar H. and FM Response Team can absorb HVAC and low-risk work orders.'],
          ['Which site lacks inspection coverage?', 'Tower B lacks certified evening OSH coverage.'],
        ].map(([question, answer]) => (
          <Panel key={question} className="p-4">
            <p className="text-[11px] font-bold text-[#EEF3FA]">{question}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-[#7A94B4]">{answer}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function AIInsightsTab({ onToast }: { onToast: ToastFn }) {
  const [activePrompt, setActivePrompt] = useState<WorkforceCopilotPrompt>(workforceCopilotPrompts[1]);
  const [queuedAction, setQueuedAction] = useState<string | null>(null);

  const handlePromptSelect = (prompt: WorkforceCopilotPrompt) => {
    setActivePrompt(prompt);
    setQueuedAction(null);
  };

  const handleActionQueue = (action: string) => {
    setQueuedAction(action);
    onToast(`Copilot action queued: ${action}`, 'success');
  };

  return (
    <div className="grid grid-cols-[1fr_0.75fr] gap-4">
      <div className="space-y-3">
        {aiInsights.map(insight => (
          <Panel key={insight.title} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Pill className={riskClass[insight.severity]}>{insight.severity}</Pill>
                  <span className="text-[10px] font-semibold text-[#7A94B4]">{insight.module}</span>
                </div>
                <h3 className="mt-3 text-[15px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{insight.title}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-[#C8D6E8]">{insight.detail}</p>
              </div>
              <Bot size={18} className="text-[#00C6FF] flex-shrink-0" />
            </div>
            <div className="mt-3 rounded-lg border border-emerald-500/18 bg-emerald-500/[0.055] p-3">
              <p className="text-[10px] font-bold uppercase text-emerald-200">Recommended action</p>
              <p className="mt-1 text-[11px] text-[#C8D6E8]">{insight.action}</p>
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="p-4 h-fit">
        <SectionTitle icon={<Bot size={15} />} title="Workforce Intelligence Copilot" />
        <div className="rounded-lg border border-[#2E7FFF]/20 bg-[#2E7FFF]/[0.055] p-3">
          <p className="text-[12px] leading-relaxed text-[#C8D6E8]">Ask operational questions about workload, staffing, quality, SLA risk, project delay causes, certifications, and team accountability.</p>
        </div>
        <div className="mt-4 space-y-2">
          {workforceCopilotPrompts.map(prompt => {
            const active = prompt.question === activePrompt.question;
            return (
              <button
                key={prompt.question}
                type="button"
                aria-pressed={active}
                onClick={() => handlePromptSelect(prompt)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-[11px] transition-colors ${
                  active
                    ? 'border-[#2E7FFF]/55 bg-[#2E7FFF]/[0.13] text-white shadow-[0_0_0_1px_rgba(46,127,255,0.16)]'
                    : 'border-white/[0.08] bg-white/[0.03] text-[#C8D6E8] hover:border-[#2E7FFF]/45 hover:text-white'
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span>{prompt.question}</span>
                  {active && <CheckCircle size={12} className="flex-shrink-0 text-emerald-300" />}
                </span>
              </button>
            );
          })}
        </div>
        <motion.div
          key={activePrompt.question}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
          className="mt-4 rounded-lg border border-white/[0.08] bg-[#071224] p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-[#7A94B4]">Live copilot answer</p>
              <h4 className="mt-1 text-[12px] font-bold text-[#EEF3FA]">{activePrompt.question}</h4>
            </div>
            <Pill className={riskClass[activePrompt.risk]}>{activePrompt.risk}</Pill>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[#EEF3FA]">{activePrompt.answer}</p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ['Owner', activePrompt.owner],
              ['Scope', activePrompt.target],
              ['Confidence', `${activePrompt.confidence}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-white/[0.07] bg-white/[0.03] p-2">
                <p className="text-[9px] font-bold uppercase text-[#7A94B4]">{label}</p>
                <p className="mt-1 truncate text-[11px] font-bold text-[#EEF3FA]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <p className="text-[10px] font-bold uppercase text-[#7A94B4]">Evidence signals</p>
            {activePrompt.signals.map(signal => (
              <div key={signal} className="flex items-start gap-2 rounded-md border border-[#00C6FF]/15 bg-[#00C6FF]/[0.04] p-2">
                <Zap size={11} className="mt-0.5 flex-shrink-0 text-[#00C6FF]" />
                <p className="text-[10px] leading-relaxed text-[#C8D6E8]">{signal}</p>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase text-[#7A94B4]">Resolution chips</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activePrompt.actions.map(action => {
                const selected = queuedAction === action;
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => handleActionQueue(action)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                      selected
                        ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
                        : 'border-[#2E7FFF]/25 bg-[#2E7FFF]/10 text-blue-100 hover:border-[#2E7FFF]/55 hover:bg-[#2E7FFF]/18'
                    }`}
                  >
                    {selected ? <CheckCircle size={11} /> : <Target size={11} />}
                    {action}
                  </button>
                );
              })}
            </div>
          </div>

          {queuedAction && (
            <div className="mt-3 rounded-md border border-emerald-500/20 bg-emerald-500/[0.07] p-2 text-[10px] leading-relaxed text-emerald-100">
              {queuedAction} is queued for command review with the current copilot evidence pack.
            </div>
          )}
        </motion.div>
      </Panel>
    </div>
  );
}

function ReportsTab({ onToast }: { onToast: ToastFn }) {
  const handleExport = (format: 'PDF' | 'Excel' | 'CSV') => {
    onToast(`Workforce report export prepared as ${format}`, 'success');
  };

  return (
    <div className="grid grid-cols-[1fr_0.7fr] gap-4">
      <div className="grid grid-cols-2 gap-4">
        {reports.map(report => (
          <Panel key={report.title} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-bold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{report.title}</h3>
                <p className="mt-1 text-[10px] text-[#7A94B4]">{report.owner} - {report.cadence}</p>
              </div>
              <FileText size={16} className="text-[#00C6FF]" />
            </div>
            <p className="mt-3 min-h-[48px] text-[11px] leading-relaxed text-[#C8D6E8]">{report.summary}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => handleExport('PDF')} className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2 py-1.5 text-[10px] font-semibold text-[#C8D6E8] hover:border-[#2E7FFF]/45"><Download size={11} /> PDF</button>
              <button onClick={() => handleExport('Excel')} className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2 py-1.5 text-[10px] font-semibold text-[#C8D6E8] hover:border-[#2E7FFF]/45"><FileSpreadsheet size={11} /> Excel</button>
              <button onClick={() => handleExport('CSV')} className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2 py-1.5 text-[10px] font-semibold text-[#C8D6E8] hover:border-[#2E7FFF]/45"><FileText size={11} /> CSV</button>
            </div>
          </Panel>
        ))}
      </div>
      <Panel className="p-4 h-fit">
        <SectionTitle icon={<Bot size={15} />} title="AI Executive Summary" />
        <div className="rounded-lg border border-[#00C6FF]/18 bg-[#00C6FF]/[0.055] p-4">
          <p className="text-[14px] leading-relaxed text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Bayz 102 workforce utilization reached 88% this week. MEP and QA teams remain overloaded, increasing inspection rejection risk. Tower B requires certified inspection reinforcement before the next authority SLA window.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {['Project Staffing', 'Inspector Quality', 'SLA Performance', 'Certification Risk'].map(item => (
            <div key={item} className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-3">
              <p className="text-[11px] font-semibold text-[#C8D6E8]">{item}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function StaffIntakeModal({ onClose, onToast }: { onClose: () => void; onToast: ToastFn }) {
  const [mode, setMode] = useState<StaffIntakeMode>('single');
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [singleForm, setSingleForm] = useState({
    name: '',
    role: '',
    team: 'MEP Team Alpha',
    property: 'Sobha Pilot Tower',
    project: 'Bayz 102 - Main Construction',
    certification: '',
  });
  const [apiForm, setApiForm] = useState({
    provider: 'HRIS / Payroll API',
    endpoint: '',
    syncScope: 'Active staff, teams, roles, certifications, availability',
    cadence: 'Every 15 minutes',
  });

  const modeCards: { id: StaffIntakeMode; title: string; detail: string; icon: ReactNode }[] = [
    { id: 'single', title: 'One staff member', detail: 'Create or upload one profile with role, team, certifications, and project links.', icon: <UserPlus size={16} /> },
    { id: 'bulk', title: 'Bulk upload', detail: 'Import CSV/XLSX rosters with staff, teams, roles, certificates, and availability.', icon: <UploadCloud size={16} /> },
    { id: 'api', title: 'API connection', detail: 'Prepare a live sync from HRIS, payroll, access control, or contractor systems.', icon: <PlugZap size={16} /> },
  ];

  const handleSingleField = (field: keyof typeof singleForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSingleForm(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleApiField = (field: keyof typeof apiForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setApiForm(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleConfirm = () => {
    if (mode === 'single') {
      onToast(singleForm.name.trim() ? `${singleForm.name} staged for workforce onboarding` : 'Single staff intake staged for review', 'success');
    } else if (mode === 'bulk') {
      onToast(bulkFile ? `${bulkFile.name} staged for workforce bulk import` : 'Bulk staff import template prepared', 'success');
    } else {
      onToast(apiForm.endpoint.trim() ? 'Workforce API connection staged for technical review' : 'API connection template prepared', 'success');
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020814]/78 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#2E7FFF]/28 bg-[#081528] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] bg-gradient-to-r from-[#121D3E] to-[#0A1628] px-6 py-5">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#00C6FF]/25 bg-[#00C6FF]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
              <UserPlus size={12} />
              Workforce intake
            </div>
            <h3 className="text-xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Add Staff</h3>
            <p className="mt-1 max-w-3xl text-[12px] leading-5 text-[#8AA6C8]">
              Add one person, import a whole roster, or prepare an API sync. Staff records feed teams, certifications, availability, assignments, and ProjectCommand capacity.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#8AA6C8] transition-colors hover:bg-white/10 hover:text-white" aria-label="Close Add Staff">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5">
          <div className="grid gap-3 md:grid-cols-3">
            {modeCards.map(card => {
              const active = mode === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setMode(card.id)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? 'border-[#2E7FFF]/55 bg-[#2E7FFF]/14 shadow-[0_0_0_1px_rgba(46,127,255,0.18)]'
                      : 'border-white/[0.08] bg-[#07111F] hover:border-[#2E7FFF]/35 hover:bg-[#102544]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? 'bg-[#2E7FFF] text-white' : 'bg-white/[0.05] text-[#8DBDFF]'}`}>{card.icon}</span>
                    <span className="text-[13px] font-black text-[#EEF3FA]">{card.title}</span>
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-[#8AA6C8]">{card.detail}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-[#07111F] p-5">
            {mode === 'single' && (
              <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                <div>
                  <SectionTitle icon={<UserPlus size={15} />} title="Single Staff Profile" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">Full name</span>
                      <input value={singleForm.name} onChange={handleSingleField('name')} placeholder="e.g. Nour Al Mansoori" className="w-full rounded-xl border border-white/[0.09] bg-[#050C17] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF]/60" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">Role</span>
                      <input value={singleForm.role} onChange={handleSingleField('role')} placeholder="QA Inspector, MEP Technician..." className="w-full rounded-xl border border-white/[0.09] bg-[#050C17] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF]/60" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">Team</span>
                      <select value={singleForm.team} onChange={handleSingleField('team')} className="w-full rounded-xl border border-white/[0.09] bg-[#050C17] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF]/60">
                        {teams.map(team => <option key={team.id}>{team.name}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">Certification</span>
                      <input value={singleForm.certification} onChange={handleSingleField('certification')} placeholder="OSHAD, Fire Safety, Lift Competent..." className="w-full rounded-xl border border-white/[0.09] bg-[#050C17] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF]/60" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">Property</span>
                      <input value={singleForm.property} onChange={handleSingleField('property')} className="w-full rounded-xl border border-white/[0.09] bg-[#050C17] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF]/60" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">Project</span>
                      <input value={singleForm.project} onChange={handleSingleField('project')} className="w-full rounded-xl border border-white/[0.09] bg-[#050C17] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF]/60" />
                    </label>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#00C6FF]/18 bg-[#00C6FF]/[0.055] p-4">
                  <SectionTitle icon={<UploadCloud size={15} />} title="Optional Profile Upload" />
                  <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#2E7FFF]/30 bg-[#050C17] p-5 text-center transition-colors hover:border-[#2E7FFF]/55 hover:bg-[#102544]">
                    <UploadCloud size={24} className="text-[#8DBDFF]" />
                    <span className="mt-3 text-[12px] font-bold text-[#EEF3FA]">{singleFile?.name ?? 'Upload CV, ID, certificate, or onboarding form'}</span>
                    <span className="mt-1 text-[10px] text-[#7A94B4]">PDF, DOC, XLSX, CSV, or image</span>
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg" onChange={event => setSingleFile(event.target.files?.[0] ?? null)} />
                  </label>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Pill className="border-emerald-500/25 bg-emerald-500/10 text-emerald-200">Profile draft</Pill>
                    <Pill className="border-[#2E7FFF]/25 bg-[#2E7FFF]/10 text-blue-200">Cert check</Pill>
                    <Pill className="border-[#FFCD57]/25 bg-[#FFCD57]/10 text-amber-200">Team link</Pill>
                    <Pill className="border-purple-500/25 bg-purple-500/10 text-purple-200">Access review</Pill>
                  </div>
                </div>
              </div>
            )}

            {mode === 'bulk' && (
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <div>
                  <SectionTitle icon={<UploadCloud size={15} />} title="Bulk Staff Upload" />
                  <label className="flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#2E7FFF]/30 bg-[#050C17] p-6 text-center transition-colors hover:border-[#2E7FFF]/55 hover:bg-[#102544]">
                    <FileSpreadsheet size={28} className="text-[#00C6FF]" />
                    <span className="mt-3 text-[13px] font-black text-[#EEF3FA]">{bulkFile?.name ?? 'Upload staff roster CSV/XLSX'}</span>
                    <span className="mt-1 text-[11px] text-[#7A94B4]">Columns: name, role, team, property, project, certificates, availability, manager</span>
                    <input type="file" className="hidden" accept=".csv,.xls,.xlsx" onChange={event => setBulkFile(event.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Roster validation', 'Duplicates, missing roles, invalid teams, expired certifications'],
                    ['Assignment mapping', 'Links staff to ProjectCommand, FieldOps, InspectPro, and ServiceDesk'],
                    ['Certification matching', 'Finds OSH, fire, lift, MEP, QA/QC, and authority credentials'],
                    ['Import review', 'Creates a manager review queue before records are activated'],
                  ].map(([title, detail]) => (
                    <div key={title} className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
                      <CheckCircle size={15} className="text-emerald-300" />
                      <p className="mt-3 text-[12px] font-black text-[#EEF3FA]">{title}</p>
                      <p className="mt-1 text-[11px] leading-5 text-[#8AA6C8]">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mode === 'api' && (
              <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                <div>
                  <SectionTitle icon={<PlugZap size={15} />} title="API Staff Sync" />
                  <div className="grid gap-3">
                    <label className="space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">Source system</span>
                      <select value={apiForm.provider} onChange={handleApiField('provider')} className="w-full rounded-xl border border-white/[0.09] bg-[#050C17] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF]/60">
                        {['HRIS / Payroll API', 'Contractor workforce API', 'Access control system', 'FieldOps workforce endpoint', 'Custom REST API'].map(option => <option key={option}>{option}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">Endpoint</span>
                      <input value={apiForm.endpoint} onChange={handleApiField('endpoint')} placeholder="https://api.company.com/workforce/staff" className="w-full rounded-xl border border-white/[0.09] bg-[#050C17] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF]/60" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">Sync scope</span>
                      <input value={apiForm.syncScope} onChange={handleApiField('syncScope')} className="w-full rounded-xl border border-white/[0.09] bg-[#050C17] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF]/60" />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7A94B4]">Sync cadence</span>
                      <select value={apiForm.cadence} onChange={handleApiField('cadence')} className="w-full rounded-xl border border-white/[0.09] bg-[#050C17] px-3 py-2.5 text-[12px] text-[#EEF3FA] outline-none focus:border-[#2E7FFF]/60">
                        {['Every 15 minutes', 'Hourly', 'Daily', 'On demand'].map(option => <option key={option}>{option}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.07] p-4">
                  <SectionTitle icon={<ShieldCheck size={15} />} title="Connection Checklist" />
                  <div className="space-y-2">
                    {['Map staff ID to 4C360 identity', 'Map team, role, manager, property, and project', 'Sync certification expiry and availability', 'Stage imported changes before activation', 'Keep API credentials outside the demo UI'].map(item => (
                      <div key={item} className="flex gap-2 rounded-lg border border-white/[0.07] bg-[#07111F] p-3 text-[11px] leading-5 text-[#C8D6E8]">
                        <CheckCircle size={12} className="mt-1 shrink-0 text-emerald-300" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] px-6 py-4">
          <p className="text-[11px] text-[#7A94B4]">
            Demo-safe: this stages the intake path and confirms the review workflow without creating external HR, email, or API actions.
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl border border-white/[0.10] bg-[#07111F] px-4 py-2 text-[12px] font-bold text-[#8AA6C8] transition-colors hover:bg-white/[0.06] hover:text-white">Cancel</button>
            <button onClick={handleConfirm} className="inline-flex items-center gap-2 rounded-xl bg-[#2E7FFF] px-5 py-2 text-[12px] font-black text-white shadow-lg shadow-[#2E7FFF]/20 transition-colors hover:bg-[#4B91FF]">
              <CheckCircle size={14} />
              {mode === 'single' ? 'Stage Staff Profile' : mode === 'bulk' ? 'Stage Bulk Import' : 'Stage API Sync'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Team({ onToast }: { onToast: ToastFn }) {
  const [activeTab, setActiveTab] = useState<WorkforceTab>('overview');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showStaffIntake, setShowStaffIntake] = useState(false);

  const activeTabLabel = useMemo(() => tabs.find(tab => tab.id === activeTab)?.label ?? 'Overview', [activeTab]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0A1628]">
      <div className="flex-shrink-0 border-b border-white/[0.08] px-5 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#2E7FFF]/14 border border-[#2E7FFF]/25 flex items-center justify-center text-[#00C6FF]">
                <Users size={18} />
              </div>
              <div>
                <h1 className="text-[21px] font-extrabold text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Workforce Intelligence</h1>
                <p className="text-[12px] text-[#7A94B4]">People, performance, workload, accountability, and operational execution.</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
              {['Organization', 'Portfolio', 'Property', 'Projects', 'Teams', 'Roles', 'Assignments', 'KPIs', 'Performance', 'Incidents / Tasks / Inspections / Work Orders'].map(item => (
                <Pill key={item} className="border-white/[0.08] bg-white/[0.035] text-[#C8D6E8]">{item}</Pill>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[#00C6FF]/20 bg-[#00C6FF]/[0.055] p-3 w-[360px]">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-cyan-200"><Bot size={13} /> Live workforce intelligence</div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#C8D6E8]">Connected to ProjectCommand, FieldOps, InspectPro, ServiceDesk, VendorIQ, FacilityCore, ResidentPortal, and OSH.</p>
            <button
              type="button"
              onClick={() => setShowStaffIntake(true)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7FFF] px-4 py-2 text-[12px] font-black text-white shadow-lg shadow-[#2E7FFF]/20 transition-all hover:bg-[#4B91FF]"
            >
              <Plus size={14} />
              Add Staff
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-1 overflow-x-auto pb-0 no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2 text-[11px] font-bold transition-colors ${
                  active
                    ? 'border-[#00C6FF] bg-[#00C6FF]/[0.06] text-[#EEF3FA]'
                    : 'border-transparent text-[#7A94B4] hover:bg-white/[0.035] hover:text-[#EEF3FA]'
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase text-[#7A94B4]">{activeTabLabel}</p>
            <div className="flex items-center gap-2 text-[10px] text-[#7A94B4]">
              <CheckCircle size={12} className="text-emerald-300" />
              Operational mock model active
            </div>
          </div>
          {activeTab === 'overview' && <OverviewTab onEmployeeSelect={setSelectedEmployee} onToast={onToast} />}
          {activeTab === 'workforce' && <WorkforceTabView onEmployeeSelect={setSelectedEmployee} />}
          {activeTab === 'teams' && <TeamsTab />}
          {activeTab === 'assignments' && <AssignmentsTab />}
          {activeTab === 'performance' && <PerformanceTab />}
          {activeTab === 'certifications' && <CertificationsTab />}
          {activeTab === 'capacity' && <CapacityTab />}
          {activeTab === 'ai' && <AIInsightsTab onToast={onToast} />}
          {activeTab === 'reports' && <ReportsTab onToast={onToast} />}
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedEmployee && (
          <WorkforceProfileDrawer employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
        )}
        {showStaffIntake && (
          <StaffIntakeModal onClose={() => setShowStaffIntake(false)} onToast={onToast} />
        )}
      </AnimatePresence>
    </div>
  );
}
