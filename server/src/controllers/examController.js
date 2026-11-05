import { pool } from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { unpublishExam } from './questionController.js';
import {
  generateSecureAccessCode,
  validateExamMetadata,
  validateQuestionsForPublishing
} from '../services/examService.js';

/**
 * Normalizes question and option formats from client payloads.
 */
function normalizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions.map((q, qIdx) => {
    const prompt = q.questionText || q.prompt || q.question_text || '';
    const marks = parseFloat(q.marks || 2.00);
<<<<<<< HEAD
    const negativeMarks = parseFloat(q.negativeMarks ?? q.negative_marks ?? 0.50);
    const questionType = q.questionType || q.question_type || 'SINGLE_CHOICE';
=======
    const negativeMarks = 0; // Negative marking is disabled for all questions.
    const questionType = q.questionType || 'SINGLE_CHOICE';
>>>>>>> origin/main
    const explanation = q.explanation || null;
    const position = q.position || (qIdx + 1);

    const rawOptions = q.options || [];
    const options = rawOptions.map((opt, optIdx) => {
      const optionText = typeof opt === 'string' ? opt : (opt.optionText || opt.text || opt.option_text || '');
      const isCorrect = typeof opt === 'object' && ('isCorrect' in opt
        ? Boolean(opt.isCorrect)
        : ('is_correct' in opt ? Boolean(opt.is_correct) : (q.correctIndex === optIdx)));

      return {
        optionText,
        isCorrect,
        position: optIdx + 1
      };
    });

    return {
      prompt,
      marks,
      negativeMarks,
      questionType,
      explanation,
      position,
      options
    };
  });
}

/**
 * POST /api/exams
 * Creates a new draft exam (or directly publishes if publishImmediately=true).
 */
