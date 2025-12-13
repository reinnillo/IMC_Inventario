// frontend/src/components/Users/UsersMain.jsx
import React from "react";
import UserManagement from "../UserManagement/UserManagement";

const UsersMain = () => {
  return (
    <div className="dashboard-container animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ color: 'var(--fg)', marginBottom: '15px' }}>Directorio Completo de Personal</h2>
      <div style={{ flex: 1, position: 'relative', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>

        {/*  User Management Component para gestionar usuarios */}
        <UserManagement />
        
      </div>
    </div>
  );
};

export default UsersMain;