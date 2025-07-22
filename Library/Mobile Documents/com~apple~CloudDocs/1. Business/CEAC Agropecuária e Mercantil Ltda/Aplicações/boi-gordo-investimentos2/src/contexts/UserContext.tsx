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
  // Dados temporários para desenvolvimento - REMOVER quando backend estiver pronto
  const tempUser: User = {
    id: '00000000-1111-2222-3333-444444444444',
    nome: 'Carlos Eduardo Almeida',
    cpf: '123.456.789-00',
    endereco: 'Rua das Palmeiras, 123 - São Paulo, SP',
    telefone: '(11) 99999-9999',
    email: 'carlos.eduardo@ceacagro.com.br',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    brokerageIds: ['brok001', 'brok002', 'brok003']
  };

  const tempBrokerages: Brokerage[] = [
    {
      id: 'brok001',
      nome: 'XP Investimentos',
      cnpj: '02.332.886/0001-04',
      endereco: 'Av. Brigadeiro Faria Lima, 3300 - São Paulo, SP',
      assessor: 'Roberto Silva',
      telefone: '(11) 3003-3000',
      email: 'assessoria@xpi.com.br',
      corretagemMilho: 2.50,
      corretagemBoi: 3.20,
      taxas: 0.35,
      impostos: 15.80,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-10T14:20:00Z',
      authorizedUserIds: ['00000000-1111-2222-3333-444444444444']
    },
    {
      id: 'brok002',  
      nome: 'Rico Investimentos',
      cnpj: '03.814.055/0001-74',
      endereco: 'Av. Paulista, 1450 - São Paulo, SP',
      assessor: 'Ana Paula Costa',
      telefone: '(11) 2050-5000',
      email: 'suporte@rico.com.vc',
      corretagemMilho: 2.80,
      corretagemBoi: 3.50,
      taxas: 0.28,
      impostos: 16.20,
      isActive: true,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-12T09:15:00Z',
      authorizedUserIds: ['00000000-1111-2222-3333-444444444444']
    },
    {
      id: 'brok003',
      nome: 'Clear Corretora',
      cnpj: '02.332.886/0011-11',
      endereco: 'Av. Paulista, 1000 - São Paulo, SP',
      assessor: 'João Santos',
      telefone: '(11) 4000-4000',
      email: 'contato@clear.com.br',
      corretagemMilho: 2.20,
      corretagemBoi: 2.90,
      taxas: 0.25,
      impostos: 15.00,
      isActive: true,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-13T16:45:00Z',
      authorizedUserIds: ['00000000-1111-2222-3333-444444444444']
    }
  ];

  // Estado inicial com dados temporários
  const [currentSession, setCurrentSession] = useState<CurrentUserSession>({
    user: tempUser, // Usuário temporário para desenvolvimento
    selectedBrokerage: null,
    availableBrokerages: tempBrokerages, // Corretoras temporárias
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
      console.log('⚠️  Usando dados temporários para desenvolvimento');
      
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