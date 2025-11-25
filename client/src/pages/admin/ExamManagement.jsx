import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExams, createExam, updateExam, deleteExam, addQuestion } from '../../utils/supabaseQueries';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './ExamManagement.css';

const ExamManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    examType: 'PROMETRIC',
    totalMcqs: '',
    duration: '',
    isActive: true,
  });
  const [questionData, setQuestionData] = useState({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
  });

  const queryClient = useQueryClient();

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: getExams,
  });

  const createExamMutation = useMutation({
    mutationFn: (data) => createExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exams']);
      setShowModal(false);
      resetForm();
      toast.success('Exam created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create exam');
    },
  });

  const updateExamMutation = useMutation({
    mutationFn: ({ id, data }) => updateExam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exams']);
      setShowModal(false);
      setEditingExam(null);
      resetForm();
      toast.success('Exam updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update exam');
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: (id) => deleteExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['exams']);
      toast.success('Exam deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete exam');
    },
  });

  const addQuestionMutation = useMutation({
    mutationFn: ({ examId, data }) => addQuestion(examId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['exams']);
      setShowQuestionModal(false);
      resetQuestionForm();
      toast.success('Question added successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add question');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      examType: 'PROMETRIC',
      totalMcqs: '',
      duration: '',
      isActive: true,
    });
  };

  const resetQuestionForm = () => {
    setQuestionData({
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
    });
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      description: exam.description || '',
      examType: exam.exam_type,
      totalMcqs: exam.total_mcqs,
      duration: exam.duration,
      isActive: exam.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      totalMcqs: parseInt(formData.totalMcqs),
      duration: parseInt(formData.duration),
    };

    if (editingExam) {
      updateExamMutation.mutate({ id: editingExam.id, data });
    } else {
      createExamMutation.mutate(data);
    }
  };

  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    addQuestionMutation.mutate({ examId: selectedExam.id, data: questionData });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      deleteExamMutation.mutate(id);
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
      <div className="exam-management">
        <div className="page-header">
          <h1>Exam Management</h1>
          <button onClick={() => { setEditingExam(null); resetForm(); setShowModal(true); }} className="btn-primary">
            Add Exam
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Total MCQs</th>
                <th>Duration (min)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams?.map((exam) => (
                <tr key={exam.id}>
                  <td>{exam.title}</td>
                  <td>{exam.exam_type}</td>
                  <td>{exam.total_mcqs}</td>
                  <td>{exam.duration}</td>
                  <td>
                    <span className={`status-badge ${exam.is_active ? 'active' : 'inactive'}`}>
                      {exam.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(exam)} className="btn-edit">Edit</button>
                    <button onClick={() => { setSelectedExam(exam); resetQuestionForm(); setShowQuestionModal(true); }} className="btn-add-question">
                      Add Question
                    </button>
                    <button onClick={() => handleDelete(exam.id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingExam(null); resetForm(); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editingExam ? 'Edit Exam' : 'Add Exam'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                <div className="form-group">
                  <label>Exam Type</label>
                  <select
                    value={formData.examType}
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                    required
                  >
                    <option value="PROMETRIC">Prometric</option>
                    <option value="PEARSON">Pearson</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Total MCQs</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalMcqs}
                    onChange={(e) => setFormData({ ...formData, totalMcqs: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
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
                  <button type="button" onClick={() => { setShowModal(false); setEditingExam(null); resetForm(); }} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingExam ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showQuestionModal && selectedExam && (
          <div className="modal-overlay" onClick={() => { setShowQuestionModal(false); setSelectedExam(null); resetQuestionForm(); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add Question to {selectedExam.title}</h2>
              <form onSubmit={handleQuestionSubmit}>
                <div className="form-group">
                  <label>Question</label>
                  <textarea
                    value={questionData.question}
                    onChange={(e) => setQuestionData({ ...questionData, question: e.target.value })}
                    required
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Option A</label>
                  <input
                    type="text"
                    value={questionData.optionA}
                    onChange={(e) => setQuestionData({ ...questionData, optionA: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Option B</label>
                  <input
                    type="text"
                    value={questionData.optionB}
                    onChange={(e) => setQuestionData({ ...questionData, optionB: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Option C</label>
                  <input
                    type="text"
                    value={questionData.optionC}
                    onChange={(e) => setQuestionData({ ...questionData, optionC: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Option D</label>
                  <input
                    type="text"
                    value={questionData.optionD}
                    onChange={(e) => setQuestionData({ ...questionData, optionD: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Correct Answer</label>
                  <select
                    value={questionData.correctAnswer}
                    onChange={(e) => setQuestionData({ ...questionData, correctAnswer: e.target.value })}
                    required
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Explanation (optional)</label>
                  <textarea
                    value={questionData.explanation}
                    onChange={(e) => setQuestionData({ ...questionData, explanation: e.target.value })}
                    rows="3"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => { setShowQuestionModal(false); setSelectedExam(null); resetQuestionForm(); }} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Add Question
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

export default ExamManagement;
