import { formatDate, formatSalary, isWebUrl, WORK_MODE_LABELS } from '../../lib/format.js';

// One label/value pair. Empty values show as '—'.
function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-900">{children || '—'}</dd>
    </div>
  );
}

// Longer text (job description, notes), keeping the line breaks as typed.
function LongText({ label, text }) {
  if (!text) return null;
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{text}</p>
    </div>
  );
}

export default function ApplicationDetails({ application }) {
  return (
    <div className="space-y-6">
      {/* <dl>: a description list, the HTML element for label/value pairs */}
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Location">{application.location}</Detail>
        <Detail label="Work mode">{WORK_MODE_LABELS[application.workMode]}</Detail>
        <Detail label="Salary">{formatSalary(application)}</Detail>
        <Detail label="Applied">{formatDate(application.appliedAt)}</Detail>
        <Detail label="Added">{formatDate(application.createdAt)}</Detail>
        <Detail label="Last updated">{formatDate(application.updatedAt)}</Detail>
        <Detail label="Resume version">{application.resumeVersion}</Detail>
        <Detail label="Cover letter version">{application.coverLetterVersion}</Detail>
        <Detail label="Job posting">
          {isWebUrl(application.jobUrl) ? (
            // target="_blank" opens a new tab; rel="noreferrer" stops that site
            // from controlling this tab and from seeing which page linked to it.
            <a
              href={application.jobUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              {application.jobUrl}
            </a>
          ) : (
            application.jobUrl
          )}
        </Detail>
      </dl>

      <LongText label="Job description" text={application.jobDescription} />
      <LongText label="Notes" text={application.notes} />
    </div>
  );
}
