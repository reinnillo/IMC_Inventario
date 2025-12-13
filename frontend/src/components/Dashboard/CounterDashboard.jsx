// frontend/src/components/Dashboard/CounterDashboard.jsx
import React, { useState, useRef, useEffect } from "react";
import { Scan, Send, RotateCcw, Loader2, Wifi, WifiOff, MapPin, Box, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db, resetCountingSession } from "../../db/db"; 
import { useLiveQuery } from "dexie-react-hooks";
import { useToast } from "../../context/ToastContext";
import { API_URL } from "../../config/api";

const BATCH_LIMIT_MAX = 800;
const SYNC_CHUNK_SIZE = 500;

const CounterDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  
  // ESTADOS DE SESIÓN
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState({ area: "", ubicacion: "", marbete: "", isDynamic: false });
  
  // ESTADOS OPERATIVOS
  const [scanInput, setScanInput] = useState("");
  const [dynamicLocInput, setDynamicLocInput] = useState(""); // Nuevo input para ubicación dinámica
  const [isSyncing, setIsSyncing] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  
  const scanInputRef = useRef(null);
  const locInputRef = useRef(null); // Ref para el input de ubicación

  const items = useLiveQuery(() => db.counting_session.toArray(), []) || [];

  // --- ESTILOS RESPONSIVOS (Actualizados para modo dinámico) ---
  const styles = `
    .pda-container { display: flex; flex-direction: column; height: 100%; font-family: 'Segoe UI', sans-serif; }
    .pda-header { background: var(--card); padding: 15px; border-radius: 12px; border: 1px solid var(--accent2); margin-bottom: 15px; }
    .pda-card { background: var(--card); padding: 20px; border-radius: 12px; border: 1px solid var(--border); }
    
    .pda-input { width: 100%; padding: 15px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 8px; color: var(--fg); outline: none; font-size: 1.1rem; transition: all 0.2s; }
    .pda-input:focus { border-color: var(--accent2); background: rgba(255, 0, 128, 0.05); }
    
    .pda-btn-primary { background: var(--accent2); color: #fff; border: none; border-radius: 8px; padding: 15px; font-weight: bold; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; transition: transform 0.1s; }
    .pda-btn-primary:active { transform: scale(0.98); }
    
    .pda-btn-secondary { background: #374151; color: #e5e7eb; border: none; border-radius: 8px; padding: 15px; font-weight: bold; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; }

    .qty-input { width: 60px; text-align: center; padding: 8px; border-radius: 6px; background: var(--bg); border: 1px solid var(--border); color: var(--fg); font-size: 1rem; fontWeight: bold; outline: none; }
    .qty-input:focus { border-color: var(--accent2); }

    .grid-row { display: flex; gap: 10px; }
    
    /* Toggle Switch */
    .switch-container { display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 15px; cursor: pointer; border: 1px solid var(--border); }
    .switch-container.active { border-color: var(--accent2); background: rgba(255, 0, 128, 0.1); }
    .toggle { position: relative; width: 40px; height: 20px; background: #374151; border-radius: 20px; transition: 0.3s; }
    .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: 0.3s; }
    .switch-container.active .toggle { background: var(--accent2); }
    .switch-container.active .toggle::after { transform: translateX(20px); }

    @media (max-width: 768px) {
        .header-top { flex-direction: column; align-items: flex-start; gap: 10px; }
        .header-stats { width: 100%; display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; }
        .dynamic-row { flex-direction: column; }
    }
  `;

  const requestConfirm = (title, message, onConfirm) => setConfirmModal({ title, message, onConfirm });
  const closeConfirm = () => setConfirmModal(null);

  // --- LOGICA DE SESIÓN ---

  const startSession = (e) => {
    e.preventDefault();
    if (!sessionData.area || !sessionData.marbete) { toast.warning("Área y Marbete obligatorios"); return; }
    
    setSessionActive(true);
    localStorage.setItem('counter_meta', JSON.stringify({ ...sessionData, inicio: new Date() }));
    
    // Foco inteligente al iniciar
    setTimeout(() => {
        if (sessionData.isDynamic) {
            locInputRef.current?.focus(); // Si es dinámico, primero pide ubicación
        } else {
            scanInputRef.current?.focus();
        }
    }, 100);
  };

  useEffect(() => {
    const saved = localStorage.getItem('counter_meta');
    if (saved) { setSessionData(JSON.parse(saved)); setSessionActive(true); }
  }, []);

  const closeSession = async () => {
    if (items.length > 0) {
        requestConfirm("Datos Pendientes", "Hay datos sin sincronizar. ¿Salir y borrar?", async () => {
            await resetCountingSession();
            localStorage.removeItem('counter_meta');
            setSessionActive(false); 
            setSessionData({ area: "", ubicacion: "", marbete: "", isDynamic: false });
        });
    } else {
        localStorage.removeItem('counter_meta');
        setSessionActive(false);
        setSessionData({ area: "", ubicacion: "", marbete: "", isDynamic: false });
    }
  };

  // --- ESCANEO & GESTIÓN DE FOCO ---

  // Manejo de Enter en Ubicación Dinámica
  const handleLocKeyDown = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (dynamicLocInput.trim()) {
            scanInputRef.current?.focus(); // Salta al producto
        }
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!scanInput.trim()) return;
    
    // Validación Dinámica: Debe tener ubicación
    if (sessionData.isDynamic && !dynamicLocInput.trim()) {
        toast.warning("Debe ingresar una ubicación primero.");
        locInputRef.current?.focus();
        return;
    }

    const codigo = scanInput.trim();
    // La ubicación efectiva es la dinámica (si aplica) o la fija de la sesión
    const effectiveLoc = sessionData.isDynamic ? dynamicLocInput.trim() : sessionData.ubicacion;

    if (items.length >= BATCH_LIMIT_MAX) { toast.error("⛔ Límite de lote alcanzado."); return; }

    try {
        // En modo dinámico, la unicidad es (codigo + ubicación)
        // Pero para simplificar la corrección rápida en tabla, si ya existe el MISMO producto en la MISMA ubicación en esta sesión, sumamos.
        // Dexie query compleja:
        const existing = await db.counting_session
            .where({ codigo_producto: codigo })
            .filter(i => i.ubicacion === effectiveLoc)
            .first();

        if (existing) {
            await db.counting_session.update(existing.id, { cantidad: existing.cantidad + 1, updatedAt: new Date() });
        } else {
            await db.counting_session.add({
                codigo_producto: codigo, 
                cantidad: 1, 
                fecha_escaneo: new Date(),
                marbete: sessionData.marbete, 
                area: sessionData.area,
                ubicacion: effectiveLoc, // Guardamos la ubicación específica
                estado: 'pendiente'
            });
        }
        
        // --- FLUJO POST-ESCANEO ---
        setScanInput(""); 
        
        if (sessionData.isDynamic) {
            // En flujo 1:1, normalmente cambias de ubicación para el siguiente producto.
            // Limpiamos ubicación y devolvemos foco allí para el siguiente ciclo.
            setDynamicLocInput("");
            locInputRef.current?.focus();
        } else {
            // Flujo normal: Mantenemos foco en producto
            scanInputRef.current?.focus();
        }

    } catch (err) { console.error(err); }
  };

  const handleUpdateQuantity = async (id, newVal) => {
    const qty = parseInt(newVal) || 0;
    await db.counting_session.update(id, { cantidad: qty });
  };

  const handleQuantityKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); scanInputRef.current?.focus(); } };

  // --- SYNC ---
  const syncData = async () => {
    if (items.length === 0) return;
    setIsSyncing(true);

    try {
        const totalItems = items.length;
        let processed = 0;
        for (let i = 0; i < totalItems; i += SYNC_CHUNK_SIZE) {
            const chunk = items.slice(i, i + SYNC_CHUNK_SIZE);
            const payload = chunk.map(item => ({
                cliente_id: user.cliente_id || 1,
                area: item.area || sessionData.area, // Usamos la del item si existe (dinámica)
                ubicacion: item.ubicacion || sessionData.ubicacion, // Idem
                marbete: item.marbete, 
                codigo_producto: item.codigo_producto,
                cantidad: item.cantidad, 
                fecha_escaneo: item.fecha_escaneo,
                contador_id: user.id, nombre_contador: user.nombre,
                fecha_inicio_marbete: sessionData.inicio || new Date(),
                fecha_fin_marbete: new Date(), es_recuento: false
            }));

            const res = await fetch(`${API_URL}/api/conteos/sync`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: payload })
            });

            if (!res.ok) throw new Error("Error servidor");
            processed += chunk.length;
        }

        toast.success(`✅ Sincronizados ${processed} registros.`);
        await resetCountingSession(); 

    } catch (err) {
        toast.error("❌ Error Sync: " + err.message);
    } finally {
        setIsSyncing(false);
        // Devolver foco inteligente
        if (sessionData.isDynamic) locInputRef.current?.focus();
        else scanInputRef.current?.focus();
    }
  };

  // --- VISTA CONFIGURACIÓN (SETUP) ---
  if (!sessionActive) {
    return (
      <div className="dashboard-container animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <style>{styles}</style>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Scan size={64} color="var(--accent2)" />
          <h2 style={{ color: 'var(--accent2)' }}>Estación de Conteo</h2>
          <p style={{color:'#8b949e'}}>Configuración de Lote</p>
        </div>
        
        <form onSubmit={startSession} className="pda-card">
          {/* Toggle de Modo */}
          <div 
            className={`switch-container ${sessionData.isDynamic ? 'active' : ''}`} 
            onClick={() => setSessionData(prev => ({...prev, isDynamic: !prev.isDynamic, ubicacion: ""}))}
          >
            <div>
                <div style={{fontWeight:'bold', color: 'var(--fg)', display:'flex', alignItems:'center', gap:'8px'}}>
                    <MapPin size={16} /> Ubicación Dinámica (1:1)
                </div>
                <div style={{fontSize:'0.8rem', color:'#8b949e'}}>
                    Activar si la ubicación cambia con cada producto.
                </div>
            </div>
            <div className="toggle"></div>
          </div>

          <input className="pda-input" placeholder="Área / Zona General" value={sessionData.area} onChange={e => setSessionData({...sessionData, area: e.target.value})} required style={{marginBottom:'15px'}} />
          
          {/* Ubicación Fija solo si NO es dinámico */}
          {!sessionData.isDynamic && (
            <input className="pda-input" placeholder="Ubicación Fija (Opcional)" value={sessionData.ubicacion} onChange={e => setSessionData({...sessionData, ubicacion: e.target.value})} style={{marginBottom:'15px'}} />
          )}

          <input className="pda-input" placeholder="N° Marbete (Control)" value={sessionData.marbete} onChange={e => setSessionData({...sessionData, marbete: e.target.value})} required style={{marginBottom:'20px'}} />
          
          <button type="submit" className="pda-btn-primary">
            INICIAR {sessionData.isDynamic ? 'FLUJO DINÁMICO' : 'LOTE'}
          </button>
        </form>
      </div>
    );
  }

  const totalQty = items.reduce((acc, curr) => acc + curr.cantidad, 0);

  // --- VISTA ACTIVA ---
  return (
    <div className="pda-container">
      <style>{styles}</style>
      
      <div className="pda-header">
        <div className="header-top" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
                <h3 style={{ margin: 0, color: 'var(--accent2)' }}>M: {sessionData.marbete}</h3>
                <small style={{color:'#8b949e'}}>{sessionData.area} {sessionData.isDynamic ? '(Dinámico)' : sessionData.ubicacion}</small>
            </div>
             <div style={{display:'flex', alignItems:'center', gap:'5px', color:'#8b949e', fontSize:'0.7rem'}}>
                <WifiOff size={12} /> OFFLINE
            </div>
        </div>
        <div className="header-stats">
           <div style={{textAlign:'left'}}><div style={{fontSize:'0.7rem', color:'#8b949e'}}>REGISTROS</div><div style={{fontSize:'1.1rem', fontWeight:'bold'}}>{items.length}</div></div>
           <div style={{textAlign:'right'}}><div style={{fontSize:'0.7rem', color:'#8b949e'}}>TOTAL PIEZAS</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color:'var(--fg)' }}>{totalQty}</div></div>
        </div>
      </div>

      {/* FORMULARIO DE ESCANEO DUAL */}
      <form onSubmit={handleScanSubmit} style={{ marginBottom: '10px', display:'flex', flexDirection:'column', gap:'10px' }}>
        
        {/* Input Ubicación (Solo visible en modo dinámico) */}
        {sessionData.isDynamic && (
            <div style={{position:'relative'}}>
                <MapPin size={18} style={{position:'absolute', top:15, left:15, color:'var(--accent2)'}} />
                <input 
                    ref={locInputRef}
                    className="pda-input" 
                    style={{paddingLeft:'45px', borderColor: dynamicLocInput ? 'var(--success)' : 'var(--border)'}} 
                    placeholder="Escanear Ubicación..." 
                    value={dynamicLocInput} 
                    onChange={e => setDynamicLocInput(e.target.value)} 
                    onKeyDown={handleLocKeyDown}
                    disabled={isSyncing} 
                />
            </div>
        )}

        <div style={{display:'flex', gap:'10px'}}>
            <div style={{position:'relative', flex:1}}>
                <Box size={18} style={{position:'absolute', top:15, left:15, color: sessionData.isDynamic ? '#8b949e' : 'var(--accent2)'}} />
                <input 
                    ref={scanInputRef} 
                    className="pda-input" 
                    style={{paddingLeft:'45px', border:'2px solid var(--accent2)', fontSize:'1.1rem', fontWeight:'bold'}} 
                    placeholder="Escanear Producto..." 
                    value={scanInput} 
                    onChange={e => setScanInput(e.target.value)} 
                    disabled={isSyncing} 
                    autoFocus={!sessionData.isDynamic}
                />
            </div>
            {/* Botón visual para submit en móvil si no hay enter físico */}
            <button type="submit" style={{width:'50px', background:'var(--accent2)', border:'none', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'white'}}><ArrowRight /></button>
        </div>
      </form>

      {/* TABLA */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <table className="data-table" style={{width:'100%', borderCollapse:'collapse'}}>
          <thead style={{position:'sticky', top:0, background:'var(--card)', zIndex:10}}>
            <tr>
                <th style={{padding:'10px', textAlign:'left', borderBottom:'1px solid var(--border)', color:'#8b949e'}}>Producto / Ubic</th>
                <th style={{padding:'10px', textAlign:'center', borderBottom:'1px solid var(--border)', color:'#8b949e'}}>Cant.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <td style={{ padding: '10px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize:'1rem', fontWeight:'bold' }}>{item.codigo_producto}</div>
                    {/* Mostrar ubicación específica si es dinámico o si la tiene guardada */}
                    {(item.ubicacion && sessionData.isDynamic) && (
                        <div style={{fontSize:'0.75rem', color:'var(--accent)', display:'flex', alignItems:'center', gap:'4px'}}>
                            <MapPin size={10}/> {item.ubicacion}
                        </div>
                    )}
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                    <input 
                        type="number" 
                        value={item.cantidad} 
                        onChange={(e) => handleUpdateQuantity(item.id, e.target.value)} 
                        onKeyDown={handleQuantityKeyDown} 
                        onFocus={(e) => e.target.select()} 
                        className="qty-input" 
                    />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid-row" style={{ marginTop: '15px' }}>
        <button onClick={closeSession} disabled={isSyncing} className="pda-btn-secondary"><RotateCcw size={20} /> Salir</button>
        <button onClick={syncData} className="pda-btn-primary" disabled={items.length === 0 || isSyncing}>
          {isSyncing ? <Loader2 className="animate-spin" /> : <Send size={20} />} {items.length > 0 ? `ENVIAR (${items.length})` : 'VACÍO'}
        </button>
      </div>

      {confirmModal && (
            <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}}>
                <div className="pda-card" style={{width:'100%', maxWidth:'400px', border:'1px solid var(--accent2)'}}>
                    <h3 style={{marginTop:0, color:'var(--fg)'}}>{confirmModal.title}</h3>
                    <p style={{color:'#8b949e', fontSize:'1.1rem', lineHeight:'1.5', marginBottom:'20px'}}>{confirmModal.message}</p>
                    <div className="grid-row">
                        <button onClick={closeConfirm} className="pda-btn-secondary" style={{background:'#1f2937'}}>Cancelar</button>
                        <button onClick={()=>{confirmModal.onConfirm(); closeConfirm();}} className="pda-btn-primary">Confirmar</button>
                    </div>
                </div>
            </div>
      )}
    </div>
  );
};

export default CounterDashboard;