import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import submissionService from '../services/submissionService';
import { STORAGE_KEYS } from '../utils/constants';

const ExamContext = createContext(null);

export const ExamProvider = ({ children }) => {
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [markedQuestions, setMarkedQuestions] = useState([]);
  const [submissionId, setSubmissionId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Storage key helper for active session
  const getSessionKey = useCallback((examId, subId) => {
    return `${STORAGE_KEYS.EXAM_SESSION_PREFIX}${examId || 'active'}_${subId || 'sub'}`;
  }, []);

  // Initialize or restore active session
  const initExamSession = useCallback(({ exam: newExam, questions: newQuestions, submission_id: newSubId }) => {
    setExam(newExam);
    setQuestions(newQuestions);
    setSubmissionId(newSubId);

    // Check for cached session in localStorage
    const storageKey = getSessionKey(newExam.id, newSubId);
    const cached = localStorage.getItem(storageKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAnswers(parsed.answers || {});
        setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
        setMarkedQuestions(parsed.markedQuestions || []);
        console.info('[ExamContext] Restored exam session from local storage.');
      } catch (err) {
        console.warn('[ExamContext] Failed to parse cached exam session:', err);
      }
    } else {
      setAnswers({});
      setCurrentQuestionIndex(0);
      setMarkedQuestions([]);
    }
  }, [getSessionKey]);

  // Synchronize state changes to localStorage
  useEffect(() => {
    if (!exam || !submissionId) return;
    const storageKey = getSessionKey(exam.id, submissionId);
    const snapshot = {
      examId: exam.id,
      submissionId,
      answers,
      currentQuestionIndex,
      markedQuestions,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(snapshot));
    } catch (e) {
      console.warn('[ExamContext] Failed to cache snapshot:', e);
    }
  }, [exam, submissionId, answers, currentQuestionIndex, markedQuestions, getSessionKey]);

  // Select an option for a question
  const selectAnswer = useCallback((questionId, optionId) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: optionId };
      return updated;
    });

    // Fire non-blocking auto-save to backend
    if (submissionId) {
      submissionService.saveAnswer(submissionId, {
        questionId,
        selectedOptionId: optionId,
      }).catch((e) => console.warn('[ExamContext] Background answer save failed:', e));
    }
  }, [submissionId]);

  // Toggle mark for review
  const toggleMarkForReview = useCallback((questionId) => {
    setMarkedQuestions((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      }
      return [...prev, questionId];
    });
  }, []);

  // Navigation handlers
  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1));
  }, [questions.length]);

  const previousQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  }, [questions.length]);

  // Submit the active exam attempt
  const submitExam = useCallback(async (isAuto = false) => {
    if (isSubmitting || !submissionId || !exam) return null;
    setIsSubmitting(true);
    try {
      const evaluationResult = await submissionService.submitExam(submissionId, {
        examId: exam.id,
        answers,
        autoSubmitted: isAuto,
      });

      setResult(evaluationResult);

      // Clean up cached exam session from localStorage
      const storageKey = getSessionKey(exam.id, submissionId);
      localStorage.removeItem(storageKey);

      return evaluationResult;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, submissionId, exam, answers, getSessionKey]);

  const currentQuestion = questions[currentQuestionIndex] || null;

  const value = {
    exam,
    questions,
    answers,
    currentQuestion,
    currentQuestionIndex,
    markedQuestions,
    submissionId,
    isSubmitting,
    result,
    initExamSession,
    selectAnswer,
    toggleMarkForReview,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    submitExam,
    setResult,
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
};

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};

export default ExamContext;

