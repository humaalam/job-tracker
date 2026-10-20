import { api } from './client.js';

// Lists the user's applications. `params` are the list query parameters
// (page, limit, status, workMode, search, sort, order); empty ones are left out.
// Returns { applications, pagination: { page, limit, total, totalPages } }.
export function listApplications(params = {}, options) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const queryString = query.toString();
  return api.get(`/applications${queryString ? `?${queryString}` : ''}`, options);
}

// Create and update return the saved application; delete returns nothing (204).
export async function createApplication(data) {
  const { application } = await api.post('/applications', data);
  return application;
}

export async function updateApplication(id, data) {
  const { application } = await api.patch(`/applications/${id}`, data);
  return application;
}

// Used by the Kanban board. The server also writes a status history entry.
export async function changeApplicationStatus(id, status) {
  const { application } = await api.patch(`/applications/${id}/status`, { status });
  return application;
}

export function deleteApplication(id) {
  return api.delete(`/applications/${id}`);
}

// One application with its contacts, interviews and statusChanges (all oldest first).
export async function getApplication(id, options) {
  const { application } = await api.get(`/applications/${id}`, options);
  return application;
}
