import type { SurveySubmission } from './data';

const LIVE_SUBMISSIONS_KEY = 'fieldops.liveSubmissions.v1';
const LIVE_SUBMISSIONS_EVENT = 'fieldops-live-submissions-updated';

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getLocalFieldOpsSubmissions(): SurveySubmission[] {
  if (!canUseBrowserStorage()) return [];
  try {
    const raw = window.localStorage.getItem(LIVE_SUBMISSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SurveySubmission[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalFieldOpsSubmissions(items: SurveySubmission[]) {
  if (!canUseBrowserStorage()) return;
  try {
    window.localStorage.setItem(LIVE_SUBMISSIONS_KEY, JSON.stringify(items));
  } catch {
    const lightweight = items.map(item => ({
      ...item,
      evidence: item.evidence.map(({ previewUrl: _previewUrl, ...evidence }) => evidence),
    }));
    try {
      window.localStorage.setItem(LIVE_SUBMISSIONS_KEY, JSON.stringify(lightweight));
    } catch {
      return;
    }
  }
  window.dispatchEvent(new CustomEvent(LIVE_SUBMISSIONS_EVENT));
}

export function appendLocalFieldOpsSubmission(submission: SurveySubmission) {
  const current = getLocalFieldOpsSubmissions();
  const withoutDuplicate = current.filter(item => item.id !== submission.id);
  saveLocalFieldOpsSubmissions([submission, ...withoutDuplicate]);
}

export function subscribeToLocalFieldOpsSubmissions(callback: () => void) {
  if (!canUseBrowserStorage()) return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === LIVE_SUBMISSIONS_KEY) callback();
  };
  const onCustom = () => callback();
  window.addEventListener('storage', onStorage);
  window.addEventListener(LIVE_SUBMISSIONS_EVENT, onCustom);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LIVE_SUBMISSIONS_EVENT, onCustom);
  };
}

