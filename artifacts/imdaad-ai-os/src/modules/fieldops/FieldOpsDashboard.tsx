import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Archive,
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Eye,
  FileSignature,
  Filter,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  PencilRuler,
  Plus,
  QrCode,
  RadioTower,
  ScanLine,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useClients } from '@/context/ClientsContext';
import type { PortfolioClient } from '@/data/mockData';
import {
  aiGeneratedSurvey,
  assignments,
  questionPalette,
  submissions,
  surveys,
  surveyTypes,
  templateOptions,
  templates,
  type Survey,
  type SurveySubmission,
  type SurveyType,
} from './data';
import { getLocalFieldOpsSubmissions, subscribeToLocalFieldOpsSubmissions } from './liveSubmissions';

type Tab = 'surveys' | 'assignments' | 'tracking' | 'templates' | 'ai';
type Drawer = 'detail' | 'design' | 'assign' | 'share' | 'submission' | null;
type FieldOpsTemplate = {
  name: string;
  type: SurveyType;
  duration: string;
  questions: number;
  evidence: string;
};
type CreateWizardStep = 'start' | 'ai' | 'template' | 'basics';
type CreateStartMode = 'ai' | 'template' | 'manual';

interface Props {
  onToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'surveys', label: 'Surveys' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'templates', label: 'Templates' },
  { id: 'ai', label: 'AI Assist' },
];

const statusClass: Record<string, string> = {
  Draft: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  Active: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  'In Progress': 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  Completed: 'border-[#E11D2E]/30 bg-[#E11D2E]/10 text-red-200',
  Archived: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
  Overdue: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  'Failed / Rejected': 'border-red-400/30 bg-red-400/10 text-red-300',
  Submitted: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  'Pending Review': 'border-violet-400/30 bg-violet-400/10 text-violet-200',
  Approved: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  Rejected: 'border-red-400/30 bg-red-400/10 text-red-300',
};

const fieldInput = 'h-9 rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-[12px] text-[#EEF3FA] outline-none placeholder:text-[#4A6080] focus:border-[#E11D2E]';
const priorityOptions = ['Low', 'Medium', 'High', 'Critical'] as const;
type SurveyPriority = (typeof priorityOptions)[number];
const aiPromptCategories: Array<{ category: string; chips: string[] }> = [
  {
    category: 'Site Operations',
    chips: [
      'HVAC PPM',
      'Lift Safety Inspection',
      'Cleaning Audit',
      'Fire System Check',
      'Pump Room Inspection',
      'Generator PPM',
      'Water Tank Inspection',
      'Facade & Roof Check',
    ],
  },
  {
    category: 'Development & Handover',
    chips: [
      'Handover Inspection',
      'Defect Capture',
      'Snagging Survey',
      'Pre-Handover Inspection',
      'Mock-up Apartment Review',
      'Common Area Handover',
      'Authority Readiness Check',
    ],
  },
  {
    category: 'Safety & Compliance',
    chips: [
      'Site Safety Walkthrough',
      'Fire Life Safety Audit',
      'Permit-to-Work Check',
      'Environmental Inspection',
      'Waste Management Audit',
      'Security Patrol Check',
    ],
  },
  {
    category: 'Resident & Community',
    chips: [
      'Move-In Inspection',
      'Resident Complaint Follow-up',
      'Amenity Condition Check',
      'Pool & Gym Audit',
      'Landscape Inspection',
      'Community Event Readiness',
    ],
  },
  {
    category: 'Assets & Vendors',
    chips: [
      'Asset Condition Survey',
      'Vendor Performance Audit',
      'Contractor Work Completion',
      'Spare Parts Stock Check',
      'Lifecycle Replacement Survey',
    ],
  },
];
const aiPromptChips = aiPromptCategories.flatMap(group => group.chips);
type AiDraftProfile = {
  sections: number;
  questions: number;
  duration: string;
  frequency: string;
  focus: string;
  evidence: string;
  questionSections: Array<{ title: string; questions: string[] }>;
};
type EditableTemplateQuestion = {
  text: string;
  photoRequired: boolean;
  copilotEnabled: boolean;
  copilotGuidance: string;
};
type EditableTemplateSection = {
  title: string;
  checks: EditableTemplateQuestion[];
};
const aiDraftProfiles: Record<string, AiDraftProfile> = {
  'HVAC PPM': {
    sections: 5,
    questions: 24,
    duration: '18-22 minutes',
    frequency: 'Monthly',
    focus: 'safety isolation, chiller condition, operating readings, cleaning, and sign-off',
    evidence: 'photos, pressure readings, temperature differential, GPS proof, and supervisor signature',
    questionSections: [
      { title: 'Safety & Isolation', questions: ['Confirm lockout/tagout is in place', 'Verify safe access and PPE before opening the chiller panel', 'Confirm no active alarms before inspection'] },
      { title: 'Operational Readings', questions: ['Record chilled water pressure', 'Record entering and leaving water temperatures', 'Capture compressor running status'] },
      { title: 'Condition & Evidence', questions: ['Inspect insulation, valves, and visible leaks', 'Upload panel and asset condition photos', 'Supervisor sign-off for abnormal readings'] },
    ],
  },
  'Lift Safety Inspection': {
    sections: 4,
    questions: 18,
    duration: '12-15 minutes',
    frequency: 'Weekly',
    focus: 'landing doors, cabin safety, alarms, machine-room checks, and emergency response',
    evidence: 'photos, safety pass/fail checks, inspector notes, and signature',
    questionSections: [
      { title: 'Cabin & Landing Checks', questions: ['Inspect cabin lighting, buttons, and emergency phone', 'Confirm landing doors close cleanly on sampled floors', 'Check lift levelling at each tested landing'] },
      { title: 'Safety Systems', questions: ['Test alarm and intercom response', 'Confirm overload warning is operational', 'Verify emergency stop and signage condition'] },
      { title: 'Evidence & Sign-off', questions: ['Upload photo of any failed safety item', 'Record inspector notes for defects', 'Collect supervisor signature before submission'] },
    ],
  },
  'Cleaning Audit': {
    sections: 4,
    questions: 16,
    duration: '8-10 minutes',
    frequency: 'Daily',
    focus: 'lobbies, corridors, washrooms, amenities, consumables, and quality scoring',
    evidence: 'optional photos for failed areas, score notes, and supervisor review',
    questionSections: [
      { title: 'Area Quality', questions: ['Score lobby cleanliness', 'Score corridor and lift lobby condition', 'Confirm washrooms meet hygiene standard'] },
      { title: 'Consumables & Odour', questions: ['Confirm consumables are stocked', 'Check bins and waste areas', 'Record any odour or pest concern'] },
      { title: 'Exceptions', questions: ['Upload photo for failed area', 'Add corrective action note', 'Flag repeated vendor failure if applicable'] },
    ],
  },
  'Fire System Check': {
    sections: 6,
    questions: 28,
    duration: '20-25 minutes',
    frequency: 'Weekly',
    focus: 'fire pumps, alarms, extinguishers, fire doors, escape routes, and compliance evidence',
    evidence: 'mandatory photos, GPS capture, fail-to-incident rules, and contractor signature',
    questionSections: [
      { title: 'Fire Assets', questions: ['Check extinguishers and hose reels are present and accessible', 'Confirm fire pump panel status', 'Inspect fire alarm panel for active faults'] },
      { title: 'Escape Routes', questions: ['Verify exits are clear', 'Confirm fire doors close properly', 'Upload evidence for blocked or damaged route'] },
      { title: 'Compliance Sign-off', questions: ['Capture GPS at inspection location', 'Record contractor notes', 'Create critical incident for failed life-safety item'] },
    ],
  },
  'Asset Condition Survey': {
    sections: 5,
    questions: 18,
    duration: '12-15 minutes',
    frequency: 'Monthly',
    focus: 'safety, inspection, readings, condition, and sign-off',
    evidence: 'condition photos, severity rating, lifecycle notes, and GPS proof',
    questionSections: [
      { title: 'Asset Identity', questions: ['Scan asset QR or confirm asset ID', 'Confirm location and access condition', 'Capture GPS proof'] },
      { title: 'Condition Assessment', questions: ['Rate visible asset condition', 'Record wear, corrosion, leaks, or abnormal noise', 'Assign severity rating'] },
      { title: 'Lifecycle Evidence', questions: ['Upload condition photos', 'Recommend repair, monitor, or replacement action', 'Add supervisor review note'] },
    ],
  },
  'Handover Inspection': {
    sections: 6,
    questions: 30,
    duration: '25-35 minutes',
    frequency: 'Per handover batch',
    focus: 'unit readiness, finishes, MEP function, snags, resident-facing evidence, and approval',
    evidence: 'snag photos, QR/unit scan, handover checklist, and QA sign-off',
    questionSections: [
      { title: 'Unit Readiness', questions: ['Scan unit QR and confirm unit number', 'Check walls, flooring, doors, and joinery', 'Confirm cleaning and access readiness'] },
      { title: 'MEP Function', questions: ['Test lighting, sockets, AC, and plumbing fixtures', 'Record failed fixture details', 'Upload photo for every snag'] },
      { title: 'Approval', questions: ['Capture resident-facing handover notes', 'Confirm all critical snags are logged', 'Collect QA sign-off'] },
    ],
  },
  'Defect Capture': {
    sections: 3,
    questions: 12,
    duration: '6-8 minutes',
    frequency: 'As needed',
    focus: 'defect location, category, severity, before/after evidence, and incident creation',
    evidence: 'photos, notes, QR/asset scan, and automatic issue trigger',
    questionSections: [
      { title: 'Defect Context', questions: ['Select defect category', 'Scan asset or location QR', 'Describe the defect in plain language'] },
      { title: 'Evidence', questions: ['Upload before photo', 'Add voice note if needed', 'Rate severity and resident impact'] },
      { title: 'Action Trigger', questions: ['Assign corrective action owner', 'Create incident when severity is high', 'Set follow-up date'] },
    ],
  },
  'Site Safety Walkthrough': {
    sections: 5,
    questions: 22,
    duration: '15-18 minutes',
    frequency: 'Daily',
    focus: 'PPE, access control, permits, work-at-height, housekeeping, and hazard closure',
    evidence: 'mandatory photos for unsafe observations, GPS proof, and HSE reviewer sign-off',
    questionSections: [
      { title: 'Access & PPE', questions: ['Confirm workers are wearing required PPE', 'Check site access routes are controlled', 'Verify permit-to-work is displayed where required'] },
      { title: 'Hazard Checks', questions: ['Inspect work-at-height controls', 'Check housekeeping and trip hazards', 'Confirm emergency access remains clear'] },
      { title: 'Closure', questions: ['Upload photo for unsafe observation', 'Assign corrective action owner', 'Escalate critical safety failure to HSE lead'] },
    ],
  },
};

function getPromptCategory(chip: string) {
  return aiPromptCategories.find(group => group.chips.includes(chip))?.category ?? 'Site Operations';
}

function makeGenericDraftProfile(chip: string): AiDraftProfile {
  const category = getPromptCategory(chip);
  const lower = chip.toLowerCase();
  const isDevelopment = category === 'Development & Handover';
  const isCompliance = category === 'Safety & Compliance';
  const isCommunity = category === 'Resident & Community';
  const isVendor = category === 'Assets & Vendors';
  const isPpm = lower.includes('ppm') || lower.includes('generator') || lower.includes('pump') || lower.includes('tank');

  if (isDevelopment) {
    return {
      sections: 5,
      questions: 20,
      duration: '15-25 minutes',
      frequency: 'Per milestone or handover batch',
      focus: `${chip.toLowerCase()}, readiness checks, defects, approvals, and handover evidence`,
      evidence: 'photos, location proof, snag notes, approval status, and QA sign-off',
      questionSections: [
        { title: 'Scope & Readiness', questions: ['Confirm project, tower, floor, and unit or zone', 'Validate area is ready for inspection', 'Check required drawings and approvals are available'] },
        { title: 'Quality & Defects', questions: ['Capture visible defects or incomplete work', 'Rate severity and handover impact', 'Assign corrective owner and target closure date'] },
        { title: 'Evidence & Approval', questions: ['Upload photos for each failed item', 'Confirm critical issues are escalated', 'Collect reviewer sign-off before submission'] },
      ],
    };
  }

  if (isCompliance) {
    return {
      sections: 5,
      questions: 22,
      duration: '12-20 minutes',
      frequency: lower.includes('permit') ? 'Per work permit' : 'Weekly',
      focus: `${chip.toLowerCase()}, compliance controls, unsafe observations, corrective actions, and escalation`,
      evidence: 'mandatory photos for non-compliance, GPS proof, risk rating, and supervisor review',
      questionSections: [
        { title: 'Control Checks', questions: ['Confirm required permit, signage, or control is in place', 'Check access routes and emergency provisions', 'Verify responsible party is present and briefed'] },
        { title: 'Risk Observations', questions: ['Record unsafe condition or non-compliance', 'Rate severity and likelihood', 'Assign corrective action owner'] },
        { title: 'Escalation', questions: ['Upload photo evidence for failed checks', 'Create incident for critical non-compliance', 'Capture reviewer sign-off'] },
      ],
    };
  }

  if (isCommunity) {
    return {
      sections: 4,
      questions: 16,
      duration: '8-14 minutes',
      frequency: lower.includes('event') ? 'Before each event' : 'Weekly',
      focus: `${chip.toLowerCase()}, resident experience, amenity readiness, service quality, and follow-up actions`,
      evidence: 'condition photos, resident notes, service rating, and follow-up owner',
      questionSections: [
        { title: 'Resident Context', questions: ['Confirm site, area, unit, or amenity', 'Record resident or community concern where applicable', 'Check service readiness and accessibility'] },
        { title: 'Experience & Condition', questions: ['Rate cleanliness, safety, and presentation', 'Capture any defect or service gap', 'Identify immediate action required'] },
        { title: 'Follow-up', questions: ['Upload photos for service gaps', 'Assign owner for corrective action', 'Confirm resident communication is required'] },
      ],
    };
  }

  if (isVendor) {
    return {
      sections: 4,
      questions: 18,
      duration: '10-18 minutes',
      frequency: lower.includes('vendor') || lower.includes('contractor') ? 'Per visit or work package' : 'Monthly',
      focus: `${chip.toLowerCase()}, asset status, vendor output, quality evidence, lifecycle risk, and closure`,
      evidence: 'before/after photos, asset scan, completion notes, quality score, and approver sign-off',
      questionSections: [
        { title: 'Asset or Work Package', questions: ['Scan asset, zone, or work package reference', 'Confirm scope and responsible vendor', 'Check current condition or completion status'] },
        { title: 'Quality & Performance', questions: ['Rate workmanship or service quality', 'Record defects, delays, or missing materials', 'Flag lifecycle or warranty impact'] },
        { title: 'Close-out Evidence', questions: ['Upload before/after photos where applicable', 'Confirm corrective actions are complete', 'Collect approver sign-off'] },
      ],
    };
  }

  return {
    sections: isPpm ? 5 : 4,
    questions: isPpm ? 20 : 16,
    duration: isPpm ? '15-22 minutes' : '10-15 minutes',
    frequency: isPpm ? 'Monthly' : 'Weekly',
    focus: `${chip.toLowerCase()}, operating condition, safety checks, readings, defects, and supervisor sign-off`,
    evidence: 'asset photos, readings where applicable, QR scan, failed-item notes, and GPS proof',
    questionSections: [
      { title: 'Asset Identity', questions: ['Confirm asset, location, and access condition', 'Scan QR or record asset reference', 'Verify safe access before inspection'] },
      { title: 'Condition & Readings', questions: ['Check visible condition and operational status', 'Record readings or performance observations', 'Flag abnormal noise, leaks, vibration, or damage'] },
      { title: 'Evidence & Action', questions: ['Upload photo evidence for failed checks', 'Assign corrective action owner', 'Escalate critical findings for incident creation'] },
    ],
  };
}

