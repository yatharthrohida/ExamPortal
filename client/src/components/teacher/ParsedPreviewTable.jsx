import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Check, X, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';

export const ParsedPreviewTable = ({
  questions = [],
  onUpdateQuestion,
  onDeleteQuestion,
  onAddQuestion,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const startEdit = (q) => {
    setEditingId(q.id);
    setEditForm(JSON.parse(JSON.stringify(q)));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (editForm && onUpdateQuestion) {
      onUpdateQuestion(editForm);
    }
    setEditingId(null);
    setEditForm(null);
  };

  const handleAddNew = () => {
    const newQuestion = {
      id: `q_manual_${Date.now()}`,
      question_text: 'Enter your multiple choice question stem here...',
      marks: 2.0,
      negative_marks: 0.5,
      options: [
        { id: `opt_${Date.now()}_a`, option_text: 'Option A', is_correct: true },
        { id: `opt_${Date.now()}_b`, option_text: 'Option B', is_correct: false },
        { id: `opt_${Date.now()}_c`, option_text: 'Option C', is_correct: false },
        { id: `opt_${Date.now()}_d`, option_text: 'Option D', is_correct: false },
      ],
    };
    if (onAddQuestion) {
      onAddQuestion(newQuestion);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-5 sm:p-6 mb-6">
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-neutral-200 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Question Management ({questions.length})
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Review questions, configure point weights, and verify the correct answer keys.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={Plus}
          onClick={handleAddNew}
        >
          Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="p-8 text-center text-neutral-500 border border-dashed border-neutral-300 rounded-md">
          <p className="font-medium text-xs text-neutral-700">No questions in this assessment.</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Upload a document above or click "Add Question" to start adding questions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, qIndex) => {
            const isEditing = editingId === q.id;

            if (isEditing) {
              return (
                <div
                  key={q.id}
                  className="border border-neutral-400 rounded-md p-4 bg-neutral-50 shadow-sm"
                >
                  <div className="mb-3.5">
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Question Text (Stem)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition"
                      value={editForm.question_text}
                      onChange={(e) =>
                        setEditForm({ ...editForm, question_text: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Awarded Marks
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        value={editForm.marks}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            marks: parseFloat(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Negative Penalty
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                        value={editForm.negative_marks}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            negative_marks: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Answer Options (select the radio button to set the correct key)
                    </label>
                    <div className="space-y-2">
                      {editForm.options.map((opt, optIndex) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_key_${q.id}`}
                            checked={opt.is_correct}
                            onChange={() => {
                              const updatedOpts = editForm.options.map((o) => ({
                                ...o,
                                is_correct: o.id === opt.id,
                              }));
                              setEditForm({ ...editForm, options: updatedOpts });
                            }}
                            className="w-4 h-4 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                            value={opt.option_text}
                            onChange={(e) => {
                              const updatedOpts = [...editForm.options];
                              updatedOpts[optIndex].option_text = e.target.value;
                              setEditForm({ ...editForm, options: updatedOpts });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={saveEdit}
                    >
                      Save Question
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={q.id}
                className="border border-neutral-200 rounded-md p-4 bg-white hover:border-neutral-300 transition-colors"
              >
                <div className="flex justify-between items-start gap-3 mb-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center font-semibold text-[11px] shrink-0 mt-0.5">
                      {qIndex + 1}
                    </span>
                    <span className="font-medium text-neutral-900 text-sm leading-snug">
                      {q.question_text}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
                      +{q.marks || 1} mark{q.marks !== 1 ? 's' : ''}
                    </span>
                    {Number(q.negative_marks) > 0 && (
                      <span className="px-2 py-0.5 text-[11px] rounded-md text-red-700 ">
                        -{q.negative_marks} neg
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(q)}
                      className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100 cursor-pointer transition"
                      title="Edit question"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteQuestion && onDeleteQuestion(q.id)}
                      className="p-1 text-neutral-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer transition"
                      title="Delete question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2.5 sm:pl-7">
                  {(q.options || []).map((opt, optIdx) => {
                    const letters = ['A', 'B', 'C', 'D', 'E'];
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${
                          opt.is_correct
                            ? 'text-green-700'
                            : 'text-neutral-600'
                        }`}
                      >
                        <span className="font-medium text-neutral-400">
                          {letters[optIdx] || optIdx + 1}.
                        </span>
                        <span className="truncate">{opt.option_text}</span>
                        {opt.is_correct && (
                          <span className="ml-auto text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-0.5">
                            <Check size={11} /> Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParsedPreviewTable;
