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

createClient(supabaseUrl, anonKey); // validates config; not used for privileged writes
const serviceClient = createClient(supabaseUrl, serviceRoleKey);

const send = (res, status, payload) => {
  res.status(status).json(payload);
};

/** Vercel serverless does not always run express.json(); parse body when missing or stringified */
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

const isEmail = (value) => typeof value === 'string' && value.includes('@') && value.length <= 255;

const DEFAULT_DAILY_MCQ = 100;

function dailyMcqFromPackageName(name) {
  if (!name) return DEFAULT_DAILY_MCQ;
  const n = String(name).toLowerCase();
  if (n.includes('mastering')) return 300;
  if (n.includes('acing')) return 150;
  if (n.includes('starter') || n.includes('basic')) return 100;
  return DEFAULT_DAILY_MCQ;
}

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
    const email = (body?.email || '').trim().toLowerCase();
    const password = body?.password || '';
    const fullName = (body?.fullName || '').trim();
    const professionId = body?.professionId || null;
    const healthAuthorityId = body?.healthAuthorityId || null;
    const packageId = body?.packageId || null;

    if (!isEmail(email) || !password || password.length < 8 || !fullName) {
      return send(res, 400, {
        error: 'Invalid input (email, password>=8 chars, fullName are required)',
      });
    }

    if (!professionId || !healthAuthorityId || !packageId) {
      return send(res, 400, {
        error: 'professionId, healthAuthorityId, and packageId are required',
      });
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData?.user?.id) {
      return send(res, 400, { error: authError?.message || 'Failed to create user' });
    }

    const userId = authData.user.id;

    const { data: pkgRow } = await serviceClient
      .from('packages')
      .select('name')
      .eq('id', packageId)
      .maybeSingle();

    const initialDailyMcq = pkgRow ? dailyMcqFromPackageName(pkgRow.name) : DEFAULT_DAILY_MCQ;

    // Create user profile (role USER; automation enabled by default)
    const { data: profile, error: profileError } = await serviceClient
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        role: 'USER',
        profession_id: professionId,
        health_authority_id: healthAuthorityId,
        is_active: true,
        access_mode: 'AUTO',
        daily_mcq_limit: initialDailyMcq,
      })
      .select('*')
      .single();

    if (profileError) {
      await serviceClient.auth.admin.deleteUser(userId);
      return send(res, 400, { error: profileError.message || 'Failed to create user profile' });
    }

    // Record the user's selection as a registration intent (payment will later flip this to READY)
    const { data: intent, error: intentError } = await serviceClient
      .from('registration_intents')
      .insert({
        user_id: userId,
        profession_id: professionId,
        health_authority_id: healthAuthorityId,
        package_id: packageId,
        status: 'PENDING_PAYMENT',
      })
      .select('*')
      .single();

    if (intentError) {
      // Profile exists; keep user but report issue. Admin can still fix manually.
      return send(res, 200, {
        data: {
          userId,
          profile,
          intent: null,
          warning: 'Registered but could not create registration intent',
        },
      });
    }

    return send(res, 200, {
      data: {
        userId,
        profile,
        intent,
        nextStep: 'PAYMENT_REQUIRED',
      },
    });
  } catch (error) {
    console.error('Register API error:', error.stack || error);
    return send(res, 500, { error: 'Internal server error' });
  }
}

