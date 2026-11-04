import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import examService from '../../services/examService';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import {
  FilePlus2,
  BookOpen,
  CheckCircle,
  Clock,
  BarChart2,
  Trash2,
  Globe,
  GlobeLock,
  FileText,
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Delete modal state
  const [examToDelete, setExamToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await examService.getTeacherExams();
      setExams(data);
    } catch (err) {
      setError('Failed to fetch examination records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleTogglePublish = async (exam) => {
    try {
      const nextState = !exam.is_published;
      await examService.publishExam(exam.id, nextState);
      setExams((prev) =>
        prev.map((e) => (e.id === exam.id ? { ...e, is_published: nextState } : e))
      );
    } catch (err) {
      alert('Failed to update publication status.');
    }
  };

  const confirmDeleteExam = async () => {
    if (!examToDelete) return;
    try {
      setIsDeleting(true);
      await examService.deleteExam(examToDelete.id);
      setExams((prev) => prev.filter((e) => e.id !== examToDelete.id));
      setExamToDelete(null);
    } catch (err) {
      alert('Failed to delete examination.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalExams = exams.length;
  const publishedCount = exams.filter((e) => e.is_published).length;
  const draftCount = totalExams - publishedCount;
  const totalSubmissions = exams.reduce((acc, e) => acc + (Number(e.submissions_count) || 0), 0);

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title="Instructor Portal"
          subtitle="Examinations Management"
        />

        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto">
          {/* Welcome & Action Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 mb-6 border-b border-neutral-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Instructor Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Manage curriculum assessments, ingest question papers, and monitor class performance.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={FilePlus2}
              onClick={() => navigate('/teacher/create-exam')}
            >
              Create Assessment
            </Button>
          </div>

          {/* Compact Consistent Statistic Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 sm:p-5 border border-neutral-200 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
                <BookOpen size={18} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-neutral-900 leading-none">{totalExams}</div>
                <div className="text-xs font-medium text-neutral-500 mt-1">Total Exams</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-5 border border-neutral-200 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
                <CheckCircle size={18} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-neutral-900 leading-none">{publishedCount}</div>
                <div className="text-xs font-medium text-neutral-500 mt-1">Published</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-5 border border-neutral-200 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-neutral-900 leading-none">{draftCount}</div>
                <div className="text-xs font-medium text-neutral-500 mt-1">Drafts</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-5 border border-neutral-200 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
                <BarChart2 size={18} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-neutral-900 leading-none">{totalSubmissions}</div>
                <div className="text-xs font-medium text-neutral-500 mt-1">Submissions</div>
              </div>
            </div>
          </div>

          {/* Examinations Management Table */}
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-neutral-200 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Examinations Catalogue</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Authored examination papers, live status, and candidate response counts.
                </p>
              </div>
            </div>

            {loading ? (
              <Loader message="Loading examinations catalogue..." />
            ) : error ? (
              <div className="p-8 text-center text-red-600 font-medium text-xs">{error}</div>
            ) : exams.length === 0 ? (
              <div className="p-12 text-center text-neutral-500">
                <FileText size={36} className="mx-auto text-neutral-300 mb-3" />
                <h3 className="text-sm font-semibold text-neutral-800">No examinations created yet</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  Click "Create Assessment" above to author your first examination.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 text-xs font-medium uppercase tracking-wider border-b border-neutral-200">
                    <tr>
                      <th className="py-3 px-4 sm:px-5">Assessment</th>
                      <th className="py-3 px-4 sm:px-5">Duration & Marks</th>
                      <th className="py-3 px-4 sm:px-5">Status</th>
                      <th className="py-3 px-4 sm:px-5">Submissions</th>
                      <th className="py-3 px-4 sm:px-5">Created</th>
                      <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3.5 px-4 sm:px-5">
                          <div className="font-semibold text-neutral-900 text-sm">{exam.title}</div>
                          {exam.description && (
                            <div className="text-xs text-neutral-400 max-w-xs truncate mt-0.5">
                              {exam.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-xs">
                          <div className="text-neutral-800 font-medium">{exam.duration_minutes} Mins</div>
                          <div className="text-neutral-400">{exam.total_marks} Marks</div>
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-md ${
                              exam.is_published
                                ? 'text-green-700'
                                : 'text-neutral-600 border border-neutral-200'
                            }`}
                          >
                            {exam.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-xs">
                          <span className="font-bold text-neutral-900">
                            {exam.submissions_count || 0}
                          </span>
                          <span className="text-neutral-400 ml-1">candidates</span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-xs text-neutral-400">
                          {formatDateTime(exam.created_at)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant={exam.is_published ? 'outline' : 'success'}
                              size="sm"
                              icon={exam.is_published ? GlobeLock : Globe}
                              onClick={() => handleTogglePublish(exam)}
                              title={exam.is_published ? 'Unpublish assessment' : 'Publish assessment'}
                            >
                              {exam.is_published ? 'Unpublish' : 'Publish'}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              icon={BarChart2}
                              onClick={() => navigate(`/teacher/exam/${exam.id}/analytics`)}
                              title="View analytics"
                            >
                              Analytics
                            </Button>

                            <button
                              type="button"
                              onClick={() => setExamToDelete(exam)}
                              className="p-1.5 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Delete assessment"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(examToDelete)}
        onClose={() => setExamToDelete(null)}
        title="Delete Examination"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExamToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isDeleting}
              onClick={confirmDeleteExam}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600 leading-relaxed">
          Are you sure you want to delete <strong className="text-neutral-900 font-semibold">"{examToDelete?.title}"</strong>? All associated questions and candidate responses will be permanently removed.
        </p>
      </Modal>
    </div>
  );
};

export default TeacherDashboard;
