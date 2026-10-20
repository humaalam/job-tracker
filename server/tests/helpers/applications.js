export const newApplication = { company: 'Globex', roleTitle: 'Full-Stack Engineer' };
export const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

// Creates an application as the given agent and returns it.
export async function createAs(agent, data = newApplication) {
  const res = await agent.post('/api/applications').send(data).expect(201);
  return res.body.application;
}
