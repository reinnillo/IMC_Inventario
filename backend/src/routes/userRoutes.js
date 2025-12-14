// backend/src/routes/userRoutes.js
import express from 'express';
import { createUser, getUsers, updateUser, updateUserAssignments } from '../controllers/userController.js';

const router = express.Router();

// Rutas para Gestión de Usuarios
// Endpoint base: /api/usuarios_imc

router.get('/usuarios_imc', getUsers);        // Obtener lista
router.post('/usuarios_imc', createUser);     // Crear usuario
router.put('/usuarios_imc/assign-batch', updateUserAssignments); // Asignación en lote
router.put('/usuarios_imc/:id', updateUser);  // Actualizar datos generales de un usuario

export default router;