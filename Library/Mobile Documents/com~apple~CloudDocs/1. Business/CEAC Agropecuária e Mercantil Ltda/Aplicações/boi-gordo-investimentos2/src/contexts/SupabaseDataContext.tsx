'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Position, Option, Transaction, User, Brokerage } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase'; // Corrigir import

interface SupabaseDataContextType {
  // Posições
  positions: Position[];
  addPosition: (position: Omit<Position, 'id'>) => Promise<void>;
  updatePosition: (id: string, updates: Partial<Position>) => Promise<void>;
  closePosition: (id: string, closePrice: number) => Promise<void>;
  deletePosition: (id: string) => Promise<void>;
  duplicatePosition: (id: string) => Promise<void>;

  // NET Position Functions
  calculateNetPosition: (contract: string, allPositions?: Position[]) => any;
  getAllNetPositions: () => any[];
  isPositionNeutralized: (positionId: string) => boolean;
  cleanNettedPositions: () => void;
  getActivePositions: () => Position[];

  // Opções  
  options: Option[];
  addOption: (option: Omit<Option, 'id'>) => Promise<void>;
  addMultipleOptions: (optionsData: Omit<Option, 'id' | 'user_id' | 'contract_id'>[]) => Promise<void>;
  updateOption: (id: string, updates: Partial<Option>) => Promise<void>;
  deleteOption: (id: string) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;

  // Usuários
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Corretoras
  brokerages: Brokerage[];
  addBrokerage: (brokerage: Omit<Brokerage, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBrokerage: (id: string, updates: Partial<Brokerage>) => Promise<void>;
  deleteBrokerage: (id: string) => Promise<void>;
  selectedBrokerage: Brokerage | null;
  setSelectedBrokerage: (brokerage: Brokerage | null) => void;

  // Loading states
  loading: boolean;
  error: string | null;

  // Data management
  fetchData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  forceCleanOrphanedPositions: () => Promise<void>;
  exportData: () => string;
  importData: (data: string) => boolean;
}

const SupabaseDataContext = createContext<SupabaseDataContextType | undefined>(undefined);

export const useSupabaseData = () => {
  const context = useContext(SupabaseDataContext);
  if (!context) {
    throw new Error('useSupabaseData must be used within a SupabaseDataProvider');
  }
  return context;
};

export const SupabaseDataProvider = ({ children }: { children: ReactNode }) => {
  // Estados principais - carregados do Supabase
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

  // Função para limpar posições órfãs (sem transações correspondentes)
  const cleanOrphanedPositions = async () => {
    try {
      console.log('🔍 Iniciando limpeza de posições órfãs...');
      
      // Buscar dados atualizados
      const [currentPositions, currentTransactions] = await Promise.all([
        supabaseService.getPositions(),
        supabaseService.getTransactions()
      ]);
      
      console.log('📊 Dados atuais:', {
        positions: currentPositions.length,
        transactions: currentTransactions.length
      });
      
      // Encontrar posições órfãs
      const orphanedPositions = currentPositions.filter(position => {
        const hasTransactions = currentTransactions.some(
          transaction => transaction.positionId === position.id
        );
        return !hasTransactions;
      });
      
      console.log('🗑️ Posições órfãs encontradas:', orphanedPositions.length);
      
      // Remover posições órfãs
      if (orphanedPositions.length > 0) {
        for (const orphanedPosition of orphanedPositions) {
          console.log('🧹 Removendo posição órfã:', orphanedPosition.id, orphanedPosition.contract);
          await supabaseService.deletePosition(orphanedPosition.id);
        }
        
        console.log('✅ Limpeza concluída -', orphanedPositions.length, 'posições órfãs removidas');
        
        // Atualizar estado local após limpeza automática
        await fetchDataAfterCleanup();
      } else {
        console.log('✅ Nenhuma posição órfã encontrada');
      }
      
    } catch (err) {
      console.error('❌ Erro na limpeza de posições órfãs:', err);
    }
  };

  // Função auxiliar para recarregar dados após limpeza
  const fetchDataAfterCleanup = async () => {
    const [loadedPositions, loadedTransactions] = await Promise.all([
      supabaseService.getPositions(),
      supabaseService.getTransactions()
    ]);
    
    setPositions(loadedPositions);
    setTransactions(loadedTransactions);
  };

  // Função para carregar dados do Supabase
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Carregando dados do Supabase...');
      
      // Carregar todos os dados em paralelo
      const [
        loadedPositions,
        loadedOptions,
        loadedTransactions,
        loadedUsers,
        loadedBrokerages
      ] = await Promise.all([
        supabaseService.getPositions(),
        supabaseService.getOptions(),
        supabaseService.getTransactions(),
        supabaseService.getUsers(),
        supabaseService.getBrokerages()
      ]);

      setPositions(loadedPositions);
      setOptions(loadedOptions);
      setTransactions(loadedTransactions);
      setUsers(loadedUsers);
      setBrokerages(loadedBrokerages);

      // Sincronizar contadores de ID com os dados existentes
      await supabaseService.syncTransactionIdCounter();

      // Definir usuário e corretora padrão se disponível
      if (loadedUsers.length > 0 && !currentUser) {
        setCurrentUser(loadedUsers[0]);
      }
      
      if (loadedBrokerages.length > 0 && !selectedBrokerage) {
        setSelectedBrokerage(loadedBrokerages[0]);
      }

      console.log('✅ Dados carregados do Supabase:', {
        positions: loadedPositions.length,
        options: loadedOptions.length,
        transactions: loadedTransactions.length,
        users: loadedUsers.length,
        brokerages: loadedBrokerages.length
      });
      
      console.log('📊 ATENÇÃO: Todas as páginas (Performance, Rentabilidade, etc.) devem atualizar AUTOMATICAMENTE agora!');
      
      // Executar limpeza leve de posições órfãs na inicialização
      console.log('🧹 Verificando consistência dos dados...');
      setTimeout(() => {
        cleanOrphanedPositions().catch(err => 
          console.warn('⚠️ Limpeza automática falhou:', err)
        );
      }, 2000); // Executar após 2 segundos
      
    } catch (err) {
      console.error('❌ Erro ao carregar dados do Supabase:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    fetchData();
  }, []);

