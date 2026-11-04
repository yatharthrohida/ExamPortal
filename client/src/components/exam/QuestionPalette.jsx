import React from 'react';

export const QuestionPalette = ({
  questions = [],
  answers = {},
  currentQuestionIndex,
  markedQuestions = [],
  onSelectQuestion,
}) => {
  const total = questions.length;
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const markedCount = markedQuestions.length;
  const unansweredCount = total - answeredCount;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-5 flex flex-col h-fit">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-200">
        <h3 className="text-sm font-semibold text-neutral-900">Question Palette</h3>
        <span className="text-xs text-neutral-400 font-medium">{total} Total</span>
      </div>

      {/* Palette Status Legend */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-md mb-5 text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-xs bg-green-600 shrink-0" />
          <span>Answered ({answeredCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-xs bg-amber-500 shrink-0" />
          <span>Review ({markedCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-xs bg-white border border-neutral-300 shrink-0" />
          <span>Unanswered ({unansweredCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-xs border-2 border-neutral-900 bg-neutral-100 shrink-0" />
          <span>Current</span>
        </div>
      </div>

      {/* Numbered Matrix Grid */}
      <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto p-0.5">
        {questions.map((q, index) => {
          const isAnswered = Boolean(answers[q.id]);
          const isMarked = markedQuestions.includes(q.id);
          const isCurrent = index === currentQuestionIndex;

          let colorStyles =
            'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50';
          if (isAnswered) {
            colorStyles = 'bg-green-600 text-white font-medium border-green-600';
          }
          if (isMarked) {
            colorStyles = 'bg-amber-500 text-white font-medium border-amber-500';
          }
          if (isCurrent) {
            colorStyles += ' ring-2 ring-neutral-900 ring-offset-2 ring-offset-white font-bold';
          }

          return (
            <button
              key={q.id}
              type="button"
              className={`h-9 rounded-md text-xs font-medium relative transition flex items-center justify-center cursor-pointer ${colorStyles}`}
              onClick={() => onSelectQuestion(index)}
              title={`Question ${index + 1} - ${
                isAnswered ? 'Answered' : 'Unanswered'
              }${isMarked ? ' (Marked for Review)' : ''}`}
            >
              {index + 1}
              {isMarked && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionPalette;
