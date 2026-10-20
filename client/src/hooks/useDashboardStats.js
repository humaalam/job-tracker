import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/dashboard.js';

// The browser's time zone, e.g. "Europe/Berlin", so weeks start on Monday
// where the user lives (used by the weekly chart).
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Changes to applications and interviews mark ['dashboard'] as out of date,
// so the numbers are fresh the next time the dashboard is shown.
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats', timeZone],
    queryFn: ({ signal }) => getDashboardStats(timeZone, { signal }),
  });
}
