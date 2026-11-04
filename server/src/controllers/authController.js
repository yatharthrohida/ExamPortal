import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { generateToken } from '../utils/token.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * POST /api/auth/login
 * Supports login via email OR student roll number / ID
 */
export async function login(req, res) {
  const identifier = req.body.identifier || req.body.email || req.body.studentId || req.body.rollNo;
  const { password } = req.body;

  if (!identifier || !password) {
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Roll No. / Student ID or Email and password are required.'
    });
  }

  const cleanIdentifier = String(identifier).trim();

  try {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, student_id, password_hash, role, is_active
       FROM users 
       WHERE (LOWER(email) = LOWER($1) OR LOWER(student_id) = LOWER($1) OR student_id = $1)
       LIMIT 1;`,
      [cleanIdentifier]
    );

    if (rows.length === 0) {
      return sendError(res, {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials. Please verify your Roll No. / Email and password.'
      });
    }

    const user = rows[0];

    if (!user.is_active) {
      return sendError(res, {
        statusCode: 403,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Your account has been deactivated. Please contact your administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return sendError(res, {
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials. Please verify your Roll No. / Email and password.'
      });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      name: user.full_name,
      role: user.role,
      studentId: user.student_id
    };

    const token = generateToken(tokenPayload);

    return sendSuccess(res, {
      message: 'Authentication successful',
      data: {
        token,
        user: tokenPayload
      }
    });
  } catch (dbErr) {
    console.error('[AUTH ERROR] login:', dbErr);
    return sendError(res, {
      statusCode: 500,
      code: 'AUTH_ERROR',
      message: 'Authentication service encountered an internal error.'
    });
  }
}

/**
 * POST /api/auth/register
 * Supports student roll number / ID requirement
 */
export async function register(req, res) {
  const displayName = req.body.name || req.body.fullName;
  const { email, password } = req.body;
  const studentId = req.body.studentId || req.body.rollNo;
  const role = (req.body.role || 'STUDENT').toUpperCase();

  if (!displayName || !email || !password) {
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Full name, email address, and password are required.'
    });
  }

  if (password.length < 6) {
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Password must be at least 6 characters long.'
    });
  }

  const cleanRole = ['STUDENT', 'TEACHER', 'ADMIN'].includes(role) ? role : 'STUDENT';
  const cleanEmail = email.trim().toLowerCase();
  const cleanStudentId = studentId ? String(studentId).trim() : null;

  // For students, require Roll No / ID
  if (cleanRole === 'STUDENT' && !cleanStudentId) {
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Roll No. / Student ID is required for student candidate registration.'
    });
  }

  try {
    // Check if email already exists
    const existingEmail = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;',
      [cleanEmail]
    );

    if (existingEmail.rows.length > 0) {
      return sendError(res, {
        statusCode: 409,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists.'
      });
    }

    // Check if roll number / student ID already exists
    if (cleanStudentId) {
      const existingStudentId = await pool.query(
        'SELECT id FROM users WHERE LOWER(student_id) = LOWER($1) LIMIT 1;',
        [cleanStudentId]
      );

      if (existingStudentId.rows.length > 0) {
        return sendError(res, {
          statusCode: 409,
          code: 'STUDENT_ID_EXISTS',
          message: 'An account with this Roll No. / Student ID already exists.'
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, student_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role, student_id, created_at;`,
      [displayName.trim(), cleanEmail, passwordHash, cleanRole, cleanStudentId]
    );

    const createdUser = rows[0];
    const userPayload = {
      id: createdUser.id,
      fullName: createdUser.full_name,
      name: createdUser.full_name,
      email: createdUser.email,
      role: createdUser.role,
      studentId: createdUser.student_id
    };

    const token = generateToken(userPayload);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data: {
        token,
        user: userPayload
      }
    });
  } catch (err) {
    console.error('[AUTH ERROR] register:', err);
    return sendError(res, {
      statusCode: 500,
      code: 'REGISTRATION_ERROR',
      message: 'Failed to complete user registration.'
    });
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  return sendSuccess(res, {
    message: 'Active profile retrieved',
    data: req.user
  });
}

export default {
  login,
  register,
  getMe
};
