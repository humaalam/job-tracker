import * as applicationService from '../services/applicationService.js';

// requireAuth runs first and sets req.userId.
export async function create(req, res) {
  const application = await applicationService.createApplication(req.userId, req.body);
  res.status(201).json({ application });
}

// validate(listQuerySchema, 'query') has already parsed req.query.
export async function list(req, res) {
  const { applications, pagination } = await applicationService.listApplications(
    req.userId,
    req.query,
  );
  res.json({ applications, pagination });
}

// The BOM: an invisible first character. Written as a char code, so it stays visible here.
const UTF8_BOM = String.fromCharCode(0xfeff);

export async function exportCsv(req, res) {
  const csv = await applicationService.exportApplicationsCsv(req.userId, req.query);
  const today = new Date().toISOString().slice(0, 10);
  // Content-Disposition: attachment makes the browser download it as a file.
  res.attachment(`applications-${today}.csv`);
  res.type('text/csv');
  // The BOM (an invisible first character) tells Excel the file is UTF-8,
  // so names like "Zürich" don't come out garbled.
  res.send(`${UTF8_BOM}${csv}`);
}

export async function getOne(req, res) {
  const application = await applicationService.getApplication(req.userId, req.params.id);
  res.json({ application });
}

export async function update(req, res) {
  const application = await applicationService.updateApplication(
    req.userId,
    req.params.id,
    req.body,
  );
  res.json({ application });
}

export async function changeStatus(req, res) {
  const application = await applicationService.changeStatus(
    req.userId,
    req.params.id,
    req.body.status,
  );
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
