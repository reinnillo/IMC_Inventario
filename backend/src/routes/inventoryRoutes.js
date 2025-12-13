// backend/src/routes/inventoryRoutes.js
import express from 'express';
import { getClientInventory, bulkImportInventory, deleteClientInventory } from '../controllers/inventoryController.js';

const router = express.Router();

// Endpoint: /api/inventario
router.get('/inventario', getClientInventory);
router.post('/inventario/import', bulkImportInventory);
router.delete('/inventario', deleteClientInventory);

export default router;