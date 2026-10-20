import { STATUS_LABELS, WORK_MODE_LABELS } from './format.js';

// Allowed values, in display order (same lists as the server's validators).
export const STATUSES = Object.keys(STATUS_LABELS);
export const WORK_MODES = Object.keys(WORK_MODE_LABELS);

export const SORT_LABELS = {
  updatedAt: 'Last updated',
  createdAt: 'Date added',
  appliedAt: 'Date applied',
  company: 'Company',
  roleTitle: 'Role',
  status: 'Status',
  salaryMax: 'Max salary',
};
export const DEFAULT_SORT = 'updatedAt';
export const DEFAULT_ORDER = 'desc';

// "APPLIED,OFFER" -> ['APPLIED', 'OFFER'], dropping unknown values.
function parseList(value, allowed) {
  if (!value) return [];
  return value.split(',').filter((item) => allowed.includes(item));
}

// Reads the filters from the URL. Bad values (e.g. a hand-edited ?sort=foo)
// fall back to the defaults, so the API never gets a request it would reject.
export function filtersFromSearchParams(searchParams) {
  const sort = searchParams.get('sort');
  const order = searchParams.get('order');
  return {
    status: parseList(searchParams.get('status'), STATUSES),
    workMode: parseList(searchParams.get('workMode'), WORK_MODES),
    search: searchParams.get('search') ?? '',
    sort: Object.hasOwn(SORT_LABELS, sort ?? '') ? sort : DEFAULT_SORT,
    order: order === 'asc' || order === 'desc' ? order : DEFAULT_ORDER,
  };
}

// Returns a copy of the URL parameters with `changes` applied, e.g. { sort: 'company' }.
// Empty and default values are removed to keep the URL short. A new filter
// means a new result list, so it always goes back to page 1.
export function applyFilterChanges(searchParams, changes) {
  const next = new URLSearchParams(searchParams);
  for (const [key, value] of Object.entries(changes)) {
    const text = Array.isArray(value) ? value.join(',') : value;
    const isDefault =
      text === '' ||
      (key === 'sort' && text === DEFAULT_SORT) ||
      (key === 'order' && text === DEFAULT_ORDER);
    if (isDefault) next.delete(key);
    else next.set(key, text);
  }
  next.delete('page');
  return next;
}

// True when something narrows the list (sorting doesn't count).
export function hasActiveFilters({ status, workMode, search }) {
  return status.length > 0 || workMode.length > 0 || search.trim() !== '';
}
