import request from 'supertest';
import { app } from '../../src/app.js';

export const alice = { email: 'alice@example.com', password: 'password123', name: 'Alice' };
export const bob = { email: 'bob@example.com', password: 'password123', name: 'Bob' };

// Registers a user with an agent: a client that keeps cookies between requests, like a browser.
export async function registeredAgent(user = alice) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send(user).expect(201);
  return agent;
}
