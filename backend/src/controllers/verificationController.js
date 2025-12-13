// backend/src/controllers/verificationController.js
import supabase from '../config/supabaseClient.js';
import { updateSessionStats, updateGlobalStats } from '../services/statsService.js'; // <--- Importamos servicio

// GET: Obtener Marbete (Se mantiene igual, solo re-escribo saveVerification)
export const getMarbeteData = async (req, res) => {
    // ... (Código de lectura existente intacto) ...
    // Por brevedad, asumo que mantienes el código de lectura que ya funcionaba bien.
    // Solo repetiré saveVerification con la inyección.
  const { marbete, cliente_id } = req.query;
  if (!marbete || !cliente_id) return res.status(400).json({error: 'Faltan datos'});

  try {
    // ... (Lógica de getMarbeteData existente) ...
    // Para no borrar tu lógica anterior, pego la última versión funcional de getMarbeteData aquí:
    const { data: verificados } = await supabase.from('inventario_verificado_part').select('id').eq('marbete', marbete).eq('cliente_id', cliente_id).eq('estado', 'verificado').limit(1);
    if (verificados?.length > 0) return res.status(409).json({ error: `Marbete ${marbete} ya cerrado.` });

    const { data: conteos } = await supabase.from('conteos_part').select('codigo_producto, cantidad, area, ubicacion').eq('marbete', marbete).eq('cliente_id', cliente_id);
    const conteoMap = {};
    (conteos||[]).forEach(i => {
        if(!conteoMap[i.codigo_producto]) conteoMap[i.codigo_producto] = { qty:0, area: i.area, ubi: i.ubicacion };
        conteoMap[i.codigo_producto].qty += i.cantidad;
    });

    const codigos = Object.keys(conteoMap);
    let sysMap = new Map();
    const { data: sysData } = await supabase.from('inventarios_cliente_part').select('*').eq('id_cliente', cliente_id).in('codigo_producto', codigos);
    if(sysData) sysData.forEach(d => sysMap.set(d.codigo_producto, d));

    // Si faltan del sistema en el marbete actual pero existen en conteos (intrusos), buscamos
    // ... (Lógica de fusión existente) ...
    
    const fusion = codigos.map(code => {
        const sys = sysMap.get(code);
        const fis = conteoMap[code];
        return {
            codigo_producto: code,
            descripcion: sys?.descripcion || 'NO EN CATÁLOGO',
            cantidad_sistema: sys?.cantidad || 0,
            cantidad_conteo: fis.qty,
            area: fis.area || sys?.area,
            ubicacion: fis.ubi || sys?.ubicacion,
            diferencia: fis.qty - (sys?.cantidad||0),
            cantidad_verificada: fis.qty,
            en_sistema: !!sys
        };
    });

    return res.json({ marbete, items: fusion });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

// POST: Guardar Verificación (ACTUALIZADO)
export const saveVerification = async (req, res) => {
  const { items, meta } = req.body;

  if (!items || !meta) return res.status(400).json({ error: 'Datos incompletos.' });

  try {
    const records = items.map(item => ({
      cliente_id: meta.cliente_id,
      marbete: meta.marbete,
      codigo_producto: item.codigo_producto,
      descripcion: item.descripcion,
      cantidad_sistema: item.cantidad_sistema,
      cantidad_conteo: item.cantidad_conteo,
      cantidad_final: Number(item.cantidad_verificada),
      area: item.area,
      ubicacion: item.ubicacion,
      es_forzado: item.en_sistema === false,
      producto_contado: item.cantidad_conteo > 0,
      nombre_verificador: meta.nombre_verificador,
      fecha_verificacion: new Date(),
      verificador_id: meta.verificador_id,
      tiempo_verificacion: meta.tiempo_verificacion,
      estado: 'verificado'
    }));

    const { data, error } = await supabase
      .from('inventario_verificado_part')
      .insert(records)
      .select();

    if (error) throw error;

    // --- ALIMENTACIÓN DE MÉTRICAS ---
    const userId = meta.verificador_id;
    if (userId) {
        await updateSessionStats(userId, 'verificador');
        await updateGlobalStats(userId);
    }

    return res.status(201).json({ message: 'Marbete verificado y cerrado.', count: data.length });

  } catch (err) {
    console.error('Error Save Verification:', err.message);
    return res.status(500).json({ error: 'Error al guardar verificación: ' + err.message });
  }
};

export const getVerificationHistory = async (req, res) => {
    const { id } = req.params;
    try {
        const { data } = await supabase.from('inventario_verificado_part')
            .select('marbete, diferencia, fecha_verificacion, cantidad_final, cantidad_sistema')
            .eq('verificador_id', id).order('fecha_verificacion', { ascending: false }).limit(100);
        return res.json({ history: data });
    } catch (e) { return res.status(500).json({error: e.message}); }
};