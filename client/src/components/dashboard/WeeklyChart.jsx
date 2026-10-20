import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { parseDateOnly } from '../../lib/format.js';

// Recharts draws SVG, so it needs real colors instead of Tailwind classes.
// These are Tailwind's blue-600, slate-200, slate-100 and slate-500.
const COLORS = { bar: '#2563eb', grid: '#e2e8f0', hover: '#f1f5f9', axisText: '#64748b' };

// "12 Oct" (axis) / "12 Oct 2026" (tooltip), in the browser's language.
const shortWeek = (weekStart) =>
  parseDateOnly(weekStart).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const longWeek = (weekStart) =>
  parseDateOnly(weekStart).toLocaleDateString(undefined, { dateStyle: 'medium' });

const applicationsText = (count) => `${count} ${count === 1 ? 'application' : 'applications'}`;

// The box shown while hovering a week. Recharts passes `active` (is the mouse
// over a bar?), `payload` (that bar's data) and `label` (its weekStart).
function WeekTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="text-slate-500">Week of {longWeek(label)}</p>
      <p className="font-semibold text-slate-900">{applicationsText(payload[0].value)}</p>
    </div>
  );
}

// Applications sent per week (by applied date), the last 12 weeks, oldest first.
export default function WeeklyChart({ weeks }) {
  if (weeks.every((week) => week.count === 0)) {
    return <p className="text-sm text-slate-500">No applications sent in the last 12 weeks.</p>;
  }

  return (
    <>
      {/* aria-hidden: screen readers get the table below instead of the SVG shapes */}
      <div aria-hidden="true" className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeks} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            {/* Only horizontal lines, light, so the bars stay the loudest thing */}
            <CartesianGrid vertical={false} stroke={COLORS.grid} />
            <XAxis
              dataKey="weekStart"
              tickFormatter={shortWeek}
              tick={{ fill: COLORS.axisText, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: COLORS.grid }}
              // Hide labels that would overlap on narrow screens, keep the first and last.
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: COLORS.axisText, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<WeekTooltip />} cursor={{ fill: COLORS.hover }} />
            {/* Thin bars (max 24px) with rounded tops and square bottoms */}
            <Bar dataKey="count" fill={COLORS.bar} radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* The same numbers as text, for screen readers (sr-only hides it visually) */}
      <table className="sr-only">
        <caption>Applications sent per week</caption>
        <thead>
          <tr>
            <th scope="col">Week of</th>
            <th scope="col">Applications</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.weekStart}>
              <td>{longWeek(week.weekStart)}</td>
              <td>{week.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
