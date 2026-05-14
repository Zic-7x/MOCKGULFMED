import { supabase } from '../lib/supabase';

export const JOB_EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full time' },
  { value: 'PART_TIME', label: 'Part time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'OTHER', label: 'Other' },
];

export const JOB_APPLICATION_STATUSES = [
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'INTERVIEW', label: 'Interview' },
  { value: 'OFFERED', label: 'Offered' },
  { value: 'HIRED', label: 'Hired' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

export async function fetchPublishedJobs({ professionId } = {}) {
  let q = supabase
    .from('job_postings')
    .select(
      `
      id,
      title,
      description,
      location,
      employment_type,
      salary_band,
      status,
      created_at,
      profession:professions(id, name)
    `
    )
    .eq('status', 'PUBLISHED')
    .order('created_at', { ascending: false });

  if (professionId) {
    q = q.or(`profession_id.eq.${professionId},profession_id.is.null`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function fetchJobPostingById(id) {
  const { data, error } = await supabase
    .from('job_postings')
    .select(
      `
      id,
      title,
      description,
      location,
      employment_type,
      salary_band,
      status,
      recruiter_user_id,
      profession_id,
      created_at,
      updated_at,
      profession:professions(id, name)
    `
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMyJobPostings(userId) {
  const { data, error } = await supabase
    .from('job_postings')
    .select(
      `
      id,
      title,
      location,
      employment_type,
      status,
      created_at,
      profession:professions(id, name)
    `
    )
    .eq('recruiter_user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function insertJobPosting(payload) {
  const { data, error } = await supabase.from('job_postings').insert(payload).select('id').single();
  if (error) throw error;
  return data;
}

export async function updateJobPosting(id, patch) {
  const { error } = await supabase.from('job_postings').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteJobPosting(id) {
  const { error } = await supabase.from('job_postings').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchMyApplications(userId) {
  const { data, error } = await supabase
    .from('job_applications')
    .select(
      `
      id,
      job_id,
      status,
      cover_note,
      attached_reel_id,
      created_at,
      job:job_postings(id, title, location, status)
    `
    )
    .eq('applicant_user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchApplicationsForJob(jobId) {
  const { data, error } = await supabase
    .from('job_applications')
    .select(
      `
      id,
      applicant_user_id,
      applicant_name_at_apply,
      applicant_email_at_apply,
      status,
      cover_note,
      attached_reel_id,
      created_at,
      job:job_postings(id, title, recruiter_user_id)
    `
    )
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function submitJobApplication({ jobId, applicantUserId, coverNote, attachedReelId }) {
  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      job_id: jobId,
      applicant_user_id: applicantUserId,
      cover_note: coverNote || null,
      attached_reel_id: attachedReelId || null,
      status: 'SUBMITTED',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function updateApplicationStatus(applicationId, status) {
  const { error } = await supabase.from('job_applications').update({ status }).eq('id', applicationId);
  if (error) throw error;
}

export async function withdrawApplication(applicationId) {
  const { error } = await supabase.from('job_applications').update({ status: 'WITHDRAWN' }).eq('id', applicationId);
  if (error) throw error;
}

/** Published intro reels the applicant can attach (PUBLIC or APPLY_ONLY). */
export async function fetchApplicantPublishedReels(userId) {
  const { data, error } = await supabase
    .from('applicant_reels')
    .select('id, caption, visibility, status, video_path')
    .eq('user_id', userId)
    .eq('status', 'PUBLISHED')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