  // ================================
  // FUNÇÕES PARA POSIÇÕES
  // ================================
  
  const addPosition = async (positionData: Omit<Position, 'id'>) => {
    try {
      // Buscar contract_id baseado no símbolo
      const { data: contracts, error: contractError } = await supabase
        .from('contracts')
        .select('id')
        .eq('symbol', positionData.contract)
        .single();
      
      if (contractError) {
        console.error('❌ Erro ao buscar contrato:', contractError);
        throw new Error(`Contrato ${positionData.contract} não encontrado`);
      }

      // Verificar se há usuário e corretora selecionados
      if (!currentUser) {
        throw new Error('Nenhum usuário selecionado');
      }
      
      if (!selectedBrokerage) {
        throw new Error('Nenhuma corretora selecionada');
      }

      const newPosition = await supabaseService.createPosition({
        ...positionData,
        user_id: currentUser.id,
        brokerage_id: selectedBrokerage.id,
        contract_id: contracts.id
      });

      setPositions(prev => [newPosition, ...prev]);

      // Criar transação correspondente
      const transaction: Omit<Transaction, 'id'> = {
        userId: currentUser.id,
        brokerageId: selectedBrokerage.id,
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
      
      console.log('🔥 POSIÇÃO CRIADA: Criando transação correspondente:', transaction);
      await addTransaction(transaction);
      
      console.log('✅ Nova posição adicionada:', newPosition);
    } catch (err) {
      console.error('❌ Erro ao adicionar posição:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar posição');
      throw err; // Re-throw para que o modal possa mostrar o erro
    }
  };

  const updatePosition = async (id: string, updates: Partial<Position>) => {
    try {
      const updatedPosition = await supabaseService.updatePosition(id, updates);
      
      setPositions(prev => prev.map(pos => 
        pos.id === id ? updatedPosition : pos
      ));
      
      console.log('✅ Posição atualizada:', updatedPosition);
    } catch (err) {
      console.error('❌ Erro ao atualizar posição:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar posição');
    }
  };

  const closePosition = async (id: string, closePrice: number) => {
    const position = positions.find(p => p.id === id);
    if (!position) return;

    try {
      const contractSize = position.contract.startsWith('BGI') ? 330 : 450;
      const pnl = (position.direction === 'LONG' ? 1 : -1) * 
        (closePrice - position.entry_price) * position.quantity * contractSize;

      const updates: Partial<Position> = {
        status: 'FECHADA',
        exit_price: closePrice,
        exit_date: new Date().toISOString(),
        realized_pnl: pnl
      };

      await updatePosition(id, updates);

      // Criar transação de fechamento
      const closeTransaction: Omit<Transaction, 'id'> = {
        userId: currentUser?.id || 'default-user',
        brokerageId: selectedBrokerage?.id || 'default-brokerage',
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

      await addTransaction(closeTransaction);
      
      console.log('✅ Posição fechada:', id, `P&L: R$ ${pnl.toFixed(2)}`);
    } catch (err) {
      console.error('❌ Erro ao fechar posição:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fechar posição');
    }
  };

  const deletePosition = async (id: string) => {
    try {
      await supabaseService.deletePosition(id);
      setPositions(prev => prev.filter(pos => pos.id !== id));
      console.log('✅ Posição removida:', id);
    } catch (err) {
      console.error('❌ Erro ao remover posição:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover posição');
    }
  };

  const duplicatePosition = async (id: string) => {
    const position = positions.find(p => p.id === id);
    if (!position) {
      console.error('❌ Posição não encontrada para duplicar:', id);
      return;
    }

    try {
      // Criar nova posição baseada na existente, mas com novos dados
      const duplicatedPosition: Omit<Position, 'id'> = {
        ...position,
        entry_date: new Date().toISOString(),
        created_at: undefined as any, // Será criado automaticamente
        updated_at: undefined as any  // Será criado automaticamente
      };

      await addPosition(duplicatedPosition);
      console.log('✅ Posição duplicada:', position.contract);
    } catch (err) {
      console.error('❌ Erro ao duplicar posição:', err);
      setError(err instanceof Error ? err.message : 'Erro ao duplicar posição');
    }
  };

  // ================================
  // FUNÇÕES PARA OPÇÕES
  // ================================
  
  const addOption = async (optionData: Omit<Option, 'id'>) => {
    try {
      const newOption = await supabaseService.createOption({
        ...optionData,
        user_id: currentUser?.id || 'default-user',
        brokerage_id: selectedBrokerage?.id || 'default-brokerage'
      });

      setOptions(prev => [newOption, ...prev]);
      console.log('✅ Nova opção adicionada:', newOption);
    } catch (err) {
      console.error('❌ Erro ao adicionar opção:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar opção');
    }
  };

  const addMultipleOptions = async (optionsData: Omit<Option, 'id' | 'user_id' | 'contract_id'>[]) => {
    try {
      const promises = optionsData.map(optionData => 
        supabaseService.createOption({
          ...optionData,
          user_id: currentUser?.id || 'default-user',
          brokerage_id: selectedBrokerage?.id || 'default-brokerage',
          contract_id: `contract_${Date.now()}`
        })
      );

      const newOptions = await Promise.all(promises);
      setOptions(prev => [...newOptions, ...prev]);
      console.log('🎯 Estratégia criada:', newOptions);
    } catch (err) {
      console.error('❌ Erro ao criar estratégia:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar estratégia');
    }
  };

  const updateOption = async (id: string, updates: Partial<Option>) => {
    try {
      // Implementar quando necessário
      setOptions(prev => prev.map(opt => 
        opt.id === id ? { ...opt, ...updates } : opt
      ));
      console.log('✅ Opção atualizada:', id, updates);
    } catch (err) {
      console.error('❌ Erro ao atualizar opção:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar opção');
    }
  };

  const deleteOption = async (id: string) => {
    try {
      // Implementar quando necessário
      setOptions(prev => prev.filter(opt => opt.id !== id));
      console.log('✅ Opção removida:', id);
    } catch (err) {
      console.error('❌ Erro ao remover opção:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover opção');
    }
  };

  // ================================
  // FUNÇÕES PARA TRANSAÇÕES
  // ================================
  
  const addTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    try {
      console.log('🔥 CONTEXTO SUPABASE: addTransaction chamada com dados:', transactionData);
      const newTransaction = await supabaseService.createTransaction(transactionData);
      setTransactions(prev => [newTransaction, ...prev]);
      console.log('✅ Nova transação adicionada no contexto Supabase:', newTransaction);
    } catch (err) {
      console.error('❌ Erro ao adicionar transação no contexto Supabase:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar transação');
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      setLoading(true);
      console.log('📝 Atualizando transação:', id, updates);
      
      const updatedTransaction = await supabaseService.updateTransaction(id, updates);
      console.log('✅ Transação atualizada no banco:', updatedTransaction);
      
      // Recarregar todos os dados para sincronizar posições e transações
      console.log('🔄 Sincronizando dados após atualização...');
      await fetchData();
      
      console.log('✅ Sincronização concluída com sucesso');
    } catch (err) {
      console.error('❌ Erro ao atualizar transação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar transação');
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      setLoading(true);
      console.log('🗑️ Iniciando exclusão de transação:', id);
      
      // 1. Excluir a transação
      await supabaseService.deleteTransaction(id);
      console.log('✅ Transação removida do banco:', id);
      
      // 2. Recarregar todos os dados ANTES da limpeza
      console.log('🔄 Recarregando dados do Supabase...');
      const [
        loadedPositions,
        loadedTransactions
      ] = await Promise.all([
        supabaseService.getPositions(),
        supabaseService.getTransactions()
      ]);
      
      console.log('📊 Dados recarregados:', {
        positions: loadedPositions.length,
        transactions: loadedTransactions.length
      });
      
      // 3. Executar limpeza de posições órfãs
      console.log('🧹 Executando limpeza de posições órfãs...');
      const orphanedPositions = loadedPositions.filter(position => {
        const hasTransactions = loadedTransactions.some(
          transaction => transaction.positionId === position.id
        );
        return !hasTransactions;
      });
      
      console.log('🗑️ Posições órfãs encontradas:', orphanedPositions.length);
      
      // 4. Remover posições órfãs se existirem
      if (orphanedPositions.length > 0) {
        for (const orphanedPosition of orphanedPositions) {
          console.log('🧹 Removendo posição órfã:', orphanedPosition.id, orphanedPosition.contract);
          await supabaseService.deletePosition(orphanedPosition.id);
        }
        console.log('✅ Limpeza concluída -', orphanedPositions.length, 'posições órfãs removidas');
      }
      
      // 5. Recarregar dados finais
      console.log('🔄 Recarga final dos dados...');
      await fetchData();
      
      console.log('✅ Exclusão e sincronização concluídas com sucesso');
    } catch (err) {
      console.error('❌ Erro ao remover transação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover transação');
      setLoading(false);
    }
  };

  // ================================
  // FUNÇÕES PARA USUÁRIOS
  // ================================
  
  const addUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newUser = await supabaseService.createUser(userData);
      setUsers(prev => [...prev, newUser]);
      console.log('✅ Novo usuário adicionado:', newUser);
    } catch (err) {
      console.error('❌ Erro ao adicionar usuário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar usuário');
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const updatedUser = await supabaseService.updateUser(id, updates);
      setUsers(prev => prev.map(user => 
        user.id === id ? updatedUser : user
      ));
      console.log('✅ Usuário atualizado:', updatedUser);
    } catch (err) {
      console.error('❌ Erro ao atualizar usuário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await supabaseService.deleteUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
      console.log('✅ Usuário removido:', id);
    } catch (err) {
      console.error('❌ Erro ao remover usuário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover usuário');
    }
  };

