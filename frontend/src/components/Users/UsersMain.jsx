// frontend/src/components/Users/UsersMain.jsx
import React from "react";
import UserManagement from "../UserManagement/UserManagement";

const UsersMain = () => {
  return (
    <div className="dashboard-container animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/*  User Management Component para gestionar usuarios */}
        <UserManagement />
        
      </div>
    </div>
  );
};

export default UsersMain;