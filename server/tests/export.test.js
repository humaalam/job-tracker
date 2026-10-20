import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { resetDb, prisma } from './helpers/db.js';
import { bob, registeredAgent } from './helpers/auth.js';
import { createAs } from './helpers/applications.js';

let agent;
beforeEach(async () => {
  await resetDb();
  agent = await registeredAgent();
});
afterAll(() => prisma.$disconnect());

const UTF8_BOM = String.fromCharCode(0xfeff);

const HEADER =
  'Company,Role,Status,Applied at,Location,Work mode,Salary min,Salary max,Currency,' +
  'Job URL,Resume version,Cover letter version,Notes,Created at,Updated at';

// Downloads the CSV and splits it into lines (without the BOM and the final empty line).
async function exportCsv(query = '') {
  const res = await agent.get(`/api/applications/export.csv${query}`).expect(200);
  const lines = res.text.replace(UTF8_BOM, '').split('\r\n').slice(0, -1);
  return { res, lines };
}

it('returns 401 without a cookie', async () => {
  await request(app).get('/api/applications/export.csv').expect(401);
});

it('downloads a UTF-8 CSV file named after today', async () => {
  const { res } = await exportCsv();

  expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
  // Express only adds quotes around the filename when it needs them.
  expect(res.headers['content-disposition']).toMatch(
    /^attachment; filename="?applications-\d{4}-\d{2}-\d{2}\.csv"?$/,
  );
  expect(res.text.startsWith(UTF8_BOM)).toBe(true);
});

it('has only the header row when there are no applications', async () => {
  const { lines } = await exportCsv();

  expect(lines).toEqual([HEADER]);
});

it('writes one row per application with all columns', async () => {
  const created = await createAs(agent, {
    company: 'Globex',
    roleTitle: 'Full-Stack Engineer',
    status: 'APPLIED',
    location: 'Zürich',
    workMode: 'HYBRID',
    salaryMin: 90000,
    salaryMax: 110000,
    salaryCurrency: 'CHF',
    jobUrl: 'https://globex.example/jobs/1',
    notes: 'Met them at a meetup, "very" friendly',
  });

  const { lines } = await exportCsv();

  expect(lines).toEqual([
    HEADER,
    [
      'Globex',
      'Full-Stack Engineer',
      'APPLIED',
      created.appliedAt,
      'Zürich',
      'HYBRID',
      '90000',
      '110000',
      'CHF',
      'https://globex.example/jobs/1',
      '', // no resume version
      '', // no cover letter version
      '"Met them at a meetup, ""very"" friendly"',
      created.createdAt,
      created.updatedAt,
    ].join(','),
  ]);
});

it("exports only my applications, not Bob's", async () => {
  await createAs(agent, { company: 'Mine', roleTitle: 'Dev' });
  const bobAgent = await registeredAgent(bob);
  await createAs(bobAgent, { company: 'Bobs', roleTitle: 'Dev' });

  const { lines } = await exportCsv();

  expect(lines).toHaveLength(2);
  expect(lines[1]).toMatch(/^Mine,/);
});

describe('filters and sorting', () => {
  beforeEach(async () => {
    await createAs(agent, { company: 'Acme', roleTitle: 'Frontend Developer', status: 'APPLIED' });
    await createAs(agent, {
      company: 'Initech',
      roleTitle: 'Backend Developer',
      status: 'WISHLIST',
    });
    await createAs(agent, { company: 'Hooli', roleTitle: 'Platform Engineer', status: 'APPLIED' });
  });

  const companies = (lines) => lines.slice(1).map((line) => line.split(',')[0]);

  it('applies the same filters and sorting as the list', async () => {
    const { lines } = await exportCsv('?status=APPLIED&sort=company&order=asc');

    expect(companies(lines)).toEqual(['Acme', 'Hooli']);
  });

  it('applies the search', async () => {
    const { lines } = await exportCsv('?search=developer&sort=company&order=asc');

    expect(companies(lines)).toEqual(['Acme', 'Initech']);
  });

  it('returns 400 for an invalid filter', async () => {
    const res = await agent.get('/api/applications/export.csv?status=HIRED');

    expect(res.status).toBe(400);
    expect(res.body.error.details.fieldErrors).toHaveProperty('status');
  });
});

it('is not paginated: exports every application, ignoring page and limit', async () => {
  const user = await prisma.user.findFirst();
  await prisma.application.createMany({
    data: Array.from({ length: 25 }, (_, i) => ({
      userId: user.id,
      company: `Company ${i}`,
      roleTitle: 'Dev',
    })),
  });

  const { lines } = await exportCsv('?page=2&limit=5');

  expect(lines).toHaveLength(1 + 25);
});
