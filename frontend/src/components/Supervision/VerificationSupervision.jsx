// frontend/src/components/Supervision/VerificationSupervision.jsx
import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle, RefreshCw, Search } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useClients } from "../../context/ClientContext";
import { API_URL } from "../../config/api";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ background: 'var(--card-alt)', padding: '5px 10px', border: '1px solid var(--border)', borderRadius: '6px' }}>
          <p className="label" style={{fontWeight:'bold', margin: '0 0 5px 0'}}>{label}</p>
          <p className="intro" style={{color: '#10b981', margin:0}}>{`Correctos: ${payload.find(p => p.dataKey === 'count')?.value || 0}`}</p>
          <p className="intro" style={{color: '#ef4444', margin:0}}>{`Errores: ${payload.find(p => p.dataKey === 'errorsFound')?.value || 0}`}</p>
        </div>
      );
    }
    return null;
};

const VerificationSupervision = () => {
  const { clients } = useClients();
  const [selectedClient, setSelectedClient] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedClient) return;
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedClient]);

  const fetchData = async () => {
    if (!selectedClient) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/supervision/verificacion?cliente_id=${selectedClient}`);
      const result = await res.json();
      if (res.ok) setData(result);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const styles = `
    .supervision-layout { 
        display: grid; 
        grid-template-columns: 2fr 1fr; 
        gap: 20px; 
        flex: 1; 
        overflow: hidden; 
        min-height: 0; 
        height: 100%;
    }
    
    .left-col {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
        gap: 20px;
    }

    .kpi-grid { 
        display: grid; 
        grid-template-columns: repeat(4, 1fr); 
        gap: 10px; 
        flex-shrink: 0; 
    }
    
    .feed-panel { 
        flex: 1; 
        background: var(--card); 
        borderRadius: 12px; 
        border: 1px solid var(--border); 
        overflow: hidden; 
        display: flex; 
        flex-direction: column; 
        min-height: 0; 
    }
    
    .table-scroll-area {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
    }
    
    .data-table { width: 100%; border-collapse: collapse; fontSize: 0.9rem; min-width: 600px; }
    .data-table th { background: var(--bg); position: sticky; top: 0; padding: 12px 10px; text-align: left; color: #8b949e; z-index: 5; border-bottom: 1px solid var(--border); }
    .data-table td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }

    @media (max-width: 1024px) {
        .supervision-layout { 
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            height: auto;
            min-height: 100%;
        }
        
        .left-col {
            overflow: visible;
            height: auto;
            flex: none;
        }

        .kpi-grid { 
            grid-template-columns: repeat(2, 1fr); 
            margin-bottom: 20px;
        }
        
        .feed-panel { 
            min-height: 400px;
            flex: none;
        }
    }
    @media (max-width: 480px) {
        .kpi-grid { grid-template-columns: 1fr; }
    }
    .recharts-text {
        fill: #8b949e;
        font-size: 0.8rem;
    }
    .recharts-legend-item-text {
        color: #8b949e !important;
    }
  `;

  return (
    <div className="dashboard-container animate-fade-in" style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <style>{styles}</style>
      
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'10px', flexShrink: 0}}>
        <div>
            <h2 style={{color:'var(--success)', display:'flex', gap:'10px', alignItems:'center', margin:0}}><ShieldCheck /> Centro de Auditoría</h2>
            <p style={{color:'#8b949e', margin:'5px 0 0 0', fontSize:'0.9rem'}}>Supervisión de calidad en tiempo real.</p>
        </div>
        <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
            <select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)} style={{padding:'10px', borderRadius:'8px', background:'var(--card)', color:'var(--fg)', border:'1px solid var(--border)', minWidth:'200px'}}>
                <option value="">-- Seleccionar Cliente --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <button onClick={fetchData} className="icon-btn" title="Refrescar"><RefreshCw size={18} className={loading?'animate-spin':''} /></button>
        </div>
      </div>

      {!data ? (
        <div style={{textAlign:'center', padding:'50px', color:'#8b949e'}}><ShieldCheck size={48} style={{opacity:0.2}} /><p>Seleccione un cliente.</p></div>
      ) : (
        <div className="supervision-layout">
            <div className="left-col">
                <div className="kpi-grid">
                    <div className="stat-card" style={{borderLeftColor:'var(--success)'}}><small>AUDITADO</small><div style={{fontSize:'1.5rem', fontWeight:'bold'}}>{data.stats.totalItemsVerificados}</div></div>
                    <div className="stat-card" style={{borderLeftColor:'#ef4444'}}><small>ERROR</small><div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#ef4444'}}>{data.stats.itemsConError}</div></div>
                    <div className="stat-card" style={{borderLeftColor:'#3b82f6'}}><small>PIEZAS</small><div style={{fontSize:'1.5rem', fontWeight:'bold'}}>{data.stats.totalPiezasAuditadas}</div></div>
                    <div className="stat-card" style={{borderLeftColor: data.stats.precisionGlobal > 95 ? '#10b981' : '#f59e0b'}}><small>PRECISIÓN</small><div style={{fontSize:'1.5rem', fontWeight:'bold'}}>{data.stats.precisionGlobal}%</div></div>
                </div>

                <div className="feed-panel">
                    <div style={{padding:'15px', borderBottom:'1px solid var(--border)', fontWeight:'bold', color:'var(--fg)', display:'flex', alignItems:'center', gap:'8px', flexShrink: 0}}>
                        <Search size={16}/> Últimas Verificaciones
                    </div>
                    <div className="table-scroll-area">
                        <table className="data-table">
                            <thead><tr><th>Producto</th><th style={{textAlign:'center'}}>Sis</th><th style={{textAlign:'center'}}>Fin</th><th style={{textAlign:'center'}}>Dif</th><th style={{textAlign:'right'}}>Auditor</th></tr></thead>
                            <tbody>
                                {data.recentVerifications.map((item, i) => {
                                    const diff = Number(item.diferencia);
                                    return (
                                        <tr key={i} style={{background: diff !== 0 ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}}>
                                            <td style={{padding:'10px'}}>
                                                <div style={{fontFamily:'monospace', color: diff !== 0 ? '#ef4444' : 'var(--fg)', fontWeight:'bold'}}>{item.codigo_producto}</div>
                                                <div style={{fontSize:'0.75rem', color:'#8b949e', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'200px'}}>{item.descripcion}</div>
                                            </td>
                                            <td style={{textAlign:'center'}}>{item.cantidad_sistema}</td>
                                            <td style={{textAlign:'center', fontWeight:'bold'}}>{item.cantidad_final}</td>
                                            <td style={{textAlign:'center', fontWeight:'bold', color: diff !== 0 ? '#ef4444' : '#10b981'}}>{diff > 0 ? `+${diff}` : diff}</td>
                                            <td style={{textAlign:'right', padding:'10px'}}>
                                                <div style={{fontSize:'0.85rem'}}>{item.nombre_verificador}</div>
                                                <div style={{fontSize:'0.7rem', color:'#8b949e'}}>M: {item.marbete}</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div style={{background:'var(--card)', borderRadius:'12px', border:'1px solid var(--border)', padding:'0', overflow:'hidden', display:'flex', flexDirection:'column', height:'100%'}}>
                <div style={{padding:'15px', borderBottom:'1px solid var(--border)', flexShrink: 0}}>
                    <h4 style={{margin:0, color:'var(--success)', display:'flex', alignItems:'center', gap:'8px'}}><CheckCircle size={18}/> Auditores Activos</h4>
                </div>
                <div style={{padding: '15px 15px 0 15px'}}>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data.activeVerifiers} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="nombre" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}}/>
                            <Legend />
                            <Bar name="Correctos" dataKey="count" stackId="a" fill="#10b981" />
                            <Bar name="Errores" dataKey="errorsFound" stackId="a" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div style={{overflowY:'auto', flex:1, padding:'15px', marginTop:'15px', borderTop:'1px solid var(--border)'}}>
                    <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                        {data.activeVerifiers.map((v, i) => (
                            <div key={i} style={{padding:'12px', background:'rgba(255,255,255,0.02)', borderRadius:'8px', border:'1px solid var(--border)'}}>
                                <div style={{fontWeight:'bold', marginBottom:'5px', fontSize:'0.9rem'}}>{v.nombre}</div>
                                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem'}}>
                                    <span style={{color:'#8b949e'}}>OK: <strong style={{color:'var(--fg)'}}>{v.count}</strong></span>
                                    <span style={{color: v.errorsFound > 0 ? '#ef4444' : '#8b949e'}}>Err: <strong style={{color: v.errorsFound > 0 ? '#ef4444' : 'var(--fg)'}}>{v.errorsFound}</strong></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default VerificationSupervision;