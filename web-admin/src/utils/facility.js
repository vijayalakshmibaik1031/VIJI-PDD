export const STORAGE_KEYS = {
  employees: 'fd_employees',
  complaints: 'fd_complaints',
  merged: 'fd_merged',
  session: 'fd_session',
  rejectionCounts: 'fd_rejection_counts',
};

export const CATEGORIES = ['Electrical', 'Plumbing', 'Cleaning', 'Structural', 'Other'];
export const VISIBILITY = { private: 'private', public: 'public' };
export const STATUS = {
  pending: 'pending',
  inProgress: 'in_progress',
  completed: 'completed',
  rejected: 'rejected',
  mergedPublic: 'merged_public',
  escalated: 'escalated',
  acknowledged: 'acknowledged',
};

export const ROOM_IDS = Array.from({ length: 5 }, (_, floor) =>
  Array.from({ length: 5 }, (_, room) => `${floor + 1}${room + 1}`),
).flat();

export function formatRelativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min > 1 ? 's' : ''} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? 's' : ''} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day > 1 ? 's' : ''} ago`;
}

export function readJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

