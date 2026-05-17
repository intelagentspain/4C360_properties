import { useSyncExternalStore } from 'react';
import type { Risk } from '../data/risks';
import type { ScenarioKey } from '../data/ai-responses';
import { api } from '@/lib/api';
import {
  createProjectControlEvent,
  getNextProjectEventType,
  type ProjectEvent,
  type ProjectEventType,
} from '@/core/control-twin/projectControlTwin';
import {
  defaultProjectCommandProjectId,
  defaultProjectCommandPropertyId,
  type ProjectCommandDataset,
  type ProjectCommandProjectId,
  type ProjectCommandPropertyId,
  type PropertyDevelopment,
} from '../data/portfolio';

export interface ProjectCommandState {
  selectedProjectId: ProjectCommandProjectId;
  selectedPropertyId: ProjectCommandPropertyId;
  createdProperties: PropertyDevelopment[];
  createdProjectDatasets: ProjectCommandDataset[];
  activeScenario: ScenarioKey;
  selectedPhaseId: string | null;
  selectedRisk: Risk | null;
  selectedZone: string;
  projectEventsByProjectId: Record<string, ProjectEvent[]>;
  eventLedgerStatusByProjectId: Record<string, 'idle' | 'loading' | 'ready' | 'fallback' | 'error'>;
  eventLedgerSourceByProjectId: Record<string, 'database' | 'memory' | 'local' | 'unloaded'>;
}

let state: ProjectCommandState = {
  selectedProjectId: defaultProjectCommandProjectId,
  selectedPropertyId: defaultProjectCommandPropertyId,
  createdProperties: [],
  createdProjectDatasets: [],
  activeScenario: 'base',
  selectedPhaseId: null,
  selectedRisk: null,
  selectedZone: 'tower-a',
  projectEventsByProjectId: {},
  eventLedgerStatusByProjectId: {},
  eventLedgerSourceByProjectId: {},
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(listener => listener());
}

function setProjectEvents(
  projectId: string,
  events: ProjectEvent[],
  status: ProjectCommandState['eventLedgerStatusByProjectId'][string],
  source: ProjectCommandState['eventLedgerSourceByProjectId'][string],
) {
  state = {
    ...state,
    projectEventsByProjectId: {
      ...state.projectEventsByProjectId,
      [projectId]: events,
    },
    eventLedgerStatusByProjectId: {
      ...state.eventLedgerStatusByProjectId,
      [projectId]: status,
    },
    eventLedgerSourceByProjectId: {
      ...state.eventLedgerSourceByProjectId,
      [projectId]: source,
    },
  };
  emit();
}

function normalizeProjectEvent(event: unknown, fallbackProjectId: string): ProjectEvent {
  const value = event as Partial<ProjectEvent>;
  return {
    id: typeof value.id === 'string' ? value.id : `${fallbackProjectId}-event-${Date.now().toString(36)}`,
    projectId: typeof value.projectId === 'string' ? value.projectId : fallbackProjectId,
    type: value.type as ProjectEventType,
    title: typeof value.title === 'string' ? value.title : 'Project control event',
    description: typeof value.description === 'string' ? value.description : 'ProjectCommand event imported from ledger.',
    affectedAreas: Array.isArray(value.affectedAreas) ? value.affectedAreas : [],
    affectedModule: typeof value.affectedModule === 'string' ? value.affectedModule : 'ProjectCommand',
    impactLabel: typeof value.impactLabel === 'string' ? value.impactLabel : 'Project control metrics recalculated.',
    cta: typeof value.cta === 'string' ? value.cta : 'Review event',
    severity: value.severity ?? 'medium',
    impacts: value.impacts ?? { healthDelta: 0, cpiDelta: 0, spiDelta: 0, floatDelta: 0, eacDelta: 0, riskDelta: 0, evidenceChange: 0 },
    sourceModule: value.sourceModule,
    sourceObjectId: value.sourceObjectId,
    timestamp: typeof value.timestamp === 'string' ? value.timestamp : new Date().toISOString(),
  };
}

function fallbackToLocal(projectId: string, events: ProjectEvent[]) {
  setProjectEvents(projectId, events, 'fallback', 'local');
}

