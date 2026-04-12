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

const anonClient = createClient(supabaseUrl, anonKey);
const serviceClient = createClient(supabaseUrl, serviceRoleKey);

const send = (res, status, payload) => {
  res.status(status).json(payload);
};

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.replace('Bearer ', '').trim();
};

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

const ensureAdmin = async (accessToken) => {
  if (!accessToken) {
    return { error: 'Missing access token' };
  }

  const { data: userData, error: userError } = await anonClient.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return { error: 'Invalid session token' };
  }

  const adminUserId = userData.user.id;
  const { data: profile, error: profileError } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('id', adminUserId)
    .single();

  if (profileError || profile?.role !== 'ADMIN') {
    return { error: 'Admin privileges required' };
  }

  return { userId: adminUserId };
};

const grantExamEntitlement = async ({ userId, examId }) => {
  if (!userId || !examId) {
    return { status: 400, body: { error: 'userId and examId are required' } };
  }

  const { data: profile, error: profileError } = await serviceClient
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profile) {
    return { status: 400, body: { error: 'User not found' } };
  }

  const { data: exam, error: examError } = await serviceClient
    .from('exams')
    .select('id')
    .eq('id', examId)
    .maybeSingle();

  if (examError || !exam) {
    return { status: 400, body: { error: 'Exam not found' } };
  }

  const { data: existing, error: existingError } = await serviceClient
    .from('user_entitlements')
    .select('id, source')
    .eq('user_id', userId)
    .eq('exam_id', examId)
    .eq('scope', 'EXAM')
    .eq('status', 'ACTIVE');

  if (existingError) {
    return { status: 400, body: { error: existingError.message || 'Failed to check existing access' } };
  }

  if (existing?.length) {
    return {
      status: 200,
      body: { data: existing[0], alreadyGranted: true },
    };
  }

  const { data, error } = await serviceClient
    .from('user_entitlements')
    .insert({
      user_id: userId,
      exam_id: examId,
      scope: 'EXAM',
      status: 'ACTIVE',
      source: 'ADMIN',
    })
    .select()
    .single();

  if (error) {
    return { status: 400, body: { error: error.message || 'Failed to grant exam access' } };
  }

  return { status: 200, body: { data } };
};

const revokeExamEntitlement = async ({ userId, examId }) => {
  if (!userId || !examId) {
    return { status: 400, body: { error: 'userId and examId are required' } };
  }

  const { data: removed, error } = await serviceClient
    .from('user_entitlements')
    .delete()
    .eq('user_id', userId)
    .eq('exam_id', examId)
    .eq('scope', 'EXAM')
    .eq('source', 'ADMIN')
    .select('id');

  if (error) {
    return { status: 400, body: { error: error.message || 'Failed to revoke exam access' } };
  }

  return {
    status: 200,
    body: { data: { revoked: (removed || []).length } },
  };
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'OPTIONS, POST, DELETE');
    return send(res, 204, {});
  }

  if (!['POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'POST, DELETE, OPTIONS');
    return send(res, 405, { error: 'Method not allowed' });
  }

  try {
    const token = getTokenFromRequest(req);
    const { error: adminError } = await ensureAdmin(token);
    if (adminError) {
      return send(res, 401, { error: adminError });
    }

    const body = await readJsonBody(req);
    const result =
      req.method === 'POST'
        ? await grantExamEntitlement(body)
        : await revokeExamEntitlement(body);

    return send(res, result.status, result.body);
  } catch (error) {
    console.error('Admin exam grants API error:', error.stack || error);
    return send(res, 500, {
      error: 'Internal server error',
      message: error.message,
    });
  }
}
