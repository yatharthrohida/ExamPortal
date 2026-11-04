import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import Button from '../components/common/Button';
import { Lock, UserCheck, Mail, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';

export const Login = () => {
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.STUDENT);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const isTeacherTab = selectedRole === USER_ROLES.TEACHER;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    if (!identifier || !password) {
      setError(
        isTeacherTab
          ? 'Please enter your faculty email and password.'
          : 'Please enter your Roll No. / Student ID (or Email) and password.'
      );
      return;
    }

    setLoading(true);
    try {
      const user = await login(identifier, password);
      if (user.role === USER_ROLES.TEACHER) {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6 sm:p-6 text-neutral-900">
      <div className="max-w-[420px] w-full bg-white rounded-lg border border-neutral-200 shadow-sm p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            ExamPortal
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Online Examination & Assessment System
          </p>
        </div>

        {/* Role Segmented Switcher */}
        <div className="mb-5">
          <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-md border border-neutral-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setSelectedRole(USER_ROLES.STUDENT);
                setError(null);
              }}
              className={`py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isTeacherTab
                  ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <UserCheck size={14} />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole(USER_ROLES.TEACHER);
                setError(null);
              }}
              className={`py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isTeacherTab
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              {isTeacherTab ? 'Academic Email' : 'Roll No. / Student ID or Email'}
            </label>
            <div className="relative">
              <input
                type={isTeacherTab ? 'email' : 'text'}
                required
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              {isTeacherTab ? (
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
              ) : (
                <UserCheck
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full pl-9 pr-10 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none cursor-pointer p-0.5"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full"
            >
              {isTeacherTab ? 'Sign in as Faculty' : 'Sign in to Portal'}
            </Button>
          </div>
        </form>

        <div className="text-center mt-5 pt-4 border-t border-neutral-200 text-xs text-neutral-500">
          Need an account?{' '}
          <Link to="/register" className="font-semibold text-neutral-900 underline hover:text-neutral-700">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
