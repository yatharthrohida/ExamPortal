import { Router } from 'express';
import { login, register, getMe } from '../controllers/authController.js';
import { verifyAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', authRateLimiter, login);

// POST /api/auth/register
authRouter.post('/register', authRateLimiter, register);

// GET /api/auth/me
authRouter.get('/me', verifyAuth, getMe);

export default authRouter;
