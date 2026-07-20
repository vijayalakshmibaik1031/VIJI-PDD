// Web Admin - API Service
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  // Use machine IP for Android, localhost for Browser
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    return 'http://192.168.1.8:5000/api';
  }
  return 'http://localhost:5000/api';
};

const API_URL = getApiBaseUrl();
console.log('Using API_URL:', API_URL);

// ── Token storage (kept in memory + localStorage for persistence across refreshes) ──
const TOKEN_KEY = 'fd_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Build headers — always JSON, attach Bearer token when available
function authHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// Generic fetch wrapper — throws on non-ok, handles 401 globally
async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    if (response.status === 401) {
      // Token invalid/expired — clear it so the app redirects to login
      setToken(null);
    }
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.json();
}

export const apiService = {
  // ── Auth ──────────────────────────────────────────────────────────────────

  registerEmployee: (id, name, username, password) =>
    apiFetch(`${API_URL}/employees/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, username, password }),
    }),

  loginEmployee: (userId, password) =>
    apiFetch(`${API_URL}/employees/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    }),

  loginManager: (userId, password) =>
    apiFetch(`${API_URL}/managers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    }),

  loginAuthority: (userId, password) =>
    apiFetch(`${API_URL}/authorities/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    }),

  logout: () =>
    apiFetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: authHeaders(),
    }).catch(() => {}), // best-effort — clear token regardless

  // ── Complaints ────────────────────────────────────────────────────────────

  createComplaint: (complaint) =>
    apiFetch(`${API_URL}/complaints`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(complaint),
    }),

  getComplaints: () =>
    apiFetch(`${API_URL}/complaints`, { headers: authHeaders() }),

  getComplaintById: (id) =>
    apiFetch(`${API_URL}/complaints/${id}`, { headers: authHeaders() }),

  getEmployeeComplaints: (employeeId) =>
    apiFetch(`${API_URL}/complaints/employee/${employeeId}`, { headers: authHeaders() }),

  updateComplaintStatus: (id, status) =>
    apiFetch(`${API_URL}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }),

  completeComplaint: (id, description, photoUri) =>
    apiFetch(`${API_URL}/complaints/${id}/complete`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ completionDescription: description, completionPhotoUri: photoUri }),
    }),

  rejectComplaint: (id, reason) =>
    apiFetch(`${API_URL}/complaints/${id}/reject`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    }),

  escalateComplaint: (id, reason) =>
    apiFetch(`${API_URL}/complaints/${id}/escalate`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    }),

  // ── Rejection count & re-complain tracking ────────────────────────────────

  getRejectionCount: (employeeId, roomId, category) => {
    const params = new URLSearchParams({ employeeId, roomId, category });
    return apiFetch(`${API_URL}/complaints/rejection-count?${params}`, {
      headers: authHeaders(),
    });
  },

  hasRecomplained: (employeeId, roomId, category, complaintId) => {
    const params = new URLSearchParams({ employeeId, roomId, category });
    if (complaintId) params.set('complaintId', complaintId);
    return apiFetch(`${API_URL}/complaints/has-recomplained?${params}`, {
      headers: authHeaders(),
    });
  },

  markRecomplained: (employeeId, roomId, category, complaintId) =>
    apiFetch(`${API_URL}/complaints/mark-recomplained`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ employeeId, roomId, category, complaintId }),
    }),

  // ── Merged groups ─────────────────────────────────────────────────────────

  createMergedGroup: (mergedGroup) => {
    const payload = {
      ...mergedGroup,
      complaintIds: mergedGroup.complaintIds ?? mergedGroup.constituentComplaintIds,
    };
    return apiFetch(`${API_URL}/merged-groups`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
  },

  getMergedGroups: () =>
    apiFetch(`${API_URL}/merged-groups`, { headers: authHeaders() }),

  getMergedGroupById: (id) =>
    apiFetch(`${API_URL}/merged-groups/${id}`, { headers: authHeaders() }),

  endorseMergedGroup: (mergedGroupId, employeeId) =>
    apiFetch(`${API_URL}/merged-groups/${mergedGroupId}/endorse`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ employeeId }),
    }),

  escalateMergedGroup: (mergedGroupId, escalationNote) =>
    apiFetch(`${API_URL}/merged-groups/${mergedGroupId}/escalate`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ escalationNote }),
    }),

  acknowledgeMergedGroup: (mergedGroupId) =>
    apiFetch(`${API_URL}/merged-groups/${mergedGroupId}/acknowledge`, {
      method: 'PATCH',
      headers: authHeaders(),
    }),

  // ── Rooms CRUD ─────────────────────────────────────────────────────────────
  getRooms: () =>
    apiFetch(`${API_URL}/rooms`, { headers: authHeaders() }),

  createRoom: (roomNumber, floorNumber) =>
    apiFetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ roomNumber, floorNumber }),
    }),

  updateRoom: (id, roomNumber, floorNumber) =>
    apiFetch(`${API_URL}/rooms/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ roomNumber, floorNumber }),
    }),

  deleteRoom: (id) =>
    apiFetch(`${API_URL}/rooms/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }),

  loginWithGoogle: (credential) =>
    apiFetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    }),

  updateEmployeeProfile: (payload) =>
    apiFetch(`${API_URL}/employees/update-profile`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),
};
