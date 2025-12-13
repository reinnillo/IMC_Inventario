// frontend/src/components/Clients/Clients.jsx
import React, { useState, useMemo, useEffect } from "react";
import { 
  Building2, Plus, Phone, Mail, Users, Crown, Shield, UserMinus, UserPlus, 
  X, Search, Save, MapPin, Briefcase, FileText, Loader2, AlertTriangle, ArrowRightCircle,
  Share2, Copy, RefreshCw, Trash2, Check
} from "lucide-react";
import { useClients } from "../../context/ClientContext";
import { useSystemUsers } from "../../context/SystemUsersContext";
import { useToast } from "../../context/ToastContext"; 
import { useAuth } from "../../context/AuthContext";

const Clients = () => {
  const { clients, addClient } = useClients();
  const { users, assignUserToClient } = useSystemUsers();
  const { user } = useAuth();
  const toast = useToast(); 
  
  const [selectedClient, setSelectedClient] = useState(null); 
  const [showCreateModal, setShowCreateModal] = useState(false); 
  const [showGuestModal, setShowGuestModal] = useState(null); 

  const clientMap = useMemo(() => {
    return clients.reduce((acc, client) => {
        acc[client.id] = client.nombre;
        return acc;
    }, {});
  }, [clients]);

  // --- SUB-COMPONENTE: MODAL CREAR CLIENTE ---
  const CreateClientModal = () => {
    const [formData, setFormData] = useState({
        nombre: "", nombre_comercial: "", ruc: "", telefono: "", email: "",
        direccion: "", contacto_principal: "", telefono_contacto: "", notas: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errorMsg) setErrorMsg(null); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg(null);

        const result = await addClient(formData);
        
        if (result.success) {
            toast.success(`Cliente "${formData.nombre}" registrado exitosamente.`); 
            setShowCreateModal(false);
        } else {
            setErrorMsg(result.message || "Error al crear cliente."); 
        }
        setIsSubmitting(false);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(8px)' }}>
            <div style={{ background: 'var(--card)', width: '700px', maxHeight: '90vh', borderRadius: '16px', border: errorMsg ? '1px solid #ef4444' : '1px solid #f59e0b', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: errorMsg ? '0 0 30px rgba(239, 68, 68, 0.2)' : '0 0 30px rgba(245, 158, 11, 0.2)', transition: 'border-color 0.3s' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245, 158, 11, 0.05)' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '10px' }}><Building2 /> Nueva Entidad Corporativa</h2>
                        <p style={{ margin: '5px 0 0 0', color: '#8b949e', fontSize: '0.85rem' }}>Registro de cliente en cartera.</p>
                    </div>
                    <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--fg)', borderBottom: '1px solid var(--border)', paddingBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={16} color="#f59e0b" /> Identidad</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div><label style={labelStyle}>Razón Social (Legal) *</label><input name="nombre" value={formData.nombre} onChange={handleChange} required style={inputStyle} /></div>
                            <div><label style={labelStyle}>Nombre Comercial</label><input name="nombre_comercial" value={formData.nombre_comercial} onChange={handleChange} style={inputStyle} /></div>
                            <div><label style={labelStyle}>RUC / ID Fiscal</label><input name="ruc" value={formData.ruc} onChange={handleChange} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Correo Corporativo</label><input name="email" type="email" value={formData.email} onChange={handleChange} style={inputStyle} /></div>
                        </div>
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--fg)', borderBottom: '1px solid var(--border)', paddingBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} color="#f59e0b" /> Ubicación</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Dirección Física</label><input name="direccion" value={formData.direccion} onChange={handleChange} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Contacto Principal</label><input name="contacto_principal" value={formData.contacto_principal} onChange={handleChange} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Teléfono</label><input name="telefono" value={formData.telefono} onChange={handleChange} style={inputStyle} /></div>
                        </div>
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--fg)', borderBottom: '1px solid var(--border)', paddingBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} color="#f59e0b" /> Notas</h4>
                        <textarea name="notas" value={formData.notas} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        {errorMsg && (
                            <div style={{ 
                                background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', 
                                borderRadius: '8px', marginBottom: '15px', display: 'flex', alignItems: 'center', 
                                gap: '10px', fontSize: '0.9rem', border: '1px solid #ef4444', animation: 'fadeIn 0.3s' 
                            }}>
                                <AlertTriangle size={18} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                            <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: '#8b949e', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                            <button type="submit" disabled={isSubmitting} style={{ background: '#f59e0b', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', opacity: isSubmitting ? 0.7 : 1 }}>
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Registrar Cliente
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
  };

  // --- SUB-COMPONENTE: MODAL GUEST ACCESS (ACTUALIZADO) ---
  const GuestAccessModal = () => {
    if (!showGuestModal) return null;
    
    const [linkData, setLinkData] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // 1. CARGAR LINK EXISTENTE AL ABRIR
    useEffect(() => {
        const fetchActiveLink = async () => {
            setInitialLoading(true);
            try {
                const res = await fetch(`http://localhost:3000/api/guest/active-link?cliente_id=${showGuestModal.id}`);
                const data = await res.json();
                if (res.ok && data.link) {
                    setLinkData(data.link);
                }
            } catch (e) { console.error(e); }
            finally { setInitialLoading(false); }
        };
        fetchActiveLink();
    }, [showGuestModal]);

    // 2. GENERAR NUEVO
    const generateLink = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/guest/create-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    cliente_id: showGuestModal.id,
                    expires_in_hours: 24,
                    alias_auditoria: `Auditoría ${new Date().getFullYear()}`,
                    // data para auditoría
                    auditoria_data: {
                        admin_id: user.id, 
                        admin_name: user.nombre, 
                        admin_role: user.role, 
                        cliente_name: showGuestModal.nombre
                    }
                })
            });

            const data = await res.json();
            if(res.ok) {
                setLinkData(data.link);
                toast.success("Enlace de acceso generado.");
            } else {
                toast.error("Error: " + data.error);
            }
        } catch (e) { toast.error("Error de conexión."); }
        finally { setLoading(false); }
    };

    // 3. REVOCAR
    const revokeLink = async () => {
        if(!window.confirm("¿Desactivar el acceso de invitado actual?")) return;
        
        try {
            const res = await fetch('http://localhost:3000/api/guest/revoke-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    cliente_id: showGuestModal.id,
                    // Datos para auditoría
                    auditoria_data: {
                        admin_id: user.id, 
                        admin_name: user.nombre, 
                        admin_role: user.role,
                        cliente_name: showGuestModal.nombre,
                    }
                })
            });
            
            if(res.ok) {
                setLinkData(null);
                toast.info("Enlace revocado. El acceso externo ha sido bloqueado.");
            } else {
                toast.error("No se pudo revocar el enlace.");
            }
        } catch(e) {
            toast.error("Error de conexión.");
        }
    };

    const guestUrl = linkData ? `${window.location.origin}/?token=${linkData.token}` : "";

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
            <div style={{ background: 'var(--card)', width: '500px', borderRadius: '16px', border: '1px solid #3b82f6', overflow: 'hidden', boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)' }}>
                <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <Share2 color="#3b82f6" />
                        <h3 style={{ margin: 0, color: '#3b82f6' }}>Acceso Invitado</h3>
                    </div>
                    <button onClick={() => setShowGuestModal(null)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                
                <div style={{ padding: '30px', display:'flex', flexDirection:'column', gap:'20px' }}>
                    <p style={{ margin: 0, color: '#e6edf3', fontSize: '0.9rem', textAlign:'center' }}>
                        Genere un enlace seguro de solo lectura para: <br/>
                        <strong style={{fontSize:'1.1rem', color:'var(--accent)'}}>{showGuestModal.nombre}</strong>
                    </p>

                    {initialLoading ? (
                        <div style={{textAlign:'center', padding:'20px', color:'#3b82f6'}}><Loader2 className="animate-spin" size={24} /></div>
                    ) : !linkData ? (
                        <div style={{ textAlign: 'center', padding: '20px', border: '2px dashed #30363d', borderRadius: '12px', color: '#8b949e' }}>
                            <p>No hay enlaces activos para este cliente.</p>
                            <button 
                                onClick={generateLink} 
                                disabled={loading}
                                style={{ marginTop: '10px', background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display:'inline-flex', alignItems:'center', gap:'8px', fontWeight:'bold' }}
                            >
                                {loading ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18}/>}
                                GENERAR NUEVO TOKEN
                            </button>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <label style={{ display: 'block', color: '#8b949e', fontSize: '0.8rem', marginBottom: '5px' }}>ENLACE DE ACCESO DIRECTO</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input readOnly value={guestUrl} style={{ flex: 1, background: '#0d1117', border: '1px solid #30363d', color: '#10b981', padding: '10px', borderRadius: '6px', fontFamily: 'monospace' }} />
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(guestUrl); setCopied(true); setTimeout(()=>setCopied(false), 2000); }}
                                    style={{ background: '#30363d', border: '1px solid #30363d', borderRadius: '6px', padding: '0 12px', cursor: 'pointer', color: copied ? '#10b981' : 'white' }}
                                    title="Copiar al portapapeles"
                                >
                                    {copied ? <Check size={20} /> : <Copy size={20} />}
                                </button>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>
                                    Expira: <strong style={{color:'#e6edf3'}}>{new Date(linkData.expires_at).toLocaleString()}</strong>
                                </div>
                                <button 
                                    onClick={revokeLink}
                                    style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px' }}
                                >
                                    <Trash2 size={14} /> REVOCAR
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  // --- SUB-COMPONENTE: CARD DE CLIENTE ---
  const ClientCard = ({ client }) => {
    const assignedTeam = users.filter(u => u.cliente_id === client.id && u.activo);
    const supervisors = assignedTeam.filter(u => u.role === 'supervisor' || u.role === 'admin');
    const staff = assignedTeam.filter(u => u.role !== 'supervisor' && u.role !== 'admin');
    const mainSupervisor = supervisors[0];

    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <h3 style={{ margin: '0 0 5px 0', color: 'var(--fg)', fontSize: '1.2rem' }}>{client.nombre}</h3>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: client.estado === 'activo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: client.estado === 'activo' ? '#10b981' : '#ef4444', border: `1px solid ${client.estado === 'activo' ? '#10b981' : '#ef4444'}` }}>{client.estado?.toUpperCase()}</span>
            </div>
            {mainSupervisor ? (
                <div title={`Supervisor: ${mainSupervisor.nombre}`} style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)', boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>{mainSupervisor.nombre.charAt(0)}</div>
            ) : (
                <div title="Sin Supervisor Asignado" style={{ width: '45px', height: '45px', borderRadius: '50%', border: '2px dashed #8b949e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e' }}><Crown size={20} /></div>
            )}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#8b949e', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Mail size={14} /> {client.email || 'N/A'}</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Phone size={14} /> {client.telefono || 'N/A'}</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: '#8b949e', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}><span>FUERZA OPERATIVA</span><span>{staff.length} Agentes</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {staff.slice(0, 6).map(u => (<span key={u.id} style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0, 224, 255, 0.05)', color: 'var(--accent)', border: '1px solid rgba(0, 224, 255, 0.2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{u.nombre.split(' ')[0]}</span>))}
                {staff.length > 6 && <span style={{ fontSize: '0.7rem', padding: '3px 6px', color: '#8b949e' }}>+{staff.length - 6}</span>}
                {staff.length === 0 && <span style={{ fontSize: '0.7rem', color: '#8b949e', fontStyle: 'italic' }}>Sin asignaciones</span>}
            </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={() => setSelectedClient(client)} style={{ flex: 2, background: 'transparent', border: '1px solid var(--border)', color: 'var(--fg)', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
                <Users size={16} /> Equipo
            </button>
            <button onClick={() => setShowGuestModal(client)} style={{ flex: 1, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', color: '#3b82f6', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} title="Acceso Invitado">
                <Share2 size={16} />
            </button>
        </div>
      </div>
    );
  };

  // --- SUB-COMPONENTE: MODAL DE GESTIÓN DE EQUIPO ---
  const TeamManagerModal = () => {
    if (!selectedClient) return null;
    const [searchTerm, setSearchTerm] = useState("");
    const assignedUsers = users.filter(u => u.cliente_id === selectedClient.id);
    const availableUsers = users.filter(u => u.cliente_id !== selectedClient.id && u.activo); 
    const filterFn = (u) => u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || u.cedula.includes(searchTerm);
    const hasSupervisor = assignedUsers.some(u => u.role === 'supervisor' || u.role === 'admin');

    const handleAssign = async (userId) => {
        const targetUser = users.find(u => u.id === userId);
        const isTargetSupervisor = targetUser.role === 'supervisor' || targetUser.role === 'admin';
        if (isTargetSupervisor && hasSupervisor) {
            toast.warning("Acción denegada: Este cliente ya tiene un Supervisor asignado."); 
            return;
        }
        const result = await assignUserToClient(userId, selectedClient.id);
        if(result.success) toast.success(`${targetUser.nombre} asignado correctamente.`); 
        else toast.error("Error al asignar personal.");
    };

    const handleRemove = async (userId) => { 
        const result = await assignUserToClient(userId, null); 
        if(result.success) toast.info("Personal desvinculado."); 
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
            <div style={{ background: 'var(--card)', width: '900px', height: '80vh', borderRadius: '16px', border: '1px solid var(--accent)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><h2 style={{ margin: 0, color: 'var(--accent)' }}>Gestión de Equipo</h2><p style={{ margin: '5px 0 0 0', color: '#8b949e' }}>Asignando personal a: <strong style={{color: 'white'}}>{selectedClient.nombre}</strong></p></div>
                    <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <div style={{ padding: '15px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: '#8b949e' }} />
                        <input placeholder="Buscar empleado..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 40px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--fg)', outline: 'none' }} />
                    </div>
                </div>
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
                        <h4 style={{ marginTop: 0, color: '#8b949e', display: 'flex', alignItems: 'center', gap: '8px' }}><UserPlus size={16} /> DISPONIBLES ({availableUsers.length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {availableUsers.filter(filterFn).map(u => {
                                const isAssignedElsewhere = !!u.cliente_id;
                                const otherClientName = isAssignedElsewhere ? (clientMap[u.cliente_id] || "Otro Cliente") : "";
                                return (
                                    <div key={u.id} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid transparent' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{u.nombre}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>{u.role.toUpperCase()} • {u.user_type}</div>
                                            {isAssignedElsewhere && <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowRightCircle size={10} /> En: {otherClientName}</div>}
                                        </div>
                                        <button onClick={() => handleAssign(u.id)} style={{ background: 'var(--accent)', color: 'black', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}>{isAssignedElsewhere ? 'Mover' : 'Asignar'}</button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto', background: 'rgba(0, 224, 255, 0.02)' }}>
                        <h4 style={{ marginTop: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={16} /> ASIGNADOS ({assignedUsers.length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {assignedUsers.filter(filterFn).map(u => (
                                <div key={u.id} style={{ padding: '10px', borderRadius: '8px', background: 'var(--card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `3px solid ${u.role === 'supervisor' ? '#a855f7' : 'var(--accent)'}` }}>
                                    <div><div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>{u.nombre}{u.role === 'supervisor' && <Crown size={14} color="#a855f7" />}</div><div style={{ fontSize: '0.75rem', color: '#8b949e' }}>{u.cedula}</div></div>
                                    <button onClick={() => handleRemove(u.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Desvincular"><UserMinus size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div><h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b', margin: 0 }}><Building2 /> Cartera de Clientes</h2><p style={{ color: '#8b949e', marginTop: '5px' }}>Administración de relaciones comerciales y asignación de fuerza laboral.</p></div>
        <button onClick={() => setShowCreateModal(true)} className="add-user-btn" style={{ width: 'auto', background: '#f59e0b', color: '#000', cursor: 'pointer' }}><Plus size={18} /> Nuevo Cliente</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {clients.map(client => (<ClientCard key={client.id} client={client} />))}
      </div>
      {selectedClient && <TeamManagerModal />}
      {showGuestModal && <GuestAccessModal />}
      {showCreateModal && <CreateClientModal />}
    </div>
  );
};

const inputStyle = { width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--fg)', outline: 'none' };
const labelStyle = { display: 'block', color: '#8b949e', marginBottom: '5px', fontSize: '0.85rem' };

export default Clients;