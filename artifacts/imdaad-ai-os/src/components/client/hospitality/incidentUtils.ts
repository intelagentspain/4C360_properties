const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

export interface AiAnalysis {
  title: string;
  description: string;
  category: string;
  subCategory: string;
  identifiedAsset: string;
  observations: string[];
  recommendedAction: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
}

const ISSUE_POOL: AiAnalysis[] = [
  {
    title: 'HVAC Cooling Failure',
    description: 'Air conditioning unit appears non-functional. Visible oil staining on the evaporator coil suggests a refrigerant leak at a brazed joint. If left unaddressed, cooling capacity will degrade and compressor damage is probable.',
    category: 'HVAC',
    subCategory: 'Cooling Failure',
    identifiedAsset: 'Fan Coil Unit',
    observations: [
      'Unit running but not producing cool air',
      'Oil staining visible around evaporator coil outlet',
      'Condensate tray shows evidence of intermittent overflow',
    ],
    recommendedAction: 'Assign a certified HVAC technician to perform a leak test using an electronic detector and recharge refrigerant to manufacturer specification after repair.',
    priority: 'high',
    confidence: 91,
  },
  {
    title: 'Water Leak — Pipe Joint',
    description: 'Active water leak detected at a pipe joint or fixture, with visible moisture and staining on surrounding surfaces. The leak appears to originate from a corroded threaded coupling. Continued seepage may cause structural dampness and damage to electrical conduits.',
    category: 'Plumbing',
    subCategory: 'Water Leak',
    identifiedAsset: 'Supply Pipe Coupling',
    observations: [
      'Active drip at threaded coupling on supply line',
      'Rust streaking below joint indicates long-term slow leak',
      'Adjacent wall surface shows damp patch approximately 0.3 m²',
    ],
    recommendedAction: 'Isolate the section via zone valve and assign a plumber to replace the affected coupling. Inspect adjacent insulation and finishes for water damage.',
    priority: 'medium',
    confidence: 85,
  },
  {
    title: 'Lighting Fixture Failure',
    description: 'Lighting system failure observed — fixture is not illuminating despite power being present at the circuit. Could be a blown fuse, faulty ballast, or failed LED driver module. Residents in the affected area will have reduced visibility.',
    category: 'Electrical',
    subCategory: 'Light Failure',
    identifiedAsset: 'Ceiling Light Fixture',
    observations: [
      'Fixture completely dark with no flicker or partial illumination',
      'Adjacent fixtures on same circuit are functioning normally',
      'No visible burn marks or physical damage to the fitting',
    ],
    recommendedAction: 'Assign an electrician to test the circuit breaker, replace the LED driver module, and verify the fixture is fully operational before closing.',
    priority: 'low',
    confidence: 94,
  },
  {
    title: 'Surface Wear — Paint Damage',
    description: 'Paint peeling and surface wear noted on the wall or baseboard area, consistent with moisture ingress or age-related adhesion failure. Efflorescence is visible below the affected area, suggesting water is tracking from a nearby source.',
    category: 'General Maintenance',
    subCategory: 'Surface Damage',
    identifiedAsset: 'Interior Wall / Baseboard',
    observations: [
      'Paint peeling at skirting board level over approximately 0.5 m length',
      'Efflorescence (white mineral deposits) visible on exposed plaster surface',
      'Wood baseboard shows early signs of moisture swelling',
    ],
    recommendedAction: 'Investigate the source of moisture ingress, apply damp-proof treatment to the affected area, and repaint with moisture-resistant emulsion once surface is fully dry.',
    priority: 'low',
    confidence: 78,
  },
];

export function mockAiImageAnalysis(): AiAnalysis {
  return ISSUE_POOL[Math.floor(Math.random() * ISSUE_POOL.length)];
}

