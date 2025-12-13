// frontend/src/components/Dashboard/AdminDashboard.jsx
import React from "react";
import { 
  Users, Building2, Activity, AlertTriangle, 
  TrendingUp, ShieldCheck, UserCheck 
} from "lucide-react";
import { useSystemUsers } from "../../context/SystemUsersContext";
import { useClients } from "../../context/ClientContext";

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="stat-card" style={{position:'relative', overflow:'hidden'}}>
    <div style={{position:'absolute', right:-10, top:-10, opacity:0.05, transform:'rotate(15deg)'}}>
      <Icon size={100} color={color} />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <h4 style={{ margin: 0, color: "#8b949e", fontSize: "0.85rem", textTransform: "uppercase" }}>{title}</h4>
        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--fg)", margin: "5px 0" }}>
          {value}
        </div>
      </div>
      <div style={{ background: `${color}20`, padding: "10px", borderRadius: "8px", color: color }}>
        <Icon size={24} />
      </div>
    </div>
    {subtext && (
      <div style={{ fontSize: "0.8rem", color: color, display: "flex", alignItems: "center", gap: "5px" }}>
        <TrendingUp size={14} /> {subtext}
      </div>
    )}
  </div>
);

const AdminDashboard = () => {
  const { users, staffFijo, staffTemporal } = useSystemUsers();
  const { clients, metrics: clientMetrics } = useClients();

  const activeUsers = users.filter(u => u.activo).length;
  const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'supervisor').length;

  // --- ESTILOS RESPONSIVOS ---
  const styles = `
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 25px;
    }
    .panels-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      flex: 1;
    }
    .panel-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
    }
    .stat-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    /* TABLET & MOBILE */
    @media (max-width: 1024px) {
      .dashboard-grid { grid-template-columns: 1fr 1fr; } /* 2 columnas */
      .panels-grid { grid-template-columns: 1fr; } /* Paneles apilados */
    }
    @media (max-width: 600px) {
      .dashboard-grid { grid-template-columns: 1fr; } /* 1 columna */
      h2 { font-size: 1.2rem; }
    }
  `;

  return (
    <div className="dashboard-container animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: 'auto' }}>
      <style>{styles}</style>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom:'25px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px", color: 'var(--fg)' }}>
            <Activity color="var(--accent)" /> Centro de Comando
          </h2>
          <p style={{ margin: "5px 0 0 0", color: "#8b949e", fontSize: "0.9rem" }}>Visión global de operaciones.</p>
        </div>
        <div style={{ padding: "5px 15px", borderRadius: "20px", border: "1px solid var(--success)", color: "var(--success)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", background: "var(--success)", borderRadius: "50%" }}></span>
          OPERATIVO
        </div>
      </div>

      {/* METRICAS */}
      <div className="dashboard-grid">
        <StatCard title="Fuerza Laboral" value={users.length} subtext={`${activeUsers} Activos`} icon={Users} color="var(--accent)" />
        <StatCard title="Cartera Clientes" value={clientMetrics.active} subtext={`Total: ${clientMetrics.total}`} icon={Building2} color="#f59e0b" />
        <StatCard title="Supervisión" value={adminUsers} subtext="Staff de Mando" icon={ShieldCheck} color="var(--accent2)" />
        <StatCard title="Eventuales" value={staffTemporal.length} subtext="Contratos Temporales" icon={UserCheck} color="#10b981" />
      </div>

      {/* PANELES DE DETALLE */}
      <div className="panels-grid">
        {/* Distribución Usuarios */}
        <div className="panel-card">
          <h3 style={{ marginTop: 0, fontSize: "1rem", color: "var(--fg)", borderBottom: "1px solid var(--border)", paddingBottom: "15px" }}>📡 Distribución de Agentes</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{color: '#8b949e'}}>Staff Fijo</span>
              <span style={{fontWeight: 'bold', color: 'var(--accent)'}}>{staffFijo.length}</span>
            </div>
            <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px" }}><div style={{ width: `${(staffFijo.length / (users.length || 1)) * 100}%`, height: "100%", background: "var(--accent)", borderRadius: "3px" }}></div></div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{color: '#8b949e'}}>Personal Temporal</span>
              <span style={{fontWeight: 'bold', color: '#f59e0b'}}>{staffTemporal.length}</span>
            </div>
            <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px" }}><div style={{ width: `${(staffTemporal.length / (users.length || 1)) * 100}%`, height: "100%", background: "#f59e0b", borderRadius: "3px" }}></div></div>
          </div>
        </div>

        {/* Salud de Cartera */}
        <div className="panel-card">
          <h3 style={{ marginTop: 0, fontSize: "1rem", color: "var(--fg)", borderBottom: "1px solid var(--border)", paddingBottom: "15px" }}>🏢 Salud de Cartera</h3>
          <div style={{ marginTop: "15px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
             <div style={{ textAlign: "center", padding: "15px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f59e0b" }}>{clientMetrics.active}</div>
                <div style={{ fontSize: "0.8rem", color: "#8b949e" }}>Activos</div>
             </div>
             <div style={{ textAlign: "center", padding: "15px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ef4444" }}>{clientMetrics.suspended + clientMetrics.inactive}</div>
                <div style={{ fontSize: "0.8rem", color: "#8b949e" }}>Inactivos</div>
             </div>
          </div>
          {clientMetrics.suspended > 0 && (
            <div style={{ marginTop: "auto", padding: "10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "6px", display: "flex", gap: "10px", alignItems: "center", fontSize: "0.85rem", color: "#ef4444" }}>
              <AlertTriangle size={16} /><span>Atención: {clientMetrics.suspended} clientes suspendidos.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;