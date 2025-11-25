import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const serviceClient = createClient(supabaseUrl, serviceRoleKey);
const profileSelectFragment = `
  *,
  profession:professions(*),
  health_authority:health_authorities(*)
`;

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

const ensureAdmin = async (accessToken) => {
  if (!accessToken) {
    return { error: 'Missing access token' };
  }

  const { data: userData, error: userError } = await serviceClient.auth.getUser(accessToken);
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
  const { email, password, fullName, professionId, healthAuthorityId, dailyMcqLimit, isActive } = payload || {};

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

  const { data: profile, error: profileError } = await serviceClient
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      profession_id: professionId || null,
      health_authority_id: healthAuthorityId || null,
      daily_mcq_limit: typeof dailyMcqLimit === 'number' ? dailyMcqLimit : null,
      role: 'USER',
      is_active: isActive !== false,
    })
    .select(profileSelectFragment)
    .single();

  if (profileError) {
    // best effort cleanup of auth user so we do not leave orphaned auth entries
    await serviceClient.auth.admin.deleteUser(authData.user.id);
    return { status: 400, body: { error: profileError.message || 'Failed to create profile' } };
  }

  return { status: 200, body: { data: profile } };
};

const updateUser = async (payload) => {
  const { id, password, fullName, professionId, healthAuthorityId, dailyMcqLimit, isActive } = payload || {};

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

    let result;
    if (req.method === 'POST') {
      result = await createUser(req.body);
    } else if (req.method === 'PUT') {
      result = await updateUser(req.body);
    } else if (req.method === 'DELETE') {
      result = await deleteUser(req.body);
    }

    return send(res, result.status, result.body);
  } catch (error) {
    console.error('Admin users API error:', error);
    return send(res, 500, { error: 'Internal server error' });
  }
}

