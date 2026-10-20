import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">There is nothing at this address.</p>
      <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
        Go to the dashboard
      </Link>
    </section>
  );
}
