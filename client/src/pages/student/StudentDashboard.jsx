import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import examService from '../../services/examService';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import {
  Clock,
  Award,
  BookOpen,
  AlertCircle,
  ArrowRight,
  FileText,
  CheckCircle,
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const data = await examService.getAvailableExams();
        setExams(data);
      } catch (err) {
        setError('Failed to fetch available assessments.');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const handleStartExam = (examId) => {
    navigate(`/student/exam/${examId}/instructions`);
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title="Student Candidate Portal"
          subtitle="Examinations"
        />

        <main className="flex-1 p-5 sm:p-8 max-w-6xl w-full mx-auto">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-6 mb-6 border-b border-neutral-200">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Welcome back, {user?.name || 'Student'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                View your active assessments and examination schedules.
              </p>
            </div>
            {user?.studentId && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-white text-neutral-700 border border-neutral-200 shadow-sm">
                Roll No: <span className="font-semibold text-neutral-900 ml-1.5">{user.studentId}</span>
              </span>
            )}
          </div>

          {/* Real Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-4 sm:p-5 rounded-lg border border-neutral-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900 leading-none">{exams.length}</div>
                <div className="text-xs font-medium text-neutral-500 mt-1">Available Examinations</div>
              </div>
            </div>
          </div>

          {/* Active Assessments Section */}
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">
                  Current Examination Schedule
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Select an examination to read guidelines and begin your session.
                </p>
              </div>
              <span className="text-xs text-neutral-400 font-medium hidden sm:inline">
                {exams.length} {exams.length === 1 ? 'assessment' : 'assessments'} listed
              </span>
            </div>

            {loading ? (
              <Loader message="Loading available assessments..." />
            ) : error ? (
              <div className="p-4 border border-red-200 text-red-700 rounded-md text-xs flex items-center gap-2 bg-red-50">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : exams.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 bg-white rounded-lg border border-neutral-200 shadow-sm">
                <BookOpen size={36} className="mx-auto text-neutral-300 mb-3" />
                <h3 className="text-sm font-semibold text-neutral-800">No active assessments available</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Your instructors haven't scheduled any examinations at this time. Please check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white rounded-lg border border-neutral-200 shadow-sm p-5 hover:border-neutral-300 transition-all duration-150 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top status bar */}
                      <div className="flex justify-between items-center gap-2 mb-3">
                        <span className="text-xs text-neutral-400 font-medium flex items-center gap-1">
                          <FileText size={13} />
                          {exam.questions_count || 0} Questions
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-semibold text-neutral-900 mb-1.5 leading-snug">
                        {exam.title}
                      </h3>

                      <p className="text-xs text-neutral-500 line-clamp-2 mb-4 leading-relaxed">
                        {exam.description || 'Curriculum assessment evaluation testing course objectives.'}
                      </p>

                      {/* Meta Information Box */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-md bg-neutral-50 border border-neutral-200 mb-5 text-xs">
                        <div className="flex items-center gap-2 text-neutral-600">
                          <Clock size={14} className="text-neutral-400 shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase font-medium text-neutral-400 block leading-tight">Duration</span>
                            <span className="font-semibold text-neutral-800">{exam.duration_minutes} Mins</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-neutral-600">
                          <Award size={14} className="text-neutral-400 shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase font-medium text-neutral-400 block leading-tight">Total Marks</span>
                            <span className="font-semibold text-neutral-800">{exam.total_marks} Marks</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartExam(exam.id)}
                      className="w-full justify-center"
                    >
                      <span>Review & Start</span>
                      <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
