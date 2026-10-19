import * as authService from '../services/authService.js';

export async function register(req, res) {
  const user = await authService.register(req.body);
  res.status(201).json({ user });
}
