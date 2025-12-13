// frontend/src/components/Inventory/AdminInventoryView.jsx
import React, { useState, useEffect } from "react";
import { 
  Database, Upload, Loader2, ArrowRight, 
  FileSpreadsheet, FileJson, FileText, Trash2, Box, AlertTriangle, Link 
} from "lucide-react";
import { useClients } from "../../context/ClientContext";
import { useToast } from "../../context/ToastContext";
import { API_URL } from "../../config/api";

// CONSTANTES DEL SISTEMA
const BATCH_SIZE = 1500;
const DB_FIELDS = [
  { key: "codigo_producto", label: "Código (SKU)", required: true },
  { key: "barcode", label: "Código de Barras (Barcode)", required: false },
  { key: "descripcion", label: "Descripción", required: false },
  { key: "cantidad", label: "Cantidad (Stock)", required: false },
  { key: "area", label: "Área", required: false },
  { key: "ubicacion", label: "Ubicación", required: false },
  { key: "marbete", label: "Marbete", required: false },
  { key: "costo", label: "Costo Unitario", required: false },
  { key: "categoria", label: "Categoría", required: false }
];

const useSheetJS = () => {
  const [libReady, setLibReady] = useState(false);
  useEffect(() => {
    if (window.XLSX) { setLibReady(true); return; }
    const script = document.createElement('script');
    script.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
    script.async = true;
    script.onload = () => setLibReady(true);
    document.body.appendChild(script);
  }, []);
  return libReady;
};

