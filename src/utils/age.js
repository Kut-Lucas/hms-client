/**
 * Integer age in full years from a calendar date string (YYYY-MM-DD) or Date.
 * Uses local calendar date for "today" to match typical clinic expectations.
 */
export function ageInYears(dateOfBirth) {
  if (dateOfBirth == null || dateOfBirth === '') return null;
  const birth = typeof dateOfBirth === 'string' ? parseYmdLocal(dateOfBirth) : new Date(dateOfBirth);
  if (!birth || Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return Math.max(0, age);
}

function parseYmdLocal(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd).trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(y, mo, d);
}
