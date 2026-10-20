import { api } from './client.js';

// Returns { countsByStatus, total, applicationsPerWeek, responseRate, upcomingInterviews }.
// `timeZone` (e.g. "Europe/Berlin") decides where each week starts.
export function getDashboardStats(timeZone, options) {
  const query = new URLSearchParams({ tz: timeZone });
  return api.get(`/dashboard/stats?${query}`, options);
}
