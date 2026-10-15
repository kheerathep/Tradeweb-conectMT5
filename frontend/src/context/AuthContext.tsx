import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, TradingAccount } from '../types';
import { authApi, LoginPayload, RegisterPayload } from '../api/auth';
import { accountsApi } from '../api/accounts';

interface AuthContextType {
  user: User | null;
  accounts: TradingAccount[];
  activeAccount: TradingAccount | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setActiveAccount: (account: TradingAccount) => void;
  refreshAccounts: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<TradingAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccounts = async () => {
    try {
      const data = await accountsApi.getAccounts();
      setAccounts(data);
      if (data.length > 0 && !activeAccount) {
        setActiveAccount(data[0]);
      }
    } catch {
      setAccounts([]);
    }
  };

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
      await fetchAccounts();
    } catch {
      setUser(null);
      setAccounts([]);
      setActiveAccount(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    const res = await authApi.login(payload);
    setUser(res.user);
    await fetchAccounts();
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await authApi.loginWithGoogle(credential);
    setUser(res.user);
    await fetchAccounts();
  };

  const register = async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    setUser(res.user);
    await fetchAccounts();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setAccounts([]);
      setActiveAccount(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accounts,
        activeAccount,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        setActiveAccount,
        refreshAccounts: fetchAccounts,
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
