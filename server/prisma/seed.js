import bcrypt from 'bcrypt';
import { prisma } from '../src/db/prisma.js';

// Demo login. Fake data only; never put real credentials in code.
const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'password123';

// Dates are relative to "now" so the dashboard looks fresh whenever you seed.
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);
const daysFromNow = (n) => new Date(Date.now() + n * DAY);

// `path` is the list of statuses the application went through, in order.
// Interview `inDays`: negative = in the past, positive = upcoming.
const applications = [
  {
    company: 'Northwind Labs',
    roleTitle: 'Frontend Developer',
    startedDaysAgo: 3,
    path: ['WISHLIST'],
    details: { workMode: 'REMOTE', jobUrl: 'https://example.com/jobs/northwind-frontend' },
  },
  {
    company: 'Globex',
    roleTitle: 'Full-Stack Engineer',
    startedDaysAgo: 10,
    path: ['WISHLIST', 'APPLIED'],
    details: {
      workMode: 'HYBRID',
      location: 'Chicago, IL',
      salaryMin: 90000,
      salaryMax: 110000,
      resumeVersion: 'v2-fullstack',
    },
  },
  {
    company: 'Initech',
    roleTitle: 'Backend Developer (Node.js)',
    startedDaysAgo: 21,
    path: ['WISHLIST', 'APPLIED', 'INTERVIEWING'],
    details: {
      workMode: 'HYBRID',
      location: 'Austin, TX',
      salaryMin: 95000,
      salaryMax: 120000,
      resumeVersion: 'v2-backend',
      coverLetterVersion: 'initech-1',
      notes: 'Team uses Express + Postgres. Ask about on-call.',
    },
    interviews: [
      {
        type: 'PHONE_SCREEN',
        inDays: -5,
        durationMinutes: 30,
        outcome: 'PASSED',
        interviewers: 'Priya Shah',
      },
      {
        type: 'TECHNICAL',
        inDays: 2,
        durationMinutes: 60,
        locationOrLink: 'https://example.com/meet/initech',
      },
    ],
    contacts: [
      { name: 'Priya Shah', title: 'Technical Recruiter', email: 'priya.shah@example.com' },
    ],
  },
  {
    company: 'Umbrella Health',
    roleTitle: 'Software Engineer',
    startedDaysAgo: 30,
    path: ['APPLIED', 'INTERVIEWING'],
    details: { workMode: 'ONSITE', location: 'Boston, MA', salaryMin: 100000, salaryMax: 125000 },
    interviews: [
      { type: 'PHONE_SCREEN', inDays: -12, durationMinutes: 30, outcome: 'PASSED' },
      {
        type: 'BEHAVIORAL',
        inDays: 5,
        durationMinutes: 45,
        locationOrLink: 'Umbrella HQ, 4th floor',
      },
      { type: 'TAKE_HOME', inDays: 12, notes: 'Due date for the take-home project.' },
    ],
    contacts: [
      {
        name: 'Marcus Lee',
        title: 'Hiring Manager',
        linkedinUrl: 'https://www.linkedin.com/in/example-marcus',
      },
    ],
  },
  {
    company: 'Stark Industries',
    roleTitle: 'React Developer',
    startedDaysAgo: 45,
    path: ['APPLIED', 'INTERVIEWING', 'OFFER'],
    details: {
      workMode: 'REMOTE',
      salaryMin: 115000,
      salaryMax: 130000,
      notes: 'Offer received. Decide by end of month.',
    },
    interviews: [
      { type: 'TECHNICAL', inDays: -25, durationMinutes: 90, outcome: 'PASSED' },
      {
        type: 'FINAL',
        inDays: -18,
        durationMinutes: 120,
        outcome: 'PASSED',
        interviewers: 'Elena Rossi, CTO',
      },
    ],
    contacts: [
      { name: 'Elena Rossi', title: 'Engineering Manager', email: 'elena.rossi@example.com' },
      { name: 'Tom Becker', title: 'Recruiter', phone: '+1 555 0100' },
    ],
  },
  {
    company: 'Wayne Enterprises',
    roleTitle: 'Junior Developer',
    startedDaysAgo: 35,
    path: ['APPLIED', 'REJECTED'],
    details: { workMode: 'ONSITE', location: 'Gotham, NJ' },
  },
  {
    company: 'Hooli',
    roleTitle: 'Platform Engineer',
    startedDaysAgo: 50,
    path: ['APPLIED', 'INTERVIEWING', 'REJECTED'],
    details: {
      workMode: 'HYBRID',
      location: 'Palo Alto, CA',
      salaryMin: 130000,
      salaryMax: 160000,
    },
    interviews: [
      { type: 'PHONE_SCREEN', inDays: -30, durationMinutes: 30, outcome: 'PASSED' },
      {
        type: 'TECHNICAL',
        inDays: -22,
        durationMinutes: 60,
        outcome: 'FAILED',
        notes: 'System design round; review caching.',
      },
    ],
  },
  {
    company: 'Pied Piper',
    roleTitle: 'Full-Stack Developer',
    startedDaysAgo: 40,
    path: ['WISHLIST', 'APPLIED', 'WITHDRAWN'],
    details: { workMode: 'ONSITE', notes: 'Withdrew: relocation required.' },
  },
  {
    company: 'Vandelay Industries',
    roleTitle: 'JavaScript Developer',
    startedDaysAgo: 6,
    path: ['APPLIED'],
    details: { workMode: 'REMOTE', salaryMin: 85000, salaryMax: 100000 },
  },
  {
    company: 'Soylent Corp',
    roleTitle: 'Web Developer',
    startedDaysAgo: 14,
    path: ['APPLIED'],
    details: { workMode: 'HYBRID', location: 'Denver, CO' },
  },
  {
    company: 'Cyberdyne Systems',
    roleTitle: 'Node.js Developer',
    startedDaysAgo: 56,
    path: ['WISHLIST', 'APPLIED'],
    details: { workMode: 'REMOTE', notes: 'No response yet.' },
  },
];

// Turns a status path into StatusChange rows, evenly spaced in the past.
function buildHistory(startedDaysAgo, path) {
  const gap = Math.floor(startedDaysAgo / path.length);
  return path.map((status, i) => ({
    fromStatus: i === 0 ? null : path[i - 1],
    toStatus: status,
    changedAt: daysAgo(startedDaysAgo - i * gap),
  }));
}

async function main() {
  // Re-runnable: deleting the demo user cascades to all of their data.
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: 'Demo User',
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
    },
  });

  // History is backdated, so it is written directly here instead of through
  // the status-change service (which always uses the current time).
  for (const app of applications) {
    const history = buildHistory(app.startedDaysAgo, app.path);
    const applied = history.find((h) => h.toStatus === 'APPLIED');

    await prisma.application.create({
      data: {
        userId: user.id,
        company: app.company,
        roleTitle: app.roleTitle,
        ...app.details,
        status: app.path.at(-1),
        appliedAt: applied?.changedAt ?? null,
        createdAt: history[0].changedAt,
        updatedAt: history.at(-1).changedAt,
        statusChanges: { create: history },
        interviews: {
          create: (app.interviews ?? []).map(({ inDays, ...interview }) => ({
            ...interview,
            scheduledAt: daysFromNow(inDays),
          })),
        },
        contacts: { create: app.contacts ?? [] },
      },
    });
  }

  console.log(
    `Seeded ${applications.length} applications for ${DEMO_EMAIL} (password: ${DEMO_PASSWORD})`,
  );
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
