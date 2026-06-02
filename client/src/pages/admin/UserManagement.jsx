import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserProfiles,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getProfessions,
  getHealthAuthorities,
  fetchUserExternalExamDetails,
  adminUpsertUserExternalExamDetails,
  adminUploadExternalExamPass,
  adminDeleteExternalExamPassFile,
} from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  EXTERNAL_EXAM_STATUS_OPTIONS,
  externalExamHasPublishableContent,
  normalizeExternalExamStatusCode,
} from '../../constants/externalExamStatus';
import './UserManagement.css';

const emptyOfficialExamForm = () => ({
  sectionEnabled: true,
  applicantName: '',
  applicantAddress: '',
  applicantNationalId: '',
  bookingHealthAuthorityCountry: '',
  bookingHealthAuthorityId: '',
  examHealthAuthority: '',
  examinationAuthority: '',
  examDate: '',
  examTime: '',
  examStatus: '',
  registrationId: '',
  candidateEligibilityId: '',
  bookingPaymentStatus: '',
  bookingPaymentExternalRef: '',
  bookingPaidAt: '',
  bookingPaymentVerified: false,
  bookingPaymentVerifiedAt: '',
  announcement: '',
  examPassStoragePath: null,
  examDetailsPrintEnabled: true,
});

const mapExternalExamRowToForm = (row) => {
  if (!row) return emptyOfficialExamForm();
  return {
    sectionEnabled: !!row.section_enabled,
    applicantName: row.applicant_name || '',
    applicantAddress: row.applicant_address || '',
    applicantNationalId: row.applicant_national_id || '',
    bookingHealthAuthorityCountry: row.booking_health_authority_country || '',
    bookingHealthAuthorityId: row.booking_health_authority_id || '',
    examHealthAuthority: row.exam_health_authority || '',
    examinationAuthority: row.examination_authority || '',
    examDate: row.exam_date || '',
    examTime: row.exam_time || '',
    examStatus: normalizeExternalExamStatusCode(row.exam_status) || '',
    registrationId: row.registration_id || '',
    candidateEligibilityId: row.candidate_eligibility_id || '',
    bookingPaymentStatus: row.booking_payment_status || '',
    bookingPaymentExternalRef: row.booking_payment_external_ref || '',
    bookingPaidAt: row.booking_paid_at || '',
    bookingPaymentVerified: !!row.booking_payment_verified,
    bookingPaymentVerifiedAt: row.booking_payment_verified_at || '',
    announcement: row.announcement || '',
    examPassStoragePath: row.exam_pass_storage_path || null,
    examDetailsPrintEnabled: (() => {
      if (row.exam_pass_print_enabled != null) return !!row.exam_pass_print_enabled;
      if (row.exam_details_print_enabled != null) return !!row.exam_details_print_enabled;
      return true;
    })(),
  };
};

const UserManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    professionId: '',
    healthAuthorityId: '',
    dailyMcqLimit: '',
    isActive: true,
    /** When true, access_mode is MANUAL — exams allowed without a paid package (admin grant). */
    complimentaryAccess: false,
  });

  const [showExamModal, setShowExamModal] = useState(false);
  const [examUser, setExamUser] = useState(null);
  const [examForm, setExamForm] = useState(emptyOfficialExamForm);
  const [examFile, setExamFile] = useState(null);
  const [clearExamPass, setClearExamPass] = useState(false);
  const [examModalLoading, setExamModalLoading] = useState(false);

  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUserProfiles,
  });

  const { data: professions } = useQuery({
    queryKey: ['professions'],
    queryFn: getProfessions,
  });
  const { data: healthAuthorities } = useQuery({
    queryKey: ['healthAuthorities'],
    queryFn: getHealthAuthorities,
  });

  const createUserMutation = useMutation({
    mutationFn: (data) => createUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      resetForm();
      toast.success('User created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => updateUserProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => deleteUserProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });

  const saveOfficialExamMutation = useMutation({
    mutationFn: async () => {
      let nextPath = examForm.examPassStoragePath;
      if (clearExamPass) {
        if (nextPath) {
          try {
            await adminDeleteExternalExamPassFile(nextPath);
          } catch {
            /* file may already be removed */
          }
        }
        nextPath = null;
      } else if (examFile) {
        nextPath = await adminUploadExternalExamPass(examUser.id, examFile, nextPath || null);
      }
      return adminUpsertUserExternalExamDetails(examUser.id, {
        sectionEnabled: examForm.sectionEnabled,
        applicantName: examForm.applicantName,
        applicantAddress: examForm.applicantAddress,
        applicantNationalId: examForm.applicantNationalId,
        bookingHealthAuthorityCountry: examForm.bookingHealthAuthorityCountry,
        bookingHealthAuthorityId: examForm.bookingHealthAuthorityId || null,
        examHealthAuthority: examForm.examHealthAuthority,
        examinationAuthority: examForm.examinationAuthority,
        examDate: examForm.examDate || null,
        examTime: examForm.examTime,
        examStatus: examForm.examStatus,
        registrationId: examForm.registrationId,
        candidateEligibilityId: examForm.candidateEligibilityId,
        bookingPaymentStatus: examForm.bookingPaymentStatus,
        bookingPaymentExternalRef: examForm.bookingPaymentExternalRef,
        bookingPaidAt: examForm.bookingPaidAt || null,
        bookingPaymentVerified: examForm.bookingPaymentVerified,
        bookingPaymentVerifiedAt: examForm.bookingPaymentVerifiedAt || null,
        announcement: examForm.announcement,
        examPassStoragePath: nextPath,
        examDetailsPrintEnabled: examForm.examDetailsPrintEnabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userExternalExamDetails', examUser.id] });
      queryClient.invalidateQueries({ queryKey: ['userDashboard', examUser.id] });
      toast.success('Official exam (Prometric/Pearson) details saved');
      setShowExamModal(false);
      setExamUser(null);
      setExamForm(emptyOfficialExamForm());
      setExamFile(null);
      setClearExamPass(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save official exam details');
    },
  });

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      professionId: '',
      healthAuthorityId: '',
      dailyMcqLimit: '',
      isActive: true,
      complimentaryAccess: false,
    });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      fullName: user.full_name,
      professionId: user.profession?.id || '',
      healthAuthorityId: user.health_authority?.id || '',
      dailyMcqLimit: user.daily_mcq_limit ?? '',
      isActive: user.is_active,
      complimentaryAccess: user.access_mode === 'MANUAL',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      dailyMcqLimit: formData.dailyMcqLimit !== '' && formData.dailyMcqLimit != null
        ? parseInt(formData.dailyMcqLimit, 10)
        : null,
      accessMode: formData.complimentaryAccess ? 'MANUAL' : 'AUTO',
    };
    delete data.complimentaryAccess;

    if (editingUser) {
      if (!data.password) {
        delete data.password;
      }
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const openOfficialExamModal = async (userRow) => {
    setExamUser(userRow);
    setShowExamModal(true);
    setExamModalLoading(true);
    setExamFile(null);
    setClearExamPass(false);
    setExamForm(emptyOfficialExamForm());
    try {
      const row = await fetchUserExternalExamDetails(userRow.id);
      setExamForm(mapExternalExamRowToForm(row));
    } catch (err) {
      toast.error(err.message || 'Failed to load exam details');
      setExamForm(emptyOfficialExamForm());
    } finally {
      setExamModalLoading(false);
    }
  };

  const closeOfficialExamModal = () => {
    setShowExamModal(false);
    setExamUser(null);
    setExamForm(emptyOfficialExamForm());
    setExamFile(null);
    setClearExamPass(false);
  };

  const handleOfficialExamSubmit = (e) => {
    e.preventDefault();
    if (!examUser?.id) return;
    saveOfficialExamMutation.mutate();
  };

  const authoritiesForExamCountry = (healthAuthorities || []).filter(
    (ha) => String(ha?.country || '').trim() === String(examForm.bookingHealthAuthorityCountry || '').trim()
  );
  const countryOptions = Array.from(
    new Set((healthAuthorities || []).map((ha) => String(ha?.country || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="user-management">
        <div className="page-header">
          <h1>User Management</h1>
          <button onClick={() => { setEditingUser(null); resetForm(); setShowModal(true); }} className="btn-primary">
            Add User
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Profession</th>
                <th>Health Authority</th>
                <th>Daily MCQ Limit</th>
                <th>Payment</th>
                <th>Exam access</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.profession?.name || '-'}</td>
                  <td>{user.health_authority?.name || '-'}</td>
                  <td>{user.daily_mcq_limit ?? '—'}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        user.payment_status === 'PAID'
                          ? 'active'
                          : user.payment_status === 'PENDING_PAYMENT'
                            ? 'inactive'
                            : ''
                      }`}
                    >
                      {user.payment_status || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${user.access_mode === 'MANUAL' ? 'active' : ''}`}
                      title={
                        user.access_mode === 'MANUAL'
                          ? 'Admin granted: exams without package payment'
                          : 'Requires active paid package (Freemius) for exams'
                      }
                    >
                      {user.access_mode === 'MANUAL' ? 'Complimentary' : 'Standard'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={() => handleEdit(user)} className="btn-edit">Edit</button>
                    <button
                      type="button"
                      onClick={() => openOfficialExamModal(user)}
                      className="btn-booking"
                    >
                      Official exam
                    </button>
                    <button type="button" onClick={() => handleDelete(user.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showExamModal && examUser && (
          <div className="modal-overlay" onClick={closeOfficialExamModal}>
            <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
              <h2>Official exam booking (Prometric / Pearson)</h2>
              <p className="exam-modal-intro">
                For <strong>{examUser.full_name}</strong> ({examUser.email}). This is separate from mock exams on the
                platform.
              </p>
              {examModalLoading ? (
                <LoadingSpinner />
              ) : (
                <form onSubmit={handleOfficialExamSubmit}>
                  <div className="form-group">
                    <label className="checkbox-label-block">
                      <input
                        type="checkbox"
                        checked={examForm.sectionEnabled}
                        onChange={(e) => setExamForm({ ...examForm, sectionEnabled: e.target.checked })}
                      />
                      <span>Show official exam section on user&apos;s profile</span>
                    </label>
                    <p className="form-hint">
                      When enabled, the applicant sees booking details on <strong>Profile</strong>. Turn this off only if
                      you intentionally want to hide published details (for example while correcting an error).
                    </p>
                    {!examForm.sectionEnabled && externalExamHasPublishableContent(examForm) && (
                      <p className="exam-modal-warning" role="alert">
                        You have entered booking details, but the profile section is <strong>off</strong> — the
                        applicant will still see the empty &quot;not active&quot; message until you enable this.
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Applicant name</label>
                    <input
                      type="text"
                      value={examForm.applicantName}
                      onChange={(e) => setExamForm({ ...examForm, applicantName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Applicant address</label>
                    <textarea
                      rows={3}
                      value={examForm.applicantAddress}
                      onChange={(e) => setExamForm({ ...examForm, applicantAddress: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>CNIC / National ID</label>
                    <input
                      type="text"
                      value={examForm.applicantNationalId}
                      onChange={(e) => setExamForm({ ...examForm, applicantNationalId: e.target.value })}
                    />
                  </div>
                  <div className="form-row-two">
                    <div className="form-group">
                      <label>Booking country</label>
                      <select
                        value={examForm.bookingHealthAuthorityCountry}
                        onChange={(e) => {
                          const c = e.target.value;
                          const list = (healthAuthorities || []).filter(
                            (ha) => String(ha?.country || '').trim() === String(c || '').trim()
                          );
                          setExamForm({
                            ...examForm,
                            bookingHealthAuthorityCountry: c,
                            bookingHealthAuthorityId: list?.[0]?.id ? String(list[0].id) : '',
                            examHealthAuthority: list?.[0]?.name || examForm.examHealthAuthority,
                          });
                        }}
                      >
                        <option value="">Select country</option>
                        {countryOptions.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Booking health authority</label>
                      <select
                        value={examForm.bookingHealthAuthorityId}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          const selected = authoritiesForExamCountry.find((ha) => String(ha.id) === String(nextId));
                          setExamForm({
                            ...examForm,
                            bookingHealthAuthorityId: nextId,
                            examHealthAuthority: selected?.name || examForm.examHealthAuthority,
                          });
                        }}
                      >
                        <option value="">Select authority</option>
                        {authoritiesForExamCountry.map((ha) => (
                          <option key={ha.id} value={ha.id}>
                            {ha.name}
                          </option>
                        ))}
                      </select>
                      <p className="form-hint">
                        Mirrors what applicant selected during self-booking. Selecting here can auto-fill exam health
                        authority.
                      </p>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Health authority (exam)</label>
                    <input
                      type="text"
                      value={examForm.examHealthAuthority}
                      onChange={(e) => setExamForm({ ...examForm, examHealthAuthority: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Examination authority (e.g. Prometric, Pearson VUE)</label>
                    <input
                      type="text"
                      value={examForm.examinationAuthority}
                      onChange={(e) => setExamForm({ ...examForm, examinationAuthority: e.target.value })}
                    />
                  </div>
                  <div className="form-row-two">
                    <div className="form-group">
                      <label>Exam date</label>
                      <input
                        type="date"
                        value={examForm.examDate}
                        onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Exam time</label>
                      <input
                        type="text"
                        placeholder="e.g. 9:00 AM (local test center time)"
                        value={examForm.examTime}
                        onChange={(e) => setExamForm({ ...examForm, examTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Exam status</label>
                    <select
                      value={examForm.examStatus}
                      onChange={(e) => setExamForm({ ...examForm, examStatus: e.target.value })}
                    >
                      {EXTERNAL_EXAM_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value || 'none'} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="form-hint">Shown to the applicant as a color-coded label on their profile.</p>
                  </div>
                  <div className="form-group">
                    <label>Exam confirmation / registration ID</label>
                    <input
                      type="text"
                      value={examForm.registrationId}
                      onChange={(e) => setExamForm({ ...examForm, registrationId: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Exam candidate / eligibility ID</label>
                    <input
                      type="text"
                      value={examForm.candidateEligibilityId}
                      onChange={(e) => setExamForm({ ...examForm, candidateEligibilityId: e.target.value })}
                    />
                  </div>
                  <div className="form-row-two">
                    <div className="form-group">
                      <label>Booking payment status</label>
                      <input
                        type="text"
                        placeholder="e.g. PAID, PENDING, FAILED"
                        value={examForm.bookingPaymentStatus}
                        onChange={(e) => setExamForm({ ...examForm, bookingPaymentStatus: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Payment external reference</label>
                      <input
                        type="text"
                        value={examForm.bookingPaymentExternalRef}
                        onChange={(e) => setExamForm({ ...examForm, bookingPaymentExternalRef: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-row-two">
                    <div className="form-group">
                      <label>Booking paid at</label>
                      <input
                        type="datetime-local"
                        value={examForm.bookingPaidAt ? String(examForm.bookingPaidAt).slice(0, 16) : ''}
                        onChange={(e) => setExamForm({ ...examForm, bookingPaidAt: e.target.value || '' })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Payment verified at</label>
                      <input
                        type="datetime-local"
                        value={examForm.bookingPaymentVerifiedAt ? String(examForm.bookingPaymentVerifiedAt).slice(0, 16) : ''}
                        onChange={(e) =>
                          setExamForm({ ...examForm, bookingPaymentVerifiedAt: e.target.value || '' })
                        }
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label-block">
                      <input
                        type="checkbox"
                        checked={examForm.bookingPaymentVerified}
                        onChange={(e) => setExamForm({ ...examForm, bookingPaymentVerified: e.target.checked })}
                      />
                      <span>Payment verified (admin override)</span>
                    </label>
                    <p className="form-hint">
                      Usually this is set by Freemius signed webhook. Admin can override if gateway callback was missed.
                    </p>
                  </div>
                  <div className="form-group">
                    <label>Announcement for this user (exam date changes, extra fees, etc.)</label>
                    <textarea
                      rows={4}
                      value={examForm.announcement}
                      onChange={(e) => setExamForm({ ...examForm, announcement: e.target.value })}
                      placeholder="Shown prominently in the user’s official exam section on their profile."
                    />
                  </div>
                  <div className="form-group">
                    <label>Exam pass file (PDF or image, max 12 MB)</label>
                    <input
                      type="file"
                      accept=".pdf,image/*,application/pdf"
                      disabled={clearExamPass}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setExamFile(f || null);
                        if (f) setClearExamPass(false);
                      }}
                    />
                    {examForm.examPassStoragePath && !examFile && (
                      <p className="form-hint">A file is already stored. Upload a new file to replace it.</p>
                    )}
                    {examForm.examPassStoragePath && (
                      <label className="checkbox-label-block" style={{ marginTop: '10px' }}>
                        <input
                          type="checkbox"
                          checked={clearExamPass}
                          onChange={(e) => {
                            const c = e.target.checked;
                            setClearExamPass(c);
                            if (c) setExamFile(null);
                          }}
                        />
                        <span>Remove stored exam pass</span>
                      </label>
                    )}
                    <label className="checkbox-label-block" style={{ marginTop: '14px' }}>
                      <input
                        type="checkbox"
                        checked={examForm.examDetailsPrintEnabled}
                        onChange={(e) =>
                          setExamForm({ ...examForm, examDetailsPrintEnabled: e.target.checked })
                        }
                      />
                      <span>Allow applicant to print exam details</span>
                    </label>
                    <p className="form-hint">
                      When unchecked, the Print exam details button is disabled on the user&apos;s profile for this
                      booking section.
                    </p>
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={closeOfficialExamModal} className="btn-secondary">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={saveOfficialExamMutation.isPending}
                    >
                      {saveOfficialExamMutation.isPending ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingUser(null); resetForm(); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editingUser ? 'Edit User' : 'Add User'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password {editingUser && '(leave blank to keep current)'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                  />
                </div>
                <div className="form-group">
                  <label>Profession</label>
                  <select
                    value={formData.professionId}
                    onChange={(e) => setFormData({ ...formData, professionId: e.target.value })}
                  >
                    <option value="">Select Profession</option>
                    {professions?.map((prof) => (
                      <option key={prof.id} value={prof.id}>{prof.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Health Authority</label>
                  <select
                    value={formData.healthAuthorityId}
                    onChange={(e) => setFormData({ ...formData, healthAuthorityId: e.target.value })}
                  >
                    <option value="">Select Health Authority</option>
                    {healthAuthorities?.map((ha) => (
                      <option key={ha.id} value={ha.id}>{ha.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Daily MCQ limit (blank uses 100/day default)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.dailyMcqLimit}
                    onChange={(e) => setFormData({ ...formData, dailyMcqLimit: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label-block">
                    <input
                      type="checkbox"
                      checked={formData.complimentaryAccess}
                      onChange={(e) => setFormData({ ...formData, complimentaryAccess: e.target.checked })}
                    />
                    <span>Allow exam access without payment</span>
                  </label>
                  <p className="form-hint">
                    Enable for legacy accounts or staff: users can take exams without a Freemius package. Leave daily
                    limit blank to use the default (100/day for manual access); set a number to cap them explicitly.
                  </p>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => { setShowModal(false); setEditingUser(null); resetForm(); }} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserManagement;
