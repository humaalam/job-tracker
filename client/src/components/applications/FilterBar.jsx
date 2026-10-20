import { useId } from 'react';
import {
  SORT_LABELS,
  STATUSES,
  WORK_MODES,
  hasActiveFilters,
} from '../../lib/applicationFilters.js';
import { STATUS_LABELS, WORK_MODE_LABELS } from '../../lib/format.js';

const inputClass =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900';

// An on/off button. aria-pressed tells screen readers whether it is selected.
function ToggleChip({ pressed, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        pressed
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

// Adds `value` to the list, or removes it if it's already there.
function toggle(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

// Controlled component: the page owns the filters (in the URL) and passes
// them in. Every change is reported as a small object, e.g. { status: [...] }.
export default function FilterBar({ filters, onChange }) {
  const id = useId();

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <label htmlFor={`${id}-search`} className="block text-sm font-medium text-slate-700">
            Search
          </label>
          <input
            id={`${id}-search`}
            type="search"
            placeholder="Company, role or location"
            maxLength={100}
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            className={`mt-1 block w-full ${inputClass}`}
          />
        </div>
        <div>
          <label htmlFor={`${id}-sort`} className="block text-sm font-medium text-slate-700">
            Sort by
          </label>
          <select
            id={`${id}-sort`}
            value={filters.sort}
            onChange={(event) => onChange({ sort: event.target.value })}
            className={`mt-1 block ${inputClass}`}
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-order`} className="block text-sm font-medium text-slate-700">
            Order
          </label>
          <select
            id={`${id}-order`}
            value={filters.order}
            onChange={(event) => onChange({ order: event.target.value })}
            className={`mt-1 block ${inputClass}`}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* role="group" + aria-label names the set of buttons for screen readers */}
        <div role="group" aria-label="Status" className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Status:</span>
          {STATUSES.map((status) => (
            <ToggleChip
              key={status}
              pressed={filters.status.includes(status)}
              onClick={() => onChange({ status: toggle(filters.status, status) })}
            >
              {STATUS_LABELS[status]}
            </ToggleChip>
          ))}
        </div>
        <div role="group" aria-label="Work mode" className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Work mode:</span>
          {WORK_MODES.map((workMode) => (
            <ToggleChip
              key={workMode}
              pressed={filters.workMode.includes(workMode)}
              onClick={() => onChange({ workMode: toggle(filters.workMode, workMode) })}
            >
              {WORK_MODE_LABELS[workMode]}
            </ToggleChip>
          ))}
        </div>
        {hasActiveFilters(filters) && (
          <button
            type="button"
            onClick={() => onChange({ status: [], workMode: [], search: '' })}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
