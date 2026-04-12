import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfiles, createUserProfile, updateUserProfile, deleteUserProfile, getProfessions, getHealthAuthorities } from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './UserManagement.css';

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
                    <button onClick={() => handleEdit(user)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(user.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
