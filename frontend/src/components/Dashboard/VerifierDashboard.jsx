// frontend/src/components/Dashboard/VerifierDashboard.jsx
import React, { useState, useRef, useEffect } from "react";
import { 
  ShieldCheck, Search, Clock, CloudDownload,
  RotateCcw, CheckCircle, Loader2, Database, AlertTriangle, X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useClients } from "../../context/ClientContext";
import { db, resetVerificationSession, resetClientDB } from "../../db/db";
import { useToast } from "../../context/ToastContext"; 
import { API_URL } from "../../config/api";

const VerifierDashboard = () => {
  const { user } = useAuth();
  const { clients } = useClients();
  const toast = useToast(); 

  // ESTADOS
  const [activeMarbete, setActiveMarbete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [marbeteInput, setMarbeteInput] = useState("");
  
  const [localDbCount, setLocalDbCount] = useState(0);
  
  const [quickFilter, setQuickFilter] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);

  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const [confirmModal, setConfirmModal] = useState(null);

  const quickFilterRef = useRef(null);

  const clientName = clients.find(c => c.id === (user.cliente_id || 1))?.nombre || "Cliente General";

  // --- SAFETY NET ---
  useEffect(() => {
    if (!activeMarbete) {
        setLoading(false);
        setIsSaving(false);
    }
  }, [activeMarbete]);

  // --- MONITOREO LOCAL ---
  useEffect(() => {
    const checkLocalDB = async () => {
        try {
            const count = await db.client_products.count();
            setLocalDbCount(count);
        } catch(e) { console.error(e); }
    };
    checkLocalDB();
  }, [dbLoading]); 

  // --- QUERY REACTIVO ---
  useEffect(() => {
    const queryDB = async () => {
        if (!activeMarbete) return;
        let collection = db.verification_session;

        try {
            if (quickFilter.trim()) {
                const filterUpper = quickFilter.trim().toUpperCase();
                const results = await collection
                    .filter(item => 
                        item.codigo_producto.toUpperCase().includes(filterUpper) ||
                        (item.descripcion && item.descripcion.toUpperCase().includes(filterUpper))
                    )
                    .toArray();
                 setFilteredItems(results);
            } else {
                const all = await collection.toArray();
                setFilteredItems(all);
            }
        } catch (e) { console.error(e); }
    };
    queryDB();
  }, [quickFilter, activeMarbete]); 

  // Cronómetro
  useEffect(() => {
    let interval;
    if (activeMarbete && startTime) {
      interval = setInterval(() => setElapsedTime(Math.floor((new Date() - startTime) / 1000)), 1000);
    }
    return () => clearInterval(interval);
  }, [activeMarbete, startTime]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // --- ESTILOS RESPONSIVOS ---
  const styles = `
    .pda-container {
      display: flex; flex-direction: column; height: 100%;
      font-family: 'Segoe UI', sans-serif;
    }
    .pda-header {
      background: var(--card); padding: 15px; border-radius: 12px;
      border: 1px solid var(--success); margin-bottom: 15px;
      display: flex; justify-content: space-between; alignItems: center;
    }
    .pda-card {
      background: var(--card); padding: 20px; border-radius: 12px;
      border: 1px solid var(--border); margin-bottom: 20px;
    }
    .pda-input {
      width: 100%; padding: 15px; background: rgba(0,0,0,0.3);
      border: 1px solid var(--border); border-radius: 8px;
      color: var(--fg); outline: none; font-size: 1.1rem;
      transition: border 0.2s;
    }
    .pda-input:focus { border-color: var(--success); background: rgba(0, 255, 157, 0.05); }
    
    .pda-btn-primary {
      background: var(--success); color: #000; border: none;
      border-radius: 8px; padding: 15px; font-weight: bold;
      font-size: 1rem; cursor: pointer; display: flex; 
      align-items: center; justify-content: center; gap: 8px;
      width: 100%; text-transform: uppercase;
    }
    .pda-btn-secondary {
      background: #374151; color: #e5e7eb; border: none;
      border-radius: 8px; padding: 15px; font-weight: bold;
      font-size: 1rem; cursor: pointer; display: flex; 
      align-items: center; justify-content: center; gap: 8px;
      width: 100%;
    }
    
    .table-container { flex: 1; overflow-y: auto; background: var(--card); border-radius: 12px; border: 1px solid var(--border); }
    .data-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    
    .data-table th { 
        padding: 12px; color: #8b949e; font-size: 0.8rem; text-transform: uppercase; 
        position: sticky; top: 0; background: var(--card); z-index: 10;
        border-bottom: 1px solid var(--success);
    }
    
    .data-table td { 
        padding: 10px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; 
    }

    .qty-input {
      width: 100%; max-width: 70px; text-align: center; padding: 12px; border-radius: 8px;
      border: 1px solid var(--border); background: var(--bg); color: var(--fg);
      font-weight: bold; font-size: 1.1rem; outline: none; display: block; margin: 0 auto;
    }
    .qty-input:focus { border-color: var(--success); }
    
    .grid-row { display: flex; gap: 10px; }
    .grid-col-1 { flex: 1; }
    .grid-col-2 { flex: 2; }

    @media (max-width: 768px) {
      .pda-header { flex-direction: column; align-items: flex-start; gap: 10px; }
      .header-stats { width: 100%; display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; }
      .grid-row { flex-direction: column; }
    }
  `;

  // --- HELPERS DE CONFIRMACIÓN TÁCTIL ---
  const requestConfirm = (title, message, onConfirm) => {
    setConfirmModal({ title, message, onConfirm });
  };

  const closeConfirm = () => setConfirmModal(null);

  // --- ACCIONES ---

  const handleDownloadDB = async () => {
    requestConfirm(
        "Actualizar Base de Datos",
        `¿Descargar BD actualizada para ${clientName}? Esto reemplazará la data local.`,
        async () => {
            setDbLoading(true);
            try {
                await resetClientDB(); 
                const res = await fetch(`${API_URL}/api/inventario?cliente_id=${user.cliente_id || 1}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error);

                if (data.inventory.length === 0) {
                    toast.warning("El inventario del cliente está vacío.");
                } else {
                    const rawProducts = data.inventory.map(p => ({
                        codigo_producto: String(p.codigo_producto).trim(), 
                        descripcion: p.descripcion,
                        cantidad: p.cantidad, barcode: p.barcode,
                        area: p.area, ubicacion: p.ubicacion 
                    }));

                    const uniqueMap = new Map();
                    rawProducts.forEach(p => { if(p.codigo_producto) uniqueMap.set(p.codigo_producto, p); });
                    const uniqueProducts = Array.from(uniqueMap.values());
                    
                    await db.client_products.bulkPut(uniqueProducts);
                    toast.success(`BD Sincronizada: ${uniqueProducts.length} productos.`);
                }
            } catch (err) {
                toast.error("Error descarga: " + err.message);
            } finally {
                setDbLoading(false);
            }
        }
    );
  };

  const handleFetchMarbete = async (e) => {
    e.preventDefault();
    if (!marbeteInput || marbeteInput.trim() === "") return;

    setLoading(true); 
    try {
      try { await resetVerificationSession(); } catch (e) {}

      const safeClientId = user.cliente_id || 1;
      const response = await fetch(`${API_URL}/api/verificacion/marbete?marbete=${marbeteInput}&cliente_id=${safeClientId}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al buscar marbete");
      
      if (data.items.length === 0) {
        toast.warning("Marbete vacío o inexistente.");
        setLoading(false); return;
      }

      const enrichedItems = await Promise.all(data.items.map(async (serverItem) => {
        const localProduct = await db.client_products.get({ codigo_producto: serverItem.codigo_producto });
        if (localProduct) {
            return {
                ...serverItem,
                descripcion: localProduct.descripcion, 
                cantidad_sistema: localProduct.cantidad, 
                // Prioridad: Server (Contador) > Local (Maestro) para mostrar dónde se contó
                area: serverItem.area || localProduct.area, 
                ubicacion: serverItem.ubicacion || localProduct.ubicacion,
                diferencia: serverItem.cantidad_conteo - localProduct.cantidad,
                en_sistema: true
            };
        } else {
            // Si es nuevo, usamos lo que viene del contador
            return { ...serverItem, area: serverItem.area, ubicacion: serverItem.ubicacion, en_sistema: false };
        }
      }));

      await db.verification_session.bulkAdd(enrichedItems.map(item => ({ ...item, marbete: data.marbete })));

      setActiveMarbete(data.marbete);
      setStartTime(new Date()); 
      setElapsedTime(0);
      setTimeout(() => quickFilterRef.current?.focus(), 300);

    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setLoading(false); 
    }
  };

  const handleVerifyChange = async (id, newVal) => {
    setFilteredItems(prev => prev.map(i => i.id === id ? { ...i, cantidad_verificada: newVal } : i));
    const val = newVal === "" ? 0 : Number(newVal);
    await db.verification_session.update(id, { cantidad_verificada: val });
  };

  const handleSave = async () => {
    const allItems = await db.verification_session.toArray();
    const withDiff = allItems.filter(i => (i.cantidad_verificada - i.cantidad_sistema) !== 0);
    
    requestConfirm(
        "Finalizar Marbete",
        withDiff.length > 0 ? `⚠️ Hay ${withDiff.length} diferencias. ¿Cerrar marbete?` : "¿Confirmar cierre de marbete?",
        async () => {
            setIsSaving(true);
            const safeClientId = user.cliente_id || 1;
            const meta = {
              cliente_id: safeClientId, marbete: activeMarbete, verificador_id: user.id,
              nombre_verificador: user.nombre, tiempo_verificacion: elapsedTime 
            };

            try {
              const response = await fetch(`${API_URL}/api/verificacion/sync`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: allItems, meta }) 
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error);

              toast.success(`Marbete ${activeMarbete} verificado.`);
              await resetVerificationSession();
              setActiveMarbete(null); setMarbeteInput(""); setQuickFilter("");
            } catch (err) {
              toast.error("Error Sync: " + err.message);
            } finally {
              setIsSaving(false);
            }
        }
    );
  };

  // --- VISTAS ---
  
  if (!activeMarbete) {
    return (
      <div className="dashboard-container animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <style>{styles}</style>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <ShieldCheck size={64} color="var(--success)" />
          <h2 style={{ color: 'var(--success)', margin: '10px 0' }}>Verificación</h2>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '5px 15px', borderRadius: '15px', display: 'inline-block' }}>
            <span style={{ color: '#8b949e', fontSize: '0.8rem' }}>CLIENTE: </span>
            <strong style={{ color: 'var(--fg)' }}>{clientName}</strong>
          </div>
        </div>

        <div className="pda-card" style={{ borderColor: 'var(--success)' }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                <h4 style={{ margin: 0, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={18} /> BD Local
                </h4>
                <span style={{fontSize:'0.8rem', color: localDbCount > 0 ? 'var(--fg)' : '#f59e0b'}}>
                    {localDbCount} productos
                </span>
            </div>
            <button onClick={handleDownloadDB} disabled={dbLoading} className="pda-btn-secondary" style={{background:'var(--bg)', border:'1px solid var(--success)', color:'var(--success)'}}>
                {dbLoading ? <Loader2 className="animate-spin" size={18} /> : <CloudDownload size={18} />}
                {dbLoading ? 'Sincronizando...' : 'Actualizar BD'}
            </button>
        </div>

        <form onSubmit={handleFetchMarbete} className="pda-card">
          <label style={{ display: 'block', color: '#8b949e', marginBottom: '10px' }}>Marbete a verificar:</label>
          <div className="grid-row">
            <input 
              className="pda-input grid-col-2"
              placeholder="Escanear..." 
              value={marbeteInput}
              onChange={e => setMarbeteInput(e.target.value)}
              autoFocus
              required
            />
            <button type="submit" disabled={loading} className="pda-btn-primary grid-col-1">
              {loading ? <Loader2 className="animate-spin" /> : <Search />} BUSCAR
            </button>
          </div>
        </form>

        {confirmModal && (
            <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}}>
                <div className="pda-card" style={{width:'100%', maxWidth:'400px', border:'1px solid var(--accent)'}}>
                    <h3 style={{marginTop:0, color:'var(--fg)'}}>{confirmModal.title}</h3>
                    <p style={{color:'#8b949e', fontSize:'1rem', lineHeight:'1.5', marginBottom:'20px'}}>{confirmModal.message}</p>
                    <div className="grid-row">
                        <button onClick={closeConfirm} className="pda-btn-secondary">Cancelar</button>
                        <button onClick={()=>{confirmModal.onConfirm(); closeConfirm();}} className="pda-btn-primary">Confirmar</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // 2. ACTIVA
  return (
    <div className="pda-container">
      <style>{styles}</style>
      
      <div className="pda-header">
        <div>
            <div style={{fontSize:'0.8rem', color:'#8b949e'}}>MARBETE</div>
            <h2 style={{margin:0, color:'var(--success)'}}>{activeMarbete}</h2>
        </div>
        <div className="header-stats">
           <div style={{textAlign:'center', marginRight:'15px'}}>
               <div style={{fontSize:'0.8rem', color:'#8b949e'}}>TIEMPO</div>
               <div style={{fontSize:'1.1rem', fontFamily:'monospace', display:'flex', alignItems:'center', gap:'5px'}}>
                 <Clock size={14} /> {formatTime(elapsedTime)}
               </div>
           </div>
           <div style={{textAlign:'right'}}>
               <div style={{fontSize:'0.8rem', color:'#8b949e'}}>ITEMS</div>
               <div style={{fontSize:'1.2rem', fontWeight:'bold'}}>{filteredItems.length}</div>
           </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input ref={quickFilterRef} className="pda-input" placeholder="Filtrar..." value={quickFilter} onChange={e => setQuickFilter(e.target.value)} style={{flex:1}} />
        {quickFilter && <button onClick={() => setQuickFilter("")} style={{padding:'0 20px', background:'var(--card)', border:'1px solid var(--border)', borderRadius:'8px', color:'#8b949e'}}><X /></button>}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{width:'40%', textAlign:'left'}}>Producto</th>
              <th style={{width:'15%', textAlign:'center'}}>Sis</th>
              <th style={{width:'15%', textAlign:'center'}}>Fís</th>
              <th style={{width:'30%', textAlign:'center'}}>Final</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, idx) => {
              const hasDiff = (Number(item.cantidad_verificada) - item.cantidad_sistema) !== 0;
              return (
                <tr key={item.id || idx}>
                  <td>
                    <div style={{ fontWeight: 'bold', color: 'var(--fg)', fontSize:'1rem' }}>{item.codigo_producto}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>{item.descripcion}</div>
                    {/* Siempre mostramos ubicación si existe, sin condiciones dinámicas */}
                    {(item.area || item.ubicacion) && (
                        <div style={{fontSize:'0.7rem', color:'var(--accent)', marginTop:'2px'}}>
                            {item.area} {item.ubicacion ? `- ${item.ubicacion}` : ''}
                        </div>
                    )}
                  </td>
                  <td style={{textAlign:'center', color:'#8b949e'}}>{item.cantidad_sistema}</td>
                  <td style={{textAlign:'center', fontWeight:'bold'}}>{item.cantidad_conteo}</td>
                  <td style={{textAlign:'center'}}>
                    <input 
                      type="number" 
                      className="qty-input"
                      value={item.cantidad_verificada} 
                      onChange={(e) => handleVerifyChange(item.id, e.target.value)} 
                      style={{ 
                        borderColor: hasDiff ? '#f59e0b' : 'var(--border)',
                        color: hasDiff ? '#f59e0b' : 'var(--success)' 
                      }} 
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid-row" style={{ marginTop: '15px' }}>
        <button 
            onClick={() => requestConfirm("Salir", "¿Salir de este marbete? Se perderán los cambios no guardados.", async () => { await resetVerificationSession(); setActiveMarbete(null); setMarbeteInput(""); })} 
            className="pda-btn-secondary">
            <RotateCcw size={20} /> Salir
        </button>
        <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="pda-btn-primary">
            {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />} FINALIZAR
        </button>
      </div>

      {confirmModal && (
            <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}}>
                <div className="pda-card" style={{width:'100%', maxWidth:'400px', border:'1px solid var(--accent)'}}>
                    <h3 style={{marginTop:0, color:'var(--fg)'}}>{confirmModal.title}</h3>
                    <p style={{color:'#8b949e', fontSize:'1rem', lineHeight:'1.5', marginBottom:'20px'}}>{confirmModal.message}</p>
                    <div className="grid-row">
                        <button onClick={closeConfirm} className="pda-btn-secondary">Cancelar</button>
                        <button onClick={()=>{confirmModal.onConfirm(); closeConfirm();}} className="pda-btn-primary">Confirmar</button>
                    </div>
                </div>
            </div>
      )}
    </div>
  );
};

export default VerifierDashboard;