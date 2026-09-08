import { syncFreemiusEntitlement } from './freemiusEntitlementSync';

export const FREEMIUS_PRODUCT_ID = import.meta.env.VITE_FREEMIUS_PRODUCT_ID || '27532';
export const FREEMIUS_PUBLIC_KEY = import.meta.env.VITE_FREEMIUS_PUBLIC_KEY || '';
export const FREEMIUS_IMAGE = import.meta.env.VITE_FREEMIUS_IMAGE || '';
export const FREEMIUS_WEBHOOK_API_URL =
  import.meta.env.VITE_FREEMIUS_WEBHOOK_API_URL || '/api/freemius-webhook';

export const FALLBACK_PLAN_BY_PACKAGE_NAME = {
  'Basic Monthly': '45534',
  'Acing the Exam (3 Months)': '45536',
  'Mastering the Exam Annual (12 Months)': '45537',
};

export const DIRECT_CHECKOUT_BY_PACKAGE_NAME = {
  'Basic Monthly':
    import.meta.env.VITE_BASIC_MONTHLY_TRIAL_CHECKOUT_URL ||
    'https://checkout.freemius.com/product/27532/plan/45534/?trial=paid',
};

let freemiusScriptPromise = null;

export function ensureFreemiusCheckoutScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Freemius checkout can only run in the browser.'));
  }
  if (window.FS?.Checkout) return Promise.resolve(window.FS);
  if (freemiusScriptPromise) return freemiusScriptPromise;

  freemiusScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-freemius-checkout="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.FS), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Freemius checkout script.')),
        { once: true }
      );
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.freemius.com/js/v1/';
    script.async = true;
    script.dataset.freemiusCheckout = 'true';
    script.onload = () => resolve(window.FS);
    script.onerror = () => reject(new Error('Failed to load Freemius checkout script.'));
    document.body.appendChild(script);
  });

  return freemiusScriptPromise;
}

export function getPlanIdForPackage(pkg) {
  if (!pkg) return null;
  if (pkg.freemius_plan_id) return String(pkg.freemius_plan_id);
  if (pkg.freemiusPlanId) return String(pkg.freemiusPlanId);
  return FALLBACK_PLAN_BY_PACKAGE_NAME[pkg.name] || null;
}

export function isFreemiusReady() {
  return Boolean(FREEMIUS_PUBLIC_KEY && FREEMIUS_PRODUCT_ID);
}

/**
 * Opens Freemius checkout modal for a package and syncs the entitlement upon completion.
 */
export async function launchFreemiusPackageCheckout({
  pkg,
  user,
  onPurchaseCompleted,
  onCancel,
  onError,
}) {
  const planId = getPlanIdForPackage(pkg);
  const directCheckoutUrl = DIRECT_CHECKOUT_BY_PACKAGE_NAME[pkg?.name] || null;

  if (!planId && !directCheckoutUrl) {
    const err = new Error(`Plan ID is missing for "${pkg?.name || 'this package'}".`);
    onError?.(err);
    throw err;
  }

  // If public key is not configured or in environments requiring direct checkout URL:
  if (!isFreemiusReady() && directCheckoutUrl) {
    window.location.assign(directCheckoutUrl);
    return;
  }

  if (!isFreemiusReady()) {
    const err = new Error('Checkout is not configured yet. Please contact support.');
    onError?.(err);
    throw err;
  }

  try {
    const FS = await ensureFreemiusCheckoutScript();
    const handler = new FS.Checkout({
      product_id: String(FREEMIUS_PRODUCT_ID),
      plan_id: String(planId),
      public_key: FREEMIUS_PUBLIC_KEY,
      image: FREEMIUS_IMAGE || undefined,
    });

    const userEmail = user?.email || undefined;
    const fullName = user?.fullName || user?.full_name || user?.user_metadata?.full_name || '';
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || undefined;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

    const isTrial = pkg?.name === 'Basic Monthly' || pkg?.isTrial || false;

    handler.open({
      name: pkg?.name || 'Subscription Package',
      licenses: 1,
      trial: isTrial ? 'paid' : undefined,
      user_email: userEmail,
      user_firstname: firstName,
      user_lastname: lastName,
      user: userEmail
        ? {
            email: userEmail,
            name: fullName || undefined,
          }
        : undefined,
      purchaseCompleted: async (response) => {
        try {
          const externalRef =
            response?.subscription?.id ||
            response?.license?.id ||
            response?.license?.key ||
            response?.order?.id ||
            null;

          if (user?.id) {
            await syncFreemiusEntitlement(
              {
                userId: user.id,
                packageId: pkg.id,
                status: 'ACTIVE',
                externalRef: externalRef ? String(externalRef) : null,
              },
              FREEMIUS_WEBHOOK_API_URL
            );
          }
          onPurchaseCompleted?.(response);
        } catch (syncErr) {
          console.error('[Freemius checkout] sync error:', syncErr);
          onError?.(syncErr);
        }
      },
      cancel: () => {
        onCancel?.();
      },
      success: () => {},
    });
  } catch (error) {
    console.error('[Freemius checkout] open error:', error);
    onError?.(error);
    throw error;
  }
}
