import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfessions, createProfession, updateProfession, deleteProfession } from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './ProfessionManagement.css';

const ProfessionManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingProfession, setEditingProfession] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const queryClient = useQueryClient();

  const { data: professions, isLoading } = useQuery({
    queryKey: ['professions'],
    queryFn: getProfessions,
  });

  const createMutation = useMutation({
    mutationFn: (data) => createProfession(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['professions']);
      setShowModal(false);
      resetForm();
      toast.success('Profession created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create profession');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProfession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['professions']);
      setShowModal(false);
      setEditingProfession(null);
      resetForm();
      toast.success('Profession updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profession');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProfession(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['professions']);
      toast.success('Profession deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete profession');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
  };

  const handleEdit = (profession) => {
    setEditingProfession(profession);
    setFormData({
      name: profession.name,
      description: profession.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProfession) {
      updateMutation.mutate({ id: editingProfession.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this profession?')) {
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
      <div className="profession-management">
        <div className="page-header">
          <h1>Profession Management</h1>
          <button onClick={() => { setEditingProfession(null); resetForm(); setShowModal(true); }} className="btn-primary">
            Add Profession
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {professions?.map((profession) => (
                <tr key={profession.id}>
                  <td>{profession.name}</td>
                  <td>{profession.description || '-'}</td>
                  <td>
                    <button onClick={() => handleEdit(profession)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(profession.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingProfession(null); resetForm(); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editingProfession ? 'Edit Profession' : 'Add Profession'}</h2>
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
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => { setShowModal(false); setEditingProfession(null); resetForm(); }} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingProfession ? 'Update' : 'Create'}
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

export default ProfessionManagement;
