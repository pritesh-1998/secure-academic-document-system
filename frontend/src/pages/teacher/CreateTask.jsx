import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function CreateTask() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
  });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/tasks', formData);
      setCreated(true);
    } catch (error) {
      console.error("Failed to create task", error);
      alert("Failed to create task. " + (error.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-border bg-bg text-text text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";

  if (created) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-xl border border-border p-5 sm:p-8 text-center space-y-3 sm:space-y-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-text">Task Created!</h3>
          <p className="text-xs sm:text-sm text-text-secondary">
            "{formData.title}" has been assigned to all students.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <button
              onClick={() => { setCreated(false); setFormData({ title: '', description: '', deadline: '' }); }}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-bg border border-border text-text text-xs sm:text-sm font-medium rounded-lg hover:bg-border/50 transition-colors"
            >
              Create Another
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-text">Create Assignment Task</h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Create a new task for students to upload their assignments.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-1.5">
              Task Title
            </label>
            <input
              id="task-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Cryptography Lab Report"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-1.5">
              Description
            </label>
            <textarea
              id="task-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what students need to submit..."
              required
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-secondary mb-1 sm:mb-1.5">
              Deadline
            </label>
            <input
              id="task-deadline"
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1 sm:pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="sm:flex-1 py-2 sm:py-2.5 bg-bg border border-border text-text text-xs sm:text-sm font-medium rounded-lg hover:bg-border/50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="create-task-submit"
              type="submit"
              disabled={loading}
              className="sm:flex-1 py-2 sm:py-2.5 bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
