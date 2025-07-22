'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Position, Option, Transaction } from '@/types';

interface DataContextType {
  // Posições
  positions: Position[];
  addPosition: (position: Omit<Position, 'id'>) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  closePosition: (id: string, closePrice: number) => void;
  deletePosition: (id: string) => void;

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

  // Loading states
  loading: boolean;
  error: string | null;

  // Data fetching
  fetchData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider = ({ children }: DataProviderProps) => {
  // Estados para armazenar dados - LIMPOS, SEM DADOS DE TESTE
  const [positions, setPositions] = useState<Position[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar dados do backend
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Implementar chamadas reais para API
      // const [positionsRes, optionsRes, transactionsRes] = await Promise.all([
      //   fetch('/api/positions'),
      //   fetch('/api/options'),
      //   fetch('/api/transactions')
      // ]);
      
      console.log('📡 Buscando dados do backend...');
      
      // Por enquanto, inicializar vazio até backend estar configurado
      setPositions([]);
      setOptions([]);
      setTransactions([]);
      
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error('❌ Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    fetchData();
  }, []);

  // Funções para Posições
  const addPosition = (positionData: Omit<Position, 'id'>) => {
    const newPosition: Position = {
      ...positionData,
      id: `pos_${Date.now()}`,
      fees: positionData.fees || 0,
      user_id: positionData.user_id || 'current_user',
      contract_id: positionData.contract_id || `contract_${Date.now()}`,
      entry_price: positionData.entryPrice,
      entry_date: positionData.openDate,
      current_price: positionData.currentPrice
    };

    setPositions(prev => [...prev, newPosition]);
    
    // Criar transação correspondente
    const transaction: Omit<Transaction, 'id'> = {
      userId: 'current_user',
      brokerageId: 'selected_brokerage',
      date: new Date().toISOString(),
      contract: positionData.contract,
      type: positionData.direction === 'LONG' ? 'COMPRA' : 'VENDA',
      quantity: positionData.quantity,
      price: positionData.entryPrice,
      total: positionData.entryPrice * positionData.quantity,
      fees: positionData.fees || 0,
      status: 'EXECUTADA',
      createdAt: new Date().toISOString()
    };
    
    addTransaction(transaction);
    
    // TODO: Enviar para backend
    // await fetch('/api/positions', { method: 'POST', body: JSON.stringify(newPosition) });
    
    console.log('✅ Nova posição adicionada:', newPosition);
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
      (closePrice - position.entryPrice) * position.quantity * contractSize;

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
      id: `opt_${Date.now()}`,
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
      id: `opt_${timestamp}_${index}`,
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
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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

  return (
    <DataContext.Provider value={{
      // Data
      positions,
      options,
      transactions,

      // States
      loading,
      error,

      // Functions
      fetchData,

      // Positions
      addPosition,
      updatePosition,
      closePosition,
      deletePosition,

      // Options
      addOption,
      addMultipleOptions,
      updateOption,
      deleteOption,

      // Transactions
      addTransaction,
      updateTransaction
    }}>
      {children}
    </DataContext.Provider>
  );
}; 