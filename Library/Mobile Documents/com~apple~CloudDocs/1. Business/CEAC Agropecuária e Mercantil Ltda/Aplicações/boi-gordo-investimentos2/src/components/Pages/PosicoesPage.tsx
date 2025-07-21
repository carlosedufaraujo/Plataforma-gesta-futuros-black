'use client';

import { useState, useEffect, useMemo } from 'react';
import { PositionTabType, Position } from '@/types';
import DataTable from '@/components/Common/DataTable';
import TabNavigation from '@/components/Common/TabNavigation';
import NewPositionModal from '@/components/Modals/NewPositionModal';
import { useData } from '@/contexts/DataContext';

interface PosicoesPageProps {
  selectedPeriod: string;
}

export default function PosicoesPage({ selectedPeriod }: PosicoesPageProps) {
  const [activeTab, setActiveTab] = useState<PositionTabType>('gestao');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const { positions, closePosition, updatePosition } = useData();

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
      const openDate = new Date(position.openDate);
      return openDate >= startDate;
    });
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
      id: 'historico', 
      label: 'Histórico',
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

  const handleClosePosition = (positionId: string, currentPrice: number) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    const confirmed = confirm(`Deseja fechar a posição ${position.contract} (${position.direction}) ao preço atual de R$ ${currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}?`);
    
    if (confirmed) {
      closePosition(positionId, currentPrice);
      
      // Feedback visual
      const toast = document.createElement('div');
      toast.textContent = `✅ Posição ${position.contract} fechada com sucesso!`;
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
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'gestao':
        return (
          <div className="card">
            <h2>Posições Abertas ({filteredPositions.filter(p => p.status === 'OPEN').length} posições - {currentPeriodDescription})</h2>
            <DataTable
              headers={[
                'Contrato',
                'Produto',
                'Direção',
                'Quantidade',
                'Preço Entrada',
                'Preço Atual',
                'P&L',
                'Ações'
              ]}
              data={filteredPositions.filter(p => p.status === 'OPEN').map(position => {
                const contractSize = position.contract.startsWith('BGI') ? 330 : 450;
                const pnl = (position.direction === 'LONG' ? 1 : -1) * 
                  ((position.currentPrice || position.entryPrice) - position.entryPrice) * 
                  position.quantity * contractSize;

                return [
                  <div key="contract">
                    <strong>{position.contract}</strong>
                  </div>,
                  position.contract.startsWith('BGI') ? 'Boi Gordo' : 'Milho',
                  <span 
                    key="direction" 
                    className={`badge ${position.direction === 'LONG' 
                      ? 'badge-success direction-indicator long' 
                      : 'badge-danger direction-indicator short'}`}
                  >
                    {position.direction}
                  </span>,
                  position.quantity,
                  position.entryPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                  (position.currentPrice || position.entryPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                  <span key="pnl" className={pnl >= 0 ? 'positive' : 'negative'}>
                    {pnl >= 0 ? '+' : ''}R$ {Math.abs(pnl).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </span>,
                  <div key="actions" className="action-buttons">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEditPosition(position)}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleClosePosition(position.id, position.currentPrice || position.entryPrice)}
                    >
                      Fechar
                    </button>
                  </div>
                ];
              })}
            />
          </div>
        );

      case 'performance':
        return (
          <div className="card">
            <h2>Performance das Posições</h2>
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>📈 Análise de performance detalhada será implementada</p>
              <p>Total de posições: {positions.length}</p>
              <p>Posições abertas: {positions.filter(p => p.status === 'OPEN').length}</p>
              <p>Posições fechadas: {positions.filter(p => p.status === 'CLOSED').length}</p>
            </div>
          </div>
        );

      case 'historico':
        return (
          <div className="card">
            <h2>Histórico de Posições</h2>
            <DataTable
              headers={[
                'Contrato',
                'Direção',
                'Quantidade',
                'Entrada',
                'Saída',
                'P&L Realizado',
                'Data Fechamento'
              ]}
              data={filteredPositions.filter(p => p.status === 'CLOSED').map(position => [
                <strong key="contract">{position.contract}</strong>,
                <span 
                  key="direction" 
                  className={`badge ${position.direction === 'LONG' 
                    ? 'badge-success' : 'badge-danger'}`}
                >
                  {position.direction}
                </span>,
                position.quantity,
                position.entryPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                (position.exit_price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                <span key="pnl" className={(position.realized_pnl || 0) >= 0 ? 'positive' : 'negative'}>
                  {(position.realized_pnl || 0) >= 0 ? '+' : ''}R$ {Math.abs(position.realized_pnl || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>,
                position.exit_date ? new Date(position.exit_date).toLocaleDateString('pt-BR') : '-'
              ])}
            />
          </div>
        );

      case 'resumo':
        return (
          <div className="card">
            <h2>Resumo Visual</h2>
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>📊 Gráficos e resumos visuais serão implementados</p>
            </div>
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

      {/* Modal de Edição de Posição */}
      <NewPositionModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleEditSubmit}
        editingPosition={editingPosition}
      />
    </div>
  );
} 