import React from 'react';
import { BarChart2, Users, TrendingUp, Award, AlertCircle } from 'lucide-react';

export const AnalyticsChart = ({ analytics }) => {
  if (!analytics) return null;

  const { summary, scoreDistribution = [], questionPerformance = [] } = analytics;
  const maxCount = Math.max(...scoreDistribution.map((d) => d.count), 1);

  return (
    <div className="flex flex-col gap-6">
      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 sm:p-5 border border-neutral-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900 leading-none">
              {summary.total_students}
            </div>
            <div className="text-xs font-medium text-neutral-500 mt-1">Candidates Enrolled</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-5 border border-neutral-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900 leading-none">
              {summary.class_average}{' '}
              <span className="text-xs font-normal text-neutral-400">
                / {analytics.exam.total_marks}
              </span>
            </div>
            <div className="text-xs font-medium text-neutral-500 mt-1">Class Average</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-5 border border-neutral-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
            <Award size={18} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900 leading-none">
              {summary.passing_rate}
            </div>
            <div className="text-xs font-medium text-neutral-500 mt-1">Passing Rate</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-5 border border-neutral-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0">
            <AlertCircle size={18} />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-neutral-900 leading-none">
              {summary.average_tab_switches}
            </div>
            <div className="text-xs font-medium text-neutral-500 mt-1">Avg Proctor Strikes</div>
          </div>
        </div>
      </div>

      {/* Score Distribution Chart */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={16} className="text-neutral-900" />
          <h3 className="text-sm font-semibold text-neutral-900">
            Score Frequency Distribution
          </h3>
        </div>
        <p className="text-xs text-neutral-400 mb-6">
          Cohort performance brackets across total scored marks.
        </p>

        <div className="flex items-end gap-4 sm:gap-6 h-48 pt-4 border-b border-neutral-200 pb-2">
          {scoreDistribution.map((item, idx) => {
            const heightPercent = Math.max(10, (item.count / maxCount) * 100);
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
              >
                <span className="text-xs font-medium text-neutral-500 opacity-80 group-hover:opacity-100 transition-opacity">
                  {item.count}
                </span>
                <div
                  className="w-full max-w-10 bg-neutral-900 hover:bg-neutral-800 rounded-t-sm transition-all"
                  style={{ height: `${heightPercent}%` }}
                  title={`${item.label}: ${item.count} candidates`}
                />
                <span className="text-[11px] font-medium text-neutral-500 text-center truncate w-full">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question Difficulty & Error Rate Analysis */}
      {questionPerformance.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-1">
            Question Difficulty & Accuracy
          </h3>
          <p className="text-xs text-neutral-400 mb-4">
            Calibration analysis showing accuracy and attempt rates per question item.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-xs font-semibold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Question Stem</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Attempt Rate</th>
                  <th className="py-2.5 px-3">Avg Awarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {questionPerformance.map((qp) => (
                  <tr key={qp.question_number} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-neutral-900 text-xs">
                      Q{qp.question_number}
                    </td>
                    <td className="py-3 px-3 text-neutral-700 text-xs max-w-md truncate">
                      {qp.question_text}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded-md ${
                          parseInt(qp.accuracy) >= 75
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : parseInt(qp.accuracy) >= 50
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                      >
                        {qp.accuracy}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-neutral-400 text-xs whitespace-nowrap">
                      {qp.attempt_rate}
                    </td>
                    <td className="py-3 px-3 font-medium text-neutral-800 text-xs whitespace-nowrap">
                      {qp.avg_awarded}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsChart;
