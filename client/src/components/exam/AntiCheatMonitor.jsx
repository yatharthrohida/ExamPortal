import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export const AntiCheatMonitor = ({
  isOpen,
  strikeCount,
  maxStrikes,
  lastViolation,
  onDismiss,
}) => {
  const isFinalStrike = strikeCount >= maxStrikes;
  const remaining = Math.max(0, maxStrikes - strikeCount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isFinalStrike ? undefined : onDismiss}
      closeOnOverlay={false}
      title="Proctoring Integrity Warning"
    >
      <div className="text-center py-2">
        <div
          className={`w-12 h-12 rounded-md text-white flex items-center justify-center mx-auto mb-3.5 shadow-sm ${
            isFinalStrike ? 'bg-red-600' : 'bg-amber-500'
          }`}
        >
          {isFinalStrike ? <ShieldAlert size={24} /> : <AlertTriangle size={24} />}
        </div>

        <h3 className="text-base font-bold text-neutral-900 mb-1.5">
          {isFinalStrike ? 'Proctoring Strike Limit Reached' : 'Assessment Window Blurred'}
        </h3>

        <p className="text-neutral-600 text-xs sm:text-sm mb-4 leading-relaxed">
          {isFinalStrike
            ? `You have exceeded the maximum threshold of ${maxStrikes} integrity violations. As specified in examination regulations, your assessment is being submitted automatically.`
            : `You navigated away from the proctored examination window. Switching tabs, minimizing windows, or accessing other applications is recorded.`}
        </p>

        {/* Strike Meter */}
        <div className="flex justify-center items-center gap-1.5 mb-4">
          {Array.from({ length: maxStrikes }).map((_, idx) => {
            const isFilled = idx < strikeCount;
            return (
              <div
                key={idx}
                className={`w-7 h-1.5 rounded-xs transition-colors ${
                  isFilled
                    ? isFinalStrike
                      ? 'bg-red-600'
                      : 'bg-amber-500'
                    : 'bg-neutral-200'
                }`}
              />
            );
          })}
        </div>

        {/* Audit Details */}

        {!isFinalStrike && (
          <Button
            variant="primary"
            size="md"
            onClick={onDismiss}
            className="w-full justify-center"
          >
            I Understand & Resume Exam
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default AntiCheatMonitor;
