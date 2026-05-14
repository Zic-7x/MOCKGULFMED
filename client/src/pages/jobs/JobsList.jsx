import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { fetchPublishedJobs } from '../../utils/jobPortalQueries';
import './job-portal.css';

export default function JobsList() {
  const { user } = useAuth();
  const [professionId, setProfessionId] = useState('');

  const { data: professions } = useQuery({
    queryKey: ['professions-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase.from('professions').select('id, name').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const filterId = professionId || undefined;
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['publishedJobs', filterId],
    queryFn: () => fetchPublishedJobs({ professionId: filterId }),
  });

  const etLabel = useMemo(() => {
    const m = Object.fromEntries(
      [
        ['FULL_TIME', 'Full time'],
        ['PART_TIME', 'Part time'],
        ['CONTRACT', 'Contract'],
        ['INTERNSHIP', 'Internship'],
        ['REMOTE', 'Remote'],
        ['OTHER', 'Other'],
      ]
    );
    return (v) => m[v] || v;
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div className="job-portal">
        <h1>Open roles</h1>
        <p className="job-portal-lead">
          Open roles for annual subscribers. Use the filters below, then open a listing to apply (your plan must stay
          active).
        </p>

        <div className="job-toolbar">
          <label>
            Profession
            <select value={professionId} onChange={(e) => setProfessionId(e.target.value)}>
              <option value="">All professions</option>
              {(professions || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <Link to="/applications" className="job-btn job-btn--secondary" style={{ alignSelf: 'center' }}>
            My applications
          </Link>
          <Link to="/employer/jobs" className="job-btn job-btn--secondary" style={{ alignSelf: 'center' }}>
            Post a job
          </Link>
        </div>

        {error && (
          <div className="job-alert job-alert--error" role="alert">
            {error.message || 'Could not load jobs.'}
          </div>
        )}

        {isLoading && <LoadingSpinner />}

        {!isLoading && (!jobs || jobs.length === 0) && (
          <p className="job-portal-lead">No published listings yet. Check back soon.</p>
        )}

        {!isLoading &&
          (jobs || []).map((job) => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="job-card">
              <h2 className="job-card-title">{job.title}</h2>
              <div className="job-card-meta">
                {job.location && <span>{job.location}</span>}
                <span className="job-pill">{etLabel(job.employment_type)}</span>
                {job.profession?.name && <span className="job-pill">{job.profession.name}</span>}
                {job.salary_band && <span>{job.salary_band}</span>}
              </div>
            </Link>
          ))}
      </div>
    </Layout>
  );
}
