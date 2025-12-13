// backend/src/routes/authRoutes.js
import express from 'express';
import { loginUser, updateProfile } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginUser);
router.put('/profile', updateProfile);

export default router;