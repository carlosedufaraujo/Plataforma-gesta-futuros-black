'use client';

import { NetPositionSummary } from '@/types';

interface NetPositionSummaryProps {
  summary: NetPositionSummary;
  userCapital?: number;
}

export default function NetPositionSummaryComponent({ 
  summary, 
  userCapital = 100000 
}: NetPositionSummaryProps) {
  const totalPnL = summary.total_unrealized_pnl + summary.total_realized_pnl;
  const totalPnLPercentage = summary.total_net_exposure > 0 
    ? (totalPnL / summary.total_net_exposure) * 100 
    : 0;

  const exposureVsCapital = summary.total_net_exposure > 0 
    ? (summary.total_net_exposure / userCapital) * 100 
    : 0;

  // Formatação brasileira para valores monetários  
  const formatBrazilianCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).replace(/\./g, ',').replace(/,(\d{2})$/, '.$1')}`;
  };

  return (
    <div className="card">
      <h2>Resumo das Posições NET</h2>
      <p style={{ 
        color: 'var(--text-secondary)', 
        marginBottom: '20px', 
        fontSize: '14px' 
      }}>
        Sistema brasileiro com preço médio ponderado e ajuste diário
      </p>

      {/* Grid de Summary Cards - SEGUINDO PADRÃO ORIGINAL */}
      <div className="position-summary-grid" style={{ marginBottom: '20px' }}>
        {/* Card Posições NET */}
        <div className="summary-card">
          <div className="summary-card-header">
            <h3 className="summary-card-title">Posições NET</h3>
            <span className="badge badge-info">{summary.total_net_positions} ativas</span>
          </div>
          <div className="summary-metrics">
            <div className="summary-metric">
              <span className="summary-metric-label">Exposição Total</span>
              <span className="summary-metric-value">
                {formatBrazilianCurrency(summary.total_net_exposure)}
              </span>
            </div>
            <div className="summary-metric">
              <span className="summary-metric-label">P&L Não Realizado</span>
              <span className={`summary-metric-value ${summary.total_unrealized_pnl >= 0 ? 'positive' : 'negative'}`}>
                {summary.total_unrealized_pnl >= 0 ? '+' : ''}{formatBrazilianCurrency(Math.abs(summary.total_unrealized_pnl))}
              </span>
            </div>
            <div className="summary-metric">
              <span className="summary-metric-label">P&L Total</span>
              <span className={`summary-metric-value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
                {totalPnL >= 0 ? '+' : ''}{formatBrazilianCurrency(Math.abs(totalPnL))}
              </span>
            </div>
          </div>
        </div>

        {/* Cards por Contrato - SEGUINDO PADRÃO ORIGINAL */}
        {summary.net_positions.map(position => (
          <div key={position.contract} className="summary-card">
            <div className="summary-card-header">
              <h3 className="summary-card-title">{position.contract}</h3>
              <span className={`badge ${
                position.net_direction === 'LONG' 
                  ? 'badge-success direction-indicator long' 
                  : position.net_direction === 'SHORT'
                  ? 'badge-danger direction-indicator short'
                  : 'badge-info'
              }`}>
                {position.net_direction}
              </span>
            </div>
            <div className="summary-metrics">
              <div className="summary-metric">
                <span className="summary-metric-label">Quantidade</span>
                <span className="summary-metric-value">{Math.abs(position.net_quantity)} contratos</span>
              </div>
              <div className="summary-metric">
                <span className="summary-metric-label">Preço Médio</span>
                <span className="summary-metric-value">R$ {position.average_price.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="summary-metric">
                <span className="summary-metric-label">Exposição</span>
                <span className="summary-metric-value">{formatBrazilianCurrency(position.net_exposure)}</span>
              </div>
              <div className="summary-metric">
                <span className="summary-metric-label">P&L Não Real.</span>
                <span className={`summary-metric-value ${position.unrealized_pnl >= 0 ? 'positive' : 'negative'}`}>
                  {position.unrealized_pnl >= 0 ? '+' : ''}R$ {Math.abs(position.unrealized_pnl).toLocaleString('pt-BR', { 
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Card Resumo Geral - SEGUINDO PADRÃO ORIGINAL */}
        <div className="summary-card">
          <div className="summary-card-header">
            <h3 className="summary-card-title">Sistema NET Brasileiro</h3>
            <span className="badge badge-info">Ativo</span>
          </div>
          <div className="summary-metrics">
            <div className="summary-metric">
              <span className="summary-metric-label">Capital Disponível</span>
              <span className="summary-metric-value">{formatBrazilianCurrency(userCapital)}</span>
            </div>
            <div className="summary-metric">
              <span className="summary-metric-label">Exposição vs Capital</span>
              <span className={`summary-metric-value ${exposureVsCapital > 100 ? 'negative' : 'positive'}`}>
                {exposureVsCapital >= 0 ? '+' : ''}{exposureVsCapital.toFixed(2)}%
              </span>
            </div>
            <div className="summary-metric">
              <span className="summary-metric-label">Eficiência NET</span>
              <span className={`summary-metric-value ${totalPnLPercentage >= 0 ? 'positive' : 'negative'}`}>
                {totalPnLPercentage >= 0 ? '+' : ''}{totalPnLPercentage.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 