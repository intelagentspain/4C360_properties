const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';

export interface AiAnalysis {
  category: string;
  subCategory: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  summary: string;
}

const ISSUE_POOL: AiAnalysis[] = [
  {
    category: 'HVAC',
    subCategory: 'Cooling Failure',
    priority: 'high',
    confidence: 91,
    summary: 'Air conditioning unit appears non-functional. Possible refrigerant issue or compressor fault.',
  },
  {
    category: 'Plumbing',
    subCategory: 'Water Leak',
    priority: 'medium',
    confidence: 85,
    summary: 'Water leak detected, likely from a pipe joint or fixture. No structural damage visible.',
  },
  {
    category: 'Electrical',
    subCategory: 'Light Failure',
    priority: 'low',
    confidence: 94,
    summary: 'Lighting system failure. Could be a blown fuse or faulty bulb in the fixture.',
  },
  {
    category: 'General Maintenance',
    subCategory: 'Surface Damage',
    priority: 'low',
    confidence: 78,
    summary: 'Surface wear or damage noted. Cosmetic repair required.',
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
      category?: string;
      subCategory?: string;
      priority?: string;
      confidence?: number;
      summary?: string;
    };

    return {
      category: data.category ?? 'General Maintenance',
      subCategory: data.subCategory ?? 'Issue Reported',
      priority: (['low', 'medium', 'high'].includes(data.priority ?? '') ? data.priority : 'medium') as AiAnalysis['priority'],
      confidence: typeof data.confidence === 'number' ? data.confidence : 80,
      summary: data.summary ?? 'Issue identified via image analysis.',
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
    title: opts.analysis?.category ?? 'Hospitality Incident',
    description: opts.description ?? opts.analysis?.summary ?? 'Incident reported via hospitality portal',
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
