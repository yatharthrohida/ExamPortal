import { Router } from 'express';
import {
  createExam,
  getMyExams,
  getExamById,
  updateExam,
  publishExam,
  archiveExam,
  getExamSummary,
  getExamByAccessCode,
  getAvailableExams,
  getExamInstructions,
  startExam,
  parseDocument,
  deleteExam,
  getExamAnalytics
} from '../controllers/examController.js';
import {
  getExamQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  unpublishExam
} from '../controllers/questionController.js';
import { verifyAuth, requireRole } from '../middleware/auth.js';

export const examRouter = Router();

// Public / Student Assessment Discovery & Ingestion
examRouter.get('/available', getAvailableExams);
examRouter.get('/code/:code', getExamByAccessCode);
examRouter.get('/:id/instructions', getExamInstructions);
examRouter.post('/:id/start', verifyAuth, startExam);

// Teacher Exam Management Endpoints (Require TEACHER or ADMIN)
const teacherOnly = [verifyAuth, requireRole('TEACHER', 'ADMIN')];

// Document parsing & question staging
examRouter.post('/parse-document', ...teacherOnly, parseDocument);

// Teacher's exams (support both /mine and /teacher for frontend compatibility)
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

// Question Management Endpoints (Teacher Drafts)
examRouter.get('/:examId/questions', ...teacherOnly, getExamQuestions);
examRouter.post('/:examId/questions', ...teacherOnly, createQuestion);
examRouter.put('/:examId/questions/reorder', ...teacherOnly, reorderQuestions);
examRouter.patch('/:examId/questions/:questionId', ...teacherOnly, updateQuestion);
examRouter.delete('/:examId/questions/:questionId', ...teacherOnly, deleteQuestion);

export default examRouter;
