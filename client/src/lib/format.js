// Display names for the enum values the API sends (same values as schema.prisma).
export const STATUS_LABELS = {
  WISHLIST: 'Wishlist',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export const WORK_MODE_LABELS = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
};

export const INTERVIEW_TYPE_LABELS = {
  PHONE_SCREEN: 'Phone screen',
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  TAKE_HOME: 'Take-home',
  ONSITE: 'On-site',
  FINAL: 'Final',
  OTHER: 'Other',
};

export const INTERVIEW_OUTCOME_LABELS = {
  PENDING: 'Pending',
  PASSED: 'Passed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

// "20 Oct 2026" style, in the browser's language and time zone. '—' when empty.
export function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

// "$80,000–$100,000", "from $80,000", "up to $100,000", or '—' when no salary is set.
export function formatSalary({ salaryMin, salaryMax, salaryCurrency }) {
  if (salaryMin == null && salaryMax == null) return '—';
  const money = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: salaryCurrency,
    maximumFractionDigits: 0,
  });
  if (salaryMin != null && salaryMax != null) return money.formatRange(salaryMin, salaryMax);
  return salaryMin != null ? `from ${money.format(salaryMin)}` : `up to ${money.format(salaryMax)}`;
}

// "20 Oct 2026, 15:30" style, in the browser's language and time zone.
export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// 0.4545 -> "45%", in the browser's language. '—' when there is no value.
export function formatPercent(fraction) {
  if (fraction == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0 }).format(
    fraction,
  );
}

// Only http(s) addresses become links. Anything else (e.g. "javascript:...")
// could run code when clicked, so it is shown as plain text instead.
export function isWebUrl(text) {
  return /^https?:\/\//i.test(text ?? '');
}
