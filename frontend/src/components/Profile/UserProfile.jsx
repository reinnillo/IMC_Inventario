// frontend/src/components/Profile/UserProfile.jsx
import React, { useState } from "react";
import { User, Shield, Key, Save, Loader2, Phone, Mail, Hash, Briefcase, BarChart2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import GlobalProfile from "./GlobalProfile"; 
import { API_URL } from "../../config/api";

const UserProfile = () => {
  const { user, login } = useAuth(); 
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    nombre: user.nombre || "",
    telefono: user.telefono || "",
    password: "",
    confirmPassword: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGlobalStats, setShowGlobalStats] = useState(false); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // actualizacion de perfil
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
        toast.error("Las contraseñas no coinciden.");
        return;
    }
    setIsSubmitting(true);
    try {
        const res = await fetch(`${API_URL}/api/auth/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: user.id,
                nombre: formData.nombre,
                telefono: formData.telefono,
                password: formData.password,
                // Datos de auditoría
                user_id: user.id,
                user_name: user.nombre,
                user_role: user.role,
                user_email: user.correo
            })
        });
        const result = await res.json();
        if (res.ok) {
            toast.success("Perfil actualizado. Datos sincronizados.");
            login(result.user); 
            setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
        } else {
            throw new Error(result.error);
        }
    } catch (err) {
        toast.error("Error: " + err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const roleColor = user.role === 'admin' ? 'var(--accent)' : 
                    user.role === 'supervisor' ? '#a855f7' : 
                    user.role === 'verificador' ? 'var(--success)' : '#f59e0b';

  // --- ESTILOS RESPONSIVOS (CORREGIDOS) ---
  // Nota: Se corrigió la sintaxis de JS (flexDirection) a CSS (flex-direction)
  const styles = `
    .profile-card {
        background: var(--card); border-radius: 16px; border: 1px solid var(--border);
        padding: 30px; margin-bottom: 30px; display: flex; gap: 25px; align-items: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative; overflow: hidden;
    }
    .profile-bg {
        position: absolute; top: 0; right: 0; width: 150px; height: 100%;
        background: linear-gradient(90deg, transparent, ${roleColor}10);
        transform: skewX(-20deg);
    }
    .avatar-circle {
        width: 100px; height: 100px; border-radius: 50%;
        background: linear-gradient(135deg, ${roleColor}20, ${roleColor}05);
        border: 2px solid ${roleColor}; display: flex; align-items: center; justify-content: center;
        color: ${roleColor}; fontSize: 2.5rem; fontWeight: bold; flex-shrink: 0;
    }
    .user-details { flex: 1; z-index: 1; min-width: 0; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .meta-row { display: flex; gap: 20px; color: #8b949e; font-size: 0.9rem; margin-bottom: 15px; flex-wrap: wrap; }

    @media (max-width: 768px) {
        .profile-card { flex-direction: column; text-align: center; padding: 20px; }
        .profile-bg { width: 100%; height: 80px; top: auto; bottom: 0; transform: none; background: linear-gradient(0deg, ${roleColor}10, transparent); }
        .user-details { width: 100%; display: flex; flex-direction: column; align-items: center; }
        .meta-row { flex-direction: column; gap: 5px; margin-bottom: 20px; justify-content: center; }
        .form-grid { grid-template-columns: 1fr; } /* 1 Columna en móvil */
        h1 { font-size: 1.5rem; }
    }
  `;

  return (
    <div className="dashboard-container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <style>{styles}</style>

      {/* HEADER TARJETA DE IDENTIDAD */}
      <div className="profile-card">
          <div className="profile-bg" />

          <div className="avatar-circle">
              {user.nombre.charAt(0)}
          </div>
          
          <div className="user-details">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', justifyContent: 'inherit', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, color: 'var(--fg)', wordBreak: 'break-word' }}>{user.nombre}</h1>
                  <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', background: roleColor, color: '#000', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {user.role}
                  </span>
              </div>
              <div className="meta-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={14} /> {user.correo}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Hash size={14} /> {user.cedula}</span>
              </div>
              
              <button 
                onClick={() => setShowGlobalStats(true)}
                style={{ 
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', 
                    color: 'var(--fg)', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem'
                }}
              >
                  <BarChart2 size={16} color="var(--accent)" /> Ver Estadísticas Globales
              </button>
          </div>
      </div>

      {/* FORMULARIO DE EDICIÓN */}
      <div style={{ background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '30px' }}>
        <h3 style={{ margin: '0 0 20px 0', color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
            <Shield size={20} color="var(--accent)" /> Configuración de Cuenta
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-grid">
                <div>
                    <label style={labelStyle}>Nombre para mostrar</label>
                    <input name="nombre" value={formData.nombre} onChange={handleChange} style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}>Teléfono de Contacto</label>
                    <div style={{ position: 'relative' }}>
                        <Phone size={16} style={{ position: 'absolute', top: 12, left: 12, color: '#8b949e' }} />
                        <input name="telefono" value={formData.telefono} onChange={handleChange} style={{ ...inputStyle, paddingLeft: '40px' }} placeholder="+507..." />
                    </div>
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border)', marginTop: '10px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#f59e0b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={16} /> Seguridad (Cambiar Contraseña)
                </h4>
                <div className="form-grid">
                    <div>
                        <label style={labelStyle}>Nueva Contraseña</label>
                        <input name="password" type="password" value={formData.password} onChange={handleChange} style={inputStyle} placeholder="Dejar vacío para no cambiar" />
                    </div>
                    <div>
                        <label style={labelStyle}>Confirmar Contraseña</label>
                        <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} style={inputStyle} placeholder="Repetir nueva contraseña" />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="pda-btn-primary" 
                    style={{ width: 'auto', padding: '12px 30px', background: 'var(--accent)', color: '#000' }}
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
                    Guardar Cambios
                </button>
            </div>

        </form>
      </div>

      {showGlobalStats && <GlobalProfile onClose={() => setShowGlobalStats(false)} />}

    </div>
  );
};

const inputStyle = { width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--fg)', outline: 'none', fontSize: '0.95rem' };
const labelStyle = { display: 'block', color: '#8b949e', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' };

export default UserProfile;