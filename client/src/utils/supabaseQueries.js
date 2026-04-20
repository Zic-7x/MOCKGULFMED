import { supabase } from '../lib/supabase';
import { fetchPackageExamIdsForPackage } from './publicApi';

const adminUsersApiUrl = import.meta.env.VITE_ADMIN_USERS_API_URL || '/api/admin-users';
const adminExamGrantsApiUrl =
  import.meta.env.VITE_ADMIN_EXAM_GRANTS_API_URL || '/api/admin-exam-grants';

/** Default cap when profile/package does not specify one (new accounts, MANUAL without a number). */
export const DEFAULT_DAILY_MCQ_LIMIT = 100;

/*const userMatchesExamAccessRule = (rule, userId, profile) => {
  // Direct ID grant always wins
  if (rule.user_id === userId) return true;

  // Check profession match
  const professionMatches = 
    rule.profession_id && 
    profile.profession_id && 
    rule.profession_id === profile.profession_id;

  // Check authority match (if rule has an authority, profile must match it)
  const authorityMatches = 
    !rule.health_authority_id || 
    (profile.health_authority_id && rule.health_authority_id === profile.health_authority_id);

  return !!(professionMatches && authorityMatches);
};

const userHasExamAccessFromRules = (rules, userId, profile) => {
  if (!rules || rules.length === 0) return false;
  return rules.some((rule) => userMatchesExamAccessRule(rule, userId, profile));
};

/** True if the user's profession/HA (or direct user grant) matches this exam_access row. */
/*const userMatchesExamAccessRule = (rule, userId, profile) => {
  const isDirectUserGrant = rule.user_id && rule.user_id === userId;
  const professionMatches =
    rule.profession_id && profile.profession_id && rule.profession_id === profile.profession_id;
  const authorityMatches =
    !rule.health_authority_id ||
    (profile.health_authority_id && rule.health_authority_id === profile.health_authority_id);
  return isDirectUserGrant || (professionMatches && authorityMatches);
};

/**
 * Non-admin users need at least one exam_access row that matches their profile.
 * Exams with no rows are not shown (avoids "paid = all professions").
 */
/*const userHasExamAccessFromRules = (rules, userId, profile) => {
  if (!rules || rules.length === 0) return false;
  return rules.some((rule) => userMatchesExamAccessRule(rule, userId, profile));
};*/

const userMatchesExamAccessRule = (rule, userId, profile) => {
  // Use .toString() to ensure we aren't comparing a string to an object
  // and check for existence
  if (rule.user_id && userId && rule.user_id.toString() === userId.toString()) {
    return true;
  }

  const professionMatches = 
    rule.profession_id && 
    profile?.profession_id && 
    rule.profession_id.toString() === profile.profession_id.toString();

  const authorityMatches = 
    !rule.health_authority_id || 
    (profile?.health_authority_id && 
     rule.health_authority_id.toString() === profile.health_authority_id.toString());

  return !!(professionMatches && authorityMatches);
};

const userHasExamAccessFromRules = (rules, userId, profile) => {
  if (!rules || rules.length === 0) return false;
  return rules.some((rule) => userMatchesExamAccessRule(rule, userId, profile));
};

/** Normalize UUIDs from PostgREST/JS so Set/Map lookups stay reliable. */
const idKey = (v) => (v == null ? '' : String(v));

/** PACKAGE row is valid if ends_at is null or still in the future (status must be ACTIVE). */
const isPackageEntitlementTimeValid = (row) => {
  if (!row) return false;
  if (row.ends_at == null || row.ends_at === '') return true;
  return new Date(row.ends_at) > new Date();
};

/**
 * Loads recent ACTIVE PACKAGE entitlements and drops rows past ends_at.
 * DB status may still be ACTIVE until a job marks EXPIRED — app enforces window.
 */
const queryValidPackageEntitlements = async (userId, select) => {
  const { data: rows, error } = await supabase
    .from('user_entitlements')
    .select(select)
    .eq('user_id', userId)
    .eq('scope', 'PACKAGE')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) throw error;
  return (rows || []).filter(isPackageEntitlementTimeValid);
};

/** Days before package end to show an in-app renewal reminder (banner). */
const PACKAGE_RENEWAL_WARNING_DAYS = 7;

/**
 * AUTO users: classify package subscription for gating and UI.
 * - active: time-valid ACTIVE row
 * - expired: had a paid package window that is over (EXPIRED or ACTIVE past ends_at)
 * - none: no qualifying entitlement (never paid / only CANCELED)
 */
export async function getAutoPackageAccessContext(userId) {
  const { data: rows, error } = await supabase
    .from('user_entitlements')
    .select(
      `
      id,
      package_id,
      status,
      ends_at,
      created_at,
      starts_at,
      package:packages(id, name, daily_mcq_limit, duration_label)
    `
    )
    .eq('user_id', userId)
    .eq('scope', 'PACKAGE')
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) throw error;
  const list = rows || [];

  for (const row of list) {
    if (row.status === 'CANCELED') continue;
    if (row.status === 'ACTIVE' && isPackageEntitlementTimeValid(row)) {
      let renewalWarning = null;
      if (row.ends_at) {
        const endMs = new Date(row.ends_at).getTime();
        const msLeft = endMs - Date.now();
        const daysLeft = msLeft / 86400000;
        if (daysLeft > 0 && daysLeft <= PACKAGE_RENEWAL_WARNING_DAYS) {
          renewalWarning = {
            endsAt: row.ends_at,
            daysRemaining: Math.max(1, Math.ceil(daysLeft)),
          };
        }
      }
      return {
        kind: 'active',
        packageId: row.package_id,
        endsAt: row.ends_at,
        entitlement: row,
        renewalWarning,
      };
    }
  }

  for (const row of list) {
    if (row.status === 'CANCELED') continue;
    if (row.status === 'EXPIRED') {
      return {
        kind: 'expired',
        packageId: row.package_id,
        endsAt: row.ends_at,
        entitlement: row,
      };
    }
    if (row.status === 'ACTIVE' && !isPackageEntitlementTimeValid(row)) {
      return {
        kind: 'expired',
        packageId: row.package_id,
        endsAt: row.ends_at,
        entitlement: row,
      };
    }
  }

  return { kind: 'none' };
}

/** Minimum subscription length (months) required for the signed-in eligibility assessment (not the public checker). */
export const ELIGIBILITY_ASSESSMENT_MIN_PACKAGE_MONTHS = 3;

/**
 * Infer commercial package length in months from catalog fields (name + duration_label).
 * Returns null if unknown — callers should treat unknown as ineligible for gated features.
 */
export function inferPackageDurationMonths(pkg) {
  if (!pkg) return null;
  const name = String(pkg.name || '');
  const dl = String(pkg.duration_label || '');
  const s = `${name} ${dl}`.toLowerCase();
  if (/\b(12|twelve)\s*months?\b|annual|yearly|\b12\s*month\b/.test(s)) return 12;
  if (/\b(3|three)\s*months?\b|\b3\s*month\b|acing/.test(s)) return 3;
  if (/\b(1|one)\s*months?\b|basic\s*monthly|monthly\s*plan|\b1\s*month\b/.test(s)) return 1;
  const m = s.match(/(\d+)\s*months?/);
  if (m) return Number(m[1]);
  return null;
}

export function packageMeetsEligibilityMinimum(pkg, minMonths = ELIGIBILITY_ASSESSMENT_MIN_PACKAGE_MONTHS) {
  const months = inferPackageDurationMonths(pkg);
  if (months == null) return false;
  return months >= minMonths;
}

/**
 * AUTO users need an active package of at least ELIGIBILITY_ASSESSMENT_MIN_PACKAGE_MONTHS.
 * ADMIN and MANUAL profiles keep access (operational / representative accounts).
 */
export async function canUserAccessEligibilityAssessment(userId) {
  const { data: profile, error: pErr } = await supabase
    .from('user_profiles')
    .select('role, access_mode')
    .eq('id', userId)
    .single();

  if (pErr) throw pErr;
  if (!profile) return { allowed: false, reason: 'no_profile' };
  if (profile.role === 'ADMIN') return { allowed: true, reason: 'admin' };
  if (profile.access_mode === 'MANUAL') return { allowed: true, reason: 'manual' };

  const ctx = await getAutoPackageAccessContext(userId);
  if (ctx.kind !== 'active') {
    if (ctx.kind === 'expired') {
      return { allowed: false, reason: 'package_expired', endsAt: ctx.endsAt };
    }
    return { allowed: false, reason: 'subscription_required' };
  }

  const pkg = ctx.entitlement?.package;
  const months = inferPackageDurationMonths(pkg);
  if (packageMeetsEligibilityMinimum(pkg)) {
    return {
      allowed: true,
      reason: 'package',
      packageId: ctx.packageId,
      packageName: pkg?.name,
      packageMonths: months,
      endsAt: ctx.endsAt,
    };
  }

  return {
    allowed: false,
    reason: 'package_too_short',
    packageId: ctx.packageId,
    packageName: pkg?.name,
    packageMonths: months,
    endsAt: ctx.endsAt,
  };
}

export async function assertEligibilityAssessmentAccess(userId) {
  const { data: profile, error: pErr } = await supabase
    .from('user_profiles')
    .select('role, access_mode')
    .eq('id', userId)
    .single();

  if (pErr) throw pErr;
  if (!profile) throw new Error('User not found');
  if (profile.role === 'ADMIN') return;
  if (profile.access_mode === 'MANUAL') return;

  const ctx = await getAutoPackageAccessContext(userId);
  if (ctx.kind !== 'active') {
    if (ctx.kind === 'expired') {
      throw new Error(
        'Your package access has ended. Renew a 3-month or annual plan to use the eligibility assessment.'
      );
    }
    throw new Error(
      'Eligibility assessment requires an active subscription. Choose a 3-month or annual plan on the Packages page.'
    );
  }

  const pkg = ctx.entitlement?.package;
  if (!packageMeetsEligibilityMinimum(pkg)) {
    throw new Error(
      'Eligibility assessment is included with 3-month and annual plans. Upgrade on the Packages page.'
    );
  }
}

const getSessionToken = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  const token = data?.session?.access_token;
  if (!token) {
    throw new Error('You must be signed in to perform this action');
  }
  return token;
};

