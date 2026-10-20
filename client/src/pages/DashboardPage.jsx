import StatCard from '../components/dashboard/StatCard.jsx';
import StatusCounts from '../components/dashboard/StatusCounts.jsx';
import WeeklyChart from '../components/dashboard/WeeklyChart.jsx';
import UpcomingInterviews from '../components/interviews/UpcomingInterviews.jsx';
import { useDashboardStats } from '../hooks/useDashboardStats.js';
import { formatPercent } from '../lib/format.js';

export default function DashboardPage() {
  const { data: stats, isPending, isError, error } = useDashboardStats();

  if (isPending) {
    return <p className="text-slate-500">Loading dashboard…</p>;
  }

  if (isError) {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        {error.message}
      </p>
    );
  }

  // Applications still in progress: sent, but no final answer yet.
  const active = stats.countsByStatus.APPLIED + stats.countsByStatus.INTERVIEWING;

  return (
    <section>
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total applications" value={stats.total} />
        <StatCard label="In progress" value={active} hint="Applied or interviewing" />
        <StatCard
          label="Response rate"
          value={formatPercent(stats.responseRate)}
          hint={
            stats.responseRate == null
              ? 'Shown once you have applied somewhere'
              : 'Applications that got an interview, offer or rejection'
          }
        />
        <StatCard label="Interviews this week" value={stats.upcomingInterviews.length} hint="Next 7 days" />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Applications per week</h2>
        <p className="mb-4 text-sm text-slate-500">Last 12 weeks, by the date you applied</p>
        <WeeklyChart weeks={stats.applicationsPerWeek} />
      </div>

      {/* items-start: each card is only as tall as its own content */}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">By status</h2>
          <StatusCounts countsByStatus={stats.countsByStatus} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Upcoming interviews</h2>
          <UpcomingInterviews interviews={stats.upcomingInterviews} />
        </div>
      </div>
    </section>
  );
}
