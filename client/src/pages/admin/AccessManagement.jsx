import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExamAccess, createExamAccess, deleteExamAccess, getExams, getProfessions, getHealthAuthorities, getUserProfiles } from '../../utils/supabaseQueries';
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
      </div>
    </Layout>
  );
};

export default AccessManagement;
