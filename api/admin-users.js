import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Support both VITE_* (local / copied from client) and plain names (Vercel / README)
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error(
    'Missing Supabase environment variables (need URL, anon key, and SUPABASE_SERVICE_ROLE_KEY)'
  );
}

const anonClient = createClient(supabaseUrl, anonKey);
const serviceClient = createClient(supabaseUrl, serviceRoleKey);
const profileSelectFragment = `
  *,
  profession:professions(*),
  health_authority:health_authorities(*)
`;

const send = (res, status, payload) => {
  res.status(status).json(payload);
};

const DEFAULT_DAILY_MCQ = 100;

function dailyMcqFromPackageName(name) {
  if (!name) return DEFAULT_DAILY_MCQ;
  const n = String(name).toLowerCase();
  if (n.includes('mastering')) return 300;
  if (n.includes('acing')) return 150;
  if (n.includes('starter') || n.includes('basic')) return 100;
  return DEFAULT_DAILY_MCQ;
}

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.replace('Bearer ', '').trim();
};

/** Vercel serverless does not run express.json(); parse body when missing or stringified */
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

  // Use anonClient for user verification
  const { data: userData, error: userError } = await anonClient.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return { error: 'Invalid session token' };
  }

  const userId = userData.user.id;
  const { data: profile, error: profileError } = await serviceClient
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profileError || profile?.role !== 'ADMIN') {
    return { error: 'Admin privileges required' };
  }

  return { userId };
};

const createUser = async (payload) => {
  const {
    email,
    password,
    fullName,
    professionId,
    healthAuthorityId,
    dailyMcqLimit,
    isActive,
    packageId,
    accessMode,
  } = payload || {};

  if (!email || !password || !fullName) {
    return { status: 400, body: { error: 'email, password and fullName are required' } };
  }

  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return { status: 400, body: { error: authError.message || 'Failed to create auth user' } };
  }

  const userId = authData.user.id;

  let dailyMcq = null;
  if (typeof dailyMcqLimit === 'number' && !Number.isNaN(dailyMcqLimit)) {
    dailyMcq = dailyMcqLimit;
  } else if (packageId) {
    const { data: pkgRow } = await serviceClient
      .from('packages')
      .select('name')
      .eq('id', packageId)
      .maybeSingle();
    dailyMcq = pkgRow ? dailyMcqFromPackageName(pkgRow.name) : DEFAULT_DAILY_MCQ;
  }

  const accessModeDb = packageId ? 'AUTO' : accessMode === 'MANUAL' ? 'MANUAL' : 'AUTO';

  const { data: profile, error: profileError } = await serviceClient
    .from('user_profiles')
    .insert({
      id: userId,
      email,
      full_name: fullName,
      profession_id: professionId || null,
      health_authority_id: healthAuthorityId || null,
      daily_mcq_limit: dailyMcq,
      role: 'USER',
      access_mode: accessModeDb,
      is_active: isActive !== false,
    })
    .select(profileSelectFragment)
    .single();

  if (profileError) {
    await serviceClient.auth.admin.deleteUser(userId);
    return { status: 400, body: { error: profileError.message || 'Failed to create profile' } };
  }

  if (packageId) {
    const { error: entError } = await serviceClient.from('user_entitlements').insert({
      user_id: userId,
      package_id: packageId,
      scope: 'PACKAGE',
      status: 'ACTIVE',
      source: 'ADMIN',
    });
    if (entError) {
      await serviceClient.auth.admin.deleteUser(userId);
      return { status: 400, body: { error: entError.message || 'Failed to create package entitlement' } };
    }
  }

  return { status: 200, body: { data: profile } };
};

const updateUser = async (payload) => {
  const {
    id,
    password,
    fullName,
    professionId,
    healthAuthorityId,
    dailyMcqLimit,
    isActive,
    accessMode,
  } = payload || {};

  if (!id) {
    return { status: 400, body: { error: 'id is required' } };
  }

  if (password) {
    const { error: passwordError } = await serviceClient.auth.admin.updateUserById(id, { password });
    if (passwordError) {
      return { status: 400, body: { error: passwordError.message || 'Failed to update password' } };
    }
  }

  const updateData = {
    full_name: fullName,
    profession_id: professionId || null,
    health_authority_id: healthAuthorityId || null,
    daily_mcq_limit: typeof dailyMcqLimit === 'number' ? dailyMcqLimit : null,
    is_active: typeof isActive === 'boolean' ? isActive : undefined,
    access_mode:
      accessMode === 'MANUAL' ? 'MANUAL' : accessMode === 'AUTO' ? 'AUTO' : undefined,
  };

  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  const { data, error } = await serviceClient
    .from('user_profiles')
    .update(updateData)
    .eq('id', id)
    .select(profileSelectFragment)
    .single();

  if (error) {
    return { status: 400, body: { error: error.message || 'Failed to update profile' } };
  }

  return { status: 200, body: { data } };
};

const deleteUser = async (payload) => {
  const { id } = payload || {};
  if (!id) {
    return { status: 400, body: { error: 'id is required' } };
  }

  const { error } = await serviceClient.auth.admin.deleteUser(id);
  if (error) {
    return { status: 400, body: { error: error.message || 'Failed to delete user' } };
  }

  return { status: 200, body: { data: { id } } };
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'OPTIONS, POST, PUT, DELETE');
    return send(res, 204, {});
  }

  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'POST, PUT, DELETE, OPTIONS');
    return send(res, 405, { error: 'Method not allowed' });
  }

  try {
    const token = getTokenFromRequest(req);
    const { error: adminError } = await ensureAdmin(token);
    if (adminError) {
      return send(res, 401, { error: adminError });
    }

    const body = await readJsonBody(req);

    let result;
    if (req.method === 'POST') {
      result = await createUser(body);
    } else if (req.method === 'PUT') {
      result = await updateUser(body);
    } else if (req.method === 'DELETE') {
      result = await deleteUser(body);
    }

    return send(res, result.status, result.body);
  } catch (error) {
    console.error('Admin users API error:', error.stack || error);
    // Send detailed error for debugging - comment out in production!
    return send(res, 500, {
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
}

