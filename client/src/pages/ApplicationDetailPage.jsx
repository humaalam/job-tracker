import { Link, useParams } from 'react-router';

export default function ApplicationDetailPage() {
  const { id } = useParams();

  return (
    <section>
      <Link to="/applications" className="text-sm text-blue-600 hover:underline">
        &larr; Back to applications
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Application</h1>
      <p className="mt-2 text-slate-600">
        Details for application <code className="rounded bg-slate-200 px-1">{id}</code> will
        appear here.
      </p>
    </section>
  );
}
