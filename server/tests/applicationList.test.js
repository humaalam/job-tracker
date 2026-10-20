import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb, prisma } from './helpers/db.js';
import { alice, bob, registeredAgent } from './helpers/auth.js';

// Inserted directly (not through the API) so updatedAt/appliedAt are fixed
// and the expected order is easy to read. Row i was updated on Jan i+1.
const rows = [
  { company: 'Acme', roleTitle: 'Frontend Developer', status: 'WISHLIST', workMode: 'REMOTE' },
  { company: 'Globex', roleTitle: 'Backend Engineer', status: 'APPLIED', workMode: 'HYBRID', location: 'Chicago', appliedAt: day(2), salaryMax: 120000 },
  { company: 'Initech', roleTitle: 'Full-Stack Developer', status: 'INTERVIEWING', workMode: 'ONSITE', appliedAt: day(1), salaryMax: 90000 },
  { company: 'Hooli', roleTitle: 'Platform Engineer', status: 'REJECTED', workMode: 'REMOTE', appliedAt: day(3) },
  { company: 'Umbrella', roleTitle: 'React developer', status: 'APPLIED', workMode: 'REMOTE', appliedAt: day(4) },
];

function day(n) {
  return new Date(Date.UTC(2026, 0, n));
}

let agent;
beforeEach(async () => {
  await resetDb();
  agent = await registeredAgent(alice);
  const user = await prisma.user.findUnique({ where: { email: alice.email } });
  for (const [i, row] of rows.entries()) {
    await prisma.application.create({ data: { ...row, userId: user.id, updatedAt: day(i + 1) } });
  }
});
afterAll(() => prisma.$disconnect());

// GET /api/applications with a query string; returns companies in order + the response body.
async function list(query = '') {
  const res = await agent.get(`/api/applications${query}`).expect(200);
  return { companies: res.body.applications.map((a) => a.company), body: res.body };
}

describe('GET /api/applications: defaults', () => {
  it('returns page 1, most recently updated first, with pagination info', async () => {
    const { companies, body } = await list();

    expect(companies).toEqual(['Umbrella', 'Hooli', 'Initech', 'Globex', 'Acme']);
    expect(body.pagination).toEqual({ page: 1, limit: 20, total: 5, totalPages: 1 });
  });

  it("never includes another user's applications", async () => {
    const bobAgent = await registeredAgent(bob);
    await bobAgent.post('/api/applications').send({ company: 'Bob Co', roleTitle: 'Dev', workMode: 'REMOTE' });

    const { companies, body } = await list('?workMode=REMOTE&search=co');

    expect(companies).not.toContain('Bob Co');
    expect(body.pagination.total).toBe(0);
  });
});

describe('filters', () => {
  it('filters by one status', async () => {
    const { companies } = await list('?status=APPLIED');

    expect(companies).toEqual(['Umbrella', 'Globex']);
  });

  it('filters by several statuses, comma-separated', async () => {
    const { companies } = await list('?status=WISHLIST,REJECTED');

    expect(companies).toEqual(['Hooli', 'Acme']);
  });

  it('filters by work mode', async () => {
    const { companies } = await list('?workMode=ONSITE,HYBRID');

    expect(companies).toEqual(['Initech', 'Globex']);
  });

  it('searches company, role title and location, ignoring case', async () => {
    expect((await list('?search=ACME')).companies).toEqual(['Acme']);
    expect((await list('?search=developer')).companies).toEqual(['Umbrella', 'Initech', 'Acme']);
    expect((await list('?search=chicago')).companies).toEqual(['Globex']);
  });

  it('combines filters with AND', async () => {
    const { companies, body } = await list('?status=APPLIED&workMode=REMOTE&search=react');

    expect(companies).toEqual(['Umbrella']);
    expect(body.pagination.total).toBe(1);
  });

  it('ignores an empty search', async () => {
    const { body } = await list('?search=%20%20');

    expect(body.pagination.total).toBe(5);
  });
});

describe('sorting', () => {
  it('sorts by company A→Z', async () => {
    const { companies } = await list('?sort=company&order=asc');

    expect(companies).toEqual(['Acme', 'Globex', 'Hooli', 'Initech', 'Umbrella']);
  });

  it('sorts by status in pipeline order (the enum order), not alphabetically', async () => {
    const { companies } = await list('?sort=status&order=asc');

    expect(companies).toEqual(['Acme', 'Globex', 'Umbrella', 'Initech', 'Hooli']);
  });

  it('keeps empty appliedAt / salaryMax at the end in both directions', async () => {
    expect((await list('?sort=appliedAt&order=desc')).companies).toEqual(['Umbrella', 'Hooli', 'Globex', 'Initech', 'Acme']);
    expect((await list('?sort=appliedAt&order=asc')).companies).toEqual(['Initech', 'Globex', 'Hooli', 'Umbrella', 'Acme']);
    expect((await list('?sort=salaryMax&order=asc')).companies.slice(0, 2)).toEqual(['Initech', 'Globex']);
  });
});

describe('pagination', () => {
  it('returns the requested page and the totals', async () => {
    const { companies, body } = await list('?limit=2&page=2');

    expect(companies).toEqual(['Initech', 'Globex']);
    expect(body.pagination).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
  });

  it('returns an empty list for a page past the end', async () => {
    const { companies, body } = await list('?limit=2&page=9');

    expect(companies).toEqual([]);
    expect(body.pagination.total).toBe(5);
  });
});

describe('invalid query', () => {
  it.each([
    ['status', '?status=APPLIED,HIRED'],
    ['workMode', '?workMode=MARS'],
    ['sort', '?sort=passwordHash'],
    ['order', '?order=sideways'],
    ['page', '?page=0'],
    ['limit', '?limit=1000'],
  ])('returns 400 for a bad %s', async (field, query) => {
    const res = await agent.get(`/api/applications${query}`);

    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors).toHaveProperty(field);
  });
});
