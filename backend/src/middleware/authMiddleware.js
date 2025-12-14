// backend/src/middleware/authMiddleware.js

/**
 * Middleware para autorizar roles de usuario.
 * Espera que el rol del usuario que realiza la solicitud esté en `req.body.user_role`.
 *
 * @param {string[]} allowedRoles - Array de roles permitidos para acceder a la ruta.
 */
export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    const { user_role } = req.body;

    if (!user_role) {
      return res.status(401).json({ error: 'Acceso no autenticado. Rol de usuario no proporcionado.' });
    }

    if (!allowedRoles.includes(user_role)) {
      return res.status(403).json({ error: 'Acceso denegado. No tienes permiso para realizar esta acción.' });
    }

    next();
  };
};
