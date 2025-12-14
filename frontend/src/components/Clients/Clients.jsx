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
import { API_URL } from "../../config/api";
import "./Clients.css";

const Clients = () => {
  const { clients, addClient } = useClients();
  const { users, assignUserToClient } = useSystemUsers();
  const { user } = useAuth();
  const toast = useToast(); 
  
  const [selectedClient, setSelectedClient] = useState(null); 
  const [showCreateModal, setShowCreateModal] = useState(false); 
  const [showGuestModal, setShowGuestModal] = useState(null); 

  useEffect(() => {
    const isModalOpen = selectedClient || showGuestModal || showCreateModal;
    if (isModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    // Cleanup function to ensure the class is removed when the component unmounts
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [selectedClient, showGuestModal, showCreateModal]);

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
        <div className="modal-backdrop">
            <div className={`modal-content ${errorMsg ? 'modal-content-error' : ''}`}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title"><Building2 /> Nueva Entidad Corporativa</h2>
                        <p className="modal-subtitle">Registro de cliente en cartera.</p>
                    </div>
                    <button onClick={() => setShowCreateModal(false)} className="modal-close-btn"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div>
                        <h4 className="form-section-title"><Briefcase size={16} color="#f59e0b" /> Identidad</h4>
                        <div className="form-grid">
                            <div><label className="form-label">Razón Social (Legal) *</label><input name="nombre" value={formData.nombre} onChange={handleChange} required className="form-input" /></div>
                            <div><label className="form-label">Nombre Comercial</label><input name="nombre_comercial" value={formData.nombre_comercial} onChange={handleChange} className="form-input" /></div>
                            <div><label className="form-label">RUC / ID Fiscal</label><input name="ruc" value={formData.ruc} onChange={handleChange} className="form-input" /></div>
                            <div><label className="form-label">Correo Corporativo</label><input name="email" type="email" value={formData.email} onChange={handleChange} className="form-input" /></div>
                        </div>
                    </div>
                    <div>
                        <h4 className="form-section-title"><MapPin size={16} color="#f59e0b" /> Ubicación</h4>
                        <div className="form-grid">
                            <div className="form-grid-full"><label className="form-label">Dirección Física</label><input name="direccion" value={formData.direccion} onChange={handleChange} className="form-input" /></div>
                            <div><label className="form-label">Contacto Principal</label><input name="contacto_principal" value={formData.contacto_principal} onChange={handleChange} className="form-input" /></div>
                            <div><label className="form-label">Teléfono</label><input name="telefono" value={formData.telefono} onChange={handleChange} className="form-input" /></div>
                        </div>
                    </div>
                    <div>
                        <h4 className="form-section-title"><FileText size={16} color="#f59e0b" /> Notas</h4>
                        <textarea name="notas" value={formData.notas} onChange={handleChange} className="form-input form-textarea" />
                    </div>

                    <div className="modal-footer">
                        {errorMsg && (
                            <div className="error-message">
                                <AlertTriangle size={18} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-cancel">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="btn-submit">
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
                const res = await fetch(`${API_URL}/api/guest/active-link?cliente_id=${showGuestModal.id}`);
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
            const res = await fetch(`${API_URL}/api/guest/create-link`, {
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
            const res = await fetch(`${API_URL}/api/guest/revoke-link`, {
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
        <div className="modal-backdrop">
            <div className="modal-content guest-modal-content">
                <div className="modal-header guest-modal-header">
                    <div className="guest-modal-title">
                        <Share2 color="#3b82f6" />
                        <h3>Acceso Invitado</h3>
                    </div>
                    <button onClick={() => setShowGuestModal(null)} className="modal-close-btn"><X size={24} /></button>
                </div>
                
                <div className="guest-modal-body">
                    <p className="guest-modal-text">
                        Genere un enlace seguro de solo lectura para: <br/>
                        <strong className="guest-modal-client-name">{showGuestModal.nombre}</strong>
                    </p>

                    {initialLoading ? (
                        <div className="loading-placeholder"><Loader2 className="animate-spin" size={24} /></div>
                    ) : !linkData ? (
                        <div className="no-link-placeholder">
                            <p>No hay enlaces activos para este cliente.</p>
                            <button 
                                onClick={generateLink} 
                                disabled={loading}
                                className="btn-generate-link"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18}/>}
                                GENERAR NUEVO TOKEN
                            </button>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <label className="link-input-label">ENLACE DE ACCESO DIRECTO</label>
                            <div className="link-input-group">
                                <input readOnly value={guestUrl} className="link-input" />
                                <button 
                                    onClick={() => { navigator.clipboard.writeText(guestUrl); setCopied(true); setTimeout(()=>setCopied(false), 2000); }}
                                    className={`btn-copy ${copied ? 'btn-copy-copied' : ''}`}
                                    title="Copiar al portapapeles"
                                >
                                    {copied ? <Check size={20} /> : <Copy size={20} />}
                                </button>
                            </div>
                            
                            <div className="link-details">
                                <div className="link-expiry">
                                    Expira: <strong className="link-expiry-date">{new Date(linkData.expires_at).toLocaleString()}</strong>
                                </div>
                                <button 
                                    onClick={revokeLink}
                                    className="btn-revoke-link"
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
      <div className="client-card">
        <div className="client-card-header">
            <div>
                <h3 className="client-card-title">{client.nombre}</h3>
                <span className={`client-card-status ${client.estado === 'activo' ? 'client-card-status-active' : 'client-card-status-inactive'}`}>{client.estado?.toUpperCase()}</span>
            </div>
            {mainSupervisor ? (
                <div title={`Supervisor: ${mainSupervisor.nombre}`} className="supervisor-avatar supervisor-avatar-assigned">{mainSupervisor.nombre.charAt(0)}</div>
            ) : (
                <div title="Sin Supervisor Asignado" className="supervisor-avatar supervisor-avatar-unassigned"><Crown size={20} /></div>
            )}
        </div>
        <div className="client-card-contact">
            <div className="client-card-contact-item"><Mail size={14} /> {client.email || 'N/A'}</div>
            <div className="client-card-contact-item"><Phone size={14} /> {client.telefono || 'N/A'}</div>
        </div>
        <div className="team-info">
            <div className="team-info-header"><span>FUERZA OPERATIVA</span><span>{staff.length} Agentes</span></div>
            <div className="team-members">
                {staff.slice(0, 6).map(u => (<span key={u.id} className="team-member-tag">{u.nombre.split(' ')[0]}</span>))}
                {staff.length > 6 && <span className="team-member-more">+{staff.length - 6}</span>}
                {staff.length === 0 && <span className="team-member-none">Sin asignaciones</span>}
            </div>
        </div>
        
        <div className="client-card-actions">
            <button onClick={() => setSelectedClient(client)} className="btn-team">
                <Users size={16} /> Equipo
            </button>
            <button onClick={() => setShowGuestModal(client)} className="btn-guest-access" title="Acceso Invitado">
                <Share2 size={16} />
            </button>
        </div>
      </div>
    );
  };

  // --- SUB-COMPONENTE: MODAL DE GESTIÓN DE EQUIPO ---
  const TeamManagerModal = () => {
    if (!selectedClient) return null;

    // IMP: Importar la nueva función del contexto
    const { users, assignUsersToClientBatch } = useSystemUsers();

    const [searchTerm, setSearchTerm] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Estado local para gestionar los cambios antes de guardar
    const [pendingAssignments, setPendingAssignments] = useState(() => 
      users.filter(u => u.cliente_id === selectedClient.id).map(u => u.id)
    );

    // Derivamos las listas desde el estado local 'pendingAssignments' para UI instantánea
    const assignedUsers = useMemo(() => users.filter(u => pendingAssignments.includes(u.id)), [pendingAssignments, users]);
    const availableUsers = useMemo(() => users.filter(u => !pendingAssignments.includes(u.id) && u.activo), [pendingAssignments, users]);
    
    const filterFn = (u) => u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || (u.cedula && u.cedula.includes(searchTerm));

    const handleAssign = (userId) => {
      const targetUser = users.find(u => u.id === userId);
      const isTargetSupervisor = targetUser.role === 'supervisor' || targetUser.role === 'admin';
      const hasSupervisor = assignedUsers.some(u => u.role === 'supervisor' || u.role === 'admin');

      if (isTargetSupervisor && hasSupervisor) {
        toast.warning("Acción denegada: Este cliente ya tiene un Supervisor asignado.");
        return;
      }
      setPendingAssignments(prev => [...prev, userId]);
    };

    const handleRemove = (userId) => {
      setPendingAssignments(prev => prev.filter(id => id !== userId));
    };

    const handleSave = async () => {
      setIsSaving(true);
      const result = await assignUsersToClientBatch(selectedClient.id, pendingAssignments);
      if (result.success) {
        toast.success(result.message || "Equipo actualizado con éxito.");
        setSelectedClient(null); // Cerrar modal
      } else {
        toast.error(result.message || "Error al guardar los cambios.");
      }
      setIsSaving(false);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content team-manager-modal-content">
                <div className="modal-header">
                    <div><h2 className="team-manager-title">Gestión de Equipo</h2><p className="team-manager-subtitle">Asignando personal a: <strong>{selectedClient.nombre}</strong></p></div>
                    <button onClick={() => setSelectedClient(null)} className="modal-close-btn"><X size={24} /></button>
                </div>
                <div className="search-bar-container">
                    <div className="search-bar-wrapper">
                        <Search size={18} className="search-icon" />
                        <input placeholder="Buscar empleado..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
                    </div>
                </div>
                <div className="team-manager-body">
                    <div className="user-list-container">
                        <h4 className="user-list-title"><UserPlus size={16} /> DISPONIBLES ({availableUsers.length})</h4>
                        <div className="user-list">
                            {availableUsers.filter(filterFn).map(u => {
                                const isAssignedElsewhere = u.cliente_id && u.cliente_id !== selectedClient.id;
                                const otherClientName = isAssignedElsewhere ? (clientMap[u.cliente_id] || "Otro Cliente") : "";
                                return (
                                    <div key={u.id} className="user-item">
                                        <div>
                                            <div className="user-name">{u.nombre}</div>
                                            <div className="user-details">{u.role.toUpperCase()} • {u.user_type}</div>
                                            {isAssignedElsewhere && <div className="user-assignment-status"><ArrowRightCircle size={10} /> En: {otherClientName}</div>}
                                        </div>
                                        <button onClick={() => handleAssign(u.id)} className="btn-assign">{isAssignedElsewhere ? 'Mover' : 'Asignar'}</button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="assigned-users-container">
                        <h4 className="assigned-user-title"><Shield size={16} /> ASIGNADOS ({assignedUsers.length})</h4>
                        <div className="user-list">
                            {assignedUsers.filter(filterFn).map(u => (
                                <div key={u.id} className={`assigned-user-item ${u.role === 'supervisor' ? 'assigned-user-item-supervisor' : 'assigned-user-item-default'}`}>
                                    <div>
                                      <div className="user-name" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        {u.nombre}
                                        {u.role === 'supervisor' && <Crown size={14} color="#a855f7" />}
                                      </div>
                                      <div className="user-details">{u.cedula}</div>
                                    </div>
                                    <button onClick={() => handleRemove(u.id)} className="btn-remove" title="Desvincular"><UserMinus size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* --- NUEVO FOOTER CON ACCIONES --- */}
                <div className="modal-footer" style={{padding: '15px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)'}}>
                    <div className="modal-actions">
                        <button type="button" onClick={() => setSelectedClient(null)} className="btn-cancel">Cancelar</button>
                        <button type="button" onClick={handleSave} disabled={isSaving} className="btn-submit">
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="clients-container animate-fade-in">
      <div className="clients-header">
        <div><h2 className="clients-header-title"><Building2 /> Cartera de Clientes</h2><p className="clients-header-subtitle">Administración de relaciones comerciales y asignación de fuerza laboral.</p></div>
        <button onClick={() => setShowCreateModal(true)} className="new-client-btn"><Plus size={18} /> Nuevo Cliente</button>
      </div>
      <div className="clients-grid">
        {clients.map(client => (<ClientCard key={client.id} client={client} />))}
      </div>
      {selectedClient && <TeamManagerModal />}
      {showGuestModal && <GuestAccessModal />}
      {showCreateModal && <CreateClientModal />}
    </div>
  );
};

export default Clients;