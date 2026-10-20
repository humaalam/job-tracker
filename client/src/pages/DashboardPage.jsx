import { useState } from 'react';
import ApplicationFormModal from '../components/applications/ApplicationFormModal.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import StatusCounts from '../components/dashboard/StatusCounts.jsx';
import WeeklyChart from '../components/dashboard/WeeklyChart.jsx';
import UpcomingInterviews from '../components/interviews/UpcomingInterviews.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorMessage from '../components/ui/ErrorMessage.jsx';
import LoadingMessage from '../components/ui/LoadingMessage.jsx';
import { useDashboardStats } from '../hooks/useDashboardStats.js';
import { formatPercent } from '../lib/format.js';

export default function DashboardPage() {
  const { data: stats, isPending, isError, error, refetch } = useDashboardStats();
  const [isCreating, setIsCreating] = useState(false);

  const heading = <h1 className="text-2xl font-bold">Dashboard</h1>;

  if (isPending) {
    return (
      <section className="space-y-6">
        {heading}
        <LoadingMessage>Loading dashboard…</LoadingMessage>
      </section>
    );
  }

  // Only when there is nothing to show. If a later refresh fails, the numbers
  // we already have stay on screen with the error above them (see below).
  if (isError && !stats) {
    return (
      <section className="space-y-6">
        {heading}
        <ErrorMessage onRetry={refetch}>{error.message}</ErrorMessage>
      </section>
    );
  }

  // A new account: zeros and empty charts wouldn't help, so say what to do first.
  if (stats.total === 0) {
    return (
      <section className="space-y-6">
        {heading}
        <EmptyState
          title="Welcome! Let's add your first application"
          action={<Button onClick={() => setIsCreating(true)}>Add your first application</Button>}
        >
          Once you track a few applications, your numbers, weekly progress and upcoming interviews
          show up here.
        </EmptyState>
        {isCreating && <ApplicationFormModal onClose={() => setIsCreating(false)} />}
      </section>
    );
  }

  // Applications still in progress: sent, but no final answer yet.
  const active = stats.countsByStatus.APPLIED + stats.countsByStatus.INTERVIEWING;

  return (
    <section>
      {heading}

      {isError && (
        <ErrorMessage onRetry={refetch} className="mt-4">
          Couldn&apos;t refresh the numbers: {error.message}
        </ErrorMessage>
      )}

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
        <StatCard
          label="Interviews this week"
          value={stats.upcomingInterviews.length}
          hint="Next 7 days"
        />
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
