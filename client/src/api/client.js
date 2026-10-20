// Every API address starts with this (in development the Vite proxy forwards it).
export const API_BASE = '/api';

// Thrown for every failed API call. The UI shows `message`; code can check
// `status` (e.g. 401 = not logged in) and `details` (zod validation issues).
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Calls our API at /api/<path>. Sends `body` as JSON, parses JSON replies,
// and turns error replies ({ error: { message, details } }) into an ApiError.
export async function apiFetch(path, { body, headers, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      // Send the auth cookie. Same-origin requests send it anyway; this keeps
      // it working if the API is ever on a different origin.
      credentials: 'include',
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // A cancelled request (TanStack Query aborts ones it no longer needs) is not a real error.
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  }

  // 204 No Content (logout, delete) has no body to parse.
  if (response.status === 204) return null;

  // Some errors (e.g. a proxy error while the API is down) have no JSON body.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const fallback =
      response.status >= 500
        ? 'The server is not available right now. Please try again.'
        : `Request failed (${response.status})`;
    throw new ApiError(data?.error?.message ?? fallback, response.status, data?.error?.details);
  }
  return data;
}

// Shorthands, so callers write api.post('/auth/login', { email, password }).
export const api = {
  get: (path, options) => apiFetch(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiFetch(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => apiFetch(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiFetch(path, { ...options, method: 'DELETE' }),
};
