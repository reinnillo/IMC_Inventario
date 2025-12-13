// frontend/src/components/Layout/Layout.jsx
import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import TopBar from "../TopBar/TopBar";
import { useNavigation } from "../../context/NavigationContext";

// Importación de Vistas
import Home from "../Home/Home"; 
import Inventory from "../Inventory/Inventory";
import UsersMain from "../Users/UsersMain";
import Clients from "../Clients/Clients";
import Reports from "../Reports/Reports";
import UserProfile from "../Profile/UserProfile";
import { ShieldAlert } from "lucide-react";

// DICCIONARIO DE NAVEGACIÓN
const VIEW_REGISTRY = {
  dashboard: Home,
  inventario: Inventory,
  usuarios: UsersMain,
  clientes: Clients,
  reportes: Reports,
  perfil: UserProfile,
};

const Layout = () => {
  const { currentView } = useNavigation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado del menú móvil

  // Helper para cerrar menú al navegar (en móvil)
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Selección de Componente (O(1))
  const ActiveComponent = VIEW_REGISTRY[currentView] || (() => (
    <div className="dashboard-placeholder" style={{ color: 'red' }}>
      <ShieldAlert size={48} />
      <h3>Vista no encontrada: {currentView}</h3>
    </div>
  ));

  return (
    <div className="layout-wrapper">
      {/* Sidebar recibe estado y función de cierre */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      {/* Overlay para cerrar al hacer click afuera (Solo visible en móvil vía CSS) */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}
      
      <div className="layout-body">
        {/* TopBar recibe función toggle */}
        <TopBar onToggleSidebar={toggleSidebar} />
        
        <main className="layout-content">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
};

export default Layout;