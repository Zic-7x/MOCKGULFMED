import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getExamAccess,
  createExamAccess,
  deleteExamAccess,
  getExams,
  getProfessions,
  getHealthAuthorities,
  getUserProfiles,
  getAdminExamEntitlements,
  grantUserExamEntitlement,
  revokeUserExamEntitlement,
} from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './AccessManagement.css';

const AccessManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    examId: '',
    professionId: '',
    healthAuthorityId: '',
    userId: '',
  });

  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantForm, setGrantForm] = useState({ userId: '', examId: '' });

  const queryClient = useQueryClient();

  const { data: accesses, isLoading } = useQuery({
    queryKey: ['examAccess'],
    queryFn: getExamAccess,
  });
  const { data: exams } = useQuery({
    queryKey: ['exams'],
    queryFn: getExams,
  });
  const { data: professions } = useQuery({
    queryKey: ['professions'],
    queryFn: getProfessions,
  });
  const { data: healthAuthorities } = useQuery({
    queryKey: ['healthAuthorities'],
    queryFn: getHealthAuthorities,
  });
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: getUserProfiles,
  });

  const { data: adminExamGrants, isLoading: grantsLoading } = useQuery({
    queryKey: ['adminExamEntitlements'],
    queryFn: getAdminExamEntitlements,
  });

  const createAccessMutation = useMutation({
    mutationFn: (data) => createExamAccess(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['examAccess']);
      setShowModal(false);
      resetForm();
      toast.success('Access granted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to grant access');
    },
  });

  const deleteAccessMutation = useMutation({
    mutationFn: (id) => deleteExamAccess(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['examAccess']);
      toast.success('Access revoked successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to revoke access');
    },
  });

  const grantExamMutation = useMutation({
    mutationFn: ({ userId, examId }) => grantUserExamEntitlement(userId, examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminExamEntitlements'] });
      setGrantModalOpen(false);
      setGrantForm({ userId: '', examId: '' });
      toast.success('Exam access granted (no payment required for this user)');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to grant exam access');
    },
  });

  const revokeExamGrantMutation = useMutation({
    mutationFn: ({ userId, examId }) => revokeUserExamEntitlement(userId, examId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminExamEntitlements'] });
      toast.success('Admin exam grant revoked');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to revoke grant');
    },
  });

  const resetForm = () => {
    setFormData({
      examId: '',
      professionId: '',
      healthAuthorityId: '',
      userId: '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      examId: formData.examId,
      professionId: formData.professionId || null,
      healthAuthorityId: formData.healthAuthorityId || null,
      userId: formData.userId || null,
    };

    if (!data.examId) {
      toast.error('Please select an exam');
      return;
    }

    if (!data.professionId && !data.healthAuthorityId && !data.userId) {
      toast.error('Please select at least one access criteria (Profession, Health Authority, or User)');
      return;
    }

    createAccessMutation.mutate(data);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to revoke this access?')) {
      deleteAccessMutation.mutate(id);
    }
  };

  const handleGrantExamSubmit = (e) => {
    e.preventDefault();
    if (!grantForm.userId || !grantForm.examId) {
      toast.error('Select both a user and an exam');
      return;
    }
    grantExamMutation.mutate({ userId: grantForm.userId, examId: grantForm.examId });
  };

  const handleRevokeExamGrant = (userId, examId) => {
    if (
      window.confirm(
        'Revoke this admin grant? The user may lose access if they are not covered by their package or access rules.'
      )
    ) {
      revokeExamGrantMutation.mutate({ userId, examId });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="access-management">
        <div className="page-header">
          <h1>Access Management</h1>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary">
            Grant Access
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Exam</th>
                <th>Profession</th>
                <th>Health Authority</th>
                <th>User</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accesses?.map((access) => (
                <tr key={access.id}>
                  <td>{access.exam?.title}</td>
                  <td>{access.profession?.name || '-'}</td>
                  <td>{access.health_authority?.name || '-'}</td>
                  <td>{access.user?.full_name || '-'}</td>
                  <td>
                    <button onClick={() => handleDelete(access.id)} className="btn-delete">Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="access-section-divider">
          <div className="page-header access-subheader">
            <div>
              <h2>Direct exam entitlement (no payment)</h2>
              <p className="form-help" style={{ marginTop: '8px', fontStyle: 'normal' }}>
                Grant a specific user access to one exam without Freemius addon or package inclusion. This appears in
                their exam list, bypasses the &quot;not in your package&quot; rule for paid (AUTO) users, and satisfies
                addon-enabled exams without a separate purchase. Purchased addons are not removed when you revoke an
                admin grant here—only rows with source ADMIN are deleted.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setGrantForm({ userId: '', examId: '' });
                setGrantModalOpen(true);
              }}
              className="btn-primary"
            >
              Grant exam (no payment)
            </button>
          </div>

          <div className="table-container">
            {grantsLoading ? (
              <p className="form-help">Loading admin grants…</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Exam</th>
                    <th>Addon exam</th>
                    <th>Granted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminExamGrants?.length ? (
                    adminExamGrants.map((row) => (
                      <tr key={row.id}>
                        <td>
                          {row.user?.full_name || '—'} <span className="form-help">({row.user?.email || row.user_id})</span>
                        </td>
                        <td>{row.exam?.title || '—'}</td>
                        <td>{row.exam?.addon_enabled ? 'Yes' : 'No'}</td>
                        <td>{row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-delete"
                            onClick={() => handleRevokeExamGrant(row.user_id, row.exam_id)}
                          >
                            Revoke admin grant
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>
                        <p className="form-help">No admin exam grants yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Grant Exam Access</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Exam *</label>
                  <select
                    value={formData.examId}
                    onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
                    required
                  >
                    <option value="">Select Exam</option>
                    {exams?.map((exam) => (
                      <option key={exam.id} value={exam.id}>{exam.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Profession (optional)</label>
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
                  <label>Health Authority (optional)</label>
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
                  <label>User (optional - for specific user access)</label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  >
                    <option value="">Select User</option>
                    {users?.map((user) => (
                      <option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>
                    ))}
                  </select>
                </div>
                <p className="form-help">
                  * At least one of Profession, Health Authority, or User must be selected
                </p>
                <div className="modal-actions">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Grant Access
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {grantModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => {
              setGrantModalOpen(false);
              setGrantForm({ userId: '', examId: '' });
            }}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Grant exam without payment</h2>
              <form onSubmit={handleGrantExamSubmit}>
                <div className="form-group">
                  <label>User *</label>
                  <select
                    value={grantForm.userId}
                    onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
                    required
                  >
                    <option value="">Select user</option>
                    {users?.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Exam *</label>
                  <select
                    value={grantForm.examId}
                    onChange={(e) => setGrantForm({ ...grantForm, examId: e.target.value })}
                    required
                  >
                    <option value="">Select exam</option>
                    {exams?.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title}
                        {exam.addon_enabled ? ' (addon)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="form-help">
                  If the user is on a paid package (AUTO), this exam will show and start even when it is not linked to
                  their package. Addon-gated exams no longer require a separate purchase for this user.
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setGrantModalOpen(false);
                      setGrantForm({ userId: '', examId: '' });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={grantExamMutation.isPending}>
                    {grantExamMutation.isPending ? 'Granting…' : 'Grant access'}
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

export default AccessManagement;
