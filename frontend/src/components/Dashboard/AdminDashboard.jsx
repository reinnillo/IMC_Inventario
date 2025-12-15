// frontend/src/components/Dashboard/AdminDashboard.jsx
import React from "react";
import { 
  Users, Building2, Activity, AlertTriangle, 
  TrendingUp, ShieldCheck, UserCheck 
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
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

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{ background: 'var(--card-alt)', padding: '5px 10px', border: '1px solid var(--border)', borderRadius: '6px' }}>
        <p className="label">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const DataRow = ({ color, label, value }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', padding: '5px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', background: color, borderRadius: '50%' }}></span>
            <span style={{ color: '#8b949e' }}>{label}</span>
        </div>
        <span style={{ fontWeight: 'bold', color: 'var(--fg)' }}>{value}</span>
    </div>
);


const AdminDashboard = () => {
  const { users, staffFijo, staffTemporal } = useSystemUsers();
  const { clients, metrics: clientMetrics } = useClients();

  const activeUsers = users.filter(u => u.activo).length;
  const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'supervisor').length;

  const userDistributionData = [
    { name: 'Staff Fijo', value: staffFijo.length },
    { name: 'Personal Temporal', value: staffTemporal.length }
  ];
  const userColors = ['var(--accent)', '#f59e0b'];

  const clientHealthData = [
      { name: 'Activos', value: clientMetrics.active },
      { name: 'Inactivos', value: clientMetrics.inactive + clientMetrics.suspended }
  ];
  const clientColors = ['#10b981', '#ef4444'];

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
    
    @media (max-width: 1024px) {
      .dashboard-grid { grid-template-columns: 1fr 1fr; }
      .panels-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      h2 { font-size: 1.2rem; }
    }
    .recharts-legend-item-text { color: var(--fg) !important; }
    .recharts-surface { overflow: visible; }
  `;

  return (
    <div className="dashboard-container animate-fade-in" style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: 'auto' }}>
      <style>{styles}</style>
      
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

      <div className="dashboard-grid">
        <StatCard title="Fuerza Laboral" value={users.length} subtext={`${activeUsers} Activos`} icon={Users} color="var(--accent)" />
        <StatCard title="Cartera Clientes" value={clientMetrics.active} subtext={`Total: ${clientMetrics.total}`} icon={Building2} color="#f59e0b" />
        <StatCard title="Supervisión" value={adminUsers} subtext="Staff de Mando" icon={ShieldCheck} color="var(--accent2)" />
        <StatCard title="Eventuales" value={staffTemporal.length} subtext="Contratos Temporales" icon={UserCheck} color="#10b981" />
      </div>

      <div className="panels-grid">
        <div className="panel-card">
          <h3 style={{ marginTop: 0, fontSize: "1rem", color: "var(--fg)", borderBottom: "1px solid var(--border)", paddingBottom: "15px" }}>📡 Distribución de Agentes</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={userDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} labelLine={false}>
                {userDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={userColors[index % userColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{marginTop: '15px', borderTop: '1px solid var(--border)', paddingTop: '15px'}}>
              <DataRow label="Staff Fijo" value={staffFijo.length} color={userColors[0]} />
              <DataRow label="Personal Temporal" value={staffTemporal.length} color={userColors[1]} />
          </div>
        </div>

        <div className="panel-card">
          <h3 style={{ marginTop: 0, fontSize: "1rem", color: "var(--fg)", borderBottom: "1px solid var(--border)", paddingBottom: "15px" }}>🏢 Salud de Cartera</h3>
          <ResponsiveContainer width="100%" height={160}>
             <PieChart>
                <Pie data={clientHealthData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} labelLine={false}>
                    {clientHealthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={clientColors[index % clientColors.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
           <div style={{marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '15px'}}>
              <DataRow label="Activos" value={clientHealthData[0].value} color={clientColors[0]} />
              <DataRow label="Inactivos" value={clientHealthData[1].value} color={clientColors[1]} />
          </div>
          {clientMetrics.suspended > 0 && (
            <div style={{ marginTop: "15px", padding: "10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "6px", display: "flex", gap: "10px", alignItems: "center", fontSize: "0.85rem", color: "#ef4444" }}>
              <AlertTriangle size={16} /><span>Atención: {clientMetrics.suspended} clientes suspendidos.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;