  // ================================
  // FUNÇÕES PARA CORRETORAS
  // ================================
  
  const addBrokerage = async (brokerageData: Omit<Brokerage, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newBrokerage = await supabaseService.createBrokerage(brokerageData);
      setBrokerages(prev => [...prev, newBrokerage]);
      console.log('✅ Nova corretora adicionada:', newBrokerage);
    } catch (err) {
      console.error('❌ Erro ao adicionar corretora:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar corretora');
    }
  };

  const updateBrokerage = async (id: string, updates: Partial<Brokerage>) => {
    try {
      // Implementar quando necessário
      setBrokerages(prev => prev.map(brokerage => 
        brokerage.id === id ? { ...brokerage, ...updates } : brokerage
      ));
      console.log('✅ Corretora atualizada:', id, updates);
    } catch (err) {
      console.error('❌ Erro ao atualizar corretora:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar corretora');
    }
  };

  const deleteBrokerage = async (id: string) => {
    try {
      // Implementar quando necessário
      setBrokerages(prev => prev.filter(brokerage => brokerage.id !== id));
      console.log('✅ Corretora removida:', id);
    } catch (err) {
      console.error('❌ Erro ao remover corretora:', err);
      setError(err instanceof Error ? err.message : 'Erro ao remover corretora');
    }
  };

  // ================================
  // FUNÇÕES DE POSIÇÕES LÍQUIDAS (mantidas para compatibilidade)
  // ================================
  
  const calculateNetPosition = (contract: string, allPositions: Position[] = positions) => {
    const contractPositions = allPositions.filter(p => p.contract === contract && (p.status === 'EXECUTADA' || p.status === 'EM_ABERTO'));
    
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
      netQuantity,
      netDirection,
      positions: contractPositions
    };
  };

  const getAllNetPositions = () => {
    const contracts = [...new Set(positions.map(p => p.contract))];
    return contracts.map(contract => calculateNetPosition(contract, positions));
  };

  const isPositionNeutralized = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return false;
    
    const netPos = calculateNetPosition(position.contract, positions);
    
    if (netPos.netQuantity === 0) return true;
    
    if (position.direction !== netPos.netDirection && netPos.netDirection !== 'NEUTRO') {
      return true;
    }
    
    return false;
  };

  const cleanNettedPositions = () => {
    // Implementar se necessário
    console.log('🧹 Limpeza de posições netadas');
  };

  const getActivePositions = () => {
    return positions.filter(p => p.status === 'EXECUTADA' || p.status === 'EM_ABERTO');
  };

  // ================================
  // FUNÇÕES DE GERENCIAMENTO DE DADOS
  // ================================
  
  const clearAllData = async () => {
    try {
      setPositions([]);
      setOptions([]);
      setTransactions([]);
      console.log('🧹 Dados limpos localmente');
    } catch (err) {
      console.error('❌ Erro ao limpar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao limpar dados');
    }
  };

  // Função para limpeza manual em caso de emergência
  const forceCleanOrphanedPositions = async () => {
    console.log('🚨 LIMPEZA MANUAL FORÇADA DE POSIÇÕES ÓRFÃS');
    await cleanOrphanedPositions();
    await fetchData();
  };

  const exportData = (): string => {
    const data = {
      positions,
      options,
      transactions,
      users,
      brokerages,
      currentUser,
      selectedBrokerage,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (data: string): boolean => {
    try {
      const parsedData = JSON.parse(data);
      // Implementar importação se necessário
      console.log('📥 Dados importados:', parsedData);
      return true;
    } catch (err) {
      console.error('❌ Erro ao importar dados:', err);
      return false;
    }
  };

  const contextValue: SupabaseDataContextType = {
    // Posições
    positions,
    addPosition,
    updatePosition,
    closePosition,
    deletePosition,
    duplicatePosition,
    
    // NET Position Functions
    calculateNetPosition,
    getAllNetPositions,
    isPositionNeutralized,
    cleanNettedPositions,
    getActivePositions,
    
    // Opções
    options,
    addOption,
    addMultipleOptions,
    updateOption,
    deleteOption,
    
    // Transações
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Usuários
    users,
    addUser,
    updateUser,
    deleteUser,
    currentUser,
    setCurrentUser,
    
    // Corretoras
    brokerages,
    addBrokerage,
    updateBrokerage,
    deleteBrokerage,
    selectedBrokerage,
    setSelectedBrokerage,
    
    // Estados de controle
    loading,
    error,
    
    // Gerenciamento de dados
    fetchData,
    clearAllData,
    forceCleanOrphanedPositions,
    exportData,
    importData
  };

  return (
    <SupabaseDataContext.Provider value={contextValue}>
      {children}
    </SupabaseDataContext.Provider>
  );
}; 