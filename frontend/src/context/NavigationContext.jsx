// frontend/src/context/NavigationContext.jsx
import React, { createContext, useContext, useState } from "react";

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  // Por defecto arrancamos en el Dashboard
  const [currentView, setCurrentView] = useState("dashboard");

  const navigateTo = (viewId) => {
    setCurrentView(viewId);
  };

  return (
    <NavigationContext.Provider value={{ currentView, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation must be used within NavigationProvider");
  return context;
};