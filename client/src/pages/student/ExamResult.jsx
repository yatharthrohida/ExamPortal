import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import submissionService from '../../services/submissionService';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { formatDateTime, calculateGrade } from '../../utils/formatters';

export const ExamResult = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const data = await submissionService.getExamResult(submissionId);
        setResult(data);
      } catch (err) {
        setError('Failed to retrieve assessment evaluation results.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Evaluation" />
          <Loader fullScreen message="Compiling verified gradebook evaluation..." />
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Evaluation" />
          <main className="flex-1 p-5 sm:p-8 max-w-3xl w-full mx-auto">
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2 mb-4">
              <AlertTriangle size={16} /> {error || 'Result details not available.'}
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

  const isPassed = result.status === 'PASSED';
  const gradeInfo = calculateGrade(result.percentage);

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title="Assessment Performance"
          subtitle={result.exam_title}
        />

        <main className="flex-1 p-5 sm:p-8 max-w-3xl w-full mx-auto">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6 sm:p-8">
            {/* Header & Status */}
            <div className="text-center pb-6 border-b border-neutral-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium mb-3 border">
                {isPassed ? (
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 size={14} className="text-white" />
                    Passed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500">
                    <XCircle size={14} className="text-white" />
                    Did Not Pass
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                {result.exam_title || 'Examination Result'}
              </h1> 
              <p className="text-xs text-neutral-500 mt-1 flex items-center justify-center gap-1.5">
                <Calendar size={13} /> Submitted on {formatDateTime(result.submitted_at)}
              </p>
            </div>

            {/* Score Showcase Banner */}
            <div className="my-6 p-5 bg-neutral-50 border border-neutral-200 rounded-md grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1">
                  Score Obtained
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-neutral-900">
                  {result.total_score}{' '}
                  <span className="text-sm font-normal text-neutral-400">/ {result.total_marks}</span>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1">
                  Percentage
                </div>
                <div
                  className={`text-2xl sm:text-3xl font-bold ${
                    isPassed ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {result.percentage}%
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1">
                  Grade
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-neutral-900">
                  {gradeInfo?.letter || 'N/A'}
                </div>
              </div>
            </div>

            {/* Metric Summary Breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md text-center">
                <div className="text-xl font-bold text-green-700">
                  {result.summary?.correct_count ?? '-'}
                </div>
                <div className="text-[11px] font-medium text-neutral-600 mt-0.5">
                  Correct
                </div>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md text-center">
                <div className="text-xl font-bold text-red-700">
                  {result.summary?.incorrect_count ?? '-'}
                </div>
                <div className="text-[11px] font-medium text-neutral-600 mt-0.5">
                  Incorrect
                </div>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md text-center">
                <div className="text-xl font-bold text-neutral-700">
                  {result.summary?.unanswered_count ?? '-'}
                </div>
                <div className="text-[11px] font-medium text-neutral-600 mt-0.5">
                  Unanswered
                </div>
              </div>
            </div>

            {/* Question Breakdown */}
            {result.questionBreakdown && result.questionBreakdown.length > 0 && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-1.5">
                  <Award size={15} className="text-neutral-600" />
                  <span>Itemized Question Breakdown</span>
                </h3>
                <div className="space-y-2.5">
                  {result.questionBreakdown.map((item, idx) => (
                    <div
                      key={item.question_id || idx}
                      className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-md flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-neutral-400 block mb-0.5">
                          Question {idx + 1}
                        </span>
                        <div className="font-medium text-neutral-800 leading-snug">
                          {item.question_text}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                            item.is_correct
                              ? 'text-green-800'
                              : 'text-red-800'
                          }`}
                        >
                          {item.is_correct ? 'Correct' : 'Incorrect'}
                        </span>
                        <div className="text-[11px] text-neutral-500 mt-0.5 font-medium">
                          {item.awarded_marks > 0 ? `+${item.awarded_marks}` : item.awarded_marks} Marks
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="mt-8 pt-5 border-t border-neutral-200 flex justify-center">
              <Button
                variant="primary"
                size="md"
                icon={ArrowLeft}
                onClick={() => navigate('/student/dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExamResult;
