import { api } from './client.js';

// There is no list call here: the detail page already gets the interviews
// with GET /applications/:id (soonest first).

// Create and update return the saved interview; delete returns nothing (204).
export async function createInterview(applicationId, data) {
  const { interview } = await api.post(`/applications/${applicationId}/interviews`, data);
  return interview;
}

export async function updateInterview(id, data) {
  const { interview } = await api.patch(`/interviews/${id}`, data);
  return interview;
}

export function deleteInterview(id) {
  return api.delete(`/interviews/${id}`);
}
