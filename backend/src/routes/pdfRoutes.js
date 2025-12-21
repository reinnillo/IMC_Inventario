// backend/src/routes/pdfRoutes.js
import express from 'express';
import { 
    generateVarianceReport, 
    generateUncountedReport, 
    generateLocationsReport, 
    generateValuationReport,
    generateProductosContadosPDF
} from '../controllers/pdfController.js';

const router = express.Router();

router.post('/pdf/varianza', generateVarianceReport);
router.post('/pdf/no-contados', generateUncountedReport);
router.post('/pdf/ubicaciones-pendientes', generateLocationsReport);
router.post('/pdf/valoracion', generateValuationReport);
router.post('/pdf/productos-contados', generateProductosContadosPDF);

export default router;