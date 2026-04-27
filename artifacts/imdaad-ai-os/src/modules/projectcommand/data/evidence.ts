export type EvidenceStatus = 'Current' | 'Superseded' | 'Expired';
export type EvidenceType = 'Certificate' | 'Report';

export interface EvidenceDocument {
  code: string;
  title: string;
  type: EvidenceType;
  project: string;
  stage: string;
  status: EvidenceStatus;
  uploadDate: string;
  uploader: string;
  version: string;
  linkedObligation: string;
  fileHash: string;
  blockchainVerified: boolean;
}

export const evidenceDocuments: EvidenceDocument[] = [
  {
    code: 'DOC-2024-1247',
    title: 'RERA Warranty Registration Receipt',
    type: 'Certificate',
    project: 'Cocoon Residences A',
    stage: 'Post-Sale Warranty & Defects Liability',
    status: 'Current',
    uploadDate: '2024-07-15',
    uploader: 'Lisa Wang',
    version: 'v1',
    linkedObligation: 'OBL-003',
    fileHash: 'SHA256:a3b2c1f9e8d7440a',
    blockchainVerified: true,
  },
  {
    code: 'INS-2025-0089',
    title: 'Pre-Handover Inspection Report - Tower A Levels 1-10',
    type: 'Report',
    project: 'Riverside Towers',
    stage: 'Commissioning & Handover',
    status: 'Current',
    uploadDate: '2025-01-20',
    uploader: 'Mike Rodriguez',
    version: 'v2',
    linkedObligation: 'OBL-014',
    fileHash: 'SHA256:f7a910be44c2d81b',
    blockchainVerified: true,
  },
  {
    code: 'CERT-FLS-2024-112',
    title: 'Fire Alarm System Installation Certificate (Expired)',
    type: 'Certificate',
    project: 'Marina Vista',
    stage: 'Commissioning & Handover',
    status: 'Expired',
    uploadDate: '2024-12-15',
    uploader: 'Sarah Chen',
    version: 'v1',
    linkedObligation: 'OBL-001',
    fileHash: 'SHA256:9c21d0f7aa93b04e',
    blockchainVerified: false,
  },
];

export const evidenceProjectBuckets = ['Riverside', 'Marina', 'Old', 'Cocoon'];
