import * as dashboardService from '../services/dashboardService.js';

// validate(statsQuerySchema, 'query') has already checked ?tz (default UTC).
export async function stats(req, res) {
  const stats = await dashboardService.getStats(req.userId, req.query);
  res.json(stats);
}
