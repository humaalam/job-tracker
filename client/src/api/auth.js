import { api, ApiError } from './client.js';

// Returns the logged-in user, or null when nobody is logged in (401).
export async function getMe(options) {
  try {
    const { user } = await api.get('/auth/me', options);
    return user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function login({ email, password }) {
  const { user } = await api.post('/auth/login', { email, password });
  return user;
}

export async function register({ name, email, password }) {
  const { user } = await api.post('/auth/register', { name, email, password });
  return user;
}

export function logout() {
  return api.post('/auth/logout');
}
