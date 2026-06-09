import { Router } from 'express';
import passport from 'passport';
import { login, register, googleAuthRedirect, googleAuthCallback } from '../controllers/auth.controller.js';
import '../middleware/passport.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }), googleAuthRedirect);
router.get('/google/callback', passport.authenticate('google', { session: false }), googleAuthCallback);

export default router;
