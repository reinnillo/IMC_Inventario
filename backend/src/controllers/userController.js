import supabase from '../config/supabaseClient.js';
import bcrypt from 'bcryptjs';

// GET: Listar usuarios
export const getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios_imc')
      .select('id, nombre, correo, role, cedula, telefono, fecha_registro, activo, user_type, cliente_id, ultimo_acceso')
      .order('fecha_registro', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ 
      count: data?.length || 0, 
      users: data || [] 
    });

  } catch (err) {
    console.error('Error SDK (GET):', err.message);
    return res.status(500).json({ error: 'Error obteniendo usuarios del sistema.' });
  }
};

// POST: Crear usuario
export const createUser = async (req, res) => {
  const { nombre, correo, cedula, password, telefono, role, user_type, activo } = req.body;

  if (!nombre || !correo || !cedula || !password) {
    return res.status(400).json({ error: 'Protocolo incompleto.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const pass_hash = await bcrypt.hash(password, salt);
    
    const validRoles = ['admin', 'supervisor', 'contador', 'verificador'];
    const userRole = (role && validRoles.includes(role)) ? role : 'contador';

    const { data, error } = await supabase
      .from('usuarios_imc')
      .insert([{ 
          nombre, correo, cedula, pass_hash, 
          telefono: telefono || null, 
          role: userRole,
          user_type: user_type || 'Fijo',
          activo: activo !== undefined ? activo : true,
          fecha_registro: new Date()
      }])
      .select('id, nombre, correo, role, cedula, telefono, fecha_registro, activo, user_type, cliente_id, ultimo_acceso')
      .single(); 

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Usuario ya existe.' });
      throw error;
    }

    return res.status(201).json({ message: 'Agente registrado.', user: data });

  } catch (err) {
    console.error('Error SDK (POST):', err.message);
    return res.status(500).json({ error: 'Fallo al crear usuario.' });
  }
};

// PUT: Actualizar Usuario (Para Asignación de Cliente)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const updates = req.body; // Esperamos { cliente_id: 123 } o { cliente_id: null }

  try {
    const { data, error } = await supabase
      .from('usuarios_imc')
      .update(updates)
      .eq('id', id)
      .select('id, nombre, correo, role, cedula, telefono, fecha_registro, activo, user_type, cliente_id, ultimo_acceso')
      .single();

    if (error) throw error;

    return res.status(200).json({ message: 'Usuario actualizado.', user: data });
  } catch (err) {
    console.error('Error SDK (PUT):', err.message);
    return res.status(500).json({ error: 'Fallo al actualizar usuario.' });
  }
};