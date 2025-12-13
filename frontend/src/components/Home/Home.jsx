// frontend/src/components/Home/Home.jsx
import React, { useState } from "react";
import { LayoutDashboard, Calculator, ShieldCheck } from "lucide-react";
import AdminDashboard from "../Dashboard/AdminDashboard"; 
import CounterDashboard from "../Dashboard/CounterDashboard"; 
import VerifierDashboard from "../Dashboard/VerifierDashboard"; 
import CountingSupervision from "../Supervision/CountingSupervision"; // <--- NUEVO
import VerificationSupervision from "../Supervision/VerificationSupervision"; // <--- NUEVO
import { useAuth } from "../../context/AuthContext";

const Home = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const currentRole = user?.role?.toLowerCase();
  const isAdminOrSuper = currentRole === "admin" || currentRole === "supervisor";

  // Lógica de Renderizado Dinámico
  const renderRightPanel = () => {
    // CASO 1: ADMINS Y SUPERVISORES (Vistas de Supervisión)
    if (isAdminOrSuper) {
      switch (activeTab) {
        case "dashboard": return <AdminDashboard />;
        // Aquí cambiamos CounterDashboard por CountingSupervision
        case "conteo": return <CountingSupervision />; 
        // Aquí cambiamos VerifierDashboard por VerificationSupervision
        case "verificacion": return <VerificationSupervision />; 
        default: return <AdminDashboard />;
      }
    } 
    
    // CASO 2: CONTADORES (Operativo)
    else if (currentRole === "contador") {
        return <CounterDashboard />;
    }
    
    // CASO 3: VERIFICADORES (Operativo)
    else if (currentRole === "verificador") {
        return <VerifierDashboard />;
    }
    
    // CASO 4: ACCESO DENEGADO
    else {
      return (
        <div className="dashboard-placeholder" style={{border: '1px solid red'}}>
            <h3>Acceso No Autorizado</h3>
            <p>Rol detectado: {user?.role || 'Ninguno'}</p>
        </div>
      );
    }
  };

  return (
    <div className="home-container">
      <section className="home-right" style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '100%' }}>
        
        {isAdminOrSuper && (
          <nav className="admin-tabs">
            <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button className={`tab-btn ${activeTab === 'conteo' ? 'active' : ''}`} onClick={() => setActiveTab('conteo')}>
              <Calculator size={16} /> Supervisión Conteo
            </button>
            <button className={`tab-btn ${activeTab === 'verificacion' ? 'active' : ''}`} onClick={() => setActiveTab('verificacion')}>
              <ShieldCheck size={16} /> Supervisión Verificación
            </button>
          </nav>
        )}

        {renderRightPanel()}
      </section>
    </div>
  );
};

export default Home;