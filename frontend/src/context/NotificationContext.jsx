// frontend/src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import supabase from "../config/supabaseClient";
import { useToast } from "./ToastContext"; 

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const toast = useToast();
  
  const lastProcessedIdRef = useRef(null);

  // 1. CARGA INICIAL (Con Debugging)
  useEffect(() => {
    const fetchRecentLogs = async () => {
      //console.log("🔍 Intentando obtener logs iniciales...");
      try {
        const { data, error } = await supabase
            .from('audit_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error("❌ Error Supabase al traer logs:", error.message);
        } else {
            //console.log(`✅ Logs recibidos: ${data.length}`, data); // <--- Mira esto en consola
            setNotifications(data);
            if(data.length > 0) lastProcessedIdRef.current = data[0].id;
        }
      } catch (err) {
        console.error("🔥 Error crítico inicializando notificaciones:", err);
      }
    };
    fetchRecentLogs();
  }, []);

  // 2. SUSCRIPCIÓN REALTIME (Con Debugging de Estado)
  useEffect(() => {
    //console.log("📡 Iniciando suscripción al canal audit_log_changes...");
    
    const channel = supabase
      .channel('audit_log_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_log' },
        (payload) => {
          //console.log("🔔 EVENTO RECIBIDO REALTIME:", payload); // <--- Esto debe salir al crear algo

          if (!payload || !payload.new) return;
          const newLog = payload.new;

          // Anti-rebote
          if (lastProcessedIdRef.current === newLog.id) {
              //console.log("Ignorando duplicado:", newLog.id);
              return;
          }
          lastProcessedIdRef.current = newLog.id;

          const action = String(newLog.action || '').toUpperCase();
          if (action.includes('READ')) return; // Comentado temporalmente para probar que SI llegan

          setNotifications((prev) => {
              const updated = [newLog, ...prev];
              return updated.slice(0, 100); 
          });
          
          setUnreadCount((prev) => prev + 1);

          if (toast && toast.info) {
             toast.info(`Actividad: ${newLog.action}`);
          }
        }
      )
      .subscribe((status, err) => {
          console.log(`Estado de Conexión Realtime: ${status}`, err ? err : '');
          if (status === 'CHANNEL_ERROR') console.error('⚠️ Error en el canal Realtime. Revisa tu conexión o configuración.');
      });

    return () => {
      channel.unsubscribe();
    };
  }, [toast]);

  const markAllAsRead = () => setUnreadCount(0);
  
  const togglePanel = () => {
      if (!isPanelOpen) markAllAsRead(); 
      setIsPanelOpen(!isPanelOpen);
  };

  const value = {
    notifications,
    unreadCount,
    isPanelOpen,
    setIsPanelOpen,
    togglePanel,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications debe usarse dentro de NotificationProvider");
  return context;
};