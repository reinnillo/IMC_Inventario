// frontend/src/components/Supervision/CountingSupervision.jsx
import React, { useState, useEffect } from "react";
import { Activity, UserCheck, Box, RefreshCw, Layers } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useClients } from "../../context/ClientContext";
import { API_URL } from "../../config/api";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ background: 'var(--card-alt)', padding: '5px 10px', border: '1px solid var(--border)', borderRadius: '6px' }}>
          <p className="label">{`${label} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
};

const CountingSupervision = () => {
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
      const res = await fetch(`${API_URL}/api/supervision/conteo?cliente_id=${selectedClient}`);
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

    .table-scroll-area { flex: 1; overflow-y: auto; min-height: 0; }
    
    .right-col { 
        display: flex; 
        flex-direction: column; 
        gap: 20px; 
        overflow-y: auto; 
        height: 100%; 
        padding-bottom: 10px;
    }
    
    .data-table { width: 100%; border-collapse: collapse; fontSize: 0.9rem; }
    .data-table th { background: var(--bg); position: sticky; top: 0; padding: 12px 10px; text-align: left; color: #8b949e; z-index: 5; border-bottom: 1px solid var(--border); }
    .data-table td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    
    @media (max-width: 1024px) {
      .supervision-layout { 
          display: flex;
          flex-direction: column; 
          overflow-y: auto;
          height: auto;
          min-height: 100%;
          padding-right: 5px;
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
      
      .right-col {
          overflow: visible;
          height: auto;
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
  `;

  return (
    <div className="dashboard-container animate-fade-in" style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <style>{styles}</style>
      
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'10px', flexShrink: 0}}>
        <div>
            <h2 style={{color:'var(--accent)', display:'flex', gap:'10px', alignItems:'center', margin:0}}><Activity /> Torre de Control</h2>
            <p style={{color:'#8b949e', margin:'5px 0 0 0', fontSize:'0.9rem'}}>Monitoreo de conteo en tiempo real.</p>
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
        <div style={{textAlign:'center', padding:'50px', color:'#8b949e'}}><Box size={48} style={{opacity:0.2}} /><p>Seleccione un cliente para ver la actividad.</p></div>
      ) : (
        <div className="supervision-layout">
            
            <div className="left-col">
                <div className="kpi-grid">
                    <div className="stat-card"><small style={{color:'#8b949e'}}>TOTAL PIEZAS</small><div style={{fontSize:'1.5rem', fontWeight:'bold', color:'var(--fg)'}}>{data.stats.totalPiezas.toLocaleString()}</div></div>
                    <div className="stat-card"><small style={{color:'#8b949e'}}>MARBETES</small><div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#f59e0b'}}>{data.stats.marbetesAbiertos}</div></div>
                    <div className="stat-card"><small style={{color:'#8b949e'}}>REGISTROS</small><div style={{fontSize:'1.5rem', fontWeight:'bold', color:'var(--accent)'}}>{data.stats.totalRegistros}</div></div>
                    <div className="stat-card"><small style={{color:'#8b949e'}}>EQUIPO</small><div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#10b981'}}>{data.stats.contadoresActivos}</div></div>
                </div>

                <div className="feed-panel">
                    <div style={{padding:'15px', borderBottom:'1px solid var(--border)', fontWeight:'bold', color:'var(--accent)', display:'flex', alignItems:'center', gap:'8px', flexShrink: 0}}>
                        <Activity size={16}/> Live Feed (Últimos 50 escaneos)
                    </div>
                    <div className="table-scroll-area">
                        <table className="data-table">
                            <thead><tr><th>Hora</th><th>Contador</th><th>Marbete</th><th style={{textAlign:'right'}}>Qty</th></tr></thead>
                            <tbody>
                                {data.recentScans.map((scan, i) => (
                                    <tr key={i}>
                                        <td style={{fontFamily:'monospace', color:'#8b949e', padding:'10px'}}>
                                            {new Date(scan.fecha_escaneo).toLocaleTimeString()}
                                        </td>
                                        <td style={{padding:'10px'}}>{scan.nombre_contador}</td>
                                        <td style={{padding:'10px', color:'var(--accent)'}}>{scan.marbete} <span style={{fontSize:'0.7rem', color:'#6b7280'}}>({scan.area})</span></td>
                                        <td style={{padding:'10px', textAlign:'right'}}>
                                            <span style={{color:'var(--fg)'}}>{scan.codigo_producto}</span>
                                            <span style={{background:'rgba(255,255,255,0.1)', padding:'2px 6px', borderRadius:'4px', marginLeft:'8px', fontWeight:'bold'}}>+{scan.cantidad}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="right-col">
                <div style={{background:'var(--card)', borderRadius:'12px', border:'1px solid var(--border)', padding:'15px', flexShrink: 0}}>
                    <h4 style={{margin:'0 0 15px 0', color:'#10b981', display:'flex', alignItems:'center', gap:'8px'}}><UserCheck size={18}/> Productividad</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.activeCounters} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="nombre" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}}/>
                            <Bar dataKey="qty" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                    <div style={{display:'flex', flexDirection:'column', gap:'10px', maxHeight: '200px', overflowY: 'auto', marginTop:'15px', borderTop:'1px solid var(--border)', paddingTop:'10px'}}>
                        {data.activeCounters.map((c, i) => (
                            <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.9rem', padding:'8px', background:'rgba(255,255,255,0.02)', borderRadius:'6px'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <div style={{width:'24px', height:'24px', background:'#374151', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem'}}>{i+1}</div>
                                    <span>{c.nombre}</span>
                                </div>
                                <strong style={{color:'#10b981'}}>{c.qty}</strong>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{background:'var(--card)', borderRadius:'12px', border:'1px solid var(--border)', padding:'15px', flex: 1, display: 'flex', flexDirection: 'column'}}>
                    <h4 style={{margin:'0 0 15px 0', color:'#f59e0b', display:'flex', alignItems:'center', gap:'8px', flexShrink: 0}}><Layers size={18}/> Marbetes Top</h4>
                     <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.activeMarbetes} margin={{ top: 5, right: 20, left: -20, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="marbete" interval={0} angle={-45} textAnchor="end" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}}/>
                            <Bar dataKey="qty" fill="#f59e0b" />
                        </BarChart>
                    </ResponsiveContainer>
                    <div style={{display:'flex', flexDirection:'column', gap:'8px', overflowY: 'auto', flex: 1, marginTop:'15px', borderTop:'1px solid var(--border)', paddingTop:'10px'}}>
                        {data.activeMarbetes.map((m, i) => (
                            <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem', borderBottom:'1px dashed rgba(255,255,255,0.1)', paddingBottom:'5px'}}>
                                <span>{m.marbete}</span>
                                <span style={{color:'#8b949e'}}>{m.qty} items</span>
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

export default CountingSupervision;