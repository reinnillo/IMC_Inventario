// frontend/src/context/SystemUsersContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

const SystemUsersContext = createContext(null);

const API_URL = "http://localhost:3000/api/usuarios_imc";

export const SystemUsersProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Carga Inicial
  const refreshUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Fallo en enlace con Directorio");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error SystemUsers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshUsers(); }, []);

  // 2. Crear Usuario
  const addUser = async (userData) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      // Actualización local rápida
      setUsers(prev => [result.user, ...prev]);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // 3. Asignar Cliente 
  const assignUserToClient = async (userId, clientId) => {
    return editUser(userId, { cliente_id: clientId });
  };

  // 4. Editar Usuario 
  const editUser = async (userId, updates) => {
    try {
      const res = await fetch(`${API_URL}/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      // Actualización Optimista en Memoria
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...result.user } : u));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Selectores
  const staffFijo = useMemo(() => users.filter(u => u.user_type === 'Fijo'), [users]);
  const staffTemporal = useMemo(() => users.filter(u => u.user_type !== 'Fijo'), [users]);

  const value = {
    users, 
    staffFijo,
    staffTemporal,
    loading,
    error,
    refreshUsers,
    addUser,
    editUser, // Exportamos la función genérica
    assignUserToClient
  };

  return (
    <SystemUsersContext.Provider value={value}>
      {children}
    </SystemUsersContext.Provider>
  );
};

export const useSystemUsers = () => {
  const context = useContext(SystemUsersContext);
  if (!context) throw new Error("useSystemUsers debe usarse dentro de SystemUsersProvider");
  return context;
};