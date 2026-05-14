import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  fetchJobPostingById,
  insertJobPosting,
  JOB_EMPLOYMENT_TYPES,
  updateJobPosting,
} from '../../utils/jobPortalQueries';
import '../jobs/job-portal.css';

export default function EmployerJobForm() {
  const { id } = useParams();
  const routeLocation = useLocation();
  const isNew = routeLocation.pathname === '/employer/jobs/new';
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [professionId, setProfessionId] = useState('');
  const [salaryBand, setSalaryBand] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [saving, setSaving] = useState(false);

  const { data: professions } = useQuery({
    queryKey: ['professions-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase.from('professions').select('id, name').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ['employerJob', id],
    queryFn: () => fetchJobPostingById(id),
    enabled: !!user?.id && !isNew && !!id,
  });

  useEffect(() => {
    if (!existing) return;
    if (existing.recruiter_user_id !== user?.id) return;
    setTitle(existing.title || '');
    setDescription(existing.description || '');
    setJobLocation(existing.location || '');
    setEmploymentType(existing.employment_type || 'FULL_TIME');
    setProfessionId(existing.profession_id || '');
    setSalaryBand(existing.salary_band || '');
    setStatus(existing.status || 'DRAFT');
  }, [existing, user?.id]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isNew && isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!isNew && existing && existing.recruiter_user_id !== user.id) {
    return (
      <Layout>
        <div className="job-portal">
          <div className="job-alert job-alert--error">You can only edit your own listings.</div>
          <Link to="/employer/jobs">Back</Link>
        </div>
      </Layout>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        location: jobLocation.trim() || null,
        employment_type: employmentType,
        profession_id: professionId || null,
        salary_band: salaryBand.trim() || null,
        status,
      };
      if (isNew) {
        const row = await insertJobPosting({
          ...payload,
          recruiter_user_id: user.id,
        });
        toast.success('Listing created.');
        navigate(`/employer/jobs/${row.id}/edit`, { replace: true });
      } else {
        await updateJobPosting(id, payload);
        toast.success('Saved.');
      }
    } catch (err) {
      toast.error(err?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="job-portal">
        <Link to="/employer/jobs" className="job-portal-lead" style={{ display: 'inline-block', marginBottom: 16 }}>
          ← My listings
        </Link>
        <h1>{isNew ? 'New job listing' : 'Edit listing'}</h1>

        <form className="job-form" onSubmit={handleSave}>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={255} />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label>
            Location
            <input value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} maxLength={255} />
          </label>
          <label>
            Employment type
            <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
              {JOB_EMPLOYMENT_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Profession (optional filter)
            <select value={professionId} onChange={(e) => setProfessionId(e.target.value)}>
              <option value="">Any / all</option>
              {(professions || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Salary band (optional)
            <input value={salaryBand} onChange={(e) => setSalaryBand(e.target.value)} maxLength={128} />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="DRAFT">Draft (not visible to applicants)</option>
              <option value="PUBLISHED">Published</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <div className="job-btn-row">
            <button type="submit" className="job-btn job-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            {!isNew && (
              <Link to={`/employer/jobs/${id}/applications`} className="job-btn job-btn--secondary">
                View applicants
              </Link>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}
