// backend/src/routes/guestRoutes.js
import express from 'express';
import { 
    getGuestDashboardData, 
    createGuestLink, 
    revokeGuestLink, 
    getActiveLink 
} from '../controllers/guestController.js';

const router = express.Router();

// Acceso Público (Dashboard)
router.get('/guest/access', getGuestDashboardData);

// Gestión Privada (Admin)
router.post('/guest/create-link', createGuestLink);
router.post('/guest/revoke-link', revokeGuestLink);
router.get('/guest/active-link', getActiveLink);

export default router;