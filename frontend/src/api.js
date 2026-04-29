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
  const activeRole = localStorage.getItem('activeRole');
  if (activeRole) headers['X-Active-Role'] = activeRole;
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
  verifyOtp: (email, otp) => api.request('/auth/verify-otp', 'POST', { email, otp }),
  setPassword: (email, otp, newPassword) => api.request('/auth/set-password', 'POST', { email, otp, newPassword }),
  resendOtp: (email, password) => api.request('/auth/resend-otp', 'POST', { email, password }),
  forgotPassword: (email) => api.request('/auth/forgot-password', 'POST', { email }),
  login: (email) => api.request('/login', 'POST', { email }),

  // Data endpoints
  getUsers: () => api.request('/users'),
  getTimeEntries: () => api.request('/timeEntries'),
  getCompanies: () => api.request('/companies'),
  getStakeholders: () => api.request('/stakeholders'),
  getProjects: () => api.request('/projects'),
  getSubProjects: () => api.request('/subProjects'),
  getTasks: () => api.request('/tasks'),
  getActivityTypes: () => api.request('/activityTypes'),
  getActivityTags: () => api.request('/activityTags'),
  createActivityTag: (data) => api.request('/activityTags', 'POST', data),
  updateActivityTag: (id, data) => api.request(`/activityTags/${id}`, 'PUT', data),
  deleteActivityTag: (id) => api.request(`/activityTags/${id}`, 'DELETE'),
  getTeamMembers: () => api.request('/teamMembers'),
  
  getAllData: async () => {
    const [users, timeEntries, companies, stakeholders, projects, subProjects, tasks, activityTypes, teamMembers] = await Promise.all([
      api.getUsers(),
      api.getTimeEntries(),
      api.getCompanies(),
      api.getStakeholders(),
      api.getProjects(),
      api.getSubProjects(),
      api.getTasks(),
      api.getActivityTypes(),
      api.getTeamMembers(),
    ]);
    return { users, timeEntries, companies, stakeholders, projects, subProjects, tasks, activityTypes, teamMembers };
  },

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

  // TaskKeep endpoints
  getTaskDays: () => api.request('/taskKeep'),
  createTaskDay: (date) => api.request('/taskKeep', 'POST', { date }),
  updateTaskDay: (dayId, data) => api.request(`/taskKeep/${dayId}`, 'PUT', data),
  deleteTaskDay: (dayId) => api.request(`/taskKeep/${dayId}`, 'DELETE'),
  addTaskToDay: (dayId, taskData) => api.request(`/taskKeep/${dayId}/tasks`, 'POST', taskData),
  updateTaskInDay: (dayId, taskId, taskData) => api.request(`/taskKeep/${dayId}/tasks/${taskId}`, 'PUT', taskData),
  deleteTaskFromDay: (dayId, taskId) => api.request(`/taskKeep/${dayId}/tasks/${taskId}`, 'DELETE'),
  moveTask: (dayId, taskId, targetDate) => api.request(`/taskKeep/${dayId}/tasks/${taskId}/move`, 'POST', { targetDate }),
  generatePlan: (data) => api.request('/taskKeep/generate-plan', 'POST', data),
  executePlan: (data) => api.request('/taskKeep/execute-plan', 'POST', data),
};

export default api;
