// backend/src/routes/statsRoutes.js
import express from 'express';
import { 
    getCounterMetrics, 
    getVerifierMetrics, 
    getGlobalEmployeeStats 
} from '../controllers/statsController.js';

const router = express.Router();

router.get('/stats/contador/:userId', getCounterMetrics); // Ruta para métricas de contadores
router.get('/stats/verificador/:userId', getVerifierMetrics);  // Ruta para métricas de verificadores
router.get('/stats/global/:userId', getGlobalEmployeeStats); // Ruta para métricas globales de empleados

export default router;