async function persistProjectEvent(projectId: string, event: ProjectEvent) {
  try {
    const response = await api.projectCommand.createEvent(projectId, event);
    const saved = normalizeProjectEvent(response.event, projectId);
    const current = state.projectEventsByProjectId[projectId] ?? [];
    setProjectEvents(
      projectId,
      current.map(item => item.id === saved.id ? saved : item),
      'ready',
      response.source,
    );
  } catch {
    fallbackToLocal(projectId, state.projectEventsByProjectId[projectId] ?? [event]);
  }
}

export function setProjectCommandState(patch: Partial<ProjectCommandState>) {
  state = { ...state, ...patch };
  emit();
}

export function addProjectCommandDataset(dataset: ProjectCommandDataset) {
  const baselineEvent = createProjectControlEvent(dataset.id, 'baseline-created');
  state = {
    ...state,
    selectedProjectId: dataset.id,
    selectedPropertyId: dataset.property.id,
    createdProperties: [
      ...state.createdProperties.filter(existing => existing.id !== dataset.property.id),
      dataset.property,
    ],
    createdProjectDatasets: [
      ...state.createdProjectDatasets.filter(existing => existing.id !== dataset.id),
      dataset,
    ],
    activeScenario: 'base',
    selectedRisk: null,
    selectedPhaseId: null,
    projectEventsByProjectId: {
      ...state.projectEventsByProjectId,
      [dataset.id]: [baselineEvent],
    },
    eventLedgerStatusByProjectId: {
      ...state.eventLedgerStatusByProjectId,
      [dataset.id]: 'loading',
    },
    eventLedgerSourceByProjectId: {
      ...state.eventLedgerSourceByProjectId,
      [dataset.id]: 'unloaded',
    },
  };
  emit();
  void persistProjectEvent(dataset.id, baselineEvent);
}

export function resetProjectCommandEvents(projectId: ProjectCommandProjectId) {
  const baselineEvent = createProjectControlEvent(projectId, 'baseline-created');
  state = {
    ...state,
    projectEventsByProjectId: {
      ...state.projectEventsByProjectId,
      [projectId]: [baselineEvent],
    },
    eventLedgerStatusByProjectId: {
      ...state.eventLedgerStatusByProjectId,
      [projectId]: 'loading',
    },
    activeScenario: 'base',
    selectedRisk: null,
    selectedPhaseId: null,
  };
  emit();
  void (async () => {
    try {
      const clearResponse = await api.projectCommand.clearEvents(projectId);
      const createResponse = await api.projectCommand.createEvent(projectId, baselineEvent);
      setProjectEvents(projectId, [normalizeProjectEvent(createResponse.event, projectId)], 'ready', createResponse.source ?? clearResponse.source);
    } catch {
      fallbackToLocal(projectId, [baselineEvent]);
    }
  })();
}

export function simulateProjectCommandEvent(projectId: ProjectCommandProjectId, type?: ProjectEventType) {
  const currentEvents = state.projectEventsByProjectId[projectId] ?? [];
  const nextType = type ?? getNextProjectEventType(currentEvents);
  const event = createProjectControlEvent(projectId, nextType, currentEvents.length);
  state = {
    ...state,
    projectEventsByProjectId: {
      ...state.projectEventsByProjectId,
      [projectId]: [...currentEvents, event],
    },
    activeScenario: 'base',
  };
  emit();
  void persistProjectEvent(projectId, event);
  return event;
}

export async function hydrateProjectCommandEvents(projectId: ProjectCommandProjectId) {
  const status = state.eventLedgerStatusByProjectId[projectId];
  if (status === 'loading' || status === 'ready') return;

  state = {
    ...state,
    eventLedgerStatusByProjectId: {
      ...state.eventLedgerStatusByProjectId,
      [projectId]: 'loading',
    },
  };
  emit();

  try {
    const response = await api.projectCommand.listEvents(projectId);
    const events = response.events.map(event => normalizeProjectEvent(event, projectId));
    if (events.length > 0) {
      setProjectEvents(projectId, events, 'ready', response.source);
      return;
    }

    const baselineEvent = createProjectControlEvent(projectId, 'baseline-created');
    setProjectEvents(projectId, [baselineEvent], 'loading', response.source);
    await persistProjectEvent(projectId, baselineEvent);
  } catch {
    const existing = state.projectEventsByProjectId[projectId];
    fallbackToLocal(projectId, existing?.length ? existing : [createProjectControlEvent(projectId, 'baseline-created')]);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useProjectCommandStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
