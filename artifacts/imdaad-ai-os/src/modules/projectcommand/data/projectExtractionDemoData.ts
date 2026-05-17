export type ExtractedConfidence = 'high' | 'medium' | 'needs-confirmation';

export interface ExtractedField<T = string> {
  value: T;
  confidence: number;
  status?: ExtractedConfidence;
}

export interface ExtractedVendor {
  name: string;
  scope: string;
  confidence: number;
  needsConfirmation?: boolean;
}

export interface ExtractedSignal {
  id: string;
  title: string;
  value: string;
  count: number;
  confidence: number;
  sourceExcerpt: string;
  needsConfirmation?: boolean;
}

export interface ExtractedProjectContext {
  sourceName: string;
  sourceType: 'sample-document' | 'uploaded-file' | 'pasted-brief' | 'manual';
  signalCount: number;
  confidence: number;
  confirmationCount: number;
  property: {
    name: ExtractedField;
    type: ExtractedField;
    location: ExtractedField;
    floors: ExtractedField<number>;
    units: ExtractedField<number>;
  };
  project: {
    name: ExtractedField;
    type: ExtractedField;
    contractValue: ExtractedField<number>;
    targetHandover: ExtractedField;
    currentStage: ExtractedField;
    mainContractor: ExtractedField;
  };
  budget: {
    approvedBudget: ExtractedField<number>;
    currency: ExtractedField<'AED'>;
    contingency: ExtractedField<number>;
    trackingLevel: ExtractedField;
    reporting: ExtractedField;
  };
  workPackages: ExtractedField<string[]>;
  vendors: ExtractedVendor[];
  milestones: ExtractedField<string[]>;
  risks: ExtractedField<string[]>;
  obligations: ExtractedField<string[]>;
  evidence: ExtractedField<string[]>;
  extractionSignals: ExtractedSignal[];
}

export const sampleSobhaPilotBrief = `Letter of Award and project summary for Sobha Pilot Tower, Dubai.
Project: Main Construction of a 102-floor residential tower with 680 units.
Contract value: AED 420,000,000. Target handover: 12 August 2026.
Current stage: Superstructure and MEP coordination. Main contractor: Sobha Construction.
Packages include preliminaries, design approvals, substructure, superstructure, facade, MEP, fit-out, testing and commissioning, handover and snagging.
Specialist teams include Sobha Waterproofing, Sobha MEP Services, Sobha Facade Systems, Sobha Lift Coordination, and Sobha Fire & Life Safety.
Controls required: authority approvals, fire commissioning report, lift sign-off, vendor warranties, handover evidence pack.`;

