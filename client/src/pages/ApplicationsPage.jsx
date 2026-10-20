import { Link } from 'react-router';

export default function ApplicationsPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Applications</h1>
      <p className="mt-2 text-slate-600">The table and Kanban board will appear here.</p>
      {/* Temporary link to try the detail route; removed when the table is built */}
      <Link to="/applications/example-id" className="mt-4 inline-block text-blue-600 hover:underline">
        Open an example application
      </Link>
    </section>
  );
}
