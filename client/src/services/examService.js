import api from './api';

export const examService = {
  // Student: Get all published/available exams
  async getAvailableExams() {
    try {
      const response = await api.get('/exams/available');
      return response.data?.data || response.data || [];
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to fetch available exams.';
      throw new Error(msg);
    }
  },

  // Student: Get detailed instructions before starting
  async getExamInstructions(examId) {
    try {
      const response = await api.get(`/exams/${examId}/instructions`);
      return response.data?.data || response.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to fetch exam instructions.';
      throw new Error(msg);
    }
  },

  // Student: Start exam session -> receives submissionId and sanitized questions
  async startExam(examId) {
    try {
      const response = await api.post(`/exams/${examId}/start`);
      return response.data?.data || response.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to start examination session.';
      throw new Error(msg);
    }
  },

  // Teacher: Get exams created by the authenticated teacher
  async getTeacherExams() {
    try {
      const response = await api.get('/exams/teacher');
      return response.data?.data || response.data || [];
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load teacher exams.';
      throw new Error(msg);
    }
  },

  // Teacher: Parse assessment paper (.pdf or .docx)
  async parseDocument(file) {
    try {
      const formData = new FormData();
      formData.append('document', file);
      const response = await api.post('/exams/parse-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data || response.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to parse assessment document.';
      throw new Error(msg);
    }
  },

  // Teacher: Save new exam draft
  async createExam(examData) {
    try {
      const response = await api.post('/exams', examData);
      return response.data?.data || response.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create assessment.';
      throw new Error(msg);
    }
  },

  // Teacher: Publish or Unpublish exam
  async publishExam(examId, isPublished) {
    try {
      const response = await api.put(`/exams/${examId}/publish`, { is_published: isPublished });
      return response.data?.data || response.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to update publication status.';
      throw new Error(msg);
    }
  },

  // Teacher: Delete exam
  async deleteExam(examId) {
    try {
      const response = await api.delete(`/exams/${examId}`);
      return response.data?.data || response.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to delete assessment.';
      throw new Error(msg);
    }
  },

  // Teacher: Aggregate exam performance analytics
  async getExamAnalytics(examId) {
    try {
      const response = await api.get(`/exams/${examId}/analytics`);
      return response.data?.data || response.data;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to load exam analytics.';
      throw new Error(msg);
    }
  },
};

export default examService;
