// backend/src/controllers/authController.js
import supabase from '../config/supabaseClient.js';
import bcrypt from 'bcryptjs';
import { logAudit } from '../services/auditService.js';

export const loginUser = async (req, res) => {
  const { correo, password, user_id, user_name, user_role } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'Identificación incompleta.' });
  }

  try {
    // 1. Buscar al agente en la base de datos
    const { data: user, error } = await supabase
      .from('usuarios_imc')
      .select('*')
      .eq('correo', correo)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciales no encontradas en el sistema.' });
    }

    // 2. Verificar integridad de la contraseña (Hash)
    const validPassword = await bcrypt.compare(password, user.pass_hash);
    if (!validPassword) {

      // Auditoría de contraseña errónea
      await logAudit({
        action: 'LOGIN_FAILED', 
        module: 'AUTH',
        target_label: correo, 
        details: { reason: 'Invalid Password' }, 
        req
      });

      return res.status(401).json({ error: 'Llave de acceso inválida.' });
    }

    // 3. Acceso Concedido (El Frontend decidirá qué mostrar según user.role)
    const { pass_hash, ...safeUser } = user;

    // AUDITORÍA ÉXITO
    await logAudit({
      actor_id: user_id || null,
      actor_name: user_name || 'desconocido',
      actor_role: user_role || 'unknown',
      action: 'LOGIN_SUCCESS',
      module: 'AUTH',
      details: { reason: 'User Logged In Successfully' },
      req
    });
    
    return res.status(200).json({
      message: 'Enlace neuronal establecido.',
      user: safeUser
    });

  } catch (err) {
    console.error('Auth Error:', err);
    return res.status(500).json({ error: 'Fallo crítico en el módulo de autenticación.' });
  }
};

// PUT: Actualizar Perfil de Usuario
export const updateProfile = async (req, res) => {
  const { id, nombre, telefono, password, user_id, user_name, user_role, user_email } = req.body;

  if (!id) return res.status(400).json({ error: 'ID de usuario requerido.' });

  try {
    const updates = {
      nombre,
      telefono
    };

    if (password && password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        updates.pass_hash = await bcrypt.hash(password, salt);
    }

    const { data, error } = await supabase
      .from('usuarios_imc')
      .update(updates)
      .eq('id', id)
      .select('id, nombre, correo, role, cedula, telefono, fecha_registro, activo, user_type, cliente_id')
      .single();

    if (error) {
        console.error("❌ Error Supabase Update:", error); 
        throw error;
    }

    // Auditoría de actualización de perfil
    await logAudit ({
      actor_id: user_id || null,
      actor_name: user_name || 'desconocido',
      actor_role: user_role || 'unknown',
      action: 'PROFILE_UPDATE',
      module: 'PROFILE',
      details: { reason: 'User Profile Updated' },
      target_id: user_id,
      target_label: user_email,
      req
    });

    return res.json({ message: 'Perfil actualizado correctamente.', user: data });


  } catch (err) {
    console.error('Profile Update Error:', err.message);
    return res.status(500).json({ error: 'Error al actualizar perfil: ' + err.message });
  }
};