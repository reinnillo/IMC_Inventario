// backend/src/services/auditService.js
import supabase from '../config/supabaseClient.js';

/**
 * Registra un evento de control en la bitácora.
 * Diseño "Fire & Forget" protegido para no bloquear el flujo principal.
 */
export const logAudit = async ({
  actor_id = null,
  actor_name = 'Sistema',
  actor_role = 'system',
  action,
  module,
  target_id = null,
  target_label = null,
  details = {},
  req = null
}) => {
  try {
    // Intentamos extraer IP si viene el request
    let ip_address = 'unknown';
    if (req) {
      ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    }

    const payload = {
      actor_id,
      actor_name,
      actor_role,
      action: action.toUpperCase(),
      module: module.toUpperCase(),
      target_id: String(target_id),
      target_label,
      details,
      ip_address,
      created_at: new Date()
    };

    // Inserción asíncrona
    const { error } = await supabase.from('audit_log').insert(payload);

    if (error) {
      console.error('⚠️ Fallo al escribir Audit Log:', error.message);
    } else {
      console.log(`📝 Audit: [${module}] ${action}`);
    }

  } catch (err) {
    console.error('🔥 Error crítico en servicio de auditoría:', err.message);
    // No lanzamos el error hacia arriba para no detener la operación de negocio
  }
};