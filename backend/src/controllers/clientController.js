import supabase from '../config/supabaseClient.js';

// GET: Listar toda la cartera de clientes
export const getClients = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('fecha_creado', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ 
      count: data?.length || 0, 
      clients: data || [] 
    });

  } catch (err) {
    console.error('Error Client SDK:', err.message);
    return res.status(500).json({ error: 'Fallo al recuperar la cartera de clientes.' });
  }
};

// POST: Registrar nuevo cliente corporativo
export const createClient = async (req, res) => {
  const { 
    nombre, nombre_comercial, ruc, telefono, email, 
    direccion, contacto_principal, telefono_contacto, notas 
  } = req.body;

  // Validación mínima
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del cliente es obligatorio.' });
  }

  try {
    const { data, error } = await supabase
      .from('clientes')
      .insert([{
        nombre,
        nombre_comercial,
        ruc,
        telefono,
        email,
        direccion,
        contacto_principal,
        telefono_contacto,
        notas,
        estado: 'activo', // Default por regla de negocio
        fecha_creado: new Date(),
        fecha_actualizado: new Date()
      }])
      .select()
      .single();

    if (error) {
        // Manejo de duplicados (si RUC fuera unique por ejemplo)
        if (error.code === '23505') return res.status(409).json({ error: 'Cliente ya registrado.' });
        throw error;
    }

    return res.status(201).json({ 
      message: 'Entidad corporativa registrada.', 
      client: data 
    });

    } catch (err) {
      console.error('Error Client Create:', err.message);
      return res.status(500).json({ error: 'Error al crear cliente.' });
    }
};

// PUT: Actualizar información de un cliente
export const updateClient = async (req, res) => {
  const { id } = req.params;
  const {
    nombre, nombre_comercial, ruc, telefono, email,
    direccion, contacto_principal, telefono_contacto, notas
  } = req.body;

  // Validación mínima
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del cliente es obligatorio.' });
  }

  try {
    const { data, error } = await supabase
      .from('clientes')
      .update({
        nombre,
        nombre_comercial,
        ruc,
        telefono,
        email,
        direccion,
        contacto_principal,
        telefono_contacto,
        notas,
        fecha_actualizado: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Manejo de duplicados (si RUC fuera unique por ejemplo)
      if (error.code === '23505') return res.status(409).json({ error: 'Cliente con ese RUC ya existe.' });
      throw error;
    }

    if (!data) return res.status(404).json({ error: 'Cliente no encontrado.' });

    return res.status(200).json({
      message: 'Información del cliente actualizada.',
      client: data
    });

  } catch (err) {
    console.error('Error Client Update:', err.message);
    return res.status(500).json({ error: 'Error al actualizar la información del cliente.' });
  }
};

// PATCH: Cambiar el estado de un cliente
export const updateClientStatus = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  // 1. Validar el estado entrante
  const allowedStatus = ['activo', 'inactivo', 'suspendido'];
  if (!estado || !allowedStatus.includes(estado)) {
    return res.status(400).json({
      error: 'Protocolo inválido.',
      message: `El estado debe ser uno de: ${allowedStatus.join(', ')}.`
    });
  }

  try {
    // 2. Actualizar el cliente en la base de datos
    const { data, error } = await supabase
      .from('clientes')
      .update({
        estado: estado,
        fecha_actualizado: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data)   return res.status(404).json({ error: 'Cliente no encontrado.' });

    // 3. Devolver respuesta de éxito
    return res.status(200).json({
      message: `Estado del cliente actualizado a '${estado}'.`,
      client: data
    });

  } catch (err) {
    console.error('Error Client Status Update:', err.message);
        return res.status(500).json({ error: 'Fallo al actualizar el estado del cliente.' });
      }
    };
    
// DELETE: Eliminar un cliente
export const deleteClient = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return res.status(200).json({ message: 'Cliente eliminado exitosamente.' });

  } catch (err) {
    console.error('Error Client Delete:', err.message); 

    // Verificación específica para violación de clave externa (foreign key)
    if (err.code === '23503') {
      return res.status(409).json({ // 409 Conflict
        error: 'El cliente tiene recursos asignados y no puede ser eliminado (violación de clave externa).',
        message: `Detalle: ${err.message}` // Mensaje de depuración para identificar la restricción
      });
    }

    return res.status(500).json({ error: 'Fallo al eliminar el cliente.' });
  }
};
