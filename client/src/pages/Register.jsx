import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import Button from '../components/common/Button';
import { User, Mail, Lock, AlertCircle, BadgeCheck, Shield, UserCheck } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.STUDENT,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.role === USER_ROLES.STUDENT && !formData.studentId.trim()) {
      setError('Please provide your official Roll No. / Student ID.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        name: formData.name,
        email: formData.email,
        studentId: formData.role === USER_ROLES.STUDENT ? formData.studentId.trim() : null,
        password: formData.password,
        role: formData.role,
      });

      if (user.role === USER_ROLES.TEACHER) {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const isStudent = formData.role === USER_ROLES.STUDENT;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4 sm:p-6 text-neutral-900">
      <div className="max-w-[440px] w-full bg-white rounded-lg border border-neutral-200 shadow-sm p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            ExamPortal Assessment System
          </p>
        </div>

        {/* Role Segmented Switcher */}
        <div className="mb-5">
          <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-md border border-neutral-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: USER_ROLES.STUDENT })}
              className={`py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isStudent
                  ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <UserCheck size={14} />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: USER_ROLES.TEACHER })}
              className={`py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isStudent
                  ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Shield size={14} />
              <span>Faculty</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-start gap-2 mb-4 font-medium">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                required
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition"
                placeholder="Dr. Jane Doe / Alex Smith"
                value={formData.name}
                onChange={handleChange}
              />
              <User
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Roll No field for students */}
          {isStudent && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Roll No. / Student ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="studentId"
                  required
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition"
                  placeholder="e.g. 2026-CS-042 or STU-8821"
                  value={formData.studentId}
                  onChange={handleChange}
                />
                <BadgeCheck
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                required
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition"
                placeholder={isStudent ? 'student@college.edu' : 'faculty@university.edu'}
                value={formData.email}
                onChange={handleChange}
              />
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Confirm
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full"
            >
              Register & Continue
            </Button>
          </div>
        </form>

        <div className="text-center mt-5 pt-4 border-t border-neutral-200 text-xs text-neutral-500">
          Already have an account?{' '}
          <Link to="/" className="font-semibold text-neutral-900 underline hover:text-neutral-700">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
