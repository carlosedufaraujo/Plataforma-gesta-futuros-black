'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Brokerage, CurrentUserSession, Transaction } from '@/types';

interface UserContextType {
  currentSession: CurrentUserSession;
  setSelectedBrokerage: (brokerage: Brokerage) => void;
  updateLastTransaction: (transaction: Transaction) => void;
  refreshUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [currentSession, setCurrentSession] = useState<CurrentUserSession>({
    user: {
      id: 'user001',
      nome: 'Carlos Eduardo',
      cpf: '123.456.789-00',
      endereco: 'Rua das Palmeiras, 123 - São Paulo, SP',
      telefone: '(11) 99999-9999',
      email: 'carlos.eduardo@email.com',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      brokerageIds: ['brok001', 'brok002', 'brok003']
    },
    selectedBrokerage: null,
    availableBrokerages: [],
    lastTransaction: null
  });

  // Dados simulados de corretoras
  const mockBrokerages: Brokerage[] = [
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
      authorizedUserIds: ['user001', 'user002']
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
      authorizedUserIds: ['user001', 'user003']
    },
    {
      id: 'brok003',
      nome: 'Clear Corretora',
      cnpj: '09.274.232/0001-73',
      endereco: 'Rua Olimpíadas, 205 - São Paulo, SP',
      assessor: 'João Henrique',
      telefone: '(11) 4040-2020',
      email: 'atendimento@clear.com.br',
      corretagemMilho: 1.95,
      corretagemBoi: 2.75,
      taxas: 0.25,
      impostos: 14.90,
      isActive: true,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-14T16:45:00Z',
      authorizedUserIds: ['user001']
    }
  ];

  // Dados simulados da última transação
  const mockLastTransaction = {
    date: '2025-01-20T14:35:00Z',
    type: 'COMPRA',
    contract: 'BGIM25'
  };

  // Dados simulados de transações por corretora para o usuário atual
  const mockTransactionsByBrokerage = {
    'brok001': { // XP Investimentos
      lastTransaction: {
        date: '2025-01-20T16:42:15Z', // 3h atrás
        type: 'VENDA',
        contract: 'CCMJ25',
        quantity: 200,
        price: 1845.50,
        userId: 'user001',
        brokerageId: 'brok001'
      },
      totalTransactions: 45,
      thisMonthCount: 12
    },
    'brok002': { // Rico Investimentos  
      lastTransaction: {
        date: '2025-01-20T11:28:30Z', // 8h atrás
        type: 'COMPRA', 
        contract: 'BGIK25',
        quantity: 150,
        price: 2125.80,
        userId: 'user001',
        brokerageId: 'brok002'
      },
      totalTransactions: 38,
      thisMonthCount: 8
    },
    'brok003': { // Clear Corretora
      lastTransaction: {
        date: '2025-01-19T15:35:45Z', // 1 dia atrás
        type: 'EXERCICIO',
        contract: 'OPT BGI M400',
        quantity: 100, 
        price: 2400.00,
        userId: 'user001',
        brokerageId: 'brok003'
      },
      totalTransactions: 22,
      thisMonthCount: 5
    }
  };

  // Função para obter última transação específica da corretora selecionada
  const getLastTransactionForBrokerage = (brokerageId: string) => {
    return mockTransactionsByBrokerage[brokerageId] || null;
  };

  // Filtrar corretoras disponíveis para o usuário atual
  const getAvailableBrokerages = () => {
    return mockBrokerages.filter(brokerage => 
      currentSession.user.brokerageIds.includes(brokerage.id) && 
      brokerage.authorizedUserIds.includes(currentSession.user.id)
    );
  };

  // Inicializar dados na montagem do componente
  useEffect(() => {
    const availableBrokerages = getAvailableBrokerages();
    const selectedBrokerage = availableBrokerages[0] || null;
    
    // Obter última transação da corretora selecionada
    const lastTransactionData = selectedBrokerage 
      ? getLastTransactionForBrokerage(selectedBrokerage.id)
      : null;
    
    setCurrentSession(prev => ({
      ...prev,
      availableBrokerages,
      selectedBrokerage,
      lastTransaction: lastTransactionData ? {
        date: lastTransactionData.lastTransaction.date,
        type: lastTransactionData.lastTransaction.type,
        contract: lastTransactionData.lastTransaction.contract
      } : null
    }));
  }, []);

  const setSelectedBrokerage = (brokerage: Brokerage) => {
    // Atualizar última transação baseada na corretora selecionada
    const lastTransactionData = getLastTransactionForBrokerage(brokerage.id);
    
    setCurrentSession(prev => ({
      ...prev,
      selectedBrokerage: brokerage,
      lastTransaction: lastTransactionData ? {
        date: lastTransactionData.lastTransaction.date,
        type: lastTransactionData.lastTransaction.type,
        contract: lastTransactionData.lastTransaction.contract
      } : null
    }));
  };

  const updateLastTransaction = (transaction: Transaction) => {
    // Atualizar dados simulados da corretora
    if (mockTransactionsByBrokerage[transaction.brokerageId]) {
      mockTransactionsByBrokerage[transaction.brokerageId].lastTransaction = {
        date: transaction.createdAt,
        type: transaction.type,
        contract: transaction.contract,
        quantity: transaction.quantity,
        price: transaction.price,
        userId: transaction.userId,
        brokerageId: transaction.brokerageId
      };
    }
    
    // Atualizar estado se for da corretora atualmente selecionada
    if (currentSession.selectedBrokerage?.id === transaction.brokerageId) {
      setCurrentSession(prev => ({
        ...prev,
        lastTransaction: {
          date: transaction.createdAt,
          type: transaction.type,
          contract: transaction.contract
        }
      }));
    }
  };

  const refreshUserData = () => {
    const availableBrokerages = getAvailableBrokerages();
    const selectedBrokerage = availableBrokerages.find(b => b.id === currentSession.selectedBrokerage?.id) || availableBrokerages[0] || null;
    
    // Atualizar última transação
    const lastTransactionData = selectedBrokerage 
      ? getLastTransactionForBrokerage(selectedBrokerage.id)
      : null;

    setCurrentSession(prev => ({
      ...prev,
      availableBrokerages,
      selectedBrokerage,
      lastTransaction: lastTransactionData ? {
        date: lastTransactionData.lastTransaction.date,
        type: lastTransactionData.lastTransaction.type,
        contract: lastTransactionData.lastTransaction.contract
      } : null
    }));
  };

  return (
    <UserContext.Provider value={{
      currentSession,
      setSelectedBrokerage,
      updateLastTransaction,
      refreshUserData
    }}>
      {children}
    </UserContext.Provider>
  );
}; 