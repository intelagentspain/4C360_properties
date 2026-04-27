import { useSyncExternalStore } from 'react';
import type { Risk } from '../data/risks';
import type { ScenarioKey } from '../data/ai-responses';
import type { ProjectCommandDataset, ProjectCommandProjectId } from '../data/portfolio';

export interface ProjectCommandState {
  selectedProjectId: ProjectCommandProjectId;
  createdProjectDatasets: ProjectCommandDataset[];
  activeScenario: ScenarioKey;
  selectedPhaseId: string | null;
  selectedRisk: Risk | null;
  selectedZone: string;
}

let state: ProjectCommandState = {
  selectedProjectId: 'lawnz-residences',
  createdProjectDatasets: [],
  activeScenario: 'base',
  selectedPhaseId: null,
  selectedRisk: null,
  selectedZone: 'tower-a',
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(listener => listener());
}

export function setProjectCommandState(patch: Partial<ProjectCommandState>) {
  state = { ...state, ...patch };
  emit();
}

export function addProjectCommandDataset(dataset: ProjectCommandDataset) {
  state = {
    ...state,
    selectedProjectId: dataset.id,
    createdProjectDatasets: [
      ...state.createdProjectDatasets.filter(existing => existing.id !== dataset.id),
      dataset,
    ],
    activeScenario: 'base',
    selectedRisk: null,
    selectedPhaseId: null,
  };
  emit();
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
