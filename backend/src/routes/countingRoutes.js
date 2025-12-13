// backend/src/routes/countingRoutes.js
import express from 'express';
import { syncBatchCounts, getCountingHistory } from '../controllers/countingController.js';

const router = express.Router();

// Endpoint: /api/conteos/sync
router.post('/conteos/sync', syncBatchCounts);

// Endpoint: /api/conteos/historial/:id
router.get('/conteos/historial/:id', getCountingHistory);

export default router;