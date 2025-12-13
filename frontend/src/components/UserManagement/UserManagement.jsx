// src/components/UserManagement/UserManagement.jsx
import React, { useState } from "react";
import { 
  Users, Plus, X, Loader2, Save, Database, Power, PowerOff, 
  Edit2, Phone, Mail, Hash, Shield, Briefcase 
} from "lucide-react";
import { useSystemUsers } from "../../context/SystemUsersContext"; 
import { useToast } from "../../context/ToastContext"; // <--- Toast System

const UserManagement = () => {
  const { users, loading, error, addUser, editUser } = useSystemUsers();
  const toast = useToast();
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // Si existe, estamos editando

  // Estado del formulario (Para Crear y Editar)
  const initialFormState = {
    nombre: "", correo: "", cedula: "", password: "",
    role: "contador", telefono: "", user_type: "Fijo", activo: true
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- HANDLERS ---

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    // Rellenamos el form con datos existentes (password vacío para no sobreescribir si no se toca)
    setFormData({
        nombre: user.nombre || "",
        correo: user.correo || "",
        cedula: user.cedula || "",
        password: "", // Dejar en blanco para mantener actual
        role: user.role || "contador",
        telefono: user.telefono || "",
        user_type: user.user_type || "Fijo",
        activo: user.activo
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let result;
    
    if (editingUser) {
        // Lógica de Edición (Filtramos password si está vacío)
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        
        result = await editUser(editingUser.id, payload);
    } else {
        // Lógica de Creación
        result = await addUser(formData);
    }
    
    if (result.success) {
      toast.success(editingUser ? "Perfil actualizado correctamente." : "Nuevo agente registrado.");
      setShowModal(false);
    } else {
      toast.error(result.message || "Error en la operación.");
    }
    setIsSubmitting(false);
  };

  // --- SUB-COMPONENT: USER CARD ---
  const UserCard = ({ u }) => {
    const isInactive = !u.activo;
    const roleColor = u.role === 'admin' ? 'var(--accent)' : 
                      u.role === 'supervisor' ? '#a855f7' : 
                      u.role === 'verificador' ? 'var(--success)' : '#f59e0b';

    return (
      <div style={{ 
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', 
        padding: '20px', position: 'relative', overflow: 'hidden',
        transition: 'all 0.2s', opacity: isInactive ? 0.7 : 1
      }} className="user-card hover:border-gray-500">
        
        {/* Status Stripe */}
        <div style={{ 
            position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
            background: isInactive ? '#ef4444' : roleColor 
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ 
                    width: '45px', height: '45px', borderRadius: '50%', 
                    background: `linear-gradient(135deg, ${roleColor}20 0%, ${roleColor}10 100%)`,
                    border: `1px solid ${roleColor}40`, color: roleColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem'
                }}>
                    {u.nombre.charAt(0)}
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--fg)' }}>{u.nombre}</h3>
                    <span style={{ 
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', 
                        background: `${roleColor}20`, color: roleColor, border: `1px solid ${roleColor}40`,
                        textTransform: 'uppercase', fontWeight: 'bold'
                    }}>
                        {u.role}
                    </span>
                </div>
            </div>
            <button 
                onClick={() => openEditModal(u)}
                style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', padding: '5px' }}
                title="Editar Perfil"
            >
                <Edit2 size={18} />
            </button>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '0.85rem', color: '#8b949e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} /> <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{u.correo}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hash size={14} /> {u.cedula}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} /> {u.telefono || 'N/A'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={14} /> {u.user_type.toUpperCase()}
                {u.cliente_id ? <span style={{color:'var(--accent)', marginLeft:'auto', fontSize:'0.7rem'}}>ASIGNADO</span> : <span style={{color:'#6b7280', marginLeft:'auto', fontSize:'0.7rem'}}>LIBRE</span>}
            </div>
        </div>

        {/* Footer Status */}
        <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {u.activo ? (
                    <><Power size={12} color="var(--success)" /> <span style={{color:'var(--success)'}}>ACTIVO</span></>
                ) : (
                    <><PowerOff size={12} color="#ef4444" /> <span style={{color:'#ef4444'}}>INACTIVO</span></>
                )}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                ID: {u.id}
            </div>
        </div>

      </div>
    );
  };

  return (
    <div className="dashboard-container animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
        <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--fg)', margin: 0 }}>
                <Users /> Directorio de Personal
            </h2>
            <p style={{ color: '#8b949e', marginTop: '5px', fontSize: '0.9rem' }}>Gestión completa de perfiles y accesos.</p>
        </div>
        <button 
            onClick={openCreateModal} 
            className="add-user-btn" 
            style={{ width: 'auto', background: 'var(--accent)', color: '#000', cursor: 'pointer' }}
        >
            <Plus size={18} /> Nuevo Agente
        </button>
      </div>

      {/* GRID DE TARJETAS */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", color: 'var(--accent)' }}>
            <Loader2 className="animate-spin" size={48} /> <br/> Sincronizando Matriz...
          </div>
        ) : error ? (
          <div style={{ color: "#ef4444", padding: "20px", border: "1px solid #ef4444", borderRadius: "12px", textAlign: 'center' }}>
            <AlertTriangle style={{marginBottom: '10px'}} /> <br/> {error}
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", opacity: 0.5 }}>
            <Database size={64} style={{ marginBottom: "15px" }} />
            <p>Directorio vacío.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {users.map((u) => <UserCard key={u.id} u={u} />)}
          </div>
        )}
      </div>

      {/* MODAL UNIVERSAL (CREAR / EDITAR) */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.8)", zIndex: 2000,
          display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: "var(--card)", width: "500px", borderRadius: "16px",
            border: `1px solid ${editingUser ? '#a855f7' : 'var(--accent)'}`,
            display: "flex", flexDirection: "column", overflow: 'hidden',
            boxShadow: '0 0 40px rgba(0,0,0,0.5)'
          }}>
            {/* Header Modal */}
            <div style={{ padding: "20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: 'rgba(255,255,255,0.03)' }}>
              <div>
                  <h3 style={{ margin: 0, color: editingUser ? '#a855f7' : 'var(--accent)' }}>
                      {editingUser ? "Editar Perfil" : "Alta de Personal"}
                  </h3>
                  {editingUser && <p style={{margin:'2px 0 0 0', fontSize:'0.8rem', color:'#8b949e'}}>ID: {editingUser.id}</p>}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "var(--fg)", cursor: "pointer" }}>
                <X size={24} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} style={{ padding: '25px', display: "flex", flexDirection: "column", gap: "15px", flex: 1, overflowY: 'auto' }}>
              
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                  <div style={{gridColumn:'span 2'}}>
                    <label style={labelStyle}>Nombre Completo</label>
                    <input name="nombre" value={formData.nombre} onChange={handleChange} required style={inputStyle} placeholder="Ej: Juan Pérez" />
                  </div>
                  
                  <div>
                    <label style={labelStyle}>Cédula / ID</label>
                    <input name="cedula" value={formData.cedula} onChange={handleChange} required style={inputStyle} placeholder="8-888-888" />
                  </div>
                  
                  <div>
                    <label style={labelStyle}>Teléfono</label>
                    <input name="telefono" value={formData.telefono} onChange={handleChange} style={inputStyle} placeholder="+507..." />
                  </div>

                  <div style={{gridColumn:'span 2'}}>
                    <label style={labelStyle}>Correo Corporativo (Login)</label>
                    <input name="correo" type="email" value={formData.correo} onChange={handleChange} required style={inputStyle} />
                  </div>

                  <div style={{gridColumn:'span 2'}}>
                    <label style={labelStyle}>Contraseña {editingUser && <span style={{color:'#8b949e', fontWeight:'normal'}}>(Dejar vacío para no cambiar)</span>}</label>
                    <input name="password" type="password" value={formData.password} onChange={handleChange} required={!editingUser} style={inputStyle} placeholder="••••••••" />
                  </div>
              </div>

              <div style={{display:'flex', gap:'15px', padding:'15px', background:'rgba(0,0,0,0.2)', borderRadius:'8px', border:'1px solid var(--border)'}}>
                  <div style={{flex:1}}>
                      <label style={labelStyle}><Shield size={14} style={{verticalAlign:'middle'}}/> Rol de Sistema</label>
                      <select name="role" value={formData.role} onChange={handleChange} style={selectStyle}>
                        <option value="contador">CONTADOR</option>
                        <option value="verificador">VERIFICADOR</option>
                        <option value="supervisor">SUPERVISOR</option>
                        <option value="admin">ADMIN</option>
                      </select>
                  </div>
                  <div style={{flex:1}}>
                      <label style={labelStyle}><Briefcase size={14} style={{verticalAlign:'middle'}}/> Tipo Contrato</label>
                      <select name="user_type" value={formData.user_type} onChange={handleChange} style={selectStyle}>
                        <option value="Fijo">FIJO (Staff)</option>
                        <option value="Temporal">TEMPORAL</option>
                      </select>
                  </div>
              </div>

              {/* Toggle Activo (Solo edición) */}
              {editingUser && (
                  <div style={{display:'flex', alignItems:'center', gap:'10px', padding:'10px', background: formData.activo ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius:'8px', border: formData.activo ? '1px solid var(--success)' : '1px solid #ef4444'}}>
                      <input 
                        type="checkbox" 
                        name="activo" 
                        checked={formData.activo} 
                        onChange={handleChange}
                        id="activeCheck"
                        style={{width:'20px', height:'20px', cursor:'pointer'}}
                      />
                      <label htmlFor="activeCheck" style={{cursor:'pointer', fontWeight:'bold', color: formData.activo ? 'var(--success)' : '#ef4444'}}>
                          USUARIO {formData.activo ? 'ACTIVO' : 'INACTIVO'}
                      </label>
                  </div>
              )}

              <div style={{ marginTop: "10px", display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="pda-btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                  <button type="submit" className="pda-btn-primary" style={{ flex: 2, background: editingUser ? '#a855f7' : 'var(--accent)', color: '#000' }} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    {editingUser ? "Guardar Cambios" : "Registrar Agente"}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '10px', background: 'var(--bg)',
  border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--fg)', outline: 'none'
};
const selectStyle = { ...inputStyle, cursor: 'pointer' };
const labelStyle = { display: 'block', color: '#8b949e', marginBottom: '5px', fontSize: '0.85rem', fontWeight: 'bold' };

export default UserManagement;