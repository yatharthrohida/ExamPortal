import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import examService from '../../services/examService';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import AnalyticsChart from '../../components/teacher/AnalyticsChart';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';
import {
  ArrowLeft,
  Search,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';

export const ExamAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!id) {
        setError('No assessment identifier provided.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await examService.getExamAnalytics(id);
        setAnalytics(data);
      } catch (err) {
        setError('Failed to aggregate candidate performance analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [id]);

  const handleExportCSV = () => {
    if (!analytics || !analytics.roster) return;
    const headers = ['Student Name', 'Email', 'Score', 'Status', 'Submitted At', 'Tab Switch Strikes'];
    const rows = analytics.roster.map((s) => [
      `"${s.student_name}"`,
      `"${s.email}"`,
      s.score,
      s.status,
      `"${s.submitted_at}"`,
      s.tab_switches,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${analytics.exam?.title || 'exam'}_gradebook.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Analytics" />
          <Loader fullScreen message="Aggregating performance analytics and proctor logs..." />
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Analytics" />
          <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto">
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center gap-2 mb-4">
              <AlertTriangle size={16} /> {error || 'Analytics record not found.'}
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/teacher/dashboard')}
            >
              Back to Overview
            </Button>
          </main>
        </div>
      </div>
    );
  }

  const filteredRoster = (analytics.roster || []).filter(
    (student) =>
      student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title="Performance Evaluation"
          subtitle={analytics.exam.title}
        />

        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/teacher/dashboard')}
              className="text-neutral-600"
            >
              Back to Overview
            </Button>

            <Button
              variant="outline"
              size="sm"
              icon={FileSpreadsheet}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </div>

          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              {analytics.exam.title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Cohort Performance & Proctor Audit &bull; Total Marks: {analytics.exam.total_marks} Pts
            </p>
          </div>

          {/* Visual Analytics & KPIs */}
          <AnalyticsChart analytics={analytics} />

          {/* Candidate Gradebook Table */}
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-5 sm:p-6 mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pb-3 border-b border-neutral-200">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">
                  Candidate Submissions Roster ({filteredRoster.length})
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Submission timestamps, final scores, and proctoring audit log.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition"
                  placeholder="Filter candidate name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-600 text-xs font-semibold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3 sm:px-4">Candidate</th>
                    <th className="py-2.5 px-3 sm:px-4">Email</th>
                    <th className="py-2.5 px-3 sm:px-4">Score</th>
                    <th className="py-2.5 px-3 sm:px-4">Result</th>
                    <th className="py-2.5 px-3 sm:px-4">Submitted</th>
                    <th className="py-2.5 px-3 sm:px-4">Proctor Strikes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-xs text-neutral-400">
                        No candidate submissions matched your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((student) => (
                      <tr key={student.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3 px-3 sm:px-4 font-semibold text-neutral-900 text-xs">
                          {student.student_name}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-neutral-500 text-xs">{student.email}</td>
                        <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-xs">
                          <strong
                            className={
                              student.status === 'PASSED'
                                ? 'text-neutral-900 font-semibold'
                                : 'text-red-600 font-semibold'
                            }
                          >
                            {student.score}
                          </strong>{' '}
                          <span className="text-neutral-400 font-normal">
                            / {analytics.exam.total_marks}
                          </span>
                        </td>
                        <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-medium rounded-md ${
                              student.status === 'PASSED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-xs text-neutral-400 whitespace-nowrap">
                          {student.submitted_at}
                        </td>
                        <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-medium rounded-md ${
                              student.tab_switches === 0
                                ? 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                                : student.tab_switches < 3
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {student.tab_switches} Violation{student.tab_switches !== 1 ? 's' : ''}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExamAnalytics;
