/**
 * Utility functions for formatting time, dates, scores, and text
 */

export const formatTimer = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

export const formatPercentage = (score, total) => {
  if (!total || total === 0) return 0;
  const pct = (score / total) * 100;
  return Math.max(0, Math.round(pct * 10) / 10);
};

export const calculateGrade = (percentage) => {
  if (percentage >= 90) return { grade: 'A+', label: 'Outstanding' };
  if (percentage >= 80) return { grade: 'A', label: 'Excellent' };
  if (percentage >= 70) return { grade: 'B', label: 'Very Good' };
  if (percentage >= 60) return { grade: 'C', label: 'Good' };
  if (percentage >= 50) return { grade: 'D', label: 'Pass' };
  return { grade: 'F', label: 'Fail' };
};

