import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error(
    'Missing Supabase environment variables (need URL, anon key, and SUPABASE_SERVICE_ROLE_KEY)'
  );
}

createClient(supabaseUrl, anonKey); // validates config; not used directly
const serviceClient = createClient(supabaseUrl, serviceRoleKey);

const send = (res, status, payload) => {
  res.status(status).json(payload);
};

/** Parse JSON body safely in serverless environments */
const readJsonBody = async (req) => {
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) {
      try {
        return JSON.parse(req.body.toString('utf8'));
      } catch {
        return {};
      }
    }
    if (typeof req.body === 'string') {
      try {
        return req.body ? JSON.parse(req.body) : {};
      } catch {
        return {};
      }
    }
    if (typeof req.body === 'object') {
      return req.body;
    }
  }

  return new Promise((resolve, reject) => {
    if (req.readableEnded || req.complete) {
      resolve({});
      return;
    }
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
};

/**
 * Freemius integration seam.
 *
 * Later you will:
 * - verify webhook signatures
 * - map Freemius customer/email to user_profiles.id
 * - create/activate user_entitlements (source='FREEMIUS')
 * - call a provisioning routine that writes exam_access user-specific rows
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'OPTIONS, POST');
    return send(res, 204, {});
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return send(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = await readJsonBody(req);

    // For now, accept a minimal internal payload for testing:
    // package scope: { userId, packageId, status, externalRef? }
    // exam scope: { userId, examId, scope: 'EXAM', status, externalRef? }
    const userId = body?.userId || null;
    const packageId = body?.packageId || null;
    const examId = body?.examId || null;
    const scope = String(body?.scope || (examId ? 'EXAM' : 'PACKAGE')).toUpperCase();
    const status = body?.status || 'ACTIVE';
    const externalRef = body?.externalRef || null;

    if (!userId) {
      return send(res, 400, { error: 'userId is required' });
    }
    if (!['PACKAGE', 'EXAM'].includes(scope)) {
      return send(res, 400, { error: 'Invalid scope' });
    }
    if (scope === 'PACKAGE' && !packageId) {
      return send(res, 400, { error: 'packageId is required for package scope' });
    }
    if (scope === 'EXAM' && !examId) {
      return send(res, 400, { error: 'examId is required for exam scope' });
    }

    const normalizedStatus = String(status).toUpperCase();
    if (!['ACTIVE', 'CANCELED', 'EXPIRED'].includes(normalizedStatus)) {
      return send(res, 400, { error: 'Invalid status' });
    }

    const { data: entitlement, error: entitlementError } = await serviceClient
      .from('user_entitlements')
      .insert({
        user_id: userId,
        scope,
        package_id: scope === 'PACKAGE' ? packageId : null,
        exam_id: scope === 'EXAM' ? examId : null,
        status: normalizedStatus,
        source: 'FREEMIUS',
        external_ref: externalRef,
      })
      .select('*')
      .single();

    if (entitlementError) {
      return send(res, 400, { error: entitlementError.message || 'Failed to create entitlement' });
    }

    if (scope === 'EXAM') {
      return send(res, 200, { data: { entitlement, provisionedExamCount: 0 } });
    }

    // Mark any pending registration intent as READY (best-effort)
    await serviceClient
      .from('registration_intents')
      .update({ status: normalizedStatus === 'ACTIVE' ? 'READY' : 'CANCELLED' })
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .eq('status', 'PENDING_PAYMENT');

    // Resolve profession for profession-scoped provisioning.
    const { data: profile, error: profileError } = await serviceClient
      .from('user_profiles')
      .select('profession_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      return send(res, 400, { error: profileError.message || 'Failed to load user profile' });
    }

    const professionId = profile?.profession_id || null;
    if (!professionId) {
      return send(res, 400, { error: 'User profession is required before access can be provisioned' });
    }

    // Provision/revoke exam access for this package (paid exams require user-specific grants)
    const { data: packageExamRows, error: packageExamsError } = await serviceClient
      .from('package_exams')
      .select('exam_id')
      .eq('package_id', packageId);

    if (packageExamsError) {
      return send(res, 400, { error: packageExamsError.message || 'Failed to load package exams' });
    }

    const examIds = (packageExamRows || []).map((r) => r.exam_id).filter(Boolean);
    let allowedExamIds = [];

    if (examIds.length > 0) {
      // Only provision package exams already mapped to the user's profession.
      const { data: scopedRows, error: scopedError } = await serviceClient
        .from('exam_access')
        .select('exam_id')
        .eq('profession_id', professionId)
        .in('exam_id', examIds);

      if (scopedError) {
        return send(res, 400, { error: scopedError.message || 'Failed to scope exams by profession' });
      }

      allowedExamIds = [...new Set((scopedRows || []).map((r) => r.exam_id).filter(Boolean))];
    }

    if (normalizedStatus === 'ACTIVE') {
      if (allowedExamIds.length > 0) {
        const payload = allowedExamIds.map((examId) => ({
          exam_id: examId,
          user_id: userId,
          profession_id: null,
          health_authority_id: null,
          source: 'FREEMIUS',
        }));

        const { error: upsertError } = await serviceClient
          .from('exam_access')
          .upsert(payload, { onConflict: 'exam_id,user_id' });

        if (upsertError) {
          return send(res, 400, { error: upsertError.message || 'Failed to provision exam access' });
        }
      }
    } else {
      if (allowedExamIds.length > 0) {
        const { error: deleteError } = await serviceClient
          .from('exam_access')
          .delete()
          .eq('user_id', userId)
          .eq('source', 'FREEMIUS')
          .in('exam_id', allowedExamIds);

        if (deleteError) {
          return send(res, 400, { error: deleteError.message || 'Failed to revoke exam access' });
        }
      }
    }

    return send(res, 200, { data: { entitlement, provisionedExamCount: allowedExamIds.length } });
  } catch (error) {
    console.error('Freemius webhook error:', error.stack || error);
    return send(res, 500, { error: 'Internal server error' });
  }
}

