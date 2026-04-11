import { fetchCatalogFromSupabase } from './catalogFromSupabase';

const publicCatalogUrl =
  import.meta.env.VITE_PUBLIC_CATALOG_API_URL || '/api/public-catalog';
const registerUrl = import.meta.env.VITE_REGISTER_API_URL || '/api/register';

const catalogIdKey = (v) => (v == null ? '' : String(v));

/**
 * Exam IDs included in a package, from the public catalog API (service role on the server).
 * Use when the browser cannot read `package_exams` under RLS but the catalog API can.
 */
export async function fetchPackageExamIdsForPackage(packageId) {
  if (!packageId) return new Set();
  try {
    const res = await fetch(publicCatalogUrl, { method: 'GET' });
    const json = await res.json().catch(() => ({}));
    const packages = json?.data?.packages || [];
    const pkg = packages.find((p) => catalogIdKey(p?.id) === catalogIdKey(packageId));
    const exams = pkg?.exams || [];
    return new Set(exams.map((e) => catalogIdKey(e?.id)).filter(Boolean));
  } catch (err) {
    console.warn('[fetchPackageExamIdsForPackage]', err?.message || err);
    return new Set();
  }
}

function mergeCatalogPreferNonEmpty(apiData, fallbackData) {
  const a = apiData || {};
  const b = fallbackData || {};
  return {
    professions: a.professions?.length ? a.professions : b.professions || [],
    healthAuthorities: a.healthAuthorities?.length ? a.healthAuthorities : b.healthAuthorities || [],
    packages: a.packages?.length ? a.packages : b.packages || [],
  };
}

/**
 * Loads catalog for registration / packages pages.
 * Tries the Node API first (enriched + service role); falls back to Supabase anon if the API fails or returns empty.
 */
export async function fetchPublicCatalog() {
  let apiData = null;
  let apiWarnings = [];

  try {
    const res = await fetch(publicCatalogUrl, { method: 'GET' });
    const json = await res.json().catch(() => ({}));
    apiWarnings = json.warnings || [];
    if (json?.data && (res.ok || res.status === 503)) {
      apiData = json.data;
    }
    if (apiWarnings.length) {
      console.warn('[fetchPublicCatalog] API warnings:', apiWarnings);
    }
  } catch (err) {
    console.warn('[fetchPublicCatalog] API unreachable, using Supabase:', err.message || err);
  }

  const fallback = await fetchCatalogFromSupabase();
  const merged = mergeCatalogPreferNonEmpty(apiData, fallback);

  const missingProfessions = !merged.professions?.length;
  const missingHA = !merged.healthAuthorities?.length;
  if (missingProfessions && missingHA) {
    console.error(
      '[fetchPublicCatalog] No professions or health authorities loaded. Run SQL migrations (003 seed + 007) and ensure the API has SUPABASE_SERVICE_ROLE_KEY, or allow public read via migration 007.'
    );
  }

  return merged;
}

export async function registerUser(payload) {
  const res = await fetch(registerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || 'Registration failed');
  }
  return json?.data;
}
