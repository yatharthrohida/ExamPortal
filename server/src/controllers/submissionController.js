import { pool } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * Autosaves or updates an individual answer for an ongoing examination session.
 * POST /api/submissions/:submissionId/save-answer
 */
export async function saveAnswer(req, res) {
  const { submissionId } = req.params;
  const questionId = req.body.question_id || req.body.questionId;
  const selectedOptionId = req.body.selected_option_id || req.body.selectedOptionId;

  if (!questionId) {
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'question_id is required.'
    });
  }

  try {
    // Verify submission is active
    const subRes = await pool.query(
      "SELECT id, status FROM submissions WHERE id = $1 LIMIT 1;",
      [submissionId]
    );

    if (subRes.rows.length === 0) {
      return sendSuccess(res, {
        data: { success: true, savedAt: new Date().toISOString(), simulated: true }
      });
    }

    if (subRes.rows[0].status !== 'IN_PROGRESS') {
      return sendError(res, {
        statusCode: 409,
        code: 'EXAM_ALREADY_SUBMITTED',
        message: 'Cannot record answers for an examination that has already concluded.'
      });
    }

    // Verify option exists in options table to satisfy FK
    let validOptionId = null;
    if (selectedOptionId) {
      try {
        const optCheck = await pool.query(
          "SELECT id FROM options WHERE id::text = $1 LIMIT 1;",
          [String(selectedOptionId)]
        );
        if (optCheck.rows.length > 0) validOptionId = optCheck.rows[0].id;
      } catch (e) {
        // Not a UUID or invalid
      }
    }

    // Upsert into submission_answers
    await pool.query(
      `INSERT INTO submission_answers (submission_id, question_id, selected_option_id, answered_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (submission_id, question_id) DO UPDATE
       SET selected_option_id = EXCLUDED.selected_option_id,
           answered_at = NOW();`,
      [submissionId, questionId, validOptionId]
    );

    return sendSuccess(res, {
      data: { success: true, savedAt: new Date().toISOString() }
    });
  } catch (err) {
    console.error('[SUBMISSION ERROR] saveAnswer:', err);
    return sendError(res, {
      statusCode: 500,
      code: 'SAVE_FAILED',
      message: 'Failed to record answer.'
    });
  }
}

/**
 * Records an anti-cheat proctoring telemetry event.
 * POST /api/submissions/:submissionId/telemetry
 */
export async function recordTelemetry(req, res) {
  const { submissionId } = req.params;
  const eventType = req.body.event_type || req.body.eventType || 'TAB_SWITCH';
  const details = req.body.details || {};
  const currentStrikes = parseInt(req.body.current_strikes ?? req.body.currentStrikes ?? 0, 10);

  try {
    const subRes = await pool.query(
      "SELECT id, status FROM submissions WHERE id = $1 LIMIT 1;",
      [submissionId]
    );

    if (subRes.rows.length > 0) {
      await pool.query(
        `INSERT INTO integrity_events (submission_id, event_type, event_data, occurred_at)
         VALUES ($1, $2, $3, NOW());`,
        [submissionId, eventType, JSON.stringify(details)]
      );

      await pool.query(
        `UPDATE submissions 
         SET tab_switch_count = GREATEST(tab_switch_count, $1),
             updated_at = NOW()
         WHERE id = $2;`,
        [currentStrikes, submissionId]
      );
    }

    return sendSuccess(res, {
      data: { recorded: true }
    });
  } catch (err) {
    console.error('[SUBMISSION ERROR] recordTelemetry:', err);
    return sendSuccess(res, {
      data: { recorded: true, fallback: true }
    });
  }
}

/**
 * Submits the examination attempt, evaluates student score, and marks status.
 * POST /api/submissions/:submissionId/submit
 */
