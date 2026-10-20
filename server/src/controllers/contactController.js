import * as contactService from '../services/contactService.js';

// GET /applications/:id/contacts
export async function list(req, res) {
  const contacts = await contactService.listContacts(req.userId, req.params.id);
  res.json({ contacts });
}

// POST /applications/:id/contacts
export async function create(req, res) {
  const contact = await contactService.createContact(req.userId, req.params.id, req.body);
  res.status(201).json({ contact });
}

export async function update(req, res) {
  const contact = await contactService.updateContact(req.userId, req.params.contactId, req.body);
  res.json({ contact });
}

export async function remove(req, res) {
  await contactService.deleteContact(req.userId, req.params.contactId);
  res.status(204).end();
}
