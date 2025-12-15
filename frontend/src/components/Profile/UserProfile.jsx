// frontend/src/components/Profile/UserProfile.jsx
import React, { useState, useEffect } from "react";
import { 
    User, Shield, Key, Save, Loader2, Phone, Mail, Hash, 
    X, Trophy, Activity, Clock, Layers, Zap, ShieldCheck 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { API_URL } from "../../config/api";
import { useNavigation } from "../../context/NavigationContext";
import './styleProfile/UserProfile.css';

// SUB-COMPONENTE PARA LAS ESTADÍSTICAS GLOBALES
const UserStats = ({ user }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalStats = async () => {
            if (!user?.id) return;
            try {
                const res = await fetch(`${API_URL}/api/stats/global/${user.id}`);
                const data = await res.json();
                if (res.ok) setStats(data.profile);
            } catch (err) {
                console.error("Error fetching global stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGlobalStats();
    }, [user.id]);

    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!stats) return <div className="stats-container">No se pudieron cargar las estadísticas.</div>;

    const totalPiezas = stats.piezas_totales_contadas + stats.piezas_totales_verificadas;
    const nivel = Math.floor(totalPiezas / 5000) + 1;
    const progresoNivel = ((totalPiezas % 5000) / 5000) * 100;

    return (
        <div className="stats-container">
            <h3 className="stats-header">Estadísticas Globales y Desempeño</h3>
            
            {/* BARRA DE PROGRESO */}
            <div className="progress-section">
                <div className="progress-header">
                    <span>PROGRESO NIVEL {nivel}</span>
                    <span>{Math.round(progresoNivel)}%</span>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar-inner" style={{ width: `${progresoNivel}%` }}></div>
                </div>
            </div>

            {/* METRICAS GLOBALES */}
            <div className="metrics-grid">
                <div className="stat-card">
                    <div className="stat-label"><Trophy size={16} /> PIEZAS TOTALES</div>
                    <div className="stat-value">{totalPiezas.toLocaleString()}</div>
                    <div className="stat-sub">Procesadas en tu carrera</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label"><Clock size={16} /> TIEMPO ACTIVO</div>
                    <div className="stat-value small-font">{stats.horas_totales_trabajadas}</div>
                    <div className="stat-sub">Horas operativas</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label"><Activity size={16} /> PRECISIÓN GLOBAL</div>
                    <div className="stat-value" style={{ color: stats.precision_global > 98 ? '#10b981' : '#f59e0b' }}>
                        {Number(stats.precision_global).toFixed(1)}%
                    </div>
                    <div className="stat-sub">Índice de calidad</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label"><Layers size={16} /> PROYECTOS</div>
                    <div className="stat-value">{stats.inventarios_trabajados}</div>
                    <div className="stat-sub">Clientes auditados</div>
                </div>
            </div>

            {/* DESGLOSE POR ROL */}
            <div className="roles-grid">
                <div className="role-card contador">
                    <h3 className="role-title contador"><Zap /> Desempeño: Contador</h3>
                    <div className="role-stats-container">
                        <div>
                            <div className="role-stat-label">Piezas Contadas</div>
                            <div className="role-stat-value">{stats.piezas_totales_contadas.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="role-stat-label">Velocidad Promedio</div>
                            <div className="role-stat-value">{stats.velocidad_promedio}<span className="role-stat-unit">p/h</span></div>
                        </div>
                    </div>
                </div>
                <div className="role-card verificador">
                    <h3 className="role-title verificador"><ShieldCheck /> Desempeño: Verificador</h3>
                    <div className="role-stats-container">
                        <div>
                            <div className="role-stat-label">Piezas Verificadas</div>
                            <div className="role-stat-value">{stats.piezas_totales_verificadas.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="role-stat-label">Total SKUs</div>
                            <div className="role-stat-value">{stats.skus_totales_procesados.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const UserProfile = () => {
    const { user, login } = useAuth();
    const { navigateTo } = useNavigation();
    const toast = useToast();

    const [formData, setFormData] = useState({
        nombre: user.nombre || "",
        telefono: user.telefono || "",
        password: "",
        confirmPassword: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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

    const roleColorMapping = {
        admin: { main: 'var(--accent)', alpha: 'rgba(0, 224, 255, 0.1)', alphaDark: 'rgba(0, 224, 255, 0.2)', alphaLight: 'rgba(0, 224, 255, 0.05)' },
        supervisor: { main: '#a855f7', alpha: '#a855f71a', alphaDark: '#a855f733', alphaLight: '#a855f70d' },
        verificador: { main: 'var(--success)', alpha: 'rgba(16, 185, 129, 0.1)', alphaDark: 'rgba(16, 185, 129, 0.2)', alphaLight: 'rgba(16, 185, 129, 0.05)' },
        default: { main: '#f59e0b', alpha: '#f59e0b1a', alphaDark: '#f59e0b33', alphaLight: '#f59e0b0d' }
    };

    const colors = roleColorMapping[user.role] || roleColorMapping.default;

    return (
        <div
            className="user-profile-container animate-fade-in"
            style={{
                '--role-color': colors.main,
                '--role-color-alpha': colors.alpha,
                '--role-color-alpha-dark': colors.alphaDark,
                '--role-color-alpha-light': colors.alphaLight,
            }}
        >
            <button onClick={() => navigateTo('dashboard')} className="profile-close-button">
                <X size={24} />
            </button>

            {/* HEADER TARJETA DE IDENTIDAD */}
            <div className="profile-card">
                <div className="profile-bg" />
                <div className="avatar-circle">{user.nombre.charAt(0)}</div>
                <div className="user-details">
                    <div className="user-header">
                        <h1 className="user-name">{user.nombre}</h1>
                        <span className="user-role-pill">{user.role}</span>
                    </div>
                    <div className="meta-row">
                        <span className="meta-item"><Mail size={14} /> {user.correo}</span>
                        <span className="meta-item"><Hash size={14} /> {user.cedula}</span>
                    </div>
                </div>
            </div>

            {/* FORMULARIO DE EDICIÓN */}
            <div className="edit-form-container">
                <h3 className="edit-form-header">
                    <Shield size={20} color="var(--accent)" /> Configuración de Cuenta
                </h3>
                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="form-grid">
                        <div>
                            <label className="form-label">Nombre para mostrar</label>
                            <input name="nombre" value={formData.nombre} onChange={handleChange} className="form-input" />
                        </div>
                        <div>
                            <label className="form-label">Teléfono de Contacto</label>
                            <div className="form-input-wrapper">
                                <Phone size={16} className="form-input-icon" />
                                <input name="telefono" value={formData.telefono} onChange={handleChange} className="form-input form-input-with-icon" placeholder="+507..." />
                            </div>
                        </div>
                    </div>
                    <div className="security-section">
                        <h4 className="security-section-header"><Key size={16} /> Seguridad (Cambiar Contraseña)</h4>
                        <div className="form-grid">
                            <div>
                                <label className="form-label">Nueva Contraseña</label>
                                <input name="password" type="password" value={formData.password} onChange={handleChange} className="form-input" placeholder="Dejar vacío para no cambiar" />
                            </div>
                            <div>
                                <label className="form-label">Confirmar Contraseña</label>
                                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="form-input" placeholder="Repetir nueva contraseña" />
                            </div>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" disabled={isSubmitting} className="pda-btn-primary save-button">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>

            {/* CONTENEDOR DE ESTADÍSTICAS GLOBALES */}
            <UserStats user={user} />
        </div>
    );
};

export default UserProfile;