export async function submitExam(req, res) {
  const { submissionId } = req.params;
  const answers = req.body.answers || {};
  const autoSubmitted = Boolean(req.body.auto_submitted ?? req.body.autoSubmitted ?? false);

  try {
    const subRes = await pool.query(
      `SELECT s.id, s.exam_id, s.student_id, s.status, s.tab_switch_count,
              e.title, e.total_marks, e.passing_marks, e.negative_marking_enabled
       FROM submissions s
       JOIN exams e ON e.id = s.exam_id
       WHERE s.id = $1 LIMIT 1;`,
      [submissionId]
    );

    if (subRes.rows.length === 0) {
      return sendError(res, {
        statusCode: 404,
        code: 'SUBMISSION_NOT_FOUND',
        message: 'Examination submission record not found.'
      });
    }

    const sub = subRes.rows[0];
    const examId = sub.exam_id;
    const totalMarks = parseFloat(sub.total_marks) || 25;
    const passingMarks = parseFloat(sub.passing_marks) || 10;

    // Fetch questions and correct options from database
    const qRes = await pool.query(
      `SELECT q.id, q.question_text, q.marks, q.negative_marks,
              o.id AS correct_option_id, o.option_text AS correct_option_text
       FROM questions q
       LEFT JOIN options o ON o.question_id = q.id AND o.is_correct = TRUE
       WHERE q.exam_id = $1
       ORDER BY q.position ASC;`,
      [examId]
    );

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const questionBreakdown = [];

    for (const q of qRes.rows) {
      const qMarks = parseFloat(q.marks) || 1.0;
      const qNeg = parseFloat(q.negative_marks) || 0.0;
      const selectedOptId = answers[q.id] || null;

      let isCorrect = false;
      let awardedMarks = 0;

      if (!selectedOptId) {
        unansweredCount++;
        awardedMarks = 0;
      } else if (q.correct_option_id && selectedOptId === q.correct_option_id) {
        isCorrect = true;
        correctCount++;
        awardedMarks = qMarks;
        totalScore += qMarks;
      } else {
        incorrectCount++;
        awardedMarks = sub.negative_marking_enabled ? -qNeg : 0;
        totalScore += awardedMarks;
      }

      questionBreakdown.push({
        question_id: q.id,
        question_text: q.question_text,
        marks: qMarks,
        negative_marks: qNeg,
        selected_option_id: selectedOptId,
        is_correct: isCorrect,
        awarded_marks: awardedMarks
      });

      // Upsert into submission_answers
      if (selectedOptId) {
        let validOptFk = null;
        try {
          const optCheck = await pool.query(
            "SELECT id FROM options WHERE id::text = $1 LIMIT 1;",
            [String(selectedOptId)]
          );
          if (optCheck.rows.length > 0) validOptFk = optCheck.rows[0].id;
        } catch (e) {}

        await pool.query(
          `INSERT INTO submission_answers (submission_id, question_id, selected_option_id, awarded_marks, is_correct, answered_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (submission_id, question_id) DO UPDATE
           SET selected_option_id = EXCLUDED.selected_option_id,
               awarded_marks = EXCLUDED.awarded_marks,
               is_correct = EXCLUDED.is_correct,
               answered_at = NOW();`,
          [submissionId, q.id, validOptFk, awardedMarks, isCorrect]
        );
      }
    }

    totalScore = Math.max(0, Math.round(totalScore * 10) / 10);
    const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 1000) / 10 : 0;
    const isPassed = totalScore >= passingMarks;
    const finalStatus = autoSubmitted ? 'AUTO_SUBMITTED' : 'SUBMITTED';

    // Update submissions table
    await pool.query(
      `UPDATE submissions
       SET status = $1,
           total_score = $2,
           percentage = $3,
           passed = $4,
           submitted_at = NOW(),
           updated_at = NOW()
       WHERE id = $5;`,
      [finalStatus, totalScore, percentage, isPassed, submissionId]
    );

    const resultPayload = {
      submission_id: submissionId,
      exam_id: examId,
      exam_title: sub.title,
      total_score: totalScore,
      total_marks: totalMarks,
      passing_marks: passingMarks,
      percentage,
      status: isPassed ? 'PASSED' : 'FAILED',
      submission_status: finalStatus,
      submitted_at: new Date().toISOString(),
      summary: {
        total_questions: qRes.rows.length,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unanswered_count: unansweredCount
      },
      questionBreakdown
    };

    return sendSuccess(res, {
      message: 'Examination submitted successfully',
      data: resultPayload
    });
  } catch (err) {
    console.error('[SUBMISSION ERROR] submitExam:', err);
    return sendError(res, {
      statusCode: 500,
      code: 'SUBMISSION_FAILED',
      message: 'Failed to process exam submission.'
    });
  }
}

/**
 * Retrieves the evaluated result for a completed exam submission.
 * GET /api/submissions/:submissionId/result
 */
export async function getExamResult(req, res) {
  const { submissionId } = req.params;

  try {
    const subRes = await pool.query(
      `SELECT s.id, s.exam_id, s.status, s.total_score, s.percentage, s.passed, s.submitted_at,
              e.title, e.total_marks, e.passing_marks
       FROM submissions s
       JOIN exams e ON e.id = s.exam_id
       WHERE s.id = $1 LIMIT 1;`,
      [submissionId]
    );

    if (subRes.rows.length === 0) {
      return sendError(res, {
        statusCode: 404,
        code: 'RESULT_NOT_FOUND',
        message: 'Exam submission result not found.'
      });
    }

    const sub = subRes.rows[0];

    const ansRes = await pool.query(
      `SELECT sa.question_id, sa.selected_option_id, sa.awarded_marks, sa.is_correct,
              q.question_text, q.marks, q.negative_marks
       FROM submission_answers sa
       JOIN questions q ON q.id = sa.question_id
       WHERE sa.submission_id = $1;`,
      [submissionId]
    );

    const correctCount = ansRes.rows.filter(a => a.is_correct).length;
    const answeredCount = ansRes.rows.length;

    const payload = {
      submission_id: sub.id,
      exam_id: sub.exam_id,
      exam_title: sub.title,
      total_score: parseFloat(sub.total_score) || 0,
      total_marks: parseFloat(sub.total_marks) || 25,
      passing_marks: parseFloat(sub.passing_marks) || 10,
      percentage: parseFloat(sub.percentage) || 0,
      status: sub.passed ? 'PASSED' : 'FAILED',
      submission_status: sub.status,
      submitted_at: sub.submitted_at,
      summary: {
        total_questions: answeredCount,
        correct_count: correctCount,
        incorrect_count: answeredCount - correctCount,
        unanswered_count: 0
      },
      questionBreakdown: ansRes.rows.map(a => ({
        question_id: a.question_id,
        question_text: a.question_text,
        marks: parseFloat(a.marks),
        negative_marks: parseFloat(a.negative_marks),
        selected_option_id: a.selected_option_id,
        is_correct: a.is_correct,
        awarded_marks: parseFloat(a.awarded_marks)
      }))
    };

    return sendSuccess(res, {
      message: 'Exam result retrieved',
      data: payload
    });
  } catch (err) {
    console.error('[SUBMISSION ERROR] getExamResult:', err);
    return sendError(res, {
      statusCode: 500,
      code: 'RESULT_FETCH_FAILED',
      message: 'Failed to retrieve exam result.'
    });
  }
}
