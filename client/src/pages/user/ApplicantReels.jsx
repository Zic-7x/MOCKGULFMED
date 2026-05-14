import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { syncFreemiusEntitlement } from '../../utils/freemiusEntitlementSync';
import {
  APPLICANT_REELS_STORAGE_BUCKET,
  getActiveReelsEntitlement,
  REELS_ADDON_CODE,
} from '../../utils/supabaseQueries';
import './ApplicantReels.css';

const FREEMIUS_PRODUCT_ID = import.meta.env.VITE_FREEMIUS_PRODUCT_ID || '27532';
const FREEMIUS_PUBLIC_KEY = import.meta.env.VITE_FREEMIUS_PUBLIC_KEY || '';
const FREEMIUS_IMAGE = import.meta.env.VITE_FREEMIUS_IMAGE || '';
const FREEMIUS_WEBHOOK_API_URL = import.meta.env.VITE_FREEMIUS_WEBHOOK_API_URL || '/api/freemius-webhook';
const REELS_PLAN_ID = import.meta.env.VITE_FREEMIUS_REELS_PLAN_ID || '';

const REELS_PRICE_LABEL = '30,000 PKR';
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

let freemiusScriptPromise;

function ensureFreemiusCheckoutScript() {
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

function extFromFile(file) {
  const n = file?.name || '';
  const dot = n.lastIndexOf('.');
  if (dot >= 0) return n.slice(dot + 1).toLowerCase() || 'mp4';
  return 'mp4';
}

export default function ApplicantReels() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const { data: reelsEnt, isLoading: entLoading } = useQuery({
    queryKey: ['reelsEntitlement', user?.id],
    queryFn: () => getActiveReelsEntitlement(user.id),
    enabled: !!user?.id,
  });

  const { data: reels, isLoading: reelsLoading } = useQuery({
    queryKey: ['applicantReels', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applicant_reels')
        .select('id, status, visibility, caption, video_path, thumbnail_path, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!reelsEnt,
  });

  const freemiusReady = useMemo(
    () => Boolean(FREEMIUS_PUBLIC_KEY && FREEMIUS_PRODUCT_ID && REELS_PLAN_ID),
    []
  );

  const refreshReels = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['reelsEntitlement', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['applicantReels', user?.id] });
  }, [queryClient, user?.id]);

  const handlePurchase = async () => {
    if (!user?.id) return;
    if (!freemiusReady) {
      toast.error('Reels checkout is not configured. Set VITE_FREEMIUS_REELS_PLAN_ID and Freemius keys.');
      return;
    }
    try {
      setCheckoutBusy(true);
      const FS = await ensureFreemiusCheckoutScript();
      const handler = new FS.Checkout({
        product_id: String(FREEMIUS_PRODUCT_ID),
        plan_id: String(REELS_PLAN_ID),
        public_key: FREEMIUS_PUBLIC_KEY,
        image: FREEMIUS_IMAGE || undefined,
      });
      handler.open({
        name: 'Applicant Intro Reels',
        licenses: 1,
        purchaseCompleted: (response) => {
          const externalRef =
            response?.subscription?.id ||
            response?.license?.id ||
            response?.license?.key ||
            response?.order?.id ||
            null;
          syncFreemiusEntitlement(
            {
              userId: user.id,
              scope: 'ADDON',
              addonCode: REELS_ADDON_CODE,
              status: 'ACTIVE',
              externalRef: externalRef || null,
            },
            FREEMIUS_WEBHOOK_API_URL
          )
            .then(() => {
              toast.success('Reels add-on activated. You can upload your intro video.');
              refreshReels();
            })
            .catch((syncErr) => {
              toast.error(syncErr?.message || 'Purchase sync failed. Contact support with your receipt.');
            });
        },
        success: () => {},
      });
    } catch (e) {
      toast.error(e?.message || 'Could not open checkout.');
    } finally {
      setCheckoutBusy(false);
    }
  };

  const createDraft = async () => {
    const { data, error } = await supabase
      .from('applicant_reels')
      .insert({
        user_id: user.id,
        status: 'DRAFT',
        visibility: 'PUBLIC',
        caption: '',
      })
      .select('id')
      .single();
    if (error) {
      toast.error(error.message || 'Could not create reel draft.');
      return;
    }
    toast.success('Draft created. Upload a vertical video (MP4 or WebM, max ~80 MB).');
    refreshReels();
    return data?.id;
  };

  const handleUpload = async (reelId, file) => {
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error('Video must be 80 MB or smaller.');
      return;
    }
    if (!file.type.startsWith('video/')) {
      toast.error('Please choose a video file.');
      return;
    }
    setUploadingId(reelId);
    try {
      const path = `${user.id}/${reelId}/intro.${extFromFile(file)}`;
      const { error: upErr } = await supabase.storage
        .from(APPLICANT_REELS_STORAGE_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: true });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase
        .from('applicant_reels')
        .update({ video_path: path })
        .eq('id', reelId)
        .eq('user_id', user.id);
      if (dbErr) throw dbErr;

      toast.success('Video uploaded. Add a caption and publish when ready.');
      refreshReels();
    } catch (e) {
      toast.error(e?.message || 'Upload failed.');
    } finally {
      setUploadingId(null);
    }
  };

  const updateReel = async (reelId, patch) => {
    const { error } = await supabase.from('applicant_reels').update(patch).eq('id', reelId).eq('user_id', user.id);
    if (error) {
      toast.error(error.message || 'Update failed.');
      return;
    }
    refreshReels();
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (entLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="reels-page">
        <header className="reels-hero">
          <h1 className="reels-title">Intro reels</h1>
          <p className="reels-lead">
            A short vertical introduction helps employers see you beyond your CV. Optional add-on ({REELS_PRICE_LABEL},
            Freemius checkout) on top of your annual plan.
          </p>
        </header>

        {!reelsEnt && (
          <section className="reels-card">
            <h2 className="reels-card-title">Unlock intro reels</h2>
            <p className="reels-muted">
              One-time add-on: <strong>{REELS_PRICE_LABEL}</strong>. After payment, you can upload and publish intro
              videos for the hiring portal.
            </p>
            {!REELS_PLAN_ID && (
              <p className="reels-alert" role="alert">
                Set <code className="reels-code">VITE_FREEMIUS_REELS_PLAN_ID</code> to your Freemius plan ID for this
                add-on.
              </p>
            )}
            <button
              type="button"
              className="reels-primary-btn"
              onClick={handlePurchase}
              disabled={checkoutBusy || !freemiusReady}
            >
              {checkoutBusy ? 'Opening checkout…' : `Pay ${REELS_PRICE_LABEL} via Freemius`}
            </button>
          </section>
        )}

        {reelsEnt && (
          <>
            <section className="reels-card reels-card--compact">
              <div className="reels-row">
                <span className="reels-badge reels-badge--ok">Reels active</span>
                {reelsEnt.ends_at && (
                  <span className="reels-muted">
                    Access until {new Date(reelsEnt.ends_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                )}
              </div>
              <button type="button" className="reels-secondary-btn" onClick={createDraft}>
                New reel draft
              </button>
            </section>

            {reelsLoading && <LoadingSpinner />}

            {!reelsLoading && (!reels || reels.length === 0) && (
              <p className="reels-muted">No reels yet. Create a draft to upload your first intro video.</p>
            )}

            <ul className="reels-list">
              {(reels || []).map((reel) => (
                <ReelEditorCard
                  key={reel.id}
                  reel={reel}
                  uploading={uploadingId === reel.id}
                  onUpload={(file) => handleUpload(reel.id, file)}
                  onUpdate={(patch) => updateReel(reel.id, patch)}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </Layout>
  );
}

function ReelEditorCard({ reel, uploading, onUpload, onUpdate }) {
  const [caption, setCaption] = useState(reel.caption || '');
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => {
    setCaption(reel.caption || '');
  }, [reel.caption, reel.id]);

  useEffect(() => {
    let cancelled = false;
    if (!reel.video_path) {
      setVideoUrl(null);
      return undefined;
    }
    (async () => {
      const { data, error } = await supabase.storage
        .from(APPLICANT_REELS_STORAGE_BUCKET)
        .createSignedUrl(reel.video_path, 3600);
      if (!cancelled && !error && data?.signedUrl) {
        setVideoUrl(data.signedUrl);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reel.video_path, reel.updated_at]);

  const saveCaption = () => {
    onUpdate({ caption: caption.trim() || null });
  };

  return (
    <li className="reels-card reels-item">
      <div className="reels-item-head">
        <span className={`reels-badge reels-badge--${reel.status === 'PUBLISHED' ? 'ok' : 'muted'}`}>
          {reel.status}
        </span>
        <span className="reels-muted">{new Date(reel.created_at).toLocaleDateString()}</span>
      </div>

      {videoUrl && <video className="reels-video" controls playsInline src={videoUrl} />}

      <label className="reels-label">
        Video file
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) onUpload(f);
          }}
        />
      </label>
      {uploading && <p className="reels-muted">Uploading…</p>}

      <label className="reels-label">
        Caption
        <textarea
          className="reels-textarea"
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Role, experience, languages, availability…"
        />
      </label>
      <button type="button" className="reels-secondary-btn" onClick={saveCaption}>
        Save caption
      </button>

      <div className="reels-field-row">
        <label className="reels-label-inline">
          Visibility
          <select
            className="reels-select"
            value={reel.visibility}
            onChange={(e) => onUpdate({ visibility: e.target.value })}
          >
            <option value="PUBLIC">Public (employers browsing reels)</option>
            <option value="APPLY_ONLY">Only when I apply to a job</option>
          </select>
        </label>
      </div>

      <div className="reels-actions">
        {reel.status !== 'PUBLISHED' && reel.video_path && (
          <button type="button" className="reels-primary-btn" onClick={() => onUpdate({ status: 'PUBLISHED' })}>
            Publish
          </button>
        )}
        {reel.status === 'PUBLISHED' && (
          <button type="button" className="reels-secondary-btn" onClick={() => onUpdate({ status: 'HIDDEN' })}>
            Unpublish
          </button>
        )}
        {reel.status === 'DRAFT' && !reel.video_path && (
          <span className="reels-muted">Upload a video to enable publishing.</span>
        )}
      </div>
    </li>
  );
}
