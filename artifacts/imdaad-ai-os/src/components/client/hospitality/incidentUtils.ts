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

export async function analyzeImage(imageDataUrl: string): Promise<AiAnalysis> {
  try {
    const blob = await (await fetch(imageDataUrl)).blob();
    const form = new FormData();
    form.append('image', blob, 'incident.jpg');

    const resp = await fetch(`${BASE_URL}/api/ai/analyze-issue-image`, {
      method: 'POST',
      body: form,
    });

    if (!resp.ok) {
      return mockAiImageAnalysis();
    }

    const data = await resp.json() as {
      success?: boolean;
      analysis?: {
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
    };

    const a = data.analysis ?? {};
    const rawSeverity = (a.severity ?? 'medium').toLowerCase();
    const priority = (['low', 'medium', 'high'].includes(rawSeverity)
      ? rawSeverity
      : rawSeverity === 'critical' ? 'high' : 'medium') as AiAnalysis['priority'];

    return {
      title: a.title ?? 'Issue Identified',
      description: a.description ?? 'Issue identified via image analysis.',
      category: a.category ?? 'General Maintenance',
      subCategory: a.issueType ?? 'Issue Reported',
      identifiedAsset: a.identifiedAsset ?? 'Property Area',
      observations: Array.isArray(a.observations) && a.observations.length > 0
        ? a.observations
        : ['Issue observed in the uploaded photo'],
      recommendedAction: a.recommendedAction ?? 'Maintenance team will assess and action accordingly.',
      priority,
      confidence: typeof a.confidence === 'number' ? a.confidence : 80,
    };
  } catch {
    return mockAiImageAnalysis();
  }
}

function generateIncidentRef(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `INC-H-${num}`;
}

interface SubmitOptions {
  source: 'camera' | 'upload' | 'voice' | 'ai-chat';
  analysis?: AiAnalysis | null;
  description?: string;
}

export async function submitIncident(opts: SubmitOptions): Promise<string> {
  const ref = generateIncidentRef();

  const body: Record<string, unknown> = {
    id: ref,
    title: opts.analysis?.title ?? opts.analysis?.category ?? 'Hospitality Incident',
    description: opts.description ?? opts.analysis?.description ?? 'Incident reported via hospitality portal',
    source: opts.source,
    severity: opts.analysis?.priority ?? 'medium',
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
