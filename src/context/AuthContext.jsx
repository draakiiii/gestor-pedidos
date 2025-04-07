import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../firebase/config';
import { observarEstadoAuth, cerrarSesion } from '../firebase/auth';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Observar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = observarEstadoAuth((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Limpiar suscripción al desmontar
    return () => unsubscribe();
  }, []);

  // Cerrar sesión
  const logout = async () => {
    try {
      await cerrarSesion();
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Valores del contexto
  const value = {
    currentUser,
    loading,
    logout,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 