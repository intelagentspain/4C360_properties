export type Risk = {
  id: string;
  title: string;
  category: 'programme' | 'cost' | 'quality' | 'safety' | 'legal' | 'external';
  probability: number;
  impact: number;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'mitigating' | 'resolved' | 'closed';
  owner: string;
  mitigation: string;
  aiEarlyWarning?: string;
};

export const risks: Risk[] = [
  { id: 'r01', title: 'Waterproofing rework - basement levels', category: 'programme', probability: 5, impact: 5, score: 25, severity: 'critical', status: 'open', owner: 'PM Team', mitigation: 'Mobilise second crew, issue contract instruction by 29 Jul', aiEarlyWarning: 'Pattern detected: 3 weeks of accelerating defect reports at B1-B3. Similar pattern preceded a 6-week delay on Gemz project.' },
  { id: 'r02', title: 'Concrete supply chain constraint Q3', category: 'cost', probability: 4, impact: 4, score: 16, severity: 'high', status: 'mitigating', owner: 'Procurement', mitigation: 'Pre-order Q3 concrete requirement by 5 Aug, lock pricing', aiEarlyWarning: 'Industry data shows Gulf concrete prices up 12% since June. Two regional suppliers have reduced delivery windows.' },
  { id: 'r03', title: 'MEP coordination - 14 unresolved clashes L10-L12', category: 'quality', probability: 4, impact: 3, score: 12, severity: 'high', status: 'open', owner: 'Design Team', mitigation: 'Emergency coordination meeting scheduled 30 Jul. Voltas MEP to issue resolved model by 3 Aug.' },
  { id: 'r04', title: 'Environment NOC expiry - 42 days remaining', category: 'legal', probability: 3, impact: 4, score: 12, severity: 'high', status: 'open', owner: 'Legal', mitigation: 'Submit renewal application by 2 Aug. Engage consultant to expedite.' },
  { id: 'r05', title: 'Arabian Waterproofing performance decline', category: 'quality', probability: 4, impact: 3, score: 12, severity: 'high', status: 'open', owner: 'Site Manager', mitigation: 'Issue performance notice. Identify backup subcontractor.' },
  { id: 'r06', title: 'Design variation - lobby revision L01', category: 'cost', probability: 3, impact: 3, score: 9, severity: 'medium', status: 'mitigating', owner: 'Design Lead', mitigation: 'Cost impact assessment in progress. VO to be issued by 1 Aug.' },
  { id: 'r07', title: 'Facade procurement lead time', category: 'programme', probability: 3, impact: 3, score: 9, severity: 'medium', status: 'open', owner: 'Procurement', mitigation: 'Emirates Glass to confirm order within 2 weeks.' },
  { id: 'r08', title: 'Piling vibration - neighbouring site complaint', category: 'external', probability: 2, impact: 3, score: 6, severity: 'medium', status: 'mitigating', owner: 'HSE Manager', mitigation: 'Monitoring sensors installed. Limit works to 08:00-18:00.' },
  { id: 'r09', title: 'Labour shortfall - Ramadan period', category: 'programme', probability: 2, impact: 2, score: 4, severity: 'low', status: 'resolved', owner: 'Site Manager', mitigation: 'Additional labour hired. Programme adjusted.' },
  { id: 'r10', title: 'RFI backlog - structural drawings', category: 'quality', probability: 2, impact: 2, score: 4, severity: 'low', status: 'open', owner: 'James M.', mitigation: 'Batch RFI response requested from design consultant.' },
  { id: 'r11', title: 'Crane capacity - peak concurrent lifts', category: 'safety', probability: 2, impact: 2, score: 4, severity: 'low', status: 'open', owner: 'HSE Manager', mitigation: 'Lift scheduling matrix to be submitted by Al Habtoor.' },
  { id: 'r12', title: 'Temporary works design - long approval', category: 'programme', probability: 1, impact: 2, score: 2, severity: 'low', status: 'resolved', owner: 'PM Team', mitigation: 'Approved 15 Jul 2024.' },
];
