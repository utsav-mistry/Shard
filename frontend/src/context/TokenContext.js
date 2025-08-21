import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from './AuthContext';

const TokenContext = createContext();

export const useTokens = () => useContext(TokenContext);

export const TokenProvider = ({ children }) => {
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchTokenBalance = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await api.get('/api/billing/tokens');
      if (response.data.success) {
        setTokens(response.data.data.tokens);
      }
    } catch (error) {
      console.error('Failed to fetch token balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenBalance();
  }, [currentUser]);

  const value = {
    tokens,
    setTokens,
    loading,
    fetchTokenBalance,
  };

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
};
