// backend/src/controllers/guestController.js
import supabase from '../config/supabaseClient.js';
import { logAudit } from '../services/auditService.js';

// GET: Validar Token y Obtener Dashboard Ejecutivo
export const getGuestDashboardData = async (req, res) => {
  const { token } = req.query;

  if (!token) return res.status(400).json({ error: 'Token de acceso requerido.' });

  try {
    // 1. VALIDACIÓN DEL TOKEN
    const { data: linkData, error: linkError } = await supabase
      .from('guest_links')
      .select('cliente_id, activo, expires_at, alias_auditoria')
      .eq('token', token)
      .single();

    if (linkError || !linkData) return res.status(403).json({ error: 'Enlace inválido o no encontrado.' });
    if (!linkData.activo) return res.status(403).json({ error: 'Este enlace ha sido desactivado.' });
    if (new Date(linkData.expires_at) < new Date()) return res.status(403).json({ error: 'El enlace ha expirado.' });

    const cliente_id = linkData.cliente_id;

    // 2. EXTRACCIÓN DE INTELIGENCIA
    
    // A) Datos del Cliente
    const { data: cliente, error: clientError } = await supabase
      .from('clientes')
      .select('nombre') 
      .eq('id', cliente_id)
      .single();

    if (clientError) throw new Error(`Error buscando cliente: ${clientError.message}`);

    // B) Métricas de Verificación (CORRECCIÓN CRÍTICA: Eliminamos 'area' del select)
    // La tabla 'inventario_verificado_part' NO tiene la columna area, esa es del maestro.
    const { data: verificados, error: verifError } = await supabase
      .from('inventario_verificado_part')
      .select('codigo_producto, cantidad_sistema, cantidad_final, diferencia, fecha_verificacion, estado')
      .eq('cliente_id', cliente_id);

    if (verifError) throw new Error(`Error buscando datos: ${verifError.message}`);

    const safeVerificados = verificados || [];

    // --- ENRIQUECIMIENTO DE DATOS (DATA HYDRATION) ---
    // Estrategia: Cruzamos los códigos verificados contra el Inventario Maestro para obtener las Áreas.
    
    const codigosUnicos = [...new Set(safeVerificados.map(v => v.codigo_producto).filter(c => c))];
    let maestroMap = new Map(); // Mapa para acceso O(1) -> Codigo: Area

    if (codigosUnicos.length > 0) {
        // Traemos el mapa de áreas en una sola consulta eficiente
        const { data: maestro } = await supabase
            .from('inventarios_cliente_part')
            .select('codigo_producto, area')
            .eq('id_cliente', cliente_id)
            .in('codigo_producto', codigosUnicos);
            
        if (maestro) {
            maestro.forEach(m => maestroMap.set(m.codigo_producto, m.area));
        }
    }

    // C) Cálculo de KPIs con Datos Enriquecidos
    let totalAuditado = 0;
    let totalSistema = 0;
    let totalDiferenciaAbs = 0;
    let itemsConError = 0;
    const areasMap = {};
    const timeline = [];

    safeVerificados.forEach(item => {
      const fis = Number(item.cantidad_final) || 0;
      const sis = Number(item.cantidad_sistema) || 0;
      const dif = fis - sis;

      totalAuditado += fis;
      totalSistema += sis;
      totalDiferenciaAbs += Math.abs(dif);
      if (dif !== 0) itemsConError++;

      // RECUPERACIÓN DEL DATO PERDIDO: Usamos el mapa maestro para obtener el área real
      const areaReal = maestroMap.get(item.codigo_producto) || 'Sin Asignar';
      
      // Agrupación por Área
      if (!areasMap[areaReal]) areasMap[areaReal] = { total: 0, errores: 0 };
      areasMap[areaReal].total++;
      if (dif !== 0) areasMap[areaReal].errores++;

      timeline.push({
        fecha: item.fecha_verificacion,
        accion: `Verificación en ${areaReal}`,
        estado: item.estado
      });
    });

    // Ordenar Timeline (Más reciente primero)
    timeline.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Cálculo de Precisión (ERI - Exactitud de Registro de Inventario)
    const accuracy = safeVerificados.length > 0 
        ? ((safeVerificados.length - itemsConError) / safeVerificados.length) * 100 
        : 100;
    
    // Formatear Estadísticas de Áreas
    const areasStats = Object.entries(areasMap).map(([name, stats]) => ({
      name,
      accuracy: stats.total > 0 ? ((stats.total - stats.errores) / stats.total * 100).toFixed(1) : 100,
      volume: stats.total
    })).sort((a, b) => b.volume - a.volume); // Ordenar por volumen de trabajo

    // 3. RESPUESTA AL DASHBOARD
    return res.json({
      access: {
        granted: true,
        auditName: linkData.alias_auditoria,
        validUntil: linkData.expires_at
      },
      client: {
        name: cliente.nombre,
        logo: null 
      },
      kpis: {
        accuracy: accuracy.toFixed(2),
        totalPhysical: totalAuditado,
        netVariance: totalAuditado - totalSistema, // Positivo = Sobrante, Negativo = Faltante
        progress: 75 // TODO: Calcular contra total maestro si se desea
      },
      areas: areasStats,
      timeline: timeline.slice(0, 10), // Top 10 actividades recientes
      lastUpdate: new Date()
    });

  } catch (err) {
    console.error("🔥 GUEST CONTROLLER ERROR:", err.message);
    return res.status(500).json({ error: "Error interno: " + err.message });
  }
};