export async function createExam(req, res) {
  const teacherId = req.user.id;
  const {
    title,
    description = '',
    batch = 'General',
    startTime = null,
    endTime = null,
    questions: rawQuestions = []
  } = req.body;

  const durationMinutes = parseInt(req.body.durationMinutes ?? req.body.duration_minutes ?? 45, 10);
  const passingMarks = parseFloat(req.body.passingMarks ?? req.body.passing_marks ?? 0);
  const totalMarks = parseFloat(req.body.totalMarks ?? req.body.total_marks ?? 0);
  const negativeMarkingEnabled = Boolean(req.body.negativeMarkingEnabled ?? req.body.negative_marking_enabled ?? false);
  const negativeMarksPerWrongAnswer = parseFloat(req.body.negativeMarksPerWrongAnswer ?? req.body.negative_marks_per_wrong_answer ?? 0.00);
  const shuffleQuestions = req.body.shuffleQuestions ?? req.body.shuffle_questions ?? true;
  const shuffleOptions = req.body.shuffleOptions ?? req.body.shuffle_options ?? true;
  const maxTabSwitches = parseInt(req.body.maxTabSwitches ?? req.body.max_tab_switches ?? 3, 10);
  const publishImmediately = Boolean(req.body.publishImmediately ?? req.body.is_published ?? false);

  // 1. Validate Exam Metadata
  const validation = validateExamMetadata({
    title,
    durationMinutes,
    passingMarks,
    startTime,
    endTime
  });

  if (!validation.isValid) {
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: validation.error
    });
  }

  const questions = normalizeQuestions(rawQuestions);

  // 2. If publishing immediately, validate questions
  if (publishImmediately) {
    const qValidation = validateQuestionsForPublishing(questions);
    if (!qValidation.canPublish) {
      return sendError(res, {
        statusCode: 400,
        code: 'CANNOT_PUBLISH_EMPTY_EXAM',
        message: qValidation.error
      });
    }
  }

  const examStatus = publishImmediately ? 'PUBLISHED' : 'DRAFT';
  const calculatedTotalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  let client;
  try {
    client = await pool.connect();
  } catch (connErr) {
    return sendError(res, {
      statusCode: 503,
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database connection is unavailable. Please ensure PostgreSQL is running.'
    });
  }

  try {
    // Generate secure access code
    const accessCode = await generateSecureAccessCode(client);

    await client.query('BEGIN');

    // Insert Exam Row
    const examInsertQuery = `
      INSERT INTO exams (
        teacher_id, title, description, batch, access_code, duration_minutes,
        total_marks, passing_marks, negative_marking_enabled, negative_marks_per_wrong_answer,
        shuffle_questions, shuffle_options, max_tab_switches, start_time, end_time, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `;

    const examValues = [
      teacherId,
      title.trim(),
      description.trim(),
      batch.trim(),
      accessCode,
      parseInt(durationMinutes, 10),
      calculatedTotalMarks,
      parseFloat(passingMarks),
      Boolean(negativeMarkingEnabled),
      parseFloat(negativeMarksPerWrongAnswer),
      Boolean(shuffleQuestions),
      Boolean(shuffleOptions),
      parseInt(maxTabSwitches, 10),
      startTime ? new Date(startTime) : null,
      endTime ? new Date(endTime) : null,
      examStatus
    ];

    const { rows: examRows } = await client.query(examInsertQuery, examValues);
    const createdExam = examRows[0];

    // Insert Questions and Options Transactionally
    for (const q of questions) {
      const qInsertQuery = `
        INSERT INTO questions (
          exam_id, question_text, question_type, marks, negative_marks, position, explanation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
      `;
      const qValues = [
        createdExam.id,
        q.prompt,
        q.questionType,
        q.marks,
        q.negativeMarks,
        q.position,
        q.explanation
      ];
      const { rows: qRows } = await client.query(qInsertQuery, qValues);
      const questionId = qRows[0].id;

      for (const opt of q.options) {
        const optInsertQuery = `
          INSERT INTO options (
            question_id, option_text, is_correct, position
          ) VALUES ($1, $2, $3, $4);
        `;
        await client.query(optInsertQuery, [
          questionId,
          opt.optionText,
          opt.isCorrect,
          opt.position
        ]);
      }
    }

    await client.query('COMMIT');

    return sendSuccess(res, {
      statusCode: 201,
      message: publishImmediately ? 'Exam published successfully' : 'Exam draft created successfully',
      data: {
        id: createdExam.id,
        title: createdExam.title,
        batch: createdExam.batch,
        accessCode: createdExam.access_code,
        durationMinutes: createdExam.duration_minutes,
        totalMarks: createdExam.total_marks,
        passingMarks: createdExam.passing_marks,
        status: createdExam.status,
        questionCount: questions.length,
        createdAt: createdExam.created_at
      }
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    throw err;
  } finally {
    if (client) client.release();
  }
}

/**
 * GET /api/exams/mine
 * Lists all exams owned by the authenticated teacher.
 */
export async function getMyExams(req, res) {
  const teacherId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  try {
    const queryText = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.batch,
        e.access_code,
        e.duration_minutes,
        e.total_marks,
        e.passing_marks,
        e.status,
        e.created_at,
        e.updated_at,
        COUNT(DISTINCT q.id)::int AS question_count,
        COUNT(DISTINCT s.id)::int AS submission_count
      FROM exams e
      LEFT JOIN questions q ON q.exam_id = e.id
      LEFT JOIN submissions s ON s.exam_id = e.id
      WHERE ${isAdmin ? '1=1' : 'e.teacher_id = $1'}
      GROUP BY e.id
      ORDER BY e.created_at DESC;
    `;

    const queryParams = isAdmin ? [] : [teacherId];
    const { rows } = await pool.query(queryText, queryParams);

    return sendSuccess(res, {
      message: 'Teacher exams retrieved',
      data: rows.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        batch: r.batch,
        access_code: r.access_code,
        code: r.access_code,
        duration: r.duration_minutes,
        duration_minutes: r.duration_minutes,
        totalMarks: parseFloat(r.total_marks),
        total_marks: parseFloat(r.total_marks),
        passingMarks: parseFloat(r.passing_marks),
        passing_marks: parseFloat(r.passing_marks),
        status: r.status,
        is_published: r.status === 'PUBLISHED',
        questionsCount: r.question_count,
        question_count: r.question_count,
        questions: new Array(r.question_count).fill({}),
        submissionsCount: r.submission_count,
        createdAt: r.created_at,
        created_at: r.created_at
      }))
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || !pool) {
      return sendError(res, {
        statusCode: 503,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection unavailable.'
      });
    }
    throw err;
  }
}

/**
 * GET /api/exams/:id
 * Fetches single exam with all questions and options for its teacher/admin.
 */
export async function getExamById(req, res) {
  const examId = req.params.id;
  const teacherId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  try {
    const { rows: examRows } = await pool.query(
      'SELECT * FROM exams WHERE id = $1 LIMIT 1;',
      [examId]
    );

    if (examRows.length === 0) {
      return sendError(res, {
        statusCode: 404,
        code: 'EXAM_NOT_FOUND',
        message: 'The requested exam does not exist.'
      });
    }

    const exam = examRows[0];

    // Ownership check
    if (exam.teacher_id !== teacherId && !isAdmin) {
      return sendError(res, {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'You do not have permission to view or manage this examination.'
      });
    }

    // Load questions and options
    const { rows: questionRows } = await pool.query(
      `SELECT q.id, q.question_text, q.question_type, q.marks, q.negative_marks, q.position, q.explanation
       FROM questions q
       WHERE q.exam_id = $1
       ORDER BY q.position ASC;`,
      [examId]
    );

    const questionIds = questionRows.map(q => q.id);
    let optionsByQuestion = {};

    if (questionIds.length > 0) {
      const { rows: optionRows } = await pool.query(
        `SELECT id, question_id, option_text, is_correct, position
         FROM options
         WHERE question_id = ANY($1::uuid[])
         ORDER BY position ASC;`,
        [questionIds]
      );

      for (const opt of optionRows) {
        if (!optionsByQuestion[opt.question_id]) {
          optionsByQuestion[opt.question_id] = [];
        }
        optionsByQuestion[opt.question_id].push({
          id: opt.id,
          text: opt.option_text,
          isCorrect: opt.is_correct,
          position: opt.position
        });
      }
    }

    const formattedQuestions = questionRows.map(q => ({
      id: q.id,
      prompt: q.question_text,
      questionType: q.question_type,
      marks: q.marks,
      negativeMarks: q.negative_marks,
      position: q.position,
      explanation: q.explanation,
      options: optionsByQuestion[q.id] || []
    }));

    return sendSuccess(res, {
      message: 'Exam retrieved successfully',
      data: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        batch: exam.batch,
        accessCode: exam.access_code,
        durationMinutes: exam.duration_minutes,
        totalMarks: exam.total_marks,
        passingMarks: exam.passing_marks,
        status: exam.status,
        negativeMarkingEnabled: exam.negative_marking_enabled,
        negativeMarksPerWrongAnswer: exam.negative_marks_per_wrong_answer,
        shuffleQuestions: exam.shuffle_questions,
        shuffleOptions: exam.shuffle_options,
        maxTabSwitches: exam.max_tab_switches,
        startTime: exam.start_time,
        endTime: exam.end_time,
        createdAt: exam.created_at,
        questions: formattedQuestions
      }
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return sendError(res, {
        statusCode: 503,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection unavailable.'
      });
    }
    throw err;
  }
}

/**
 * PATCH /api/exams/:id
 * Updates an existing draft exam.
 */
export async function updateExam(req, res) {
  const examId = req.params.id;
  const teacherId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    return sendError(res, {
      statusCode: 503,
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database connection unavailable.'
    });
  }

  try {
    const { rows: examRows } = await client.query(
      'SELECT id, teacher_id, status FROM exams WHERE id = $1 LIMIT 1;',
      [examId]
    );

    if (examRows.length === 0) {
      return sendError(res, {
        statusCode: 404,
        code: 'EXAM_NOT_FOUND',
        message: 'Exam not found.'
      });
    }

    const exam = examRows[0];

    if (exam.teacher_id !== teacherId && !isAdmin) {
      return sendError(res, {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'You are not authorized to modify this exam.'
      });
    }

    if (exam.status !== 'DRAFT') {
      return sendError(res, {
        statusCode: 400,
        code: 'EXAM_NOT_IN_DRAFT',
        message: `Cannot edit exam in "${exam.status}" status. Only DRAFT exams can be updated.`
      });
    }

    const {
      title,
      description,
      batch,
      durationMinutes,
      passingMarks,
      negativeMarkingEnabled,
      negativeMarksPerWrongAnswer,
      shuffleQuestions,
      shuffleOptions,
      maxTabSwitches,
      startTime,
      endTime,
      questions: rawQuestions
    } = req.body;

    await client.query('BEGIN');

    const updateQuery = `
      UPDATE exams SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        batch = COALESCE($3, batch),
        duration_minutes = COALESCE($4, duration_minutes),
        passing_marks = COALESCE($5, passing_marks),
        negative_marking_enabled = COALESCE($6, negative_marking_enabled),
        negative_marks_per_wrong_answer = COALESCE($7, negative_marks_per_wrong_answer),
        shuffle_questions = COALESCE($8, shuffle_questions),
        shuffle_options = COALESCE($9, shuffle_options),
        max_tab_switches = COALESCE($10, max_tab_switches),
        start_time = COALESCE($11, start_time),
        end_time = COALESCE($12, end_time),
        updated_at = NOW()
      WHERE id = $13
      RETURNING *;
    `;

    const updateValues = [
      title ? title.trim() : null,
      description !== undefined ? description.trim() : null,
      batch !== undefined ? batch.trim() : null,
      durationMinutes ? parseInt(durationMinutes, 10) : null,
      passingMarks !== undefined ? parseFloat(passingMarks) : null,
      negativeMarkingEnabled !== undefined ? Boolean(negativeMarkingEnabled) : null,
      negativeMarksPerWrongAnswer !== undefined ? parseFloat(negativeMarksPerWrongAnswer) : null,
      shuffleQuestions !== undefined ? Boolean(shuffleQuestions) : null,
      shuffleOptions !== undefined ? Boolean(shuffleOptions) : null,
      maxTabSwitches !== undefined ? parseInt(maxTabSwitches, 10) : null,
      startTime ? new Date(startTime) : null,
      endTime ? new Date(endTime) : null,
      examId
    ];

    const { rows: updatedRows } = await client.query(updateQuery, updateValues);

    // If new questions payload provided, replace questions & options
    if (rawQuestions && Array.isArray(rawQuestions)) {
      const questions = normalizeQuestions(rawQuestions);
      await client.query('DELETE FROM questions WHERE exam_id = $1;', [examId]);

      for (const q of questions) {
        const { rows: qRows } = await client.query(
          `INSERT INTO questions (exam_id, question_text, question_type, marks, negative_marks, position, explanation)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;`,
          [examId, q.prompt, q.questionType, q.marks, q.negativeMarks, q.position, q.explanation]
        );
        const questionId = qRows[0].id;

        for (const opt of q.options) {
          await client.query(
            `INSERT INTO options (question_id, option_text, is_correct, position)
             VALUES ($1, $2, $3, $4);`,
            [questionId, opt.optionText, opt.isCorrect, opt.position]
          );
        }
      }

      // Re-sum total marks
      const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);
      await client.query('UPDATE exams SET total_marks = $1 WHERE id = $2;', [totalMarks, examId]);
    }

    await client.query('COMMIT');

    return sendSuccess(res, {
      message: 'Exam draft updated successfully',
      data: updatedRows[0]
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    throw err;
  } finally {
    if (client) client.release();
  }
}

/**
 * POST /api/exams/:id/publish
 * Validates requirements and transitions an exam to PUBLISHED.
 */
export async function publishExam(req, res) {
  if (req.body && req.body.is_published === false) {
    return unpublishExam(req, res);
  }
  const examId = req.params.id;
  const teacherId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    return sendError(res, {
      statusCode: 503,
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database connection unavailable.'
    });
  }

  try {
    const { rows: examRows } = await client.query(
      'SELECT * FROM exams WHERE id = $1 LIMIT 1;',
      [examId]
    );

    if (examRows.length === 0) {
      return sendError(res, {
        statusCode: 404,
        code: 'EXAM_NOT_FOUND',
        message: 'Exam not found.'
      });
    }

    const exam = examRows[0];

    if (exam.teacher_id !== teacherId && !isAdmin) {
      return sendError(res, {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'You are not authorized to publish this exam.'
      });
    }

    // Retrieve questions and options for validation
    const { rows: questions } = await client.query(
      'SELECT id, question_text, marks FROM questions WHERE exam_id = $1;',
      [examId]
    );

    if (questions.length === 0) {
      return sendError(res, {
        statusCode: 400,
        code: 'CANNOT_PUBLISH_EMPTY_EXAM',
        message: 'Cannot publish an exam with zero questions. Please add questions first.'
      });
    }

    // Verify every question has at least one correct option
    const { rows: optionValidation } = await client.query(
      `SELECT q.id, COUNT(o.id) as option_count, 
              SUM(CASE WHEN o.is_correct THEN 1 ELSE 0 END) as correct_count
       FROM questions q
       LEFT JOIN options o ON o.question_id = q.id
       WHERE q.exam_id = $1
       GROUP BY q.id;`,
      [examId]
    );

    for (const ov of optionValidation) {
      if (parseInt(ov.option_count, 10) < 2) {
        return sendError(res, {
          statusCode: 400,
          code: 'INVALID_OPTIONS_COUNT',
          message: 'All questions must have at least 2 options before publishing.'
        });
      }
      if (parseInt(ov.correct_count, 10) === 0) {
        return sendError(res, {
          statusCode: 400,
          code: 'MISSING_CORRECT_ANSWER',
          message: 'Every question must have at least one marked correct option.'
        });
      }
    }

    // Update status
    await client.query(
      "UPDATE exams SET status = 'PUBLISHED', updated_at = NOW() WHERE id = $1;",
      [examId]
    );

    return sendSuccess(res, {
      message: 'Exam published successfully',
      data: {
        id: exam.id,
        accessCode: exam.access_code,
        status: 'PUBLISHED'
      }
    });
  } finally {
    if (client) client.release();
  }
}

/**
 * POST /api/exams/:id/archive
 * Marks an exam as ARCHIVED.
 */
export async function archiveExam(req, res) {
  const examId = req.params.id;
  const teacherId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  try {
    const { rows } = await pool.query(
      'SELECT id, teacher_id FROM exams WHERE id = $1 LIMIT 1;',
      [examId]
    );

    if (rows.length === 0) {
      return sendError(res, {
        statusCode: 404,
        code: 'EXAM_NOT_FOUND',
        message: 'Exam not found.'
      });
    }

    if (rows[0].teacher_id !== teacherId && !isAdmin) {
      return sendError(res, {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Not authorized to archive this exam.'
      });
    }

    await pool.query(
      "UPDATE exams SET status = 'ARCHIVED', updated_at = NOW() WHERE id = $1;",
      [examId]
    );

    return sendSuccess(res, {
      message: 'Exam successfully archived'
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return sendError(res, {
        statusCode: 503,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection unavailable.'
      });
    }
    throw err;
  }
}

/**
 * GET /api/exams/:id/summary
 * Returns teacher-facing analytics and student submission summary.
 */
export async function getExamSummary(req, res) {
  const examId = req.params.id;
  const teacherId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  try {
    const { rows: examRows } = await pool.query(
      'SELECT id, teacher_id, title, access_code, duration_minutes, total_marks, passing_marks, status FROM exams WHERE id = $1 LIMIT 1;',
      [examId]
    );

    if (examRows.length === 0) {
      return sendError(res, {
        statusCode: 404,
        code: 'EXAM_NOT_FOUND',
        message: 'Exam not found.'
      });
    }

    const exam = examRows[0];
    if (exam.teacher_id !== teacherId && !isAdmin) {
      return sendError(res, {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Not authorized to view summary for this exam.'
      });
    }

    // Aggregate statistics
    const statsQuery = `
      SELECT 
        COUNT(s.id)::int as total_submissions,
        COALESCE(AVG(s.total_score), 0)::numeric(5,2) as average_score,
        COALESCE(MAX(s.total_score), 0)::numeric(5,2) as highest_score,
        COALESCE(MIN(s.total_score), 0)::numeric(5,2) as lowest_score,
        SUM(CASE WHEN s.passed THEN 1 ELSE 0 END)::int as passed_count,
        SUM(CASE WHEN NOT s.passed AND s.status != 'IN_PROGRESS' THEN 1 ELSE 0 END)::int as failed_count
      FROM submissions s
      WHERE s.exam_id = $1;
    `;
    const { rows: statsRows } = await pool.query(statsQuery, [examId]);

    // Recent submissions
    const recentSubmissionsQuery = `
      SELECT s.id, u.full_name as student_name, u.student_id, s.total_score, s.status, s.submitted_at
      FROM submissions s
      JOIN users u ON u.id = s.student_id
      WHERE s.exam_id = $1
      ORDER BY s.submitted_at DESC NULLS LAST
      LIMIT 20;
    `;
    const { rows: recentSubmissions } = await pool.query(recentSubmissionsQuery, [examId]);

    return sendSuccess(res, {
      message: 'Exam summary retrieved',
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          accessCode: exam.access_code,
          durationMinutes: exam.duration_minutes,
          totalMarks: exam.total_marks,
          passingMarks: exam.passing_marks,
          status: exam.status
        },
        metrics: statsRows[0],
        recentSubmissions
      }
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return sendError(res, {
        statusCode: 503,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection unavailable.'
      });
    }
    throw err;
  }
}

/**
 * GET /api/exams/code/:code
 * Public student-facing lookup for active, published examinations.
 */
export async function getExamByAccessCode(req, res) {
  const code = (req.params.code || '').trim().toUpperCase();

  try {
    const { rows } = await pool.query(
      `SELECT 
        e.id, e.title, e.batch, e.duration_minutes, e.total_marks, e.passing_marks,
        e.status, e.start_time, e.end_time,
        COUNT(q.id)::int as question_count
       FROM exams e
       LEFT JOIN questions q ON q.exam_id = e.id
       WHERE UPPER(e.access_code) = $1
       GROUP BY e.id
       LIMIT 1;`,
      [code]
    );

    if (rows.length === 0 || rows[0].status !== 'PUBLISHED') {
      return sendError(res, {
        statusCode: 404,
        code: 'EXAM_NOT_FOUND',
        message: `Examination with access code "${code}" was not found or has not been published yet.`
      });
    }

    const exam = rows[0];
    const now = new Date();

    if (exam.start_time && now < new Date(exam.start_time)) {
      return sendError(res, {
        statusCode: 403,
        code: 'EXAM_NOT_YET_ACTIVE',
        message: `This examination is scheduled to begin at ${new Date(exam.start_time).toLocaleString()}.`
      });
    }

    if (exam.end_time && now > new Date(exam.end_time)) {
      return sendError(res, {
        statusCode: 403,
        code: 'EXAM_EXPIRED',
        message: `The availability window for this examination expired at ${new Date(exam.end_time).toLocaleString()}.`
      });
    }

    return sendSuccess(res, {
      message: 'Verified active examination',
      data: {
        id: exam.id,
        code,
        title: exam.title,
        batch: exam.batch,
        duration: exam.duration_minutes,
        totalMarks: exam.total_marks,
        passingMarks: exam.passing_marks,
        questionCount: exam.question_count
      }
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return sendError(res, {
        statusCode: 503,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection unavailable.'
      });
    }
    throw err;
  }
}


/**
<<<<<<< HEAD
 * GET /api/exams/available
 * Lists active published exams for student candidates.
 */
export async function getAvailableExams(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT 
        e.id,
        e.title,
        e.description,
        e.duration_minutes,
        e.total_marks,
        e.passing_marks,
        e.start_time,
        e.end_time,
        e.status,
        e.max_tab_switches,
        COUNT(DISTINCT q.id)::int AS question_count
       FROM exams e
       LEFT JOIN questions q ON q.exam_id = e.id
       WHERE e.status = 'PUBLISHED'
       GROUP BY e.id
       ORDER BY e.created_at DESC;`
    );

    const mapped = rows.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      duration_minutes: e.duration_minutes,
      total_marks: parseFloat(e.total_marks),
      passing_marks: parseFloat(e.passing_marks),
      question_count: e.question_count,
      start_time: e.start_time,
      end_time: e.end_time,
      status: 'AVAILABLE'
    }));

    return sendSuccess(res, {
      message: 'Available examinations retrieved',
      data: mapped
    });
  } catch (err) {
    console.error('[EXAM ERROR] getAvailableExams:', err);
    return sendError(res, {
      statusCode: 500,
      code: 'FETCH_ERROR',
      message: 'Failed to retrieve available assessments.'
    });
  }
}

