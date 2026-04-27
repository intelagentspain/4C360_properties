export const aiContent = {
  healthScore: {
    score: 74,
    status: 'good' as const,
    topThreat: 'Waterproofing rework on basement levels is consuming 3 weeks of float. If unresolved by 15 Aug, Superstructure completion shifts to Q4 and handover is at risk.',
    recommendedAction: 'Issue instruction to Arabian Waterproofing to mobilise a second crew by 29 Jul. Request revised programme from Al Habtoor by 1 Aug.',
    scoreBreakdown: {
      programme: 71,
      cost: 68,
      quality: 78,
      risk: 82,
      contractor: 74,
    },
    forecast30d: {
      completion: 52,
      spend: 218,
      newRisks: 3,
      sparkline: [43, 44.5, 46, 47.2, 48.5, 49.6, 50.4, 51.2, 51.9, 52],
    },
  },
  topDecisions: [
    { rank: 1, title: 'Mobilise second waterproofing crew', impact: 'Recovers 18 days of schedule float and avoids programme re-baseline', urgency: 'critical', deadline: '29 Jul 2024' },
    { rank: 2, title: 'Approve MEP shop drawings by 1 Aug', impact: 'Unlocks 3 parallel MEP activities and keeps critical path intact', urgency: 'high', deadline: '1 Aug 2024' },
    { rank: 3, title: 'Issue concrete variation instruction before Level 16', impact: 'Prevents cost lock-in on VO #22, estimated AED 1.2M exposure if delayed', urgency: 'high', deadline: '5 Aug 2024' },
    { rank: 4, title: 'Pre-order Q3 concrete requirement', impact: 'Locks current pricing before projected 12% Q3 price increase', urgency: 'medium', deadline: '10 Aug 2024' },
    { rank: 5, title: 'Renew Environment NOC', impact: 'Avoids project stop notice from municipality, expiry in 42 days', urgency: 'medium', deadline: '2 Aug 2024' },
  ],
  programmeInsights: {
    delayProbabilities: {
      design: 2,
      enabling: 0,
      substructure: 28,
      superstructure: 42,
      mep: 55,
      fitout: 61,
      handover: 38,
    },
    criticalPathNarrative: 'The critical path runs through Substructure, Superstructure, MEP, Fit-out and Handover. The waterproofing delay in Substructure is the single biggest programme risk because it can cascade into MEP and Fit-out.',
    baselineVariance: {
      substructure: -8,
      superstructure: -3,
      mep: 0,
      fitout: 0,
    },
    weatherRisk: [
      { month: 'Aug', risk: 'high', note: 'Peak heat: productivity -15%, concrete placement restricted 11:00-15:00' },
      { month: 'Sep', risk: 'high', note: 'Peak heat continues' },
      { month: 'Oct', risk: 'medium', note: 'Cooling but sandstorm season begins' },
      { month: 'Nov', risk: 'low', note: 'Optimal working conditions' },
    ],
    rescheduleSuggestion: 'If basement waterproofing is resolved by 15 Aug, the programme can be recovered to within 3 days of baseline by accelerating concrete pours on Levels 13-16. Estimated additional cost: AED 280,000.',
  },
  costInsights: {
    narrative: 'The project is tracking 6.4% over the original contract value. The overrun is driven primarily by basement waterproofing rework, concrete price escalation, and the pending lobby variation. At current CPI of 0.91, the estimate at completion is AED 298M against a contract value of AED 280M.',
    eacConfidence: {
      p10: 288,
      p50: 294,
      p90: 308,
    },
    topCostDrivers: [
      { item: 'Basement waterproofing rework', value: 4.2, status: 'confirmed' },
      { item: 'Concrete price escalation', value: 3.8, status: 'unabsorbed' },
      { item: 'Lobby design variation VO-18', value: 2.1, status: 'pending' },
      { item: 'MEP coordination delays', value: 1.8, status: 'at-risk' },
      { item: 'Overtime - accelerated programme', value: 1.4, status: 'forecast' },
    ],
    changeOrders: [
      { id: 'VO-18', title: 'Lobby redesign - L01', value: 2_100_000, status: 'pending' },
      { id: 'VO-19', title: 'Structural upgrade - column C14', value: 840_000, status: 'approved' },
      { id: 'VO-20', title: 'MEP rerouting - L10-L12', value: 620_000, status: 'pending' },
      { id: 'VO-21', title: 'Waterproofing spec upgrade basement', value: 1_400_000, status: 'approved' },
      { id: 'VO-22', title: 'Concrete grade change - transfer slab', value: 380_000, status: 'pending' },
    ],
    cashflowForecast: {
      labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan-25', 'Feb', 'Mar', 'Apr'],
      income: [24, 22, 18, 18, 16, 14, 12, 10, 8],
      outflow: [28, 26, 22, 20, 18, 16, 14, 10, 6],
    },
  },
  riskInsights: {
    earlyWarnings: [
      'Waterproofing defect rate has increased 340% over 3 weeks, matching a pre-failure signature seen on 2 previous Danube projects.',
      'Concrete procurement lead times in Dubai have extended from 3 days to 8 days. Two suppliers have capped weekly volumes.',
      'MEP clash rate on floors 10-12 is 3x the project average, suggesting coordination breakdown rather than isolated issues.',
    ],
    monteCarlo: {
      bins: [
        { label: 'Apr-25', probability: 8 },
        { label: 'May-25', probability: 18 },
        { label: 'Jun-25', probability: 32 },
        { label: 'Jul-25', probability: 22 },
        { label: 'Aug-25', probability: 12 },
        { label: 'Sep-25', probability: 6 },
        { label: 'Oct-25+', probability: 2 },
      ],
      p50: 'Jun-25',
      p80: 'Aug-25',
    },
    riskTrend: {
      labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul'],
      critical: [0, 1, 1, 1, 1],
      high: [2, 3, 4, 5, 5],
      medium: [4, 4, 4, 5, 5],
      low: [3, 3, 4, 3, 4],
    },
  },
  scenarios: {
    optimistic: {
      label: 'Optimistic',
      probability: 18,
      completionDate: '2025-04-28',
      finalCost: 285_000_000,
      assumptions: ['Waterproofing resolved and signed off by 10 Aug', 'MEP clashes resolved by 5 Aug', 'Concrete prices stabilise', 'Weather losses offset by weekend shifts'],
      programmeSlip: 0,
    },
    base: {
      label: 'Base Case',
      probability: 52,
      completionDate: '2025-06-18',
      finalCost: 294_000_000,
      assumptions: ['Waterproofing resolved by 22 Aug', 'MEP clashes cleared by 12 Aug', 'Concrete price increase of 8% absorbed in Q3', 'VO-18 approved at AED 2.1M'],
      programmeSlip: 49,
    },
    pessimistic: {
      label: 'Pessimistic',
      probability: 30,
      completionDate: '2025-09-14',
      finalCost: 308_000_000,
      assumptions: ['Waterproofing requires re-design', 'MEP coordination breakdown', 'Concrete supply chain disruption Q3-Q4', 'Unidentified variations consume contingency'],
      programmeSlip: 137,
    },
  },
  askAI: {
    queries: [
      {
        question: 'What is the biggest risk to our handover date?',
        answer: 'The waterproofing rework on basement levels B1-B3 is the most significant risk to handover. It currently sits on the critical path with only 21 days of float remaining. If sign-off is not achieved by 15 Aug, the Superstructure phase cannot complete on schedule, which cascades into MEP, Fit-out and handover. In the base case this creates a 49-day handover slip from 30 Apr to 18 Jun 2025.',
        sources: ['Programme Rev 3', 'Risk Register', 'Waterproofing Inspection Report #44'],
      },
      {
        question: 'How much will this project cost at completion?',
        answer: 'At current performance, CPI 0.91, the estimate at completion is AED 294M in the base case, 5% above the original contract value of AED 280M. The overrun is driven by basement waterproofing rework, concrete price escalation and the pending lobby variation VO-18. In the pessimistic scenario, EAC rises to AED 308M.',
        sources: ['EVM Analysis Jul 2024', 'Cost Report #7', 'Variation Log'],
      },
      {
        question: 'What would happen if the MEP clashes take another 3 weeks to resolve?',
        answer: 'A further 3-week delay resolving MEP coordination clashes on Levels 10-12 would push the MEP rough-in start from 15 Aug to roughly 5 Sep. That compresses the MEP programme by 3 weeks and moves base-case handover from 18 Jun to approximately 8 Jul 2025. The acceleration cost would be about AED 1.6M.',
        sources: ['MEP Coordination Report', 'Programme Rev 3', 'Al Habtoor Programme Assessment'],
      },
    ],
  },
};

export type ScenarioKey = keyof typeof aiContent.scenarios;
