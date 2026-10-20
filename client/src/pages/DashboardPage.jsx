import { useHealth } from '../hooks/useHealth.js';

export default function DashboardPage() {
  const health = useHealth();

  return (
    <section>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-slate-600">Stats and upcoming interviews will appear here.</p>
      {/* Temporary check that the client can reach the API; replaced by the real dashboard */}
      <p className="mt-4 text-sm">
        API:{' '}
        {health.isPending && <span className="text-slate-500">checking…</span>}
        {health.isError && <span className="text-red-600">{health.error.message}</span>}
        {health.isSuccess && <span className="text-green-700">connected</span>}
      </p>
    </section>
  );
}
