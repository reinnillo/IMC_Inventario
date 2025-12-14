import express from 'express';
import { createClient, getClients, updateClient, updateClientStatus, deleteClient } from '../controllers/clientController.js';
import { authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Endpoint: /api/clientes
router.get('/clientes', getClients);
router.post('/clientes', createClient);
router.put('/clientes/:id', authorize(['admin', 'supervisor']), updateClient); 

// Endpoint para cambiar el estado de un cliente (solo para Admins y Supervisores)
router.patch('/clientes/:id/status', authorize(['admin', 'supervisor']), updateClientStatus);

// Endpoint para eliminar un cliente (solo para Admins y Supervisores)
router.delete('/clientes/:id', authorize(['admin', 'supervisor']), deleteClient);

export default router;