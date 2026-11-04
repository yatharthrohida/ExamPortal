import api from './api';

export const submissionService = {
  // Asynchronously save selected answer
  async saveAnswer(submissionId, { questionId, selectedOptionId }) {
    try {
      const response = await api.post(`/submissions/${submissionId}/save-answer`, {
        question_id: questionId,
        selected_option_id: selectedOptionId,
      });
      return response.data?.data || response.data;
    } catch (err) {
      console.warn('[SubmissionService] Failed to save answer on server:', err.message);
      throw err;
    }
  },

  // Record anti-cheat telemetry event (tab switch, window blur, fullscreen exit)
  async sendTelemetry(submissionId, { eventType, details, currentStrikes }) {
    try {
      const response = await api.post(`/submissions/${submissionId}/telemetry`, {
        event_type: eventType,
        details,
        current_strikes: currentStrikes,
      });
      return response.data?.data || response.data;
    } catch (err) {
      console.warn('[SubmissionService] Failed to dispatch telemetry event:', err.message);
      return { recorded: false };
    }
  },

  // Submit complete exam for server-side evaluation
  async submitExam(submissionId, { examId, answers, autoSubmitted = false }) {
    try {
      const response = await api.post(`/submissions/${submissionId}/submit`, {
        answers,
        auto_submitted: autoSubmitted,
      });
      return response.data?.data || response.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to submit examination.';
      throw new Error(msg);
    }
  },

  // Get finalized exam result
  async getExamResult(submissionId) {
    try {
      const response = await api.get(`/submissions/${submissionId}/result`);
      return response.data?.data || response.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to retrieve assessment results.';
      throw new Error(msg);
    }
  },
};

export default submissionService;
