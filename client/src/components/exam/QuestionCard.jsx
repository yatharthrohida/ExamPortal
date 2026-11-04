import React from 'react';
import { Bookmark, Award } from 'lucide-react';

export const QuestionCard = ({
  question,
  questionIndex,
  totalQuestions,
  selectedOptionId,
  isMarkedForReview,
  onSelectOption,
  onToggleMarkForReview,
}) => {
  if (!question) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-12 text-center">
        <p className="text-neutral-500 font-medium text-sm">No question selected.</p>
      </div>
    );
  }

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between">
      <div>
        {/* Header with question index & mark badges */}
        <div className="flex flex-wrap justify-between items-center border-b border-neutral-200 pb-4 mb-6 gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-neutral-900">
              Question {questionIndex + 1}{' '}
              <span className="text-neutral-400 font-normal">of {totalQuestions}</span>
            </span>
            {isMarkedForReview && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <Bookmark size={12} /> Marked for Review
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
              <Award size={12} className="text-neutral-600" /> {question.marks || 1}{' '}
              {question.marks === 1 ? 'Mark' : 'Marks'}
            </span>
          </div>
        </div>

        {/* Question Text */}
        <div className="text-base sm:text-lg font-medium text-neutral-900 leading-relaxed mb-6">
          {question.question_text}
        </div>

        {/* Options List */}
        <div className="space-y-2.5">
          {(question.options || []).map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const letter = optionLetters[idx] || `${idx + 1}`;

            return (
              <div
                key={option.id}
                className={`flex items-start gap-3 p-3.5 rounded-md cursor-pointer transition-all ${
                  isSelected
                    ? 'border border-neutral-900 bg-neutral-100/70 text-neutral-900'
                    : 'border border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/60 text-neutral-800'
                }`}
                onClick={() => onSelectOption(question.id, option.id)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    onSelectOption(question.id, option.id);
                  }
                }}
              >
                <div
                  className={`w-6 h-6 rounded-md text-xs font-medium flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                    isSelected
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                  }`}
                >
                  {letter}
                </div>
                <div
                  className={`text-sm leading-relaxed ${
                    isSelected ? 'font-medium text-neutral-900' : 'text-neutral-700'
                  }`}
                >
                  {option.option_text}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clear Selected Option */}
      {selectedOptionId && (
        <div className="mt-5 pt-3 border-t border-neutral-100 flex justify-end">
          <button
            type="button"
            onClick={() => onSelectOption(question.id, null)}
            className="text-xs text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
          >
            Clear Selected Answer
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