// --- GESTIÓN DE ENLACES ---

// POST: Crear nuevo enlace de invitado
export const createGuestLink = async (req, res) => {
  const { cliente_id, expires_in_hours, alias_auditoria, auditoria_data } = req.body;

  if (!cliente_id) return res.status(400).json({ error: 'Cliente ID requerido.' });

  try {
    // Desactivar anteriores
    await supabase
      .from('guest_links')
      .update({ activo: false })
      .eq('cliente_id', cliente_id)
      .eq('activo', true);

    const hours = expires_in_hours || 24;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('guest_links')
      .insert([{
        cliente_id,
        expires_at: expiresAt,
        alias_auditoria: `Auditoría ${new Date().getFullYear()}`,
        activo: true
      }])
      .select()
      .single();

    if (error) throw error;

    // ALmacenar datos de auditoría.
    await logAudit({
      actor_id: auditoria_data?.admin_id || null,
      actor_name: auditoria_data?.admin_name || 'N/A',
      actor_role: auditoria_data?.admin_role || 'N/A',
      action: 'CREAR_ENLACE_INVITADO',
      module: 'GUEST',
      target_id: cliente_id,
      target_label: auditoria_data?.cliente_name || 'N/A',
      details: { reason: `Enlace creado para cliente ${auditoria_data?.cliente_name || 'N/A'} con expiración en ${hours} horas.` },
      requested_at: new Date().toISOString(),
      req // Pasamos request para capturar IP
    });

    return res.status(201).json({ message: 'Enlace generado.', link: data });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error generando enlace.' });
  }
};

// POST: Revocar enlace de invitado
export const revokeGuestLink = async (req, res) => {
  const { cliente_id, auditoria_data } = req.body;
  if (!cliente_id) return res.status(400).json({ error: 'Cliente ID requerido.' });

  try {
    const { error } = await supabase
      .from('guest_links')
      .update({ activo: false })
      .eq('cliente_id', cliente_id)
      .eq('activo', true);

    if (error) throw error;

    // Almacenar datos de auditoría.
    await logAudit({
      actor_id: auditoria_data?.admin_id || null,
      actor_name: auditoria_data?.admin_name || 'N/A',
      actor_role: auditoria_data?.admin_role || 'N/A',
      action: 'REVOKE_GUEST_LINK',
      module: 'GUEST',
      target_id: cliente_id,
      target_label: auditoria_data?.cliente_name || 'N/A',
      details: { reason: `Enlace de invitado revocado para cliente ${auditoria_data?.cliente_name || 'N/A'}.` },
      requested_at: new Date().toISOString(),
      req // Pasamos request para capturar IP
    });

    return res.json({ message: 'Acceso revocado correctamente.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al revocar enlace.' });
  }
};

// POST: Obtener enlace activo de invitado
export const getActiveLink = async (req, res) => {
  const { cliente_id } = req.query;
  if (!cliente_id) return res.status(400).json({ error: 'Cliente ID requerido.' });

  try {
    const { data, error } = await supabase
      .from('guest_links')
      .select('*')
      .eq('cliente_id', cliente_id)
      .eq('activo', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return res.json({ link: data || null });
  } catch (err) {
    return res.status(500).json({ error: 'Error consultando enlaces.' });
  }
};