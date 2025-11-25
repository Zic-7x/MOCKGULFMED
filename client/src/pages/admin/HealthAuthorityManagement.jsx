import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHealthAuthorities, createHealthAuthority, updateHealthAuthority, deleteHealthAuthority } from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './HealthAuthorityManagement.css';

const HealthAuthorityManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingHA, setEditingHA] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    description: '',
  });

  const queryClient = useQueryClient();

  const { data: healthAuthorities, isLoading } = useQuery({
    queryKey: ['healthAuthorities'],
    queryFn: getHealthAuthorities,
  });

  const createMutation = useMutation({
    mutationFn: (data) => createHealthAuthority(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['healthAuthorities']);
      setShowModal(false);
      resetForm();
      toast.success('Health Authority created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create health authority');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateHealthAuthority(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['healthAuthorities']);
      setShowModal(false);
      setEditingHA(null);
      resetForm();
      toast.success('Health Authority updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update health authority');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteHealthAuthority(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['healthAuthorities']);
      toast.success('Health Authority deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete health authority');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      country: '',
      description: '',
    });
  };

  const handleEdit = (ha) => {
    setEditingHA(ha);
    setFormData({
      name: ha.name,
      country: ha.country,
      description: ha.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingHA) {
      updateMutation.mutate({ id: editingHA.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this health authority?')) {
      deleteMutation.mutate(id);
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
      <div className="health-authority-management">
        <div className="page-header">
          <h1>Health Authority Management</h1>
          <button onClick={() => { setEditingHA(null); resetForm(); setShowModal(true); }} className="btn-primary">
            Add Health Authority
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Country</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {healthAuthorities?.map((ha) => (
                <tr key={ha.id}>
                  <td>{ha.name}</td>
                  <td>{ha.country}</td>
                  <td>{ha.description || '-'}</td>
                  <td>
                    <button onClick={() => handleEdit(ha)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(ha.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingHA(null); resetForm(); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editingHA ? 'Edit Health Authority' : 'Add Health Authority'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => { setShowModal(false); setEditingHA(null); resetForm(); }} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingHA ? 'Update' : 'Create'}
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

export default HealthAuthorityManagement;
