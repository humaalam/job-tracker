import * as interviewService from '../services/interviewService.js';

// GET /applications/:id/interviews
export async function list(req, res) {
  const interviews = await interviewService.listInterviews(req.userId, req.params.id);
  res.json({ interviews });
}

// POST /applications/:id/interviews
export async function create(req, res) {
  const interview = await interviewService.createInterview(req.userId, req.params.id, req.body);
  res.status(201).json({ interview });
}

export async function update(req, res) {
  const interview = await interviewService.updateInterview(req.userId, req.params.interviewId, req.body);
  res.json({ interview });
}

export async function remove(req, res) {
  await interviewService.deleteInterview(req.userId, req.params.interviewId);
  res.status(204).end();
}

// validate(upcomingQuerySchema, 'query') has already turned ?days into a number.
export async function upcoming(req, res) {
  const interviews = await interviewService.listUpcomingInterviews(req.userId, req.query.days);
  res.json({ interviews });
}
