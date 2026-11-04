import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../../context/ExamContext';
import { useAuth } from '../../context/AuthContext';
import useTimer from '../../hooks/useTimer';
import useAntiCheat from '../../hooks/useAntiCheat';
import ExamTimer from '../../components/exam/ExamTimer';
import QuestionCard from '../../components/exam/QuestionCard';
import QuestionPalette from '../../components/exam/QuestionPalette';
import AntiCheatMonitor from '../../components/exam/AntiCheatMonitor';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import examService from '../../services/examService';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Send,
  AlertTriangle,
} from 'lucide-react';

export const ExamSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    exam,
    questions,
    answers,
    currentQuestion,
    currentQuestionIndex,
    markedQuestions,
    submissionId,
    isSubmitting,
    initExamSession,
    selectAnswer,
    toggleMarkForReview,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    submitExam,
  } = useExam();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [initLoading, setInitLoading] = useState(!exam);

  useEffect(() => {
    const ensureSessionLoaded = async () => {
      if (!exam || questions.length === 0) {
        try {
          setInitLoading(true);
          const sessionData = await examService.startExam(id);
          initExamSession({
            exam: sessionData.exam,
            questions: sessionData.questions,
            submission_id: sessionData.submission_id,
          });
        } catch (err) {
          console.error('[ExamSession] Session initialization error:', err);
        } finally {
          setInitLoading(false);
        }
      }
    };
    ensureSessionLoaded();
  }, [exam, id, initExamSession, questions.length]);

  const handleFinalSubmit = useCallback(
    async (isAuto = false) => {
      setShowSubmitModal(false);
      try {
        const result = await submitExam(isAuto);
        const subId = result?.submission_id || submissionId;
        if (subId) {
          navigate(`/student/result/${subId}`, { replace: true });
        } else {
          navigate('/student/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('[ExamSession] Submission error:', err);
      }
    },
    [submitExam, submissionId, navigate]
  );

  const handleTimeUp = useCallback(() => {
    console.info('[ExamSession] Time expired! Auto-submitting assessment.');
    handleFinalSubmit(true);
  }, [handleFinalSubmit]);

  const handleStrikesExceeded = useCallback(() => {
    console.warn('[ExamSession] Proctoring violation threshold breached! Auto-submitting assessment.');
    handleFinalSubmit(true);
  }, [handleFinalSubmit]);

  const durationSeconds = (exam?.duration_minutes || 30) * 60;
  const { secondsLeft, isWarning, isCritical } = useTimer(
    durationSeconds,
    handleTimeUp
  );

  const {
    strikeCount,
    maxStrikes,
    showWarningModal,
    lastViolation,
    dismissWarning,
  } = useAntiCheat({
    submissionId,
    maxStrikes: exam?.max_tab_switches || 3,
    onExceededStrikes: handleStrikesExceeded,
    isEnabled: !isSubmitting,
  });

  if (initLoading || !exam) {
    return <Loader fullScreen message="Loading examination session..." />;
  }

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const totalQuestions = questions.length;
  const unansweredCount = totalQuestions - answeredCount;
  const markedCount = markedQuestions.length;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      {/* Distraction-free Header */}
      <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-sm text-neutral-900 truncate">
              {exam.title}
            </div>
            <div className="text-[11px] text-neutral-500 truncate mt-0.5">
              Candidate: {user?.name || 'Student'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ExamTimer
            secondsLeft={secondsLeft}
            isWarning={isWarning}
            isCritical={isCritical}
          />

          <Button
            variant="success"
            size="sm"
            icon={Send}
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
          >
            <span className="hidden sm:inline">Submit Exam</span>
            <span className="sm:hidden">Submit</span>
          </Button>
        </div>
      </header>

      {/* Main Workspace: Left Question Area + Right Palette */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Question + Nav Buttons */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <QuestionCard
            question={currentQuestion}
            questionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            selectedOptionId={currentQuestion ? answers[currentQuestion.id] : null}
            isMarkedForReview={currentQuestion ? markedQuestions.includes(currentQuestion.id) : false}
            onSelectOption={selectAnswer}
            onToggleMarkForReview={toggleMarkForReview}
          />

          {/* Action Navigation Controls */}
          <div className="flex justify-between items-center bg-white p-3.5 sm:p-4 rounded-lg border border-neutral-200 shadow-sm">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <Button
              variant={
                currentQuestion && markedQuestions.includes(currentQuestion.id)
                  ? 'warning'
                  : 'outline'
              }
              size="sm"
              icon={Bookmark}
              onClick={() => currentQuestion && toggleMarkForReview(currentQuestion.id)}
            >
              {currentQuestion && markedQuestions.includes(currentQuestion.id)
                ? 'Marked for Review'
                : 'Mark for Review'}
            </Button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={nextQuestion}
              >
                <span>Next</span>
                <ChevronRight size={14} className="ml-1" />
              </Button>
            ) : (
              <Button
                variant="success"
                size="sm"
                icon={Send}
                onClick={() => setShowSubmitModal(true)}
              >
                Finish & Submit
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Question Palette */}
        <aside className="lg:col-span-1">
          <QuestionPalette
            questions={questions}
            answers={answers}
            currentQuestionIndex={currentQuestionIndex}
            markedQuestions={markedQuestions}
            onSelectQuestion={goToQuestion}
          />
        </aside>
      </main>

      {/* Anti-Cheat Alert Modal */}
      <AntiCheatMonitor
        isOpen={showWarningModal}
        strikeCount={strikeCount}
        maxStrikes={maxStrikes}
        lastViolation={lastViolation}
        onDismiss={dismissWarning}
      />

      {/* Submission Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Examination"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSubmitModal(false)}
              disabled={isSubmitting}
            >
              Return to Exam
            </Button>
            <Button
              variant="success"
              size="sm"
              icon={Send}
              loading={isSubmitting}
              onClick={() => handleFinalSubmit(false)}
            >
              Confirm & Submit
            </Button>
          </>
        }
      >
        <div className="py-1">
          <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
            Please review your attempt status before final submission. Once submitted, you cannot change your answers.
          </p>

          <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-neutral-50 border border-neutral-200 rounded-md text-center">
            <div>
              <div className="text-xl font-bold text-emerald-600">
                {answeredCount}
              </div>
              <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mt-0.5">
                Answered
              </div>
            </div>

            <div>
              <div className="text-xl font-bold text-neutral-700">
                {unansweredCount}
              </div>
              <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mt-0.5">
                Unanswered
              </div>
            </div>

            <div>
              <div className="text-xl font-bold text-amber-600">
                {markedCount}
              </div>
              <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mt-0.5">
                For Review
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExamSession;
