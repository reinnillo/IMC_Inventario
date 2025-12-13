// backend/src/routes/verificationRoutes.js
import express from 'express';
import { getMarbeteData, saveVerification, getVerificationHistory } from '../controllers/verificationController.js';

const router = express.Router();

// Endpoint: Obtener datos cruzados
router.get('/verificacion/marbete', getMarbeteData);

// Endpoint: Guardar resultado final
router.post('/verificacion/sync', saveVerification);

// Endpoint: Obtener historial de verificaciones
router.get('/verificacion/historial/:id', getVerificationHistory);

export default router;