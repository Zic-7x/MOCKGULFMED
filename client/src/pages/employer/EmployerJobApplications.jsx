import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  fetchApplicationsForJob,
  fetchJobPostingById,
  JOB_APPLICATION_STATUSES,
  updateApplicationStatus,
} from '../../utils/jobPortalQueries';
import { APPLICANT_REELS_STORAGE_BUCKET } from '../../utils/supabaseQueries';
import '../jobs/job-portal.css';

export default function EmployerJobApplications() {
  const { id: jobId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [videoUrls, setVideoUrls] = useState({});

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['employerJob', jobId],
    queryFn: () => fetchJobPostingById(jobId),
    enabled: !!user?.id && !!jobId,
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['jobApplications', jobId],
    queryFn: () => fetchApplicationsForJob(jobId),
    enabled: !!user?.id && !!jobId && job?.recruiter_user_id === user.id,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!applications?.length) return;
      const next = {};
      for (const app of applications) {
        if (!app.attached_reel_id) continue;
        const { data: reel } = await supabase
          .from('applicant_reels')
          .select('video_path')
          .eq('id', app.attached_reel_id)
          .maybeSingle();
        if (!reel?.video_path) continue;
        const { data: signed, error } = await supabase.storage
          .from(APPLICANT_REELS_STORAGE_BUCKET)
          .createSignedUrl(reel.video_path, 3600);
        if (!error && signed?.signedUrl) {
          next[app.id] = signed.signedUrl;
        }
      }
      if (!cancelled) setVideoUrls(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [applications]);

  const onStatusChange = async (applicationId, status) => {
    try {
      await updateApplicationStatus(applicationId, status);
      toast.success('Status updated.');
      queryClient.invalidateQueries({ queryKey: ['jobApplications', jobId] });
    } catch (e) {
      toast.error(e?.message || 'Update failed.');
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (jobLoading || appsLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!job || job.recruiter_user_id !== user.id) {
    return (
      <Layout>
        <div className="job-portal">
          <div className="job-alert job-alert--error">You do not have access to these applications.</div>
          <Link to="/employer/jobs">Back</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="job-portal">
        <Link to="/employer/jobs" className="job-portal-lead" style={{ display: 'inline-block', marginBottom: 8 }}>
          ← My listings
        </Link>
        <h1>Applicants — {job.title}</h1>
        <p className="job-portal-lead">
          <Link to={`/employer/jobs/${jobId}/edit`}>Edit listing</Link>
        </p>

        {!applications || applications.length === 0 ? (
          <p className="job-portal-lead">No applications yet.</p>
        ) : (
          <table className="job-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Email</th>
                <th>Status</th>
                <th>Note</th>
                <th>Reel</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>{app.applicant_name_at_apply}</td>
                  <td>
                    <a href={`mailto:${app.applicant_email_at_apply}`}>{app.applicant_email_at_apply}</a>
                  </td>
                  <td>
                    <select
                      className="job-status-select"
                      value={app.status}
                      onChange={(e) => onStatusChange(app.id, e.target.value)}
                    >
                      {JOB_APPLICATION_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ maxWidth: 220, whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                    {app.cover_note || '—'}
                  </td>
                  <td>
                    {videoUrls[app.id] ? (
                      <video src={videoUrls[app.id]} controls playsInline style={{ width: 160, borderRadius: 8 }} />
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