const callAdminUsersApi = async (method, payload) => {
  const token = await getSessionToken();
  const response = await fetch(adminUsersApiUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  let result = {};
  try {
    result = await response.json();
  } catch (error) {
    // ignore JSON parse failures so we can throw below
  }

  if (!response.ok) {
    throw new Error(result?.error || 'Request failed');
  }

  return result?.data;
};

const callAdminExamGrantsApi = async (method, payload) => {
  const token = await getSessionToken();
  const response = await fetch(adminExamGrantsApiUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  let result = {};
  try {
    result = await response.json();
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(result?.error || 'Request failed');
  }

  return result;
};

/** Admin-granted or purchased per-exam access; respects ends_at like package entitlements. */
const queryValidExamEntitlements = async (userId, select = 'exam_id, ends_at') => {
  const { data: rows, error } = await supabase
    .from('user_entitlements')
    .select(select)
    .eq('user_id', userId)
    .eq('scope', 'EXAM')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw error;
  return (rows || []).filter(isPackageEntitlementTimeValid);
};

export const getAdminExamEntitlements = async () => {
  const { data, error } = await supabase
    .from('user_entitlements')
    .select(
      `
      id,
      user_id,
      exam_id,
      status,
      source,
      created_at,
      ends_at,
      exam:exams(id, title, addon_enabled),
      user:user_profiles(id, email, full_name)
    `
    )
    .eq('scope', 'EXAM')
    .eq('source', 'ADMIN')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const grantUserExamEntitlement = async (userId, examId) => {
  const res = await callAdminExamGrantsApi('POST', { userId, examId });
  return res?.data;
};

export const revokeUserExamEntitlement = async (userId, examId) => {
  await callAdminExamGrantsApi('DELETE', { userId, examId });
};

const getDailyLimitForPackageName = (packageName) => {
  if (!packageName) return null;
  const normalized = String(packageName).trim().toLowerCase();

  if (normalized.includes('mastering')) return 300;
  if (normalized.includes('acing')) return 150;
  if (normalized.includes('starter') || normalized.includes('basic')) return 100;

  return null;
};

/** Prefer DB column on packages; fall back to name heuristics (migration 014 adds daily_mcq_limit). */
const getDailyLimitFromPackageRow = (pkg) => {
  if (!pkg) return null;
  const n = pkg.daily_mcq_limit;
  if (typeof n === 'number' && n >= 0) return n;
  return getDailyLimitForPackageName(pkg.name);
};

/**
 * MANUAL: profile cap, else default (never unlimited unless admin sets a very high number explicitly).
 * AUTO: paid package row, else default when package metadata is incomplete, else 0 if unpaid.
 */
const resolveEffectiveDailyLimit = async ({ userId, profileDailyLimit, accessMode }) => {
  const mode = accessMode || 'AUTO';
  if (!userId || mode !== 'AUTO') {
    if (profileDailyLimit !== null && profileDailyLimit !== undefined && profileDailyLimit !== '') {
      const n = Number(profileDailyLimit);
      if (!Number.isNaN(n) && n >= 0) return n;
    }
    return DEFAULT_DAILY_MCQ_LIMIT;
  }

  const rows = await queryValidPackageEntitlements(
    userId,
    'package_id, ends_at, created_at, package:packages(id, name, daily_mcq_limit)'
  );

  const pkg = rows?.[0]?.package;
  if (pkg) {
    const limit = getDailyLimitFromPackageRow(pkg);
    if (limit !== null && limit !== undefined) return limit;
    return DEFAULT_DAILY_MCQ_LIMIT;
  }

  return 0;
};

/**
 * AUTO users must have an ACTIVE PACKAGE entitlement (paid) to use exams.
 * ADMIN and MANUAL profiles keep existing behavior (admin / manual grants).
 */
export async function assertPaidAccessForExams(profile, userId) {
  if (!profile) throw new Error('User not found');
  if (profile.role === 'ADMIN') return;
  if (profile.access_mode === 'MANUAL') return;

  const ctx = await getAutoPackageAccessContext(userId);
  if (ctx.kind === 'active') return;
  if (ctx.kind === 'expired') {
    throw new Error(
      'Your package access has ended. Renew your package to continue — your profile and past results are still saved.'
    );
  }
  throw new Error(
    'Active subscription required. Complete your package purchase to access exams.'
  );
}

/** Used by the exam list page to show paywall vs empty catalog. */
export async function canUserTakeExams(userId) {
  const { data: profile, error: pErr } = await supabase
    .from('user_profiles')
    .select('role, access_mode')
    .eq('id', userId)
    .single();

  if (pErr) throw pErr;
  if (!profile) return { allowed: false, reason: 'no_profile' };
  if (profile.role === 'ADMIN') return { allowed: true };
  if (profile.access_mode === 'MANUAL') return { allowed: true };

  const ctx = await getAutoPackageAccessContext(userId);
  if (ctx.kind === 'active') {
    return {
      allowed: true,
      renewalWarning: ctx.renewalWarning || undefined,
      packageEndsAt: ctx.endsAt || undefined,
    };
  }
  if (ctx.kind === 'expired') {
    return {
      allowed: true,
      examAccessLocked: true,
      reason: 'package_expired',
      packageId: ctx.packageId,
      packageEndedAt: ctx.endsAt,
    };
  }
  return { allowed: false, reason: 'subscription_required' };
}

// User Management (Admin only)
export const getUserProfiles = async () => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      profession:professions(*),
      health_authority:health_authorities(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const users = data || [];
  const userIds = users.map((u) => u.id).filter(Boolean);
  if (userIds.length === 0) return users;

  const [{ data: intents }, { data: entitlements }] = await Promise.all([
    supabase
      .from('registration_intents')
      .select('id, user_id, package_id, status, created_at')
      .in('user_id', userIds)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_entitlements')
      .select('user_id, scope, status, source, created_at, ends_at')
      .in('user_id', userIds)
      .eq('scope', 'PACKAGE')
      .eq('status', 'ACTIVE'),
  ]);

  const latestIntentByUser = new Map();
  for (const intent of intents || []) {
    if (!latestIntentByUser.has(intent.user_id)) {
      latestIntentByUser.set(intent.user_id, intent);
    }
  }

  const activePaidUsers = new Set(
    (entitlements || []).filter(isPackageEntitlementTimeValid).map((row) => row.user_id)
  );

  return users.map((user) => {
    const latestIntent = latestIntentByUser.get(user.id) || null;
    const paymentStatus = activePaidUsers.has(user.id)
      ? 'PAID'
      : latestIntent?.status || 'N/A';
    return {
      ...user,
      registration_intent_status: latestIntent?.status || null,
      payment_status: paymentStatus,
    };
  });
};

export const createUserProfile = async (userData) => {
  const payload = {
    email: userData.email,
    password: userData.password,
    fullName: userData.fullName,
    professionId: userData.professionId || null,
    healthAuthorityId: userData.healthAuthorityId || null,
    dailyMcqLimit: typeof userData.dailyMcqLimit === 'number' ? userData.dailyMcqLimit : userData.dailyMcqLimit || null,
    isActive: userData.isActive !== false,
    accessMode: userData.accessMode === 'MANUAL' ? 'MANUAL' : 'AUTO',
    packageId: userData.packageId || null,
  };

  if (payload.dailyMcqLimit !== null) {
    payload.dailyMcqLimit = Number(payload.dailyMcqLimit);
  }

  return callAdminUsersApi('POST', payload);
};

export const updateUserProfile = async (userId, userData) => {
  const payload = {
    id: userId,
    fullName: userData.fullName,
    professionId: userData.professionId || null,
    healthAuthorityId: userData.healthAuthorityId || null,
    dailyMcqLimit: typeof userData.dailyMcqLimit === 'number' ? userData.dailyMcqLimit : userData.dailyMcqLimit || null,
    isActive: userData.isActive,
    password: userData.password,
    accessMode: userData.accessMode === 'MANUAL' ? 'MANUAL' : 'AUTO',
  };

  if (payload.dailyMcqLimit !== null) {
    payload.dailyMcqLimit = Number(payload.dailyMcqLimit);
  }

  return callAdminUsersApi('PUT', payload);
};

export const deleteUserProfile = async (userId) => {
  await callAdminUsersApi('DELETE', { id: userId });
};

// Professions
export const getProfessions = async () => {
  const { data, error } = await supabase
    .from('professions')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

export const createProfession = async (professionData) => {
  const { data, error } = await supabase
    .from('professions')
    .insert(professionData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProfession = async (id, professionData) => {
  const { data, error } = await supabase
    .from('professions')
    .update(professionData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteProfession = async (id) => {
  const { error } = await supabase.from('professions').delete().eq('id', id);
  if (error) throw error;
};

// Health Authorities
export const getHealthAuthorities = async () => {
  const { data, error } = await supabase
    .from('health_authorities')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

export const createHealthAuthority = async (haData) => {
  const { data, error } = await supabase
    .from('health_authorities')
    .insert(haData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateHealthAuthority = async (id, haData) => {
  const { data, error } = await supabase
    .from('health_authorities')
    .update(haData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteHealthAuthority = async (id) => {
  const { error } = await supabase.from('health_authorities').delete().eq('id', id);
  if (error) throw error;
};

// Exams
export const getExams = async () => {
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      questions(count),
      _count:questions(count)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

    /*export const getAvailableExams = async (userId) => {
      // Get user profile first
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('profession_id, health_authority_id, role, access_mode')
        .eq('id', userId)
        .single();

      if (!profile) return [];

      const accessMode = profile.access_mode || 'AUTO';

      let userPackageId = null;

      if (profile.role !== 'ADMIN' && accessMode === 'AUTO') {
        const { data: entRows, error: entErr } = await supabase
          .from('user_entitlements')
          .select('package_id')
          .eq('user_id', userId)
          .eq('scope', 'PACKAGE')
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .limit(1);
        if (entErr) throw entErr;
        if (!entRows?.length) return [];
        userPackageId = entRows[0]?.package_id ?? null;
      }

      let exams = [];

      // If admin, return all active exams
      if (profile.role === 'ADMIN') {
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;
        exams = data || [];
      } else {
        const { data: activeExams, error: activeExamsError } = await supabase
          .from('exams')
          .select('*')
          .eq('is_active', true);

        if (activeExamsError) throw activeExamsError;
        if (!activeExams || activeExams.length === 0) return [];

        const activeExamIds = activeExams.map((exam) => exam.id).filter(Boolean);
        const { data: allAccessRules, error: accessError } = await supabase
          .from('exam_access')
          .select('exam_id, user_id, profession_id, health_authority_id')
          .in('exam_id', activeExamIds);

        if (accessError) throw accessError;

        const accessByExamId = new Map();
        (allAccessRules || []).forEach((rule) => {
          if (!accessByExamId.has(rule.exam_id)) {
            accessByExamId.set(rule.exam_id, []);
          }
          accessByExamId.get(rule.exam_id).push(rule);
        });

        exams = activeExams.filter((exam) => {
          const rules = accessByExamId.get(exam.id) || [];
          return userHasExamAccessFromRules(rules, userId, profile);
        });
      }*/

        export const getAvailableExams = async (userId) => {
          // 1. Fetch User Profile
          const { data: profile, error: pErr } = await supabase
            .from('user_profiles')
            .select('profession_id, health_authority_id, role, access_mode')
            .eq('id', userId)
            .single();
        
          if (pErr || !profile) {
            console.error("DEBUG: Profile not found for ID:", userId);
            return [];
          }
        
          if (import.meta.env.DEV) {
            console.log('DEBUG: User Profile Loaded:', { userId, role: profile.role, profession: profile.profession_id });
          }
        
          const accessMode = profile.access_mode || 'AUTO';
          let exams = [];
          let packageAccessLocked = false;
          let packageEndedAt = null;

          // 2. Handle Admins (Show all active exams)
          if (profile.role === 'ADMIN') {
            const { data: adminExams } = await supabase
              .from('exams')
              .select('*')
              .eq('is_active', true);
            
            exams = adminExams || [];
          } else {
            // 3. Handle Regular Users
            let userPackageId = null;
            if (accessMode === 'AUTO') {
              const pkgCtx = await getAutoPackageAccessContext(userId);
              if (pkgCtx.kind === 'none') {
                console.warn('DEBUG: No PACKAGE entitlement found for user.');
                return [];
              }
              userPackageId = pkgCtx.packageId;
              if (pkgCtx.kind === 'expired') {
                packageAccessLocked = true;
                packageEndedAt = pkgCtx.endsAt || null;
              }
              if (import.meta.env.DEV) {
                console.log('DEBUG: Package context:', pkgCtx.kind, userPackageId);
              }
            }

            const examGrantRows = await queryValidExamEntitlements(userId);
            const grantedExamIdSet = new Set(
              (examGrantRows || []).map((r) => idKey(r.exam_id)).filter(Boolean)
            );
        
            // 4. Fetch All Active Exams and Rules
            const { data: activeExams } = await supabase
              .from('exams')
              .select('*')
              .eq('is_active', true);
        
            if (import.meta.env.DEV) {
              console.log('DEBUG: Total Active Exams in DB:', activeExams?.length || 0);
            }
        
            if (!activeExams?.length) return [];
        
            const activeExamIds = activeExams.map((e) => e.id);
            const { data: allAccessRules } = await supabase
              .from('exam_access')
              .select('exam_id, user_id, profession_id, health_authority_id')
              .in('exam_id', activeExamIds);
        
            const accessByExamId = new Map();
            (allAccessRules || []).forEach((rule) => {
              const key = idKey(rule.exam_id);
              if (!accessByExamId.has(key)) accessByExamId.set(key, []);
              accessByExamId.get(key).push(rule);
            });
        
            // 5. Gate 1: Profession / access rules (admin or purchased per-exam grant bypasses rules)
            let filteredByProfession = activeExams.filter((exam) => {
              if (grantedExamIdSet.has(idKey(exam.id))) {
                return true;
              }
              const rules = accessByExamId.get(idKey(exam.id)) || [];
              const hasAccess = userHasExamAccessFromRules(rules, userId, profile);
              if (import.meta.env.DEV && !hasAccess) {
                console.log(`DEBUG: Exam "${exam.title}" REJECTED by Profession Gate. Rules found:`, rules.length);
              }
              return hasAccess;
            });
        
            if (import.meta.env.DEV) {
              console.log('DEBUG: Exams remaining after Profession Gate:', filteredByProfession.length);
            }
        
            // 6. Gate 2: Package Filtering (ONLY for AUTO users); per-exam entitlement bypasses package
            if (accessMode === 'AUTO' && userPackageId) {
              const { data: peRows, error: peErr } = await supabase
                .from('package_exams')
                .select('exam_id')
                .eq('package_id', userPackageId);

              if (peErr) {
                console.error('[getAvailableExams] package_exams:', peErr.message || peErr);
              }

              let allowedInPackage = new Set((peRows || []).map((r) => idKey(r.exam_id)));

              // Direct read can return [] when RLS blocks the client even though rows exist.
              // Catalog API uses the service role and returns the same package ↔ exam links.
              if (allowedInPackage.size === 0) {
                allowedInPackage = await fetchPackageExamIdsForPackage(userPackageId);
              }

              const passesPackageGate = (e) => {
                if (grantedExamIdSet.has(idKey(e.id))) return true;
                if (allowedInPackage.size === 0) return true;
                return allowedInPackage.has(idKey(e.id));
              };

              if (allowedInPackage.size === 0) {
                console.warn(
                  '[getAvailableExams] No exam IDs resolved for package; using profession filter only.',
                  userPackageId
                );
              }

              exams = filteredByProfession.filter((e) => {
                const ok = passesPackageGate(e);
                if (import.meta.env.DEV && !ok) {
                  console.log(`DEBUG: Exam "${e.title}" REJECTED by Package Gate. Not in package:`, userPackageId);
                }
                return ok;
              });
            } else {
              exams = filteredByProfession;
            }
          }
        
          if (import.meta.env.DEV) {
            console.log('DEBUG: Final Exam Count to be displayed:', exams.length);
          }
        
          if (!exams || exams.length === 0) return [];
        
          // 7. Get actual question counts for each filtered exam
          const examsWithCounts = await Promise.all(
            exams.map(async (exam) => {
              const { count, error: countError } = await supabase
                .from('questions')
                .select('*', { count: 'exact', head: true })
                .eq('exam_id', exam.id);
        
              if (countError) {
                return { ...exam, questions: [], _questionCount: 0 };
              }
        
              return {
                ...exam,
                questions: Array(count || 0).fill(null).map((_, i) => ({ id: i })),
                _questionCount: count || 0,
              };
            })
          );
        
          // 8. Determine Addon Purchase Status
          const finalExamIds = examsWithCounts.map((exam) => exam.id).filter(Boolean);
          let paidExamEntitlements = new Set();
          
          if (finalExamIds.length > 0) {
            const { data: entitlements } = await supabase
              .from('user_entitlements')
              .select('exam_id, ends_at')
              .eq('user_id', userId)
              .eq('scope', 'EXAM')
              .eq('status', 'ACTIVE')
              .in('exam_id', finalExamIds);

            paidExamEntitlements = new Set(
              (entitlements || [])
                .filter(isPackageEntitlementTimeValid)
                .map((e) => idKey(e.exam_id))
                .filter(Boolean)
            );
          }

          const latestExamEntitlementByExam = new Map();
          if (finalExamIds.length > 0) {
            const { data: examEntHistory } = await supabase
              .from('user_entitlements')
              .select('exam_id, status, ends_at, created_at')
              .eq('user_id', userId)
              .eq('scope', 'EXAM')
              .in('exam_id', finalExamIds)
              .order('created_at', { ascending: false });

            for (const r of examEntHistory || []) {
              const k = idKey(r.exam_id);
              if (!latestExamEntitlementByExam.has(k)) {
                latestExamEntitlementByExam.set(k, r);
              }
            }
          }

          return examsWithCounts.map((exam) => {
            const ek = idKey(exam.id);
            const latestEnt = latestExamEntitlementByExam.get(ek);
            const addonExpired =
              !!exam.addon_enabled &&
              !paidExamEntitlements.has(ek) &&
              !!latestEnt &&
              (latestEnt.status === 'EXPIRED' ||
                (latestEnt.status === 'ACTIVE' && !isPackageEntitlementTimeValid(latestEnt)));

            return {
              ...exam,
              addonPurchased: !exam.addon_enabled || paidExamEntitlements.has(ek),
              addonExpired,
              packageAccessLocked,
              packageEndedAt: packageAccessLocked ? packageEndedAt : null,
            };
          });
        }; // This is line 620 - ensure no extra "}" follow it until "export const getExam"

export const getExam = async (examId, userId) => {
  // Check access first
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('profession_id, health_authority_id, role, daily_mcq_limit, access_mode')
    .eq('id', userId)
    .single();

  if (!profile) throw new Error('User not found');

  await assertPaidAccessForExams(profile, userId);

  const effectiveDailyLimit = await resolveEffectiveDailyLimit({
    userId,
    profileDailyLimit: profile.daily_mcq_limit,
    accessMode: profile.access_mode,
  });

  // Check if user has access
  if (profile.role !== 'ADMIN') {
    const examEntitlementRows = await queryValidExamEntitlements(userId);
    const hasExamEntitlement = examEntitlementRows.some(
      (r) => idKey(r.exam_id) === idKey(examId)
    );

    const { data: accessRules, error: accessError } = await supabase
      .from('exam_access')
      .select('id, user_id, profession_id, health_authority_id')
      .eq('exam_id', examId);

    if (accessError) throw accessError;

    const hasRuleAccess = userHasExamAccessFromRules(accessRules || [], userId, profile);

    if (!hasRuleAccess && !hasExamEntitlement) {
      throw new Error('You have no access to this exam. Please contact your representative.');
    }

    const examAccessMode = profile.access_mode || 'AUTO';
    if (examAccessMode === 'AUTO') {
      const pkgEntRows = await queryValidPackageEntitlements(userId, 'package_id, ends_at');
      const pid = pkgEntRows?.[0]?.package_id;
      if (pid && !hasExamEntitlement) {
        const { data: peRow, error: peErr } = await supabase
          .from('package_exams')
          .select('exam_id')
          .eq('package_id', pid)
          .eq('exam_id', examId)
          .maybeSingle();
        if (peErr) throw peErr;
        if (!peRow) {
          throw new Error('This exam is not included in your package.');
        }
      }
    }

    const { data: examMeta, error: examMetaError } = await supabase
      .from('exams')
      .select('id, title, addon_enabled')
      .eq('id', examId)
      .maybeSingle();

    if (examMetaError) throw examMetaError;
    if (examMeta?.addon_enabled && !hasExamEntitlement) {
      throw new Error(
        `This exam requires an additional addon purchase before you can start.`
      );
    }
  }

  // First, get the actual total count of questions in the database for this exam
  const { count: totalQuestionsInDatabase, error: countError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', examId);

  if (countError) {
    console.error('Error getting question count:', countError);
  }

  // Get ALL question IDs from the database (not just paginated results)
  // This ensures we check all questions, not just the first 1000
  // Use pagination to get all IDs if there are more than 1000
  let allQuestionIdsData = [];
  let hasMore = true;
  let page = 0;
  const pageSize = 1000;
  
  while (hasMore) {
    const { data: pageData, error: allIdsError } = await supabase
      .from('questions')
      .select('id')
      .eq('exam_id', examId)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (allIdsError) {
      console.error('Error getting all question IDs:', allIdsError);
      break;
    }
    
    if (pageData && pageData.length > 0) {
      allQuestionIdsData = allQuestionIdsData.concat(pageData);
      hasMore = pageData.length === pageSize;
      page++;
    } else {
      hasMore = false;
    }
  }

  // Get exam with questions (include correct answers/explanations for inline feedback)
  // Note: Supabase may limit results, so we get questions but also have the count above
  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      questions(
        id,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        explanation
      )
    `)
    .eq('id', examId)
    .eq('is_active', true)
    .single();

  if (error) throw error;

  // Use the actual database count, or fall back to returned questions length
  // Safely determine the actual total questions in the database:
  // - Prefer a positive DB count
  // - If DB count is 0 or null but we have allQuestionIdsData or questions array, fall back to those
  const dbTotalQuestions =
    typeof totalQuestionsInDatabase === 'number' && totalQuestionsInDatabase > 0
      ? totalQuestionsInDatabase
      : null;
  const actualTotalQuestions =
    dbTotalQuestions ??
    (allQuestionIdsData && allQuestionIdsData.length > 0
      ? allQuestionIdsData.length
      : data.questions?.length || 0);

  // Check if exam exists and has questions
  if (!data || !data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('You have no access to this exam. Please contact your representative.');
  }

  // Get user's previous attempts for this exam to filter out already-submitted questions
  // This ensures questions don't repeat across different days/sessions
  const { data: previousAttempts, error: attemptsError } = await supabase
    .from('exam_attempts')
    .select('answers')
    .eq('user_id', userId)
    .eq('exam_id', examId);

  if (attemptsError) {
    console.error('Error fetching previous attempts:', attemptsError);
    // Continue without filtering if there's an error, but log it
  }

  // Extract all question IDs that were already answered in previous attempts
  // Normalize all IDs to strings for consistent comparison (UUIDs can be strings or UUID objects)
  // Only include questions that were actually answered (not null/undefined)
  const answeredQuestionIds = new Set();
  if (previousAttempts && previousAttempts.length > 0) {
    previousAttempts.forEach((attempt) => {
      if (attempt.answers && typeof attempt.answers === 'object') {
        Object.keys(attempt.answers).forEach((questionId) => {
          // Only include questions that were actually answered (not null/undefined)
          const answerValue = attempt.answers[questionId];
          if (answerValue !== null && answerValue !== undefined) {
            // Normalize to string and trim whitespace for consistent comparison
            // Handle UUID objects by converting to string first
            let normalizedId = questionId;
            if (typeof questionId !== 'string') {
              normalizedId = String(questionId);
            }
            normalizedId = normalizedId.trim().toLowerCase();
            if (normalizedId) {
              answeredQuestionIds.add(normalizedId);
            }
          }
        });
      }
    });
  }

  // Get all question IDs from database (normalized) for comparison
  // Also keep a map of normalized -> original ID for querying
  const allQuestionIdsInDatabase = new Set();
  const normalizedToOriginalIdMap = new Map();
  
  if (allQuestionIdsData && allQuestionIdsData.length > 0) {
    allQuestionIdsData.forEach((q) => {
      let originalId = q.id;
      let id = originalId;
      if (typeof id !== 'string') id = String(id);
      const normalized = id.trim().toLowerCase();
      allQuestionIdsInDatabase.add(normalized);
      normalizedToOriginalIdMap.set(normalized, originalId);
    });
  } else {
    // Fallback: use questions from the exam query
    data.questions.forEach((q) => {
      let originalId = q.id;
      let id = originalId;
      if (typeof id !== 'string') id = String(id);
      const normalized = id.trim().toLowerCase();
      allQuestionIdsInDatabase.add(normalized);
      normalizedToOriginalIdMap.set(normalized, originalId);
    });
  }

  // Filter out questions that were already submitted in ANY previous attempt
  // This prevents questions from repeating across different days
  // Only include questions that exist in the database and haven't been answered
  let availableQuestions = data.questions.filter((question) => {
    // Normalize question ID to string for comparison
    // Handle UUID objects by converting to string first
    let normalizedQuestionId = question.id;
    if (typeof normalizedQuestionId !== 'string') {
      normalizedQuestionId = String(normalizedQuestionId);
    }
    normalizedQuestionId = normalizedQuestionId.trim().toLowerCase();
    // Check if this question hasn't been answered
    return !answeredQuestionIds.has(normalizedQuestionId);
  });

  // Check if user has answered all questions in the database
  // Compare against actual database count, not just returned questions
  const remainingQuestionsCount = actualTotalQuestions - answeredQuestionIds.size;
  
  // IMPORTANT: Only throw error if user has truly answered ALL questions in the database
  // Check remainingQuestionsCount first to avoid false positives
  if (remainingQuestionsCount <= 0) {
    // User has answered all questions - this is the only case where we should throw
    // Add debug info to help diagnose the issue
    const allQuestionIds = data.questions.map(q => {
      let id = q.id;
      if (typeof id !== 'string') id = String(id);
      return id.trim().toLowerCase();
    });
    const answeredIds = Array.from(answeredQuestionIds);
    
    console.error('No available questions after filtering:', {
      totalQuestionsInDatabase: actualTotalQuestions,
      questionsReturnedInQuery: data.questions.length,
      answeredQuestionIdsCount: answeredQuestionIds.size,
      remainingQuestionsCount: remainingQuestionsCount,
      answeredQuestionIds: answeredIds.slice(0, 10), // First 10 for debugging
      allQuestionIds: allQuestionIds.slice(0, 10), // First 10 for debugging
      previousAttemptsCount: previousAttempts?.length || 0,
    });
    
    throw new Error(
      `You have already completed all available questions for this exam. ` +
      `(Total questions in database: ${actualTotalQuestions}, Questions answered: ${answeredQuestionIds.size})`
    );
  }
  
  // If no questions in returned set but there are still questions in database,
  // it means Supabase pagination limited the results - we need to fetch more
  if (availableQuestions.length === 0 && remainingQuestionsCount > 0) {
    console.warn('No questions in returned query, but database has more questions. Fetching all questions and filtering client-side...', {
      totalQuestionsInDatabase: actualTotalQuestions,
      questionsReturnedInQuery: data.questions.length,
      answeredQuestionIdsCount: answeredQuestionIds.size,
      remainingQuestionsCount: remainingQuestionsCount,
    });
    
    // Use a simpler, more reliable approach: fetch all questions in batches and filter client-side
    // This avoids issues with .in() clause limits
    let allQuestionsFromDB = [];
    let hasMoreQuestions = true;
    let questionPage = 0;
    const questionPageSize = 1000;
    
    while (hasMoreQuestions && allQuestionsFromDB.length < actualTotalQuestions) {
      const { data: pageQuestions, error: pageError } = await supabase
        .from('questions')
        .select('id, question, option_a, option_b, option_c, option_d, correct_answer, explanation')
        .eq('exam_id', examId)
        .range(questionPage * questionPageSize, (questionPage + 1) * questionPageSize - 1);
      
      if (pageError) {
        console.error(`Error fetching questions page ${questionPage}:`, pageError);
        break;
      }
      
      if (pageQuestions && pageQuestions.length > 0) {
        allQuestionsFromDB = allQuestionsFromDB.concat(pageQuestions);
        hasMoreQuestions = pageQuestions.length === questionPageSize;
        questionPage++;
      } else {
        hasMoreQuestions = false;
      }
    }
    
    if (allQuestionsFromDB.length > 0) {
      // Filter client-side to get unanswered questions
      const unansweredQuestions = allQuestionsFromDB.filter((question) => {
        let normalizedQuestionId = question.id;
        if (typeof normalizedQuestionId !== 'string') {
          normalizedQuestionId = String(normalizedQuestionId);
        }
        normalizedQuestionId = normalizedQuestionId.trim().toLowerCase();
        return !answeredQuestionIds.has(normalizedQuestionId);
      });
      
      if (unansweredQuestions.length > 0) {
        availableQuestions = unansweredQuestions;
        console.log(`Successfully fetched ${unansweredQuestions.length} unanswered questions out of ${allQuestionsFromDB.length} total questions`);
      } else {
        // This shouldn't happen if remainingQuestionsCount > 0, but handle it anyway
        console.error('Filtered all questions but found none unanswered. This indicates a data mismatch.', {
          totalFetched: allQuestionsFromDB.length,
          answeredCount: answeredQuestionIds.size,
          remainingExpected: remainingQuestionsCount,
        });
        throw new Error(
          `Unable to load available questions. ` +
          `(Total questions in database: ${actualTotalQuestions}, Questions answered: ${answeredQuestionIds.size}, ` +
          `Remaining: ${remainingQuestionsCount}, Fetched: ${allQuestionsFromDB.length})`
        );
      }
    } else {
      throw new Error(
        `Unable to load available questions. ` +
        `(Total questions in database: ${actualTotalQuestions}, Questions answered: ${answeredQuestionIds.size}, ` +
        `Remaining: ${remainingQuestionsCount}, Could not fetch questions from database)`
      );
    }
  }

  // Randomize the order of questions using Fisher-Yates shuffle
  for (let i = availableQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
  }

  // Randomize options for each question
  const questionsWithRandomizedOptions = availableQuestions.map((question) => {
    // Validate that all options exist (check for null/undefined specifically, not empty strings)
    if (question.option_a == null || question.option_b == null || question.option_c == null || question.option_d == null) {
      throw new Error(`Question "${question.id}" is missing one or more options. Please contact support.`);
    }

    // Create array of options with their original labels
    // Ensure all option texts are strings (handle null/undefined by converting to empty string)
    const optionA = { label: 'A', text: String(question.option_a || '') };
    const optionB = { label: 'B', text: String(question.option_b || '') };
    const optionC = { label: 'C', text: String(question.option_c || '') };
    const optionD = { label: 'D', text: String(question.option_d || '') };
    
    const options = [optionA, optionB, optionC, optionD];

    // Ensure we have exactly 4 valid options
    if (options.length !== 4) {
      throw new Error(`Question "${question.id}" must have exactly 4 options. Found ${options.length}. Please contact support.`);
    }
    
    // Validate each option object is valid
    options.forEach((opt, idx) => {
      if (!opt || typeof opt !== 'object' || !opt.hasOwnProperty('text') || !opt.hasOwnProperty('label')) {
        throw new Error(`Question "${question.id}" has invalid option at index ${idx}. Please contact support.`);
      }
    });

    // Shuffle the options array
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    // Validate that all options still exist after shuffling
    if (options.length !== 4 || !options[0] || !options[1] || !options[2] || !options[3]) {
      throw new Error(`Question "${question.id}" has invalid options after processing. Please contact support.`);
    }

    // Validate that all options have text property (check for existence, not truthiness - empty strings are valid)
    if (!options[0].hasOwnProperty('text') || !options[1].hasOwnProperty('text') || 
        !options[2].hasOwnProperty('text') || !options[3].hasOwnProperty('text')) {
      throw new Error(`Question "${question.id}" is missing option text property. Please contact support.`);
    }

    // Create mapping: randomized position -> original option label
    // e.g., {0: 'C', 1: 'A', 2: 'D', 3: 'B'} means position 0 shows original option C
    const optionMapping = {};
    const reverseMapping = {}; // original option -> randomized position
    options.forEach((opt, index) => {
      if (opt && opt.label) {
        optionMapping[index] = opt.label;
        reverseMapping[opt.label] = index;
      }
    });

    // Safely extract text from options (with additional safety checks)
    const getOptionText = (opt, index) => {
      if (!opt || typeof opt !== 'object' || !opt.hasOwnProperty('text')) {
        throw new Error(`Question "${question.id}" has invalid option at index ${index}. Please contact support.`);
      }
      return opt.text || '';
    };

    // Update the question with randomized options and mappings
    return {
      ...question,
      option_a: getOptionText(options[0], 0),
      option_b: getOptionText(options[1], 1),
      option_c: getOptionText(options[2], 2),
      option_d: getOptionText(options[3], 3),
      optionMapping, // Maps randomized position (0-3) to original option (A-D)
      reverseMapping, // Maps original option (A-D) to randomized position (0-3)
      // Store the randomized correct answer position for easy checking
      randomizedCorrectAnswer: reverseMapping[question.correct_answer],
    };
  });

  // Update the exam data with randomized and filtered questions
  const examDataWithRandomQuestions = {
    ...data,
    questions: questionsWithRandomizedOptions,
  };

  // Check daily limit
  let usageRecord = null;
  if (effectiveDailyLimit !== null) {
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('daily_mcq_usage')
      .select('mcq_count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    usageRecord = usage;
    const used = usageRecord?.mcq_count || 0;
    const remaining = effectiveDailyLimit - used;

    // Only throw error if user has no MCQs remaining
    if (remaining <= 0) {
      throw new Error(
        `Daily MCQ limit reached. You have used all ${effectiveDailyLimit} MCQs for today.`
      );
    }

    // Limit questions to remaining daily limit if exam has more questions
    if (remaining < examDataWithRandomQuestions.questions.length) {
      examDataWithRandomQuestions.questions = examDataWithRandomQuestions.questions.slice(0, remaining);
    }
  }

  return {
    exam: examDataWithRandomQuestions,
    dailyUsage: {
      mcqCount: usageRecord?.mcq_count || 0,
      limit: effectiveDailyLimit,
      remaining:
        effectiveDailyLimit !== null
          ? effectiveDailyLimit - (usageRecord?.mcq_count || 0)
          : null,
    },
  };
};

/**
 * Profession-only exam_access rows (no user grant, no HA): used by Exam Management to scope exams by profession.
 */
export const getExamProfessionAccessIds = async (examId) => {
  if (!examId) return [];
  const { data, error } = await supabase
    .from('exam_access')
    .select('profession_id')
    .eq('exam_id', examId)
    .is('user_id', null)
    .is('health_authority_id', null)
    .not('profession_id', 'is', null);

  if (error) throw error;
  return [...new Set((data || []).map((r) => r.profession_id).filter(Boolean))];
};

/**
 * Replace profession-only access rows for an exam (does not remove user-specific or HA-composite rows from Access Management).
 */
export const syncExamProfessionAccess = async (examId, professionIds) => {
  if (!examId) return;

  const { error: delError } = await supabase
    .from('exam_access')
    .delete()
    .eq('exam_id', examId)
    .is('user_id', null)
    .is('health_authority_id', null)
    .not('profession_id', 'is', null);

  if (delError) throw delError;

  const ids = [...new Set((professionIds || []).filter(Boolean))];
  if (ids.length === 0) return;

  const rows = ids.map((profession_id) => ({
    exam_id: examId,
    profession_id,
    health_authority_id: null,
    user_id: null,
    source: 'ADMIN',
  }));

  const { error: insError } = await supabase.from('exam_access').insert(rows);
  if (insError) throw insError;
};

/** Package IDs linked to an exam (subscription catalog / package gate for AUTO users). */
export const getExamPackageIds = async (examId) => {
  if (!examId) return [];
  const { data, error } = await supabase
    .from('package_exams')
    .select('package_id')
    .eq('exam_id', examId);

  if (error) throw error;
  return [...new Set((data || []).map((r) => r.package_id).filter(Boolean))];
};

/**
 * Replace all package_exams rows for an exam. Empty list = exam not in any package (paid users
 * won't see it unless they have a direct exam entitlement).
 */
export const syncExamPackageLinks = async (examId, packageIds) => {
  if (!examId) return;

  const { error: delError } = await supabase.from('package_exams').delete().eq('exam_id', examId);
  if (delError) throw delError;

  const ids = [...new Set((packageIds || []).filter(Boolean))];
  if (ids.length === 0) return;

  const rows = ids.map((package_id) => ({ package_id, exam_id: examId }));
  const { error: insError } = await supabase.from('package_exams').insert(rows);
  if (insError) throw insError;
};

/** All packages for admin UI (includes inactive). */
export const getPackagesForAdmin = async () => {
  const { data, error } = await supabase
    .from('packages')
    .select('id, name, is_active, sort_order')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createExam = async (examData) => {
  const { questions, professionIds, packageIds, ...examInfo } = examData;

  const { data: exam, error: examError } = await supabase
    .from('exams')
    .insert(examInfo)
    .select()
    .single();

  if (examError) throw examError;

  if (professionIds !== undefined) {
    await syncExamProfessionAccess(exam.id, professionIds);
  }

  if (packageIds !== undefined) {
    await syncExamPackageLinks(exam.id, packageIds);
  }

  if (questions && questions.length > 0) {
    const questionsData = questions.map((q) => ({
      ...q,
      exam_id: exam.id,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      option_d: q.optionD,
      correct_answer: q.correctAnswer,
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsData);

    if (questionsError) throw questionsError;
  }

  return exam;
};

export const updateExam = async (id, examData) => {
  const { professionIds, packageIds, ...examFields } = examData;

  const { data, error } = await supabase
    .from('exams')
    .update(examFields)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (professionIds !== undefined) {
    await syncExamProfessionAccess(id, professionIds);
  }

  if (packageIds !== undefined) {
    await syncExamPackageLinks(id, packageIds);
  }

  return data;
};

export const deleteExam = async (id) => {
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) throw error;
};

// Questions
export const addQuestion = async (examId, questionData) => {
  const { data, error } = await supabase
    .from('questions')
    .insert({
      exam_id: examId,
      question: questionData.question,
      option_a: questionData.optionA,
      option_b: questionData.optionB,
      option_c: questionData.optionC,
      option_d: questionData.optionD,
      correct_answer: questionData.correctAnswer,
      explanation: questionData.explanation || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const bulkAddQuestions = async (examId, questions) => {
  if (!questions || questions.length === 0) {
    throw new Error('No questions provided for bulk upload');
  }

  const payload = questions.map((q) => ({
    exam_id: examId,
    question: q.question,
    option_a: q.optionA,
    option_b: q.optionB,
    option_c: q.optionC,
    option_d: q.optionD,
    correct_answer: q.correctAnswer,
    explanation: q.explanation || null,
  }));

  const { error } = await supabase.from('questions').insert(payload);

  if (error) throw error;
};

export const updateQuestion = async (id, questionData) => {
  const { data, error } = await supabase
    .from('questions')
    .update({
      question: questionData.question,
      option_a: questionData.optionA,
      option_b: questionData.optionB,
      option_c: questionData.optionC,
      option_d: questionData.optionD,
      correct_answer: questionData.correctAnswer,
      explanation: questionData.explanation || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteQuestion = async (id) => {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
};

// Exam Access
export const getExamAccess = async () => {
  const { data, error } = await supabase
    .from('exam_access')
    .select(`
      *,
      exam:exams(*),
      profession:professions(*),
      health_authority:health_authorities(*),
      user:user_profiles(id, email, full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createExamAccess = async (accessData) => {
  const { data, error } = await supabase
    .from('exam_access')
    .insert({
      exam_id: accessData.examId,
      profession_id: accessData.professionId || null,
      health_authority_id: accessData.healthAuthorityId || null,
      user_id: accessData.userId || null,
    })
    .select(`
      *,
      exam:exams(*),
      profession:professions(*),
      health_authority:health_authorities(*),
      user:user_profiles(id, email, full_name)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const deleteExamAccess = async (id) => {
  const { error } = await supabase.from('exam_access').delete().eq('id', id);
  if (error) throw error;
};

// Exam Attempts
export const submitExam = async (examId, userId, answers, timeSpent, clientCorrectCount = null) => {
  // Helper to normalize IDs (UUIDs) to a consistent lowercase string
  const normalizeId = (id) => {
    if (!id) return '';
    let str = id;
    if (typeof str !== 'string') {
      str = String(str);
    }
    return str.trim().toLowerCase();
  };

  // Normalize the answers object keys so they match normalized question IDs
  const normalizedAnswers = {};
  if (answers && typeof answers === 'object') {
    Object.keys(answers).forEach((key) => {
      const normalizedKey = normalizeId(key);
      if (normalizedKey) {
        normalizedAnswers[normalizedKey] = answers[key];
      }
    });
  }

  // Get exam with correct answers
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select(`
      *,
      questions(*)
    `)
    .eq('id', examId)
    .single();

  if (examError) throw examError;

  // Build a lookup map of questions by normalized ID
  const questionsById = new Map();
  (exam.questions || []).forEach((question) => {
    const normalizedQuestionId = normalizeId(question.id);
    if (normalizedQuestionId) {
      questionsById.set(normalizedQuestionId, question);
    }
  });

  // Calculate how many questions in this attempt were actually answered
  let correctAnswers = 0;
  let answeredCount = 0;

  Object.keys(normalizedAnswers).forEach((normalizedId) => {
    const question = questionsById.get(normalizedId);
    if (!question) return;

    const userAnswer = normalizedAnswers[normalizedId];
    if (userAnswer !== null && userAnswer !== undefined) {
      answeredCount++;
      if (userAnswer === question.correct_answer) {
        correctAnswers++;
      }
    }
  });

  // If the client provided a trusted correct-count based on the same
  // randomized questions it displayed (randomizedCorrectAnswer),
  // prefer that value. This protects against any rare ID-mapping issues
  // between the client and the exam/questions fetched here.
  if (typeof clientCorrectCount === 'number' && clientCorrectCount >= 0) {
    correctAnswers = clientCorrectCount;
  }

  // Get user daily limit and total exam questions count
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('daily_mcq_limit, access_mode, role')
    .eq('id', userId)
    .single();

  await assertPaidAccessForExams(profile, userId);

  const dailyLimit = await resolveEffectiveDailyLimit({
    userId,
    profileDailyLimit: profile?.daily_mcq_limit ?? null,
    accessMode: profile?.access_mode || null,
  });

  // Get total questions in exam from database
  const { count: totalExamQuestionsInDB } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', examId);

  // Safely determine total exam questions:
  // - Prefer a positive DB count
  // - If DB count is 0 or null but we have questions from the joined exam, fall back to that length
  // - As a last resort, fall back to the number of questions answered in this attempt
  const dbQuestionCount =
    typeof totalExamQuestionsInDB === 'number' && totalExamQuestionsInDB > 0
      ? totalExamQuestionsInDB
      : null;
  const totalExamQuestions =
    dbQuestionCount ??
    (exam.questions && Array.isArray(exam.questions) && exam.questions.length > 0
      ? exam.questions.length
      : answeredCount);
  const totalQuestionsAnswered = answeredCount;

  // Get all previous attempts for this exam to calculate cumulative metrics
  const { data: previousAttempts } = await supabase
    .from('exam_attempts')
    .select('correct_answers, total_questions, answers')
    .eq('user_id', userId)
    .eq('exam_id', examId)
    .order('completed_at', { ascending: true });

  // Calculate cumulative correct answers and answered questions across all attempts (including this one)
  let cumulativeCorrectAnswers = correctAnswers;
  let cumulativeAnsweredQuestions = answeredCount;

  if (previousAttempts && previousAttempts.length > 0) {
    previousAttempts.forEach((prevAttempt) => {
      cumulativeCorrectAnswers += typeof prevAttempt.correct_answers === 'number' 
        ? prevAttempt.correct_answers 
        : Number(prevAttempt.correct_answers) || 0;
      
      // Count answered questions from previous attempts
      const prevAnsweredCount = prevAttempt.answers
        ? Object.values(prevAttempt.answers).filter((val) => val !== null && val !== undefined).length
        : (typeof prevAttempt.total_questions === 'number' ? prevAttempt.total_questions : Number(prevAttempt.total_questions) || 0);
      
      cumulativeAnsweredQuestions += prevAnsweredCount;
    });
  }

  // THREE METRICS SYSTEM:
  // 1. MAIN SCORE: Correct Answers / Daily Limit (primary metric)
  const mainScore = dailyLimit && dailyLimit > 0
    ? Math.min((correctAnswers / dailyLimit) * 100, 100) // Cap at 100%
    : null; // No main score if no daily limit

  // 2. ATTEMPT OVERVIEW: Cumulative Correct Answers / Cumulative Questions Answered in ALL attempts till this attempt
  const attemptOverview = cumulativeAnsweredQuestions > 0
    ? (cumulativeCorrectAnswers / cumulativeAnsweredQuestions) * 100
    : 0;

  // 3. OVERALL RESULT: Cumulative Correct Answers / Total MCQs in database for this exam
  // This reflects overall progress across all attempts, not just this one.
  const overallResult = totalExamQuestions > 0
    ? (cumulativeCorrectAnswers / totalExamQuestions) * 100
    : 0;

  // Use main score if available, otherwise use attempt overview as the primary score
  const score = mainScore !== null ? mainScore : attemptOverview;

  // Create attempt
  const { data: attempt, error: attemptError } = await supabase
    .from('exam_attempts')
    .insert({
      user_id: userId,
      exam_id: examId,
      score,
      total_questions: totalQuestionsAnswered,
      correct_answers: correctAnswers,
      time_spent: timeSpent,
      answers,
    })
    .select(`
      *,
      exam:exams(title, exam_type)
    `)
    .single();

  if (attemptError) throw attemptError;

  // Update daily MCQ usage
  const today = new Date().toISOString().split('T')[0];
  const { data: existingUsage } = await supabase
    .from('daily_mcq_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (existingUsage) {
    await supabase
      .from('daily_mcq_usage')
      .update({ mcq_count: existingUsage.mcq_count + answeredCount })
      .eq('id', existingUsage.id);
  } else {
    await supabase.from('daily_mcq_usage').insert({
      user_id: userId,
      date: today,
      mcq_count: answeredCount,
    });
  }

  // Prepare per-question results for the questions that belong to this attempt
  const results = (exam.questions || []).map((question) => {
    const normalizedQuestionId = normalizeId(question.id);
    const userAnswer = normalizedQuestionId ? normalizedAnswers[normalizedQuestionId] : undefined;

    return {
      questionId: question.id,
      question: question.question,
      userAnswer: userAnswer ?? null,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      isCorrect: userAnswer === question.correct_answer,
    };
  });

  return {
    attempt,
    results,
    // Primary score (main score or attempt overview)
    score,
    // Three metrics system
    mainScore, // Correct / Daily Limit (primary if daily limit exists)
    attemptOverview, // Cumulative Correct / Cumulative Questions Answered in ALL attempts
    overallResult, // Correct / Total MCQs in database
    // Supporting data
    correctAnswers,
    totalQuestionsAnswered,
    totalExamQuestions,
    answeredCount,
    dailyLimit,
    // Cumulative data for attempt overview
    cumulativeCorrectAnswers,
    cumulativeAnsweredQuestions,
  };
};

// Normalize numeric fields from Supabase (returns decimals as strings) and attach derived usage
// This function is used for existing attempts, so we calculate all three metrics
// cumulativeCorrectAnswers and cumulativeAnsweredQuestions should be passed for attempt overview calculation
const normalizeAttempt = (attempt, dailyLimit = null, totalExamQuestions = null, cumulativeCorrectAnswers = null, cumulativeAnsweredQuestions = null) => {
  const normalized = {
    ...attempt,
    score: typeof attempt.score === 'number' ? attempt.score : Number(attempt.score) || 0,
    total_questions:
      typeof attempt.total_questions === 'number'
        ? attempt.total_questions
        : Number(attempt.total_questions) || 0,
    correct_answers:
      typeof attempt.correct_answers === 'number'
        ? attempt.correct_answers
        : Number(attempt.correct_answers) || 0,
    time_spent:
      typeof attempt.time_spent === 'number' ? attempt.time_spent : Number(attempt.time_spent) || 0,
  };

  const answeredCount = attempt?.answers
    ? Object.values(attempt.answers).filter((val) => val !== null && val !== undefined).length
    : normalized.total_questions;
  const correctCount = normalized.correct_answers;

  // Use provided total exam questions or fallback to total_questions.
  // Be careful with 0: if caller passes 0 but this attempt clearly has questions,
  // prefer the attempt's total_questions as a safer fallback.
  const hasValidTotalFromCaller =
    typeof totalExamQuestions === 'number' && totalExamQuestions > 0;
  const totalExamQuestionsCount = hasValidTotalFromCaller
    ? totalExamQuestions
    : normalized.total_questions;

  // Use provided cumulative values or calculate from this attempt only
  const cumulativeCorrect = cumulativeCorrectAnswers !== null ? cumulativeCorrectAnswers : correctCount;
  const cumulativeAnswered = cumulativeAnsweredQuestions !== null ? cumulativeAnsweredQuestions : answeredCount;

  // THREE METRICS SYSTEM:
  // 1. MAIN SCORE: Correct Answers / Daily Limit (primary metric)
  const mainScore = dailyLimit && dailyLimit > 0
    ? Math.min((correctCount / dailyLimit) * 100, 100) // Cap at 100%
    : null;

  // 2. ATTEMPT OVERVIEW: Cumulative Correct Answers / Cumulative Questions Answered in ALL attempts till this attempt
  const attemptOverview = cumulativeAnswered > 0
    ? (cumulativeCorrect / cumulativeAnswered) * 100
    : 0;

  // 3. OVERALL RESULT: Cumulative Correct Answers / Total MCQs in database for this exam
  // This reflects overall progress across all attempts, not just this one.
  const overallResult = totalExamQuestionsCount > 0
    ? (cumulativeCorrect / totalExamQuestionsCount) * 100
    : 0;

  // Use main score if available, otherwise use attempt overview as the primary score
  const recalculatedScore = mainScore !== null ? mainScore : attemptOverview;

  return {
    ...normalized,
    score: recalculatedScore, // Primary score
    // Three metrics
    mainScore,
    attemptOverview,
    overallResult,
    // Supporting data
    answeredCount,
    totalQuestionsAnswered: answeredCount,
    totalExamQuestions: totalExamQuestionsCount,
    dailyLimit,
    correctCount,
    // Cumulative data
    cumulativeCorrectAnswers: cumulativeCorrect,
    cumulativeAnsweredQuestions: cumulativeAnswered,
  };
};

export const getUserAttempts = async (userId, examId = null) => {
  // Fetch user profile once so we can compute daily-limit-based percentages
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('daily_mcq_limit, access_mode')
    .eq('id', userId)
    .maybeSingle();
  const dailyLimit = await resolveEffectiveDailyLimit({
    userId,
    profileDailyLimit: profile?.daily_mcq_limit ?? null,
    accessMode: profile?.access_mode || null,
  });

  let query = supabase
    .from('exam_attempts')
    .select(`
      *,
      exam:exams(title, exam_type, duration)
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (examId) {
    query = query.eq('exam_id', examId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Get unique exam IDs to fetch question counts
  const examIds = [...new Set((data || []).map(a => a.exam_id))];
  
  // Fetch question counts for all exams in parallel
  const examQuestionCounts = {};
  if (examIds.length > 0) {
    await Promise.all(
      examIds.map(async (examId) => {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('exam_id', examId);
        // Only trust a positive count; if 0 or null, we'll fall back later to attempt data
        examQuestionCounts[examId] =
          typeof count === 'number' && count > 0 ? count : null;
      })
    );
  }

  // Group attempts by exam_id and calculate cumulative metrics
  const attemptsByExam = {};
  (data || []).forEach(attempt => {
    if (!attemptsByExam[attempt.exam_id]) {
      attemptsByExam[attempt.exam_id] = [];
    }
    attemptsByExam[attempt.exam_id].push(attempt);
  });

  // Calculate cumulative metrics for each exam
  const cumulativeMetrics = {};
  Object.keys(attemptsByExam).forEach(examId => {
    // Sort attempts by completed_at ascending to calculate cumulative
    const sortedAttempts = [...attemptsByExam[examId]].sort((a, b) => 
      new Date(a.completed_at) - new Date(b.completed_at)
    );
    
    let cumulativeCorrect = 0;
    let cumulativeAnswered = 0;
    
    sortedAttempts.forEach(attempt => {
      const correct = typeof attempt.correct_answers === 'number' 
        ? attempt.correct_answers 
        : Number(attempt.correct_answers) || 0;
      const answered = attempt.answers
        ? Object.values(attempt.answers).filter((val) => val !== null && val !== undefined).length
        : (typeof attempt.total_questions === 'number' ? attempt.total_questions : Number(attempt.total_questions) || 0);
      
      cumulativeCorrect += correct;
      cumulativeAnswered += answered;
      
      if (!cumulativeMetrics[attempt.id]) {
        cumulativeMetrics[attempt.id] = {};
      }
      cumulativeMetrics[attempt.id] = {
        cumulativeCorrectAnswers: cumulativeCorrect,
        cumulativeAnsweredQuestions: cumulativeAnswered,
      };
    });
  });

  return (data || []).map((attempt) => 
    normalizeAttempt(
      attempt, 
      dailyLimit, 
      examQuestionCounts[attempt.exam_id],
      cumulativeMetrics[attempt.id]?.cumulativeCorrectAnswers,
      cumulativeMetrics[attempt.id]?.cumulativeAnsweredQuestions
    )
  );
};

// Fetch a single attempt and build per-question review data (answered MCQs)
export const getAttemptReview = async (userId, attemptId) => {
  if (!userId || !attemptId) {
    throw new Error('Missing user or attempt id');
  }

  const normalizeId = (id) => {
    if (!id) return '';
    let str = id;
    if (typeof str !== 'string') str = String(str);
    return str.trim().toLowerCase();
  };

  const extractUuid = (value) => {
    if (!value) return null;
    const str = typeof value === 'string' ? value : String(value);
    const match = str.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    return match ? match[0].toLowerCase() : null;
  };

  const { data: attempt, error: attemptError } = await supabase
    .from('exam_attempts')
    .select(`
      *,
      exam:exams(title, exam_type, duration)
    `)
    .eq('id', attemptId)
    .eq('user_id', userId)
    .single();

  if (attemptError) throw attemptError;
  if (!attempt) throw new Error('Attempt not found');

  // Answers can exist in different shapes depending on historical data:
  // - object map: { [questionId]: 'A'|'B'|'C'|'D' }
  // - nested: { answers: { ... } }
  // - array: [ { questionId, answer }, ... ]
  const rawAnswers = attempt?.answers;
  let answersMap = {};
  if (rawAnswers && typeof rawAnswers === 'object') {
    if (Array.isArray(rawAnswers)) {
      // Legacy: array of entries
      rawAnswers.forEach((entry) => {
        const qid = normalizeId(entry?.questionId ?? entry?.question_id ?? entry?.id);
        const val = entry?.answer ?? entry?.value ?? entry?.userAnswer ?? null;
        if (qid) answersMap[qid] = val;
      });
    } else if (rawAnswers.answers && typeof rawAnswers.answers === 'object' && !Array.isArray(rawAnswers.answers)) {
      // Legacy: nested map
      answersMap = rawAnswers.answers;
    } else {
      // Current: direct map
      answersMap = rawAnswers;
    }
  }

  const normalizedAnswers = {};
  Object.keys(answersMap || {}).forEach((k) => {
    const nk = normalizeId(k);
    if (nk) normalizedAnswers[nk] = answersMap[k];
  });

  // Fetch ONLY the questions that the user answered in this attempt.
  // This avoids Supabase 1000-row limits on large exams (e.g., NPQE).
  const answeredEntries = Object.entries(normalizedAnswers).filter(([, v]) => v !== null && v !== undefined);
  const answeredQuestionIds = answeredEntries
    .map(([k]) => extractUuid(k) || k) // support legacy keys that embed the UUID
    .filter(Boolean);

  // If we have no answered IDs, we can return early.
  if (answeredQuestionIds.length === 0) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('daily_mcq_limit, access_mode')
      .eq('id', userId)
      .maybeSingle();

    const dailyLimit = await resolveEffectiveDailyLimit({
      userId,
      profileDailyLimit: profile?.daily_mcq_limit ?? null,
      accessMode: profile?.access_mode || null,
    });

    const { count: totalExamQuestionsInDB } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', attempt.exam_id);

    const totalExamQuestions =
      typeof totalExamQuestionsInDB === 'number' && totalExamQuestionsInDB > 0
        ? totalExamQuestionsInDB
        : null;

    return {
      attempt: normalizeAttempt(attempt, dailyLimit, totalExamQuestions),
      results: [],
      _debug: {
        questionsFetched: 0,
        answersKeys: Object.keys(normalizedAnswers).length,
        answeredMatched: 0,
        sampleAnswerKeys: Object.keys(normalizedAnswers).slice(0, 5),
        answeredIds: answeredQuestionIds.slice(0, 5),
      },
    };
  }

  const chunkSize = 500;
  const fetchedQuestions = [];
  for (let i = 0; i < answeredQuestionIds.length; i += chunkSize) {
    const chunk = answeredQuestionIds.slice(i, i + chunkSize);
    const { data: chunkQuestions, error: chunkError } = await supabase
      .from('questions')
      .select('id, question, option_a, option_b, option_c, option_d, correct_answer, explanation')
      .eq('exam_id', attempt.exam_id)
      .in('id', chunk);

    if (chunkError) throw chunkError;
    if (chunkQuestions && chunkQuestions.length > 0) {
      fetchedQuestions.push(...chunkQuestions);
    }
  }

  const questionsById = new Map();
  (fetchedQuestions || []).forEach((q) => {
    questionsById.set(normalizeId(q.id), q);
  });

  // Build results in the same order as the answers keys (stable review)
  const answeredResults = answeredEntries
    .map(([rawKey, userAnswer]) => {
      const qid = extractUuid(rawKey) || normalizeId(rawKey);
      const q = questionsById.get(qid);
      if (!q) return null;
      return {
        questionId: q.id,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        userAnswer: userAnswer ?? null,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        isCorrect: userAnswer === q.correct_answer,
      };
    })
    .filter(Boolean);

  // Reuse the same normalization logic as lists (dailyLimit/overall totals will be calculated by caller in UI as needed).
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('daily_mcq_limit, access_mode')
    .eq('id', userId)
    .maybeSingle();

  const dailyLimit = await resolveEffectiveDailyLimit({
    userId,
    profileDailyLimit: profile?.daily_mcq_limit ?? null,
    accessMode: profile?.access_mode || null,
  });

  // total questions in exam (for overallResult) - prefer DB count
  const { count: totalExamQuestionsInDB } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('exam_id', attempt.exam_id);

  const totalExamQuestions =
    typeof totalExamQuestionsInDB === 'number' && totalExamQuestionsInDB > 0
      ? totalExamQuestionsInDB
      : null;

  return {
    attempt: normalizeAttempt(attempt, dailyLimit, totalExamQuestions),
    results: answeredResults,
    // Helps diagnose cases where old attempts exist but review is empty.
    _debug: {
      questionsFetched: (fetchedQuestions || []).length,
      answersKeys: Object.keys(normalizedAnswers).length,
      answeredMatched: answeredResults.length,
      sampleAnswerKeys: Object.keys(normalizedAnswers).slice(0, 5),
      answeredIds: answeredQuestionIds.slice(0, 5),
    },
  };
};

// Dashboard
export const getUserDashboard = async (userId) => {
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select(`
      *,
      profession:professions(*),
      health_authority:health_authorities(*)
    `)
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;
  const effectiveDailyLimit = await resolveEffectiveDailyLimit({
    userId,
    profileDailyLimit: profile.daily_mcq_limit,
    accessMode: profile.access_mode,
  });

  const today = new Date().toISOString().split('T')[0];
  const { data: usage } = await supabase
    .from('daily_mcq_usage')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  const { data: attempts } = await supabase
    .from('exam_attempts')
    .select(`
      *,
      exam:exams(title, exam_type)
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(10);

  // Get unique exam IDs to fetch question counts
  const examIds = [...new Set((attempts || []).map(a => a.exam_id))];
  
  // Fetch question counts for all exams in parallel
  const examQuestionCounts = {};
  if (examIds.length > 0) {
    await Promise.all(
      examIds.map(async (examId) => {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('exam_id', examId);
        // Only trust a positive count; if 0 or null, we'll fall back later to attempt data
        examQuestionCounts[examId] =
          typeof count === 'number' && count > 0 ? count : null;
      })
    );
  }

  // For each exam, get all attempts to calculate cumulative metrics
  const cumulativeMetrics = {};
  for (const examId of examIds) {
    const { data: allExamAttempts } = await supabase
      .from('exam_attempts')
      .select('id, correct_answers, total_questions, answers, completed_at')
      .eq('user_id', userId)
      .eq('exam_id', examId)
      .order('completed_at', { ascending: true });
    
    if (allExamAttempts && allExamAttempts.length > 0) {
      let cumulativeCorrect = 0;
      let cumulativeAnswered = 0;
      
      allExamAttempts.forEach(attempt => {
        const correct = typeof attempt.correct_answers === 'number' 
          ? attempt.correct_answers 
          : Number(attempt.correct_answers) || 0;
        const answered = attempt.answers
          ? Object.values(attempt.answers).filter((val) => val !== null && val !== undefined).length
          : (typeof attempt.total_questions === 'number' ? attempt.total_questions : Number(attempt.total_questions) || 0);
        
        cumulativeCorrect += correct;
        cumulativeAnswered += answered;
        
        cumulativeMetrics[attempt.id] = {
          cumulativeCorrectAnswers: cumulativeCorrect,
          cumulativeAnsweredQuestions: cumulativeAnswered,
        };
      });
    }
  }

  return {
    user: {
      ...profile,
      profession: profile.profession,
      healthAuthority: profile.health_authority,
      dailyMcqLimit: effectiveDailyLimit,
      fullName: profile.full_name,
    },
    recentAttempts: (attempts || []).map((attempt) => 
      normalizeAttempt(
        attempt, 
        effectiveDailyLimit, 
        examQuestionCounts[attempt.exam_id],
        cumulativeMetrics[attempt.id]?.cumulativeCorrectAnswers,
        cumulativeMetrics[attempt.id]?.cumulativeAnsweredQuestions
      )
    ),
    dailyUsage: {
      used: usage?.mcq_count || 0,
      limit: effectiveDailyLimit,
      remaining:
        effectiveDailyLimit !== null
          ? effectiveDailyLimit - (usage?.mcq_count || 0)
          : null,
    },
  };
};

// Admin Stats
export const getAdminStats = async () => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Basic counts
    const [
      usersResult,
      examsResult,
      attemptsResult,
      professionsResult,
      healthAuthoritiesResult,
      pendingPaymentsResult,
      readyIntentResult,
      paidEntitlementsResult,
    ] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('exams').select('id', { count: 'exact', head: true }),
      supabase.from('exam_attempts').select('id', { count: 'exact', head: true }),
      supabase.from('professions').select('id', { count: 'exact', head: true }),
      supabase.from('health_authorities').select('id', { count: 'exact', head: true }),
      supabase
        .from('registration_intents')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'PENDING_PAYMENT'),
      supabase
        .from('registration_intents')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'READY'),
      supabase
        .from('user_entitlements')
        .select('user_id, ends_at')
        .eq('scope', 'PACKAGE')
        .eq('status', 'ACTIVE'),
    ]);

    // Get all attempts for analytics
    const { data: allAttempts, error: attemptsError } = await supabase
      .from('exam_attempts')
      .select('score, completed_at, user_id, exam_id')
      .order('completed_at', { ascending: false });

    // Get recent attempts (last 10) with user daily limit
    const { data: recentAttempts } = await supabase
      .from('exam_attempts')
      .select(`
        *,
        exam:exams(title, exam_type),
        user:user_profiles(full_name, email, daily_mcq_limit, access_mode)
      `)
      .order('completed_at', { ascending: false })
      .limit(10);

    const recentUserIds = [...new Set((recentAttempts || []).map((a) => a.user_id).filter(Boolean))];
    const effectiveDailyByUser = new Map();
    await Promise.all(
      recentUserIds.map(async (uid) => {
        const row = (recentAttempts || []).find((a) => a.user_id === uid);
        const u = row?.user;
        const limit = await resolveEffectiveDailyLimit({
          userId: uid,
          profileDailyLimit: u?.daily_mcq_limit ?? null,
          accessMode: u?.access_mode ?? 'AUTO',
        });
        effectiveDailyByUser.set(uid, limit);
      })
    );

    // Get new users (last 7 days)
    const { data: newUsers } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, created_at')
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    // Get active users (users who attempted exams in last 7 days)
    const { data: activeUsersData } = await supabase
      .from('exam_attempts')
      .select('user_id')
      .gte('completed_at', weekAgo.toISOString());

    const uniqueActiveUsers = new Set(activeUsersData?.map(a => a.user_id) || []);

    // Calculate time-based statistics
    const attemptsToday = allAttempts?.filter(a => new Date(a.completed_at) >= today).length || 0;
    const attemptsThisWeek = allAttempts?.filter(a => new Date(a.completed_at) >= weekAgo).length || 0;
    const attemptsThisMonth = allAttempts?.filter(a => new Date(a.completed_at) >= monthAgo).length || 0;

    // Calculate average score
    const scores = allAttempts?.map(a => parseFloat(a.score) || 0).filter(s => s > 0) || [];
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;

    // Calculate pass rate (assuming 70% is passing)
    const passingScore = 70;
    const passingAttempts = scores.filter(s => s >= passingScore).length;
    const passRate = scores.length > 0 ? (passingAttempts / scores.length) * 100 : 0;

    // Get exam popularity (top 5 most attempted exams)
    const examAttemptCounts = {};
    allAttempts?.forEach(attempt => {
      examAttemptCounts[attempt.exam_id] = (examAttemptCounts[attempt.exam_id] || 0) + 1;
    });
    const topExamIds = Object.entries(examAttemptCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);

    const { data: topExams } = topExamIds.length > 0
      ? await supabase
          .from('exams')
          .select('id, title, exam_type')
          .in('id', topExamIds)
      : { data: [] };

    const topExamsWithCounts = topExams?.map(exam => ({
      ...exam,
      attemptCount: examAttemptCounts[exam.id] || 0
    })).sort((a, b) => b.attemptCount - a.attemptCount) || [];

    // Get daily activity for last 7 days (for chart)
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];
      
      const count = allAttempts?.filter(a => {
        const attemptDate = new Date(a.completed_at);
        return attemptDate >= date && attemptDate < nextDate;
      }).length || 0;
      
      dailyActivity.push({
        date: dateStr,
        count,
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }

    // Check for errors
    const errors = [
      usersResult.error,
      examsResult.error,
      attemptsResult.error,
      professionsResult.error,
      healthAuthoritiesResult.error,
      pendingPaymentsResult.error,
      readyIntentResult.error,
      paidEntitlementsResult.error,
      attemptsError,
    ].filter(Boolean);

    if (errors.length > 0) {
      const errorMessages = errors.map(e => e.message).join('; ');
      throw new Error(`Failed to load statistics: ${errorMessages}`);
    }

    // Get unique exam IDs to fetch question counts
    const adminExamIds = [...new Set((recentAttempts || []).map(a => a.exam_id))];
    
    // Fetch question counts for all exams in parallel
    const adminExamQuestionCounts = {};
    if (adminExamIds.length > 0) {
      await Promise.all(
        adminExamIds.map(async (examId) => {
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', examId);
          adminExamQuestionCounts[examId] = count ?? 0;
        })
      );
    }

    // Calculate cumulative metrics for each user-exam combination
    const adminCumulativeMetrics = {};
    for (const attempt of recentAttempts || []) {
      const key = `${attempt.user_id}_${attempt.exam_id}`;
      if (!adminCumulativeMetrics[key]) {
        // Get all attempts for this user-exam combination
        const { data: allUserExamAttempts } = await supabase
          .from('exam_attempts')
          .select('id, correct_answers, total_questions, answers, completed_at')
          .eq('user_id', attempt.user_id)
          .eq('exam_id', attempt.exam_id)
          .order('completed_at', { ascending: true });
        
        if (allUserExamAttempts && allUserExamAttempts.length > 0) {
          let cumulativeCorrect = 0;
          let cumulativeAnswered = 0;
          
          allUserExamAttempts.forEach(userAttempt => {
            const correct = typeof userAttempt.correct_answers === 'number' 
              ? userAttempt.correct_answers 
              : Number(userAttempt.correct_answers) || 0;
            const answered = userAttempt.answers
              ? Object.values(userAttempt.answers).filter((val) => val !== null && val !== undefined).length
              : (typeof userAttempt.total_questions === 'number' ? userAttempt.total_questions : Number(userAttempt.total_questions) || 0);
            
            cumulativeCorrect += correct;
            cumulativeAnswered += answered;
            
            adminCumulativeMetrics[`${attempt.user_id}_${attempt.exam_id}_${userAttempt.id}`] = {
              cumulativeCorrectAnswers: cumulativeCorrect,
              cumulativeAnsweredQuestions: cumulativeAnswered,
            };
          });
        }
      }
    }

    const paidUserCount = new Set(
      (paidEntitlementsResult.data || [])
        .filter(isPackageEntitlementTimeValid)
        .map((row) => row.user_id)
    ).size;

    return {
      // Basic counts
      totalUsers: usersResult.count || 0,
      totalExams: examsResult.count || 0,
      totalAttempts: attemptsResult.count || 0,
      totalProfessions: professionsResult.count || 0,
      totalHealthAuthorities: healthAuthoritiesResult.count || 0,
      pendingPayments: pendingPaymentsResult.count || 0,
      readyIntents: readyIntentResult.count || 0,
      paidUsers: paidUserCount,
      
      // Performance metrics
      averageScore: Math.round(averageScore * 10) / 10,
      passRate: Math.round(passRate * 10) / 10,
      
      // Time-based stats
      attemptsToday,
      attemptsThisWeek,
      attemptsThisMonth,
      activeUsers: uniqueActiveUsers.size,
      newUsersThisWeek: newUsers?.length || 0,
      
      // Recent activity
      recentAttempts: recentAttempts?.map(attempt => {
        const dailyLimit = effectiveDailyByUser.get(attempt.user_id) ?? null;
        const totalExamQuestions = adminExamQuestionCounts[attempt.exam_id] ?? attempt.total_questions;
        const key = `${attempt.user_id}_${attempt.exam_id}_${attempt.id}`;
        
        return normalizeAttempt(
          attempt, 
          dailyLimit, 
          totalExamQuestions,
          adminCumulativeMetrics[key]?.cumulativeCorrectAnswers,
          adminCumulativeMetrics[key]?.cumulativeAnsweredQuestions
        );
      }) || [],
      newUsers: newUsers || [],
      
      // Top exams
      topExams: topExamsWithCounts,
      
      // Chart data
      dailyActivity,
    };
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    throw error;
  }
};

/** Supabase Storage bucket for eligibility assessment uploads (see migration 020). */
export const ELIGIBILITY_STORAGE_BUCKET = 'eligibility-documents';

const ELIGIBILITY_MAX_FILE_BYTES = 15 * 1024 * 1024;

function assertEligibilityFileSize(file) {
  if (file && file.size > ELIGIBILITY_MAX_FILE_BYTES) {
    throw new Error('Each file must be 15 MB or smaller.');
  }
}

async function uploadEligibilityDocument(userId, submissionId, partName, file, index) {
  if (!file) return null;
  assertEligibilityFileSize(file);
  const dot = file.name.lastIndexOf('.');
  const ext = dot >= 0 ? file.name.slice(dot) : '';
  const suffix = index != null ? `-${index}` : '';
  const path = `${userId}/${submissionId}/${partName}${suffix}${ext}`;
  const { error } = await supabase.storage.from(ELIGIBILITY_STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/**
 * Uploads optional documents and inserts one eligibility_assessments row.
 * @param {string} userId
 * @param {object} data — answers and File objects from the client form
 */
export async function submitEligibilityAssessment(userId, data) {
  if (!userId) throw new Error('Not logged in');

  await assertEligibilityAssessmentAccess(userId);

  const submissionId = crypto.randomUUID();

  const graduationYearDoc = await uploadEligibilityDocument(
    userId,
    submissionId,
    'graduation-year',
    data.graduationYearDoc,
    null
  );
  const degreeIssuedYearDoc = await uploadEligibilityDocument(
    userId,
    submissionId,
    'degree-issued-year',
    data.degreeIssuedYearDoc,
    null
  );
  const cf = data.credentialFiles || {};
  const credentialUploads = [
    ['diploma-certificate', cf.diplomaCertificate],
    ['diploma-transcript', cf.diplomaTranscript],
    ['bs-degree', cf.bsDegree],
    ['bs-transcript', cf.bsTranscript],
    ['masters-degree', cf.mastersDegree],
    ['masters-transcript', cf.mastersTranscript],
    ['phd-degree', cf.phdDegree],
    ['phd-transcript', cf.phdTranscript],
  ];
  const credentials = {};
  for (const [partName, file] of credentialUploads) {
    credentials[partName.replace(/-/g, '_')] = await uploadEligibilityDocument(
      userId,
      submissionId,
      partName,
      file,
      null
    );
  }

  const healthLicense = await uploadEligibilityDocument(
    userId,
    submissionId,
    'health-license',
    data.healthLicenseFile,
    null
  );

  const experienceLetterPaths = [];
  const letters = Array.isArray(data.experienceLetterFiles) ? data.experienceLetterFiles : [];
  for (let i = 0; i < letters.length; i += 1) {
    const p = await uploadEligibilityDocument(userId, submissionId, 'experience-letter', letters[i], i);
    if (p) experienceLetterPaths.push(p);
  }

  const payload = {
    graduation_year: data.graduationYear,
    degree_issued_year: data.degreeIssuedYear,
    document_attestation: data.documentAttestation || null,
    has_health_license: data.hasHealthLicense === 'yes',
    experience: {
      start: data.experienceStart || null,
      end: data.stillWorking ? null : data.experienceEnd || null,
      still_working: !!data.stillWorking,
    },
    multiple_experience_letters: data.multipleExperienceLetters === 'yes',
    file_paths: {
      graduation_year_doc: graduationYearDoc,
      degree_issued_year_doc: degreeIssuedYearDoc,
      credentials,
      health_license: healthLicense,
      experience_letters: experienceLetterPaths,
    },
  };

  const { data: row, error } = await supabase
    .from('eligibility_assessments')
    .insert({
      user_id: userId,
      qualification_level: data.qualificationLevel,
      profession_id: data.professionId ?? null,
      health_authority_id: data.healthAuthorityId ?? null,
      payload,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: row.id, submissionId };
}

/** Updates the signed-in user's profession and health authority (RPC; see migration 021). */
export async function updateMyProfessionAndHealthAuthority(professionId, healthAuthorityId) {
  const { error } = await supabase.rpc('set_user_profession_and_health_authority', {
    p_profession_id: professionId,
    p_health_authority_id: healthAuthorityId,
  });
  if (error) throw error;
}
