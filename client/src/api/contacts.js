import { api } from './client.js';

// There is no list call here: the detail page already gets the contacts
// with GET /applications/:id (oldest first).

// Create and update return the saved contact; delete returns nothing (204).
export async function createContact(applicationId, data) {
  const { contact } = await api.post(`/applications/${applicationId}/contacts`, data);
  return contact;
}

export async function updateContact(id, data) {
  const { contact } = await api.patch(`/contacts/${id}`, data);
  return contact;
}

export function deleteContact(id) {
  return api.delete(`/contacts/${id}`);
}
