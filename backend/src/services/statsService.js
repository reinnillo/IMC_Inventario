// backend/src/services/statsService.js
import supabase from '../config/supabaseClient.js';

/**
 * Recalcula y actualiza la sesión diaria de un empleado.
 * Se llama después de cada SYNC de conteo o verificación.
 */
export const updateSessionStats = async (userId, role) => {
  const today = new Date().toISOString().slice(0, 10);
  
  try {
    let piezas = 0;
    let skus = 0;
    let tiempoActivoMs = 0;
    let currentClientId = null;

    if (role === 'contador') {
        const { data: conteos } = await supabase
            .from('conteos_part')
            .select('cantidad, codigo_producto, fecha_inicio_marbete, fecha_fin_marbete, fecha_escaneo, cliente_id')
            .eq('contador_id', userId);
        
        const conteosHoy = (conteos || []).filter(c => c.fecha_escaneo && c.fecha_escaneo.startsWith(today));
        
        if (conteosHoy.length > 0) {
            piezas = conteosHoy.reduce((acc, c) => acc + (c.cantidad || 0), 0);
            const skusSet = new Set(conteosHoy.map(c => c.codigo_producto));
            skus = skusSet.size;
            currentClientId = conteosHoy[conteosHoy.length - 1].cliente_id;

            conteosHoy.forEach(c => {
                if (c.fecha_inicio_marbete && c.fecha_fin_marbete) {
                    const diff = new Date(c.fecha_fin_marbete) - new Date(c.fecha_inicio_marbete);
                    if (diff > 0 && diff < 86400000) tiempoActivoMs += diff;
                }
            });
        }

    } else if (role === 'verificador') {
        const { data: verif } = await supabase
            .from('inventario_verificado_part')
            .select('cantidad_final, fecha_verificacion, tiempo_verificacion, codigo_producto, cliente_id')
            .eq('verificador_id', userId)
            .gte('fecha_verificacion', `${today}T00:00:00`);
            
        if (verif && verif.length > 0) {
            piezas = verif.reduce((acc, v) => acc + (Number(v.cantidad_final) || 0), 0);
            const skusSet = new Set(verif.map(v => v.codigo_producto));
            skus = skusSet.size;
            currentClientId = verif[0].cliente_id;
            
            // Sumamos segundos de tiempo_verificacion
            const segundosTotales = verif.reduce((acc, v) => acc + (v.tiempo_verificacion || 0), 0);
            tiempoActivoMs = segundosTotales * 1000;
        }
    }

    // Cálculos Finales
    const horas = Math.floor(tiempoActivoMs / 3600000);
    const minutos = Math.floor((tiempoActivoMs % 3600000) / 60000);
    const tiempoInterval = `${horas} hours ${minutos} minutes`;
    
    const horasDecimal = tiempoActivoMs / 3600000;
    const velocidad = horasDecimal > 0 ? Math.round(piezas / horasDecimal) : 0;
    const precision = 98.5; // Placeholder (o lógica real si existe)

    // UPSERT en employee_session_stats
    const { data: sessionExists } = await supabase
        .from('employee_session_stats')
        .select('id')
        .eq('usuario_id', userId)
        .gte('hora_inicio', `${today}T00:00:00`)
        .maybeSingle();

    const payload = {
        usuario_id: userId,
        cliente_id: currentClientId,
        rol_asumido: role,
        piezas_sesion: piezas,
        skus_sesion: skus,
        velocidad_sesion: velocidad,
        precision_sesion: precision,
        tiempo_activo: tiempoInterval,
        hora_fin: new Date()
    };

    if (sessionExists) {
        await supabase.from('employee_session_stats').update(payload).eq('id', sessionExists.id);
    } else {
        // Solo insertamos si hay actividad para no llenar de ceros
        if (piezas > 0) {
            await supabase.from('employee_session_stats').insert({ ...payload, hora_inicio: new Date() });
        }
    }
    
    return payload;

  } catch (err) {
    console.error("Error updating Session Stats:", err.message);
    return null;
  }
};

/**
 * Recalcula y actualiza el Perfil Global (Lifetime).
 * Se llama después de updateSessionStats.
 */
export const updateGlobalStats = async (userId) => {
  try {
    // 1. Raw Data
    const { data: conteos } = await supabase.from('conteos_part').select('cantidad, codigo_producto, cliente_id').eq('contador_id', userId);
    const { data: verif } = await supabase.from('inventario_verificado_part').select('cantidad_final, codigo_producto, cliente_id, diferencia').eq('verificador_id', userId);
    const { data: sesiones } = await supabase.from('employee_session_stats').select('tiempo_activo').eq('usuario_id', userId);

    const safeConteos = conteos || [];
    const safeVerif = verif || [];
    const safeSesiones = sesiones || [];

    const piezasC = safeConteos.reduce((acc, c) => acc + (c.cantidad || 0), 0);
    const piezasV = safeVerif.reduce((acc, v) => acc + (Number(v.cantidad_final) || 0), 0);
    
    const skusSet = new Set([...safeConteos.map(c => c.codigo_producto), ...safeVerif.map(v => v.codigo_producto)]);
    const clientesSet = new Set([...safeConteos.map(c => c.cliente_id), ...safeVerif.map(v => v.cliente_id)]);

    // Precisión
    const aciertos = safeVerif.filter(v => v.diferencia === 0).length;
    const precision = safeVerif.length > 0 ? ((aciertos / safeVerif.length) * 100).toFixed(2) : 100.00;

    // Horas Totales (Estimación robusta si no hay sesiones, o suma si hay)
    // Para Postgres interval, enviamos string.
    let horasEstimadas = 0;
    if (safeSesiones.length > 0) {
        // Simplificación: conteo * 4h. Idealmente sumaríamos los intervalos reales en BD.
        horasEstimadas = safeSesiones.length * 4;
    } else {
        horasEstimadas = Math.round((piezasC + piezasV) / 500);
    }
    const intervaloPostgres = `${Math.max(1, horasEstimadas)} hours`;

    const statsPayload = {
        usuario_id: userId,
        piezas_totales_contadas: piezasC,
        piezas_totales_verificadas: piezasV,
        skus_totales_procesados: skusSet.size,
        precision_global: precision,
        horas_totales_trabajadas: intervaloPostgres,
        inventarios_trabajados: clientesSet.size,
        // fecha_creado se mantiene original
    };

    await supabase
        .from('employee_stats')
        .upsert(statsPayload, { onConflict: 'usuario_id' });

    return statsPayload;

  } catch (err) {
    console.error("Error updating Global Stats:", err.message);
    return null;
  }
};