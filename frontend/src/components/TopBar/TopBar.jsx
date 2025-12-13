// frontend/src/components/TopBar/TopBar.jsx
import React, { useEffect, useState, useRef } from "react";
import { 
  Search, Menu, Bell, User, LogOut, X, ChevronRight, 
  Box, LayoutDashboard, Building2, FileBarChart, Activity, Clock 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext"; 
import { useNavigation } from "../../context/NavigationContext";
import { useClients } from "../../context/ClientContext";
import { useSystemUsers } from "../../context/SystemUsersContext";
import { useNotifications } from "../../context/NotificationContext";

const TopBar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth(); 
  const { navigateTo } = useNavigation();
  const { clients } = useClients();
  const { users } = useSystemUsers(); 
  
  // FIX: Agregamos markAllAsRead que faltaba en la desestructuración
  const { unreadCount, notifications, isPanelOpen, togglePanel, setIsPanelOpen, markAllAsRead } = useNotifications();

  // Estado de Búsqueda
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  
  // Refs
  const searchContainerRef = useRef(null);
  const notifContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Determinar color de alerta según cantidad
  const getBadgeColor = () => {
      if (unreadCount === 0) return 'transparent';
      if (unreadCount < 5) return 'var(--accent)'; // Azul
      if (unreadCount < 10) return '#f59e0b';     // Naranja
      return '#ef4444';                            // Rojo
  };

  // Cierre al hacer click fuera (Search y Notificaciones)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Search
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        if (!query) setIsSearchOpen(false); 
        setResults(null); 
      }
      // Notificaciones
      if (notifContainerRef.current && !notifContainerRef.current.contains(event.target)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query, setIsPanelOpen]);

  // Lógica de Filtrado de Búsqueda
  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    const term = query.toLowerCase();

    // 1. Módulos
    const modules = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, 
        { id: 'inventario', label: 'Inventario Maestro', icon: Box }, 
        { id: 'usuarios', label: 'Directorio Usuarios', icon: User }, 
        { id: 'clientes', label: 'Cartera Clientes', icon: Building2 }, 
        { id: 'reportes', label: 'Reportes', icon: FileBarChart }
    ].filter(m => m.label.toLowerCase().includes(term));
    
    // 2. Usuarios
    const foundUsers = users.filter(u => 
        u.nombre.toLowerCase().includes(term) || u.cedula.includes(term)
    ).slice(0, 3).map(u => ({ ...u, type: 'Personal', target: 'usuarios' }));
    
    // 3. Clientes
    const foundClients = clients.filter(c => 
        c.nombre.toLowerCase().includes(term)
    ).slice(0, 3).map(c => ({ ...c, type: 'Cliente', target: 'clientes' }));

    if (modules.length > 0 || foundUsers.length > 0 || foundClients.length > 0) {
        setResults({ modules, users: foundUsers, clients: foundClients });
    } else {
        setResults(null);
    }
  }, [query, users, clients]);

  const handleNavigate = (view) => {
    navigateTo(view);
    setQuery("");
    setResults(null);
    setIsSearchOpen(false);
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 600);
  };

  if (!user) return null;

  const styles = `
    .mobile-only { display: none; }
    .desktop-only { display: block; }
    .clickable-profile { cursor: pointer; transition: opacity 0.2s; }
    .clickable-profile:hover { opacity: 0.8; }
    
    /* SEARCH STYLES ANIMADOS */
    .search-wrapper { position: relative; height: 40px; display: flex; align-items: center; justify-content: flex-end; width: 40px; transition: width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }
    .search-wrapper.active { width: 300px; }
    
    .search-trigger { position: absolute; right: 0; top: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; transition: all 0.3s ease; opacity: 1; transform: scale(1); }
    .search-wrapper.active .search-trigger { opacity: 0; transform: scale(0.5); pointer-events: none; }
    
    .search-bar-container { position: absolute; right: 0; top: 0; height: 40px; background: var(--card); border: 1px solid var(--accent); display: flex; align-items: center; box-shadow: 0 0 15px rgba(0, 224, 255, 0.1); overflow: hidden; z-index: 1; width: 40px; border-radius: 50%; opacity: 0; transform: scale(0.8); transition: width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0s, border-radius 0.4s ease 0s, opacity 0.2s ease 0.3s, transform 0.2s ease 0.3s; }
    .search-wrapper.active .search-bar-container { opacity: 1; transform: scale(1); width: 100%; border-radius: 20px; transition: opacity 0.1s ease 0.2s, transform 0.1s ease 0.2s, width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s, border-radius 0.4s ease 0.3s; }
    
    .search-content { display: flex; align-items: center; width: 100%; padding: 0 10px 0 15px; opacity: 0; transition: opacity 0.2s ease; }
    .search-wrapper.active .search-content { opacity: 1; transition-delay: 0.6s; }
    
    .search-input { flex: 1; background: transparent; border: none; color: var(--fg); outline: none; font-size: 0.9rem; margin-left: 8px; }
    
    .search-results-dropdown { position: absolute; top: 55px; left: 0; width: 100%; min-width: 300px; background: #161b22; border: 1px solid #30363d; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 1000; overflow: hidden; animation: slideDown 0.2s ease-out; }
    
    .result-group { padding: 8px 0; }
    .group-title { padding: 0 15px 5px; font-size: 0.7rem; color: #8b949e; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
    .result-item { padding: 10px 15px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: background 0.2s; border-left: 3px solid transparent; }
    .result-item:hover { background: rgba(0, 224, 255, 0.05); border-left-color: var(--accent); }
    .item-icon { color: #8b949e; }
    .result-item:hover .item-icon { color: var(--accent); }

    /* NOTIFICATION STYLES */
    .notif-wrapper { position: relative; }
    .notif-badge { 
        position: absolute; top: 0; right: 0; min-width: 18px; height: 18px; 
        border-radius: 9px; background: ${getBadgeColor()}; color: #000;
        font-size: 0.7rem; font-weight: bold; display: flex; align-items: center; 
        justify-content: center; padding: 0 4px; box-shadow: 0 0 10px ${getBadgeColor()};
        transition: all 0.3s ease; z-index: 10;
        animation: ${unreadCount > 0 ? 'pulse 2s infinite' : 'none'};
    }
    
    .notif-dropdown {
        position: absolute; top: 55px; right: -10px; /* Alineación ajustada */
        width: 400px; /* MÁS ANCHO PARA QUE QUEPAN LOS NOMBRES */
        background: #161b22; border: 1px solid #30363d; border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.8); z-index: 1000;
        max-height: 500px;
        display: flex; 
        flex-direction: column; /* Asegura estructura vertical base */
        animation: slideDown 0.2s ease-out;
        overflow: hidden; /* CLIP: Corta cualquier hijo que se salga */
    }

    .notif-header { 
        padding: 15px 20px; border-bottom: 1px solid #30363d; 
        display: flex; justify-content: space-between; align-items: center; 
        font-weight: bold; color: var(--fg); background: rgba(255,255,255,0.02);
        flex-shrink: 0; /* Evita que el header se aplaste */
    }
    
    .notif-body { 
        overflow-y: auto; 
        flex: 1; 
        display: flex; 
        flex-direction: column; /* Apila las notificaciones verticalmente */
        min-height: 0; /* CRÍTICO: Permite que el contenedor flex calcule el scroll */
    }
    
    .notif-item { 
        padding: 15px 20px; 
        border-bottom: 1px solid rgba(255,255,255,0.05); 
        display: flex; gap: 15px; align-items: flex-start; 
        transition: background 0.2s; 
    }
    .notif-item:hover { background: rgba(255,255,255,0.04); }
    
    .notif-content { flex: 1; min-width: 0; /* Permite truncar texto */ }
    
    .notif-text {
        font-size: 0.9rem; color: var(--fg); line-height: 1.4;
        word-wrap: break-word; /* Evita desbordamiento horizontal */
    }
    
    .notif-time { 
        font-size: 0.7rem; color: #8b949e; margin-top: 6px; 
        display:flex; align-items:center; gap:6px; 
    }

    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    
    @media (max-width: 768px) {
      .mobile-only { display: block; }
      .desktop-only { display: none; }
      .top-bar { padding: 0 10px; height: 60px; }
      .system-tag { font-size: 0.65rem; padding: 2px 6px; letter-spacing: 0.5px; }
      .user-info { display: none; } 
      .top-actions { gap: 10px; }
      .search-wrapper.active { position: absolute; right: 10px; left: 10px; width: auto; z-index: 20; }
      /* Full width en móvil */
      .notif-dropdown { position: fixed; top: 60px; right: 0; left: 0; width: 100%; border-radius: 0; border-left: none; border-right: none; max-height: 60vh; }
    }
  `;

  return (
    <>
        <header className="top-bar">
        <style>{styles}</style>
        
        <div className="top-left">
            <button 
                className="icon-btn mobile-only" 
                style={{ marginRight: '10px' }} 
                onClick={onToggleSidebar}
            >
                <Menu size={24} />
            </button>
            {(!isSearchOpen || window.innerWidth > 768) && (
                <span className="system-tag">PROTOCOL: {user.role?.toUpperCase() || "DESCONOCIDO"}</span>
            )}
        </div>
        
        <div className="top-actions">
            
            <div ref={searchContainerRef} className={`search-wrapper ${isSearchOpen ? 'active' : ''}`}>
                <div className="search-trigger" onClick={handleSearchClick} title="Buscar">
                    <Search size={20} />
                </div>
                <div className="search-bar-container">
                    <div className="search-content">
                        <Search size={16} color="var(--accent)" />
                        <input 
                            ref={inputRef}
                            className="search-input"
                            placeholder="Buscar..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query && (
                            <button onClick={() => {setQuery(""); inputRef.current.focus();}} style={{background:'none', border:'none', cursor:'pointer', color:'#8b949e', display:'flex'}}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
                {isSearchOpen && results && (
                    <div className="search-results-dropdown">
                        {results.modules.length > 0 && results.modules.map(m => <div key={m.id} className="result-item" onClick={()=>handleNavigate(m.id)}><m.icon size={16} className="item-icon" /><div style={{flex:1, fontSize:'0.9rem'}}>{m.label}</div><ChevronRight size={14} color="#30363d" /></div>)}
                        {results.users.length > 0 && (
                            <div className="result-group" style={{borderTop:'1px solid #30363d'}}><div className="group-title">Personal</div>{results.users.map(u => (<div key={u.id} className="result-item" onClick={() => handleNavigate('usuarios')}><User size={16} className="item-icon" /><div style={{flex:1}}><div style={{fontSize:'0.9rem', color:'#e6edf3'}}>{u.nombre}</div><div style={{fontSize:'0.75rem', color:'#8b949e'}}>{u.role} • {u.cedula}</div></div><div style={{fontSize:'0.7rem', color:'var(--accent)', border:'1px solid var(--accent)', borderRadius:'4px', padding:'2px 5px'}}>PERFIL</div></div>))}</div>
                        )}
                        {results.clients.length > 0 && (
                            <div className="result-group" style={{borderTop:'1px solid #30363d'}}><div className="group-title">Clientes</div>{results.clients.map(c => (<div key={c.id} className="result-item" onClick={() => handleNavigate('clientes')}><Building2 size={16} className="item-icon" /><div style={{flex:1}}><div style={{fontSize:'0.9rem', color:'#e6edf3'}}>{c.nombre}</div></div><div style={{fontSize:'0.7rem', color:'#f59e0b', border:'1px solid #f59e0b', borderRadius:'4px', padding:'2px 5px'}}>FICHA</div></div>))}</div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="notif-wrapper" ref={notifContainerRef}>
                <button className="icon-btn" aria-label="Notificaciones" onClick={togglePanel} style={{color: isPanelOpen ? 'var(--fg)' : 'inherit'}}>
                    <Bell size={20} />
                    {unreadCount > 0 && <div className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</div>}
                </button>

                {isPanelOpen && (
                    <div className="notif-dropdown">
                        <div className="notif-header">
                            <span>Bitácora de Eventos</span>
                            <span style={{fontSize:'0.7rem', color:'var(--accent)', cursor:'pointer', padding:'4px 8px', background:'rgba(0, 224, 255, 0.1)', borderRadius:'4px'}} onClick={markAllAsRead}>LEER TODO</span>
                        </div>
                        <div className="notif-body">
                            {notifications.length === 0 ? (
                                <div style={{padding:'40px', textAlign:'center', color:'#8b949e'}}>
                                    <Activity size={32} style={{opacity:0.3, marginBottom:'10px'}}/>
                                    <p>Sin actividad reciente.</p>
                                </div>
                            ) : (
                                notifications.map(log => (
                                    <div key={log.id} className="notif-item">
                                        <div style={{marginTop:'4px', padding:'8px', borderRadius:'50%', background:'rgba(255,255,255,0.05)'}}>
                                            {log.module === 'AUTH' && <User size={16} color="#3b82f6"/>}
                                            {log.module === 'INVENTORY' && <Box size={16} color="#f59e0b"/>}
                                            {log.module === 'GUEST' && <Building2 size={16} color="#10b981"/>}
                                            {!['AUTH','INVENTORY','GUEST'].includes(log.module) && <Activity size={16} color="#8b949e"/>}
                                        </div>
                                        <div className="notif-content">
                                            <div className="notif-text">
                                                <span style={{fontWeight:'bold', color:'var(--fg)'}}>{log.actor_name}</span> 
                                                <span style={{color:'#8b949e'}}>: {log.action.replace(/_/g, ' ')}</span>
                                            </div>
                                            {log.target_label && <div style={{fontSize:'0.8rem', color:'var(--accent)', marginTop:'4px', fontWeight:'500'}}>{log.target_label}</div>}
                                            <div className="notif-time">
                                                <Clock size={12}/> {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="user-profile clickable-profile" onClick={() => navigateTo('perfil')} title="Ir a mi perfil">
                <div className="user-info">
                    <div className="user-name">{user.nombre || "Sin Nombre"}</div>
                    <div className="user-status">{user.user_type === 'Fijo' ? 'Staff' : 'Temp'}</div>
                </div>
                <div className="avatar"><User size={20} /></div>
            </div>
            
            <button className="icon-btn logout-btn" onClick={logout} title="Desconectar Enlace"><LogOut size={18} /></button>
        </div>
        </header>
    </>
  );
};

export default TopBar;