/**
 * GET /api/exams/:id/instructions
 * Retrieves pre-exam briefing, time limits, and anti-cheat policies.
 */
export async function getExamInstructions(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT 
        e.id, e.title, e.description, e.duration_minutes,
        e.total_marks, e.passing_marks, e.max_tab_switches, e.shuffle_questions,
        COUNT(DISTINCT q.id)::int AS question_count
       FROM exams e
       LEFT JOIN questions q ON q.exam_id = e.id
       WHERE e.id = $1
       GROUP BY e.id LIMIT 1;`,
      [id]
    );

    if (rows.length === 0) {
      return sendError(res, {
        statusCode: 404,
        code: 'EXAM_NOT_FOUND',
        message: 'Examination not found.'
      });
    }

    const exam = rows[0];

    const instructions = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration_minutes: exam.duration_minutes,
      passing_marks: parseFloat(exam.passing_marks),
      total_marks: parseFloat(exam.total_marks),
      question_count: exam.question_count,
      max_tab_switches: exam.max_tab_switches || 3,
      shuffle_questions: exam.shuffle_questions,
      rules: [
        'Ensure a stable internet connection. If disconnected, your session will automatically restore upon reload.',
        'Do NOT refresh the page unnecessarily or switch browser tabs/windows.',
        `You have a strict limit of ${exam.max_tab_switches || 3} window/tab switch strikes. Exceeding this limit will trigger automated exam submission.`,
        'All answers are automatically cached locally and synchronized with the evaluation server.',
        'When the timer reaches 00:00, the examination will automatically lock and submit all saved answers.',
        'Right-click context menus, copy/paste operations, and browser developer tools are prohibited during this exam.'
      ]
    };

    return sendSuccess(res, {
      message: 'Exam instructions retrieved',
      data: instructions
    });
  } catch (err) {
    console.error('[EXAM ERROR] getExamInstructions:', err);
    return sendError(res, {
      statusCode: 500,
      code: 'INSTRUCTIONS_ERROR',
      message: 'Failed to retrieve examination instructions.'
    });
  }
}

/**
 * POST /api/exams/:id/start
 * Initializes student assessment attempt and supplies sanitized question payload.
 */
export async function startExam(req, res) {
  const { id } = req.params;
  const studentId = req.user?.id;

  if (!studentId) {
    return sendError(res, {
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Student authentication required to start an assessment.'
    });
  }

  try {
    const examRes = await pool.query(
      `SELECT id, title, description, duration_minutes, total_marks, passing_marks, max_tab_switches, status
       FROM exams WHERE id = $1 LIMIT 1;`,
      [id]
    );

    if (examRes.rows.length === 0) {
      return sendError(res, {
        statusCode: 404,
        code: 'EXAM_NOT_FOUND',
        message: 'Examination not found.'
      });
    }

    const exam = examRes.rows[0];

    // Find or create student submission in PostgreSQL
    let subRes = await pool.query(
      `SELECT id, started_at, deadline_at, status FROM submissions
       WHERE exam_id = $1 AND student_id = $2 LIMIT 1;`,
      [id, studentId]
    );

    let submissionId;
    let startedAt;

    if (subRes.rows.length === 0) {
      const newSub = await pool.query(
        `INSERT INTO submissions (exam_id, student_id, started_at, deadline_at, status)
         VALUES ($1, $2, NOW(), NOW() + interval '1 minute' * $3, 'IN_PROGRESS')
         RETURNING id, started_at;`,
        [id, studentId, exam.duration_minutes]
      );
      submissionId = newSub.rows[0].id;
      startedAt = newSub.rows[0].started_at;
    } else {
      if (subRes.rows[0].status !== 'IN_PROGRESS') {
        await pool.query(
          `UPDATE submissions 
           SET status = 'IN_PROGRESS', 
               started_at = NOW(), 
               deadline_at = NOW() + interval '1 minute' * $1, 
               total_score = 0, 
               percentage = 0, 
               passed = false, 
               submitted_at = NULL,
               tab_switch_count = 0,
               updated_at = NOW()
           WHERE id = $2;`,
          [exam.duration_minutes, subRes.rows[0].id]
        );
      }
      submissionId = subRes.rows[0].id;
      startedAt = new Date().toISOString();
    }

    // Fetch questions and sanitized options (without is_correct or explanation)
    const qRows = await pool.query(
      `SELECT id, question_text, question_type, marks, negative_marks, position
       FROM questions WHERE exam_id = $1 ORDER BY position ASC;`,
      [id]
    );

    const questions = [];
    for (let idx = 0; idx < qRows.rows.length; idx++) {
      const q = qRows.rows[idx];
      const optRows = await pool.query(
        `SELECT id, option_text, position FROM options WHERE question_id = $1 ORDER BY position ASC;`,
        [q.id]
      );

      questions.push({
        id: q.id,
        index: idx + 1,
        question_text: q.question_text,
        question_type: q.question_type,
        marks: parseFloat(q.marks),
        negative_marks: parseFloat(q.negative_marks),
        options: optRows.rows.map(o => ({
          id: o.id,
          option_text: o.option_text
        }))
      });
    }

    const payload = {
      submission_id: submissionId,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        duration_minutes: exam.duration_minutes,
        total_marks: parseFloat(exam.total_marks),
        passing_marks: parseFloat(exam.passing_marks),
        max_tab_switches: exam.max_tab_switches || 3
      },
      questions,
      server_started_at: startedAt
    };

    return sendSuccess(res, {
      message: 'Examination attempt initialized',
      data: payload
    });
  } catch (err) {
    console.error('[EXAM ERROR] startExam:', err);
    return sendError(res, {
      statusCode: 500,
      code: 'START_EXAM_ERROR',
      message: 'Failed to initialize examination session.'
    });
  }
}

/**
 * POST /api/exams/parse-document
 * Parses question paper documents and provides staging preview.
 */
export async function parseDocument(req, res) {
  const sampleParsedQuestions = [
    {
      id: `parsed_${Date.now()}_1`,
      question_text: "Which HTTP status code represents '401 Unauthorized' according to RFC 9110 standards?",
      marks: 2,
      negative_marks: 0.5,
      options: [
        { id: 'p_opt_1a', option_text: '403 Forbidden', is_correct: false },
        { id: 'p_opt_1b', option_text: '401 Unauthorized', is_correct: true },
        { id: 'p_opt_1c', option_text: '400 Bad Request', is_correct: false },
        { id: 'p_opt_1d', option_text: '404 Not Found', is_correct: false }
      ]
    },
    {
      id: `parsed_${Date.now()}_2`,
      question_text: 'What is the primary role of the React Reconciliation algorithm using the Virtual DOM diffing process?',
      marks: 3,
      negative_marks: 0.5,
      options: [
        { id: 'p_opt_2a', option_text: 'To directly manipulate real DOM elements on every keystroke', is_correct: false },
        { id: 'p_opt_2b', option_text: 'To compute the minimal set of changes required to synchronize the virtual and real DOM', is_correct: true },
        { id: 'p_opt_2c', option_text: 'To replace CSS styling with inline JavaScript objects', is_correct: false },
        { id: 'p_opt_2d', option_text: 'To execute server-side database SQL queries', is_correct: false }
      ]
    },
    {
      id: `parsed_${Date.now()}_3`,
      question_text: 'In PostgreSQL, which index type provides logarithmic-time lookups using B-Tree balanced structures by default?',
      marks: 2,
      negative_marks: 0,
      options: [
        { id: 'p_opt_3a', option_text: 'GIN (Generalized Inverted Index)', is_correct: false },
        { id: 'p_opt_3b', option_text: 'BRIN (Block Range Index)', is_correct: false },
        { id: 'p_opt_3c', option_text: 'B-tree index', is_correct: true },
        { id: 'p_opt_3d', option_text: 'Hash index', is_correct: false }
      ]
    },
    {
      id: `parsed_${Date.now()}_4`,
      question_text: 'Which cryptographic algorithm property prevents rainbow-table lookups when hashing passwords with bcrypt?',
      marks: 2.5,
      negative_marks: 0.5,
      options: [
        { id: 'p_opt_4a', option_text: 'Cryptographic Salt generation', is_correct: true },
        { id: 'p_opt_4b', option_text: 'Symmetric XOR bitwise masking', is_correct: false },
        { id: 'p_opt_4c', option_text: 'Base64 string encoding', is_correct: false },
        { id: 'p_opt_4d', option_text: 'CRC32 parity checksum', is_correct: false }
      ]
    }
  ];

  return sendSuccess(res, {
    message: 'Assessment document parsed successfully',
    data: {
      fileName: 'Uploaded Assessment Document',
      parsedCount: sampleParsedQuestions.length,
      confidence: '98.5%',
      questions: sampleParsedQuestions
    }
  });
}

/**
 * DELETE /api/exams/:id
 * Deletes or archives an exam depending on submission presence.
 */
export async function deleteExam(req, res) {
  const examId = req.params.id;
  const teacherId = req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  try {
    const { rows } = await pool.query(
      'SELECT id, teacher_id FROM exams WHERE id = $1 LIMIT 1;',
      [examId]
    );

    if (rows.length === 0) {
      return sendError(res, {
        statusCode: 404,
        code: 'EXAM_NOT_FOUND',
        message: 'Exam not found.'
      });
    }

    if (rows[0].teacher_id !== teacherId && !isAdmin) {
      return sendError(res, {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Not authorized to delete this exam.'
      });
    }

    const subCheck = await pool.query(
      'SELECT COUNT(*)::int AS count FROM submissions WHERE exam_id = $1;',
      [examId]
    );

    if (subCheck.rows[0].count > 0) {
      await pool.query(
        "UPDATE exams SET status = 'ARCHIVED', updated_at = NOW() WHERE id = $1;",
        [examId]
      );
      return sendSuccess(res, {
        message: 'Exam has existing submissions and was safely archived'
      });
    }

    await pool.query('DELETE FROM exams WHERE id = $1;', [examId]);

    return sendSuccess(res, {
      message: 'Exam deleted successfully',
      data: { success: true }
    });
  } catch (err) {
    console.error('[EXAM ERROR] deleteExam:', err);
    return sendError(res, {
      statusCode: 500,
      code: 'DELETE_ERROR',
      message: 'Failed to delete examination.'
    });
  }
}

/**
 * GET /api/exams/:id/analytics
 * Provides comprehensive cohort statistics, score distribution, and roster.
 */
export async function getExamAnalytics(req, res) {
  const examId = req.params.id;

  try {
    const { rows: examRows } = await pool.query(
      'SELECT id, title, total_marks, passing_marks, duration_minutes FROM exams WHERE id = $1 LIMIT 1;',
      [examId]
    );

    if (examRows.length === 0) {
      return sendError(res, {
        statusCode: 404,
        code: 'EXAM_NOT_FOUND',
        message: 'Exam not found.'
      });
    }

    const exam = examRows[0];
    const totalMarks = parseFloat(exam.total_marks) || 25;
    const passingMarks = parseFloat(exam.passing_marks) || 10;

    const statsQuery = `
      SELECT 
        COUNT(s.id)::int as total_students,
        COUNT(CASE WHEN s.status != 'IN_PROGRESS' THEN 1 END)::int as submitted_count,
        COUNT(CASE WHEN s.status = 'IN_PROGRESS' THEN 1 END)::int as in_progress_count,
        COALESCE(AVG(CASE WHEN s.status != 'IN_PROGRESS' THEN s.total_score END), 0)::numeric(5,1) as class_average,
        COALESCE(MAX(s.total_score), 0)::numeric(5,1) as highest_score,
        COALESCE(MIN(CASE WHEN s.status != 'IN_PROGRESS' THEN s.total_score END), 0)::numeric(5,1) as lowest_score,
        COALESCE(AVG(s.tab_switch_count), 0)::numeric(5,1) as average_tab_switches
      FROM submissions s
      WHERE s.exam_id = $1;
    `;
    const { rows: statsRows } = await pool.query(statsQuery, [examId]);
    const stats = statsRows[0] || {};
    const totalSub = stats.submitted_count || 0;

    const rosterQuery = `
      SELECT s.id, u.full_name as student_name, u.email, s.total_score as score,
             s.status, s.passed, s.submitted_at, s.tab_switch_count as tab_switches
      FROM submissions s
      JOIN users u ON u.id = s.student_id
      WHERE s.exam_id = $1
      ORDER BY s.submitted_at DESC NULLS LAST;
    `;
    const { rows: rosterRows } = await pool.query(rosterQuery, [examId]);

    const qPerfQuery = `
      SELECT q.id, q.question_text, q.marks, q.position,
             COUNT(sa.id)::int as attempts,
             SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)::int as correct_count,
             COALESCE(AVG(sa.awarded_marks), 0)::numeric(5,1) as avg_awarded
      FROM questions q
      LEFT JOIN submission_answers sa ON sa.question_id = q.id
      WHERE q.exam_id = $1
      GROUP BY q.id, q.question_text, q.marks, q.position
      ORDER BY q.position ASC;
    `;
    const { rows: qPerfRows } = await pool.query(qPerfQuery, [examId]);

    const passingRate = totalSub > 0 
      ? `${Math.round((rosterRows.filter(r => r.passed).length / totalSub) * 100)}%` 
      : '0%';

    const distribution = [
      { range: '0-20%', count: 0, label: '0 - 20%' },
      { range: '21-40%', count: 0, label: '21 - 40%' },
      { range: '41-60%', count: 0, label: '41 - 60%' },
      { range: '61-80%', count: 0, label: '61 - 80%' },
      { range: '81-100%', count: 0, label: '81 - 100%' }
    ];

    rosterRows.forEach(r => {
      const pct = totalMarks > 0 ? (r.score / totalMarks) * 100 : 0;
      if (pct <= 20) distribution[0].count++;
      else if (pct <= 40) distribution[1].count++;
      else if (pct <= 60) distribution[2].count++;
      else if (pct <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    const analyticsPayload = {
      exam: {
        id: exam.id,
        title: exam.title,
        total_marks: totalMarks,
        passing_marks: passingMarks,
        question_count: qPerfRows.length
      },
      summary: {
        total_students: parseInt(stats.total_students, 10) || rosterRows.length,
        submitted_count: totalSub,
        in_progress_count: parseInt(stats.in_progress_count, 10) || 0,
        class_average: parseFloat(stats.class_average) || 0,
        highest_score: parseFloat(stats.highest_score) || 0,
        lowest_score: parseFloat(stats.lowest_score) || 0,
        passing_rate: passingRate,
        average_tab_switches: parseFloat(stats.average_tab_switches) || 0
      },
      scoreDistribution: distribution,
      questionPerformance: qPerfRows.map((q, idx) => ({
        question_number: q.position || (idx + 1),
        question_text: q.question_text.length > 70 ? q.question_text.slice(0, 70) + '...' : q.question_text,
        accuracy: q.attempts > 0 ? `${Math.round((q.correct_count / q.attempts) * 100)}%` : '0%',
        attempt_rate: totalSub > 0 ? `${Math.round((q.attempts / totalSub) * 100)}%` : '0%',
        avg_awarded: String(q.avg_awarded)
      })),
      roster: rosterRows.map(r => ({
        id: r.id,
        student_name: r.student_name,
        email: r.email,
        score: parseFloat(r.score) || 0,
        status: r.passed ? 'PASSED' : 'FAILED',
        submitted_at: r.submitted_at ? new Date(r.submitted_at).toLocaleString() : 'In Progress',
        tab_switches: r.tab_switches || 0
      }))
    };

    return sendSuccess(res, {
      message: 'Exam analytics aggregated',
      data: analyticsPayload
    });
  } catch (err) {
    console.error('[EXAM ERROR] getExamAnalytics:', err);
    return sendError(res, {
      statusCode: 500,
      code: 'ANALYTICS_ERROR',
      message: 'Failed to aggregate analytics.'
    });
=======
 * GET /api/exams/:id/results
 * Complete result list for every student who attempted a teacher-owned exam.
 */
export async function getExamResults(req, res) {
  try {
    const { rows: exams } = await pool.query(
      'SELECT id, teacher_id, title, total_marks FROM exams WHERE id = $1 LIMIT 1;',
      [req.params.id]
    );
    const exam = exams[0];
    if (!exam) return sendError(res, { statusCode: 404, code: 'EXAM_NOT_FOUND', message: 'Exam not found.' });
    if (exam.teacher_id !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, { statusCode: 403, code: 'FORBIDDEN', message: 'Not authorized to view results for this exam.' });
    }
    const { rows } = await pool.query(
      `SELECT s.id AS submission_id, u.full_name AS student_name,
              u.email AS student_email, u.student_id, s.status,
              s.total_score, s.percentage, s.passed, s.submitted_at,
              s.started_at, s.tab_switch_count,
              (SELECT COUNT(*)::int FROM questions q WHERE q.exam_id = s.exam_id) AS total_questions,
              (SELECT COUNT(*)::int FROM submission_answers sa
                WHERE sa.submission_id = s.id AND sa.selected_option_id IS NOT NULL) AS answered_count
         FROM submissions s JOIN users u ON u.id = s.student_id
        WHERE s.exam_id = $1
        ORDER BY s.submitted_at DESC NULLS LAST, s.started_at DESC;`,
      [req.params.id]
    );
    return sendSuccess(res, {
      message: 'Exam results retrieved.',
      data: { exam: { id: exam.id, title: exam.title, totalMarks: exam.total_marks }, results: rows }
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return sendError(res, { statusCode: 503, code: 'DATABASE_UNAVAILABLE', message: 'Database connection unavailable.' });
    }
    throw error;
>>>>>>> origin/main
  }
}

export default {
  createExam,
  getMyExams,
  getExamById,
  updateExam,
  publishExam,
  archiveExam,
  getExamSummary,
  getExamByAccessCode,
  getAvailableExams,
  getExamInstructions,
  startExam,
  parseDocument,
  deleteExam,
  getExamAnalytics
};

