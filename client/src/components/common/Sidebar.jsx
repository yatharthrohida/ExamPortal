import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import {
  LayoutDashboard,
  FilePlus2,
  BookOpenCheck,
  X,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const isTeacher = role === USER_ROLES.TEACHER;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const teacherLinks = [
    { to: '/teacher/dashboard', label: 'Examinations Overview', icon: LayoutDashboard },
    { to: '/teacher/create-exam', label: 'Create Assessment', icon: FilePlus2 },
  ];

  const studentLinks = [
    { to: '/student/dashboard', label: 'Available Assessments', icon: BookOpenCheck },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  const sidebarContent = (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col shrink-0 h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-neutral-900 tracking-tight leading-none">
              Exam<span className="text-neutral-600">Portal</span>
            </span>
            <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mt-0.5">
              {isTeacher ? 'Faculty Console' : 'Student Portal'}
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="text-[11px] font-medium uppercase text-neutral-400 tracking-wider px-3 mb-2">
          Navigation
        </div>

        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-900 font-medium'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 font-medium'
                  }`
                }
              >
                <Icon size={17} className="shrink-0 text-neutral-500" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Backdrop & Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-neutral-900/30 transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-10 w-64 max-w-[80vw] h-full shadow-lg">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
