// backend/src/controllers/supervisionController.js
import supabase from '../config/supabaseClient.js';

// GET: Supervisión de Conteos (Live Feed)
export const getLiveCountingStats = async (req, res) => {
  const { cliente_id } = req.query;
  if (!cliente_id) return res.status(400).json({ error: 'Cliente ID requerido' });

  try {
    // 1. Últimos 50 escaneos en tiempo real
    const { data: recentScans } = await supabase
      .from('conteos_part')
      .select('codigo_producto, cantidad, marbete, area, nombre_contador, fecha_escaneo')
      .eq('cliente_id', cliente_id)
      .order('fecha_escaneo', { ascending: false })
      .limit(50);

    // 2. Agregación por Marbete (Progreso)
    // Nota: Supabase JS no tiene GROUP BY nativo simple, hacemos una consulta ligera para métricas
    // Para producción masiva, esto debería ser una RPC (Stored Procedure) en Postgres.
    // Aquí simulamos la agrupación trayendo ids y marbetes para contar rápido.
    const { data: allCounts } = await supabase
      .from('conteos_part')
      .select('marbete, cantidad, nombre_contador')
      .eq('cliente_id', cliente_id);

    // Procesamiento en memoria (Node.js es rápido para esto hasta ~50k registros)
    const marbetesMap = {};
    const contadoresMap = {};
    let totalPiezas = 0;

    allCounts.forEach(item => {
      // Marbetes
      if (!marbetesMap[item.marbete]) marbetesMap[item.marbete] = 0;
      marbetesMap[item.marbete] += item.cantidad;
      
      // Contadores
      const nombre = item.nombre_contador || 'Desconocido';
      if (!contadoresMap[nombre]) contadoresMap[nombre] = 0;
      contadoresMap[nombre] += item.cantidad;

      totalPiezas += item.cantidad;
    });

    // Formatear para gráficas/tablas
    const activeMarbetes = Object.entries(marbetesMap)
      .map(([marbete, qty]) => ({ marbete, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10); // Top 10 marbetes activos

    const activeCounters = Object.entries(contadoresMap)
      .map(([nombre, qty]) => ({ nombre, qty }))
      .sort((a, b) => b.qty - a.qty);

    return res.json({
      recentScans: recentScans || [],
      activeMarbetes,
      activeCounters,
      stats: {
        totalRegistros: allCounts.length,
        totalPiezas,
        marbetesAbiertos: Object.keys(marbetesMap).length,
        contadoresActivos: Object.keys(contadoresMap).length
      }
    });

  } catch (err) {
    console.error("Supervision Count Error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// GET: Supervisión de Verificación (Audit Live)
export const getLiveVerificationStats = async (req, res) => {
  const { cliente_id } = req.query;
  if (!cliente_id) return res.status(400).json({ error: 'Cliente ID requerido' });

  try {
    // 1. Últimas verificaciones (Enfocadas en errores/diferencias)
    const { data: recentVerifications } = await supabase
      .from('inventario_verificado_part')
      .select('codigo_producto, descripcion, cantidad_sistema, cantidad_final, diferencia, nombre_verificador, marbete, fecha_verificacion')
      .eq('cliente_id', cliente_id)
      .order('fecha_verificacion', { ascending: false })
      .limit(50);

    // 2. Métricas Globales
    const { data: allVerif } = await supabase
      .from('inventario_verificado_part')
      .select('diferencia, cantidad_final, nombre_verificador')
      .eq('cliente_id', cliente_id);

    let totalAuditado = 0;
    let itemsConDiferencia = 0;
    let netDifference = 0;
    const verificadoresMap = {};

    allVerif.forEach(item => {
      totalAuditado += Number(item.cantidad_final);
      const diff = Number(item.diferencia);
      netDifference += diff;
      if (diff !== 0) itemsConDiferencia++;

      const nombre = item.nombre_verificador || 'Desconocido';
      if (!verificadoresMap[nombre]) verificadoresMap[nombre] = { count: 0, errorsFound: 0 };
      verificadoresMap[nombre].count++;
      if (diff !== 0) verificadoresMap[nombre].errorsFound++;
    });

    const activeVerifiers = Object.entries(verificadoresMap)
      .map(([nombre, stats]) => ({ nombre, ...stats }))
      .sort((a, b) => b.count - a.count);

    return res.json({
      recentVerifications: recentVerifications || [],
      activeVerifiers,
      stats: {
        totalItemsVerificados: allVerif.length,
        totalPiezasAuditadas: totalAuditado,
        itemsConError: itemsConDiferencia,
        precisionGlobal: allVerif.length > 0 ? ((allVerif.length - itemsConDiferencia) / allVerif.length * 100).toFixed(1) : 100
      }
    });

  } catch (err) {
    console.error("Supervision Verif Error:", err);
    return res.status(500).json({ error: err.message });
  }
};