const assignableAssignees = ['MEP Team', 'Fire Safety Vendor', 'Soft Services Team', 'QA/QC Team', 'Handover Team', 'Arabian FM Contractor', 'Mariam Saleh', 'Ahmed Farouk'];
const supervisorReviewers = ['Mariam Saleh', 'Sarah Khan', 'Omar Haddad', 'Nadia Karim', 'James Miller'];
const recurrenceOptions = ['one-time', 'daily', 'weekly', 'monthly', 'quarterly', 'custom'];
const siteAssetCatalog: Record<string, string[]> = {
  'Lawnz Residences': ['CH-01 Chiller', 'CH-02 Chiller', 'L08-L12 Handover Floors', 'Tower A Lobby', 'Basement Pump Room', 'Podium Common Areas'],
  'Business Bay Tower Complex': ['FSP-03 Fire Pump', 'Basement Fire Doors', 'Tower B Alarm Panel', 'Emergency Exit Route B1', 'Sprinkler Zone 04'],
  'JLT North Cluster': ['Cluster B Lobby', 'Washroom Core A', 'Lift Lobby Level 4', 'Amenity Deck', 'Waste Room'],
  'Cluster B': ['Cluster B Lobby', 'Corridor Spine', 'Washroom Core A', 'Amenity Deck'],
  'All sites and common areas': ['Common Areas', 'MEP Plant Rooms', 'Fire Safety Assets', 'Lifts and Lobbies', 'External Areas'],
};

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getSiteScopes(site?: PortfolioClient) {
  if (!site) return ['Portfolio-wide field scope'];
  const sites = site.topSites.map(site => site.name);
  const assets = site.resources.equipment.slice(0, 3).map(asset => `${asset.name} assets`);
  return [...sites, ...assets, 'All sites and common areas'];
}

function getAssetsForSite(site: string, survey: Survey) {
  const catalogAssets = siteAssetCatalog[site];
  if (catalogAssets?.length) return catalogAssets;
  if (survey.assetIds.length) return survey.assetIds;
  return ['Common Areas', 'General Equipment', 'Site Infrastructure'];
}

function buildAiDescription(type: SurveyType, site?: PortfolioClient, scope = 'selected scope', priority: SurveyPriority = 'High') {
  const siteName = site?.name ?? 'the selected site';
  const sector = site?.sector ? `${site.sector.toLowerCase()} ` : '';
  const riskNote = site?.riskLevel && site.riskLevel !== 'low'
    ? ` Include extra checks for ${site.riskLevel} risk items.`
    : '';

  return `AI suggested scope: run a ${type.toLowerCase()} for ${siteName}, focused on ${scope}. Capture ${sector}field readings, photo evidence, GPS proof, safety checks, failed-item notes, and supervisor sign-off. Treat ${priority.toLowerCase()} findings as escalation-ready and prepare incident creation for any failed critical item.${riskNote}`;
}

function normalizeTemplate(template: { name: string; type: string; duration: string; questions: number; evidence: string }): FieldOpsTemplate {
  return {
    ...template,
    type: surveyTypes.includes(template.type as SurveyType) ? (template.type as SurveyType) : 'Custom',
  };
}

function inferSurveyTypeFromPrompt(prompt: string): SurveyType {
  const lower = prompt.toLowerCase();
  if (lower.includes('vendor') || lower.includes('contractor') || lower.includes('work completion')) return 'Field Inspection';
  if (lower.includes('permit') || lower.includes('environment') || lower.includes('security') || lower.includes('waste')) return 'Safety';
  if (lower.includes('resident') || lower.includes('amenity') || lower.includes('pool') || lower.includes('gym') || lower.includes('landscape') || lower.includes('community')) return 'Field Inspection';
  if (lower.includes('clean')) return 'Cleaning Audit';
  if (lower.includes('fire')) return 'Fire Safety';
  if (lower.includes('handover') || lower.includes('snag') || lower.includes('mock-up') || lower.includes('authority')) return 'Handover';
  if (lower.includes('defect') || lower.includes('reactive')) return 'Reactive Maintenance';
  if (lower.includes('asset condition') || lower.includes('condition')) return 'Asset Condition';
  if (lower.includes('safety') || lower.includes('lift')) return 'Safety';
  if (lower.includes('ppm') || lower.includes('preventive') || lower.includes('maintenance') || lower.includes('chiller') || lower.includes('generator') || lower.includes('pump') || lower.includes('tank')) return 'Preventive Maintenance';
  return 'Field Inspection';
}

function titleFromPrompt(prompt: string, type: SurveyType) {
  const lower = prompt.toLowerCase();
  if (lower.includes('chiller')) return 'Water-Cooled Chiller Monthly PPM';
  if (lower.includes('lift')) return 'Lift Safety Inspection';
  if (lower.includes('clean')) return 'Cleaning Audit Checklist';
  if (lower.includes('fire')) return 'Fire Safety Inspection';
  if (lower.includes('handover')) return 'Handover Inspection Checklist';
  if (lower.includes('defect')) return 'Defect Capture Survey';
  const matchedChip = aiPromptChips.find(chip => lower.includes(chip.toLowerCase().replace('&', 'and')) || lower.includes(chip.toLowerCase()));
  if (matchedChip) return `${matchedChip} Checklist`;
  return `${type} Survey`;
}

function inferAiChipFromPrompt(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes('chiller') || lower.includes('hvac') || lower.includes('ahu') || lower.includes('fan coil') || lower.includes('air condition')) return 'HVAC PPM';
  if (lower.includes('lift') || lower.includes('elevator')) return 'Lift Safety Inspection';
  if (lower.includes('clean') || lower.includes('housekeeping') || lower.includes('janitor')) return 'Cleaning Audit';
  if (lower.includes('fire') || lower.includes('alarm') || lower.includes('sprinkler') || lower.includes('life safety')) return 'Fire System Check';
  if (lower.includes('pump room') || lower.includes('pump')) return 'Pump Room Inspection';
  if (lower.includes('generator')) return 'Generator PPM';
  if (lower.includes('water tank') || lower.includes('tank cleaning') || lower.includes('potable water')) return 'Water Tank Inspection';
  if (lower.includes('facade') || lower.includes('façade') || lower.includes('roof')) return 'Facade & Roof Check';
  if (lower.includes('pre-handover')) return 'Pre-Handover Inspection';
  if (lower.includes('mock-up') || lower.includes('mockup')) return 'Mock-up Apartment Review';
  if (lower.includes('common area') && lower.includes('handover')) return 'Common Area Handover';
  if (lower.includes('authority') || lower.includes('dcc') || lower.includes('municipality') || lower.includes('dewa') || lower.includes('rera')) return 'Authority Readiness Check';
  if (lower.includes('handover')) return 'Handover Inspection';
  if (lower.includes('snag')) return 'Snagging Survey';
  if (lower.includes('defect') || lower.includes('reactive')) return 'Defect Capture';
  if (lower.includes('permit') || lower.includes('ptw')) return 'Permit-to-Work Check';
  if (lower.includes('environment') || lower.includes('waste') || lower.includes('sustainability')) return lower.includes('waste') ? 'Waste Management Audit' : 'Environmental Inspection';
  if (lower.includes('security') || lower.includes('patrol') || lower.includes('access control')) return 'Security Patrol Check';
  if (lower.includes('site safety') || lower.includes('ppe') || lower.includes('hse')) return 'Site Safety Walkthrough';
  if (lower.includes('move-in') || lower.includes('move in')) return 'Move-In Inspection';
  if (lower.includes('complaint') || lower.includes('resident follow')) return 'Resident Complaint Follow-up';
  if (lower.includes('amenity')) return 'Amenity Condition Check';
  if (lower.includes('pool') || lower.includes('gym')) return 'Pool & Gym Audit';
  if (lower.includes('landscape') || lower.includes('irrigation')) return 'Landscape Inspection';
  if (lower.includes('event')) return 'Community Event Readiness';
  if (lower.includes('vendor')) return 'Vendor Performance Audit';
  if (lower.includes('contractor') || lower.includes('work completion')) return 'Contractor Work Completion';
  if (lower.includes('spare') || lower.includes('stock')) return 'Spare Parts Stock Check';
  if (lower.includes('lifecycle') || lower.includes('replacement')) return 'Lifecycle Replacement Survey';
  if (lower.includes('asset') || lower.includes('condition')) return 'Asset Condition Survey';
  return null;
}

function getAiDraftProfile(prompt: string, selectedChip: string | null) {
  const promptChip = selectedChip ?? inferAiChipFromPrompt(prompt);
  if (promptChip) return aiDraftProfiles[promptChip] ?? makeGenericDraftProfile(promptChip);
  const lower = prompt.toLowerCase();
  const matchedChip = aiPromptChips.find(chip => {
    const chipText = chip.toLowerCase();
    const normalisedChipText = chipText.replace('&', 'and');
    const words = chipText.split(/[\s&/-]+/).filter(word => word.length > 3);
    return lower.includes(chipText) || lower.includes(normalisedChipText) || words.some(word => lower.includes(word));
  });
  return matchedChip ? (aiDraftProfiles[matchedChip] ?? makeGenericDraftProfile(matchedChip)) : aiDraftProfiles['Asset Condition Survey'];
}

function getResponsibleRoleForPrompt(prompt: string, type: SurveyType) {
  const lower = prompt.toLowerCase();
  if (lower.includes('fire') || lower.includes('life safety')) return 'Fire safety contractor with HSE review';
  if (lower.includes('lift') || lower.includes('elevator')) return 'Lift vendor with facilities manager review';
  if (lower.includes('clean') || lower.includes('housekeeping')) return 'Soft services supervisor';
  if (lower.includes('security') || lower.includes('patrol')) return 'Security supervisor';
  if (lower.includes('landscape') || lower.includes('irrigation')) return 'Landscape contractor with site manager review';
  if (lower.includes('handover') || lower.includes('snag')) return 'Handover lead with QA/QC review';
  if (lower.includes('permit') || lower.includes('environment') || lower.includes('waste')) return 'Compliance lead with site supervisor review';
  if (lower.includes('vendor') || lower.includes('contractor')) return 'FM supervisor with vendor manager review';
  if (type === 'Preventive Maintenance') return 'FM Engineer with MEP supervisor review';
  if (type === 'Safety') return 'HSE lead with site supervisor review';
  return 'Assigned field supervisor';
}

function buildGeneratedSurveyFromPrompt(prompt: string) {
  const selectedChip = inferAiChipFromPrompt(prompt);
  const profile = getAiDraftProfile(prompt, selectedChip);
  const type = inferSurveyTypeFromPrompt(prompt);
  return {
    title: titleFromPrompt(prompt, type),
    prompt,
    frequency: profile.frequency,
    responsibleRole: getResponsibleRoleForPrompt(prompt, type),
    sections: profile.questionSections.map(section => ({
      title: section.title,
      questions: section.questions.map(question => {
        const parts = [question];
        if (needsPhotoEvidence(question)) parts.push('photo evidence');
        if (isTechnicalInspectionQuestion(question)) parts.push('Copilot guidance');
        return parts.join(' - ');
      }),
    })),
  };
}

function nudgePrompt(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes('monthly')) return prompt.replace(/monthly/gi, 'quarterly with risk-based spot checks');
  if (lower.includes('inspection')) return prompt.replace(/inspection/gi, 'inspection with escalation rules');
  if (lower.includes('checklist')) return prompt.replace(/checklist/gi, 'checklist with evidence and scoring');
  return `${prompt} with evidence, scoring, escalation rules, and mobile Copilot guidance`;
}

function getTemplatePreview(template: FieldOpsTemplate) {
  const lower = template.name.toLowerCase();
  if (lower.includes('hvac')) {
    return {
      frequency: 'Monthly',
      responsibleRole: 'FM Engineer with MEP supervisor review',
      sections: [
        { title: 'Safety & Isolation', checks: ['Confirm lockout/tagout is in place', 'Verify safe access around equipment'] },
        { title: 'Operational Readings', checks: ['Record chilled water pressure', 'Record entering and leaving temperature differential'] },
        { title: 'Evidence & Sign-off', checks: ['Upload panel photo evidence', 'Supervisor signature required for abnormal readings'] },
      ],
      triggers: ['Pressure outside range creates incident', 'Failed safety item blocks submission'],
    };
  }
  if (lower.includes('lift')) {
    return {
      frequency: 'Weekly',
      responsibleRole: 'Lift vendor with facility manager review',
      sections: [
        { title: 'Cabin & Landing Checks', checks: ['Inspect doors, buttons, lighting, and emergency phone', 'Confirm landing alignment at sampled floors'] },
        { title: 'Safety Verification', checks: ['Validate alarm response', 'Capture photo evidence for defects'] },
        { title: 'Sign-off', checks: ['Inspector notes', 'Supervisor signature'] },
      ],
      triggers: ['Failed safety check creates high-priority incident', 'Missing signature keeps submission pending'],
    };
  }
  if (lower.includes('fire')) {
    return {
      frequency: 'Weekly for critical areas',
      responsibleRole: 'Fire safety contractor',
      sections: [
        { title: 'Life Safety Assets', checks: ['Check extinguishers, hose reels, and fire doors', 'Confirm pump panel status'] },
        { title: 'Escape Routes', checks: ['Verify exits are clear', 'Capture blocked route evidence'] },
        { title: 'Compliance Evidence', checks: ['GPS capture required', 'Attach inspection photos'] },
      ],
      triggers: ['Blocked exit creates critical incident', 'Failed fire pump creates immediate escalation'],
    };
  }
  if (lower.includes('clean')) {
    return {
      frequency: 'Daily',
      responsibleRole: 'Soft services supervisor',
      sections: [
        { title: 'Area Condition', checks: ['Rate lobby, corridors, washrooms, and amenities', 'Capture failed area photos'] },
        { title: 'Consumables', checks: ['Confirm supplies stocked', 'Record missing consumables'] },
        { title: 'Closeout', checks: ['Supervisor notes', 'Optional resident-facing comment'] },
      ],
      triggers: ['Repeated failed area opens corrective task', 'Low score flags vendor performance'],
    };
  }
  return {
    frequency: template.type === 'Handover' ? 'Per handover batch' : 'As scheduled',
    responsibleRole: template.type === 'Handover' ? 'Handover lead with QA/QC review' : 'Assigned field supervisor',
    sections: [
      { title: 'Context & Scope', checks: ['Confirm site, asset, and survey location', 'Scan QR or capture GPS where required'] },
      { title: 'Inspection Checks', checks: ['Complete pass/fail checklist', 'Capture notes for failed items'] },
      { title: 'Evidence & Review', checks: ['Upload required evidence', 'Submit for supervisor review'] },
    ],
    triggers: ['Failed mandatory check creates issue', 'Missing evidence blocks submission'],
  };
}

