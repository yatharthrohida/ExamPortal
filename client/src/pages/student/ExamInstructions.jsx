import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import examService from '../../services/examService';
import { useExam } from '../../context/ExamContext';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import {
  Clock,
  ShieldAlert,
  ArrowLeft,
  Play,
  FileText,
  Award,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const ExamInstructions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { initExamSession } = useExam();

  const [instructions, setInstructions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        setLoading(true);
        const data = await examService.getExamInstructions(id);
        setInstructions(data);
      } catch (err) {
        setError('Failed to load examination instructions.');
      } finally {
        setLoading(false);
      }
    };
    fetchInstructions();
  }, [id]);

  const handleStartExam = async () => {
    if (!agreed) return;
    setStarting(true);
    setError(null);
    try {
      const sessionData = await examService.startExam(id);
      initExamSession({
        exam: sessionData.exam,
        questions: sessionData.questions,
        submission_id: sessionData.submission_id,
      });

      navigate(`/student/exam/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to initialize exam session.');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Instructions" />
          <Loader fullScreen message="Loading examination parameters and rules..." />
        </div>
      </div>
    );
  }

  if (error || !instructions) {
    return (
      <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Instructions" />
          <main className="flex-1 p-5 sm:p-8 max-w-3xl w-full mx-auto">
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2 mb-4">
              <AlertCircle size={16} />
              <span>{error || 'Unable to load examination details.'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/student/dashboard')}
            >
              Back to Dashboard
            </Button>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title="Examination Protocol"
          subtitle={instructions.title}
        />

        <main className="flex-1 p-5 sm:p-8 max-w-3xl w-full mx-auto">
          <div className="mb-5">
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/student/dashboard')}
              className="text-neutral-600"
            >
              Back to Examinations
            </Button>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6 sm:p-8">
            {/* Exam Header */}
            <div className="pb-5 mb-6 border-b border-neutral-200">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                {instructions.title}
              </h1>
              {instructions.description && (
                <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                  {instructions.description}
                </p>
              )}
            </div>

            {/* Assessment Parameter Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-md">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  <Clock size={14} className="text-neutral-400" /> Duration
                </div>
                <div className="text-lg font-bold text-neutral-900 mt-1">
                  {instructions.duration_minutes} Mins
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-md">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  <FileText size={14} className="text-neutral-400" /> Questions
                </div>
                <div className="text-lg font-bold text-neutral-900 mt-1">
                  {instructions.question_count} Items
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-md">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  <Award size={14} className="text-neutral-400" /> Total Marks
                </div>
                <div className="text-lg font-bold text-neutral-900 mt-1">
                  {instructions.total_marks} Pts
                </div>
              </div>

              <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-md">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  <ShieldAlert size={14} className="text-neutral-500" /> Max Strikes
                </div>
                <div className="text-lg font-bold text-neutral-900 mt-1">
                  {instructions.max_tab_switches}
                </div>
              </div>
            </div>

            {/* Strict Instructions List */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <ShieldAlert size={16} className="text-neutral-700" />
                <span>Examination Integrity Guidelines</span>
              </h2>
              <div className="bg-neutral-50 rounded-md border border-neutral-200 p-4">
                <ul className="space-y-2 text-xs sm:text-sm text-neutral-600 leading-relaxed list-disc pl-4">
                  {(instructions.rules || []).map((rule, idx) => (
                    <li key={idx} className="pl-1">{rule}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="border border-neutral-200 rounded-md p-4 mb-6 bg-white">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="integrityAgreement"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-medium">
                  I confirm that I am taking this examination under academic honor standards. I understand that window blurring, tab switching, and unauthorized actions will trigger strikes and may lead to automated submission.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/student/dashboard')}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={Play}
                disabled={!agreed || starting}
                loading={starting}
                onClick={handleStartExam}
              >
                Start Examination
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExamInstructions;
