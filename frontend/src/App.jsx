// frontend/src/App.jsx
import React, { useState } from "react";
import Layout from "./components/Layout/Layout";
import Login from "./components/Login/Login"; 
import GuestDashboard from "./components/Guests/GuestDashboard";
import { useAuth } from "./context/AuthContext"; 
import "./index.css";

export default function App() {
  const { user, login } = useAuth(); 
  
  // INICIALIZACIÓN PEREZOSA DEL TOKEN DE INVITADO
  // Se ejecuta una sola vez al montar el componente para capturar la URL
  const [guestToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  });

  // --- RENDERIZADO DE FLUJOS ---

  // FLUJO 1: ACCESO EXTERNO (INVITADO)
  // Tiene prioridad absoluta. Si hay token, secuestra la app.
  if (guestToken) {
    return <GuestDashboard token={guestToken} />;
  }

  // FLUJO 2: SISTEMA INTERNO (PERSONAL)
  // Si el usuario ya está autenticado (AuthContext tiene datos), mostramos el Layout.
  // El Layout se encargará de mostrar las vistas correctas según user.role.
  if (user) {
    return <Layout />;
  }

  // FLUJO 3: PUERTA DE ENLACE (LOGIN)
  // Si no es invitado ni está logueado, mostramos el login único.
  return (
    <Login onLogin={(userData) => login(userData)} />
  );
}