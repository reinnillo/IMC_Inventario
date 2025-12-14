// frontend/src/context/ClientContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { API_URL } from "../config/api";

import { useAuth } from "./AuthContext";

const ClientContext = createContext(null);

const URL = `${API_URL}/api/clientes`;

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Depend on AuthContext

  // 1. Obtener Clientes
  const refreshClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(URL);
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

  // 2. Crear Cliente
  const addClient = async (clientData) => {
    try {
      const res = await fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al crear cliente");

      await refreshClients(); 
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // 3. Actualizar Estado de Cliente (Refactored)
  const updateClientStatus = async (clientId, estado) => {
    if (!user || !user.role) {
      return { success: false, message: "Usuario no autenticado o rol no disponible." };
    }

    try {
      const res = await fetch(`${URL}/${clientId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          estado: estado,
          user_role: user.role // Get role from AuthContext
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Error al actualizar el estado");
      }

      // Optimistic update locally before refreshing
      setClients(prevClients => 
        prevClients.map(c => c.id === clientId ? { ...c, estado: estado } : c)
      );

      return { success: true, message: result.message };

    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // 4. Eliminar Cliente
  const deleteClient = async (clientId) => {
    if (!user || !['admin', 'supervisor'].includes(user.role)) {
      return { success: false, message: "No autorizado." };
    }
  
    try {
      const res = await fetch(`${URL}/${clientId}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_role: user.role })
      });
  
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Error al eliminar el cliente");
      }
  
      setClients(prevClients => prevClients.filter(c => c.id !== clientId));
      return { success: true, message: result.message };
  
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // 5. Actualizar Cliente
  const updateClient = async (clientId, clientData) => {
    if (!user || !['admin', 'supervisor'].includes(user.role)) {
      return { success: false, message: "No autorizado." };
    }

    try {
      const res = await fetch(`${URL}/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...clientData,
          user_role: user.role
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Error al actualizar el cliente");
      }

      await refreshClients();
      return { success: true, message: result.message };

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
    addClient,
    updateClientStatus,
    deleteClient,
    updateClient
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