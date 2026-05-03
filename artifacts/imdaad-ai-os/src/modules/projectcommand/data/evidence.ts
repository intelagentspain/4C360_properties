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
  preview: {
    documentNo: string;
    issuer: string;
    pages: number;
    summary: string;
    keyFields: { label: string; value: string }[];
    sections: { title: string; lines: string[] }[];
    signatory: string;
  };
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
    preview: {
      documentNo: 'RERA-WR-COC-A-2024-0715',
      issuer: 'Dubai Land Department / RERA',
      pages: 3,
      summary: 'Receipt confirming warranty registration for Cocoon Residences A under the post-sale defects liability obligation.',
      keyFields: [
        { label: 'Registration date', value: '15 Jul 2024' },
        { label: 'Warranty period', value: '12 months' },
        { label: 'Units covered', value: 'Tower A common areas + sold units' },
        { label: 'Obligation', value: 'OBL-003' },
      ],
      sections: [
        { title: 'Registration Confirmation', lines: ['Warranty registration accepted by RERA.', 'Developer representative details verified.', 'Site reference matched against master community record.'] },
        { title: 'Evidence Pack', lines: ['Receipt ID, payment confirmation, and submitted warranty schedule are attached.', 'No open RERA exceptions at upload time.'] },
      ],
      signatory: 'Lisa Wang - Compliance Manager',
    },
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
    preview: {
      documentNo: 'INS-RIV-A-L01-L10-2025-0089',
      issuer: '4C360 FieldOps / Handover Team',
      pages: 18,
      summary: 'Pre-handover inspection report covering Tower A levels 1-10 with defect closure evidence and reviewer notes.',
      keyFields: [
        { label: 'Inspection date', value: '20 Jan 2025' },
        { label: 'Areas inspected', value: 'Levels 1-10' },
        { label: 'Open findings', value: '7 minor / 1 major' },
        { label: 'Reviewer', value: 'Mike Rodriguez' },
      ],
      sections: [
        { title: 'Inspection Scope', lines: ['Apartment corridors, service risers, lift lobbies, and fire escape routes sampled.', 'Inspection aligned to commissioning and handover readiness checklist.'] },
        { title: 'Findings Snapshot', lines: ['Paint touch-ups required in three common corridors.', 'One fire door closer requires replacement before final handover.', 'Photo evidence captured for all non-conformities.'] },
      ],
      signatory: 'Mike Rodriguez - Handover Lead',
    },
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
    preview: {
      documentNo: 'CERT-FLS-MV-2024-112',
      issuer: 'Dubai Civil Defence',
      pages: 5,
      summary: 'Fire alarm installation certificate for Marina Vista. The certificate is expired and requires renewal evidence.',
      keyFields: [
        { label: 'Certificate date', value: '15 Dec 2024' },
        { label: 'Expiry status', value: 'Expired' },
        { label: 'System scope', value: 'Fire alarm panels + common area devices' },
        { label: 'Linked risk', value: 'Fire Safety Compliance Breach' },
      ],
      sections: [
        { title: 'Installation Certification', lines: ['System installation completed by approved contractor.', 'Device loop test records were submitted with certificate.'] },
        { title: 'Renewal Requirement', lines: ['Certificate has expired and must be replaced before occupation approval.', 'Blockchain verification is pending because the current file is not the latest certified version.'] },
      ],
      signatory: 'Sarah Chen - Fire Safety Coordinator',
    },
  },
];

export const evidenceProjectBuckets = ['Riverside', 'Marina', 'Old', 'Cocoon'];
