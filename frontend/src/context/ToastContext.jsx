// frontend/src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X, ShieldAlert } from "lucide-react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState(null); // Estado para el Modal de Confirmación

  // --- LÓGICA TOASTS (Notificaciones) ---
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    if (duration) setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  // --- LÓGICA PROMPT (Confirmaciones) ---
  // Reemplazo moderno de window.confirm
  const prompt = useCallback((title, message, onConfirm, type = "danger") => {
    setModalConfig({
        title,
        message,
        onConfirm: () => {
            if (onConfirm) onConfirm();
            setModalConfig(null);
        },
        onCancel: () => setModalConfig(null),
        type // 'danger' | 'info' | 'warning'
    });
  }, []);

  const value = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    warning: (msg) => addToast(msg, "warning"),
    info: (msg) => addToast(msg, "info"),
    prompt // <--- Nueva Herramienta
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* CAPA DE TOASTS */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div className="icon">
              {t.type === 'success' && <CheckCircle size={20} />}
              {t.type === 'error' && <XCircle size={20} />}
              {t.type === 'warning' && <AlertTriangle size={20} />}
              {t.type === 'info' && <Info size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px', textTransform: 'uppercase', fontSize: '0.75rem', opacity: 0.8 }}>
                {t.type}
              </div>
              <div>{t.message}</div>
            </div>
            <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', color: 'inherit', opacity: 0.5, cursor: 'pointer' }}><X size={16} /></button>
          </div>
        ))}
      </div>

      {/* CAPA DE MODAL DE CONFIRMACIÓN */}
      {modalConfig && (
        <div className="confirm-overlay">
            <div className={`confirm-card ${modalConfig.type}`}>
                <div className="confirm-header">
                    {modalConfig.type === 'danger' ? <ShieldAlert size={32} /> : <AlertTriangle size={32} />}
                    <h3>{modalConfig.title}</h3>
                </div>
                <p className="confirm-body">{modalConfig.message}</p>
                <div className="confirm-actions">
                    <button onClick={modalConfig.onCancel} className="btn-cancel">Cancelar</button>
                    <button onClick={modalConfig.onConfirm} className="btn-confirm">CONFIRMAR ACCIÓN</button>
                </div>
            </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de ToastProvider");
  return context;
};