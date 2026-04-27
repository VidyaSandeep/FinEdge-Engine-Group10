import express from 'express';
const router = express.Router();
import { register, login,profile } from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';


router.post('/', register);

router.post('/login', login);

router.get('/profile', authMiddleware, profile);

export default router;