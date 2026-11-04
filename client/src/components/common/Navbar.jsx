import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import { LogOut, Menu, Shield } from 'lucide-react';
import Button from './Button';

export const Navbar = ({ onToggleSidebar, title, subtitle }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isTeacher = role === USER_ROLES.TEACHER;

  return (
    <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </button>
        )}

        {/* Mobile brand (on desktop sidebar displays brand) */}
        <Link
          to={isTeacher ? '/teacher/dashboard' : '/student/dashboard'}
          className="md:hidden flex items-center gap-2 no-underline"
        >
          <span className="text-sm font-semibold text-neutral-900 tracking-tight">
            Exam<span className="text-neutral-600">Portal</span>
          </span>
        </Link>

        {/* Contextual Title on desktop if provided */}
        {title && (
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xl font-semibold text-neutral-900">{title}</span>
            {subtitle && (
              <>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-3">
            {/* User display */}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-neutral-800 leading-tight">
                {user.name}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={LogOut}
              onClick={handleLogout}
              title="Sign Out"
            >
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
