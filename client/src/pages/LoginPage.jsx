import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import TextField from '../components/ui/TextField.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // On success the user is stored, and GuestLayout redirects away from this page.
  const loginMutation = useMutation({ mutationFn: login });
  const error = loginMutation.error;
  const fieldErrors = error?.details?.fieldErrors ?? {};

  function handleSubmit(event) {
    event.preventDefault();
    loginMutation.mutate({ email, password });
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Log in</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && !error.details && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message}
          </p>
        )}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email?.[0]}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password?.[0]}
        />
        <Button type="submit" disabled={loginMutation.isPending} className="w-full">
          {loginMutation.isPending ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      {import.meta.env.DEV && (
        <p className="mt-4 text-xs text-slate-500">
          Demo account: demo@example.com / password123
        </p>
      )}
      <p className="mt-4 text-sm text-slate-600">
        No account?{' '}
        {/* Pass the state on, so "where they were going" survives the switch */}
        <Link to="/register" state={location.state} className="text-blue-600 hover:underline">
          Register
        </Link>
      </p>
    </>
  );
}
