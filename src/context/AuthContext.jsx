import React, { createContext, useContext, useState, useEffect } from 'react';
import { authStorage, getCurrentUser } from '../services/authApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check local auth token and user data
        const isAuth = authStorage.isAuthenticated();
        const userData = authStorage.getUserData();

        if (isAuth) {
          // Consider user authenticated if a token exists
          setIsAuthenticated(true);
          if (userData) {
            setUser(userData);
          }

          // Try to refresh from server, but do not log the user out on failure
          try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
              const updatedUserData = {
                ...(userData || {}),
                ...(currentUser.user || currentUser)
              };
              setUser(updatedUserData);
              authStorage.setAuth(authStorage.getToken(), updatedUserData);
            }
          } catch (error) {
            console.warn('Failed to fetch current user:', error);
            // Keep local state; do not clear auth on init
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Do not clear auth on initialization errors; leave existing state to avoid logging out on refresh
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (token, userData) => {
    authStorage.setAuth(token, userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authStorage.clearAuth();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    authStorage.setAuth(authStorage.getToken(), updatedUser);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
