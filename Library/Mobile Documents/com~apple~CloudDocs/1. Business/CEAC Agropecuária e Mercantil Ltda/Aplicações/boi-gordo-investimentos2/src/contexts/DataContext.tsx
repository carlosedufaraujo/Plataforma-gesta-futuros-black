'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Position, Option, Transaction, User, Brokerage } from '@/types';
import { generatePositionId, generateOptionId, generateTransactionId } from '@/services/idGenerator';
import { localStorageService } from '@/services/localStorage';
import { useAutoClean } from '@/hooks/useAutoClean';

interface DataContextType {
  // Posições
  positions: Position[];
  addPosition: (position: Omit<Position, 'id'>) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  closePosition: (id: string, closePrice: number) => void;
  deletePosition: (id: string) => void;

  // NET Position Functions
  calculateNetPosition: (contract: string, allPositions?: Position[]) => any;
  getAllNetPositions: () => any[];
  isPositionNeutralized: (positionId: string) => boolean;
  cleanNettedPositions: () => void;
  getActivePositions: () => Position[];

  // Opções  
  options: Option[];
  addOption: (option: Omit<Option, 'id'>) => void;
  addMultipleOptions: (optionsData: Omit<Option, 'id' | 'user_id' | 'contract_id'>[]) => void;
  updateOption: (id: string, updates: Partial<Option>) => void;
  deleteOption: (id: string) => void;

  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;

