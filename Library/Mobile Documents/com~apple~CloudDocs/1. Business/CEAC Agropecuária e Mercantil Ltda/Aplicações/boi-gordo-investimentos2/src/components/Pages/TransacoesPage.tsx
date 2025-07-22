'use client';

import { useState, useMemo } from 'react';
import { TransactionTabType, Transaction } from '@/types';
import DataTable from '@/components/Common/DataTable';
import TabNavigation from '@/components/Common/TabNavigation';
import { useData } from '@/contexts/DataContext';

interface TransacoesPageProps {
  selectedPeriod: string;
}

export default function TransacoesPage({ selectedPeriod }: TransacoesPageProps) {
  const [activeTab, setActiveTab] = useState<TransactionTabType>('executadas');
  const { transactions } = useData();

  // Opções de período para descrição
  const periodOptions = [
    { value: '30d', label: '30 dias', description: 'Últimos 30 dias' },
    { value: '60d', label: '60 dias', description: 'Últimos 60 dias' },
    { value: '90d', label: '90 dias', description: 'Últimos 90 dias' },
    { value: '6m', label: '6 meses', description: 'Últimos 6 meses' },
    { value: '1y', label: '1 ano', description: 'Último ano' },
    { value: 'all', label: 'Todo período', description: 'Desde o início' }
  ];

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

  const tabs = [
    { 
      id: 'executadas', 
      label: 'Executadas',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22,4 12,14.01 9,11.01"></polyline>
        </svg>
      )
    },
    { 
      id: 'pendentes', 
      label: 'Pendentes',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12,6 12,12 16,14"></polyline>
        </svg>
      )
    },
    { 
      id: 'canceladas', 
      label: 'Canceladas',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      )
    },
    { 
      id: 'relatorio', 
      label: 'Relatório',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10,9 9,9 8,9"></polyline>
        </svg>
      )
    }
  ];

  // Filtrar transações usando dados reais
  const filteredTransactions = useMemo(() => {
    const periodFiltered = filterTransactionsByPeriod(transactions, selectedPeriod);
    
    switch (activeTab) {
      case 'executadas':
        return periodFiltered.filter(t => t.status === 'EXECUTADA');
      case 'pendentes':
        return periodFiltered.filter(t => t.status === 'PENDENTE');
      case 'canceladas':
        return periodFiltered.filter(t => t.status === 'CANCELADA');
      case 'relatorio':
        return periodFiltered; // Todos para relatório
      default:
        return periodFiltered;
    }
  }, [transactions, activeTab, selectedPeriod]);

  // Obter descrição do período atual
  const currentPeriodDescription = periodOptions.find(p => p.value === selectedPeriod)?.description || 'Período personalizado';

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'EXECUTADA': { class: 'badge-success', text: 'Executada' },
      'PENDENTE': { class: 'badge-warning', text: 'Pendente' },
      'CANCELADA': { class: 'badge-danger', text: 'Cancelada' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    return type === 'COMPRA' 
      ? <span className="badge badge-success direction-indicator long">COMPRA ↑</span>
      : <span className="badge badge-danger direction-indicator short">VENDA ↓</span>;
  };

  const renderTabContent = () => {
    if (filteredTransactions.length === 0) {
      const emptyMessages = {
        executadas: 'Nenhuma transação executada encontrada.',
        pendentes: 'Nenhuma transação pendente encontrada.',
        canceladas: 'Nenhuma transação cancelada encontrada.',
        relatorio: 'Nenhum relatório disponível.'
      };

      return (
        <div className="card">
          <h2>Transações {tabs.find(t => t.id === activeTab)?.label}</h2>
          <div style={{ 
            color: 'var(--text-secondary)', 
            textAlign: 'center', 
            padding: '40px 0' 
          }}>
            <p>{emptyMessages[activeTab as keyof typeof emptyMessages]}</p>
            {activeTab === 'executadas' && (
              <div className="empty-state-hint">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 12l2 2 4-4"></path>
                </svg>
                <p>As transações são criadas automaticamente quando você adiciona posições ou opções</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'relatorio') {
      return (
        <div className="card">
          <h2>Relatório de Transações - {currentPeriodDescription}</h2>
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>📊 Relatório detalhado será implementado</p>
            <p>Total de transações: {transactions.length}</p>
            <p>Transações executadas: {transactions.filter(t => t.status === 'EXECUTADA').length}</p>
            <p>Volume total: R$ {transactions.reduce((sum, t) => sum + t.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="card">
        <h2>Transações {tabs.find(t => t.id === activeTab)?.label} ({filteredTransactions.length}) - {currentPeriodDescription}</h2>
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
            'Status'
          ]}
          data={filteredTransactions.map(transaction => [
            <small key="id" style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
              {transaction.id}
            </small>,
            <small key="datetime">
              {formatDateTime(transaction.date)}
            </small>,
            <div key="contract">
              <strong>{transaction.contract}</strong>
              <br />
              <small style={{ color: 'var(--text-secondary)' }}>
                {transaction.contract.startsWith('BGI') ? 'Boi Gordo' : 'Milho'}
              </small>
            </div>,
            getTypeIcon(transaction.type),
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
            getStatusBadge(transaction.status)
          ])}
        />
      </div>
    );
  };

  // Cálculo de métricas para o resumo usando dados reais
  const executedTransactions = transactions.filter(t => t.status === 'EXECUTADA');
  const totalVolume = executedTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalFees = executedTransactions.reduce((sum, t) => sum + t.fees, 0);
  const buyTransactions = executedTransactions.filter(t => t.type === 'COMPRA').length;
  const sellTransactions = executedTransactions.filter(t => t.type === 'VENDA').length;

  return (
    <div>
      {/* Resumo de Transações */}
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

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TransactionTabType)}
      />

      {renderTabContent()}
    </div>
  );
}