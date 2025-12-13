// frontend/src/context/ClientContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

const ClientContext = createContext(null);

const API_URL = "http://localhost:3000/api/clientes"; 

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Obtener Clientes
  const refreshClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Error de enlace con Cartera de Clientes");
      const data = await res.json();
      setClients(data.clients || []); 
    } catch (err) {
      console.warn("ClientContext Warning:", err.message);
      setClients([]); 
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshClients();
  }, []);

  // 2. Crear Cliente (NUEVO)
  const addClient = async (clientData) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al crear cliente");

      // Recargamos la lista para garantizar consistencia (IDs, fechas, etc.)
      await refreshClients(); 
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Métricas
  const metrics = useMemo(() => {
    return {
      total: clients.length,
      active: clients.filter(c => c.estado === 'activo').length,
      inactive: clients.filter(c => c.estado === 'inactivo').length,
      suspended: clients.filter(c => c.estado === 'suspendido').length,
    };
  }, [clients]);

  const value = {
    clients,
    metrics,
    loading,
    error,
    refreshClients,
    addClient // Exportamos la nueva función
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientContext);
  if (!context) throw new Error("useClients debe usarse dentro de ClientProvider");
  return context;
};