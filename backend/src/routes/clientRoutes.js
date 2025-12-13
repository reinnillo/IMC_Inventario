import express from 'express';
import { createClient, getClients } from '../controllers/clientController.js';

const router = express.Router();

// Endpoint: /api/clientes
router.get('/clientes', getClients);
router.post('/clientes', createClient);

export default router;