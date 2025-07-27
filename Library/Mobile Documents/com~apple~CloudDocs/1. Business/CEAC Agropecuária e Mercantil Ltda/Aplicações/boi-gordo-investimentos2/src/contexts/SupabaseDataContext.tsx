'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Position, Option, Transaction, User, Brokerage } from '@/types';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase'; // Corrigir import
import { createLocalDate, correctDateIfNeeded } from '@/utils/dateUtils';

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
      
      // Encontrar posições órfãs (mais inteligente)
      const orphanedPositions = currentPositions.filter(position => {
        // Verificar se há transação vinculada diretamente
        const hasDirectTransaction = currentTransactions.some(
          transaction => transaction.positionId === position.id
        );
        
        // Se não há transação direta, verificar se há transação compatível
        const hasCompatibleTransaction = currentTransactions.some(transaction => 
          transaction.contract === position.contract &&
          transaction.quantity === position.quantity &&
          transaction.price === position.entry_price &&
                ((transaction.type === 'COMPRA' && position.direction === 'COMPRA') ||
       (transaction.type === 'VENDA' && position.direction === 'VENDA'))
        );
        
        // Só considera órfã se não tem transação direta NEM compatível
        const isOrphaned = !hasDirectTransaction && !hasCompatibleTransaction;
        
        if (isOrphaned) {
          console.log(`🔍 Posição órfã detectada: ${position.contract} ${position.direction} ${position.quantity} @ ${position.entry_price}`);
        }
        
        return isOrphaned;
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

  // ✅ MODELO CORRETO: Controle Gerencial de Posições em Contratos Futuros
  const recalculatePosition = (positionTransactions: Transaction[], previousPosition?: any) => {
    console.log('🎯 MODELO CORRETO: Calculando posição conforme especificações de commodities...');
    
    if (positionTransactions.length === 0) {
      return {
        quantity: 0,
        direction: 'NEUTRO',
        entry_price: 0,
        current_price: 0,
        status: 'FECHADA',
        realized_pnl: 0,
        unrealized_pnl: 0
      };
    }
    
    // Ordenar transações por data para processar cronologicamente
    const sortedTransactions = [...positionTransactions].sort((a, b) => 
      new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime()
    );
    
    console.log('📊 Transações ordenadas cronologicamente:', sortedTransactions.map(t => ({
      id: t.custom_id || t.id.substring(0,8),
      data: new Date(t.createdAt || t.date).toLocaleDateString(),
      tipo: t.type,
      quantidade: t.quantity,
      preço: `R$ ${t.price.toFixed(2)}/${t.contract.startsWith('BGI') ? '@' : 'sc'}`,
      valorContrato: `R$ ${(t.price * (t.contract.startsWith('BGI') ? 330 : 450)).toFixed(2)}`,
      total: `R$ ${t.total.toFixed(2)}`
    })));
    
    // Estado inicial da posição
    let posicaoAtual = 0;        // Quantidade líquida de contratos
    let precoMedioAtual = 0;     // Preço médio por unidade física (arroba/saco)
    let pnlAcumulado = 0;        // P&L realizado acumulado
    let exposicaoFinanceira = 0; // Valor total da posição
    
    // Processar cada transação seguindo o modelo
    sortedTransactions.forEach((transacao, index) => {
      const isBoiGordo = transacao.contract.startsWith('BGI');
      const especificacao = isBoiGordo ? 330 : 450; // arrobas ou sacos por contrato
      const unidade = isBoiGordo ? '@' : 'sc';
      
      const qtdOperacao = transacao.type === 'COMPRA' ? transacao.quantity : -transacao.quantity;
      const precoOperacao = transacao.price; // por arroba ou saco
      
      console.log(`\n🔄 PROCESSANDO OPERAÇÃO ${index + 1}:`);
      console.log(`   ${transacao.type} ${Math.abs(qtdOperacao)} contratos @ R$ ${precoOperacao.toFixed(2)}/${unidade}`);
      console.log(`   Posição antes: ${posicaoAtual} contratos @ R$ ${precoMedioAtual.toFixed(2)}/${unidade}`);
      
      // Determinar tipo de operação
      let tipoOperacao = '';
      
      if (posicaoAtual === 0) {
        // ABERTURA DE POSIÇÃO
        tipoOperacao = 'ABERTURA';
        posicaoAtual = qtdOperacao;
        precoMedioAtual = precoOperacao;
        
      } else if ((posicaoAtual > 0 && qtdOperacao > 0) || (posicaoAtual < 0 && qtdOperacao < 0)) {
        // REFORÇO DE POSIÇÃO (mesma direção)
        tipoOperacao = 'REFORÇO';
        
        // Fórmula do modelo: PM_novo = ((Pos_atual×PM_atual) + (Qtd_nova×Preço_novo)) / Pos_nova
        const valorAtual = Math.abs(posicaoAtual) * precoMedioAtual;
        const valorNovo = Math.abs(qtdOperacao) * precoOperacao;
        const novaQuantidade = Math.abs(posicaoAtual + qtdOperacao);
        
        precoMedioAtual = novaQuantidade > 0 ? (valorAtual + valorNovo) / novaQuantidade : 0;
        posicaoAtual += qtdOperacao;
        
      } else if (Math.abs(qtdOperacao) <= Math.abs(posicaoAtual)) {
        // REDUÇÃO DE POSIÇÃO (direção oposta, não ultrapassa)
        tipoOperacao = 'REDUÇÃO';
        
        // PM permanece o mesmo (regra do modelo)
        // Calcular P&L da parte reduzida
        const qtdReduzida = Math.abs(qtdOperacao);
                    const pnlParcial = qtdReduzida * especificacao * (
              posicaoAtual > 0 ? 
                (precoOperacao - precoMedioAtual) :  // Posição COMPRA vendendo
                (precoMedioAtual - precoOperacao)    // Posição VENDA comprando
            );
        
        pnlAcumulado += pnlParcial;
        posicaoAtual += qtdOperacao;
        
        console.log(`   💰 P&L PARCIAL: R$ ${pnlParcial.toFixed(2)} (${qtdReduzida} contratos @ diferença de R$ ${Math.abs(precoOperacao - precoMedioAtual).toFixed(2)}/${unidade})`);
        
      } else {
        // INVERSÃO DE POSIÇÃO (ultrapassa e muda direção)
        tipoOperacao = 'INVERSÃO';
        
        // Parte 1: Fechar posição atual
        const qtdFechamento = Math.abs(posicaoAtual);
                  const pnlFechamento = qtdFechamento * especificacao * (
            posicaoAtual > 0 ? 
              (precoOperacao - precoMedioAtual) :  // Posição COMPRA vendendo
              (precoMedioAtual - precoOperacao)    // Posição VENDA comprando
          );
        
        pnlAcumulado += pnlFechamento;
        
        // Parte 2: Nova posição na direção oposta
        const qtdNovaPosition = qtdOperacao + posicaoAtual; // Quantidade restante
        posicaoAtual = qtdNovaPosition;
        precoMedioAtual = precoOperacao; // Nova posição com novo PM
        
        console.log(`   🔄 INVERSÃO DETECTADA:`);
        console.log(`      Fechamento: ${qtdFechamento} contratos - P&L: R$ ${pnlFechamento.toFixed(2)}`);
        console.log(`      Nova posição: ${posicaoAtual} contratos @ R$ ${precoMedioAtual.toFixed(2)}/${unidade}`);
      }
      
      // Calcular exposição financeira
      exposicaoFinanceira = Math.abs(posicaoAtual) * precoMedioAtual * especificacao;
      
      console.log(`   📊 RESULTADO da ${tipoOperacao}:`);
      console.log(`      Posição atual: ${posicaoAtual} contratos`);
      console.log(`      Preço médio: R$ ${precoMedioAtual.toFixed(2)}/${unidade}`);
      console.log(`      P&L acumulado: R$ ${pnlAcumulado.toFixed(2)}`);
      console.log(`      Exposição: R$ ${exposicaoFinanceira.toFixed(2)}`);
    });
    
    // Determinar direção e status finais
            const direcaoFinal = posicaoAtual > 0 ? 'COMPRA' : posicaoAtual < 0 ? 'VENDA' : 'NEUTRO';
    const statusFinal = posicaoAtual === 0 ? 'FECHADA' : 'EXECUTADA';
    
    // Se posição foi neutralizada, todo P&L é realizado
    const pnlRealizado = posicaoAtual === 0 ? pnlAcumulado : null;
    const pnlNaoRealizado = posicaoAtual !== 0 ? 0 : null; // Para posições ativas, seria calculado com preço atual
    
    console.log(`\n🎯 RESULTADO FINAL (MODELO CORRETO):`);
    console.log(`   Posição: ${Math.abs(posicaoAtual)} contratos ${direcaoFinal}`);
    console.log(`   Preço médio: R$ ${precoMedioAtual.toFixed(2)}/${sortedTransactions[0]?.contract.startsWith('BGI') ? '@' : 'sc'}`);
    console.log(`   Status: ${statusFinal}`);
    console.log(`   P&L realizado: ${pnlRealizado ? `R$ ${pnlRealizado.toFixed(2)}` : 'N/A'}`);
    console.log(`   Exposição: R$ ${exposicaoFinanceira.toFixed(2)}`);
    
    if (posicaoAtual === 0) {
      console.log('   ✅ POSIÇÃO NEUTRALIZADA - Deve aparecer na aba Performance!');
    }
    
    return {
      quantity: Math.abs(posicaoAtual),
      direction: direcaoFinal,
      entry_price: precoMedioAtual,
      current_price: precoMedioAtual || 0,
      status: statusFinal,
      realized_pnl: pnlRealizado,
      unrealized_pnl: pnlNaoRealizado,
      exposure: exposicaoFinanceira,
      accumulated_pnl: pnlAcumulado,
      calculatedValues: {
        quantidade: Math.abs(posicaoAtual),
        direção: direcaoFinal,
        preçoMédio: precoMedioAtual.toFixed(2),
        quantidadeLiquida: posicaoAtual,
        status: statusFinal,
        pnlRealizado: pnlRealizado ? pnlRealizado.toFixed(2) : 'null',
        pnlAcumulado: pnlAcumulado.toFixed(2),
        exposição: exposicaoFinanceira.toFixed(2),
        modelo: 'CORRETO'
      }
    };
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
      
      // Executar limpeza conservadora de posições órfãs na inicialização
      console.log('🧹 Agendando verificação conservadora de consistência...');
      setTimeout(() => {
        cleanOrphanedPositions().catch(err => 
          console.warn('⚠️ Limpeza automática falhou:', err)
        );
      }, 5000); // Executar após 5 segundos para dar tempo da aplicação carregar completamente
      
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
      // Verificar se há usuário e corretora selecionados
      if (!currentUser) {
        throw new Error('Nenhum usuário selecionado');
      }
      
      if (!selectedBrokerage) {
        throw new Error('Nenhuma corretora selecionada');
      }

      // Tentar buscar contract_id baseado no símbolo (opcional)
      let contractId = null;
      try {
        const { data: contracts, error: contractError } = await supabase
          .from('contracts')
          .select('id')
          .eq('symbol', positionData.contract)
          .single();
        
        if (!contractError && contracts) {
          contractId = contracts.id;
        }
      } catch (err) {
        console.warn('⚠️ Contrato não encontrado na tabela contracts, continuando sem contract_id:', positionData.contract);
      }

      const newPosition = await supabaseService.createPosition({
        ...positionData,
        user_id: currentUser.id,
        brokerage_id: selectedBrokerage.id,
        contract_id: contractId
      });

      setPositions(prev => [newPosition, ...prev]);

      // Criar transação correspondente
      const transaction: Omit<Transaction, 'id'> = {
        userId: currentUser.id,
        brokerageId: selectedBrokerage.id,
        date: createLocalDate(),
        contract: positionData.contract,
                  type: positionData.direction === 'COMPRA' ? 'COMPRA' : 'VENDA',
        quantity: positionData.quantity,
        price: positionData.entry_price,
        total: positionData.entry_price * positionData.quantity,
        fees: positionData.fees || 0,
        status: 'EXECUTADA',
        createdAt: createLocalDate()
      };
      
      console.log('🔥 POSIÇÃO CRIADA: Criando transação vinculada diretamente (sem duplicação):', transaction);
      
      // CORREÇÃO: Criar transação vinculada diretamente à posição criada
      const transactionWithPosition = {
        ...transaction,
        positionId: newPosition.id // Vincular diretamente à posição criada
      };
      
      const newTransaction = await supabaseService.createTransaction(transactionWithPosition);
      setTransactions(prev => [newTransaction, ...prev]);
      console.log('✅ Transação vinculada criada:', newTransaction);
      
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
      const pnl = (position.direction === 'COMPRA' ? 1 : -1) * 
        (closePrice - position.entry_price) * position.quantity * contractSize;

      const updates: Partial<Position> = {
        status: 'FECHADA',
        exit_price: closePrice,
        exit_date: createLocalDate(),
        realized_pnl: pnl
      };

      await updatePosition(id, updates);

      // Criar transação de fechamento
      const closeTransaction: Omit<Transaction, 'id'> = {
        userId: currentUser?.id || 'default-user',
        brokerageId: selectedBrokerage?.id || 'default-brokerage',
        date: createLocalDate(),
        contract: position.contract,
                    type: position.direction === 'COMPRA' ? 'VENDA' : 'COMPRA',
        quantity: position.quantity,
        price: closePrice,
        total: closePrice * position.quantity,
        fees: closePrice * position.quantity * 0.001, // 0.1% taxa
        status: 'EXECUTADA',
        createdAt: createLocalDate()
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
      
      // CORREÇÃO DE DATAS: Verificar e corrigir apenas datas muito no futuro
      const correctedTransactionData = {
        ...transactionData,
        date: correctDateIfNeeded(transactionData.date),
        createdAt: correctDateIfNeeded(transactionData.createdAt)
      };
      
      console.log('📅 Datas processadas:', {
        original: { date: transactionData.date, createdAt: transactionData.createdAt },
        corrected: { date: correctedTransactionData.date, createdAt: correctedTransactionData.createdAt }
      });
      
      // CORREÇÃO: Se transação já tem positionId, é vinculada - não criar nova posição
      const isLinkedTransaction = !!(correctedTransactionData as any).positionId;
      console.log('🔍 Transação vinculada?', isLinkedTransaction ? 'SIM' : 'NÃO');
      
      // VALIDAÇÃO DOS DADOS DE ENTRADA
      if (!correctedTransactionData.contract) {
        throw new Error('Contrato é obrigatório');
      }
      if (!correctedTransactionData.type || !['COMPRA', 'VENDA'].includes(correctedTransactionData.type)) {
        throw new Error('Tipo deve ser COMPRA ou VENDA');
      }
      if (!correctedTransactionData.quantity || correctedTransactionData.quantity <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }
      if (!correctedTransactionData.price || correctedTransactionData.price <= 0) {
        throw new Error('Preço deve ser maior que zero');
      }
      
      // 1. Criar a transação
      console.log('📝 Criando transação no banco...');
      const newTransaction = await supabaseService.createTransaction(correctedTransactionData);
      setTransactions(prev => [newTransaction, ...prev]);
      console.log('✅ Nova transação adicionada no contexto Supabase:', newTransaction);
      
      // CORREÇÃO: Se é transação vinculada, pular lógica de posição
      if (isLinkedTransaction) {
        console.log('✅ Transação vinculada criada com sucesso - não criando posição');
        return;
      }
      
      // 2. Verificar se já existe uma posição ATIVA para este contrato (apenas para transações avulsas)
      console.log('🧮 TRANSAÇÃO AVULSA: Buscando posição existente para vincular...');
      
      // Prioridade: 1) Mesma direção, 2) Status EXECUTADA, 3) Qualquer ativa
      let existingPosition = positions.find(p => 
        p.contract === correctedTransactionData.contract && 
        p.direction === (correctedTransactionData.type === 'COMPRA' ? 'COMPRA' : 'VENDA') &&
        ['EXECUTADA', 'EM_ABERTO'].includes(p.status)
      );
      
      // Se não encontrou com mesma direção, busca a mais recente
      if (!existingPosition) {
        existingPosition = positions
          .filter(p => p.contract === correctedTransactionData.contract && ['EXECUTADA', 'EM_ABERTO'].includes(p.status))
          .sort((a, b) => new Date(b.entry_date || '').getTime() - new Date(a.entry_date || '').getTime())[0];
      }
      
      console.log('🔍 Busca por posição existente:', {
        contrato: correctedTransactionData.contract,
        tipo: correctedTransactionData.type,
                  direcao: correctedTransactionData.type === 'COMPRA' ? 'COMPRA' : 'VENDA',
        posicaoEncontrada: existingPosition ? `${existingPosition.direction} ${existingPosition.contract}` : 'NENHUMA'
      });
      
      let targetPosition;
      
      if (existingPosition) {
        // 2a. Posição existe - vincular à posição existente e recalcular
        console.log('🔗 Posição existente encontrada para', transactionData.contract, '- vinculando e recalculando...');
        
        try {
          // Vincular transação à posição existente
          await supabaseService.updateTransaction(newTransaction.id, { positionId: existingPosition.id });
          console.log('✅ Transação vinculada à posição existente');
          
          // Buscar todas as transações para esta posição (incluindo a nova)
          const allTransactions = await supabaseService.getTransactions();
          const positionTransactions = allTransactions.filter(
            t => t.positionId === existingPosition.id
          );
          
          console.log('📊 Transações encontradas para recálculo:', positionTransactions.length);
          
          // Recalcular posição usando função helper
          const calculationResult = recalculatePosition(positionTransactions);
          
          // Atualizar posição existente
          await supabaseService.updatePosition(existingPosition.id, calculationResult);
          setPositions(prev => prev.map(p => 
            p.id === existingPosition.id ? { ...p, ...calculationResult } : p
          ));
          
          console.log('✅ Posição recalculada:', calculationResult.calculatedValues);
          
          targetPosition = existingPosition;
        } catch (linkError) {
          console.error('❌ Erro ao vincular à posição existente:', linkError);
          throw new Error(`Erro ao vincular posição: ${linkError.message || linkError}`);
        }
        
      } else {
        // 2b. Posição não existe - VERIFICAÇÃO DUPLA antes de criar
        console.log('🆕 Criando nova posição para', transactionData.contract);
        
        try {
          // Verificação dupla: buscar novamente no banco para evitar duplicatas
          console.log('🔍 Verificação dupla: buscando posições no banco...');
          const allPositions = await supabaseService.getPositions();
          const dbExistingPosition = allPositions.find(p => 
            p.contract === correctedTransactionData.contract && 
            ['EXECUTADA', 'EM_ABERTO'].includes(p.status)
          );
          
          if (dbExistingPosition) {
            console.log('🔗 ATENÇÃO: Posição encontrada no banco durante verificação dupla:', dbExistingPosition);
            
            // Usar posição encontrada no banco
            await supabaseService.updateTransaction(newTransaction.id, { positionId: dbExistingPosition.id });
            console.log('✅ Transação vinculada à posição existente no banco');
            
            // Buscar transações para recalcular
            const allTransactions = await supabaseService.getTransactions();
            const positionTransactions = allTransactions.filter(
              t => t.positionId === dbExistingPosition.id
            );
            
            const calculationResult = recalculatePosition(positionTransactions);
            await supabaseService.updatePosition(dbExistingPosition.id, calculationResult);
            
            // Atualizar estado local
            setPositions(prev => prev.map(p => 
              p.id === dbExistingPosition.id ? { ...p, ...calculationResult } : p
            ));
            
            targetPosition = dbExistingPosition;
            
          } else {
            // Realmente não existe - criar nova posição
            console.log('✅ Confirmado: nenhuma posição existe - criando nova');
            
            const positionData: Omit<Position, 'id'> = {
                          user_id: correctedTransactionData.userId || currentUser?.id || '2dc60bee-5466-4f7e-8e1d-00cf91ee6e97',
            brokerage_id: correctedTransactionData.brokerageId || selectedBrokerage?.id || '6b75b1d7-8cea-4823-9c2f-2ff236d32da6',
              contract: correctedTransactionData.contract,
              direction: correctedTransactionData.type === 'COMPRA' ? 'COMPRA' : 'VENDA',
              quantity: correctedTransactionData.quantity,
              entry_price: correctedTransactionData.price,
              current_price: correctedTransactionData.price,
              status: 'EXECUTADA',
              entry_date: correctedTransactionData.date || createLocalDate(),
              fees: correctedTransactionData.fees || 0,
              symbol: correctedTransactionData.contract,
              name: `Posição ${correctedTransactionData.contract}`,
              contract_size: correctedTransactionData.contract.startsWith('BGI') ? 330 : 450,
              unit: 'contratos'
            };
            
            console.log('📝 Dados da nova posição:', positionData);
            
            const newPosition = await supabaseService.createPosition(positionData);
            setPositions(prev => [newPosition, ...prev]);
            console.log('✅ Nova posição criada:', newPosition);
            
            // Vincular transação à nova posição
            await supabaseService.updateTransaction(newTransaction.id, { positionId: newPosition.id });
            console.log('✅ Transação vinculada à nova posição');
            
            targetPosition = newPosition;
          }
          
        } catch (createError) {
          console.error('❌ Erro ao criar nova posição:', createError);
          throw new Error(`Erro ao criar posição: ${createError.message || createError}`);
        }
      }
      
      console.log('🎉 SUCESSO: Transação e posição processadas com sucesso!');
      console.log('   Transação ID:', newTransaction.id);
      console.log('   Posição ID:', targetPosition.id);
      
      // Recarregar todos os dados para garantir sincronização
      console.log('🔄 Recarregando dados para garantir sincronização...');
      await fetchData();
      
    } catch (err) {
      console.error('❌ ERRO DETALHADO ao adicionar transação:', {
        erro: err,
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
        dadosEntrada: transactionData
      });
      
      // Definir erro mais específico
      let errorMessage = 'Erro desconhecido ao adicionar transação';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        errorMessage = JSON.stringify(err);
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      setLoading(true);
      console.log('📝 Atualizando transação:', id, updates);
      
      // 1. Buscar transação original antes da atualização
      const originalTransaction = transactions.find(t => t.id === id);
      
      // 2. Atualizar transação no banco
      const updatedTransaction = await supabaseService.updateTransaction(id, updates);
      console.log('✅ Transação atualizada no banco:', updatedTransaction);
      
      // 3. Se a transação tem posição vinculada, recalcular a posição
      if (originalTransaction && originalTransaction.positionId) {
        console.log('🧮 Recalculando posição após atualização da transação...');
        
        // Buscar todas as transações atualizadas para esta posição
        const allTransactions = await supabaseService.getTransactions();
        const positionTransactions = allTransactions.filter(
          t => t.positionId === originalTransaction.positionId
        );
        
                 if (positionTransactions.length > 0) {
           // Calcular novos valores da posição usando função helper
           const calculationResult = recalculatePosition(positionTransactions);
           
           // Atualizar posição com novos valores
           await supabaseService.updatePosition(originalTransaction.positionId, calculationResult);
           console.log('✅ Posição recalculada após atualização:', calculationResult.calculatedValues);
         }
      }
      
      // 4. Recarregar todos os dados
      console.log('🔄 Sincronizando dados após atualização...');
      await fetchData();
      
      console.log('✅ Atualização e recálculo concluídos com sucesso');
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
      
      // 3. LÓGICA INTELIGENTE - Recalcular ou excluir posição conforme necessário
      console.log('🧮 Processando impacto da exclusão na posição...');
      
      // Encontrar transação excluída nos dados carregados antes da exclusão
      const currentTransactions = transactions; // Estado atual antes da exclusão
      const deletedTransaction = currentTransactions.find(t => t.id === id);
      
      if (deletedTransaction && deletedTransaction.positionId) {
        const linkedPosition = loadedPositions.find(p => p.id === deletedTransaction.positionId);
        
        if (linkedPosition) {
          // Verificar quantas transações restantes existem para esta posição
          const remainingTransactionsForPosition = loadedTransactions.filter(
            t => t.positionId === deletedTransaction.positionId
          );
          
          console.log(`📊 Transações restantes para posição ${linkedPosition.contract}:`, remainingTransactionsForPosition.length);
          
          if (remainingTransactionsForPosition.length === 0) {
            // Não há mais transações para esta posição - EXCLUIR a posição
            console.log('🗑️ Nenhuma transação restante - Excluindo posição:', linkedPosition.id, linkedPosition.contract);
            await supabaseService.deletePosition(linkedPosition.id);
            console.log('✅ Posição excluída completamente');
                     } else {
             // Ainda há transações - RECALCULAR a posição
             console.log('🧮 Transações restantes encontradas - Recalculando posição:', linkedPosition.contract);
             
             // Calcular novos valores baseados nas transações restantes usando função helper
             const calculationResult = recalculatePosition(remainingTransactionsForPosition);
             
             console.log('📊 Novos valores calculados:', calculationResult.calculatedValues);
             
             await supabaseService.updatePosition(linkedPosition.id, calculationResult);
             console.log('✅ Posição recalculada com sucesso');
           }
        } else {
          console.log('ℹ️ Posição não encontrada ou já foi removida');
        }
      } else {
        console.log('ℹ️ Transação não tinha posição vinculada');
      }
      
      // 4. Recarregar dados finais
      console.log('🔄 Recarga final dos dados...');
      await fetchData();
      
      console.log('✅ Exclusão específica concluída com sucesso');
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
    
    const buyQuantity = contractPositions
      .filter(p => p.direction === 'COMPRA')
      .reduce((sum, p) => sum + p.quantity, 0);
    
    const sellQuantity = contractPositions
      .filter(p => p.direction === 'VENDA')
      .reduce((sum, p) => sum + p.quantity, 0);
    
    const netQuantity = buyQuantity - sellQuantity;
    const netDirection = netQuantity > 0 ? 'COMPRA' : netQuantity < 0 ? 'VENDA' : 'NEUTRO';
    
    return {
      contract,
      buyQuantity,
      sellQuantity,
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