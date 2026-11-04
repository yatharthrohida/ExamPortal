import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { USER_ROLES } from './utils/constants';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ExamProvider } from './context/ExamContext';

// Common Components
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Student Portal Pages
import StudentDashboard from './pages/student/StudentDashboard';
import ExamInstructions from './pages/student/ExamInstructions';
import ExamSession from './pages/student/ExamSession';
import ExamResult from './pages/student/ExamResult';

// Teacher Portal Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreateExam from './pages/teacher/CreateExam';
import ExamAnalytics from './pages/teacher/ExamAnalytics';

export const App = () => {
  return (
    <AuthProvider>
      <ExamProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student Portal Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exam/:id/instructions"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                <ExamInstructions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exam/:id"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]}>
                <ExamSession />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/result/:submissionId"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT, USER_ROLES.TEACHER]}>
                <ExamResult />
              </ProtectedRoute>
            }
          />

          {/* Teacher Portal Protected Routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/create-exam"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                <CreateExam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exam/:id/analytics"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
                <ExamAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Wildcard Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ExamProvider>
    </AuthProvider>
  );
};

export default App;