export function mockVoiceAnalysis(transcript: string): AiAnalysis {
  const lower = transcript.toLowerCase();
  if (lower.includes('ac') || lower.includes('air') || lower.includes('cool') || lower.includes('hvac') || lower.includes('cold')) {
    return {
      title: 'Air Conditioning Issue',
      description: transcript.length > 10 ? transcript.slice(0, 250) : 'Resident reports air conditioning is not working correctly. Maintenance team to inspect and assess the unit.',
      category: 'HVAC',
      subCategory: 'Cooling Failure',
      identifiedAsset: 'Air Conditioning Unit',
      observations: ['Resident reports AC not functioning', 'Issue described via voice note', 'Maintenance team to verify on site'],
      recommendedAction: 'Assign an HVAC technician to inspect the unit and assess refrigerant levels, thermostat, and fan motor.',
      priority: 'high',
      confidence: 55,
    };
  }
  if (lower.includes('leak') || lower.includes('water') || lower.includes('drip') || lower.includes('flood') || lower.includes('pipe')) {
    return {
      title: 'Water Leak Reported',
      description: transcript.length > 10 ? transcript.slice(0, 250) : 'Resident reports a water leak. Maintenance team to inspect source and assess damage.',
      category: 'Plumbing',
      subCategory: 'Water Leak',
      identifiedAsset: 'Water Supply / Fixture',
      observations: ['Active water leak described by resident', 'Exact source to be confirmed on site', 'Risk of water damage if not addressed promptly'],
      recommendedAction: 'Dispatch a plumber to locate and isolate the leak. Assess surrounding areas for water damage.',
      priority: 'high',
      confidence: 55,
    };
  }
  if (lower.includes('light') || lower.includes('electric') || lower.includes('power') || lower.includes('socket') || lower.includes('switch')) {
    return {
      title: 'Electrical Issue Reported',
      description: transcript.length > 10 ? transcript.slice(0, 250) : 'Resident reports an electrical fault. Maintenance team to inspect and assess the affected circuit.',
      category: 'Electrical',
      subCategory: 'Electrical Fault',
      identifiedAsset: 'Electrical Fixture / Circuit',
      observations: ['Electrical fault described by resident', 'Could be MCB trip, failed fixture, or wiring issue', 'Safety inspection required'],
      recommendedAction: 'Assign a licensed electrician to inspect the circuit, test affected outlets and fixtures, and check the MCB panel.',
      priority: 'medium',
      confidence: 50,
    };
  }
  return {
    title: transcript.length > 5 ? transcript.split(' ').slice(0, 5).join(' ') : 'General Maintenance Request',
    description: transcript.length > 15 ? transcript.slice(0, 300) : 'Resident submitted a voice note reporting a facility issue. Maintenance team to review and assess.',
    category: 'General Maintenance',
    subCategory: 'General Issue',
    identifiedAsset: 'Property Area',
    observations: ['Issue reported via voice note', 'Details captured in resident description', 'Maintenance team to verify on site'],
    recommendedAction: 'Dispatch appropriate maintenance technician to inspect and assess the reported issue.',
    priority: 'low',
    confidence: 35,
  };
}

function mapAnalysisResponse(a: {
  title?: string;
  description?: string;
  issueType?: string;
  category?: string;
  severity?: string;
  identifiedAsset?: string;
  observations?: string[];
  recommendedAction?: string;
  confidence?: number;
}, fallbackObservation: string): AiAnalysis {
  const rawSeverity = (a.severity ?? 'medium').toLowerCase();
  const priority = (['low', 'medium', 'high'].includes(rawSeverity)
    ? rawSeverity
    : rawSeverity === 'critical' ? 'high' : 'medium') as AiAnalysis['priority'];

  return {
    title: a.title ?? 'Issue Identified',
    description: a.description ?? 'Issue identified via analysis.',
    category: a.category ?? 'General Maintenance',
    subCategory: a.issueType ?? 'Issue Reported',
    identifiedAsset: a.identifiedAsset ?? 'Property Area',
    observations: Array.isArray(a.observations) && a.observations.length > 0
      ? a.observations
      : [fallbackObservation],
    recommendedAction: a.recommendedAction ?? 'Maintenance team will assess and action accordingly.',
    priority,
    confidence: typeof a.confidence === 'number' ? a.confidence : 75,
  };
}

type ApiAnalysisPayload = {
  title?: string;
  description?: string;
  issueType?: string;
  category?: string;
  severity?: string;
  identifiedAsset?: string;
  observations?: string[];
  recommendedAction?: string;
  confidence?: number;
};

export async function analyzeImage(imageDataUrl: string): Promise<AiAnalysis> {
  try {
    const blob = await (await fetch(imageDataUrl)).blob();
    const form = new FormData();
    form.append('image', blob, 'incident.jpg');

    const resp = await fetch(`${BASE_URL}/api/ai/analyze-issue-image`, {
      method: 'POST',
      body: form,
    });

    if (!resp.ok) return mockAiImageAnalysis();

    const data = await resp.json() as { success?: boolean; analysis?: ApiAnalysisPayload };
    return mapAnalysisResponse(data.analysis ?? {}, 'Issue observed in the uploaded photo');
  } catch {
    return mockAiImageAnalysis();
  }
}