const AdminInventoryView = () => {
  const { clients } = useClients();
  const toast = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const libReady = useSheetJS();
  
  const [selectedClient, setSelectedClient] = useState("");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Wizard States
  const [importMode, setImportMode] = useState(false);
  const [step, setStep] = useState(1);
  const [rawSourceData, setRawSourceData] = useState([]);
  const [sourceHeaders, setSourceHeaders] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [fileInfo, setFileInfo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({ processed: 0, total: 0, errors: 0 });

  // OBTENER INVENTARIO (AUDITADO)
  const fetchInventory = async () => {
    if (!selectedClient) return;
    setLoading(true);

    try {
      // INYECCIÓN DE IDENTIDAD EN QUERY PARAMS
      // Esto permite que el backend registre la auditoría automáticamente al recibir la petición
      const queryParams = new URLSearchParams({
        cliente_id: selectedClient,
        actor_id: user.id,     
        actor_name: user.nombre,
        actor_role: user.role,
        target_label: clients.find(c => c.id === Number(selectedClient))?.nombre || 'N/A'
      }).toString();

      const res = await fetch(`${API_URL}/api/inventario?${queryParams}`);
      const data = await res.json();

      if (res.ok) setInventory(data.inventory);
      else toast.error("Error: " + data.error);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClient) fetchInventory();
    else setInventory([]);
  }, [selectedClient]);

  // Manejo de eliminación de inventario con confirmación
  const handleDeleteInventory = async () => {

    // Obtener nombre del cliente para el mensaje
    const clientName = clients.find(c => c.id === Number(selectedClient))?.nombre;
    
    // Alerta de confirmacion con ToastContext
    toast.prompt(
      "Confirmar Eliminación de Inventario",
      `¿Estás seguro de eliminar TODO el inventario de "${clientName}"? Esta acción no se puede deshacer y reiniciará el ciclo de conteo.`,
      async () => {
        await deleteInventory();
      },
      "danger"
    );
  };

  // Eliminar todo el inventario de un cliente
  const deleteInventory = async () => {
    setDeleting(true);
    try {
        const res = await fetch(`${API_URL}/api/inventario`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              cliente_id: selectedClient,

              // Datos para Auditoría
              admin_id: user.id,
              admin_name: user.nombre,
              admin_role: user.role,
              cliente_name: clients.find(c => c.id === Number(selectedClient))?.nombre
            })
        });
        const data = await res.json();
        
        if (res.ok) {
          // reemplazar el alet() por ToastContext 
          toast.success(`Inventario eliminado ${data.deletedCount} registros purgados.`);
          setInventory([]);
        
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        toast.error("Error al eliminar: " + err.message);
    } finally {
        setDeleting(false);
    }
  };

  // Manejo de carga de archivo
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!libReady && !file.name.endsWith('.json')) {
      toast.error("El motor de procesamiento aún se está cargando...");
      return;
    }

    setLoading(true);
    setFileInfo({ 
      name: file.name, 
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: file.name.split('.').pop().toUpperCase()
    });

    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error("JSON inválido (debe ser Array)");
        processParsedData(parsed);
      } else {
        const data = await file.arrayBuffer();
        const workbook = window.XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        processParsedData(jsonData);
      }
    } catch (err) {
      toast.error("Error lectura: " + err.message);
      setFileInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Procesar datos parseados y preparar mapeo
  const processParsedData = (data) => {
    if (data.length === 0) {  toast.error("Archivo vacío."); return; }
    setRawSourceData(data);
    const headers = Object.keys(data[0]);
    setSourceHeaders(headers);
    
    const autoMap = {};
    DB_FIELDS.forEach(dbField => {
      const match = headers.find(h => 
        h.toLowerCase() === dbField.key.toLowerCase() || 
        h.toLowerCase().replace(/_/g, ' ').includes(dbField.label.toLowerCase())
      );
      if (match) autoMap[dbField.key] = match;
    });
    setFieldMapping(autoMap);
    setStep(2);
  };

  // Manejo de cambios en el mapeo
  const handleMapChange = (dbKey, sourceKey) => {
    setFieldMapping(prev => ({ ...prev, [dbKey]: sourceKey }));
  };

  // Motor de carga por lotes
  const startUploadEngine = async () => {
    setStep(3); 
    setProgress(0);
    let errorCount = 0;
    let numeroLote = 0;
    const totalRecords = rawSourceData.length;
    setUploadStats({ processed: 0, total: totalRecords, errors: 0 });

    const normalizedData = rawSourceData.map(row => {
      const newItem = {};
      DB_FIELDS.forEach(field => {
        const sourceKey = fieldMapping[field.key];
        if (sourceKey) newItem[field.key] = row[sourceKey];
      });
      return newItem;
    });

    for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
      const chunk = normalizedData.slice(i, i + BATCH_SIZE);
      numeroLote += 1;

      try {
        const res = await fetch(`${API_URL}/api/inventario/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            items: chunk, 
            cliente_id: selectedClient,
            // Datos para Auditoría
            admin_id: user.id,
            admin_name: user.nombre,
            admin_role: user.role, 
            cliente_name: clients.find(c => c.id === Number(selectedClient))?.nombre || 'N/A',
            cliente_detailsAuditoria: { reason: 'importacion masiva en lote', numeroLote: numeroLote, itemCount: `${chunk.length} items de ${totalRecords}` }
          })
        });

        if (!res.ok) errorCount += chunk.length;
      } catch (err) {
        errorCount += chunk.length;
      }

      const currentProcessed = Math.min(i + BATCH_SIZE, totalRecords);
      const percentage = Math.round((currentProcessed / totalRecords) * 100);
      setProgress(percentage);
      setUploadStats(prev => ({ ...prev, processed: currentProcessed, errors: errorCount }));
      await new Promise(resolve => setTimeout(resolve, 50)); 
    }

    if (errorCount === 0) {
      toast.success("✅ Carga completada sin errores.");
      setImportMode(false); setStep(1); setFileInfo(null); setRawSourceData([]);
      fetchInventory();
    } else {
      toast.error(`⚠️ Finalizado con ${errorCount} errores.`);
      setStep(1);
    }
  };

  const resetImport = () => {
    setImportMode(false);
    setStep(1);
    setFileInfo(null);
    setRawSourceData([]);
    setProgress(0);
  };

  return (
    <div className="dashboard-container animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', margin: 0 }}>
            <Database /> Maestro de Inventarios
          </h2>
          <p style={{ color: '#8b949e', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Base de datos centralizada de productos por cliente.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <select 
            value={selectedClient} 
            onChange={(e) => setSelectedClient(e.target.value)}
            disabled={importMode}
            style={{ 
              padding: '10px', borderRadius: '8px', background: 'var(--card)', 
              color: 'var(--fg)', border: '1px solid var(--border)', minWidth: '200px',
              outline: 'none'
            }}
          >
            <option value="">-- Seleccionar Cliente --</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>

          {selectedClient && !importMode && (
             <div style={{display:'flex', gap:'10px'}}>
                <button 
                  onClick={() => setImportMode(true)}
                  className="action-btn"
                  style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '10px 20px', display:'flex', gap:'8px', alignItems:'center' }}
                >
                  <Upload size={18} /> Cargar Data
                </button>
                <button 
                  onClick={handleDeleteInventory}
                  disabled={deleting || inventory.length === 0}
                  style={{ 
                    background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', 
                    borderRadius: '8px', padding: '10px', cursor: 'pointer', opacity: (deleting || inventory.length === 0) ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  title="Eliminar Inventario"
                >
                  {deleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                </button>
             </div>
          )}
          {importMode && (
             <button onClick={() => {setImportMode(false); setStep(1);}} style={{background:'#374151', color:'white', border:'none', borderRadius:'6px', padding:'10px', cursor: 'pointer'}}>Cancelar</button>
          )}
        </div>
      </div>

      {/* Import Wizard */}
      {importMode && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--accent)', borderRadius: '12px', marginBottom: '20px', overflow: 'hidden' }}>
          
          {/* Steps */}
          <div style={{ background: 'rgba(0, 224, 255, 0.1)', padding: '15px', display: 'flex', justifyContent: 'space-around', borderBottom: '1px solid rgba(0, 224, 255, 0.2)' }}>
            <div style={{ color: step >= 1 ? 'var(--accent)' : '#4b5563', fontWeight: 'bold' }}>1. Subir Archivo</div>
            <div style={{ color: step >= 2 ? 'var(--accent)' : '#4b5563', fontWeight: 'bold' }}>2. Mapeo Inteligente</div>
            <div style={{ color: step >= 3 ? 'var(--accent)' : '#4b5563', fontWeight: 'bold' }}>3. Procesamiento</div>
          </div>

          <div style={{ padding: '30px' }}>
            {step === 1 && (
              <div className="animate-fade-in" style={{ textAlign: 'center' }}>
                <div 
                  onClick={() => document.getElementById('fInput').click()}
                  style={{ border: '2px dashed var(--accent)', borderRadius: '16px', padding: '60px', background: 'rgba(0, 224, 255, 0.02)', cursor: 'pointer' }}
                >
                  <input type="file" id="fInput" hidden onChange={handleFileUpload} accept=".csv,.xlsx,.xls,.json,.txt" />
                  {loading ? <Loader2 size={48} className="animate-spin" /> : <div><FileSpreadsheet size={48} /><h3 style={{ margin: '10px 0' }}>Click para subir archivo</h3></div>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {DB_FIELDS.map(field => {
                    const isMapped = !!fieldMapping[field.key];
                    return (
                        <div key={field.key} style={{ padding: '15px', background: 'var(--card)', borderRadius: '10px', border: isMapped ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--fg)', fontWeight: 'bold' }}>{field.label}</span>
                                {isMapped && <Link size={16} color="var(--accent)" />}
                            </div>
                            <select value={fieldMapping[field.key] || ""} onChange={(e) => handleMapChange(field.key, e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: isMapped ? 'var(--accent)' : '#8b949e', border: '1px solid var(--border)' }}>
                                <option value="">-- Sin asignar --</option>
                                {sourceHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                        </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={startUploadEngine} disabled={!fieldMapping['codigo_producto']} style={{ background: 'var(--success)', color: '#000', padding: '15px 40px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: !fieldMapping['codigo_producto'] ? 0.5 : 1 }}>INICIAR IMPORTACIÓN</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <h3 style={{ color: 'var(--fg)' }}>Sincronizando Base de Datos... {progress}%</h3>
                <div style={{ width: '100%', height: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--success)', transition: 'width 0.3s ease' }}></div>
                </div>
                <div style={{display:'flex', justifyContent:'center', gap:'20px', marginTop:'10px', color:'#8b949e'}}>
                    <span>Procesados: {uploadStats.processed} / {uploadStats.total}</span>
                    {uploadStats.errors > 0 && <span style={{color:'#ef4444'}}>Errores: {uploadStats.errors}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        {!selectedClient ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#8b949e' }}><Database size={64} style={{ opacity: 0.2 }} /><p>Seleccione un cliente.</p></div>
        ) : loading && !importMode ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--accent)' }}><Loader2 className="animate-spin" size={32} /></div>
        ) : inventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#8b949e' }}><Box size={48} style={{ opacity: 0.2 }} /><p>Inventario vacío.</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
              <tr>
                <th style={{padding:'15px', textAlign:'left', color:'#8b949e'}}>SKU</th>
                <th style={{padding:'15px', textAlign:'left', color:'#8b949e'}}>Descripción</th>
                <th style={{padding:'15px', textAlign:'center', color:'#8b949e'}}>Stock</th>
                <th style={{padding:'15px', textAlign:'left', color:'#8b949e'}}>Ubicación</th>
                <th style={{padding:'15px', textAlign:'left', color:'#8b949e'}}>Área</th>
                <th style={{padding:'15px', textAlign:'right', color:'#8b949e'}}>Costo</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{padding:'12px', fontFamily:'monospace', color:'var(--accent)'}}>{item.codigo_producto}</td>
                  <td style={{padding:'12px', color:'var(--fg)'}}>{item.descripcion}</td>
                  <td style={{padding:'12px', textAlign:'center', fontWeight:'bold'}}>{item.cantidad}</td>
                  <td style={{padding:'12px', color:'#8b949e'}}>{item.ubicacion || '-'}</td>
                  <td style={{padding:'12px', color:'#8b949e'}}>{item.area || '-'}</td>
                  <td style={{padding:'12px', textAlign:'right', color:'#8b949e'}}>{item.costo ? `$${item.costo}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminInventoryView;