import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const send = (res, status, payload) => {
  res.status(status).json(payload);
};

const logSupabaseError = (where, err) => {
  if (!err) return;
  console.error(`[public-catalog] ${where}:`, err.message || err, err.code || '', err.details || '');
};

/**
 * Build enriched packages with nested exams (no PostgREST embed — works even if FK introspection differs).
 */
async function loadPackagesWithExams(serviceClient) {
  const warnings = [];

  // Use select('*') and order by name only so it works before migration 007 adds price_display, sort_order, etc.
  let { data: pkgRows, error: pkgErr } = await serviceClient
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (pkgErr) {
    logSupabaseError('packages', pkgErr);
    if (
      pkgErr.code === '42P01' ||
      (pkgErr.message && String(pkgErr.message).includes('does not exist'))
    ) {
      warnings.push(
        'Database table `packages` is missing. Run Supabase migrations (005+) in the SQL editor.'
      );
    } else {
      warnings.push(`packages: ${pkgErr.message || 'query failed'}`);
    }
    return { packages: [], warnings };
  }

  // Optional: secondary sort by sort_order when column exists (migration 007)
  if (pkgRows?.length && 'sort_order' in pkgRows[0] && pkgRows[0].sort_order != null) {
    pkgRows = [...pkgRows].sort((a, b) => {
      const sa = Number(a.sort_order) || 0;
      const sb = Number(b.sort_order) || 0;
      if (sa !== sb) return sa - sb;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }

  const packages = pkgRows || [];
  if (packages.length === 0) {
    warnings.push(
      'No active packages in the database. Add rows to `packages` (migration 007 seeds defaults).'
    );
    return { packages: [], warnings };
  }

  const packageIds = packages.map((p) => p.id);

  const { data: peRows, error: peErr } = await serviceClient
    .from('package_exams')
    .select('package_id, exam_id')
    .in('package_id', packageIds);

  if (peErr) {
    logSupabaseError('package_exams', peErr);
    warnings.push(`package_exams: ${peErr.message || 'query failed'} — exam lists may be empty.`);
    return {
      packages: packages.map((p) => ({ ...p, exams: [], featuresNormalized: normalizeFeatures(p.features) })),
      warnings,
    };
  }

  const examIds = [...new Set((peRows || []).map((r) => r.exam_id).filter(Boolean))];
  let examsById = new Map();

  if (examIds.length > 0) {
    const { data: examRows, error: exErr } = await serviceClient
      .from('exams')
      .select('id, title, description, exam_type, total_mcqs, duration, is_active')
      .in('id', examIds);

    if (exErr) {
      logSupabaseError('exams', exErr);
      warnings.push(`exams: ${exErr.message || 'query failed'} — exam titles may be missing.`);
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

  return { packages: enriched, warnings };
}

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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'OPTIONS, GET');
    return send(res, 204, {});
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return send(res, 405, { error: 'Method not allowed' });
  }

  const warnings = [];

  if (!supabaseUrl || !serviceRoleKey) {
    return send(res, 503, {
      error: 'Server is not configured for catalog API (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).',
      data: { professions: [], healthAuthorities: [], packages: [] },
      warnings: [
        'Set SUPABASE_SERVICE_ROLE_KEY (and URL) for the API process. The browser only has the anon key.',
      ],
    });
  }

  if (!anonKey) {
    warnings.push('SUPABASE_ANON_KEY is missing on the server (optional for this endpoint).');
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data: professions, error: profErr } = await serviceClient
      .from('professions')
      .select('*')
      .order('name', { ascending: true });

    if (profErr) {
      logSupabaseError('professions', profErr);
      warnings.push(`professions: ${profErr.message || 'query failed'}`);
    }

    const { data: healthAuthorities, error: haErr } = await serviceClient
      .from('health_authorities')
      .select('*')
      .order('name', { ascending: true });

    if (haErr) {
      logSupabaseError('health_authorities', haErr);
      warnings.push(`health_authorities: ${haErr.message || 'query failed'}`);
    }

    const { packages: packagesEnriched, warnings: pkgWarnings } = await loadPackagesWithExams(serviceClient);
    warnings.push(...pkgWarnings);

    return send(res, 200, {
      data: {
        professions: professions || [],
        healthAuthorities: healthAuthorities || [],
        packages: packagesEnriched,
      },
      warnings: warnings.filter(Boolean),
    });
  } catch (error) {
    console.error('[public-catalog] unexpected:', error.stack || error);
    // Return 200 so browsers and SPA fetch treat this as a successful JSON payload; clients fall back to Supabase.
    return send(res, 200, {
      data: { professions: [], healthAuthorities: [], packages: [] },
      warnings: [`unexpected: ${error.message || error}`],
    });
  }
}
