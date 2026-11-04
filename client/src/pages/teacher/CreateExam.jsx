import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import examService from '../../services/examService';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import DocumentUploader from '../../components/teacher/DocumentUploader';
import ParsedPreviewTable from '../../components/teacher/ParsedPreviewTable';
import Button from '../../components/common/Button';
import {
  Save,
  Globe,
  ArrowLeft,
  Settings2,
  AlertCircle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export const CreateExam = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_minutes: 45,
    passing_marks: 14,
    total_marks: 25,
    shuffle_questions: true,
    max_tab_switches: 3,
    start_time: '',
    end_time: '',
  });

  const [questions, setQuestions] = useState([
    {
      id: 'q_default_1',
      question_text:
        'Which React hook handles asynchronous side-effects such as subscriptions or fetching data?',
      marks: 2.0,
      negative_marks: 0.5,
      options: [
        { id: 'opt_def_1a', option_text: 'useState', is_correct: false },
        { id: 'opt_def_1b', option_text: 'useEffect', is_correct: true },
        { id: 'opt_def_1c', option_text: 'useMemo', is_correct: false },
        { id: 'opt_def_1d', option_text: 'useReducer', is_correct: false },
      ],
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleParsedQuestions = (parsed) => {
    setQuestions((prev) => [...prev, ...parsed]);
  };

  const handleUpdateQuestion = (updatedQ) => {
    setQuestions((prev) => prev.map((q) => (q.id === updatedQ.id ? updatedQ : q)));
  };

  const handleDeleteQuestion = (questionId) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleAddQuestion = (newQ) => {
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleSaveExam = async (shouldPublish = false) => {
    setError(null);
    if (!formData.title.trim()) {
      setError('Please provide an assessment title.');
      return;
    }
    if (questions.length === 0) {
      setError('An assessment must contain at least one question.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        duration_minutes: parseInt(formData.duration_minutes) || 30,
        passing_marks: parseFloat(formData.passing_marks) || 10,
        total_marks:
          parseFloat(formData.total_marks) ||
          questions.reduce((sum, q) => sum + (parseFloat(q.marks) || 1), 0),
        max_tab_switches: parseInt(formData.max_tab_switches) || 3,
        is_published: shouldPublish,
        teacher_id: user?.id,
        questions,
      };

      await examService.createExam(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/teacher/dashboard');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to save examination draft.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title="Create Assessment"
          subtitle="Curriculum Authoring"
        />

        <main className="flex-1 p-5 sm:p-8 max-w-5xl w-full mx-auto">
          {/* Top Bar with Quick Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/teacher/dashboard')}
              className="text-neutral-600"
            >
              Back to Dashboard
            </Button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                icon={Save}
                loading={saving}
                onClick={() => handleSaveExam(false)}
                className="flex-1 sm:flex-initial"
              >
                Save Draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Globe}
                loading={saving}
                onClick={() => handleSaveExam(true)}
                className="flex-1 sm:flex-initial"
              >
                Publish Assessment
              </Button>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Create New Assessment
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Configure parameters, ingest question documents, and set anti-cheat guidelines.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs flex items-center gap-2 mb-5 font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs flex items-center gap-2 mb-5 font-medium">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Assessment created successfully! Redirecting...</span>
            </div>
          )}

          {/* Section 1: Basic Details & Examination Settings */}
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-5 sm:p-6 mb-6">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-200">
              <BookOpen size={16} className="text-neutral-700" />
              <h2 className="text-sm font-semibold text-neutral-900">
                1. Basic Details & Syllabus
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Examination Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition"
                  placeholder="e.g. CS405: Distributed Systems & Consensus Protocols"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Description & Syllabus Topics
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition"
                  placeholder="Specify examination topics, question format rules, and permitted candidate resources."
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Examination Parameters */}
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-5 sm:p-6 mb-6">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-200">
              <Settings2 size={16} className="text-neutral-700" />
              <h2 className="text-sm font-semibold text-neutral-900">
                2. Parameters & Proctoring Controls
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Duration (Minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="duration_minutes"
                  min="5"
                  className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  value={formData.duration_minutes}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Total Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="total_marks"
                  min="1"
                  className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  value={formData.total_marks}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Passing Cutoff <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="passing_marks"
                  min="1"
                  className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  value={formData.passing_marks}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Max Proctor Strikes <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="max_tab_switches"
                  min="1"
                  max="10"
                  className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  value={formData.max_tab_switches}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-neutral-200">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-700 select-none">
                <input
                  type="checkbox"
                  name="shuffle_questions"
                  checked={formData.shuffle_questions}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <span>Randomize question order for students during evaluation</span>
              </label>
            </div>
          </div>

          {/* Section 3: Document Upload */}
          <DocumentUploader onParsedQuestions={handleParsedQuestions} />

          {/* Section 4: Question Management */}
          <ParsedPreviewTable
            questions={questions}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onAddQuestion={handleAddQuestion}
          />

          {/* Section 5: Bottom Final Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button
              variant="outline"
              size="md"
              icon={Save}
              loading={saving}
              onClick={() => handleSaveExam(false)}
            >
              Save as Draft
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Globe}
              loading={saving}
              onClick={() => handleSaveExam(true)}
            >
              Publish Assessment
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateExam;