  // Usuários
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Corretoras
  brokerages: Brokerage[];
  addBrokerage: (brokerage: Omit<Brokerage, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBrokerage: (id: string, updates: Partial<Brokerage>) => void;
  deleteBrokerage: (id: string) => void;
  selectedBrokerage: Brokerage | null;
  setSelectedBrokerage: (brokerage: Brokerage | null) => void;

  // Loading states
  loading: boolean;
  error: string | null;

  // Data management
  fetchData: () => Promise<void>;
  clearAllData: () => void;
  exportData: () => string;
  importData: (data: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  // Auto-limpeza de dados mock
  const { cleanupResult } = useAutoClean();
  
  // Estados principais - carregados do localStorage
  const [positions, setPositions] = useState<Position[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [brokerages, setBrokerages] = useState<Brokerage[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedBrokerage, setSelectedBrokerage] = useState<Brokerage | null>(null);
  
  // Estados de controle
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar dados (localStorage ou backend)
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Carregando dados do localStorage...');
      
      // Carregar todos os dados do localStorage
      const loadedPositions = localStorageService.loadPositions();
      const loadedOptions = localStorageService.loadOptions();
      const loadedTransactions = localStorageService.loadTransactions();
      const loadedUsers = localStorageService.loadUsers();
      const loadedBrokerages = localStorageService.loadBrokerages();
      const loadedCurrentUser = localStorageService.loadCurrentUser();
      const loadedSelectedBrokerage = localStorageService.loadSelectedBrokerage();
      
      // Atualizar estados
      setPositions(loadedPositions);
      setOptions(loadedOptions);
      setTransactions(loadedTransactions);
      setUsers(loadedUsers);
      setBrokerages(loadedBrokerages);
      setCurrentUser(loadedCurrentUser);
      setSelectedBrokerage(loadedSelectedBrokerage);
      
      console.log('✅ Dados carregados com sucesso:', {
        positions: loadedPositions.length,
        options: loadedOptions.length,
        transactions: loadedTransactions.length,
        users: loadedUsers.length,
        brokerages: loadedBrokerages.length,
        currentUser: loadedCurrentUser?.nome || 'Nenhum',
        selectedBrokerage: loadedSelectedBrokerage?.nome || 'Nenhuma'
      });
      
    } catch (err) {
      setError('Erro ao carregar dados do localStorage');
      console.error('❌ Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    fetchData();
  }, []);

  // Função para determinar status baseado em critérios de negócio
  const determinePositionStatus = (position: Position, allPositions: Position[]): PositionStatus => {
    // Se a posição foi explicitamente fechada
    if (position.status === 'CLOSED') return 'CLOSED';
    
    // Verificar se existe posição oposta do mesmo contrato que neutraliza
    const oppositePositions = allPositions.filter(p => 
      p.contract === position.contract && 
      p.direction !== position.direction && 
      p.status === 'OPEN' &&
      p.id !== position.id
    );
    
    const totalOpposite = oppositePositions.reduce((sum, p) => sum + p.quantity, 0);
    const currentQuantity = position.quantity;
    
    // Se há posições opostas que neutralizam completamente
    if (totalOpposite >= currentQuantity) {
      return 'NETTED'; // Posição netada/neutralizada
    }
    
    // Se há posições opostas parciais
    if (totalOpposite > 0) {
      return 'PARTIAL'; // Posição parcialmente neutralizada
    }
    
    return 'OPEN'; // Posição totalmente aberta
  };

  // Funções para Posições
  const addPosition = (positionData: Omit<Position, 'id'>) => {
    const newPosition: Position = {
      ...positionData,
      id: generatePositionId()
    };

    setPositions(prev => {
      const updatedPositions = [...prev, newPosition];
      
      // Recalcular status de todas as posições do mesmo contrato
      const recalculatedPositions = updatedPositions.map(pos => ({
        ...pos,
        status: pos.contract === newPosition.contract ? 
          determinePositionStatus(pos, updatedPositions) : pos.status
      }));
      
      // Limpar posições completamente netadas
      const activePositions = recalculatedPositions.filter(p => p.status === 'OPEN');
      const contracts = [...new Set(activePositions.map(p => p.contract))];
      
      // Identificar contratos com posição líquida zero
      const nettedContracts = contracts.filter(contract => {
        const contractPositions = activePositions.filter(p => p.contract === contract);
        const longQty = contractPositions.filter(p => p.direction === 'LONG').reduce((sum, p) => sum + p.quantity, 0);
        const shortQty = contractPositions.filter(p => p.direction === 'SHORT').reduce((sum, p) => sum + p.quantity, 0);
        return longQty === shortQty; // Posição líquida zero
      });
      
      // Marcar posições de contratos netados como NETTED (efetivamente removendo da carteira)
      const finalPositions = recalculatedPositions.map(pos => {
        if (nettedContracts.includes(pos.contract) && pos.status === 'OPEN') {
          return { ...pos, status: 'NETTED' as PositionStatus };
        }
        return pos;
      });
      
      // Salvar no localStorage
      localStorageService.savePositions(finalPositions);
      
      return finalPositions;
    });
    
    // Criar transação correspondente
    const transaction: Omit<Transaction, 'id'> = {
      userId: 'current_user',
      brokerageId: 'selected_brokerage',
      date: new Date().toISOString(),
      contract: positionData.contract,
      type: positionData.direction === 'LONG' ? 'COMPRA' : 'VENDA',
      quantity: positionData.quantity,
      price: positionData.entry_price,
      total: positionData.entry_price * positionData.quantity,
      fees: positionData.fees || 0,
      status: 'EXECUTADA',
      createdAt: new Date().toISOString()
    };
    
    addTransaction(transaction);
    
    console.log('✅ Nova posição adicionada e salva:', newPosition);
  };

  const updatePosition = (id: string, updates: Partial<Position>) => {
    setPositions(prev => prev.map(pos => 
      pos.id === id ? { ...pos, ...updates } : pos
    ));
    
    // TODO: Atualizar no backend
    // await fetch(`/api/positions/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    
    console.log('✅ Posição atualizada:', id, updates);
  };

  const closePosition = (id: string, closePrice: number) => {
    const position = positions.find(p => p.id === id);
    if (!position) return;

    const contractSize = position.contract.startsWith('BGI') ? 330 : 450;
    const pnl = (position.direction === 'LONG' ? 1 : -1) * 
      (closePrice - position.entry_price) * position.quantity * contractSize;

    const updates: Partial<Position> = {
      status: 'CLOSED',
      exit_price: closePrice,
      exit_date: new Date().toISOString(),
      realized_pnl: pnl
    };

    updatePosition(id, updates);

    // Criar transação de fechamento
    const closeTransaction: Omit<Transaction, 'id'> = {
      userId: 'current_user',
      brokerageId: 'selected_brokerage',
      date: new Date().toISOString(),
      contract: position.contract,
      type: position.direction === 'LONG' ? 'VENDA' : 'COMPRA',
      quantity: position.quantity,
      price: closePrice,
      total: closePrice * position.quantity,
      fees: closePrice * position.quantity * 0.001, // 0.1% taxa
      status: 'EXECUTADA',
      createdAt: new Date().toISOString()
    };

    addTransaction(closeTransaction);
    
    console.log('✅ Posição fechada:', id, `P&L: R$ ${pnl.toFixed(2)}`);
  };

  const deletePosition = (id: string) => {
    setPositions(prev => prev.filter(pos => pos.id !== id));
    
    // TODO: Deletar no backend
    // await fetch(`/api/positions/${id}`, { method: 'DELETE' });
    
    console.log('✅ Posição removida:', id);
  };

  // Funções para Opções
  const addOption = (optionData: Omit<Option, 'id'>) => {
    const newOption: Option = {
      ...optionData,
      id: generateOptionId(),
      user_id: optionData.user_id || 'current_user',
      contract_id: optionData.contract_id || `contract_${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'OPEN',
      // Auto-generate symbol and name if not provided
      symbol: optionData.symbol || `${optionData.type}${optionData.strike}`,
      name: optionData.name || `${optionData.type} ${optionData.strike} ${optionData.isPurchased ? 'COMPRADA' : 'VENDIDA'}`,
      // Calculate automatic fees (5% of total premium)
      fees: Math.round(optionData.premium * optionData.quantity * 0.05)
    };

    setOptions(prev => [...prev, newOption]);

    // Criar transação para a opção
    const transaction: Omit<Transaction, 'id'> = {
      userId: 'current_user',
      brokerageId: 'selected_brokerage',
      date: new Date().toISOString(),
      contract: `${optionData.type} ${optionData.strike}`,
      type: optionData.isPurchased ? 'COMPRA' : 'VENDA',
      quantity: optionData.quantity,
      price: optionData.premium,
      total: optionData.premium * optionData.quantity,
      fees: newOption.fees,
      status: 'EXECUTADA',
      createdAt: new Date().toISOString()
    };

    addTransaction(transaction);

    // Toast notification
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `
      <div class="toast-content">
        <strong>✅ Opção Cadastrada!</strong>
        <p>${newOption.name} - Quantidade: ${optionData.quantity}</p>
      </div>
    `;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: var(--success-color); color: white; padding: 15px;
      border-radius: 8px; animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 4000);

    console.log('✅ Nova opção adicionada:', newOption);
  };

  const addMultipleOptions = (optionsData: Omit<Option, 'id' | 'user_id' | 'contract_id'>[]) => {
    const timestamp = Date.now();
    const strategyId = `strategy_${timestamp}`;
    
    const newOptions = optionsData.map((optionData, index) => ({
      ...optionData,
      id: generateOptionId(),
      user_id: 'current_user',
      contract_id: `contract_${timestamp}`,
      created_at: new Date().toISOString(),
      status: 'OPEN' as const,
      symbol: optionData.symbol || `${optionData.type}${optionData.strike}`,
      name: optionData.name || `${optionData.type} ${optionData.strike} ${optionData.isPurchased ? 'COMPRADA' : 'VENDIDA'}`,
      fees: Math.round(optionData.premium * optionData.quantity * 0.05)
    }));

    setOptions(prev => [...prev, ...newOptions]);

    // Criar transações para cada opção da estratégia
    newOptions.forEach(option => {
      const transaction: Omit<Transaction, 'id'> = {
        userId: 'current_user',
        brokerageId: 'selected_brokerage',
        date: new Date().toISOString(),
        contract: `${option.type} ${option.strike}`,
        type: option.isPurchased ? 'COMPRA' : 'VENDA',
        quantity: option.quantity,
        price: option.premium,
        total: option.premium * option.quantity,
        fees: option.fees,
        status: 'EXECUTADA',
        createdAt: new Date().toISOString()
      };
      
      addTransaction(transaction);
    });

    // Toast notification para estratégia
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `
      <div class="toast-content">
        <strong>🎯 Estratégia Criada!</strong>
        <p>${newOptions.length} opções adicionadas com sucesso</p>
      </div>
    `;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: var(--success-color); color: white; padding: 15px;
      border-radius: 8px; animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 4000);
    
    console.log('🎯 Estratégia criada:', { strategyId, options: newOptions });
  };

  const updateOption = (id: string, updates: Partial<Option>) => {
    setOptions(prev => prev.map(opt => 
      opt.id === id ? { ...opt, ...updates } : opt
    ));
    
    // TODO: Atualizar no backend
    // await fetch(`/api/options/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    
    console.log('✅ Opção atualizada:', id, updates);
  };

  const deleteOption = (id: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== id));
    
    // TODO: Deletar no backend
    // await fetch(`/api/options/${id}`, { method: 'DELETE' });
    
    console.log('✅ Opção removida:', id);
  };

  // Funções para Transações
  const addTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: generateTransactionId()
    };

