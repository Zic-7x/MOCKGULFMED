/**
 * Compute subscription end instants for packages and exam addons.
 * Used by API routes (Node). Keep in sync with client-side expectations in supabaseQueries.
 */

function asDate(d) {
  if (d instanceof Date) return d;
  return new Date(d);
}

function addUtcDays(start, days) {
  const x = asDate(start);
  const y = new Date(x.getTime());
  y.setUTCDate(y.getUTCDate() + days);
  return y;
}

function addUtcMonths(start, months) {
  const x = asDate(start);
  const y = new Date(x.getTime());
  y.setUTCMonth(y.getUTCMonth() + months);
  return y;
}

/**
 * Basic Monthly → 30 days, Acing → 90 days, Master annual → 12 calendar months (UTC).
 */
export function endsAtForPackageName(packageName, startDate = new Date()) {
  const n = String(packageName || '').toLowerCase();
  const start = asDate(startDate);
  if (n.includes('mastering')) return addUtcMonths(start, 12);
  if (n.includes('acing')) return addUtcDays(start, 90);
  if (n.includes('basic')) return addUtcDays(start, 30);
  return addUtcDays(start, 30);
}

/** Per-exam Freemius addon: 2 calendar months from start. */
export function endsAtForAddon(startDate = new Date()) {
  return addUtcMonths(asDate(startDate), 2);
}

export function toIso(d) {
  return asDate(d).toISOString();
}

/**
 * Renewal: extend from current period end if still active, otherwise from now.
 */
export function extendPackageEndsAt(previousEndsAtIso, packageName, now = new Date()) {
  const nowD = asDate(now);
  const prev = previousEndsAtIso ? asDate(previousEndsAtIso) : null;
  const base = prev && prev > nowD ? prev : nowD;
  return endsAtForPackageName(packageName, base);
}

export function extendAddonEndsAt(previousEndsAtIso, now = new Date()) {
  const nowD = asDate(now);
  const prev = previousEndsAtIso ? asDate(previousEndsAtIso) : null;
  const base = prev && prev > nowD ? prev : nowD;
  return endsAtForAddon(base);
}
