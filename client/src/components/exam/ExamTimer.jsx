import React from 'react';
import { Clock } from 'lucide-react';
import { formatTimer } from '../../utils/formatters';

export const ExamTimer = ({ secondsLeft, isWarning, isCritical }) => {
  let timerClasses = 'bg-neutral-100 text-neutral-800 border-neutral-200';

  if (isCritical) {
    timerClasses = 'bg-red-50 text-red-700 border-red-300';
  } else if (isWarning) {
    timerClasses = 'bg-amber-50 text-amber-800 border-amber-300';
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold tabular-nums font-mono border transition-colors ${timerClasses}`}
      role="timer"
      aria-live="polite"
    >
      <span>{formatTimer(secondsLeft)}</span>
      {isCritical && (
        <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 hidden sm:inline ml-1 font-sans">
          Ending Soon
        </span>
      )}
    </div>
  );
};

export default ExamTimer;
