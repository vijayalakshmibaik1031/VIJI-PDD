// Facility Mobile - API Configuration connecting to Railway Production Backend
export const BASE_URL = 'https://viji-pdd-production-7c95.up.railway.app/api';

export const apiCall = async (endpoint, options = {}, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  // Normalize endpoint to prevent double '/api' in URL (e.g. /api/complaints -> /complaints)
  let cleanEndpoint = endpoint || '';
  if (cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.substring(4);
  } else if (cleanEndpoint === '/api') {
    cleanEndpoint = '';
  }
  if (!cleanEndpoint.startsWith('/')) {
    cleanEndpoint = '/' + cleanEndpoint;
  }

  const isAuthEndpoint = cleanEndpoint.includes('/login') || cleanEndpoint.includes('/register') || cleanEndpoint.includes('/check-verification');
  if (!token && !isAuthEndpoint) {
    console.warn(`[API Call Skipped] ${cleanEndpoint}: No auth token provided`);
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}${cleanEndpoint}`, config);
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
};
