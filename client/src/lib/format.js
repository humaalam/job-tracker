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
