import { useSyncExternalStore } from 'react';
import type { Risk } from '../data/risks';
import type { ScenarioKey } from '../data/ai-responses';

export interface ProjectCommandState {
  activeScenario: ScenarioKey;
  selectedPhaseId: string | null;
  selectedRisk: Risk | null;
  selectedZone: string;
}

const state: ProjectCommandState = {
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
  Object.assign(state, patch);
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
