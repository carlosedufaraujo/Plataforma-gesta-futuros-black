'use client';

import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Brokerage } from '@/types';

export default function BrokerageSelector() {
  const { currentSession, setSelectedBrokerage } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  // Dados simulados das transações por corretora (deveria vir do contexto)
  const transactionsByBrokerage = {
    'brok001': {
      lastTransaction: { date: '2025-01-20T16:42:15Z', type: 'VENDA', contract: 'CCMJ25' },
      thisMonth: 12
    },
    'brok002': {
      lastTransaction: { date: '2025-01-20T11:28:30Z', type: 'COMPRA', contract: 'BGIK25' },
      thisMonth: 8
    },
    'brok003': {
      lastTransaction: { date: '2025-01-19T15:35:45Z', type: 'EXERCICIO', contract: 'OPT BGI M400' },
      thisMonth: 5
    }
  };

  const handleBrokerageSelect = (brokerage: Brokerage) => {
    setSelectedBrokerage(brokerage);
    setIsOpen(false);
  };

  const formatLastUpdate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffMinutes / 1440);
    
    // Formato de tempo relativo
    let relativeTime = '';
    if (diffMinutes < 1) relativeTime = 'agora';
    else if (diffMinutes < 60) relativeTime = `${diffMinutes}min`;
    else if (diffHours < 24) relativeTime = `${diffHours}h`;
    else relativeTime = `${diffDays}d`;
    
    // Formato de data/hora absoluta para tooltip
    const absoluteTime = date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return { relativeTime, absoluteTime };
  };

  const getTransactionTypeLabel = (type: string) => {
    const types = {
      'COMPRA': '🟢 COMPRA',
      'VENDA': '🔴 VENDA', 
      'EXERCICIO': '⚡ EXERCÍCIO',
      'VENCIMENTO': '📅 VENCIMENTO'
    };
    return types[type] || type;
  };

  const getBrokerageTransactionInfo = (brokerageId: string) => {
    return transactionsByBrokerage[brokerageId];
  };

  if (!currentSession.selectedBrokerage) {
    return (
      <div className="sidebar-stats">
        <div className="stat-item">
          <span className="stat-label">Usuário:</span>
          <span className="stat-value">{currentSession.user.nome}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Corretora:</span>
          <span className="stat-value negative">Não selecionada</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Atualização:</span>
          <span className="stat-value">-</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-stats">
      <div className="stat-item">
        <span className="stat-label">Usuário:</span>
        <span className="stat-value">{currentSession.user.nome}</span>
      </div>
      
      <div className="stat-item brokerage-selector">
        <span className="stat-label">Corretora:</span>
        <div className={`stat-dropdown ${isOpen ? 'open' : ''}`}>
          <button 
            className="stat-value clickable"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Selecionar corretora"
          >
            {currentSession.selectedBrokerage.nome}
            <svg 
              className={`dropdown-icon ${isOpen ? 'rotated' : ''}`} 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>
          
          {isOpen && (
            <div className="dropdown-menu">
              {currentSession.availableBrokerages.map((brokerage) => {
                const transactionInfo = getBrokerageTransactionInfo(brokerage.id);
                return (
                  <button
                    key={brokerage.id}
                    className={`dropdown-item ${
                      brokerage.id === currentSession.selectedBrokerage?.id ? 'active' : ''
                    }`}
                    onClick={() => handleBrokerageSelect(brokerage)}
                  >
                    <div className="brokerage-info">
                      <span className="brokerage-name">{brokerage.nome}</span>
                      <span className="brokerage-assessor">{brokerage.assessor}</span>
                    </div>
                    <div className="brokerage-costs">
                      <span>Milho: R$ {brokerage.corretagemMilho.toFixed(2)}</span>
                      <span>Boi: R$ {brokerage.corretagemBoi.toFixed(2)}</span>
                    </div>
                    {transactionInfo && (
                      <div className="brokerage-last-transaction">
                        <div className="last-transaction-header">
                          <span className="last-transaction-label">Última transação:</span>
                          <span className="last-transaction-time">
                            {formatLastUpdate(transactionInfo.lastTransaction.date).relativeTime}
                          </span>
                        </div>
                        <div className="last-transaction-details">
                          <span className="transaction-type-mini">
                            {getTransactionTypeLabel(transactionInfo.lastTransaction.type)}
                          </span>
                          <span className="transaction-contract-mini">
                            {transactionInfo.lastTransaction.contract}
                          </span>
                        </div>
                        <div className="month-stats">
                          <span className="month-count">
                            {transactionInfo.thisMonth} trades este mês
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <div className="stat-item">
        <span className="stat-label">Atualização:</span>
        <div className="stat-value-container">
          {currentSession.lastTransaction ? (
            <>
              <span 
                className="stat-value update-time"
                title={`Última transação em ${currentSession.selectedBrokerage?.nome}:\n${formatLastUpdate(currentSession.lastTransaction.date).absoluteTime}\n${getTransactionTypeLabel(currentSession.lastTransaction.type)} ${currentSession.lastTransaction.contract}`}
              >
                {formatLastUpdate(currentSession.lastTransaction.date).relativeTime}
              </span>
              <div className="transaction-details">
                <span className="transaction-type">
                  {getTransactionTypeLabel(currentSession.lastTransaction.type)}
                </span>
                <span className="transaction-contract">
                  {currentSession.lastTransaction.contract}
                </span>
                <span className="transaction-time">
                  {formatLastUpdate(currentSession.lastTransaction.date).absoluteTime.split(' ')[1]}
                </span>
              </div>
            </>
          ) : (
            <span className="stat-value no-transactions">
              Sem transações
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 