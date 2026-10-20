import { api, API_BASE } from './client.js';

// { status: 'APPLIED', search: '' } -> "?status=APPLIED". Empty values are left out.
function toQueryString(params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

// Lists the user's applications. `params` are the list query parameters
// (page, limit, status, workMode, search, sort, order).
// Returns { applications, pagination: { page, limit, total, totalPages } }.
export function listApplications(params = {}, options) {
  return api.get(`/applications${toQueryString(params)}`, options);
}

// Not a fetch: the address of the CSV download, used as a link's href. The
// browser then downloads the file itself, with the auth cookie (same origin).
// Takes the same filters and sorting as the list, without paging.
export function exportCsvUrl(params = {}) {
  return `${API_BASE}/applications/export.csv${toQueryString(params)}`;
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
