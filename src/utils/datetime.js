/** Parse API / DB datetime or YYYY-MM-DD into a local Date (invalid → null). */
export function parseApiDateTime(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** dd-mm-yyyy in local calendar */
export function formatDdMmYyyy(value) {
  const d = parseApiDateTime(value);
  if (!d) return '—';
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/** 12-hour local time, hh:mm AM/PM, no seconds */
export function formatTime12h(value) {
  const d = parseApiDateTime(value);
  if (!d) return '—';
  let h = d.getHours();
  const mins = pad2(d.getMinutes());
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${pad2(h)}:${mins} ${ampm}`;
}

/** dd-mm-yyyy, hh:mm AM/PM */
export function formatDdMmYyyyAtTime(value) {
  const d = parseApiDateTime(value);
  if (!d) return '—';
  return `${formatDdMmYyyy(d)} ${formatTime12h(d)}`;
}
