import { describe, it, expect } from 'vitest';
import { toCsv } from '../src/utils/csv.js';

// A unit test: calls the function directly, no HTTP or database involved.
const columns = [
  { header: 'Name', key: 'name' },
  { header: 'Count', key: 'count' },
];
const csvOf = (...rows) => toCsv(columns, rows);

describe('toCsv', () => {
  it('writes a header row and one line per row, with CRLF line endings', () => {
    expect(csvOf({ name: 'Acme', count: 3 })).toBe('Name,Count\r\nAcme,3\r\n');
  });

  it('writes null and undefined as empty fields', () => {
    expect(csvOf({ name: null })).toBe('Name,Count\r\n,\r\n');
  });

  it('writes dates as ISO timestamps', () => {
    expect(csvOf({ name: new Date('2026-10-20T09:00:00Z') })).toContain(
      '2026-10-20T09:00:00.000Z,',
    );
  });

  it.each([
    ['a comma', 'Acme, Inc.', '"Acme, Inc."'],
    ['quotes', 'The "best" job', '"The ""best"" job"'],
    ['a line break', 'line 1\nline 2', '"line 1\nline 2"'],
  ])('quotes a field with %s', (_, name, expected) => {
    expect(csvOf({ name })).toBe(`Name,Count\r\n${expected},\r\n`);
  });

  it.each(['=HYPERLINK("http://evil.example")', '+1+1', '-2+3', '@SUM(A1)'])(
    'stops %s from running as a spreadsheet formula',
    (name) => {
      const line = csvOf({ name }).split('\r\n')[1];

      expect(line.replace(/^"/, '')).toMatch(/^'/);
    },
  );

  it('leaves numbers alone, even negative ones', () => {
    expect(csvOf({ name: 'x', count: -5 })).toBe('Name,Count\r\nx,-5\r\n');
  });
});
