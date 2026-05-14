import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchApplicantPublishedReels,
  fetchJobPostingById,
  submitJobApplication,
} from '../../utils/jobPortalQueries';
import { getAnnualJobPortalQueryOptions } from '../../utils/annualJobPortalQuery';
import './job-portal.css';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [coverNote, setCoverNote] = useState('');
  const [reelId, setReelId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: annualOk } = useQuery(getAnnualJobPortalQueryOptions(user?.id));

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['jobPosting', id],
    queryFn: () => fetchJobPostingById(id),
    enabled: !!user?.id && !!id,
  });

  const { data: reels } = useQuery({
    queryKey: ['applicantPublishedReels', user?.id],
    queryFn: () => fetchApplicantPublishedReels(user.id),
    enabled: !!user?.id && !!job && job.status === 'PUBLISHED',
  });

  const alreadyMine = job?.recruiter_user_id === user?.id;

  const etLabel = useMemo(() => {
    const m = {
      FULL_TIME: 'Full time',
      PART_TIME: 'Part time',
      CONTRACT: 'Contract',
      INTERNSHIP: 'Internship',
      REMOTE: 'Remote',
      OTHER: 'Other',
    };
    return (v) => m[v] || v;
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!annualOk) {
      toast.error('An active annual plan is required to apply.');
      return;
    }
    if (alreadyMine) return;
    setSubmitting(true);
    try {
      await submitJobApplication({
        jobId: id,
        applicantUserId: user.id,
        coverNote,
        attachedReelId: reelId || null,
      });
      toast.success('Application submitted.');
      queryClient.invalidateQueries({ queryKey: ['myApplications', user.id] });
      setCoverNote('');
      setReelId('');
    } catch (err) {
      toast.error(err?.message || 'Could not submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error || !job) {
    return (
      <Layout>
        <div className="job-portal">
          <div className="job-alert job-alert--error" role="alert">
            {error?.message || 'This job is not available.'}
          </div>
          <Link to="/jobs" className="job-btn job-btn--secondary">
            Back to jobs
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="job-portal">
        <Link to="/jobs" className="job-portal-lead" style={{ display: 'inline-block', marginBottom: 16 }}>
          ← All jobs
        </Link>
        <h1>{job.title}</h1>
        <div className="job-card-meta" style={{ marginBottom: 16 }}>
          {job.location && <span>{job.location}</span>}
          <span className="job-pill">{etLabel(job.employment_type)}</span>
          {job.profession?.name && <span className="job-pill">{job.profession.name}</span>}
          {job.salary_band && <span>{job.salary_band}</span>}
        </div>

        {job.status !== 'PUBLISHED' && (
          <div className="job-alert" role="status">
            This listing is not published. Only the recruiter can see full details while drafting or closed.
          </div>
        )}

        {job.description && (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, color: '#334155', marginBottom: 24 }}>
            {job.description}
          </div>
        )}

        {job.status === 'PUBLISHED' && (
          <>
            {alreadyMine && (
              <div className="job-alert" role="status">
                You posted this role. Manage it from{' '}
                <Link to="/employer/jobs">Employer → My jobs</Link>.
              </div>
            )}

            {!alreadyMine && (
              <>
                {!annualOk && (
                  <div className="job-alert" role="alert">
                    Applying is limited to accounts with an active <strong>annual</strong> study package. Upgrade
                    under Packages, then return here.
                  </div>
                )}

                <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Apply</h2>
                <form className="job-form" onSubmit={handleApply}>
                  <label>
                    Cover note (optional)
                    <textarea
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      maxLength={4000}
                      placeholder="Briefly explain your fit and availability."
                    />
                  </label>
                  <label>
                    Attach intro reel (optional)
                    <select value={reelId} onChange={(e) => setReelId(e.target.value)}>
                      <option value="">No reel</option>
                      {(reels || []).map((r) => (
                        <option key={r.id} value={r.id}>
                          {(r.caption || 'Intro reel').slice(0, 60)}
                          {r.visibility === 'APPLY_ONLY' ? ' (shared with this application)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  {(!reels || reels.length === 0) && (
                    <p className="job-portal-lead">
                      Publish an intro reel under <Link to="/reels">Reels</Link> to attach one here.
                    </p>
                  )}
                  <div className="job-btn-row">
                    <button type="submit" className="job-btn job-btn--primary" disabled={submitting || !annualOk}>
                      {submitting ? 'Submitting…' : 'Submit application'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
