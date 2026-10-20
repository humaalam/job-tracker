import { prisma } from '../db/prisma.js';
import { STATUSES } from '../validators/applications.js';
import { listUpcomingInterviews } from './interviewService.js';

// Moving from APPLIED to one of these means the company answered.
const RESPONSE_STATUSES = ['INTERVIEWING', 'OFFER', 'REJECTED'];
const WEEKS = 12;

// { WISHLIST: 3, APPLIED: 5, ... } with a 0 for statuses that have no applications.
async function countByStatus(userId) {
  // One SQL query: SELECT status, COUNT(*) ... GROUP BY status.
  const groups = await prisma.application.groupBy({
    by: ['status'],
    where: { userId },
    _count: { _all: true },
  });
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const g of groups) {
    counts[g.status] = g._count._all;
  }
  return counts;
}

// Applications whose history contains a move to one of these statuses.
const reached = (statuses) => ({ statusChanges: { some: { toStatus: { in: statuses } } } });

// Uses the history, not the current status: an application that went
// APPLIED -> INTERVIEWING -> back to APPLIED still got a response.
async function responseRate(userId) {
  const [applied, responded] = await Promise.all([
    prisma.application.count({ where: { userId, ...reached(['APPLIED']) } }),
    // Only applications that were also APPLIED, so the rate can't go above 1.
    prisma.application.count({
      where: { userId, AND: [reached(['APPLIED']), reached(RESPONSE_STATUSES)] },
    }),
  ]);
  // Nothing applied yet: there is no rate (null), which is different from 0%.
  return applied === 0 ? null : responded / applied;
}

// [{ weekStart: '2026-08-03', count: 1 }, ...] for the last 12 weeks, oldest
// first, including weeks with 0. Weeks start on Monday in the time zone `tz`.
async function applicationsPerWeek(userId, tz, now) {
  // Raw SQL, because Prisma's query API can't group by "week in a time zone".
  // ${...} values are sent as query parameters, never pasted into the SQL,
  // so they can't inject SQL. appliedAt is stored as UTC without a zone, so
  // it is first marked as UTC, then converted to the user's local time.
  return prisma.$queryRaw`
    WITH this_week AS (
      SELECT date_trunc('week', ${now.toISOString()}::timestamptz AT TIME ZONE ${tz}::text) AS start
    ),
    weeks AS (
      SELECT generate_series(start - ${WEEKS - 1}::int * interval '1 week', start, interval '1 week') AS week_start
      FROM this_week
    )
    SELECT to_char(w.week_start, 'YYYY-MM-DD') AS "weekStart", count(a.id)::int AS count
    FROM weeks w
    LEFT JOIN "Application" a
      ON a."userId" = ${userId}::uuid
      AND date_trunc('week', (a."appliedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}::text) = w.week_start
    GROUP BY w.week_start
    ORDER BY w.week_start
  `;
}

export async function getStats(userId, { tz }) {
  const now = new Date();
  // The four parts don't depend on each other, so run them at the same time.
  const [countsByStatus, rate, perWeek, upcomingInterviews] = await Promise.all([
    countByStatus(userId),
    responseRate(userId),
    applicationsPerWeek(userId, tz, now),
    listUpcomingInterviews(userId, 7),
  ]);
  const total = Object.values(countsByStatus).reduce((sum, n) => sum + n, 0);
  return {
    countsByStatus,
    total,
    applicationsPerWeek: perWeek,
    responseRate: rate,
    upcomingInterviews,
  };
}