export const sampleSobhaPilotExtraction: ExtractedProjectContext = {
  sourceName: 'Sample Sobha Pilot Tower LOA / Project Summary.pdf',
  sourceType: 'sample-document',
  signalCount: 84,
  confidence: 91,
  confirmationCount: 3,
  property: {
    name: { value: 'Sobha Pilot Tower', confidence: 98, status: 'high' },
    type: { value: 'Residential Tower', confidence: 95, status: 'high' },
    location: { value: 'Dubai', confidence: 94, status: 'high' },
    floors: { value: 102, confidence: 93, status: 'high' },
    units: { value: 680, confidence: 90, status: 'high' },
  },
  project: {
    name: { value: 'Main Construction', confidence: 96, status: 'high' },
    type: { value: 'Main Construction', confidence: 95, status: 'high' },
    contractValue: { value: 420_000_000, confidence: 94, status: 'high' },
    targetHandover: { value: '2026-08-12', confidence: 91, status: 'high' },
    currentStage: { value: 'Superstructure / MEP Coordination', confidence: 82, status: 'medium' },
    mainContractor: { value: 'Sobha Construction', confidence: 89, status: 'high' },
  },
  budget: {
    approvedBudget: { value: 420_000_000, confidence: 94, status: 'high' },
    currency: { value: 'AED', confidence: 99, status: 'high' },
    contingency: { value: 8, confidence: 81, status: 'medium' },
    trackingLevel: { value: 'Phase/package level', confidence: 88, status: 'high' },
    reporting: { value: 'Monthly', confidence: 86, status: 'high' },
  },
  workPackages: {
    value: [
      'Preliminaries',
      'Design & Approvals',
      'Substructure',
      'Superstructure',
      'Facade',
      'MEP',
      'Fit-out',
      'Testing & Commissioning',
      'Handover & Snagging',
      'Contingency',
    ],
    confidence: 92,
    status: 'high',
  },
  vendors: [
    { name: 'Sobha Construction', scope: 'Main Contractor', confidence: 91 },
    { name: 'Sobha Waterproofing', scope: 'Waterproofing', confidence: 84 },
    { name: 'Sobha MEP Services', scope: 'MEP', confidence: 82 },
    { name: 'Sobha Facade Systems', scope: 'Facade', confidence: 78, needsConfirmation: true },
    { name: 'Sobha Lift Coordination', scope: 'Elevators', confidence: 86 },
    { name: 'Sobha Fire & Life Safety', scope: 'Fire Systems', confidence: 83 },
  ],
  milestones: {
    value: ['Substructure Complete', 'Superstructure Level 50', 'Facade Release', 'MEP Rough-In Ready', 'Commissioning Ready', 'Handover Go/No-Go'],
    confidence: 89,
    status: 'high',
  },
  risks: {
    value: [
      'Facade procurement lead time',
      'Tower crane utilization bottleneck',
      'Authority approval dependency',
      'MEP coordination clashes',
      'Summer concrete productivity loss',
    ],
    confidence: 87,
    status: 'high',
  },
  obligations: {
    value: [
      'Authority approval certificates',
      'Fire system commissioning report',
      'Lift inspection sign-off',
      'Vendor warranty packs',
      'Handover evidence pack',
    ],
    confidence: 84,
    status: 'medium',
  },
  evidence: {
    value: [
      'Authority approvals',
      'Inspection reports',
      'Commissioning certificates',
      'Fire system sign-off',
      'Lift inspection sign-off',
      'Vendor warranty packs',
      'Handover evidence pack',
      'BOQ summary',
    ],
    confidence: 86,
    status: 'high',
  },
  extractionSignals: [
    { id: 'property', title: 'Property detected', value: 'Sobha Pilot Tower - Residential Tower', count: 5, confidence: 96, sourceExcerpt: 'Sobha Pilot Tower, Dubai - 102-floor residential tower with 680 units.' },
    { id: 'project', title: 'Project detected', value: 'Main Construction', count: 6, confidence: 94, sourceExcerpt: 'Project: Main Construction. Current stage: Superstructure and MEP coordination.' },
    { id: 'budget', title: 'Budget detected', value: 'AED 420M contract value', count: 5, confidence: 94, sourceExcerpt: 'Contract value: AED 420,000,000. Reporting: monthly cost control.' },
    { id: 'vendors', title: 'Teams detected', value: '6 delivery parties mapped', count: 6, confidence: 84, sourceExcerpt: 'Specialist teams include Sobha Waterproofing, Sobha MEP Services, Sobha Facade Systems...', needsConfirmation: true },
    { id: 'work-packages', title: 'Work packages detected', value: '10 packages including contingency', count: 10, confidence: 92, sourceExcerpt: 'Packages include preliminaries, design approvals, substructure, superstructure, facade, MEP...' },
    { id: 'milestones', title: 'Milestones detected', value: '6 control milestones', count: 6, confidence: 89, sourceExcerpt: 'Target handover: 12 August 2026. Superstructure Level 50 and Commissioning Ready gates inferred.' },
    { id: 'risks', title: 'Risks detected', value: '5 early project risks', count: 5, confidence: 87, sourceExcerpt: 'AI flagged lead-time, crane utilization, authority approval, MEP clashes, and summer productivity.' },
    { id: 'obligations', title: 'Obligations detected', value: '5 obligations and evidence duties', count: 5, confidence: 84, sourceExcerpt: 'Controls required: authority approvals, fire commissioning report, lift sign-off, warranties...', needsConfirmation: true },
    { id: 'evidence', title: 'Evidence requirements detected', value: '8 proof requirements', count: 8, confidence: 86, sourceExcerpt: 'Evidence pack needs approvals, inspection reports, certificates, sign-offs, warranties, and BOQ summary.', needsConfirmation: true },
  ],
};
