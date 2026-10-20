import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setActiveUserHeader, getSavedActiveUserId } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  personas: User[];
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  switchPersona: (user: User) => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [personas, setPersonas] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const personaList = await api.getPersonas();
      setPersonas(personaList);

      const savedId = getSavedActiveUserId();
      if (savedId) {
        const matchedUser = personaList.find((p) => p.id === savedId);
        if (matchedUser) {
          setActiveUserHeader(matchedUser.id);
          setCurrentUser(matchedUser);
        } else {
          setActiveUserHeader(null);
          setCurrentUser(null);
        }
      } else {
        // No saved user -> stay unauthenticated so user sees the Login page
        setActiveUserHeader(null);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Failed to load personas/user:', err);
      setActiveUserHeader(null);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const login = async (username: string, password: string) => {
    const user = await api.login(username, password);
    setActiveUserHeader(user.id);
    setCurrentUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      setActiveUserHeader(null);
      setCurrentUser(null);
    }
  };

  const switchPersona = (user: User) => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      console.warn('Persona switching is restricted strictly to SUPER_ADMIN.');
      return;
    }
    setActiveUserHeader(user.id);
    setCurrentUser(user);
  };

  const refreshUser = async () => {
    try {
      const me = await api.getCurrentUser();
      setCurrentUser(me);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        personas,
        login,
        logout,
        switchPersona,
        refreshUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
