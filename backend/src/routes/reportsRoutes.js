// backend/src/routes/reportsRoutes.js
import express from 'express';
import { 
    getVariationsReport, 
    getUncountedCodesReport, 
    getUncountedLocationsReport, 
    getValuationReport 
} from '../controllers/reportsController.js';

const router = express.Router();

router.get('/reportes/variaciones', getVariationsReport);
router.get('/reportes/no-contados', getUncountedCodesReport);
router.get('/reportes/ubicaciones-pendientes', getUncountedLocationsReport);
router.get('/reportes/valoracion', getValuationReport);

export default router;