function needsPhotoEvidence(text: string) {
  const lower = text.toLowerCase();
  return lower.includes('photo') || lower.includes('evidence') || lower.includes('defect') || lower.includes('blocked') || lower.includes('failed');
}

function isTechnicalInspectionQuestion(text: string) {
  const lower = text.toLowerCase();
  return [
    'alarm',
    'asset',
    'chiller',
    'compressor',
    'differential',
    'door',
    'electrical',
    'emergency',
    'fire',
    'gps',
    'hvac',
    'isolation',
    'lift',
    'lockout',
    'mep',
    'panel',
    'permit',
    'pressure',
    'pump',
    'qr',
    'reading',
    'riser',
    'scan',
    'temperature',
    'valve',
    'waterproofing',
  ].some(keyword => lower.includes(keyword));
}

function getCopilotGuidance(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes('pressure')) return 'Confirm the asset is running under normal load, read the calibrated gauge or BMS value, record the unit, and flag any value outside the approved operating range.';
  if (lower.includes('temperature') || lower.includes('differential')) return 'Measure entering and leaving temperatures after the system stabilises, compare against the expected differential, and note ambient conditions if readings are abnormal.';
  if (lower.includes('lockout') || lower.includes('isolation')) return 'Verify isolation signage, lock/tag reference, responsible person, and stored-energy release before touching equipment. Stop the survey if isolation is unclear.';
  if (lower.includes('fire') || lower.includes('alarm') || lower.includes('pump')) return 'Check panel status, active faults, accessibility, and last service tag. Photograph failed or impaired life-safety equipment and escalate immediately.';
  if (lower.includes('lift') || lower.includes('door') || lower.includes('emergency')) return 'Test the item safely with the vendor or authorised inspector present. Confirm response, alignment, signage, and any fault indication before marking pass.';
  if (lower.includes('gps') || lower.includes('qr') || lower.includes('scan') || lower.includes('asset')) return 'Stand at the inspected asset or zone, scan the QR if available, confirm the location shown in the app, and correct the asset reference before submitting.';
  if (lower.includes('permit')) return 'Check the permit number, validity window, scope, authorised supervisor, required controls, and work area match before allowing work to continue.';
  if (lower.includes('defect') || lower.includes('failed') || lower.includes('abnormal')) return 'Describe the failure clearly, capture a close-up and wider context photo, record severity, and assign the corrective owner before moving on.';
  return 'Follow the approved method statement, inspect only the specified asset or area, record objective observations, and escalate unsafe or abnormal findings before submission.';
}

function createEditableQuestion(text: string, photoRequired = needsPhotoEvidence(text)): EditableTemplateQuestion {
  const copilotEnabled = isTechnicalInspectionQuestion(text);
  return {
    text,
    photoRequired,
    copilotEnabled,
    copilotGuidance: copilotEnabled ? getCopilotGuidance(text) : '',
  };
}

function toEditableSections(sections: Array<{ title: string; checks: string[] }>): EditableTemplateSection[] {
  return sections.map(section => ({
    title: section.title,
    checks: section.checks
      .filter(check => !check.toLowerCase().startsWith('upload photo') && !check.toLowerCase().startsWith('capture photo'))
      .map(check => createEditableQuestion(
        check.replace(/^Upload photo evidence for\s*/i, '').replace(/^Capture photo evidence for\s*/i, 'Capture evidence for '),
        needsPhotoEvidence(check),
      )),
  }));
}

function surveyToTemplate(survey: Survey): FieldOpsTemplate {
  return {
    name: survey.name,
    type: survey.type,
    duration: survey.type === 'Handover' ? '25 min' : survey.type === 'Cleaning Audit' ? '9 min' : '12 min',
    questions: survey.questions.filter(question => question.type !== 'section').length,
    evidence: survey.questions.some(question => question.evidenceRequired) ? 'Photos required by question' : 'Photos optional',
  };
}

function surveyToEditableSections(survey: Survey): EditableTemplateSection[] {
  const sections: EditableTemplateSection[] = [];
  let activeSection: EditableTemplateSection = { title: 'Survey checks', checks: [] };

  survey.questions.forEach(question => {
    if (question.type === 'section') {
      if (activeSection.checks.length) sections.push(activeSection);
      activeSection = { title: question.label, checks: [] };
      return;
    }
    activeSection.checks.push(createEditableQuestion(question.label, question.evidenceRequired));
  });

  if (activeSection.checks.length || sections.length === 0) sections.push(activeSection);
  return sections;
}

function aiDraftToTemplate(prompt: string, profile: AiDraftProfile): FieldOpsTemplate {
  const inferredType = inferSurveyTypeFromPrompt(prompt);
  return {
    name: titleFromPrompt(prompt, inferredType),
    type: inferredType,
    duration: profile.duration,
    questions: profile.questions,
    evidence: profile.evidence,
  };
}

function aiDraftToEditableSections(profile: AiDraftProfile): EditableTemplateSection[] {
  return profile.questionSections.map(section => ({
    title: section.title,
    checks: section.questions.map(question => createEditableQuestion(question)),
  }));
}

