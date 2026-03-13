import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API methods
export const alertsApi = {
  // Obtener alertas actuales con filtros
  getCurrent: (params = {}) => api.get('/alerts/current', { params }),
  
  // Obtener estadísticas
  getStats: () => api.get('/alerts/stats'),
  
  // Obtener detalle de una alerta
  getDetail: (fingerprint) => api.get(`/alerts/current/${fingerprint}`),
  
  // Reconocer alerta
  acknowledge: (fingerprint, data) => api.post(`/alerts/current/${fingerprint}/ack`, data),
  
  // Quitar reconocimiento
  unacknowledge: (fingerprint) => api.delete(`/alerts/current/${fingerprint}/ack`),
  
  // Obtener historial
  getHistory: (fingerprint) => api.get(`/alerts/history/${fingerprint}`)
};

export const silencesApi = {
  // Listar silencios
  list: (activeOnly = true) => api.get('/silences', { params: { active_only: activeOnly } }),
  
  // Crear silencio
  create: (data) => api.post('/silences', data),
  
  // Eliminar silencio
  delete: (id) => api.delete(`/silences/${id}`),
  
  // Extender silencio
  extend: (id, newExpiresAt) => api.put(`/silences/${id}/extend`, { new_expires_at: newExpiresAt })
};

export const incidentsApi = {
  getActive: () => api.get('/incidents/active'),
  list: (params = {}) => api.get('/incidents', { params }),
  create: (data) => api.post('/incidents', data),
  finalize: (id, data) => api.post(`/incidents/${id}/finalize`, data),
  addUpdate: (id, data) => api.post(`/incidents/${id}/updates`, data),
};

export const healthApi = {
  check: () => api.get('/health')
};

export default api;
