// frontend/src/components/Inventory/CounterMetrics.jsx
import React, { useState, useEffect } from "react";
import { 
  Zap, Target, Clock, Box, TrendingUp, Activity, 
  Crown, Loader2, BarChart2 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config/api";

// Componente de Métricas del Contador
const CounterMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stats/contador/${user.id}`);
        const data = await res.json();
        if (res.ok) setMetrics(data.metrics);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [user.id]);

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Loader2 className="animate-spin" size={48} color="var(--accent2)" />
      </div>
    );
  }

  if (!metrics) return <div className="dashboard-container">Sin datos de actividad.</div>;

  // Cálculo de Rango basado en Histórico Total
  const getRank = (total) => {
    if (total > 50000) return { title: "MAESTRO DE INVENTARIO", color: "#eab308" }; // Gold
    if (total > 10000) return { title: "OFICIAL ELITE", color: "#a855f7" }; // Purple
    if (total > 5000) return { title: "VETERANO", color: "#ef4444" }; // Red
    return { title: "OPERADOR", color: "#3b82f6" }; // Blue
  };
  
  const rank = getRank(metrics.historicoPiezas);

  return (
    <div className="dashboard-container animate-fade-in">
      
      {/* HEADER DE RANGO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', background: 'var(--card)', padding: '20px', borderRadius: '16px', border: `1px solid ${rank.color}`, boxShadow: `0 0 20px ${rank.color}20` }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: rank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(0,0,0,0.5)' }}>
            <Crown size={36} color="#000" />
        </div>
        <div>
            <div style={{ color: '#8b949e', fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 'bold' }}>RANGO ACTUAL</div>
            <h1 style={{ margin: 0, color: rank.color, fontSize: '2rem', lineHeight: '1', textTransform: 'uppercase' }}>{rank.title}</h1>
            <div style={{ fontSize: '0.9rem', color: '#e6edf3', marginTop: '5px' }}>
                <span style={{ fontWeight: 'bold' }}>{metrics.historicoPiezas.toLocaleString()}</span> piezas totales procesadas en tu carrera.
            </div>
        </div>
      </div>

      {/* KPI GRID PRINCIPAL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* PIEZAS HOY */}
        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}><Box size={80} /></div>
            <div style={{ color: '#8b949e', fontSize: '0.8rem', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Box size={14} /> PIEZAS (SESIÓN)
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent2)' }}>
                {metrics.piezas.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Unidades contadas hoy</div>
        </div>

        {/* SKUS HOY */}
        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}><Target size={80} /></div>
            <div style={{ color: '#8b949e', fontSize: '0.8rem', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Target size={14} /> PRODUCTOS (SKU)
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {metrics.skus}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Variedad procesada</div>
        </div>

        {/* VELOCIDAD */}
        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}><Zap size={80} /></div>
            <div style={{ color: '#8b949e', fontSize: '0.8rem', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Zap size={14} /> VELOCIDAD
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {metrics.velocidad}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Piezas / Hora</div>
        </div>

        {/* TIEMPO ACTIVO */}
        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}><Clock size={80} /></div>
            <div style={{ color: '#8b949e', fontSize: '0.8rem', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={14} /> TIEMPO ACTIVO
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {metrics.tiempo}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Duración de la sesión</div>
        </div>
      </div>

      {/* SECCIÓN DE PRECISIÓN */}
      <div style={{ background: 'var(--card)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '30px' }}>
        <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={20} color="var(--accent)" /> Índice de Precisión
            </h3>
            <p style={{ margin: 0, color: '#8b949e', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Este indicador refleja la exactitud de tus conteos comparados con las auditorías de verificación. Mantén este número alto para subir de rango más rápido.
            </p>
        </div>
        
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Círculo de fondo */}
            <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#374151" strokeWidth="10" />
                <circle 
                    cx="60" cy="60" r="54" fill="none" stroke={metrics.precision > 98 ? '#10b981' : '#f59e0b'} strokeWidth="10"
                    strokeDasharray="339.292"
                    strokeDashoffset={339.292 - (339.292 * metrics.precision) / 100}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--fg)' }}>{metrics.precision}%</div>
                <div style={{ fontSize: '0.6rem', color: '#8b949e' }}>ACCURACY</div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default CounterMetrics;