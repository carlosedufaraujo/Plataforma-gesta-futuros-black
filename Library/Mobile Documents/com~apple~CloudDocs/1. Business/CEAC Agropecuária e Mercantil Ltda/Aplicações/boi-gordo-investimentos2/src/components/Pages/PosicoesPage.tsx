'use client';

import { useState, useEffect, useMemo } from 'react';
import { PositionTabType, Position, Transaction } from '@/types';
import DataTable from '@/components/Common/DataTable';
import TabNavigation from '@/components/Common/TabNavigation';
import NewPositionModal from '@/components/Modals/NewPositionModal';
import ClosePositionModal from '@/components/Modals/ClosePositionModal';
import ViewTransactionModal from '@/components/Modals/ViewTransactionModal';
import EditTransactionModal from '@/components/Modals/EditTransactionModal';
import DeleteTransactionModal from '@/components/Modals/DeleteTransactionModal';
import { useHybridData } from '@/contexts/HybridDataContext';
import { useNetPositions } from '@/hooks/useNetPositions';
import { parseLocalDate, formatDateBR, formatTimeBR } from '@/utils/dateUtils';

interface PosicoesPageProps {
  selectedPeriod: string;
}

export default function PosicoesPage({ selectedPeriod }: PosicoesPageProps) {
  const { positions, transactions, addPosition, addTransaction, updatePosition, closePosition, updateTransaction, deleteTransaction } = useHybridData();
  const { 
    netPositions, 
    netStats, 
    formatNetQuantity, 
    getDirectionColor, 
    getNeutralizedPositionsForPerformance, 
    getPartialPnLForPerformance,
    getRealizedPnL
  } = useNetPositions();
  const [activeTab, setActiveTab] = useState<PositionTabType>('gestao');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Estados dos modais de transação
  const [isViewTransactionModalOpen, setIsViewTransactionModalOpen] = useState(false);
  const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false);
  const [isDeleteTransactionModalOpen, setIsDeleteTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [showNewPositionModal, setShowNewPositionModal] = useState(false);
  const [isClosePositionModalOpen, setIsClosePositionModalOpen] = useState(false);
  const [positionToClose, setPositionToClose] = useState<Position | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedConsolidated, setSelectedConsolidated] = useState<any>(null);
  
  // Estados para edição inline de preço
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');
  


  // Opções de período para descrição
  const periodOptions = [
    { value: '30d', label: '30 dias', description: 'Últimos 30 dias' },
    { value: '60d', label: '60 dias', description: 'Últimos 60 dias' },
    { value: '90d', label: '90 dias', description: 'Últimos 90 dias' },
    { value: '6m', label: '6 meses', description: 'Últimos 6 meses' },
    { value: '1y', label: '1 ano', description: 'Último ano' },
    { value: 'all', label: 'Todo período', description: 'Desde o início' }
  ];

  // Função para filtrar posições por período
  const filterPositionsByPeriod = (positions: Position[], period: string) => {
    if (period === 'all') return positions;
    
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '60d':
        startDate.setDate(now.getDate() - 60);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return positions;
    }
    
    return positions.filter(position => {
      const openDate = new Date(position.entry_date);
      return openDate >= startDate;
    });
  };

  // Função para filtrar transações por período
  const filterTransactionsByPeriod = (transactions: Transaction[], period: string) => {
    if (period === 'all') return transactions;
    
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '60d':
        startDate.setDate(now.getDate() - 60);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return transactions;
    }
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate;
    });
  };

  // Função para mostrar detalhes das posições de um contrato
  const showPositionDetails = (consolidated: any) => {
    setSelectedConsolidated(consolidated);
    setIsDetailsModalOpen(true);
  };

  const tabs = [
    { 
      id: 'gestao', 
      label: 'Gestão',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
      )
    },
    { 
      id: 'performance', 
      label: 'Performance',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"></path>
          <path d="M7 12l4-4 4 4 6-6"></path>
        </svg>
      )
    },
    { 
      id: 'transacoes', 
      label: 'Transações',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12,6 12,12 16,14"></polyline>
        </svg>
      )
    },
    { 
      id: 'resumo', 
      label: 'Resumo Visual',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="15"></line>
          <line x1="15" y1="9" x2="9" y2="15"></line>
        </svg>
      )
    }
  ];

  // Aplicar filtro de período - USANDO DADOS REAIS
  const filteredPositions = useMemo(() => {
    return filterPositionsByPeriod(positions, selectedPeriod);
  }, [positions, selectedPeriod]);

  // Filtrar transações por período
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByPeriod(transactions, selectedPeriod);
  }, [transactions, selectedPeriod]);

  // Obter descrição do período atual
  const currentPeriodDescription = periodOptions.find(p => p.value === selectedPeriod)?.description || 'Período personalizado';

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPosition(null);
  };

  const handleNewPosition = (positionData: Omit<Position, 'id'>) => {
    console.log('🔥 PÁGINA POSIÇÕES: handleNewPosition chamada com dados:', positionData);
    console.log('🔥 PÁGINA POSIÇÕES: addPosition function type:', typeof addPosition);
    console.log('🔥 PÁGINA POSIÇÕES: Chamando addPosition...');
    addPosition(positionData);
    setShowNewPositionModal(false);
  };

  const handleEditSubmit = (updatedPositionData: Omit<Position, 'id'>) => {
    if (editingPosition && updatePosition) {
      const updatedPosition: Position = {
        ...editingPosition,
        ...updatedPositionData,
        id: editingPosition.id
      };
      
      updatePosition(editingPosition.id, updatedPosition);
      
      // Feedback visual
      const toast = document.createElement('div');
      toast.textContent = `✅ Posição ${updatedPosition.contract} atualizada com sucesso!`;
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
      
      handleCloseEditModal();
    }
  };

  const handleDuplicatePosition = (position: Position) => {
    const confirmMessage = `Confirmar duplicação da posição?\n\n` +
      `Contrato: ${position.contract}\n` +
      `Direção: ${position.direction}\n` +
      `Quantidade: ${position.quantity} contratos\n` +
      `Preço de Entrada: R$ ${position.entry_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
      `Uma nova posição idêntica será criada com data atual.`;
      
    if (confirm(confirmMessage)) {
      const duplicatedPosition: Omit<Position, 'id'> = {
        user_id: position.user_id,
        contract_id: `contract_${Date.now()}`,
        contract: position.contract,
        direction: position.direction,
        quantity: position.quantity,
        entry_price: position.entry_price,
        current_price: position.current_price,
        status: 'OPEN',
        entry_date: new Date().toISOString(),
        fees: position.fees || 0,
        unrealized_pnl: 0,
        pnl_percentage: 0
      };
      
      addPosition(duplicatedPosition);
      
      // Feedback visual
      const toast = document.createElement('div');
      toast.textContent = `✅ Posição ${position.contract} duplicada com sucesso!`;
      toast.style.cssText = `
        position: fixed; top: 70px; right: 20px; z-index: 10002;
        background: var(--color-info); color: white; padding: 12px 20px;
        border-radius: 8px; font-weight: 500; animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    }
  };

  const handleClosePosition = (positionId: string, currentPrice: number) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    setPositionToClose(position);
    setIsClosePositionModalOpen(true);
  };

  const handleClosePositionModalClose = () => {
    setIsClosePositionModalOpen(false);
    setPositionToClose(null);
  };

  const handleClosePositionSubmit = async (closeData: any) => {
    if (!positionToClose) return;

    try {
      // Verificar se é uma posição consolidada
      if ((positionToClose as any)._isConsolidated) {
        console.log('🔥 Fechando posição consolidada:', {
          contract: positionToClose.contract,
          quantity: closeData.quantity,
          closePrice: closeData.closePrice
        });

        const netPosition = (positionToClose as any)._netPosition;
        const quantityToClose = closeData.quantity;
        const closePrice = closeData.closePrice;

        let quantityRemaining = quantityToClose;
        
        // Ordenar posições por direção (fechar primeiro as posições contrárias à direção líquida)
        const sortedPositions = [...netPosition.positions].sort((a, b) => {
                  if (netPosition.netDirection === 'COMPRA') {
          // Se líquido é COMPRA, fechar primeiro as VENDA
          return a.direction === 'VENDA' ? -1 : 1;
        } else {
          // Se líquido é VENDA, fechar primeiro as COMPRA
          return a.direction === 'COMPRA' ? -1 : 1;
        }
        });

        for (const position of sortedPositions) {
          if (quantityRemaining <= 0) break;

          const positionQuantity = position.quantity;
          const quantityToCloseFromThis = Math.min(quantityRemaining, positionQuantity);

          console.log(`🎯 Fechando ${quantityToCloseFromThis} de ${positionQuantity} da posição ${position.id}`);

          if (quantityToCloseFromThis === positionQuantity) {
            // Fechar posição completamente
            await closePosition(position.id, closePrice);
          } else {
            // Fechamento parcial - criar transação de fechamento e atualizar quantidade
            const closeTransactionData = {
              userId: position.user_id,
              brokerageId: position.brokerage_id,
              positionId: position.id,
              date: new Date().toISOString(),
              type: position.direction === 'COMPRA' ? 'VENDA' : 'COMPRA',
              contract: position.contract,
              quantity: quantityToCloseFromThis,
              price: closePrice,
              fees: 0,
              total: quantityToCloseFromThis * closePrice,
              status: 'EXECUTADA'
            };

            await addTransaction(closeTransactionData);

            // Atualizar quantidade da posição
            const updatedQuantity = positionQuantity - quantityToCloseFromThis;
            await updatePosition(position.id, { 
              quantity: updatedQuantity,
              status: updatedQuantity > 0 ? 'EM_ABERTO' : 'FECHADA'
            });
          }

          quantityRemaining -= quantityToCloseFromThis;
        }

        // Feedback visual para posição consolidada
        const toast = document.createElement('div');
        toast.textContent = `✅ Fechadas ${quantityToClose} unidades de ${positionToClose.contract}!`;
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

      } else {
        // Posição individual normal
        await closePosition(positionToClose.id, closeData.closePrice);
        
        // Feedback visual
        const toast = document.createElement('div');
        toast.textContent = `✅ Posição ${positionToClose.contract} fechada com sucesso!`;
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
      }

    } catch (error) {
      console.error('❌ Erro ao fechar posição:', error);
      
      const errorToast = document.createElement('div');
      errorToast.textContent = `❌ Erro ao fechar posição. Tente novamente.`;
      errorToast.style.cssText = `
        position: fixed; top: 70px; right: 20px; z-index: 10002;
        background: var(--color-danger); color: white; padding: 12px 20px;
        border-radius: 8px; font-weight: 500; animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(errorToast);
      
      setTimeout(() => {
        errorToast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => document.body.removeChild(errorToast), 300);
      }, 3000);
    }

    handleClosePositionModalClose();
  };

  const handleEditConsolidatedPosition = (consolidated: any) => {
    // Implementar funcionalidade de edição consolidada
    const firstPosition = consolidated.positions[0];
    if (firstPosition) {
      setEditingPosition(firstPosition);
      setIsEditModalOpen(true);
    }
  };

  // Funções dos modais de transação
  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsViewTransactionModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditTransactionModalOpen(true);
  };

  const handleDeleteTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteTransactionModalOpen(true);
  };

  const handleSaveTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      await updateTransaction(id, updates);
      
      // Feedback visual
      const toast = document.createElement('div');
      toast.textContent = '✅ Transação atualizada com sucesso!';
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
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
    }
  };

  const handleConfirmDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      
      // Feedback visual
      const toast = document.createElement('div');
      toast.textContent = '✅ Transação excluída com sucesso!';
      toast.style.cssText = `
        position: fixed; top: 70px; right: 20px; z-index: 10002;
        background: var(--color-negative); color: white; padding: 12px 20px;
        border-radius: 8px; font-weight: 500; animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
    }
  };



  const renderTabContent = () => {
    switch (activeTab) {
      case 'gestao':
        const openPositionsForGestao = filteredPositions.filter(p => p.status === 'EXECUTADA' || p.status === 'EM_ABERTO');
        
        return (
          <div className="card">
            <h2>Gestão de Posições ({netPositions.length} ativos - {currentPeriodDescription})</h2>
            
            {netPositions.length > 0 ? (
              <DataTable
                headers={[
                  'Ativo',
                  'Direção',
                  'Quantidade',
                  'Preço Médio Entrada',
                  'Preço Atual',
                  'P&L Acumulado',
                  'Exposição',
                  'Ações'
                ]}
                data={netPositions.map(netPosition => {
                  return [
                    // Ativo (Contrato + Produto)
                    <div key="asset" className="asset-info">
                      <div className="asset-code">{netPosition.contract}</div>
                      <div className="asset-name">{netPosition.product}</div>
                    </div>,
                    
                    // Direção
                    <span 
                      key="direction" 
                      className={`direction-indicator ${netPosition.netDirection.toLowerCase()}`}
                    >
                      {netPosition.netDirection}
                    </span>,
                    
                    // Quantidade (com sinal negativo para VENDA)
                    <strong 
                      key="quantity" 
                      className={netPosition.netQuantity < 0 ? 'negative' : ''}
                      style={{ color: netPosition.netQuantity < 0 ? 'var(--color-danger)' : 'var(--text-primary)' }}
                    >
                      {formatNetQuantity(netPosition.netQuantity)}
                    </strong>,
                    
                    // Preço Médio de Entrada
                    netPosition.weightedEntryPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    
                    // Preço Atual com edição inline minimalista
                    <div key="currentPrice" className="price-edit-container">
                      {editingPrice === netPosition.contract ? (
                        <div className="price-edit-compact">
                          <input
                            type="number"
                            value={editingPriceValue}
                            onChange={(e) => setEditingPriceValue(e.target.value)}
                            className="price-edit-input-compact"
                            autoFocus
                          />
                          <div className="price-edit-actions-compact">
                            <button 
                              className="btn-icon-compact btn-success"
                              onClick={() => {
                                if (editingPriceValue && !isNaN(Number(editingPriceValue))) {
                                  // Atualizar todas as posições do contrato
                                  netPosition.positions.forEach(position => {
                                    updatePosition(position.id, { current_price: Number(editingPriceValue) });
                                  });
                                }
                                setEditingPrice(null);
                                setEditingPriceValue('');
                              }}
                              title="Confirmar"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20,6 9,17 4,12"></polyline>
                              </svg>
                            </button>
                            <button 
                              className="btn-icon-compact btn-cancel"
                              onClick={() => {
                                setEditingPrice(null);
                                setEditingPriceValue('');
                              }}
                              title="Cancelar"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="price-display-container">
                          <span className="price-value">
                            {netPosition.currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <button 
                            className="price-edit-trigger"
                            onClick={() => {
                              setEditingPrice(netPosition.contract);
                              setEditingPriceValue(netPosition.currentPrice.toString());
                            }}
                            title="Editar preço atual"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                        </span>
                      )}
                    </div>,
                    
                    // P&L Acumulado
                    <span key="pnl" className={netPosition.unrealizedPnL >= 0 ? 'positive' : 'negative'}>
                      {netPosition.unrealizedPnL < 0 ? '-' : ''}R$ {Math.abs(netPosition.unrealizedPnL).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </span>,
                    
                    // Exposição
                    <strong key="exposure">
                      R$ {netPosition.exposure.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </strong>,
                    
                    // Ações
                    <div key="actions" className="action-buttons">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          // Mostrar detalhes das posições individuais
                          showPositionDetails(netPosition);
                        }}
                        title="Ver detalhes das posições"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        </svg>
                        Detalhes
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          // Usar o modal original com uma posição "virtual"
                          const consolidatedPosition = {
                            id: `consolidated-${netPosition.contract}`,
                            contract: netPosition.contract,
                            direction: netPosition.netDirection,
                            quantity: Math.abs(netPosition.netQuantity),
                            entry_price: netPosition.positions[0]?.entry_price || 0,
                            current_price: netPosition.positions[0]?.current_price || netPosition.positions[0]?.entry_price || 0,
                            user_id: netPosition.positions[0]?.user_id || '',
                            brokerage_id: netPosition.positions[0]?.brokerage_id || '',
                            date: netPosition.positions[0]?.date || new Date().toISOString(),
                            fees: 0,
                            status: 'EM_ABERTO' as const,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            realized_pnl: null,
                            unrealized_pnl: null,
                            contract_id: netPosition.positions[0]?.contract_id || null,
                            _isConsolidated: true,
                            _netPosition: netPosition
                          };
                          setPositionToClose(consolidatedPosition);
                          setIsClosePositionModalOpen(true);
                        }}
                        title="Fechar quantidade específica da posição consolidada"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2,2h4a2,2 0 0,1,2,2v2"></path>
                        </svg>
                        Fechar
                      </button>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleEditConsolidatedPosition(netPosition)}
                        title="Editar posição consolidada"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Editar
                      </button>
                    </div>
                  ];
                })}
              />
            ) : (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
                <p>Nenhuma posição líquida encontrada</p>
              </div>
            )}
          </div>
        );

      case 'performance':
        // 🚀 LÓGICA CORRIGIDA: Usar getPartialPnLForPerformance que já calcula corretamente
        const realizedPnL = getPartialPnLForPerformance;
        const totalPnlRealized = realizedPnL.reduce((sum, entry) => sum + entry.pnl, 0);
        const totalPnlUnrealized = netStats.totalUnrealizedPnL;
        const totalPnl = totalPnlRealized + totalPnlUnrealized;
        
        const winningPositions = realizedPnL.filter(p => p.pnl > 0).length;
        const losingPositions = realizedPnL.filter(p => p.pnl < 0).length;
        const winRate = realizedPnL.length > 0 ? (winningPositions / realizedPnL.length) * 100 : 0;
        
        // Usar dados de P&L realizado para performance
        const contractPerformance = realizedPnL.map(entry => ({
          contract: entry.contract,
          product: entry.product,
          status: entry.status,
          pnl: entry.pnl,
          quantidadeLiquidada: entry.quantidadeLiquidada,
          ultimaOperacao: entry.ultimaOperacao,
          operacoesRealizadas: entry.operacoesRealizadas
        }));
        
        return (
          <div className="card">
            <h2>P&L Realizado ({realizedPnL.length} operações - {currentPeriodDescription})</h2>
            
            {/* Resumo de Performance */}
            <div className="performance-summary">
              <div className="performance-metrics">
                <div className="metric-item">
                  <div className="metric-label">P&L Total</div>
                  <div className={`metric-value ${totalPnl >= 0 ? 'positive' : 'negative'}`}>
                    {totalPnl < 0 ? '-' : ''}R$ {Math.abs(totalPnl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="metric-item">
                  <div className="metric-label">P&L Realizado</div>
                  <div className={`metric-value ${totalPnlRealized >= 0 ? 'positive' : 'negative'}`}>
                    {totalPnlRealized >= 0 ? '+' : ''}R$ {totalPnlRealized.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="metric-item">
                  <div className="metric-label">P&L Não Realizado</div>
                  <div className={`metric-value ${totalPnlUnrealized >= 0 ? 'positive' : 'negative'}`}>
                    {totalPnlUnrealized >= 0 ? '+' : ''}R$ {totalPnlUnrealized.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="metric-item">
                  <div className="metric-label">Exposição Total</div>
                  <div className="metric-value">
                    R$ {netStats.totalExposure.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="metric-item">
                  <div className="metric-label">Taxa de Acerto</div>
                  <div className={`metric-value ${winRate >= 50 ? 'positive' : 'negative'}`}>
                    {winRate.toFixed(1)}%
                  </div>
                  <div className="metric-detail">
                    {winningPositions}W / {losingPositions}L
                  </div>
                </div>
                
                <div className="metric-item">
                  <div className="metric-label">Posições Ativas</div>
                  <div className="metric-value">
                    {netPositions.length}
                  </div>
                  <div className="metric-detail">
                    {netStats.buyPositions}C / {netStats.sellPositions}V
                  </div>
                </div>
              </div>
            </div>
            
            {/* P&L Realizado por Contrato */}
            {contractPerformance.length > 0 ? (
              <div className="performance-breakdown">
                <h3>P&L Realizado por Contrato</h3>
                <DataTable
                  headers={['Ativo', 'Status', 'Quantidade', 'P&L Realizado', 'Última Operação']}
                  data={contractPerformance.map(contract => [
                    <div key="asset" className="asset-info">
                      <div className="asset-code">{contract.contract}</div>
                      <div className="asset-name">{contract.product}</div>
                    </div>,
                    <span key="status" className={`badge ${
                      contract.status === 'FECHADA' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {contract.status === 'FECHADA' ? 'FECHADA' : 'REDUÇÃO PARCIAL'}
                    </span>,
                    <strong key="quantity" style={{ 
                      fontSize: '16px',
                      color: contract.status === 'FECHADA' ? '#059669' : '#d97706'
                    }}>
                      {contract.quantidadeLiquidada || contract.netQuantity || 0}
                    </strong>,
                    <span key="pnl" className={contract.pnl >= 0 ? 'positive' : 'negative'}>
                      {contract.pnl >= 0 ? '+' : ''}R$ {contract.pnl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>,
                    <div key="date" style={{ fontSize: '13px' }}>
                      {(() => {
                        const dataUltima = contract.ultimaRealizacao || contract.ultimaOperacao;
                        
                        if (dataUltima) {
                          const data = parseLocalDate(dataUltima);
                          return (
                            <div>
                              <strong>{formatDateBR(data)}</strong>
                              <br />
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {formatTimeBR(data)}
                              </span>
                            </div>
                          );
                        }
                        return <span style={{ color: 'var(--text-secondary)' }}>N/A</span>;
                      })()}
                    </div>
                  ])}
                />
              </div>
            ) : (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18"></path>
                  <path d="M7 12l4-4 4 4 6-6"></path>
                </svg>
                <p>Nenhum P&L realizado encontrado</p>
                <span>Realize operações de redução ou fechamento para ver o P&L realizado</span>
              </div>
            )}


          </div>
        );

      case 'transacoes':
        const executedTransactions = filteredTransactions.filter(t => t.status === 'EXECUTADA');
        const totalVolume = executedTransactions.reduce((sum, t) => sum + t.total, 0);
        const totalFees = executedTransactions.reduce((sum, t) => sum + t.fees, 0);
        const buyTransactions = executedTransactions.filter(t => t.type === 'COMPRA').length;
        const sellTransactions = executedTransactions.filter(t => t.type === 'VENDA').length;

        return (
          <div>
            {/* Cards de Resumo de Transações */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Volume Total</div>
                <div className="metric-value">R$ {totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="metric-change">{executedTransactions.length} transações executadas</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Taxas Totais</div>
                <div className="metric-value">R$ {totalFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="metric-change">{totalVolume > 0 ? ((totalFees / totalVolume) * 100).toFixed(2) : '0.00'}% do volume</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Operações de Compra</div>
                <div className="metric-value">{buyTransactions}</div>
                <div className="metric-change positive">Entradas</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Operações de Venda</div>
                <div className="metric-value">{sellTransactions}</div>
                <div className="metric-change negative">Saídas</div>
              </div>
            </div>

            <div className="card">
              <h2>Transações Executadas ({executedTransactions.length}) - {currentPeriodDescription}</h2>
              
              {executedTransactions.length > 0 ? (
                <DataTable
                  headers={[
                    'ID',
                    'Data/Hora',
                    'Contrato',
                    'Tipo',
                    'Quantidade',
                    'Preço',
                    'Taxa',
                    'Total',
                    'Status',
                    'Ações'
                  ]}
                  data={executedTransactions.map((transaction, index) => [
                    <small key="id" style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {transaction.id}
                    </small>,
                    <div key="datetime">
                      <strong>{new Date(transaction.date).toLocaleDateString('pt-BR')}</strong>
                      <br />
                      <small style={{ color: 'var(--text-secondary)' }}>
                        {new Date(transaction.date).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </small>
                    </div>,
                    <div key="contract">
                      <strong>{transaction.contract}</strong>
                      <br />
                      <small style={{ color: 'var(--text-secondary)' }}>
                        {transaction.contract.startsWith('BGI') ? 'Boi Gordo' : 'Milho'}
                      </small>
                    </div>,
                    transaction.type === 'COMPRA' 
                      ? <span className="badge badge-success direction-indicator long">COMPRA ↑</span>
                      : <span className="badge badge-danger direction-indicator short">VENDA ↓</span>,
                    <strong key="quantity">{transaction.quantity}</strong>,
                    transaction.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                    transaction.fees > 0 
                      ? transaction.fees.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      : '-',
                    transaction.total > 0
                      ? <strong key="total">
                          R$ {transaction.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                      : '-',
                    <span className="badge badge-success">Executada</span>,
                    <div key="actions" className="action-buttons">
                      <button 
                        className="btn btn-info btn-sm"
                        onClick={() => handleViewTransaction(transaction)}
                        title="Visualizar transação"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        </svg>
                        Ver
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEditTransaction(transaction)}
                        title="Editar transação"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Editar
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteTransaction(transaction)}
                        title="Excluir transação"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Excluir
                      </button>
                    </div>
                  ])}
                />
              ) : (
                <div className="empty-state-small" style={{ textAlign: 'center', padding: '40px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 12l2 2 4-4"></path>
                  </svg>
                  <p>Nenhuma transação executada encontrada para o período selecionado.</p>
                  <div style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <p>As transações são criadas automaticamente quando você adiciona posições.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'resumo':
        const allPositions = filteredPositions;
        const openPos = allPositions.filter(p => p.status === 'EXECUTADA' || p.status === 'EM_ABERTO');
        const closedPos = allPositions.filter(p => p.status === 'FECHADA');
        
        // Distribuição por contrato
        const contractDistribution = allPositions.reduce((acc, pos) => {
          const product = pos.contract.startsWith('BGI') ? 'Boi Gordo' : 'Milho';
          acc[product] = (acc[product] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // Distribuição por direção
        const directionDistribution = allPositions.reduce((acc, pos) => {
          acc[pos.direction] = (acc[pos.direction] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // P&L por mês (simulado baseado nas datas)
        const monthlyPnl = allPositions.reduce((acc, pos) => {
          const date = new Date(pos.entry_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!acc[monthKey]) acc[monthKey] = 0;
          
          if (pos.status === 'FECHADA' && pos.realized_pnl) {
            acc[monthKey] += pos.realized_pnl;
          } else if (pos.status === 'EXECUTADA' || pos.status === 'EM_ABERTO') {
            const contractSize = pos.contract.startsWith('BGI') ? 330 : 450;
                          const unrealizedPnl = (pos.direction === 'COMPRA' ? 1 : -1) * 
              ((pos.current_price || pos.entry_price) - pos.entry_price) * 
              pos.quantity * contractSize;
            acc[monthKey] += unrealizedPnl;
          }
          
          return acc;
        }, {} as Record<string, number>);
        
        return (
          <div className="card">
            <h2>Resumo Visual ({allPositions.length} posições - {currentPeriodDescription})</h2>
            
            {allPositions.length > 0 ? (
              <div>
                {/* Cards de Resumo */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                  
                  {/* Distribuição por Produto */}
                  <div className="summary-card" style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ marginBottom: '16px', fontSize: '16px', color: 'var(--text-primary)' }}>Distribuição por Produto</h4>
                    {Object.entries(contractDistribution).map(([product, count]) => {
                      const percentage = ((count / allPositions.length) * 100).toFixed(1);
                      return (
                        <div key={product} style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px' }}>{product}</span>
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>{count} ({percentage}%)</span>
                          </div>
                          <div style={{ background: 'var(--bg-primary)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              background: product === 'Boi Gordo' ? '#f59e0b' : '#10b981', 
                              height: '100%', 
                              width: `${percentage}%`,
                              borderRadius: '4px'
                            }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Distribuição por Direção */}
                  <div className="summary-card" style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ marginBottom: '16px', fontSize: '16px', color: 'var(--text-primary)' }}>Distribuição por Direção</h4>
                    {Object.entries(directionDistribution).map(([direction, count]) => {
                      const percentage = ((count / allPositions.length) * 100).toFixed(1);
                      return (
                        <div key={direction} style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px' }}>{direction}</span>
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>{count} ({percentage}%)</span>
                          </div>
                          <div style={{ background: 'var(--bg-primary)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              background: direction === 'COMPRA' ? '#10b981' : '#ef4444', 
                              height: '100%', 
                              width: `${percentage}%`,
                              borderRadius: '4px'
                            }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Status das Posições */}
                  <div className="summary-card" style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ marginBottom: '16px', fontSize: '16px', color: 'var(--text-primary)' }}>Status das Posições</h4>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px' }}>Abertas</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-success)' }}>{openPos.length}</span>
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px' }}>Fechadas</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>{closedPos.length}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '6px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total</div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>{allPositions.length} posições</div>
                    </div>
                  </div>
                </div>
                
                {/* P&L por Período */}
                {Object.keys(monthlyPnl).length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '16px', fontSize: '16px', color: 'var(--text-primary)' }}>P&L por Período</h4>
                    <div className="pnl-chart" style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      {Object.entries(monthlyPnl).map(([month, pnl]) => {
                        const maxPnl = Math.max(...Object.values(monthlyPnl).map(Math.abs));
                        const barWidth = maxPnl > 0 ? (Math.abs(pnl) / maxPnl) * 100 : 0;
                        
                        return (
                          <div key={month} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '14px' }}>{month}</span>
                              <span className={pnl >= 0 ? 'positive' : 'negative'} style={{ fontSize: '14px', fontWeight: '600' }}>
                                {pnl >= 0 ? '+' : ''}R$ {Math.abs(pnl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div style={{ background: 'var(--bg-primary)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ 
                                background: pnl >= 0 ? '#10b981' : '#ef4444', 
                                height: '100%', 
                                width: `${barWidth}%`,
                                borderRadius: '4px'
                              }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state-small" style={{ textAlign: 'center', padding: '40px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <path d="M7 10h10"></path>
                  <path d="M7 14h10"></path>
                </svg>
                <p>Nenhuma posição encontrada para gerar resumo visual</p>
                <div style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <p>Crie algumas posições para ver gráficos e estatísticas aqui.</p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as PositionTabType)}
      />

      {renderTabContent()}

      {/* Modal de Nova Posição */}
      <NewPositionModal
        isOpen={showNewPositionModal}
        onClose={() => {
          setShowNewPositionModal(false);
          setEditingPosition(null);
        }}
        onSubmit={handleNewPosition}
      />

      {/* Modal de Edição de Posição */}
      <NewPositionModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleEditSubmit}
        editingPosition={editingPosition}
      />

      {/* Modal de Fechar Posição */}
      {isClosePositionModalOpen && (
        <ClosePositionModal
          isOpen={isClosePositionModalOpen}
          onClose={handleClosePositionModalClose}
          onSubmit={handleClosePositionSubmit}
          position={positionToClose}
        />
      )}

      

      {/* Modal de Detalhes das Posições */}
      {isDetailsModalOpen && selectedConsolidated && (
        <div className="modal-overlay">
          <div className="modal position-details-modal">
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title-section">
                <h2 className="modal-title">Análise Detalhada da Posição</h2>
                <div className="modal-subtitle">
                  <div className="asset-info">
                    <span className="asset-code">{selectedConsolidated.contract}</span>
                    <span className="asset-name">{selectedConsolidated.product}</span>
                  </div>
                </div>
              </div>
              <button 
                className="modal-close" 
                onClick={() => setIsDetailsModalOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">
              {/* Métricas Financeiras */}
              <div className="financial-metrics">
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">Posições Ativas</div>
                    <div className="metric-value">{selectedConsolidated.positions.length}</div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-label">Quantidade Líquida</div>
                    <div className="metric-value">
                      {selectedConsolidated.netQuantity}
                      <span className={`direction-badge ${selectedConsolidated.netDirection.toLowerCase()}`}>
                        {selectedConsolidated.netDirection}
                      </span>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-label">Preço Médio de Entrada</div>
                    <div className="metric-value">
                      {selectedConsolidated.weightedEntryPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-label">Preço Atual</div>
                    <div className="metric-value">
                      {selectedConsolidated.currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </div>

                {/* Análise de Resultado */}
                <div className="pnl-analysis">
                  {(() => {
                    const contractSize = selectedConsolidated.contract.startsWith('BGI') ? 330 : 450;
                    const priceDiff = selectedConsolidated.currentPrice - selectedConsolidated.weightedEntryPrice;
                    const multiplier = selectedConsolidated.netDirection === 'COMPRA' ? 1 : -1;
                    const unrealizedPnL = multiplier * priceDiff * Math.abs(selectedConsolidated.netQuantity) * contractSize;
                    const pnlPercentage = (priceDiff / selectedConsolidated.weightedEntryPrice) * 100 * multiplier;
                    const totalExposure = selectedConsolidated.weightedEntryPrice * Math.abs(selectedConsolidated.netQuantity) * contractSize;
                    
                    return (
                      <>
                        <div className="pnl-card">
                          <div className="pnl-header">
                            <h4 className="pnl-title">Resultado Não Realizado</h4>
                          </div>
                          <div className="pnl-content">
                            <div className={`pnl-amount ${unrealizedPnL >= 0 ? 'positive' : 'negative'}`}>
                              {unrealizedPnL < 0 ? '-' : ''}
                              R$ {Math.abs(unrealizedPnL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className={`pnl-percentage ${pnlPercentage >= 0 ? 'positive' : 'negative'}`}>
                              {pnlPercentage < 0 ? '-' : ''}{Math.abs(pnlPercentage).toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        <div className="exposure-metrics">
                          <div className="exposure-item">
                            <span className="exposure-label">Exposição Total</span>
                            <span className="exposure-value">
                              {totalExposure.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          <div className="exposure-item">
                            <span className="exposure-label">Variação por Ponto</span>
                            <span className="exposure-value">
                              {(Math.abs(selectedConsolidated.netQuantity) * contractSize).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          <div className="exposure-item">
                            <span className="exposure-label">Tamanho do Contrato</span>
                            <span className="exposure-value">{contractSize.toLocaleString()} kg</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Tabela de Posições Individuais */}
              <div className="positions-details">
                <h3 className="section-title">Histórico de Posições Individuais</h3>
                <DataTable
                  headers={['ID', 'Data/Hora', 'Direção', 'Quantidade', 'Preço de Entrada', 'P&L Individual', 'Status']}
                  data={selectedConsolidated.positions
                    .sort((a: Position, b: Position) => 
                      new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
                    )
                    .map((position: Position) => {
                      const contractSize = position.contract.startsWith('BGI') ? 330 : 450;
                      const currentPrice = position.current_price || selectedConsolidated.currentPrice;
                      const priceDiff = currentPrice - position.entry_price;
                      const multiplier = position.direction === 'COMPRA' ? 1 : -1;
                      const individualPnL = multiplier * priceDiff * position.quantity * contractSize;
                      
                      return [
                        <small key="id" style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontWeight: '600' }}>
                          {position.id}
                        </small>,
                        <div key="datetime" className="datetime-cell">
                          <div className="date-part">{new Date(position.entry_date).toLocaleDateString('pt-BR')}</div>
                          <div className="time-part">
                            {new Date(position.entry_date).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>,
                        <span 
                          className={`direction-indicator ${position.direction.toLowerCase()}`}
                        >
                          {position.direction}
                        </span>,
                        <div key="quantity" className="quantity-cell">
                          <strong>{position.quantity}</strong>
                          <small>contratos</small>
                        </div>,
                        <div key="price" className="price-cell">
                          {position.entry_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>,
                        <div key="pnl" className={`pnl-cell ${individualPnL >= 0 ? 'positive' : 'negative'}`}>
                          {individualPnL >= 0 ? '+' : ''}
                          {individualPnL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>,
                        <span className="status-indicator open">Aberta</span>
                      ];
                    })
                  }
                />
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsDetailsModalOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
                Fechar
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handleEditConsolidatedPosition(selectedConsolidated);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Editar Posições
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Transação */}
      <ViewTransactionModal
        isOpen={isViewTransactionModalOpen}
        onClose={() => setIsViewTransactionModalOpen(false)}
        transaction={selectedTransaction}
      />

      <EditTransactionModal
        isOpen={isEditTransactionModalOpen}
        onClose={() => setIsEditTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={selectedTransaction}
      />

      <DeleteTransactionModal
        isOpen={isDeleteTransactionModalOpen}
        onClose={() => setIsDeleteTransactionModalOpen(false)}
        onConfirm={handleConfirmDeleteTransaction}
        transaction={selectedTransaction}
      />
    </div>
  );
} 