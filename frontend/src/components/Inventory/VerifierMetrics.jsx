// frontend/src/components/Inventory/VerifierMetrics.jsx
import React, { useState, useEffect } from "react";
import { 
  ClipboardCheck, Clock, AlertOctagon, Activity, 
  Target, BarChart, Loader2, ShieldCheck
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config/api";

// Componente de Métricas del Verificador
const VerifierMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stats/verificador/${user.id}`);
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
        <Loader2 className="animate-spin" size={48} color="var(--success)" />
      </div>
    );
  }

  if (!metrics) return <div className="dashboard-container">Sin datos de auditoría hoy.</div>;

  return (
    <div className="dashboard-container animate-fade-in">
      
      {/* HEADER DE SESIÓN */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', background: 'var(--card)', padding: '20px', borderRadius: '16px', border: `1px solid var(--success)`, boxShadow: `0 0 20px rgba(16, 185, 129, 0.1)` }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid var(--success)` }}>
            <ShieldCheck size={32} color="var(--success)" />
        </div>
        <div>
            <div style={{ color: '#8b949e', fontSize: '0.8rem', letterSpacing: '1px', fontWeight: 'bold' }}>ESTADO DE AUDITORÍA</div>
            <h1 style={{ margin: 0, color: 'var(--success)', fontSize: '1.8rem', lineHeight: '1', textTransform: 'uppercase' }}>SESIÓN ACTIVA</h1>
            <div style={{ fontSize: '0.9rem', color: '#e6edf3', marginTop: '5px' }}>
                Auditor: <span style={{ fontWeight: 'bold' }}>{user.nombre}</span>
            </div>
        </div>
      </div>

      {/* METRICAS OPERATIVAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* PIEZAS */}
        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ color: '#8b949e', fontSize: '0.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ClipboardCheck size={16} /> PIEZAS VERIFICADAS
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--fg)' }}>
                {metrics.piezas.toLocaleString()}
            </div>
        </div>

        {/* SKUS */}
        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ color: '#8b949e', fontSize: '0.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Target size={16} /> SKUS AUDITADOS
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {metrics.skus}
            </div>
        </div>

        {/* DIFERENCIAS */}
        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid #ef4444' }}>
            <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight:'bold' }}>
                <AlertOctagon size={16} /> DISCREPANCIAS
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                {metrics.diferencias}
            </div>
            <div style={{fontSize:'0.7rem', color:'#ef4444', opacity:0.8}}>Errores encontrados</div>
        </div>

        {/* VELOCIDAD */}
        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ color: '#8b949e', fontSize: '0.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Activity size={16} /> VELOCIDAD
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {metrics.velocidad}
            </div>
            <div style={{fontSize:'0.7rem', color:'#8b949e'}}>Piezas / Hora</div>
        </div>
      </div>

      {/* FOOTER METRICS */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display:'flex', alignItems:'center', gap:'15px' }}>
              <div style={{background:'rgba(59, 130, 246, 0.1)', padding:'10px', borderRadius:'8px'}}><BarChart size={24} color="#3b82f6"/></div>
              <div>
                  <div style={{color:'#8b949e', fontSize:'0.8rem'}}>CONCORDANCIA</div>
                  <div style={{fontSize:'1.5rem', fontWeight:'bold', color: metrics.precision > 98 ? '#10b981' : '#f59e0b'}}>{metrics.precision}%</div>
              </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display:'flex', alignItems:'center', gap:'15px' }}>
              <div style={{background:'rgba(255, 255, 255, 0.05)', padding:'10px', borderRadius:'8px'}}><Clock size={24} color="#e6edf3"/></div>
              <div>
                  <div style={{color:'#8b949e', fontSize:'0.8rem'}}>TIEMPO ACTIVO</div>
                  <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'var(--fg)'}}>{metrics.tiempo}</div>
              </div>
          </div>
      </div>

    </div>
  );
};

export default VerifierMetrics;