import express from 'express';
import { getLiveCountingStats, getLiveVerificationStats } from '../controllers/supervisionController.js';

const router = express.Router();

router.get('/supervision/conteo', getLiveCountingStats);
router.get('/supervision/verificacion', getLiveVerificationStats);

export default router;