    setTransactions(prev => [...prev, newTransaction]);
    
    // TODO: Salvar no backend
    // await fetch('/api/transactions', { method: 'POST', body: JSON.stringify(newTransaction) });
    
    console.log('✅ Nova transação adicionada:', newTransaction);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(txn => 
      txn.id === id ? { ...txn, ...updates } : txn
    ));
    
    // TODO: Atualizar no backend
    // await fetch(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    
    console.log('✅ Transação atualizada:', id, updates);
  };

  // Função para calcular posição líquida (NET) por contrato
  const calculateNetPosition = (contract: string, allPositions: Position[]) => {
    const contractPositions = allPositions.filter(p => p.contract === contract && p.status === 'OPEN');
    
    const longQuantity = contractPositions
      .filter(p => p.direction === 'LONG')
      .reduce((sum, p) => sum + p.quantity, 0);
    
    const shortQuantity = contractPositions
      .filter(p => p.direction === 'SHORT')
      .reduce((sum, p) => sum + p.quantity, 0);
    
    const netQuantity = longQuantity - shortQuantity;
    const netDirection = netQuantity > 0 ? 'LONG' : netQuantity < 0 ? 'SHORT' : 'NEUTRO';
    
    return {
      contract,
      longQuantity,
      shortQuantity,
      netQuantity, // Mantém o sinal (negativo para SHORT)
      netDirection,
      positions: contractPositions
    };
  };

  // Função para obter todas as posições líquidas
  const getAllNetPositions = () => {
    const contracts = [...new Set(positions.map(p => p.contract))];
    return contracts.map(contract => calculateNetPosition(contract, positions));
  };

  // Função para verificar se uma posição está neutralizada
  const isPositionNeutralized = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return false;
    
    const netPos = calculateNetPosition(position.contract, positions);
    
    // Se a posição líquida é zero, todas as posições estão neutralizadas
    if (netPos.netQuantity === 0) return true;
    
    // Se a direção da posição é oposta à direção líquida, pode estar neutralizada
    if (position.direction !== netPos.netDirection && netPos.netDirection !== 'NEUTRO') {
      return true;
    }
    
    return false;
  };

  // Função para limpar posições completamente netadas
  const cleanNettedPositions = () => {
    setPositions(prev => {
      const activePositions = prev.filter(p => p.status === 'OPEN');
      const contracts = [...new Set(activePositions.map(p => p.contract))];
      
      // Identificar contratos com posição líquida zero
      const nettedContracts = contracts.filter(contract => {
        const contractPositions = activePositions.filter(p => p.contract === contract);
        const longQty = contractPositions.filter(p => p.direction === 'LONG').reduce((sum, p) => sum + p.quantity, 0);
        const shortQty = contractPositions.filter(p => p.direction === 'SHORT').reduce((sum, p) => sum + p.quantity, 0);
        return longQty === shortQty; // Posição líquida zero
      });
      
      // Marcar posições de contratos netados como NETTED
      return prev.map(pos => {
        if (nettedContracts.includes(pos.contract) && pos.status === 'OPEN') {
          return { ...pos, status: 'NETTED' as PositionStatus };
        }
        return pos;
      });
    });
  };

  // Função para obter posições realmente ativas (excluindo NETTED)
  const getActivePositions = () => {
    return positions.filter(p => p.status === 'OPEN');
  };

  // ================================
  // FUNÇÕES PARA USUÁRIOS
  // ================================
  
  const addUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newUser: User = {
      ...userData,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setUsers(prev => {
      const updatedUsers = [...prev, newUser];
      localStorageService.saveUsers(updatedUsers);
      return updatedUsers;
    });
    
    console.log('✅ Novo usuário adicionado:', newUser);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => {
      const updatedUsers = prev.map(user => 
        user.id === id ? { ...user, ...updates, updatedAt: new Date().toISOString() } : user
      );
      localStorageService.saveUsers(updatedUsers);
      return updatedUsers;
    });
    
    // Atualizar usuário atual se for o mesmo
    if (currentUser?.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
    }
    
    console.log('✅ Usuário atualizado:', id, updates);
  };

  const deleteUser = (id: string) => {
    setUsers(prev => {
      const updatedUsers = prev.filter(user => user.id !== id);
      localStorageService.saveUsers(updatedUsers);
      return updatedUsers;
    });
    
    // Limpar usuário atual se for o mesmo
    if (currentUser?.id === id) {
      setCurrentUser(null);
      localStorageService.saveCurrentUser(null);
    }
    
    console.log('✅ Usuário removido:', id);
  };

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    localStorageService.saveCurrentUser(user);
    console.log('✅ Usuário atual definido:', user?.nome || 'Nenhum');
  };

  // ================================
  // FUNÇÕES PARA CORRETORAS
  // ================================
  
  const addBrokerage = (brokerageData: Omit<Brokerage, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBrokerage: Brokerage = {
      ...brokerageData,
      id: `brokerage_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setBrokerages(prev => {
      const updatedBrokerages = [...prev, newBrokerage];
      localStorageService.saveBrokerages(updatedBrokerages);
      return updatedBrokerages;
    });
    
    console.log('✅ Nova corretora adicionada:', newBrokerage);
  };

  const updateBrokerage = (id: string, updates: Partial<Brokerage>) => {
    setBrokerages(prev => {
      const updatedBrokerages = prev.map(brokerage => 
        brokerage.id === id ? { ...brokerage, ...updates, updatedAt: new Date().toISOString() } : brokerage
      );
      localStorageService.saveBrokerages(updatedBrokerages);
      return updatedBrokerages;
    });
    
    // Atualizar corretora selecionada se for a mesma
    if (selectedBrokerage?.id === id) {
      setSelectedBrokerage(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
    }
    
    console.log('✅ Corretora atualizada:', id, updates);
  };

  const deleteBrokerage = (id: string) => {
    setBrokerages(prev => {
      const updatedBrokerages = prev.filter(brokerage => brokerage.id !== id);
      localStorageService.saveBrokerages(updatedBrokerages);
      return updatedBrokerages;
    });
    
    // Limpar corretora selecionada se for a mesma
    if (selectedBrokerage?.id === id) {
      setSelectedBrokerage(null);
      localStorageService.saveSelectedBrokerage(null);
    }
    
    console.log('✅ Corretora removida:', id);
  };

  const handleSetSelectedBrokerage = (brokerage: Brokerage | null) => {
    setSelectedBrokerage(brokerage);
    localStorageService.saveSelectedBrokerage(brokerage);
    console.log('✅ Corretora selecionada:', brokerage?.nome || 'Nenhuma');
  };

  // ================================
  // FUNÇÕES UTILITÁRIAS
  // ================================
  
  const clearAllData = () => {
    // Limpar estados
    setPositions([]);
    setOptions([]);
    setTransactions([]);
    setUsers([]);
    setBrokerages([]);
    setCurrentUser(null);
    setSelectedBrokerage(null);
    
    // Limpar localStorage
    localStorageService.clearAllData();
    
    console.log('🗑️ Todos os dados foram limpos');
  };

  const exportData = (): string => {
    return localStorageService.exportAllData();
  };

  const importData = (data: string): boolean => {
    const success = localStorageService.importAllData(data);
    if (success) {
      // Recarregar dados após importação
      fetchData();
    }
    return success;
  };

  return (
    <DataContext.Provider value={{
      // Data
      positions,
      options,
      transactions,
      users,
      brokerages,
      currentUser,
      selectedBrokerage,

      // States
      loading,
      error,

      // Functions
      fetchData,
      clearAllData,
      exportData,
      importData,

      // Positions
      addPosition,
      updatePosition,
      closePosition,
      deletePosition,

      // NET Position Functions
      calculateNetPosition,
      getAllNetPositions,
      isPositionNeutralized,
      cleanNettedPositions,
      getActivePositions,

      // Options
      addOption,
      addMultipleOptions,
      updateOption,
      deleteOption,

      // Transactions
      addTransaction,
      updateTransaction,

      // Users
      addUser,
      updateUser,
      deleteUser,
      setCurrentUser: handleSetCurrentUser,

      // Brokerages
      addBrokerage,
      updateBrokerage,
      deleteBrokerage,
      setSelectedBrokerage: handleSetSelectedBrokerage
    }}>
      {children}
    </DataContext.Provider>
  );
}; 