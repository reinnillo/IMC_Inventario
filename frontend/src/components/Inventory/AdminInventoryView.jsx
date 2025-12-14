// frontend/src/components/Inventory/AdminInventoryView.jsx
import React, { useState, useEffect } from "react";
import { 
  Database, Upload, Loader2, 
  FileSpreadsheet, Trash2, Box, Link 
} from "lucide-react";
import { useClients } from "../../context/ClientContext";
import { useToast } from "../../context/ToastContext";
import { API_URL } from "../../config/api";
import './style/AdminInventoryView.css';

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
    return () => { document.body.removeChild(script); };
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

  const handleDeleteInventory = async () => {
    const clientName = clients.find(c => c.id === Number(selectedClient))?.nombre;
    toast.prompt(
      "Confirmar Eliminación de Inventario",
      `¿Estás seguro de eliminar TODO el inventario de "${clientName}"? Esta acción no se puede deshacer y reiniciará el ciclo de conteo.`,
      async () => { await deleteInventory(); },
      "danger"
    );
  };

  const deleteInventory = async () => {
    setDeleting(true);
    try {
        const res = await fetch(`${API_URL}/api/inventario`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              cliente_id: selectedClient,
              admin_id: user.id,
              admin_name: user.nombre,
              admin_role: user.role,
              cliente_name: clients.find(c => c.id === Number(selectedClient))?.nombre
            })
        });
        const data = await res.json();
        
        if (res.ok) {
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

  const processParsedData = (data) => {
    if (data.length === 0) { toast.error("Archivo vacío."); return; }
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

  const handleMapChange = (dbKey, sourceKey) => {
    setFieldMapping(prev => ({ ...prev, [dbKey]: sourceKey }));
  };

  const startUploadEngine = async () => {
    setStep(3); 
    setProgress(0);
    let errorCount = 0;
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
      try {
        const res = await fetch(`${API_URL}/api/inventario/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            items: chunk, 
            cliente_id: selectedClient,
            admin_id: user.id,
            admin_name: user.nombre,
            admin_role: user.role, 
            cliente_name: clients.find(c => c.id === Number(selectedClient))?.nombre || 'N/A',
            cliente_detailsAuditoria: { reason: 'importacion masiva en lote', itemCount: `${chunk.length} de ${totalRecords}` }
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
      resetImport();
      fetchInventory();
    } else {
      toast.error(`⚠️ Finalizado con ${errorCount} errores.`);
      setStep(1); // Opcional: permitir re-intentar el mapeo/carga
    }
  };

  const resetImport = () => {
    setImportMode(false);
    setStep(1);
    setFileInfo(null);
    setRawSourceData([]);
    setProgress(0);
    // Reset file input
    const fileInput = document.getElementById('fInput');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="inventory-container animate-fade-in">
      
      {/* Header */}
      <header className="inventory-header">
        <div className="inventory-header-title">
          <h2><Database /> Maestro de Inventarios</h2>
          <p>Base de datos centralizada de productos por cliente.</p>
        </div>
        
        <div className="header-controls">
          <select 
            value={selectedClient} 
            onChange={(e) => setSelectedClient(e.target.value)}
            disabled={importMode}
            className="client-select"
          >
            <option value="">-- Seleccionar Cliente --</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>

          {selectedClient && !importMode && (
             <div className="header-actions">
                <button onClick={() => setImportMode(true)} className="action-btn upload-btn">
                  <Upload size={18} /> Cargar Data
                </button>
                <button 
                  onClick={handleDeleteInventory}
                  disabled={deleting || inventory.length === 0}
                  className="delete-btn"
                  title="Eliminar Inventario"
                >
                  {deleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                </button>
             </div>
          )}
          {importMode && (
             <button onClick={resetImport} className="cancel-btn">Cancelar</button>
          )}
        </div>
      </header>

      {/* Import Wizard */}
      {importMode && (
        <div className="import-wizard animate-fade-in">
          <div className="wizard-steps">
            <div className={`wizard-step ${step >= 1 ? 'active' : ''}`}>1. Subir Archivo</div>
            <div className={`wizard-step ${step >= 2 ? 'active' : ''}`}>2. Mapeo Inteligente</div>
            <div className={`wizard-step ${step >= 3 ? 'active' : ''}`}>3. Procesamiento</div>
          </div>

          <div className="wizard-content">
            {step === 1 && (
              <div className="step-content animate-fade-in">
                <div className="file-dropzone" onClick={() => document.getElementById('fInput')?.click()}>
                  <input type="file" id="fInput" hidden onChange={handleFileUpload} accept=".csv,.xlsx,.xls,.json" />
                  {loading ? <Loader2 size={48} className="animate-spin" /> : 
                    <div>
                      <FileSpreadsheet size={48} />
                      <h3>Click para subir archivo</h3>
                    </div>
                  }
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="step-content step2 animate-fade-in">
                <div className="mapping-grid-scrollable">
                  <div className="mapping-grid">
                    {DB_FIELDS.map(field => {
                      const isMapped = !!fieldMapping[field.key];
                      return (
                        <div key={field.key} className={`mapping-card ${isMapped ? 'is-mapped' : ''}`}>
                          <div className="mapping-card-header">
                            <span>{field.label}</span>
                            {isMapped && <Link size={16} color="var(--accent)" />}
                          </div>
                          <select 
                            value={fieldMapping[field.key] || ""} 
                            onChange={(e) => handleMapChange(field.key, e.target.value)} 
                            className={`mapping-select ${isMapped ? 'is-mapped' : ''}`}
                          >
                            <option value="">-- Sin asignar --</option>
                            {sourceHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="start-import-container">
                  <button onClick={startUploadEngine} disabled={!fieldMapping['codigo_producto']} className="start-import-btn">
                    INICIAR IMPORTACIÓN
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="processing-step-container animate-fade-in">
                <h3>Sincronizando Base de Datos... {progress}%</h3>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="upload-stats">
                    <span>Procesados: {uploadStats.processed} / {uploadStats.total}</span>
                    {uploadStats.errors > 0 && <span className="error-stats">Errores: {uploadStats.errors}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="inventory-table-wrapper">
        {!selectedClient ? (
          <div className="table-placeholder">
            <Database size={64} className="table-placeholder-icon" />
            <p>Seleccione un cliente para ver su inventario.</p>
          </div>
        ) : loading && !importMode ? (
          <div className="table-placeholder">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : inventory.length === 0 ? (
          <div className="table-placeholder">
            <Box size={48} className="table-placeholder-icon" />
            <p>Este inventario está vacío.</p>
          </div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Descripción</th>
                <th className="text-center">Stock</th>
                <th>Ubicación</th>
                <th>Área</th>
                <th className="text-right">Costo</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td className="cell-sku">{item.codigo_producto}</td>
                  <td>{item.descripcion}</td>
                  <td className="cell-stock">{item.cantidad}</td>
                  <td className="cell-location">{item.ubicacion || '-'}</td>
                  <td className="cell-area">{item.area || '-'}</td>
                  <td className="cell-cost">{item.costo ? `$${Number(item.costo).toFixed(2)}` : '-'}</td>
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