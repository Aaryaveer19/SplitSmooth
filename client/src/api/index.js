import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Trips ──────────────────────────────────────
export const getTrips = () => api.get('/trips').then((r) => r.data);
export const getTrip = (id) => api.get(`/trips/${id}`).then((r) => r.data);
export const createTrip = (data) => api.post('/trips', data).then((r) => r.data);
export const deleteTrip = (id) => api.delete(`/trips/${id}`).then((r) => r.data);

// ── Members ────────────────────────────────────
export const getMembers = (tripId) => api.get(`/trips/${tripId}/members`).then((r) => r.data);
export const addMembers = (tripId, names) => api.post(`/trips/${tripId}/members`, { names }).then((r) => r.data);
export const deleteMember = (id) => api.delete(`/members/${id}`).then((r) => r.data);

// ── Events ─────────────────────────────────────
export const getEvents = (tripId) => api.get(`/trips/${tripId}/events`).then((r) => r.data);
export const getEvent = (id) => api.get(`/events/${id}`).then((r) => r.data);
export const createEvent = (tripId, data) => api.post(`/trips/${tripId}/events`, data).then((r) => r.data);
export const deleteEvent = (id) => api.delete(`/events/${id}`).then((r) => r.data);

// ── Balances & Settlements ─────────────────────
export const getBalances = (tripId) => api.get(`/trips/${tripId}/balances`).then((r) => r.data);
export const getSettlements = (tripId) => api.get(`/trips/${tripId}/settlements`).then((r) => r.data);

export default api;
