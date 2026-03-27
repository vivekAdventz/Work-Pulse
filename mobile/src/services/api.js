// IMPORTANT: Change this to your actual backend server IP/URL
// For Android emulator use 10.0.2.2 to point to host machine's localhost
// For physical device, use your machine's local network IP (e.g., 192.168.1.x:5207)
const API_BASE_URL = 'http://10.0.2.2:5207/api';

function normalizeIds(data) {
  if (Array.isArray(data)) return data.map(normalizeIds);
  if (data && typeof data === 'object') {
    const out = { ...data };
    if (out._id && !out.id) { out.id = out._id; }
    delete out.__v;
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
  superadminLogin: (email, password) => api.request('/auth/superadmin-login', 'POST', { email, password }),
  login: (email) => api.request('/login', 'POST', { email }),

  // Data endpoints
  getAllData: () => api.request('/all-data'),
  generateSummary: (timeEntries, fullDb) => api.request('/generate-summary', 'POST', { timeEntries, fullDb }),
  downloadCsv: (entries) => api.request('/download-csv', 'POST', { entries }, 'blob'),
  updateUser: (userId, userData) => api.request(`/users/${userId}`, 'PUT', userData),
  createUser: (userData) => api.request('/users', 'POST', userData),
  addItem: (itemType, itemData) => api.request(`/${itemType}`, 'POST', itemData),
  updateItem: (itemType, itemId, itemData) => api.request(`/${itemType}/${itemId}`, 'PUT', itemData),
  deleteItem: (itemType, itemId) => api.request(`/${itemType}/${itemId}`, 'DELETE'),
  addTimeEntry: (entryData) => api.request('/timeEntries', 'POST', entryData),
  updateTimeEntry: (entryId, entryData) => api.request(`/timeEntries/${entryId}`, 'PUT', entryData),
  deleteTimeEntry: (entryId) => api.request(`/timeEntries/${entryId}`, 'DELETE'),
};

export default api;
