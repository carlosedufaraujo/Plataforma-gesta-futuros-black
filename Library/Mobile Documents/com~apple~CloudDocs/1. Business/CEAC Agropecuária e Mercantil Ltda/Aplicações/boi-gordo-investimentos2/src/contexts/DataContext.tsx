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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider = ({ children }: DataProviderProps) => {
  // Estados para armazenar dados
  const [positions, setPositions] = useState<Position[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Inicializar com dados de exemplo
  useEffect(() => {
    // Posições de exemplo
    const initialPositions: Position[] = [
      {
        id: '1',
        contract: 'BGIK25',
        direction: 'LONG',
        quantity: 10,
        entryPrice: 330.00,
        currentPrice: 335.50,
        status: 'OPEN',
        openDate: '2025-01-15T10:30:00Z',
        fees: 150,
        user_id: 'user1',
        contract_id: 'contract1',
        entry_price: 330.00,
        entry_date: '2025-01-15T10:30:00Z'
      },
      {
        id: '2',
        contract: 'CCMN25',
        direction: 'SHORT',
        quantity: 15,
        entryPrice: 85.00,
        currentPrice: 86.20,
        status: 'OPEN',
        openDate: '2025-01-16T11:45:00Z',
        fees: 120,
        user_id: 'user1',
        contract_id: 'contract2',
        entry_price: 85.00,
        entry_date: '2025-01-16T11:45:00Z'
      }
    ];

    // Opções de exemplo - REMOVIDAS PARA SISTEMA LIMPO
    const initialOptions: Option[] = [];

    // Transações de exemplo
    const initialTransactions: Transaction[] = [
      {
        id: 'TXN001',
        userId: 'user1',
        brokerageId: 'brok001',
        date: '2025-01-17T10:30:00Z',
        contract: 'BGIK25',
        type: 'COMPRA',
        quantity: 5,
        price: 330.50,
        status: 'EXECUTADA',
        fees: 75.00,
        total: 16525.00,
        createdAt: '2025-01-17T10:30:00Z'
      },
      {
        id: 'TXN002',
        userId: 'user1',
        brokerageId: 'brok001',
        date: '2025-01-17T11:15:00Z',
        contract: 'CCMN25',
        type: 'VENDA',
        quantity: 10,
        price: 85.20,
        status: 'EXECUTADA',
        fees: 60.00,
        total: 8520.00,
        createdAt: '2025-01-17T11:15:00Z'
      }
    ];

    setPositions(initialPositions);
    setOptions(initialOptions);
    setTransactions(initialTransactions);
  }, []);

  // Funções para Posições
  const addPosition = (positionData: Omit<Position, 'id'>) => {
    const newPosition: Position = {
      ...positionData,
      id: Date.now().toString(),
      // Garantir que todos os campos obrigatórios estão presentes
      fees: positionData.fees || 0,
      user_id: positionData.user_id || 'user1',
      contract_id: positionData.contract_id || 'auto-' + Date.now(),
      entry_price: positionData.entryPrice,
      entry_date: positionData.openDate,
      current_price: positionData.currentPrice
    };

    setPositions(prev => [...prev, newPosition]);
    
    // Criar transação correspondente
    const transaction: Omit<Transaction, 'id'> = {
      userId: 'user1',
      brokerageId: 'brok001',
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
    
    console.log('✅ Nova posição adicionada:', newPosition);
  };

  const updatePosition = (id: string, updates: Partial<Position>) => {
    setPositions(prev => prev.map(pos => 
      pos.id === id ? { ...pos, ...updates } : pos
    ));
    console.log('✅ Posição atualizada:', id, updates);
  };

  const closePosition = (id: string, closePrice: number) => {
    const position = positions.find(p => p.id === id);
    if (!position) return;

    const updatedPosition: Partial<Position> = {
      status: 'CLOSED',
      exit_price: closePrice,
      exit_date: new Date().toISOString(),
      realized_pnl: (closePrice - position.entryPrice) * position.quantity
    };

    updatePosition(id, updatedPosition);

    // Criar transação de fechamento
    const transaction: Omit<Transaction, 'id'> = {
      userId: 'user1',
      brokerageId: 'brok001',
      date: new Date().toISOString(),
      contract: position.contract,
      type: position.direction === 'LONG' ? 'VENDA' : 'COMPRA',
      quantity: position.quantity,
      price: closePrice,
      total: closePrice * position.quantity,
      fees: 50, // Taxa de fechamento
      status: 'EXECUTADA',
      createdAt: new Date().toISOString()
    };
    
    addTransaction(transaction);
    
    console.log('✅ Posição fechada:', id, 'ao preço', closePrice);
  };

  const deletePosition = (id: string) => {
    setPositions(prev => prev.filter(pos => pos.id !== id));
    console.log('✅ Posição removida:', id);
  };

  // Funções para Opções
  const addOption = (optionData: Omit<Option, 'id'>) => {
    const newOption: Option = {
      ...optionData,
      id: `OPT${Date.now()}`,
      user_id: optionData.user_id || 'user1',
      contract_id: optionData.contract_id || `contract_${Date.now()}`,
      created_at: new Date().toISOString(), // Data de criação automática
      status: 'OPEN' // Sempre abre como OPEN
    };

    // Melhorar nome da opção se não fornecido
    if (!newOption.name || !newOption.symbol) {
      const strikeStr = newOption.strike_price.toFixed(0);
      newOption.symbol = newOption.symbol || `${optionData.option_type}${strikeStr}`;
      newOption.name = newOption.name || 
        `${optionData.option_type} Strike ${strikeStr} - ${optionData.is_purchased ? 'Comprada' : 'Vendida'}`;
    }

    setOptions(prev => [...prev, newOption]);
    
    // Criar transação correspondente
    const transaction: Omit<Transaction, 'id'> = {
      userId: 'user1',
      brokerageId: 'brok001',
      date: new Date().toISOString(),
      contract: newOption.symbol || 'OPTION',
      type: newOption.is_purchased ? 'COMPRA' : 'VENDA',
      quantity: newOption.quantity,
      price: newOption.premium,
      total: newOption.premium * newOption.quantity,
      fees: Math.round(newOption.premium * newOption.quantity * 0.05), // 5% de fees
      status: 'EXECUTADA',
      createdAt: new Date().toISOString()
    };
    
    addTransaction(transaction);
    
    // Feedback visual de sucesso
    const toast = document.createElement('div');
    toast.textContent = `✅ Opção ${newOption.option_type} criada com sucesso!`;
    toast.style.cssText = `
      position: fixed; top: 70px; right: 20px; z-index: 10002;
      background: var(--color-success); color: white; padding: 12px 20px;
      border-radius: 8px; font-weight: 500; animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
    
    console.log('✅ Nova opção adicionada:', newOption);
  };

  // Função para adicionar múltiplas opções (estratégias)
  const addMultipleOptions = (optionsData: Omit<Option, 'id' | 'user_id' | 'contract_id'>[]) => {
    const strategyId = `STRATEGY_${Date.now()}`;
    const timestamp = Date.now();
    
    const newOptions: Option[] = optionsData.map((optionData, index) => ({
      ...optionData,
      id: `OPT${timestamp}_${index}`,
      user_id: 'user1',
      contract_id: `${strategyId}_${index}`,
      created_at: new Date().toISOString(),
      status: 'OPEN'
    }));

    setOptions(prev => [...prev, ...newOptions]);
    
    // Criar transações para cada opção
    newOptions.forEach(option => {
      const transaction: Omit<Transaction, 'id'> = {
        userId: 'user1',
        brokerageId: 'brok001',
        date: new Date().toISOString(),
        contract: option.symbol || 'OPTION',
        type: option.is_purchased ? 'COMPRA' : 'VENDA',
        quantity: option.quantity,
        price: option.premium,
        total: option.premium * option.quantity,
        fees: Math.round(option.premium * option.quantity * 0.05),
        status: 'EXECUTADA',
        createdAt: new Date().toISOString()
      };
      
      addTransaction(transaction);
    });
    
    // Feedback visual para estratégia
    const strategyName = newOptions[0].name?.split('(')[1]?.replace(')', '') || 'Estratégia';
    const toast = document.createElement('div');
    toast.textContent = `🎯 ${strategyName} criada com ${newOptions.length} posições!`;
    toast.style.cssText = `
      position: fixed; top: 70px; right: 20px; z-index: 10002;
      background: var(--color-info); color: white; padding: 12px 20px;
      border-radius: 8px; font-weight: 500; animation: slideIn 0.3s ease-out;
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
    console.log('✅ Opção atualizada:', id, updates);
  };

  const deleteOption = (id: string) => {
    setOptions(prev => prev.filter(opt => opt.id !== id));
    console.log('✅ Opção removida:', id);
  };

  // Funções para Transações
  const addTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString()
    };

    setTransactions(prev => [...prev, newTransaction]);
    console.log('✅ Nova transação adicionada:', newTransaction);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(txn => 
      txn.id === id ? { ...txn, ...updates } : txn
    ));
    console.log('✅ Transação atualizada:', id, updates);
  };

  return (
    <DataContext.Provider value={{
      // Positions
      positions,
      addPosition,
      updatePosition,
      closePosition,
      deletePosition,

      // Options
      options,
      addOption,
      addMultipleOptions,
      updateOption,
      deleteOption,

      // Transactions
      transactions,
      addTransaction,
      updateTransaction
    }}>
      {children}
    </DataContext.Provider>
  );
}; 