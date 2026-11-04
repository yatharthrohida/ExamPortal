import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../src/app.js';
import { pool, closePool } from '../src/config/database.js';

test('Full Frontend-to-Backend Connectivity Suite', async (t) => {
  const app = createApp();
  let server;
  let baseUrl;

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  t.after(async () => {
    // Keep database clean after test suite finishes
    try {
      await pool.query(
        'TRUNCATE TABLE submission_answers, integrity_events, submissions, options, questions, exam_uploads, exams, users CASCADE;'
      );
    } catch (e) {}
    await new Promise((resolve) => server.close(resolve));
    await closePool();
  });

  let teacherToken;
  let studentToken;
  let activeExamId;
  let activeQuestionId;
  let activeOptionId;
  let studentSubmissionId;

  // Setup: Register Teacher & Student
  await t.test('Setup: Register Teacher and Student accounts', async () => {
    const teacherReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Alan Vance',
        email: 'teacher@examportal.edu',
        password: 'Teacher@123',
        role: 'TEACHER'
      })
    });
    const teacherJson = await teacherReg.json();
    assert.equal(teacherReg.status, 201);
    teacherToken = teacherJson.data.token;

    const studentReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Elena Rostova',
        email: 'student@examportal.edu',
        studentId: 'CS-2026-001',
        password: 'Student@123',
        role: 'STUDENT'
      })
    });
    const studentJson = await studentReg.json();
    assert.equal(studentReg.status, 201);
    studentToken = studentJson.data.token;
  });

  // 1. Auth: Teacher Login
  await t.test('Auth: Teacher login returns token and user profile', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher@examportal.edu',
        password: 'Teacher@123',
        role: 'TEACHER'
      })
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.token);
    assert.equal(json.data.user.role, 'TEACHER');
  });

  // 2. Auth: Student Login (supports roll number)
  await t.test('Auth: Student login with Roll No returns token and student profile', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'CS-2026-001',
        password: 'Student@123'
      })
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.token);
    assert.equal(json.data.user.role, 'STUDENT');
    assert.equal(json.data.user.studentId, 'CS-2026-001');
  });

  // 3. Auth: Registration
  await t.test('Auth: Register new candidate user succeeds', async () => {
    const tempEmail = `newstudent_${Date.now()}@examportal.edu`;
    const tempId = `CS-${Date.now()}`;
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Lee',
        email: tempEmail,
        studentId: tempId,
        password: 'SecurePassword123!',
        role: 'STUDENT'
      })
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.token);
    assert.equal(json.data.user.email, tempEmail);
  });

  // 4. Setup Exam: Teacher creates and publishes exam
  await t.test('Teacher: Create and publish exam', async () => {
    const createRes = await fetch(`${baseUrl}/api/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        title: 'Distributed Systems & Consensus Algorithms',
        description: 'Comprehensive evaluation of Paxos, Raft, and Byzantine Fault Tolerance.',
        durationMinutes: 45,
        totalMarks: 20,
        passingMarks: 10,
        maxTabSwitches: 3,
        shuffleQuestions: true,
        shuffleOptions: true,
        questions: [
          {
            question_text: 'Which protocol utilizes randomized election timeouts to achieve leader consensus?',
            marks: 5,
            negative_marks: 1,
            options: [
              { option_text: 'Raft', is_correct: true },
              { option_text: 'Two-Phase Commit', is_correct: false },
              { option_text: 'Gossip Protocol', is_correct: false },
              { option_text: 'MapReduce', is_correct: false }
            ]
          }
        ]
      })
    });
    const createJson = await createRes.json();
    assert.equal(createRes.status, 201);
    activeExamId = createJson.data.id;

    // Publish exam
    const pubRes = await fetch(`${baseUrl}/api/exams/${activeExamId}/publish`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({ is_published: true })
    });
    const pubJson = await pubRes.json();
    assert.equal(pubRes.status, 200);
    assert.equal(pubJson.success, true);
  });

  // 5. Exams: Student Available Exams
  await t.test('Exams: GET /api/exams/available returns published assessments', async () => {
    const res = await fetch(`${baseUrl}/api/exams/available`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length > 0);
    assert.equal(json.data[0].id, activeExamId);
  });

  // 6. Exams: Teacher Exams
  await t.test('Exams: GET /api/exams/teacher returns teacher curriculum records', async () => {
    const res = await fetch(`${baseUrl}/api/exams/teacher`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.some((e) => e.is_published === true));
  });

  // 7. Exams: Instructions
  await t.test('Exams: GET /api/exams/:id/instructions returns briefing and rules', async () => {
    const res = await fetch(`${baseUrl}/api/exams/${activeExamId}/instructions`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.rules.length > 0);
    assert.equal(json.data.id, activeExamId);
  });

  // 8. Exams: Start Exam (Sanitized Questions)
  await t.test('Exams: POST /api/exams/:id/start creates session with sanitized questions', async () => {
    const res = await fetch(`${baseUrl}/api/exams/${activeExamId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      }
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.submission_id);
    studentSubmissionId = json.data.submission_id;
    assert.ok(Array.isArray(json.data.questions));

    activeQuestionId = json.data.questions[0].id;
    activeOptionId = json.data.questions[0].options[0].id;

    // Verify answers & explanations are strictly sanitized
    for (const q of json.data.questions) {
      assert.equal(q.is_correct, undefined);
      assert.equal(q.explanation, undefined);
      for (const opt of q.options) {
        assert.equal(opt.is_correct, undefined);
      }
    }
  });

  // 9. Submissions: Save Answer
  await t.test('Submissions: Autosave answer records response', async () => {
    const res = await fetch(`${baseUrl}/api/submissions/${studentSubmissionId}/save-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        question_id: activeQuestionId,
        selected_option_id: activeOptionId
      })
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.savedAt);
  });

  // 10. Submissions: Telemetry
  await t.test('Submissions: Proctoring telemetry event logs strike', async () => {
    const res = await fetch(`${baseUrl}/api/submissions/${studentSubmissionId}/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        event_type: 'TAB_SWITCH',
        details: { reason: 'User navigated away from examination window' },
        current_strikes: 1
      })
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.recorded, true);
  });

  // 11. Submissions: Submit Exam
  await t.test('Submissions: Final submit grades exam and returns score breakdown', async () => {
    const res = await fetch(`${baseUrl}/api/submissions/${studentSubmissionId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        answers: { [activeQuestionId]: activeOptionId },
        auto_submitted: false
      })
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.submission_id);
    assert.ok(['PASSED', 'FAILED'].includes(json.data.status));
    assert.ok(json.data.summary);
  });

  // 12. Submissions: Result Lookup
  await t.test('Submissions: Result endpoint retrieves completed evaluation', async () => {
    const res = await fetch(`${baseUrl}/api/submissions/${studentSubmissionId}/result`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.submission_id, studentSubmissionId);
  });

  // 13. Exams: Teacher Analytics
  await t.test('Exams: Teacher analytics returns cohort summary and roster', async () => {
    const res = await fetch(`${baseUrl}/api/exams/${activeExamId}/analytics`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.summary);
    assert.ok(Array.isArray(json.data.scoreDistribution));
    assert.ok(Array.isArray(json.data.roster));
  });
});
