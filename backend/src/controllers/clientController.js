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