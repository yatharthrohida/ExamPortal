import { Router } from 'express';
import {
  createExam,
  getMyExams,
  getExamById,
  updateExam,
  publishExam,
  archiveExam,
  getExamSummary,
<<<<<<< HEAD
  getExamByAccessCode,
  getAvailableExams,
  getExamInstructions,
  startExam,
  parseDocument,
  deleteExam,
  getExamAnalytics
=======
  getExamResults,
  getExamByAccessCode
>>>>>>> origin/main
} from '../controllers/examController.js';
import {
  getExamQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  unpublishExam
} from '../controllers/questionController.js';
import {
  lookupExam,
  getStudentExamInfo,
  startExam
} from '../controllers/studentExamController.js';
import { verifyAuth, requireRole } from '../middleware/auth.js';

export const examRouter = Router();

<<<<<<< HEAD
// Public / Student Assessment Discovery & Ingestion
examRouter.get('/available', getAvailableExams);
examRouter.get('/code/:code', getExamByAccessCode);
examRouter.get('/:id/instructions', getExamInstructions);
examRouter.post('/:id/start', verifyAuth, startExam);
=======
// Student-only authentication guards
const studentOnly = [verifyAuth, requireRole('STUDENT', 'ADMIN')];
>>>>>>> origin/main

// Teacher Exam Management Endpoints (Require TEACHER or ADMIN)
const teacherOnly = [verifyAuth, requireRole('TEACHER', 'ADMIN')];

<<<<<<< HEAD
// Document parsing & question staging
examRouter.post('/parse-document', ...teacherOnly, parseDocument);

// Teacher's exams (support both /mine and /teacher for frontend compatibility)
=======
// --- Student Discovery & Start Endpoints ---
// POST /api/exams/lookup - student access-code lookup
examRouter.post('/lookup', ...studentOnly, lookupExam);

// Legacy/Compatibility GET lookup by code
examRouter.get('/code/:code', getExamByAccessCode);

// GET /api/exams/:id/student-info - student safe pre-exam summary
examRouter.get('/:id/student-info', ...studentOnly, getStudentExamInfo);

// POST /api/exams/:id/start - create or resume student attempt
examRouter.post('/:id/start', ...studentOnly, startExam);

// --- Core Exam Endpoints ---
// GET /api/exams/mine - list teacher's exams
>>>>>>> origin/main
examRouter.get('/mine', ...teacherOnly, getMyExams);
examRouter.get('/teacher', ...teacherOnly, getMyExams);

// Core CRUD Endpoints
examRouter.post('/', ...teacherOnly, createExam);
examRouter.get('/:id', ...teacherOnly, getExamById);
examRouter.patch('/:id', ...teacherOnly, updateExam);
examRouter.delete('/:id', ...teacherOnly, deleteExam);

// Publishing Workflow (support both PUT and POST)
examRouter.post('/:id/publish', ...teacherOnly, publishExam);
examRouter.put('/:id/publish', ...teacherOnly, publishExam);
examRouter.post('/:id/unpublish', ...teacherOnly, unpublishExam);
examRouter.post('/:id/archive', ...teacherOnly, archiveExam);

// Analytics & Reports
examRouter.get('/:id/summary', ...teacherOnly, getExamSummary);
examRouter.get('/:id/analytics', ...teacherOnly, getExamAnalytics);

<<<<<<< HEAD
// Question Management Endpoints (Teacher Drafts)
=======
// GET /api/exams/:id/results - every student's result for this exam
examRouter.get('/:id/results', ...teacherOnly, getExamResults);

// --- Question Management Endpoints (Teacher Drafts) ---
// GET /api/exams/:examId/questions - list questions including correct answer & explanation
>>>>>>> origin/main
examRouter.get('/:examId/questions', ...teacherOnly, getExamQuestions);
examRouter.post('/:examId/questions', ...teacherOnly, createQuestion);
<<<<<<< HEAD
=======

// PUT /api/exams/:examId/questions/reorder - reorder questions (placed before :questionId)
>>>>>>> origin/main
examRouter.put('/:examId/questions/reorder', ...teacherOnly, reorderQuestions);
examRouter.patch('/:examId/questions/:questionId', ...teacherOnly, updateQuestion);
examRouter.delete('/:examId/questions/:questionId', ...teacherOnly, deleteQuestion);

export default examRouter;
