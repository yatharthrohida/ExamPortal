import { Router } from 'express';
import {
  saveAnswer,
  recordTelemetry,
  submitExam,
  getExamResult
} from '../controllers/submissionController.js';

export const submissionRouter = Router();

// Student routes for active exam sessions
submissionRouter.post('/:submissionId/save-answer', saveAnswer);
submissionRouter.post('/:submissionId/telemetry', recordTelemetry);
submissionRouter.post('/:submissionId/submit', submitExam);
submissionRouter.get('/:submissionId/result', getExamResult);

export default submissionRouter;

