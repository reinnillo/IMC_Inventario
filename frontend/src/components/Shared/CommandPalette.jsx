// frontend/src/components/Shared/CommandPalette.jsx
import React, { useState, useEffect, useRef } from "react";
import { 
  Search, X, User, Building2, LayoutDashboard, 
  Box, FileBarChart, ChevronRight, ArrowRight 
} from "lucide-react";
import { useNavigation } from "../../context/NavigationContext";
import { useClients } from "../../context/ClientContext";
import { useSystemUsers } from "../../context/SystemUsersContext";

const CommandPalette = ({ onClose }) => {
  const { navigateTo } = useNavigation();
  const { clients } = useClients();
  const { users } = useSystemUsers();

  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  // Auto-foco al abrir
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
    
    // Cerrar con ESC
    const handleEsc = (e) => {
        if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // --- LÓGICA DE BÚSQUEDA ---
  const getResults = () => {
    if (!query.trim()) return null;
    const term = query.toLowerCase();

    // 1. Módulos de Sistema
    const modules = [
        { id: 'dashboard', label: 'Dashboard Principal', icon: LayoutDashboard },
        { id: 'inventario', label: 'Maestro de Inventario', icon: Box },
        { id: 'usuarios', label: 'Directorio de Usuarios', icon: User },
        { id: 'clientes', label: 'Cartera de Clientes', icon: Building2 },
        { id: 'reportes', label: 'Centro de Reportes', icon: FileBarChart },
    ].filter(m => m.label.toLowerCase().includes(term));

    // 2. Usuarios
    const foundUsers = users.filter(u => 
        u.nombre.toLowerCase().includes(term) || 
        u.cedula.includes(term)
    ).slice(0, 3); // Top 3

    // 3. Clientes
    const foundClients = clients.filter(c => 
        c.nombre.toLowerCase().includes(term)
    ).slice(0, 3); // Top 3

    return { modules, foundUsers, foundClients };
  };

  const results = getResults();
  const hasResults = results && (results.modules.length > 0 || results.foundUsers.length > 0 || results.foundClients.length > 0);

  // --- ACCIONES ---
  const handleNavigate = (view) => {
    navigateTo(view);
    onClose();
  };

  // Estilos Inyectados
  const styles = `
    .cmd-overlay {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(5px);
        z-index: 9999; display: flex; justify-content: center; align-items: flex-start;
        padding-top: 100px;
        animation: fadeIn 0.2s ease-out;
    }
    .cmd-modal {
        width: 600px; max-width: 90%; background: #161b22;
        border: 1px solid #30363d; border-radius: 12px;
        box-shadow: 0 10px 50px rgba(0,0,0,0.5);
        display: flex; flex-direction: column; overflow: hidden;
    }
    .cmd-input-wrapper {
        display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #30363d;
    }
    .cmd-input {
        flex: 1; background: transparent; border: none; color: #e6edf3;
        font-size: 1.2rem; outline: none; margin-left: 15px;
    }
    .cmd-results {
        max-height: 60vh; overflow-y: auto; padding: 10px;
    }
    .cmd-section-title {
        color: #8b949e; font-size: 0.75rem; text-transform: uppercase;
        letter-spacing: 1px; margin: 15px 10px 5px 10px; font-weight: bold;
    }
    .cmd-item {
        display: flex; align-items: center; gap: 15px; padding: 12px 15px;
        border-radius: 8px; cursor: pointer; color: #c9d1d9;
        transition: all 0.2s;
    }
    .cmd-item:hover {
        background: var(--accent); color: #000;
    }
    .cmd-item:hover .icon-box { color: #000; border-color: #000; }
    .cmd-item:hover .subtext { color: rgba(0,0,0,0.6); }

    .icon-box {
        width: 32px; height: 32px; display: flex; alignItems: center; justifyContent: center;
        border-radius: 6px; border: 1px solid #30363d; color: #8b949e;
        background: rgba(255,255,255,0.03);
    }
    .subtext { font-size: 0.8rem; color: #8b949e; margin-left: auto; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `;

  return (
    <div className="cmd-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <style>{styles}</style>
      <div className="cmd-modal">
        <div className="cmd-input-wrapper">
            <Search size={24} color="var(--accent)" />
            <input 
                ref={inputRef}
                className="cmd-input"
                placeholder="¿Qué estás buscando?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <div style={{fontSize:'0.7rem', color:'#8b949e', border:'1px solid #30363d', padding:'2px 6px', borderRadius:'4px'}}>ESC</div>
        </div>

        <div className="cmd-results">
            {!query && (
                <div style={{padding:'40px', textAlign:'center', color:'#8b949e'}}>
                    <p>Escribe para buscar empleados, clientes o secciones.</p>
                </div>
            )}

            {query && !hasResults && (
                <div style={{padding:'20px', textAlign:'center', color:'#ef4444'}}>
                    No se encontraron resultados para "{query}"
                </div>
            )}

            {/* SECCIÓN NAVEGACIÓN */}
            {results?.modules.length > 0 && (
                <>
                    <div className="cmd-section-title">Ir a Módulo</div>
                    {results.modules.map(mod => (
                        <div key={mod.id} className="cmd-item" onClick={() => handleNavigate(mod.id)}>
                            <div className="icon-box"><mod.icon size={18} /></div>
                            <span>{mod.label}</span>
                            <span className="subtext">Saltar <ArrowRight size={12} style={{verticalAlign:'middle'}}/></span>
                        </div>
                    ))}
                </>
            )}

            {/* SECCIÓN USUARIOS */}
            {results?.foundUsers.length > 0 && (
                <>
                    <div className="cmd-section-title">Empleados</div>
                    {results.foundUsers.map(u => (
                        <div key={u.id} className="cmd-item" onClick={() => handleNavigate('usuarios')}>
                            <div className="icon-box"><User size={18} /></div>
                            <div style={{display:'flex', flexDirection:'column'}}>
                                <span style={{fontWeight:'bold'}}>{u.nombre}</span>
                                <span style={{fontSize:'0.75rem', opacity:0.8}}>{u.role.toUpperCase()} • {u.cedula}</span>
                            </div>
                            <span className="subtext">Ver Perfil</span>
                        </div>
                    ))}
                </>
            )}

            {/* SECCIÓN CLIENTES */}
            {results?.foundClients.length > 0 && (
                <>
                    <div className="cmd-section-title">Clientes</div>
                    {results.foundClients.map(c => (
                        <div key={c.id} className="cmd-item" onClick={() => handleNavigate('clientes')}>
                            <div className="icon-box"><Building2 size={18} /></div>
                            <span>{c.nombre}</span>
                            <span className="subtext">Gestionar</span>
                        </div>
                    ))}
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;