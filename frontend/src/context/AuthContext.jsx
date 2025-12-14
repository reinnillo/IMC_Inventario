// frontend/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

// Definimos la estructura del Contexto
const AuthContext = createContext(null);

// LLAVE MAESTRA DE ALMACENAMIENTO
// Usamos "user" para mantener consistencia con los datos existentes en tu LocalStorage
const STORAGE_KEY = "user"; 

/**
 * AUTH PROVIDER: El reactor de identidad del sistema.
 * Gestiona la persistencia y distribución de la data del usuario.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Hydration: Al iniciar, buscamos rastros de sesión en el almacenamiento local
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Validamos que al menos exista un rol para evitar estados zombies
        if (parsedUser && parsedUser.role) {
            //console.log("🔋 Sesión restaurada desde disco:", parsedUser);
            setUser(parsedUser);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Error corrompido en almacenamiento local:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      console.log("⚠️ No se encontró sesión en disco bajo la llave:", STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  // 2. Acción: Login (Vincula memoria y disco)
  const login = (userData) => {
    // SANITIZACIÓN: Forzamos minúsculas para evitar discrepancias (Admin vs admin)
    const safeRole = userData.role ? userData.role.toLowerCase().trim() : 'guest';

    const sessionData = {
      id: userData.id,
      nombre: userData.nombre,
      correo: userData.correo,
      cedula: userData.cedula,
      role: safeRole,
      telefono: userData.telefono,
      user_type: userData.user_type || 'Fijo',
      cliente_id: userData.cliente_id,
      activo: userData.activo ?? true,
      last_login: new Date().toISOString()
    };

    //console.log("🔐 Guardando Nueva Sesión:", sessionData);
    setUser(sessionData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
  };

  // 3. Acción: Logout (Purga memoria y disco)
  const logout = () => {
    console.log("👋 Cerrando sesión...");
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para consumo rápido en componentes
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};