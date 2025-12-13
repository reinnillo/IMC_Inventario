// backend/src/controllers/inventoryController.js
import supabase from '../config/supabaseClient.js';
import { logAudit } from '../services/auditService.js';

// GET: Obtener Inventario Maestro
// ESTRATEGIA: Paginación Recursiva con Reintentos (Bulletproof Fetch)
export const getClientInventory = async (req, res) => {
  const { cliente_id, page, pageSize, actor_id, actor_name, actor_role, target_label } = req.query;

  if (!cliente_id) {
    return res.status(400).json({ error: 'ID de cliente requerido.' });
  }

  try {
    // --- LÓGICA DE AUDITORÍA (No bloqueante) ---
    // Registramos que alguien está consultando datos sensibles
    if (actor_id) {
        logAudit({
            actor_id: actor_id,
            actor_name: actor_name || 'Desconocido',
            actor_role: actor_role || 'unknown',
            action: 'READ_INVENTORY_MASTER',
            module: 'INVENTORY',
            target_id: cliente_id,
            target_label: target_label || 'N/A',
            details: { 
                mode: (page && pageSize) ? 'Paginado' : 'Descarga Completa' 
            },
            req // Pasamos request para capturar IP
        });
    }

    // MODALIDAD 1: PAGINACIÓN VISUAL (Tablas Admin)
    if (page && pageSize) {
      const p = parseInt(page);
      const ps = parseInt(pageSize);
      const from = (p - 1) * ps;
      const to = from + ps - 1;

      const { data, error, count } = await supabase
        .from('inventarios_cliente_part')
        .select('*', { count: 'exact' })
        .eq('id_cliente', cliente_id)
        .order('codigo_producto', { ascending: true })
        .range(from, to);

      if (error) throw error;
      return res.status(200).json({ count: count, inventory: data });
    }

    // MODALIDAD 2: EXTRACCIÓN MASIVA (Sincronización Offline / Dexie)
    // Implementación de la estrategia recomendada por Supabase: Iterar por rangos.
    let allRows = [];
    let hasMore = true;
    let currentDataPage = 0;
    const CHUNK_SIZE = 1000; // Máximo permitido por API Gateway de Supabase
    const MAX_RETRIES = 3;   // Tolerancia a fallos de red

    console.log(`🔄 [Sync] Iniciando descarga masiva para Cliente ${cliente_id}...`);

    while (hasMore) {
      const from = currentDataPage * CHUNK_SIZE;
      const to = from + CHUNK_SIZE - 1;
      let chunkData = null;
      let attempts = 0;

      // Bucle de Reintento para cada Chunk
      while (attempts < MAX_RETRIES && !chunkData) {
        try {
          const { data, error } = await supabase
            .from('inventarios_cliente_part')
            .select('*')
            .eq('id_cliente', cliente_id)
            .order('id', { ascending: true }) // Orden determinista por ID para evitar saltos
            .range(from, to);

          if (error) throw error;
          chunkData = data;
        } catch (err) {
          attempts++;
          console.warn(`⚠️ Error en chunk ${currentDataPage} (Intento ${attempts}/${MAX_RETRIES}): ${err.message}`);
          if (attempts >= MAX_RETRIES) throw err; // Si falla 3 veces, abortamos
          await new Promise(r => setTimeout(r, 500 * attempts)); // Backoff exponencial
        }
      }

      if (chunkData.length > 0) {
        allRows = allRows.concat(chunkData);
        currentDataPage++;
        
        // Si el chunk es menor al límite, llegamos al final
        if (chunkData.length < CHUNK_SIZE) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ [Sync] Descarga completada: ${allRows.length} registros totales.`);

    return res.status(200).json({ 
      count: allRows.length, 
      inventory: allRows 
    });

  } catch (err) {
    console.error('🔥 Error Crítico Get Inventory:', err.message);
    return res.status(500).json({ error: 'Error al recuperar inventario maestro.' });
  }
};

// POST: Carga Masiva (Bulk Import)
export const bulkImportInventory = async (req, res) => {
  const { items, cliente_id, admin_id, admin_name, admin_role, cliente_name, cliente_detailsAuditoria } = req.body;

  if (!items || !Array.isArray(items) || !cliente_id) {
    return res.status(400).json({ error: 'Datos de importación inválidos.' });
  }

  console.log(`📦 [Import] Recibiendo ${items.length} productos para Cliente ${cliente_id}...`);

  try {
    const cleanItems = items.map(item => ({
      id_cliente: cliente_id,
      codigo_producto: String(item.codigo_producto || item.codigo || "").trim(), 
      descripcion: item.descripcion || 'Sin descripción',
      cantidad: Number(item.cantidad) || 0,
      area: item.area || null,
      ubicacion: item.ubicacion || null,
      marbete: item.marbete || null,
      barcode: item.barcode || null,
      costo: Number(item.costo) || 0,
      unidad_medida: item.unidad_medida || 'UN',
      categoria: item.categoria || null,
      fecha_cargado: new Date()
    }));

    const { data, error } = await supabase
      .from('inventarios_cliente_part')
      .insert(cleanItems)
      .select();

    if (error) throw error;

    // Auditoria para importación masiva.
    await logAudit({
        actor_id: admin_id || null,
        actor_name: admin_name || 'desconocido',
        actor_role: admin_role || 'unknown',
        action: 'BULK_IMPORT',
        module: 'INVENTORY',
        target_id: cliente_id || null,
        target_label: `Cliente : ${cliente_name || 'N/A'}`,
        details: cliente_detailsAuditoria || 'N/A',
        req
    });

    return res.status(201).json({ 
      message: 'Carga masiva completada.', 
      count: data.length 
    });

  } catch (err) {
    console.error('Error Bulk Import:', err.message);
    return res.status(500).json({ error: 'Fallo crítico en importación: ' + err.message });
  }
};

// DELETE: Eliminar Inventario Completo
export const deleteClientInventory = async (req, res) => {
  const { cliente_id, admin_id, admin_name, admin_role, cliente_name } = req.body; 

  if (!cliente_id) {
    return res.status(400).json({ error: 'Confirmación de cliente requerida.' });
  }

  try {
    const { data, error } = await supabase
      .from('inventarios_cliente_part')
      .delete()
      .eq('id_cliente', cliente_id)
      .select();

    if (error) throw error;

    // 3. AUDITORÍA CRÍTICA: Eliminación de inventario
    await logAudit({
        actor_id: admin_id || null,
        actor_name: admin_name || 'desconocido',
        actor_role: admin_role || 'unknown',
        action: 'DELETE_INVENTORY',
        module: 'INVENTORY',
        target_id: cliente_id || null,
        target_label: `Cliente : ${cliente_name || 'N/A'}`,
        details: { reason: 'Deleted Inventory', deletedCount: data.length },
        req
    });

    return res.status(200).json({ 
      message: 'Inventario eliminado correctamente.', 
      deletedCount: data.length 
    });

  } catch (err) {
    console.error('Error Delete Inventory:', err.message);
    return res.status(500).json({ error: 'Fallo al eliminar inventario.' });
  }
};