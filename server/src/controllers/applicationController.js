import * as applicationService from '../services/applicationService.js';

// requireAuth runs first and sets req.userId.
export async function create(req, res) {
  const application = await applicationService.createApplication(req.userId, req.body);
  res.status(201).json({ application });
}

export async function list(req, res) {
  const applications = await applicationService.listApplications(req.userId);
  res.json({ applications });
}

export async function getOne(req, res) {
  const application = await applicationService.getApplication(req.userId, req.params.id);
  res.json({ application });
}

export async function update(req, res) {
  const application = await applicationService.updateApplication(req.userId, req.params.id, req.body);
  res.json({ application });
}

export async function changeStatus(req, res) {
  const application = await applicationService.changeStatus(req.userId, req.params.id, req.body.status);
  res.json({ application });
}

export async function history(req, res) {
  const history = await applicationService.getStatusHistory(req.userId, req.params.id);
  res.json({ history });
}

// 204 No Content: it worked, and there is nothing to send back.
export async function remove(req, res) {
  await applicationService.deleteApplication(req.userId, req.params.id);
  res.status(204).end();
}
