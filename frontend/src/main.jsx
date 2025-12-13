// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext';
import { SystemUsersProvider } from './context/SystemUsersContext';
import { ClientProvider } from './context/ClientContext';
import { NavigationProvider } from './context/NavigationContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <SystemUsersProvider>
          <ClientProvider>
            <NavigationProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </NavigationProvider>
          </ClientProvider>
        </SystemUsersProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>,
)