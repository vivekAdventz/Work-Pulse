const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function normalizeIds(data) {
  if (Array.isArray(data)) return data.map(normalizeIds);
  if (data && typeof data === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === '__v') continue;
      out[key] = normalizeIds(value);
    }
    if (out._id && !out.id) { out.id = out._id; }
    return out;
  }
  return data;
}

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

const AUTH_ENDPOINTS = ['/auth/', '/login'];

const api = {
  async request(endpoint, method = 'GET', body = null, responseType = 'json') {
    const options = {
      method,
      headers: getAuthHeaders(),
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      if (response.status === 401) {
        const isAuthEndpoint = AUTH_ENDPOINTS.some(p => endpoint.startsWith(p));
        if (!isAuthEndpoint) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('activeRole');
          window.location.reload();
          throw new Error('Session expired. Please log in again.');
        }
      }
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    if (responseType === 'blob') {
      return response.blob();
    }
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true };
    }
    const json = await response.json();
    return normalizeIds(json);
  },

  // Auth endpoints
  microsoftLogin: (msAccessToken) => api.request('/auth/microsoft', 'POST', { msAccessToken }),
  superadminLogin: (email, password) => api.request('/auth/superadmin-login', 'POST', { email, password }),
  manualLogin: (email, password) => api.request('/auth/manual-login', 'POST', { email, password }),
  login: (email) => api.request('/login', 'POST', { email }),

  // Data endpoints
  getAllData: () => api.request('/all-data'),
  generateSummary: (timeEntries, fullDb, reportType = 'employee') => api.request('/generate-summary', 'POST', { timeEntries, fullDb, reportType }),
  generateDescription: (prompt) => api.request('/generate-description', 'POST', { prompt }),
  downloadCsv: (entries) => api.request('/download-csv', 'POST', { entries }, 'blob'),
  updateUser: (userId, userData) => api.request(`/users/${userId}`, 'PUT', userData),
  createUser: (userData) => api.request('/users', 'POST', userData),
  addItem: (itemType, itemData) => api.request(`/${itemType}`, 'POST', itemData),
  updateItem: (itemType, itemId, itemData) => api.request(`/${itemType}/${itemId}`, 'PUT', itemData),
  deleteItem: (itemType, itemId) => api.request(`/${itemType}/${itemId}`, 'DELETE'),
  getHierarchy: (userId) => api.request(`/users/${userId}/hierarchy`),
  addTimeEntry: (entryData) => api.request('/timeEntries', 'POST', entryData),
  updateTimeEntry: (entryId, entryData) => api.request(`/timeEntries/${entryId}`, 'PUT', entryData),
  deleteTimeEntry: (entryId) => api.request(`/timeEntries/${entryId}`, 'DELETE'),
  fillByAI: (prompt) => api.request('/fill-by-ai', 'POST', { prompt }),
  fillEntryByAI: (prompt) => api.request('/fill-entry-by-ai', 'POST', { prompt }),
};

export default api;
