'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Brokerage } from '@/types';

interface CurrentUserSession {
  user: User | null;
  selectedBrokerage: Brokerage | null;
  availableBrokerages: Brokerage[];
  lastTransaction: any | null;
}

interface UserContextType {
  currentSession: CurrentUserSession;
  setCurrentUser: (user: User) => void;
  setSelectedBrokerage: (brokerage: Brokerage | null) => void;
  addBrokerage: (brokerage: Omit<Brokerage, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBrokerage: (id: string, updates: Partial<Brokerage>) => void;
  removeBrokerage: (id: string) => void;
  updateSelectedBrokerage: (brokerage: Brokerage) => void;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Data fetching
  fetchUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  // Estado inicial vazio - dados virão do localStorage ou backend
  const [currentSession, setCurrentSession] = useState<CurrentUserSession>({
    user: null,
    selectedBrokerage: null,
    availableBrokerages: [],
    lastTransaction: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar dados do usuário do backend
  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Implementar chamadas reais para API
      // const userRes = await fetch('/api/auth/me');
      // const brokeragesRes = await fetch('/api/brokerages');
      
      console.log('📡 Buscando dados do usuário...');
      console.log('⚠️  Sistema limpo - aguardando dados reais');
      
      // Por enquanto, aguardar implementação do backend
      // setCurrentSession({
      //   user: await userRes.json(),
      //   selectedBrokerage: null,
      //   availableBrokerages: await brokeragesRes.json(),
      //   lastTransaction: null
      // });
      
    } catch (err) {
      setError('Erro ao carregar dados do usuário');
      console.error('❌ Erro ao buscar dados do usuário:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    fetchUserData();
  }, []);

  const setCurrentUser = (user: User) => {
    setCurrentSession(prev => ({
      ...prev,
      user
    }));
    console.log('✅ Usuário definido:', user);
  };

  const setSelectedBrokerage = (brokerage: Brokerage | null) => {
    setCurrentSession(prev => ({
      ...prev,
      selectedBrokerage: brokerage
    }));
    console.log('✅ Corretora selecionada:', brokerage?.nome || 'Nenhuma');
  };

  const addBrokerage = (brokerageData: Omit<Brokerage, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBrokerage: Brokerage = {
      ...brokerageData,
      id: `brok_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorizedUserIds: currentSession.user ? [currentSession.user.id] : []
    };

    setCurrentSession(prev => ({
      ...prev,
      availableBrokerages: [...prev.availableBrokerages, newBrokerage]
    }));

    // TODO: Salvar no backend
    // await fetch('/api/brokerages', { method: 'POST', body: JSON.stringify(newBrokerage) });

    console.log('✅ Nova corretora adicionada:', newBrokerage);
  };

  const updateBrokerage = (id: string, updates: Partial<Brokerage>) => {
    setCurrentSession(prev => ({
      ...prev,
      availableBrokerages: prev.availableBrokerages.map(brok =>
        brok.id === id ? { ...brok, ...updates, updatedAt: new Date().toISOString() } : brok
      )
    }));

    // TODO: Atualizar no backend
    // await fetch(`/api/brokerages/${id}`, { method: 'PUT', body: JSON.stringify(updates) });

    console.log('✅ Corretora atualizada:', id, updates);
  };

  const removeBrokerage = (id: string) => {
    setCurrentSession(prev => ({
      ...prev,
      availableBrokerages: prev.availableBrokerages.filter(brok => brok.id !== id),
      selectedBrokerage: prev.selectedBrokerage?.id === id ? null : prev.selectedBrokerage
    }));

    // TODO: Remover do backend
    // await fetch(`/api/brokerages/${id}`, { method: 'DELETE' });

    console.log('✅ Corretora removida:', id);
  };

  const updateSelectedBrokerage = async (brokerage: Brokerage) => {
    try {
      // Aqui faria a chamada para o backend para salvar a seleção
      // await api.post('/api/users/select-brokerage', { brokerageId: brokerage.id });
      
      setCurrentSession(prev => ({
        ...prev,
        selectedBrokerage: brokerage
      }));

      console.log(`✅ Corretora ${brokerage.nome} selecionada!`);
    } catch (error) {
      console.error('Erro ao selecionar corretora:', error);
    }
  };

  return (
    <UserContext.Provider value={{
      currentSession,
      setCurrentUser,
      setSelectedBrokerage,
      addBrokerage,
      updateBrokerage,
      removeBrokerage,
      loading,
      error,
      fetchUserData,
      updateSelectedBrokerage
    }}>
      {children}
    </UserContext.Provider>
  );
}; 