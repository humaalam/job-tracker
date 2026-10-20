// A field must be wrapped in quotes if it contains a quote, comma or line break.
const NEEDS_QUOTES = /[",\r\n]/;
// Spreadsheet apps run a cell that starts with one of these as a formula
// (e.g. =HYPERLINK(...)), so such text gets a leading ' to stay plain text.
const FORMULA_START = /^[=+\-@\t\r]/;

function formatCell(value) {
  if (value == null) {
    return '';
  }
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (typeof value === 'string' && FORMULA_START.test(text)) {
    text = `'${text}`;
  }
  if (NEEDS_QUOTES.test(text)) {
    // Inside quotes, a quote is written twice: say "hi" -> "say ""hi"""
    text = `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

// Turns rows into CSV text (RFC 4180: commas between fields, CRLF line endings).
// columns: [{ header: 'Company', key: 'company' }, ...]
export function toCsv(columns, rows) {
  const lines = [
    columns.map((c) => formatCell(c.header)),
    ...rows.map((row) => columns.map((c) => formatCell(row[c.key]))),
  ];
  return lines.map((cells) => cells.join(',')).join('\r\n') + '\r\n';
}
