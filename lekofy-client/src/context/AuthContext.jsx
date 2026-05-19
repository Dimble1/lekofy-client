import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, setToken, getToken, setUserToStorage, getUserFromStorage, logout as logoutApi } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Проверяем токен при загрузке
  useEffect(() => {
    const token = getToken();
    const savedUser = getUserFromStorage();
    
    if (token && savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (loginValue, password) => {
    try {
      setError(null);
      const { token, user: userData } = await authAPI.login(loginValue, password);
      
      setToken(token);
      setUserToStorage(userData);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const register = async (name, email, password, phone, confirmPassword) => {
    try {
      setError(null);
      const { token, user: userData } = await authAPI.register(name, email, password, phone, confirmPassword);
      
      setToken(token);
      setUserToStorage(userData);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    logoutApi();
    setUser(null);
    setError(null);
  };

  const setAuthUser = (nextUser) => {
    setUser(nextUser);
    setUserToStorage(nextUser);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    setAuthUser,
    isLoggedIn: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Хук для использования контекста
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
}
