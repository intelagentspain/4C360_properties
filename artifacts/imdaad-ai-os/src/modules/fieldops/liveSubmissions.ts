import type { SurveySubmission } from './data';

const LIVE_SUBMISSIONS_KEY = 'fieldops.liveSubmissions.v1';
const LIVE_SUBMISSIONS_LIGHT_KEY = 'fieldops.liveSubmissions.light.v1';
const LIVE_SUBMISSIONS_EVENT = 'fieldops-live-submissions-updated';

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getLocalFieldOpsSubmissions(): SurveySubmission[] {
  if (!canUseBrowserStorage()) return [];
  const submissions: SurveySubmission[] = [];
  try {
    const raw = window.localStorage.getItem(LIVE_SUBMISSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) submissions.push(...(parsed as SurveySubmission[]));
    }
  } catch {
    // Keep reading the lightweight index below if the rich preview payload is too large or corrupted.
  }

  try {
    const raw = window.localStorage.getItem(LIVE_SUBMISSIONS_LIGHT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) submissions.push(...(parsed as SurveySubmission[]));
    }
  } catch {
    // Ignore malformed fallback storage.
  }

  return submissions.filter((item, index, all) => all.findIndex(candidate => candidate.id === item.id) === index);
}

function stripPreviewData(items: SurveySubmission[]) {
  return items.map(item => ({
    ...item,
    evidence: item.evidence.map(({ previewUrl: _previewUrl, ...evidence }) => evidence),
  }));
}

export function saveLocalFieldOpsSubmissions(items: SurveySubmission[]) {
  if (!canUseBrowserStorage()) return;
  const lightweight = stripPreviewData(items);

  try {
    window.localStorage.setItem(LIVE_SUBMISSIONS_LIGHT_KEY, JSON.stringify(lightweight));
  } catch {
    // The rich storage write below may still succeed in normal browsers.
  }

  try {
    window.localStorage.setItem(LIVE_SUBMISSIONS_KEY, JSON.stringify(items));
  } catch {
    try {
      window.localStorage.setItem(LIVE_SUBMISSIONS_KEY, JSON.stringify(lightweight));
    } catch {
      // The lightweight index has already had a chance to persist, so still notify listeners.
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
    if (event.key === LIVE_SUBMISSIONS_KEY || event.key === LIVE_SUBMISSIONS_LIGHT_KEY) callback();
  };
  const onCustom = () => callback();
  window.addEventListener('storage', onStorage);
  window.addEventListener(LIVE_SUBMISSIONS_EVENT, onCustom);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LIVE_SUBMISSIONS_EVENT, onCustom);
  };
}