function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass[tone] ?? 'border-[rgba(46,127,255,0.2)] bg-white/5 text-[#B8C7DB]'}`}>
      {children}
    </span>
  );
}

function ActionIconButton({
  label,
  icon: Icon,
  onClick,
  danger = false,
  disabled = false,
}: {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`group relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
        disabled
          ? 'border-slate-500/15 bg-slate-500/8 text-slate-500'
          : danger
          ? 'border-red-400/18 bg-red-400/8 text-red-200 hover:border-red-300/45 hover:bg-red-400/14'
          : 'border-[rgba(46,127,255,0.16)] bg-[#07111F] text-[#7EB8F7] hover:border-[#7EB8F7]/45 hover:bg-[#12305C]'
      }`}
    >
      <Icon size={14} />
      <span className={`pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-bold opacity-0 shadow-xl transition-all group-hover:-top-9 group-hover:opacity-100 ${
        disabled
          ? 'border-slate-500/20 bg-[#07111F] text-slate-300'
          : danger
          ? 'border-red-400/25 bg-[#2A0B14] text-red-100'
          : 'border-[rgba(46,127,255,0.32)] bg-[#07111F] text-[#DDE6F8]'
      }`}>
        {label}
      </span>
    </button>
  );
}

function TemplateSurveyDetails({
  template,
  onUseTemplate,
  initialSections,
  eyebrow = 'Survey template',
  actionLabel = 'Use edited template',
}: {
  template: FieldOpsTemplate;
  onUseTemplate?: () => void;
  initialSections?: EditableTemplateSection[];
  eyebrow?: string;
  actionLabel?: string;
}) {
  const preview = getTemplatePreview(template);
  const [sections, setSections] = useState<EditableTemplateSection[]>(() => initialSections ?? toEditableSections(preview.sections));
  const [responsibleRole, setResponsibleRole] = useState(preview.responsibleRole);
  const [triggers, setTriggers] = useState(preview.triggers);

  useEffect(() => {
    const nextPreview = getTemplatePreview(template);
    setSections(initialSections ?? toEditableSections(nextPreview.sections));
    setResponsibleRole(nextPreview.responsibleRole);
    setTriggers(nextPreview.triggers);
  }, [template, initialSections]);

  const updateSectionTitle = (sectionIndex: number, title: string) => {
    setSections(current => current.map((section, index) => index === sectionIndex ? { ...section, title } : section));
  };

  const updateQuestion = (sectionIndex: number, questionIndex: number, value: string) => {
    setSections(current => current.map((section, index) => {
      if (index !== sectionIndex) return section;
      return {
        ...section,
        checks: section.checks.map((check, checkIndex) => {
          if (checkIndex !== questionIndex) return check;
          const technical = isTechnicalInspectionQuestion(value);
          return {
            ...check,
            text: value,
            copilotEnabled: technical ? check.copilotEnabled : false,
            copilotGuidance: technical && !check.copilotGuidance ? getCopilotGuidance(value) : check.copilotGuidance,
          };
        }),
      };
    }));
  };

  const toggleQuestionPhoto = (sectionIndex: number, questionIndex: number) => {
    setSections(current => current.map((section, index) => {
      if (index !== sectionIndex) return section;
      return { ...section, checks: section.checks.map((check, checkIndex) => checkIndex === questionIndex ? { ...check, photoRequired: !check.photoRequired } : check) };
    }));
  };

  const toggleQuestionCopilot = (sectionIndex: number, questionIndex: number) => {
    setSections(current => current.map((section, index) => {
      if (index !== sectionIndex) return section;
      return {
        ...section,
        checks: section.checks.map((check, checkIndex) => {
          if (checkIndex !== questionIndex) return check;
          const nextEnabled = !check.copilotEnabled;
          return {
            ...check,
            copilotEnabled: nextEnabled,
            copilotGuidance: nextEnabled && !check.copilotGuidance ? getCopilotGuidance(check.text) : check.copilotGuidance,
          };
        }),
      };
    }));
  };

  const updateQuestionCopilotGuidance = (sectionIndex: number, questionIndex: number, value: string) => {
    setSections(current => current.map((section, index) => {
      if (index !== sectionIndex) return section;
      return { ...section, checks: section.checks.map((check, checkIndex) => checkIndex === questionIndex ? { ...check, copilotGuidance: value } : check) };
    }));
  };

  const addQuestion = (sectionIndex: number) => {
    setSections(current => current.map((section, index) => index === sectionIndex ? { ...section, checks: [...section.checks, createEditableQuestion('New checklist question', false)] } : section));
  };

  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    setSections(current => current.map((section, index) => {
      if (index !== sectionIndex) return section;
      return { ...section, checks: section.checks.filter((_, checkIndex) => checkIndex !== questionIndex) };
    }));
  };

  const addTrigger = () => {
    setTriggers(current => [...current, 'New automation rule']);
  };

  const totalChecks = sections.reduce((sum, section) => sum + section.checks.length, 0);
  const photoEvidenceCount = sections.reduce((sum, section) => sum + section.checks.filter(check => check.photoRequired).length, 0);
  const copilotGuidanceCount = sections.reduce((sum, section) => sum + section.checks.filter(check => check.copilotEnabled).length, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#E11D2E]/25 bg-[linear-gradient(135deg,rgba(225,29,46,0.13),rgba(46,127,255,0.06))] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">{eyebrow}</div>
            <h4 className="mt-1 text-xl font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{template.name}</h4>
            <p className="mt-1 text-[12px] text-[#7A94B4]">{template.type}</p>
          </div>
          <Badge tone="Completed">{totalChecks} checks</Badge>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-[#07111F] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Duration</div>
            <div className="mt-1 text-sm font-black text-white">{template.duration}</div>
          </div>
          <div className="rounded-xl bg-[#07111F] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Evidence</div>
            <div className="mt-1 text-sm font-black text-white">{template.evidence}</div>
          </div>
          <div className="rounded-xl bg-[#07111F] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Frequency</div>
            <div className="mt-1 text-sm font-black text-white">{preview.frequency}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h5 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Survey questions</h5>
            <p className="mt-1 text-[11px] text-[#7A94B4]">Edit questions, require photo evidence, and enable Copilot guidance for technical inspections.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{sections.length} sections</Badge>
            <Badge>{photoEvidenceCount} photo evidence</Badge>
            <Badge>{copilotGuidanceCount} copilot guides</Badge>
          </div>
        </div>
        <div className="mt-3 space-y-3">
          {sections.map((section, sectionIndex) => (
            <div key={`${section.title}-${sectionIndex}`} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-3">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Section</span>
                <input
                  value={section.title}
                  onChange={event => updateSectionTitle(sectionIndex, event.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-3 text-[12px] font-bold text-white outline-none focus:border-[#E11D2E]"
                />
              </label>
              <div className="mt-2 space-y-2">
                {section.checks.map((check, questionIndex) => (
                  <div key={`${check.text}-${questionIndex}`} className="grid gap-2 rounded-lg border border-[rgba(46,127,255,0.10)] bg-[#07111F] p-2 sm:grid-cols-[auto_1fr_auto_auto_auto] sm:items-center">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-300" />
                    <input
                      value={check.text}
                      onChange={event => updateQuestion(sectionIndex, questionIndex, event.target.value)}
                      className="h-9 min-w-0 flex-1 rounded-lg border border-[rgba(46,127,255,0.14)] bg-[#102040] px-3 text-[11px] text-[#DDE6F8] outline-none focus:border-[#E11D2E]"
                    />
                    <label className={`flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-[10px] font-bold transition ${check.photoRequired ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-[rgba(46,127,255,0.16)] bg-[#0A1628] text-[#7A94B4] hover:text-[#DDE6F8]'}`}>
                      <input
                        type="checkbox"
                        checked={check.photoRequired}
                        onChange={() => toggleQuestionPhoto(sectionIndex, questionIndex)}
                        className="accent-[#E11D2E]"
                      />
                      Photo evidence
                    </label>
                    {isTechnicalInspectionQuestion(check.text) && (
                      <label className={`flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-[10px] font-bold transition ${check.copilotEnabled ? 'border-[#7C3AED]/40 bg-[#7C3AED]/16 text-violet-100 shadow-lg shadow-violet-950/20' : 'border-[rgba(46,127,255,0.16)] bg-[#0A1628] text-[#7A94B4] hover:text-[#DDE6F8]'}`}>
                        <input
                          type="checkbox"
                          checked={check.copilotEnabled}
                          onChange={() => toggleQuestionCopilot(sectionIndex, questionIndex)}
                          className="accent-[#7C3AED]"
                        />
                        <Bot size={13} />
                        Copilot guide
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={() => removeQuestion(sectionIndex, questionIndex)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/8 text-red-200 hover:bg-red-400/14"
                      aria-label="Remove question"
                    >
                      <X size={13} />
                    </button>
                    {check.copilotEnabled && isTechnicalInspectionQuestion(check.text) && (
                      <div className="rounded-lg border border-[#7C3AED]/24 bg-[#7C3AED]/10 p-3 sm:col-start-2 sm:col-span-4">
                        <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-100">
                          <Bot size={13} />
                          Surveyor Copilot guidance
                        </div>
                        <textarea
                          value={check.copilotGuidance}
                          onChange={event => updateQuestionCopilotGuidance(sectionIndex, questionIndex, event.target.value)}
                          className="min-h-16 w-full rounded-lg border border-[#7C3AED]/20 bg-[#07111F] p-3 text-[11px] leading-5 text-[#DDE6F8] outline-none placeholder:text-[#4A6080] focus:border-[#7C3AED]"
                          placeholder="Add short field guidance for how the surveyor should perform this technical check."
                        />
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addQuestion(sectionIndex)}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2 text-[11px] font-bold text-[#B8C7DB] hover:border-[#7EB8F7]/45 hover:text-white"
                >
                  <Plus size={13} /> Add question
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-4">
        <h5 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Automation and review</h5>
        <label className="mt-3 block">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Responsible role</span>
          <input
            value={responsibleRole}
            onChange={event => setResponsibleRole(event.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#0A1628] px-3 text-[12px] text-[#EEF3FA] outline-none focus:border-[#E11D2E]"
          />
        </label>
        <div className="mt-3 space-y-2">
          {triggers.map((trigger, index) => (
            <div key={`${trigger}-${index}`} className="flex items-center gap-2">
              <input
                value={trigger}
                onChange={event => setTriggers(current => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                className="h-9 min-w-0 flex-1 rounded-xl border border-[#E11D2E]/20 bg-[#E11D2E]/8 px-3 text-[11px] font-semibold text-red-100 outline-none focus:border-[#E11D2E]"
              />
              <button
                type="button"
                onClick={() => setTriggers(current => current.filter((_, itemIndex) => itemIndex !== index))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/8 text-red-200 hover:bg-red-400/14"
                aria-label="Remove automation rule"
              >
                <X size={13} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTrigger}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E11D2E]/25 bg-[#E11D2E]/8 px-3 py-2 text-[11px] font-bold text-red-100 hover:bg-[#E11D2E]/14"
          >
            <Plus size={13} /> Add rule
          </button>
        </div>
      </div>

      {onUseTemplate && (
        <button onClick={onUseTemplate} className="h-10 w-full rounded-xl bg-[#E11D2E] text-[12px] font-bold text-white shadow-lg shadow-red-950/25">{actionLabel}</button>
      )}
    </div>
  );
}

const QR_VERSION = 6;
const QR_SIZE = 41;
const QR_DATA_CODEWORDS = 136;
const QR_EC_CODEWORDS_PER_BLOCK = 18;
const QR_BLOCKS = 2;

function initGaloisTables() {
  const exp = new Array<number>(512).fill(0);
  const log = new Array<number>(256).fill(0);
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) exp[i] = exp[i - 255];
  return { exp, log };
}

const GF = initGaloisTables();

function gfMul(left: number, right: number) {
  if (left === 0 || right === 0) return 0;
  return GF.exp[GF.log[left] + GF.log[right]];
}

function reedSolomonRemainder(data: number[], degree: number) {
  let generator = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array(generator.length + 1).fill(0);
    generator.forEach((coefficient, index) => {
      next[index] ^= coefficient;
      next[index + 1] ^= gfMul(coefficient, GF.exp[i]);
    });
    generator = next;
  }
  const result = new Array(degree).fill(0);
  data.forEach(byte => {
    const factor = byte ^ result.shift()!;
    result.push(0);
    generator.slice(1).forEach((coefficient, index) => {
      result[index] ^= gfMul(coefficient, factor);
    });
  });
  return result;
}

function pushBits(bits: number[], value: number, length: number) {
  for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
}

function bytesToCodewords(text: string) {
  const bytes = Array.from(new TextEncoder().encode(text));
  if (bytes.length > QR_DATA_CODEWORDS - 2) throw new Error('Survey link is too long for QR code');
  const bits: number[] = [];
  pushBits(bits, 0b0100, 4);
  pushBits(bits, bytes.length, 8);
  bytes.forEach(byte => pushBits(bits, byte, 8));
  pushBits(bits, 0, Math.min(4, QR_DATA_CODEWORDS * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    codewords.push(bits.slice(i, i + 8).reduce((value, bit) => (value << 1) | bit, 0));
  }
  for (let pad = 0; codewords.length < QR_DATA_CODEWORDS; pad += 1) {
    codewords.push(pad % 2 === 0 ? 0xec : 0x11);
  }
  return codewords;
}

function drawFinder(matrix: boolean[][], reserved: boolean[][], x: number, y: number) {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= QR_SIZE || yy >= QR_SIZE) continue;
      const isBorder = dx === 0 || dx === 6 || dy === 0 || dy === 6;
      const isCenter = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
      matrix[yy][xx] = isBorder || isCenter;
      reserved[yy][xx] = true;
    }
  }
}

function drawAlignment(matrix: boolean[][], reserved: boolean[][], centerX: number, centerY: number) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const xx = centerX + dx;
      const yy = centerY + dy;
      matrix[yy][xx] = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
      reserved[yy][xx] = true;
    }
  }
}

function maskBit(mask: number, x: number, y: number) {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function formatBits(mask: number) {
  const data = (1 << 3) | mask; // error correction level L
  let value = data << 10;
  const generator = 0x537;
  for (let i = 14; i >= 10; i -= 1) {
    if ((value >>> i) & 1) value ^= generator << (i - 10);
  }
  return ((data << 10) | value) ^ 0x5412;
}

function drawFormat(matrix: boolean[][], reserved: boolean[][], mask: number) {
  const bits = formatBits(mask);
  const bit = (index: number) => ((bits >>> index) & 1) === 1;
  for (let i = 0; i <= 5; i += 1) matrix[i][8] = bit(i);
  matrix[7][8] = bit(6);
  matrix[8][8] = bit(7);
  matrix[8][7] = bit(8);
  for (let i = 9; i < 15; i += 1) matrix[8][14 - i] = bit(i);
  for (let i = 0; i < 8; i += 1) matrix[8][QR_SIZE - 1 - i] = bit(i);
  for (let i = 8; i < 15; i += 1) matrix[QR_SIZE - 15 + i][8] = bit(i);
  for (let y = 0; y < QR_SIZE; y += 1) reserved[y][8] = true;
  for (let x = 0; x < QR_SIZE; x += 1) reserved[8][x] = true;
}

function penalty(matrix: boolean[][]) {
  let score = 0;
  for (let y = 0; y < QR_SIZE; y += 1) {
    let runColor = matrix[y][0];
    let runLength = 1;
    for (let x = 1; x < QR_SIZE; x += 1) {
      if (matrix[y][x] === runColor) runLength += 1;
      else {
        if (runLength >= 5) score += 3 + runLength - 5;
        runColor = matrix[y][x];
        runLength = 1;
      }
    }
    if (runLength >= 5) score += 3 + runLength - 5;
  }
  for (let x = 0; x < QR_SIZE; x += 1) {
    let runColor = matrix[0][x];
    let runLength = 1;
    for (let y = 1; y < QR_SIZE; y += 1) {
      if (matrix[y][x] === runColor) runLength += 1;
      else {
        if (runLength >= 5) score += 3 + runLength - 5;
        runColor = matrix[y][x];
        runLength = 1;
      }
    }
    if (runLength >= 5) score += 3 + runLength - 5;
  }
  for (let y = 0; y < QR_SIZE - 1; y += 1) {
    for (let x = 0; x < QR_SIZE - 1; x += 1) {
      const color = matrix[y][x];
      if (matrix[y][x + 1] === color && matrix[y + 1][x] === color && matrix[y + 1][x + 1] === color) score += 3;
    }
  }
  const dark = matrix.flat().filter(Boolean).length;
  score += Math.floor(Math.abs((dark * 100) / (QR_SIZE * QR_SIZE) - 50) / 5) * 10;
  return score;
}

function createQrMatrix(text: string) {
  const data = bytesToCodewords(text);
  const dataBlocks = Array.from({ length: QR_BLOCKS }, (_, index) => data.slice(index * 68, index * 68 + 68));
  const ecBlocks = dataBlocks.map(block => reedSolomonRemainder(block, QR_EC_CODEWORDS_PER_BLOCK));
  const interleaved: number[] = [];
  for (let i = 0; i < 68; i += 1) dataBlocks.forEach(block => interleaved.push(block[i]));
  for (let i = 0; i < QR_EC_CODEWORDS_PER_BLOCK; i += 1) ecBlocks.forEach(block => interleaved.push(block[i]));
  const bits = interleaved.flatMap(byte => Array.from({ length: 8 }, (_, i) => (byte >>> (7 - i)) & 1));

  const base = Array.from({ length: QR_SIZE }, () => Array.from({ length: QR_SIZE }, () => false));
  const reserved = Array.from({ length: QR_SIZE }, () => Array.from({ length: QR_SIZE }, () => false));
  drawFinder(base, reserved, 0, 0);
  drawFinder(base, reserved, QR_SIZE - 7, 0);
  drawFinder(base, reserved, 0, QR_SIZE - 7);
  drawAlignment(base, reserved, 34, 34);
  for (let i = 8; i < QR_SIZE - 8; i += 1) {
    base[6][i] = i % 2 === 0;
    base[i][6] = i % 2 === 0;
    reserved[6][i] = true;
    reserved[i][6] = true;
  }
  base[4 * QR_VERSION + 9][8] = true;
  reserved[4 * QR_VERSION + 9][8] = true;
  drawFormat(base, reserved, 0);

  let bitIndex = 0;
  for (let right = QR_SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    for (let vert = 0; vert < QR_SIZE; vert += 1) {
      const y = ((right + 1) & 2) === 0 ? QR_SIZE - 1 - vert : vert;
      for (let x = right; x >= right - 1; x -= 1) {
        if (!reserved[y][x]) base[y][x] = bits[bitIndex++] === 1;
      }
    }
  }

  let bestMatrix = base;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let mask = 0; mask < 8; mask += 1) {
    const matrix = base.map(row => [...row]);
    for (let y = 0; y < QR_SIZE; y += 1) {
      for (let x = 0; x < QR_SIZE; x += 1) {
        if (!reserved[y][x] && maskBit(mask, x, y)) matrix[y][x] = !matrix[y][x];
      }
    }
    drawFormat(matrix, reserved, mask);
    const score = penalty(matrix);
    if (score < bestScore) {
      bestScore = score;
      bestMatrix = matrix;
    }
  }
  return bestMatrix;
}

function qrSvg(matrix: boolean[][], pixels = 256) {
  const quiet = 4;
  const moduleCount = matrix.length + quiet * 2;
  const cell = pixels / moduleCount;
  const rects = matrix.flatMap((row, y) => row.map((dark, x) => dark ? `<rect x="${(x + quiet) * cell}" y="${(y + quiet) * cell}" width="${cell}" height="${cell}"/>` : '').filter(Boolean)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="0 0 ${pixels} ${pixels}"><rect width="100%" height="100%" fill="#fff"/><g fill="#07111F">${rects}</g></svg>`;
}

function QRPreview({ value }: { value: string }) {
  const matrix = useMemo(() => createQrMatrix(value), [value]);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-inner">
      <svg viewBox={`0 0 ${matrix.length + 8} ${matrix.length + 8}`} className="h-36 w-36" aria-label="Scannable survey QR code" role="img">
        <rect width={matrix.length + 8} height={matrix.length + 8} fill="#fff" />
        {matrix.map((row, y) => row.map((dark, x) => dark ? <rect key={`${x}-${y}`} x={x + 4} y={y + 4} width={1} height={1} fill="#07111F" /> : null))}
      </svg>
    </div>
  );
}

function MobilePreview({ survey = surveys[0] }: { survey?: Survey }) {
  return (
    <div className="mx-auto w-[250px] rounded-[2.1rem] border border-[rgba(46,127,255,0.32)] bg-[#07111F] p-3 shadow-2xl shadow-blue-950/30">
      <div className="rounded-[1.6rem] bg-[#0A1628] p-4">
        <div className="mb-4 h-1.5 w-16 rounded-full bg-white/20 mx-auto" />
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#E11D2E]">FieldOps</div>
        <h4 className="mt-1 text-[15px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{survey.name}</h4>
        <p className="mt-1 text-[10px] leading-4 text-[#7A94B4]">{survey.siteIds.join(', ')} - {survey.type}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#112040]">
          <div className="h-full w-[42%] rounded-full bg-[#E11D2E]" />
        </div>
        <div className="mt-4 space-y-2">
          {survey.questions.slice(0, 4).map(question => (
            <div key={question.id} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#112040] p-3">
              <div className="text-[11px] font-bold text-[#EEF3FA]">{question.label}</div>
              <div className="mt-2 flex gap-1.5">
                {question.required && <Badge>Mandatory</Badge>}
                {question.evidenceRequired && <Badge tone="Completed">Evidence</Badge>}
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 h-10 w-full rounded-xl bg-[#E11D2E] text-[12px] font-bold text-white">Submit Survey</button>
      </div>
    </div>
  );
}

function CreateSurveyModal({
  onClose,
  onDesign,
  sites,
  initialTemplate,
}: {
  onClose: () => void;
  onDesign: (type: SurveyType) => void;
  sites: PortfolioClient[];
  initialTemplate?: FieldOpsTemplate | null;
}) {
  const [wizardStep, setWizardStep] = useState<CreateWizardStep>(initialTemplate ? 'basics' : 'start');
  const [startMode, setStartMode] = useState<CreateStartMode>(initialTemplate ? 'template' : 'ai');
  const [selectedTemplate, setSelectedTemplate] = useState<FieldOpsTemplate | null>(initialTemplate ?? null);
  const [previewTemplate, setPreviewTemplate] = useState<FieldOpsTemplate | null>(null);
  const [aiPrompt, setAiPrompt] = useState(aiGeneratedSurvey.prompt);
  const [selectedAiChip, setSelectedAiChip] = useState<string | null>('Asset Condition Survey');
  const [aiGeneratedPreview, setAiGeneratedPreview] = useState(false);
  const [aiDraftPreviewOpen, setAiDraftPreviewOpen] = useState(false);
  const [type, setType] = useState<SurveyType>(initialTemplate?.type ?? 'Preventive Maintenance');
  const [surveyName, setSurveyName] = useState(initialTemplate ? `${initialTemplate.name} survey` : 'Water-cooled chiller PPM checklist');
  const [siteId, setSiteId] = useState(sites[0]?.id ?? '');
  const selectedSite = useMemo(() => sites.find(site => site.id === siteId) ?? sites[0], [sites, siteId]);
  const scopeOptions = useMemo(() => getSiteScopes(selectedSite), [selectedSite]);
  const [scope, setScope] = useState(scopeOptions[0] ?? 'Portfolio-wide field scope');
  const [priority, setPriority] = useState<SurveyPriority>('High');
  const [validFrom, setValidFrom] = useState(() => formatDateInput(new Date()));
  const [validTo, setValidTo] = useState(() => formatDateInput(addDays(new Date(), 30)));
  const [descriptionEdited, setDescriptionEdited] = useState(false);
  const aiDescription = useMemo(
    () => buildAiDescription(type, selectedSite, scope, priority),
    [type, selectedSite, scope, priority],
  );
  const aiDraftProfile = useMemo(() => getAiDraftProfile(aiPrompt, selectedAiChip), [aiPrompt, selectedAiChip]);
  const aiDraftTemplate = useMemo(() => aiDraftToTemplate(aiPrompt, aiDraftProfile), [aiPrompt, aiDraftProfile]);
  const aiDraftSections = useMemo(() => aiDraftToEditableSections(aiDraftProfile), [aiDraftProfile]);
  const [description, setDescription] = useState(aiDescription);

  useEffect(() => {
    if (!siteId && sites[0]) setSiteId(sites[0].id);
  }, [sites, siteId]);

  useEffect(() => {
    setScope(scopeOptions[0] ?? 'Portfolio-wide field scope');
  }, [siteId, scopeOptions]);

  useEffect(() => {
    if (!descriptionEdited) setDescription(aiDescription);
  }, [aiDescription, descriptionEdited]);

  const applyTemplate = (template: FieldOpsTemplate) => {
    setSelectedTemplate(template);
    setStartMode('template');
    setType(template.type);
    setSurveyName(`${template.name} survey`);
    setDescriptionEdited(false);
    setWizardStep('basics');
  };

  const startManual = () => {
    setSelectedTemplate(null);
    setStartMode('manual');
    setType('Custom');
    setSurveyName('New custom field survey');
    setDescriptionEdited(false);
    setWizardStep('basics');
  };

  const applyAiDraft = () => {
    const inferredType = inferSurveyTypeFromPrompt(aiPrompt);
    setSelectedTemplate(null);
    setStartMode('ai');
    setType(inferredType);
    setSurveyName(titleFromPrompt(aiPrompt, inferredType));
    setDescriptionEdited(false);
    setAiGeneratedPreview(true);
    setWizardStep('basics');
  };

  const goBackFromBasics = () => {
    if (startMode === 'template') {
      setWizardStep('template');
      return;
    }
    if (startMode === 'ai') {
      setWizardStep('ai');
      return;
    }
    setWizardStep('start');
  };

  const stepLabel = wizardStep === 'start' ? 'Step 1 / Choose path' : wizardStep === 'ai' ? 'Step 1 / AI Assist' : wizardStep === 'template' ? 'Step 1 / Template Library' : 'Step 2 / Survey Basics';
  const helperText = wizardStep === 'start'
    ? 'Start with AI, choose a proven template, or build manually.'
    : wizardStep === 'ai'
    ? 'Describe what you need and AI will prepare the first survey draft.'
    : wizardStep === 'template'
    ? 'Pick a best-practice structure and then refine the survey basics.'
    : selectedTemplate
    ? `Starting from ${selectedTemplate.name}: ${selectedTemplate.questions} questions, ${selectedTemplate.duration}, ${selectedTemplate.evidence}.`
    : startMode === 'ai'
    ? 'AI has prepared the first draft. Review the basics before opening the designer.'
    : 'Superadmin can create, publish, and assign surveys across all organizations.';

  return (
    <div className="fixed inset-0 z-[2500] flex items-start justify-center overflow-hidden p-3 sm:p-4">
      <button className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} aria-label="Close create survey" />
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.25)] bg-[#0A1628] shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
        <div className="shrink-0 flex items-start justify-between border-b border-[rgba(46,127,255,0.14)] bg-[linear-gradient(135deg,rgba(225,29,46,0.14),rgba(46,127,255,0.06))] px-5 py-3.5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#E11D2E]">{stepLabel}</div>
            <h3 className="mt-1 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Create Survey</h3>
            <p className="mt-1 text-[12px] text-[#7A94B4]">
              {helperText}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#7A94B4] hover:bg-white/5 hover:text-white"><X size={18} /></button>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-5 sm:px-5">
          {wizardStep === 'start' && (
            <div className="grid gap-3 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => { setStartMode('ai'); setWizardStep('ai'); }}
                className="group rounded-2xl border border-[#E11D2E]/35 bg-[linear-gradient(135deg,rgba(225,29,46,0.18),rgba(46,127,255,0.08))] p-5 text-left shadow-xl shadow-red-950/10 transition hover:-translate-y-0.5 hover:border-[#E11D2E]/70"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E11D2E] text-white shadow-lg shadow-red-950/30"><Sparkles size={20} /></div>
                <div className="text-[10px] font-black uppercase tracking-widest text-red-200">Recommended</div>
                <h4 className="mt-2 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Start with AI</h4>
                <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">Tell AI what you need and get a complete mobile-ready survey draft instantly.</p>
                <span className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white group-hover:bg-[#E11D2E]">AI Assist</span>
              </button>
              <button
                type="button"
                onClick={() => { setStartMode('template'); setWizardStep('template'); }}
                className="group rounded-2xl border border-[rgba(46,127,255,0.2)] bg-[#07111F] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#7EB8F7]/55 hover:bg-[#102040]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#12305C] text-[#7EB8F7]"><ClipboardCheck size={20} /></div>
                <h4 className="text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Use Template</h4>
                <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">Choose a best-practice checklist by asset, service type, or inspection workflow.</p>
                <span className="mt-5 inline-flex rounded-full border border-[rgba(46,127,255,0.24)] px-3 py-1 text-[11px] font-bold text-[#B8C7DB] group-hover:text-white">Browse templates</span>
              </button>
              <button
                type="button"
                onClick={startManual}
                className="group rounded-2xl border border-[rgba(46,127,255,0.2)] bg-[#07111F] p-5 text-left transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-[#102040]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-[#B8C7DB]"><PencilRuler size={20} /></div>
                <h4 className="text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Build Manually</h4>
                <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">Start from a blank survey and define fields, evidence, rules, and scoring yourself.</p>
                <span className="mt-5 inline-flex rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold text-[#B8C7DB] group-hover:text-white">Manual setup</span>
              </button>
            </div>
          )}

          {wizardStep === 'ai' && (
            <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
              <div className="rounded-2xl border border-[#E11D2E]/30 bg-[linear-gradient(135deg,rgba(225,29,46,0.12),rgba(17,32,64,0.78))] p-5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-200"><Bot size={14} /> AI survey brief</div>
                <textarea
                  value={aiPrompt}
                  onChange={event => { setAiPrompt(event.target.value); setSelectedAiChip(null); setAiGeneratedPreview(false); }}
                  placeholder="Example: Create a preventive maintenance checklist for a water-cooled chiller in a residential tower."
                  className="mt-4 min-h-32 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] p-3 text-[12px] leading-5 text-[#EEF3FA] outline-none placeholder:text-[#4A6080] focus:border-[#E11D2E]"
                />
                <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                  {aiPromptCategories.map(group => (
                    <div key={group.category}>
                      <div className="mb-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#7A94B4]">{group.category}</div>
                      <div className="flex flex-wrap gap-2">
                        {group.chips.map(chip => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              setSelectedAiChip(chip);
                              setAiPrompt(`Create a ${chip.toLowerCase()} checklist for a site development and management portfolio.`);
                              setAiGeneratedPreview(false);
                            }}
                            className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${selectedAiChip === chip ? 'border-[#E11D2E]/70 bg-[#E11D2E]/12 text-white shadow-lg shadow-red-950/20' : 'border-[rgba(46,127,255,0.22)] bg-[#07111F] text-[#B8C7DB] hover:border-[#E11D2E]/45 hover:text-white'}`}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[rgba(46,127,255,0.18)] bg-[#07111F] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI draft preview</h4>
                    <p className="mt-1 text-[11px] text-[#7A94B4]">{aiGeneratedPreview ? 'Generated questions for the selected survey type.' : 'Structured and ready for the survey basics step.'}</p>
                  </div>
                  <Badge tone={aiGeneratedPreview ? 'Completed' : 'default'}>{aiGeneratedPreview ? 'Draft generated' : 'Ready to generate'}</Badge>
                </div>
                <div className="mt-4 grid gap-2 text-[11px] text-[#B8C7DB]">
                  <div className="rounded-xl bg-[#102040] p-3"><b className="text-white">{aiDraftProfile.sections} sections</b> across {aiDraftProfile.focus}.</div>
                  <div className="rounded-xl bg-[#102040] p-3"><b className="text-white">{aiDraftProfile.questions} questions</b> with mandatory checks and evidence rules.</div>
                  <div className="rounded-xl bg-[#102040] p-3"><b className="text-white">{aiDraftProfile.duration}</b> estimated field completion time.</div>
                  <div className="rounded-xl bg-[#102040] p-3"><b className="text-white">{aiDraftProfile.frequency}</b> recommended frequency with {aiDraftProfile.evidence}.</div>
                </div>
                {aiGeneratedPreview && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                    {aiDraftProfile.questionSections.map(section => (
                      <div key={section.title} className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#0A1628] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <h5 className="text-[12px] font-black text-[#EEF3FA]">{section.title}</h5>
                          <span className="rounded-full border border-[#E11D2E]/25 bg-[#E11D2E]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-red-100">{section.questions.length} checks</span>
                        </div>
                        <div className="mt-2 space-y-2">
                          {section.questions.map(question => (
                            <div key={question} className="flex gap-2 rounded-lg bg-[#102040] px-3 py-2 text-[11px] leading-4 text-[#B8C7DB]">
                              <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-300" />
                              <span>{question}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {wizardStep === 'template' && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {templates.map(template => {
                const normalized = normalizeTemplate(template);
                return (
                  <div key={template.name} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E11D2E]/12 text-red-200"><ClipboardCheck size={18} /></div>
                    <h3 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{template.name}</h3>
                    <p className="mt-1 text-[11px] text-[#7A94B4]">{template.type}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-[#B8C7DB]">
                      <span>{template.duration}</span>
                      <span>{template.questions} questions</span>
                      <span className="col-span-2">{template.evidence}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button onClick={() => setPreviewTemplate(normalized)} className="rounded-lg border border-[rgba(46,127,255,0.24)] bg-[#07111F] px-3 py-2 text-[11px] font-bold text-[#B8C7DB] hover:border-[#7EB8F7]/50 hover:text-white">
                        View survey
                      </button>
                      <button onClick={() => applyTemplate(normalized)} className="rounded-lg border border-[#E11D2E]/35 bg-[#E11D2E]/10 px-3 py-2 text-[11px] font-bold text-red-200 hover:bg-[#E11D2E]/16">Use template</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {wizardStep === 'basics' && (
            <>
              <div className="grid gap-3 lg:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Survey name</span>
                  <input className={`${fieldInput} w-full`} value={surveyName} onChange={event => setSurveyName(event.target.value)} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Survey type</span>
                  <select className={`${fieldInput} w-full`} value={type} onChange={event => setType(event.target.value as SurveyType)}>
                    {surveyTypes.map(item => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Site</span>
                  <select className={`${fieldInput} w-full`} value={siteId} onChange={event => { setSiteId(event.target.value); setDescriptionEdited(false); }}>
                    {sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Site / Area / Asset scope</span>
                  <select className={`${fieldInput} w-full`} value={scope} onChange={event => { setScope(event.target.value); setDescriptionEdited(false); }}>
                    {scopeOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Priority</span>
                  <select className={`${fieldInput} w-full`} value={priority} onChange={event => { setPriority(event.target.value as SurveyPriority); setDescriptionEdited(false); }}>
                    {priorityOptions.map(option => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Validity window</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide text-[#4A6080]">From</span>
                      <input type="date" className={`${fieldInput} w-full pl-14`} value={validFrom} onChange={event => { setValidFrom(event.target.value); if (validTo < event.target.value) setValidTo(event.target.value); }} />
                    </label>
                    <label className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide text-[#4A6080]">To</span>
                      <input type="date" className={`${fieldInput} w-full pl-10`} value={validTo} min={validFrom} onChange={event => setValidTo(event.target.value)} />
                    </label>
                  </div>
                </div>
                <div className="rounded-xl border border-[#E11D2E]/20 bg-[linear-gradient(135deg,rgba(225,29,46,0.12),rgba(46,127,255,0.05))] p-4 lg:col-span-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#E11D2E]">
                        <Sparkles size={13} />
                        AI setup brief
                      </div>
                      <p className="mt-1 text-[12px] text-[#B8C7DB]">Site context, site scope, validity, and priority are used to shape the first survey draft.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                      {startMode === 'ai' && <span className="rounded-full border border-[#E11D2E]/25 bg-[#E11D2E]/10 px-2.5 py-1 text-red-100">AI draft applied</span>}
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-emerald-200">Site loaded</span>
                      <span className="rounded-full border border-blue-400/25 bg-blue-400/10 px-2.5 py-1 text-blue-200">Scope auto-filled</span>
                      <span className="rounded-full border border-[#E11D2E]/25 bg-[#E11D2E]/10 px-2.5 py-1 text-red-100">Evidence suggested</span>
                    </div>
                  </div>
                </div>
                <label className="space-y-1.5 lg:col-span-2">
                  <span className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">
                    AI suggested description
                    <button
                      type="button"
                      onClick={() => { setDescription(aiDescription); setDescriptionEdited(false); }}
                      className="rounded-full border border-[#E11D2E]/30 bg-[#E11D2E]/10 px-2.5 py-1 text-[10px] font-bold normal-case tracking-normal text-red-100 hover:bg-[#E11D2E]/16"
                    >
                      Regenerate with AI
                    </button>
                  </span>
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 py-2 text-[12px] leading-5 text-[#EEF3FA] outline-none placeholder:text-[#4A6080] focus:border-[#E11D2E]"
                    value={description}
                    onChange={event => { setDescription(event.target.value); setDescriptionEdited(true); }}
                  />
                  <span className="text-[10px] text-[#5A7190]">Valid {validFrom} to {validTo}. The design step will use this context to suggest sections, evidence rules, scoring, and mandatory checks.</span>
                </label>
              </div>
              <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#EEF3FA]">Template options for {type}</h4>
                    {selectedTemplate && <p className="mt-1 text-[11px] text-[#7A94B4]">{selectedTemplate.name} is selected as the starting structure.</p>}
                  </div>
                  {selectedTemplate && <Badge tone="Completed">Template loaded</Badge>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {templateOptions[type].map(template => <Badge key={template} tone={template === selectedTemplate?.name ? 'Completed' : 'default'}>{template}</Badge>)}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="shrink-0 flex flex-col-reverse gap-2 border-t border-[rgba(46,127,255,0.14)] bg-[#0A1628] px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          {wizardStep === 'basics' && !initialTemplate ? (
            <button onClick={goBackFromBasics} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Back</button>
          ) : <span />}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {wizardStep === 'start' && <button onClick={onClose} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Close</button>}
            {wizardStep === 'ai' && (
              <>
                <button onClick={() => setWizardStep('start')} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Back</button>
                <button onClick={() => { setAiGeneratedPreview(true); setAiDraftPreviewOpen(true); }} className="rounded-lg border border-[#E11D2E]/35 bg-[#E11D2E]/10 px-4 py-2 text-[12px] font-bold text-red-100 hover:bg-[#E11D2E]/16">Preview AI Draft</button>
                <button onClick={applyAiDraft} className="rounded-lg bg-[#E11D2E] px-4 py-2 text-[12px] font-bold text-white shadow-lg shadow-red-950/25">Generate Survey</button>
              </>
            )}
            {wizardStep === 'template' && (
              <>
                <button onClick={() => setWizardStep('start')} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Back</button>
                <button onClick={startManual} className="rounded-lg border border-[#E11D2E]/35 bg-[#E11D2E]/10 px-4 py-2 text-[12px] font-bold text-red-100 hover:bg-[#E11D2E]/16">Build Manually</button>
              </>
            )}
            {wizardStep === 'basics' && (
              <>
                <button onClick={onClose} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB] hover:bg-white/5">Save Draft</button>
                <button onClick={() => onDesign(type)} className="rounded-lg bg-[#E11D2E] px-4 py-2 text-[12px] font-bold text-white shadow-lg shadow-red-950/25">Continue to Design</button>
              </>
            )}
          </div>
        </div>
        {previewTemplate && (
          <div className="absolute inset-0 z-10 flex flex-col bg-[#0A1628]">
            <div className="flex shrink-0 items-center justify-between border-b border-[rgba(46,127,255,0.14)] bg-[linear-gradient(135deg,rgba(225,29,46,0.14),rgba(46,127,255,0.06))] px-5 py-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">Template preview</div>
                <h3 className="mt-1 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{previewTemplate.name}</h3>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="rounded-lg p-2 text-[#7A94B4] hover:bg-white/5 hover:text-white"><X size={18} /></button>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
              <TemplateSurveyDetails
                template={previewTemplate}
                onUseTemplate={() => {
                  applyTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
              />
            </div>
          </div>
        )}
        {aiDraftPreviewOpen && (
          <div className="absolute inset-0 z-10 flex flex-col bg-[#0A1628]">
            <div className="flex shrink-0 items-center justify-between border-b border-[rgba(46,127,255,0.14)] bg-[linear-gradient(135deg,rgba(225,29,46,0.14),rgba(46,127,255,0.06))] px-5 py-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">AI draft preview</div>
                <h3 className="mt-1 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{aiDraftTemplate.name}</h3>
              </div>
              <button onClick={() => setAiDraftPreviewOpen(false)} className="rounded-lg p-2 text-[#7A94B4] hover:bg-white/5 hover:text-white"><X size={18} /></button>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
              <TemplateSurveyDetails
                template={aiDraftTemplate}
                initialSections={aiDraftSections}
                eyebrow="AI generated draft"
                actionLabel="Use AI draft"
                onUseTemplate={() => {
                  setAiDraftPreviewOpen(false);
                  applyAiDraft();
                }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function SideDrawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.aside initial={{ x: 520 }} animate={{ x: 0 }} exit={{ x: 520 }} className="fixed bottom-0 right-0 top-[52px] z-[2200] flex w-full max-w-xl flex-col border-l border-[rgba(46,127,255,0.25)] bg-[#0A1628] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[rgba(46,127,255,0.14)] px-5 py-4">
        <h3 className="text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h3>
        <button onClick={onClose} className="rounded-lg p-2 text-[#7A94B4] hover:bg-white/5 hover:text-white"><X size={18} /></button>
      </div>
      <div className="custom-scrollbar flex-1 overflow-y-auto p-5">{children}</div>
    </motion.aside>
  );
}

function AssignSurveyPanel({ survey, onToast }: { survey: Survey; onToast: Props['onToast'] }) {
  const assignment = assignments.find(item => item.surveyId === survey.id) ?? assignments[0];
  const [assignees, setAssignees] = useState(() => assignment.assignee.split(',').map(item => item.trim()).filter(Boolean));
  const [site, setSite] = useState(assignment.site);
  const [assetSelectOpen, setAssetSelectOpen] = useState(false);
  const [startDate, setStartDate] = useState(formatDateInput(new Date()));
  const [dueDate, setDueDate] = useState(assignment.dueDate);
  const [recurrence, setRecurrence] = useState(assignment.recurrence);
  const [priority, setPriority] = useState<SurveyPriority>('High');
  const [reviewer, setReviewer] = useState('Mariam Saleh');
  const [instructions, setInstructions] = useState('Capture readings, upload evidence, and escalate any failed item immediately.');

  const scopeOptions = useMemo(() => {
    const scopes = [...survey.siteIds, ...survey.assetIds];
    return scopes.length ? scopes : ['All sites and common areas'];
  }, [survey.assetIds, survey.siteIds]);
  const assetOptions = useMemo(() => getAssetsForSite(site, survey), [site, survey]);
  const [selectedAssets, setSelectedAssets] = useState(() => getAssetsForSite(assignment.site, survey).slice(0, 1));

  useEffect(() => {
    const nextOptions = getAssetsForSite(site, survey);
    setSelectedAssets(current => {
      const retained = current.filter(asset => nextOptions.includes(asset));
      return retained.length ? retained : nextOptions.slice(0, 1);
    });
    setAssetSelectOpen(false);
  }, [site, survey]);

  const toggleAssignee = (assignee: string) => {
    setAssignees(current => current.includes(assignee) ? current.filter(item => item !== assignee) : [...current, assignee]);
  };

  const toggleAsset = (asset: string) => {
    setSelectedAssets(current => current.includes(asset) ? current.filter(item => item !== asset) : [...current, asset]);
  };

  const generateInstructions = (mode: 'draft' | 'safety' | 'short') => {
    const selected = assignees.length ? assignees.join(', ') : 'selected assignees';
    const assetText = selectedAssets.length ? selectedAssets.join(', ') : 'selected assets';
    if (mode === 'short') {
      setInstructions(`Complete ${survey.name} for ${assetText}, attach required evidence, and escalate failed critical checks before ${dueDate}.`);
      return;
    }
    if (mode === 'safety') {
      setInstructions(`Before starting ${survey.name} for ${assetText}, confirm safe access, PPE, isolation requirements, and site permissions. Capture photo evidence for failed checks, add notes for abnormal readings, and escalate any high-risk finding to ${reviewer}.`);
      return;
    }
    setInstructions(`Assign ${survey.name} to ${selected} for ${assetText}. Complete the survey within the selected validity window, capture mandatory photos/readings/GPS evidence, document failed items clearly, and route high-priority findings to ${reviewer} for review.`);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#E11D2E]/25 bg-[linear-gradient(135deg,rgba(225,29,46,0.12),rgba(46,127,255,0.05))] p-4">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-200"><Sparkles size={13} /> AI assignment setup</div>
        <p className="mt-2 text-[12px] leading-5 text-[#B8C7DB]">Choose one or more registered assignees, define schedule and access rules, then let AI refine the field instructions.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Assignee</span>
          <div className="rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#07111F] p-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {assignees.length ? assignees.map(assignee => (
                <span key={assignee} className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
                  {assignee}
                  <button type="button" onClick={() => toggleAssignee(assignee)} className="text-emerald-100 hover:text-white">x</button>
                </span>
              )) : <span className="text-[11px] text-[#7A94B4]">Select one or more assignees</span>}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {assignableAssignees.map(assignee => (
                <label key={assignee} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors ${assignees.includes(assignee) ? 'border-[#E11D2E]/45 bg-[#E11D2E]/10 text-red-100' : 'border-[rgba(46,127,255,0.14)] bg-[#0A1628] text-[#B8C7DB] hover:border-[#7EB8F7]/40'}`}>
                  <input type="checkbox" checked={assignees.includes(assignee)} onChange={() => toggleAssignee(assignee)} className="accent-[#E11D2E]" />
                  {assignee}
                </label>
              ))}
            </div>
          </div>
        </div>

        <label className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Site / Scope</span>
          <select className={`${fieldInput} w-full`} value={site} onChange={event => setSite(event.target.value)}>
            {scopeOptions.map(option => <option key={option}>{option}</option>)}
          </select>
        </label>
        <div className="relative space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Asset</span>
          <button
            type="button"
            onClick={() => setAssetSelectOpen(current => !current)}
            className="flex h-9 w-full items-center justify-between gap-3 rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 text-left text-[12px] text-[#EEF3FA] outline-none hover:border-[#7EB8F7]/45"
          >
            <span className="min-w-0 truncate">{selectedAssets.length ? selectedAssets.join(', ') : 'Select assets'}</span>
            <span className="shrink-0 text-[#7A94B4]">v</span>
          </button>
          {assetSelectOpen && (
            <div className="absolute left-0 right-0 top-[58px] z-40 max-h-56 overflow-y-auto rounded-xl border border-[rgba(46,127,255,0.24)] bg-[#07111F] p-2 shadow-2xl">
              {assetOptions.map(asset => (
                <label key={asset} className={`mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold transition last:mb-0 ${selectedAssets.includes(asset) ? 'bg-[#E11D2E]/12 text-red-100' : 'text-[#B8C7DB] hover:bg-white/5 hover:text-white'}`}>
                  <input type="checkbox" checked={selectedAssets.includes(asset)} onChange={() => toggleAsset(asset)} className="accent-[#E11D2E]" />
                  {asset}
                </label>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {selectedAssets.map(asset => (
              <span key={asset} className="rounded-full border border-[rgba(46,127,255,0.2)] bg-[#07111F] px-2 py-0.5 text-[9px] font-bold text-[#B8C7DB]">{asset}</span>
            ))}
          </div>
        </div>
        <label className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Start date</span>
          <input type="date" className={`${fieldInput} w-full`} value={startDate} onChange={event => { setStartDate(event.target.value); if (dueDate < event.target.value) setDueDate(event.target.value); }} />
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Due date</span>
          <input type="date" className={`${fieldInput} w-full`} value={dueDate} min={startDate} onChange={event => setDueDate(event.target.value)} />
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Recurrence</span>
          <select className={`${fieldInput} w-full capitalize`} value={recurrence} onChange={event => setRecurrence(event.target.value as typeof recurrence)}>
            {recurrenceOptions.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Priority</span>
          <select className={`${fieldInput} w-full`} value={priority} onChange={event => setPriority(event.target.value as SurveyPriority)}>
            {priorityOptions.map(option => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Supervisor reviewer</span>
          <select className={`${fieldInput} w-full`} value={reviewer} onChange={event => setReviewer(event.target.value)}>
            {supervisorReviewers.map(option => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">
            Instructions
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E11D2E]/25 bg-[#E11D2E]/10 px-2.5 py-1 text-[10px] font-black normal-case tracking-normal text-red-100"><Bot size={12} /> AI Copilot</span>
          </span>
          <textarea className="min-h-24 w-full rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#0A1628] px-3 py-2 text-[12px] leading-5 text-[#EEF3FA] outline-none focus:border-[#E11D2E]" value={instructions} onChange={event => setInstructions(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => generateInstructions('draft')} className="rounded-full border border-[#E11D2E]/30 bg-[#E11D2E]/10 px-3 py-1.5 text-[10px] font-bold text-red-100 hover:bg-[#E11D2E]/16">Draft with AI</button>
            <button type="button" onClick={() => generateInstructions('safety')} className="rounded-full border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-1.5 text-[10px] font-bold text-[#B8C7DB] hover:text-white">Add safety notes</button>
            <button type="button" onClick={() => generateInstructions('short')} className="rounded-full border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-1.5 text-[10px] font-bold text-[#B8C7DB] hover:text-white">Make concise</button>
          </div>
        </label>
      </div>

      <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
        <h4 className="text-sm font-bold text-[#EEF3FA]">Access control</h4>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {['Authenticated users only', 'Public link allowed', 'QR scan allowed', 'Vendor access allowed', 'Anonymous capture allowed', 'Approval required'].map(item => <Badge key={item}>{item}</Badge>)}
        </div>
      </div>

      <button onClick={() => onToast(`Survey assigned to ${assignees.length || 0} assignee${assignees.length === 1 ? '' : 's'}`, 'success')} className="w-full rounded-lg bg-[#E11D2E] px-4 py-3 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={assignees.length === 0}>Assign Survey</button>
    </div>
  );
}

function ShareSurveyPanel({ survey, onToast }: { survey: Survey; onToast: Props['onToast'] }) {
  const surveyLink = `${window.location.origin}/fieldops/survey/${survey.id}/capture`;
  const embedCode = `<iframe src="${surveyLink}" title="${survey.name}" width="100%" height="720" style="border:0;border-radius:12px;"></iframe>`;
  const [qrGenerated, setQrGenerated] = useState(true);
  const [shareDialog, setShareDialog] = useState<'qr' | 'email' | 'whatsapp' | 'embed' | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailMessage, setEmailMessage] = useState(`Please complete the ${survey.name} survey using the secure link below.`);
  const [emailSending, setEmailSending] = useState(false);
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [whatsAppMessage, setWhatsAppMessage] = useState(`FieldOps survey: ${survey.name}. Open here: ${surveyLink}`);
  const [rules, setRules] = useState<Record<string, boolean>>({
    requireLogin: true,
    anonymousSubmission: false,
    limitByGeography: true,
    expiry: true,
    maxSubmissions: true,
    allowedRoles: true,
    allowedOrganizations: true,
    allowedSites: true,
  });

  const toggleRule = (id: string) => {
    setRules(current => ({ ...current, [id]: !current[id] }));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(surveyLink);
      onToast('Survey link copied', 'success');
    } catch {
      onToast('Copy blocked by browser. Link is visible in the drawer.', 'warning');
    }
  };

  const copyText = async (text: string, success: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onToast(success, 'success');
    } catch {
      onToast('Copy blocked by browser. Content is visible in the dialog.', 'warning');
    }
  };

  const sendEmail = async () => {
    if (!emailTo.trim()) {
      onToast('Add an email recipient first', 'warning');
      return;
    }
    setEmailSending(true);
    try {
      const response = await fetch('/api/fieldops/share-survey-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo.trim(),
          surveyId: survey.id,
          surveyName: survey.name,
          surveyLink,
          message: emailMessage,
        }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Email could not be sent');
      onToast(`Survey email sent to ${emailTo}`, 'success');
      setShareDialog(null);
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Email service is not available right now', 'error');
    } finally {
      setEmailSending(false);
    }
  };

  const sendWhatsApp = () => {
    if (!whatsAppNumber.trim()) {
      onToast('Add a WhatsApp number first', 'warning');
      return;
    }
    onToast(`WhatsApp share prepared for ${whatsAppNumber}`, 'success');
    setShareDialog(null);
  };

  const downloadQr = () => {
    const svg = qrSvg(createQrMatrix(surveyLink), 512);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${survey.id}-survey-qr.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    onToast('QR code downloaded', 'success');
  };

  const shareActions: Array<{ label: string; icon: typeof QrCode; onClick: () => void }> = [
    { label: 'Generate QR Code', icon: QrCode, onClick: () => { setQrGenerated(true); setShareDialog('qr'); } },
    { label: 'Copy Link', icon: Copy, onClick: copyLink },
    { label: 'Send by Email', icon: Mail, onClick: () => setShareDialog('email') },
    { label: 'Send by WhatsApp', icon: MessageCircle, onClick: () => setShareDialog('whatsapp') },
    { label: 'Embed Link', icon: Link2, onClick: () => setShareDialog('embed') },
  ];

  const accessRules = [
    { id: 'requireLogin', label: 'Require login' },
    { id: 'anonymousSubmission', label: 'Allow anonymous submission' },
    { id: 'limitByGeography', label: 'Limit by geography' },
    { id: 'expiry', label: 'Expiry: 30 Apr 2026' },
    { id: 'maxSubmissions', label: 'Max submissions: 250' },
    { id: 'allowedRoles', label: 'Allowed roles: Engineer, Inspector, Contractor' },
    { id: 'allowedOrganizations', label: 'Allowed organizations: DevelopmentX' },
    { id: 'allowedSites', label: `Allowed sites: ${survey.siteIds[0] ?? 'Selected sites'}` },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[170px_1fr]">
        <div className="space-y-3">
          <QRPreview value={surveyLink} />
          <div className={`rounded-xl border px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest ${qrGenerated ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-amber-400/25 bg-amber-400/10 text-amber-200'}`}>
            {qrGenerated ? 'QR ready' : 'QR pending'}
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
            <p className="text-[10px] font-bold uppercase text-[#7A94B4]">Mobile survey link</p>
            <p className="mt-2 break-all font-mono text-[12px] text-[#B8C7DB]">{surveyLink}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {shareActions.map(({ label, icon: Icon, onClick }) => (
              <button key={label} onClick={onClick} className="flex items-center gap-2 rounded-lg border border-[rgba(46,127,255,0.18)] bg-[#07111F] px-3 py-2 text-[11px] font-bold text-[#B8C7DB] transition hover:border-[#E11D2E]/40 hover:bg-white/5 hover:text-white">
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-bold text-[#EEF3FA]">Access rules summary</h4>
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">{Object.values(rules).filter(Boolean).length} active</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {accessRules.map(rule => (
            <label key={rule.id} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-bold transition ${rules[rule.id] ? 'border-[rgba(46,127,255,0.24)] bg-[#112033] text-[#B8C7DB]' : 'border-slate-500/15 bg-[#07111F] text-[#5A6F8E]'}`}>
              <input type="checkbox" checked={rules[rule.id]} onChange={() => toggleRule(rule.id)} className="h-3.5 w-3.5 rounded accent-[#E11D2E]" />
              {rule.label}
            </label>
          ))}
        </div>
        {rules.limitByGeography && (
          <div className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[11px] font-bold text-emerald-300">
            <MapPin size={13} className="mr-1 inline" /> Geo-restricted - 150m radius around selected site boundary
          </div>
        )}
      </div>

      <AnimatePresence>
        {shareDialog && (
          <div className="fixed inset-0 z-[2800] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              className="w-full max-w-md rounded-2xl border border-[rgba(46,127,255,0.25)] bg-[#0A1628] shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-[rgba(46,127,255,0.14)] px-5 py-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">Share Survey</div>
                  <h4 className="mt-1 text-base font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {shareDialog === 'qr' && 'QR code'}
                    {shareDialog === 'email' && 'Send by email'}
                    {shareDialog === 'whatsapp' && 'Send by WhatsApp'}
                    {shareDialog === 'embed' && 'Embed link'}
                  </h4>
                </div>
                <button onClick={() => setShareDialog(null)} className="rounded-lg p-2 text-[#7A94B4] hover:bg-white/5 hover:text-white"><X size={17} /></button>
              </div>

              <div className="space-y-4 p-5">
                {shareDialog === 'qr' && (
                  <div className="space-y-4">
                    <div className="flex justify-center"><QRPreview value={surveyLink} /></div>
                    <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-center text-[11px] font-bold text-emerald-200">
                      QR is ready for {survey.name}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={downloadQr} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB] hover:text-white">Download QR</button>
                      <button onClick={() => { setQrGenerated(true); onToast('QR code refreshed', 'success'); }} className="rounded-lg bg-[#E11D2E] px-3 py-2 text-[11px] font-bold text-white">Regenerate</button>
                    </div>
                  </div>
                )}

                {shareDialog === 'email' && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Recipient email</span>
                      <input type="email" value={emailTo} onChange={event => setEmailTo(event.target.value)} placeholder="engineer@example.com" className={`${fieldInput} mt-1 w-full`} />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Message</span>
                      <textarea value={emailMessage} onChange={event => setEmailMessage(event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2 text-[12px] leading-5 text-[#EEF3FA] outline-none focus:border-[#E11D2E]" />
                    </label>
                    <div className="rounded-xl bg-[#07111F] p-3 font-mono text-[11px] text-[#B8C7DB]">{surveyLink}</div>
                    <button onClick={sendEmail} disabled={emailSending} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#E11D2E] text-[12px] font-bold text-white disabled:cursor-wait disabled:opacity-60"><Send size={14} /> {emailSending ? 'Sending...' : 'Send email'}</button>
                  </div>
                )}

                {shareDialog === 'whatsapp' && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">WhatsApp number</span>
                      <input value={whatsAppNumber} onChange={event => setWhatsAppNumber(event.target.value)} placeholder="+971 50 000 0000" className={`${fieldInput} mt-1 w-full`} />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">Message</span>
                      <textarea value={whatsAppMessage} onChange={event => setWhatsAppMessage(event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2 text-[12px] leading-5 text-[#EEF3FA] outline-none focus:border-[#E11D2E]" />
                    </label>
                    <button onClick={sendWhatsApp} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#E11D2E] text-[12px] font-bold text-white"><MessageCircle size={14} /> Prepare WhatsApp</button>
                  </div>
                )}

                {shareDialog === 'embed' && (
                  <div className="space-y-3">
                    <p className="text-[12px] leading-5 text-[#B8C7DB]">Use this snippet to embed the mobile survey inside an internal portal or site page.</p>
                    <textarea readOnly value={embedCode} className="min-h-28 w-full rounded-lg border border-[rgba(46,127,255,0.22)] bg-[#07111F] px-3 py-2 font-mono text-[11px] leading-5 text-[#DDE6F8] outline-none" />
                    <button onClick={() => copyText(embedCode, 'Embed code copied')} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#E11D2E] text-[12px] font-bold text-white"><Copy size={14} /> Copy embed code</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FieldOpsDashboard({ onToast }: Props) {
  const { clients: sites } = useClients();
  const [tab, setTab] = useState<Tab>('surveys');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createTemplate, setCreateTemplate] = useState<FieldOpsTemplate | null>(null);
  const [templatePreview, setTemplatePreview] = useState<FieldOpsTemplate | null>(null);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey>(surveys[0]);
  const [selectedSubmission, setSelectedSubmission] = useState<SurveySubmission>(submissions[0]);
  const [aiPrompt, setAiPrompt] = useState(aiGeneratedSurvey.prompt);
  const [aiGenerated, setAiGenerated] = useState(true);
  const generatedSurvey = useMemo(() => buildGeneratedSurveyFromPrompt(aiPrompt), [aiPrompt]);
  const [liveSubmissions, setLiveSubmissions] = useState<SurveySubmission[]>(() => getLocalFieldOpsSubmissions());

  const refreshLiveSubmissions = useCallback(async () => {
    const local = getLocalFieldOpsSubmissions();
    setLiveSubmissions(current => [...local, ...current].filter((item, index, all) => all.findIndex(candidate => candidate.id === item.id) === index));

    try {
      const response = await fetch('/api/fieldops/submissions', { cache: 'no-store' });
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return;

      const payload = await response.json() as { submissions?: SurveySubmission[] };
      if (!payload.submissions?.length) return;

      setLiveSubmissions(current => (
        [...payload.submissions!, ...getLocalFieldOpsSubmissions(), ...current]
          .filter((item, index, all) => all.findIndex(candidate => candidate.id === item.id) === index)
      ));
    } catch {
      // Local submissions keep the dashboard live when the API is not reachable.
    }
  }, []);

  const filteredSurveys = useMemo(() => {
    const lower = query.toLowerCase();
    return surveys.filter(survey => `${survey.name} ${survey.type} ${survey.assignedTo}`.toLowerCase().includes(lower));
  }, [query]);

  useEffect(() => {
    const refresh = () => { void refreshLiveSubmissions(); };
    const unsubscribe = subscribeToLocalFieldOpsSubmissions(refresh);
    window.addEventListener('focus', refresh);
    refresh();

    return () => {
      unsubscribe();
      window.removeEventListener('focus', refresh);
    };
  }, [refreshLiveSubmissions]);

  useEffect(() => {
    if (tab !== 'tracking') return undefined;
    void refreshLiveSubmissions();
    const interval = window.setInterval(() => { void refreshLiveSubmissions(); }, 5000);
    return () => window.clearInterval(interval);
  }, [refreshLiveSubmissions, tab]);

  const allSubmissions = useMemo(
    () => [...liveSubmissions, ...submissions].filter((item, index, all) => all.findIndex(candidate => candidate.id === item.id) === index),
    [liveSubmissions],
  );
  const trackingRows = useMemo(() => {
    const rowsFromSubmissions = allSubmissions.map(submission => {
      const assignment = assignments.find(item => item.id === submission.assignmentId) ?? assignments.find(item => item.surveyId === submission.surveyId);
      const survey = surveys.find(item => item.id === submission.surveyId) ?? surveys.find(item => item.id === assignment?.surveyId) ?? surveys[0];
      return {
        id: `submission-${submission.id}`,
        assignment,
        survey,
        submission,
        isLive: liveSubmissions.some(item => item.id === submission.id),
        status: submission.status,
        progress: 100,
      };
    });
    const submittedAssignmentIds = new Set(allSubmissions.map(item => item.assignmentId));
    const rowsFromAssignments = assignments
      .filter(assignment => !submittedAssignmentIds.has(assignment.id))
      .map(assignment => ({
        id: `assignment-${assignment.id}`,
        assignment,
        survey: surveys.find(item => item.id === assignment.surveyId) ?? surveys[0],
        submission: undefined,
        isLive: false,
        status: assignment.status,
        progress: assignment.progress,
      }));
    return [...rowsFromSubmissions, ...rowsFromAssignments];
  }, [allSubmissions, liveSubmissions]);

  const activeSurveyCount = surveys.filter(survey => survey.status !== 'Archived').length;
  const selectedSurveyTemplate = useMemo(() => surveyToTemplate(selectedSurvey), [selectedSurvey]);
  const selectedSurveySections = useMemo(() => surveyToEditableSections(selectedSurvey), [selectedSurvey]);

  const stats = [
    { label: 'Active Surveys', value: activeSurveyCount, icon: ClipboardCheck, tone: 'text-emerald-300' },
    { label: 'In Progress', value: assignments.filter(a => a.status === 'In Progress').length, icon: RadioTower, tone: 'text-blue-300' },
    { label: 'Completed', value: assignments.filter(a => a.status === 'Completed').length, icon: CheckCircle2, tone: 'text-[#E11D2E]' },
    { label: 'Overdue', value: assignments.filter(a => a.status === 'Overdue').length, icon: AlertTriangle, tone: 'text-amber-300' },
    { label: 'Open Issues Detected', value: allSubmissions.reduce((sum, sub) => sum + sub.issuesDetected, 0), icon: ShieldCheck, tone: 'text-red-300' },
  ];

  const openDrawer = (next: Drawer, survey = selectedSurvey) => {
    setSelectedSurvey(survey);
    setDrawer(next);
  };

  const openCreateSurvey = (template?: FieldOpsTemplate) => {
    setCreateTemplate(template ?? null);
    setTemplatePreview(null);
    setCreateOpen(true);
  };

  const closeCreateSurvey = () => {
    setCreateOpen(false);
    setCreateTemplate(null);
  };

  const actionButton = (label: string, next: Drawer, survey: Survey, icon: ComponentType<{ size?: number; className?: string }>, disabled = false) => (
    <ActionIconButton label={label} icon={icon} disabled={disabled} onClick={() => openDrawer(next, survey)} />
  );

  return (
    <div className="flex h-full flex-col overflow-hidden text-[#EEF3FA]">
      <div className="flex-shrink-0 border-b border-[rgba(46,127,255,0.12)] px-6 py-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#E11D2E]">
              <Smartphone size={13} />
              Superadmin Module
            </div>
            <h1 className="text-[22px] font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>FieldOps</h1>
            <p className="mt-1 text-[12px] text-[#7A94B4]">Create, assign, and track mobile field surveys and inspections.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => openCreateSurvey()} className="flex h-9 items-center gap-2 rounded-lg bg-[#E11D2E] px-4 text-[12px] font-bold text-white shadow-lg shadow-red-950/25">
              <Plus size={15} /> Create Survey
            </button>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-5">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#7A94B4]">{stat.label}</span>
                  <Icon size={16} className={stat.tone} />
                </div>
                <div className={`mt-3 text-3xl font-black ${stat.tone}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stat.value}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex gap-1 overflow-x-auto border-b border-[rgba(46,127,255,0.12)] pb-0">
          {tabs.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-t-lg border-b-2 px-4 py-2 text-[12px] font-bold transition-colors ${tab === item.id ? 'border-[#E11D2E] bg-[#E11D2E]/8 text-red-200' : 'border-transparent text-[#7A94B4] hover:text-[#EEF3FA]'}`}>
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'surveys' && (
          <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)]">
            <div className="flex flex-col gap-3 border-b border-[rgba(46,127,255,0.12)] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Active Surveys</h2>
                <p className="mt-1 text-[11px] text-[#7A94B4]">{activeSurveyCount} active surveys ready to design, assign, share, duplicate, archive, and track.</p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A94B4]" />
                  <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search surveys" className={`${fieldInput} w-64 pl-9`} />
                </div>
                <button className="flex h-9 items-center gap-2 rounded-lg border border-[rgba(46,127,255,0.22)] px-3 text-[11px] font-bold text-[#B8C7DB] hover:bg-white/5"><Filter size={14} /> Filters</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left">
                <thead className="text-[10px] uppercase tracking-wide text-[#7A94B4]">
                  <tr>{['Survey Name', 'Type', 'Status', 'Assigned To', 'Capture Method', 'Responses', 'Last Updated', 'Actions'].map(head => <th key={head} className="px-4 py-3 font-bold">{head}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[rgba(46,127,255,0.08)]">
                  {filteredSurveys.map(survey => (
                    <tr key={survey.id} className="text-[12px] hover:bg-white/[0.025]">
                      <td className="px-4 py-3">
                        <button onClick={() => openDrawer('detail', survey)} className="text-left">
                          <span className="block font-bold text-[#EEF3FA]">{survey.name}</span>
                          <span className="text-[10px] text-[#7A94B4]">{survey.siteIds.join(', ')}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[#B8C7DB]">{survey.type}</td>
                      <td className="px-4 py-3"><Badge tone={survey.status}>{survey.status}</Badge></td>
                      <td className="px-4 py-3 text-[#B8C7DB]">{survey.assignedTo}</td>
                      <td className="px-4 py-3 text-[#B8C7DB]">{survey.captureMethod}</td>
                      <td className="px-4 py-3 font-mono font-bold">{survey.responses}</td>
                      <td className="px-4 py-3 text-[#7A94B4]">{survey.lastUpdated}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {actionButton('Edit', 'design', survey, PencilRuler, survey.status === 'Completed')}
                          {actionButton('Assign', 'assign', survey, Users)}
                          {actionButton('Share', 'share', survey, Link2)}
                          <ActionIconButton label="Track" icon={RadioTower} onClick={() => setTab('tracking')} />
                          <ActionIconButton label="Duplicate" icon={Copy} onClick={() => onToast('Survey duplicated as draft', 'success')} />
                          <ActionIconButton label="Archive" icon={Archive} danger onClick={() => onToast('Archive action queued', 'info')} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'assignments' && (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
              <h2 className="text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Assignment control</h2>
              <div className="mt-4 grid gap-3">
                {assignments.map(assignment => {
                  const survey = surveys.find(item => item.id === assignment.surveyId) ?? surveys[0];
                  return (
                    <div key={assignment.id} className="grid gap-3 rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4 lg:grid-cols-[1.3fr_1fr_0.8fr_auto] lg:items-center">
                      <div>
                        <p className="text-[13px] font-bold text-[#EEF3FA]">{survey.name}</p>
                        <p className="mt-1 text-[11px] text-[#7A94B4]">{assignment.assignee} - {assignment.role}</p>
                      </div>
                      <div className="text-[11px] text-[#B8C7DB]">{assignment.site}<br />Due {assignment.dueDate}</div>
                      <div>
                        <Badge tone={assignment.status}>{assignment.status}</Badge>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#112040]"><div className="h-full rounded-full bg-[#E11D2E]" style={{ width: `${assignment.progress}%` }} /></div>
                      </div>
                      <button onClick={() => openDrawer('assign', survey)} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB] hover:bg-white/5">Edit</button>
                    </div>
                  );
                })}
              </div>
            </div>
            <MobilePreview survey={selectedSurvey} />
          </div>
        )}

        {tab === 'tracking' && (
          <div className="mt-4 rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Live submissions</h2>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">{liveSubmissions.length} live</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-[12px]">
                <thead className="text-[10px] uppercase tracking-wide text-[#7A94B4]">
                  <tr>{['Survey', 'Assignee', 'Site', 'Status', 'Progress', 'Submitted At', 'Issues', 'Evidence', 'Reviewer'].map(head => <th key={head} className="px-3 py-2">{head}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[rgba(46,127,255,0.08)]">
                  {trackingRows.map(row => {
                    const { assignment, survey, submission, isLive } = row;
                    const openSubmission = () => {
                      if (!submission) return;
                      setSelectedSubmission(submission);
                      setDrawer('submission');
                    };
                    return (
                      <tr
                        key={row.id}
                        role={submission ? 'button' : undefined}
                        tabIndex={submission ? 0 : undefined}
                        onClick={openSubmission}
                        onKeyDown={event => {
                          if (!submission) return;
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openSubmission();
                          }
                        }}
                        className={`${submission ? 'cursor-pointer hover:bg-white/[0.045] focus-visible:bg-white/[0.045] focus-visible:outline-none' : 'hover:bg-white/[0.025]'} transition-colors`}
                      >
                        <td className="px-3 py-3 font-bold text-[#EEF3FA]">
                          {survey.name}
                          {isLive && <span className="ml-2 rounded-full bg-emerald-400/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-200">Live</span>}
                        </td>
                        <td className="px-3 py-3 text-[#B8C7DB]">{assignment?.assignee ?? submission?.submittedBy ?? 'Field user'}</td>
                        <td className="px-3 py-3 text-[#B8C7DB]">{assignment?.site ?? submission?.gpsLocation.site ?? survey.siteIds[0]}</td>
                        <td className="px-3 py-3"><Badge tone={row.status}>{row.status}</Badge></td>
                        <td className="px-3 py-3"><div className="h-1.5 w-24 rounded-full bg-[#0A1628]"><div className="h-full rounded-full bg-[#E11D2E]" style={{ width: `${row.progress}%` }} /></div></td>
                        <td className="px-3 py-3 text-[#7A94B4]">{submission?.submittedAt ?? 'Not submitted'}</td>
                        <td className="px-3 py-3 font-bold text-red-200">{submission?.issuesDetected ?? 0}</td>
                        <td className="px-3 py-3 text-emerald-300">{submission ? `${submission.evidence.length} files` : '-'}</td>
                        <td className="px-3 py-3">
                          {submission ? (
                            <button onClick={event => { event.stopPropagation(); openSubmission(); }} className="font-bold text-[#7EB8F7]">{submission.reviewer}</button>
                          ) : (
                            <span className="text-[#7A94B4]">Awaiting submission</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'templates' && (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {templates.map(template => {
              const normalized = normalizeTemplate(template);
              return (
                <div key={template.name} className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E11D2E]/12 text-red-200"><ClipboardCheck size={18} /></div>
                  <h3 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{template.name}</h3>
                  <p className="mt-1 text-[11px] text-[#7A94B4]">{template.type}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-[#B8C7DB]">
                    <span>{template.duration}</span>
                    <span>{template.questions} questions</span>
                    <span className="col-span-2">{template.evidence}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => setTemplatePreview(normalized)} className="rounded-lg border border-[rgba(46,127,255,0.24)] bg-[#07111F] px-3 py-2 text-[11px] font-bold text-[#B8C7DB] hover:border-[#7EB8F7]/50 hover:text-white">
                      <Eye size={13} className="mr-1 inline" />
                      View
                    </button>
                    <button onClick={() => openCreateSurvey(normalized)} className="rounded-lg border border-[#E11D2E]/35 bg-[#E11D2E]/10 px-3 py-2 text-[11px] font-bold text-red-200 hover:bg-[#E11D2E]/16">Use template</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'ai' && (
          <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-xl border border-[#E11D2E]/30 bg-[linear-gradient(135deg,rgba(225,29,46,0.10),rgba(17,32,64,0.86))] p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-red-200"><Bot size={15} /> AI Assist Survey Design</div>
              <textarea value={aiPrompt} onChange={event => { setAiPrompt(event.target.value); setAiGenerated(false); }} className="min-h-28 w-full rounded-xl border border-[rgba(46,127,255,0.22)] bg-[#0A1628] p-3 text-[12px] leading-5 text-[#EEF3FA] outline-none focus:border-[#E11D2E]" />
              <div className="mt-3 flex gap-2">
                <button onClick={() => setAiGenerated(true)} className="rounded-lg bg-[#E11D2E] px-4 py-2 text-[12px] font-bold text-white">Generate</button>
                <button onClick={() => { setAiPrompt('Create a site safety inspection for residential tower common areas'); setAiGenerated(false); }} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-4 py-2 text-[12px] font-bold text-[#B8C7DB]">Edit Prompt</button>
              </div>
            </div>
            {aiGenerated && (
              <div className="rounded-xl border border-[rgba(46,127,255,0.18)] bg-[rgba(17,32,64,0.78)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Generated checklist structure</h3>
                    <p className="mt-1 text-[11px] text-[#7A94B4]">Survey: {generatedSurvey.title}</p>
                    <p className="text-[11px] text-[#7A94B4]">Frequency: {generatedSurvey.frequency}</p>
                    <p className="text-[11px] text-[#7A94B4]">Responsible role: {generatedSurvey.responsibleRole}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onToast('AI structure applied to survey canvas', 'success')} className="rounded-lg bg-[#E11D2E] px-3 py-2 text-[11px] font-bold text-white">Apply to Survey</button>
                    <button onClick={() => { setAiPrompt(current => nudgePrompt(current)); onToast('AI regenerated the checklist from your prompt', 'info'); }} className="rounded-lg border border-[rgba(46,127,255,0.22)] px-3 py-2 text-[11px] font-bold text-[#B8C7DB]">Regenerate</button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {generatedSurvey.sections.map(section => (
                    <div key={section.title} className="rounded-xl border border-[rgba(46,127,255,0.14)] bg-[#0A1628] p-4">
                      <h4 className="text-[13px] font-bold text-[#EEF3FA]">{section.title}</h4>
                      <div className="mt-3 space-y-2">
                        {section.questions.map(question => <p key={question} className="rounded-lg bg-[#112040] px-3 py-2 text-[11px] leading-4 text-[#B8C7DB]">{question}</p>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {templatePreview && (
          <SideDrawer title="Survey Template Preview" onClose={() => setTemplatePreview(null)}>
            <TemplateSurveyDetails
              template={templatePreview}
              onUseTemplate={() => openCreateSurvey(templatePreview)}
            />
          </SideDrawer>
        )}

        {createOpen && <CreateSurveyModal sites={sites} initialTemplate={createTemplate} onClose={closeCreateSurvey} onDesign={type => { closeCreateSurvey(); setSelectedSurvey({ ...selectedSurvey, type }); setDrawer('design'); }} />}

        {drawer === 'detail' && (
          <SideDrawer title={selectedSurvey.name} onClose={() => setDrawer(null)}>
            <div className="space-y-4">
              <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
                <div className="flex items-center justify-between">
                  <Badge tone={selectedSurvey.status}>{selectedSurvey.status}</Badge>
                  <span className="text-[11px] text-[#7A94B4]">Updated {selectedSurvey.lastUpdated}</span>
                </div>
                <p className="mt-3 text-[12px] leading-5 text-[#B8C7DB]">{selectedSurvey.description}</p>
              </div>
              <MobilePreview survey={selectedSurvey} />
            </div>
          </SideDrawer>
        )}

        {drawer === 'design' && (
          <div className="fixed inset-0 z-[2400] flex items-center justify-center p-3">
            <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(null)} aria-label="Close survey draft" />
            <motion.div initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }} className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[rgba(46,127,255,0.25)] bg-[#0A1628] shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-[rgba(46,127,255,0.14)] bg-[linear-gradient(135deg,rgba(225,29,46,0.14),rgba(46,127,255,0.06))] px-5 py-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#E11D2E]">Survey draft</div>
                  <h3 className="mt-1 text-lg font-black text-[#EEF3FA]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{selectedSurvey.name}</h3>
                </div>
                <button onClick={() => setDrawer(null)} className="rounded-lg p-2 text-[#7A94B4] hover:bg-white/5 hover:text-white"><X size={18} /></button>
              </div>
              <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
                <TemplateSurveyDetails
                  template={selectedSurveyTemplate}
                  initialSections={selectedSurveySections}
                  eyebrow="Survey draft"
                  actionLabel="Save Draft"
                  onUseTemplate={() => {
                    onToast('Survey draft saved', 'success');
                    setDrawer(null);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}

        {drawer === 'assign' && (
          <SideDrawer title="Assign Survey" onClose={() => setDrawer(null)}>
            <AssignSurveyPanel survey={selectedSurvey} onToast={onToast} />
          </SideDrawer>
        )}

        {drawer === 'share' && (
          <SideDrawer title="Share Survey" onClose={() => setDrawer(null)}>
            <ShareSurveyPanel survey={selectedSurvey} onToast={onToast} />
          </SideDrawer>
        )}

        {drawer === 'submission' && (
          <SideDrawer title={selectedSubmission.id} onClose={() => setDrawer(null)}>
            <div className="space-y-4">
              <div className="rounded-xl border border-[rgba(46,127,255,0.16)] bg-[#07111F] p-4">
                <div className="flex items-center justify-between"><Badge tone={selectedSubmission.status}>{selectedSubmission.status}</Badge><span className="font-mono text-[12px] text-[#B8C7DB]">Score {selectedSubmission.score}%</span></div>
                <p className="mt-3 text-[12px] text-[#7A94B4]">Submitted by {selectedSubmission.submittedBy} - {selectedSubmission.submittedAt}</p>
                <p className="mt-1 text-[12px] text-[#7A94B4]">GPS: {selectedSubmission.gpsLocation.site} ({selectedSubmission.gpsLocation.lat}, {selectedSubmission.gpsLocation.lng})</p>
              </div>
              <div className="space-y-2">
                {selectedSubmission.answers.map(answer => (
                  <div key={answer.question} className="rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F] p-3">
                    <p className="text-[11px] text-[#7A94B4]">{answer.question}</p>
                    <p className="mt-1 text-[12px] font-bold text-[#EEF3FA]">{answer.answer}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedSubmission.evidence.map(item => (
                  <div key={item.label} className="overflow-hidden rounded-lg border border-[rgba(46,127,255,0.12)] bg-[#07111F] text-[11px] text-[#B8C7DB]">
                    {item.type === 'photo' && item.previewUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(item.previewUrl, '_blank', 'noopener,noreferrer')}
                        className="block aspect-video w-full overflow-hidden bg-[#0A1628]"
                        aria-label={`View ${item.label}`}
                      >
                        <img src={item.previewUrl} alt={item.label} className="h-full w-full object-cover transition-transform hover:scale-[1.02]" />
                      </button>
                    )}
                    <div className="p-3">
                      <p className="text-[10px] font-black uppercase tracking-wide text-[#7A94B4]">{item.type}</p>
                      <p className="mt-1 leading-4 text-[#B8C7DB]">{item.label}</p>
                      {item.type === 'photo' && item.previewUrl && <p className="mt-2 text-[10px] font-bold text-[#7EB8F7]">Click photo to view full size</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onToast('Submission approved', 'success')} className="rounded-lg bg-emerald-500/90 px-3 py-2 text-[11px] font-bold text-white">Approve</button>
                <button onClick={() => onToast('Submission rejected', 'warning')} className="rounded-lg border border-amber-400/35 px-3 py-2 text-[11px] font-bold text-amber-200">Reject</button>
                <button onClick={() => onToast('Incident prefilled from survey finding', 'success')} className="rounded-lg bg-[#E11D2E] px-3 py-2 text-[11px] font-bold text-white">Create Incident from Finding</button>
              </div>
            </div>
          </SideDrawer>
        )}
      </AnimatePresence>
    </div>
  );
}
