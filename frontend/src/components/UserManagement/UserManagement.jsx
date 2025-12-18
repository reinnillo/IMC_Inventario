// src/components/UserManagement/UserManagement.jsx
import React, { useState } from "react";
import { 
  Users, Plus, X, Loader2, Save, Database, Power, PowerOff, 
  Edit2, Phone, Mail, Hash, Shield, Briefcase, AlertTriangle, User, UserCog
} from "lucide-react";
import { useSystemUsers } from "../../context/SystemUsersContext"; 
import { useToast } from "../../context/ToastContext";
import './UserManagement.css'; // <-- 1. IMPORTAR EL CSS

const UserManagement = () => {
  const { users, loading, error, addUser, editUser } = useSystemUsers();
  const toast = useToast();

  //obteniendo usuario actual desde localStorage
  const currentUser = JSON.parse(localStorage.getItem("user"));
  let userRole = currentUser ? currentUser.role : null;

  // --- STATE VARIABLES ---
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

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
    setFormData({
        nombre: user.nombre || "",
        correo: user.correo || "",
        cedula: user.cedula || "",
        password: "",
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
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        result = await editUser(editingUser.id, payload);
    } else {
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
    // Definición de colores vivos por rol
    const roleColor = u.role === 'admin' ? '#D4AF37' :           // Gold
                      u.role === 'supervisor' ? '#279AF1' :       // Vivid Blue
                      u.role === 'verificador' ? '#4CAF50' :      // Vivid Green
                      '#F44336';                                  // Vivid Red (for contador)
    
    // Para pasar colores con transparencia a CSS variables
    const roleColor_20 = roleColor + '33';
    const roleColor_10 = roleColor + '1A';
    const roleColor_40 = roleColor + '66';

    const cardClassName = `user-card ${isInactive ? 'inactive' : ''} ${u.role === 'admin' ? 'admin-card' : ''} ${u.role === 'supervisor' ? 'supervisor-card' : ''}`;

    return (
      <div 
        className={cardClassName}
        style={{
          '--role-color': roleColor,
          '--role-color-10': roleColor_10,
          '--role-color-20': roleColor_20,
          '--role-color-40': roleColor_40,
        }}
      >
        <div className="user-card-status-stripe" />

        <div className="user-card-header">
            <div className="user-card-info">
                <div className="user-card-avatar">
                    {u.role === 'admin' ? <UserCog size={22} /> : <User size={22} />}
                </div>
                <div>
                    <h3 className="user-card-name">{u.nombre}</h3>
                    <span className="user-card-role-badge">
                        {u.role}
                    </span>
                </div>
            </div>

            {/* El botón de editar no se muestra para el rol de admin */}
            {u.role !== 'admin' && (
              <button onClick={() => openEditModal(u)} className="user-card-edit-btn" title="Editar Perfil">
                  <Edit2 size={18} />
              </button>
            )}
        </div>

        <div className="user-card-details-grid">
            <div className="detail-item">
                <Mail size={14} /> <span>{u.correo}</span>
            </div>
            <div className="detail-item">
                <Hash size={14} /> {u.cedula}
            </div>
            <div className="detail-item">
                <Phone size={14} /> {u.telefono || 'N/A'}
            </div>
            <div className="detail-item">
                <Briefcase size={14} /> {u.user_type.toUpperCase()}
                {/* Los admins no se asignan, no mostrar estado de asignación */}
                {u.role !== 'admin' && (
                  u.cliente_id 
                      ? <span className="detail-label">ASIGNADO</span> 
                      : <span className="detail-label free">LIBRE</span>
                )}
            </div>
        </div>

        <div className="user-card-footer">
            <div className={`status-text ${u.activo ? 'active' : 'inactive'}`}>
                {u.activo ? <Power size={12} color="var(--success)" /> : <PowerOff size={12} color="#ef4444" />}
                {u.activo ? 'ACTIVO' : 'INACTIVO'}
            </div>
            <div className="user-id-text">
                ID: {u.id}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="user-management-container animate-fade-in">
      
      <div className="user-management-header">
        <div className="header-title-group">
            <h2 className="header-title">
                <Users /> Directorio de Personal
            </h2>
            <p className="header-subtitle">Gestión completa de perfiles y accesos.</p>
        </div>
        <button onClick={openCreateModal} className="add-user-btn">
            <Plus size={18} /> Nuevo Agente
        </button>
      </div>

      <div className="user-grid-container">
        {loading ? (
          <div className="centered-feedback loading">
            <Loader2 className="animate-spin centered-feedback-icon" size={48} /> <br/> Sincronizando Matriz...
          </div>
        ) : error ? (
          <div className="error-feedback">
            <AlertTriangle className="centered-feedback-icon" /> <br/> {error}
          </div>
        ) : users.length === 0 ? (
          <div className="centered-feedback">
            <Database size={64} className="centered-feedback-icon" />
            <p>Directorio vacío.</p>
          </div>
        ) : (
          <div className="user-grid">
            {users.map((u) => <UserCard key={u.id} u={u} />)}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className={`modal-content ${editingUser ? 'editing' : ''}`}>
            
            <div className="modal-header">
              <div>
                  <h3 className="modal-title">
                      {editingUser ? "Editar Perfil" : "Alta de Personal"}
                  </h3>
                  {editingUser && <p className="modal-subtitle">ID: {editingUser.id}</p>}
              </div>
              <button onClick={() => setShowModal(false)} className="modal-close-btn">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              
              <div className="form-grid">
                  <div className="form-group-full">
                    <label className="form-label">Nombre Completo</label>
                    <input name="nombre" value={formData.nombre} onChange={handleChange} required className="form-input" placeholder="Ej: Juan Pérez" />
                  </div>
                  
                  <div>
                    <label className="form-label">Cédula / ID</label>
                    <input name="cedula" value={formData.cedula} onChange={handleChange} required className="form-input" placeholder="8-888-888" />
                  </div>
                  
                  <div>
                    <label className="form-label">Teléfono</label>
                    <input name="telefono" value={formData.telefono} onChange={handleChange} className="form-input" placeholder="+507..." />
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">Correo Corporativo (Login)</label>
                    <input name="correo" type="email" value={formData.correo} onChange={handleChange} required className="form-input" />
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">Contraseña {editingUser && <span className="password-note">(Dejar vacío para no cambiar)</span>}</label>
                    <input name="password" type="password" value={formData.password} onChange={handleChange} required={!editingUser} className="form-input" placeholder="••••••••" />
                  </div>
              </div>

              <div className="form-selectors-container">
                  <div className="selector-group">
                      <label className="form-label"><Shield size={14} /> Rol de Sistema</label>
                      <select name="role" value={formData.role} onChange={handleChange} className="form-select">
                        <option value="contador">CONTADOR</option>
                        <option value="verificador">VERIFICADOR</option>
                        {userRole === 'admin' && <option value="supervisor">SUPERVISOR</option>}
                        {userRole === 'admin' && <option value="admin">ADMIN</option>}
                      </select>
                  </div>
                  <div className="selector-group">
                      <label className="form-label"><Briefcase size={14} /> Tipo Contrato</label>
                      <select name="user_type" value={formData.user_type} onChange={handleChange} className="form-select">
                        <option value="Fijo">FIJO (Staff)</option>
                        <option value="Temporal">TEMPORAL</option>
                      </select>
                  </div>
              </div>

              {editingUser && (
                  <div className={`active-toggle-container ${formData.activo ? 'active' : 'inactive'}`}>
                      <input 
                        type="checkbox" 
                        name="activo" 
                        checked={formData.activo} 
                        onChange={handleChange}
                        id="activeCheck"
                        className="active-toggle-checkbox"
                      />
                      <label htmlFor="activeCheck" className={`active-toggle-label ${formData.activo ? 'active' : 'inactive'}`}>
                          USUARIO {formData.activo ? 'ACTIVO' : 'INACTIVO'}
                      </label>
                  </div>
              )}

              <div className="form-button-group">
                  <button type="button" onClick={() => setShowModal(false)} className="pda-btn-secondary">Cancelar</button>
                  <button type="submit" className="pda-btn-primary" disabled={isSubmitting}>
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

export default UserManagement;