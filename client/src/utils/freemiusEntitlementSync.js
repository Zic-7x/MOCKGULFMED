import { supabase } from '../lib/supabase';

/**
 * Posts purchase completion to the server so entitlements and exam_access are provisioned.
 * Requires a logged-in Supabase session (Bearer JWT).
 */
export async function syncFreemiusEntitlement(payload, apiUrl) {
  const url =
    apiUrl ||
    import.meta.env.VITE_FREEMIUS_WEBHOOK_API_URL ||
    '/api/freemius-webhook';

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('You must be signed in to sync your purchase.');
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  let json = {};
  try {
    json = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(json?.error || `Purchase sync failed (${res.status})`);
  }

  return json?.data;
}
