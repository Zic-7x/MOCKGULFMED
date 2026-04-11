import { supabase } from '../lib/supabase';

function normalizeFeatures(features) {
  if (Array.isArray(features)) return features.map(String);
  if (features && typeof features === 'object') {
    try {
      const v = Array.isArray(features) ? features : Object.values(features);
      return v.map(String);
    } catch {
      return [];
    }
  }
  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Load registration/catalog data using the browser Supabase client (anon + RLS).
 * Requires migration 007 public read policies.
 */
export async function fetchCatalogFromSupabase() {
  const { data: professions, error: pErr } = await supabase
    .from('professions')
    .select('*')
    .order('name', { ascending: true });

  if (pErr) {
    console.error('[catalogFromSupabase] professions:', pErr.message);
  }

  const { data: healthAuthorities, error: hErr } = await supabase
    .from('health_authorities')
    .select('*')
    .order('name', { ascending: true });

  if (hErr) {
    console.error('[catalogFromSupabase] health_authorities:', hErr.message);
  }

  // select('*') + order by name only: works before migration 007 (no price_display / sort_order yet)
  let { data: pkgRows, error: pkgErr } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (pkgErr) {
    console.error('[catalogFromSupabase] packages:', pkgErr.message);
    return {
      professions: professions || [],
      healthAuthorities: healthAuthorities || [],
      packages: [],
    };
  }

  let packages = pkgRows || [];
  if (packages.length && packages[0] && 'sort_order' in packages[0]) {
    packages = [...packages].sort((a, b) => {
      const sa = Number(a.sort_order) || 0;
      const sb = Number(b.sort_order) || 0;
      if (sa !== sb) return sa - sb;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }
  if (packages.length === 0) {
    return {
      professions: professions || [],
      healthAuthorities: healthAuthorities || [],
      packages: [],
    };
  }

  const packageIds = packages.map((p) => p.id);
  const { data: peRows, error: peErr } = await supabase
    .from('package_exams')
    .select('package_id, exam_id')
    .in('package_id', packageIds);

  if (peErr) {
    console.error('[catalogFromSupabase] package_exams:', peErr.message);
    return {
      professions: professions || [],
      healthAuthorities: healthAuthorities || [],
      packages: packages.map((p) => ({ ...p, exams: [], featuresNormalized: normalizeFeatures(p.features) })),
    };
  }

  const examIds = [...new Set((peRows || []).map((r) => r.exam_id).filter(Boolean))];
  let examsById = new Map();

  if (examIds.length > 0) {
    const { data: examRows, error: eErr } = await supabase
      .from('exams')
      .select('id, title, description, exam_type, total_mcqs, duration, is_active')
      .in('id', examIds);

    if (eErr) {
      console.error('[catalogFromSupabase] exams:', eErr.message);
    } else {
      examsById = new Map((examRows || []).map((e) => [e.id, e]));
    }
  }

  const byPackage = new Map();
  for (const row of peRows || []) {
    if (!row.package_id || !row.exam_id) continue;
    if (!byPackage.has(row.package_id)) byPackage.set(row.package_id, []);
    const exam = examsById.get(row.exam_id);
    if (exam) byPackage.get(row.package_id).push(exam);
  }

  const enriched = packages.map((p) => ({
    ...p,
    exams: byPackage.get(p.id) || [],
    featuresNormalized: normalizeFeatures(p.features),
  }));

  return {
    professions: professions || [],
    healthAuthorities: healthAuthorities || [],
    packages: enriched,
  };
}
