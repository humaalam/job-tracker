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