export async function transcribeAndAnalyzeVoice(audioBlob: Blob): Promise<{ analysis: AiAnalysis; transcript: string; failed: boolean }> {
  try {
    const form = new FormData();
    form.append('audio', audioBlob, 'voice-note.webm');

    const resp = await fetch(`${BASE_URL}/api/ai/transcribe-and-analyze-voice`, {
      method: 'POST',
      body: form,
    });

    if (!resp.ok) {
      return { analysis: mockVoiceAnalysis(''), transcript: '', failed: true };
    }

    const data = await resp.json() as { success?: boolean; transcript?: string; analysisFallbackUsed?: boolean; analysis?: ApiAnalysisPayload };
    const transcript = data.transcript ?? '';

    if (!data.analysis || !data.analysis.title) {
      const failed = transcript.length === 0;
      return { analysis: mockVoiceAnalysis(transcript), transcript, failed };
    }

    const analysis = mapAnalysisResponse(
      data.analysis,
      transcript.length > 0 ? transcript.slice(0, 120) : 'Issue reported via voice note',
    );
    const failed = transcript.length === 0;
    return { analysis, transcript, failed };
  } catch {
    return { analysis: mockVoiceAnalysis(''), transcript: '', failed: true };
  }
}

function generateIncidentRef(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `INC-H-${num}`;
}

const SILICON_OASIS_LAT = 25.1174;
const SILICON_OASIS_LNG = 55.3784;

function deriveSlaMinutes(priority?: string): number {
  if (priority === 'high') return 30;
  if (priority === 'low') return 120;
  return 60;
}

export interface SubmitAiMetadata {
  confidence: number;
  issueType: string;
  category: string;
  identifiedAsset: string;
  observations: string[];
  recommendedAction: string;
  siteId?: string;
}

interface SubmitOptions {
  source: 'Resident App' | 'AI Capture' | 'QR Scan' | 'WhatsApp → Manual' | 'Manual' | string;
  analysis?: AiAnalysis | null;
  description?: string;
  clientId?: string;
  siteId?: string;
  aiMetadata?: SubmitAiMetadata;
  severity?: 'low' | 'medium' | 'high';
  title?: string;
  slaMinutes?: number;
  lat?: number;
  lng?: number;
  imageUrl?: string;
}

export async function submitIncident(opts: SubmitOptions): Promise<string> {
  const ref = generateIncidentRef();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const priority = opts.severity ?? opts.analysis?.priority ?? 'medium';

  const derivedMetadata: SubmitAiMetadata | undefined = opts.analysis ? {
    confidence: opts.analysis.confidence,
    issueType: opts.analysis.subCategory,
    category: opts.analysis.category,
    identifiedAsset: opts.analysis.identifiedAsset,
    observations: opts.analysis.observations,
    recommendedAction: opts.analysis.recommendedAction,
    siteId: opts.siteId,
  } : undefined;

  const aiMetadata = opts.aiMetadata ?? derivedMetadata;

  const body: Record<string, unknown> = {
    id: ref,
    title: opts.title ?? opts.analysis?.title ?? opts.analysis?.category ?? 'Hospitality Incident',
    description: opts.description ?? opts.analysis?.description ?? 'Incident reported via hospitality portal',
    source: opts.source,
    severity: priority,
    slaMinutes: opts.slaMinutes ?? deriveSlaMinutes(priority),
    clientId: opts.clientId,
    siteId: opts.siteId,
    lat: opts.lat ?? SILICON_OASIS_LAT,
    lng: opts.lng ?? SILICON_OASIS_LNG,
    location: 'Silicon Oasis',
    reportedAt: now.toISOString(),
    activityLog: [
      { time: timeStr, event: `Incident reported by resident via ${opts.source} — awaiting FM team review`, type: 'update' },
    ],
    ...(aiMetadata ? { aiMetadata } : {}),
    ...(opts.imageUrl ? { imageUrl: opts.imageUrl } : {}),
  };

  const resp = await fetch(`${BASE_URL}/api/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => resp.statusText);
    throw new Error(`Failed to submit incident (${resp.status}): ${detail}`);
  }

  return ref;
}
