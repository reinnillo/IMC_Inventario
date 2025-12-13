// frontend/src/components/Profile/GlobalProfile.jsx
import React, { useState, useEffect } from "react";
import { 
  Trophy, Activity, Clock, Layers, Zap, 
  ShieldCheck, X 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config/api";

const GlobalProfile = ({ onClose }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stats/global/${user.id}`);
        const data = await res.json();
        if (res.ok) setStats(data.profile);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalStats();
  }, [user.id]);

  // Estilos CSS en línea
  const styles = `
    .profile-wrapper {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: #0d1117; z-index: 2500; overflow-y: auto;
        display: flex; flex-direction: column;
        font-family: 'Segoe UI', sans-serif;
    }
    
    .profile-navbar {
        padding: 20px 40px; border-bottom: 1px solid var(--border); 
        background: rgba(22, 27, 34, 0.9); backdrop-filter: blur(10px);
        position: sticky; top: 0; z-index: 10;
        display: flex; justify-content: space-between; align-items: center;
        flex-shrink: 0;
    }

    .user-info-header {
        display: flex; align-items: center; gap: 15px; 
        flex: 1; /* Ocupa el espacio disponible */
        min-width: 0; /* CRÍTICO para que el truncado funcione en flex */
        padding-right: 20px; /* Margen para no pegar con la X */
    }

    .user-name-title {
        margin: 0; color: var(--fg); 
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; /* Truncado */
        font-size: 1.5rem;
    }

    /* ... resto de estilos ... */
    /* MOBILE ADAPTATION */
    @media (max-width: 768px) {
        /* ... */
        .user-name-title { font-size: 1.1rem !important; }
    }
  `;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[3000] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!stats) return null;

  const totalPiezas = stats.piezas_totales_contadas + stats.piezas_totales_verificadas;
  const nivel = Math.floor(totalPiezas / 5000) + 1;
  const progresoNivel = ((totalPiezas % 5000) / 5000) * 100;

  return (
    <div className="profile-wrapper animate-fade-in">
      <style>{styles}</style>
      
      {/* NAVBAR FLOTANTE */}
      <div className="profile-navbar">
        <div className="user-info-header">
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#000', flexShrink: 0 }}>
                {user.nombre.charAt(0)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <h2 className="user-name-title">{user.nombre}</h2>
                <div className="user-meta" style={{ color: '#8b949e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{background:'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:'10px', fontSize:'0.7rem', textTransform:'uppercase'}}>{user.role}</span>
                    <span>•</span>
                    <span>Nivel {nivel}</span>
                </div>
            </div>
        </div>
        
        <button 
            onClick={onClose} 
            style={{ 
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', 
                borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '10px'
            }}
        >
            <X size={24} />
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="profile-content">
        
        {/* BARRA DE PROGRESO */}
        <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#8b949e', fontSize: '0.9rem' }}>
                <span>PROGRESO NIVEL {nivel}</span>
                <span>{Math.round(progresoNivel)}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#30363d', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progresoNivel}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent) 0%, #a855f7 100%)', boxShadow: '0 0 10px var(--accent)' }}></div>
            </div>
        </div>

        {/* METRICAS GLOBALES */}
        <div className="metrics-grid">
            <div className="stat-card">
                <div style={labelStyle}><Trophy size={16} /> PIEZAS TOTALES</div>
                <div className="stat-value" style={valueStyle}>{totalPiezas.toLocaleString()}</div>
                <div style={subStyle}>Procesadas en tu carrera</div>
            </div>
            <div className="stat-card">
                <div style={labelStyle}><Clock size={16} /> TIEMPO ACTIVO</div>
                <div className="stat-value" style={{...valueStyle, fontSize:'1.8rem'}}>{stats.horas_totales_trabajadas}</div>
                <div style={subStyle}>Horas operativas</div>
            </div>
            <div className="stat-card">
                <div style={labelStyle}><Activity size={16} /> PRECISIÓN GLOBAL</div>
                <div className="stat-value" style={{...valueStyle, color: stats.precision_global > 98 ? '#10b981' : '#f59e0b'}}>
                    {Number(stats.precision_global).toFixed(1)}%
                </div>
                <div style={subStyle}>Índice de calidad</div>
            </div>
            <div className="stat-card">
                <div style={labelStyle}><Layers size={16} /> PROYECTOS</div>
                <div className="stat-value" style={valueStyle}>{stats.inventarios_trabajados}</div>
                <div style={subStyle}>Clientes auditados</div>
            </div>
        </div>

        {/* DESGLOSE POR ROL */}
        <div className="roles-grid">
            
            {/* PERFIL CONTADOR */}
            <div style={{ background: 'rgba(0, 224, 255, 0.03)', border: '1px solid rgba(0, 224, 255, 0.2)', borderRadius: '16px', padding: '30px' }}>
                <h3 style={{ margin: '0 0 20px 0', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Zap /> Desempeño: Contador
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Piezas Contadas</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                            {stats.piezas_totales_contadas.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Velocidad Promedio</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                            {stats.velocidad_promedio} <span style={{fontSize:'0.8rem', fontWeight:'normal'}}>p/h</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* PERFIL VERIFICADOR */}
            <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '30px' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck /> Desempeño: Verificador
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Piezas Verificadas</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                            {stats.piezas_totales_verificadas.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>Total SKUs</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                            {stats.skus_totales_procesados.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};

// Estilos Auxiliares
const labelStyle = { color: '#8b949e', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' };
const valueStyle = { fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--fg)', lineHeight: '1' };
const subStyle = { fontSize: '0.8rem', color: '#6b7280' };

export default GlobalProfile;