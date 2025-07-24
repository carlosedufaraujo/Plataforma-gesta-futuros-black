'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { useHybridData } from '@/contexts/HybridDataContext';
import TabNavigation from '@/components/Common/TabNavigation';
import DataTable from '@/components/Common/DataTable';
import StatusBadge from '@/components/Common/StatusBadge';

type PerformanceTabType = 'overview' | 'detailed' | 'analysis';

interface PerformancePageProps {
  selectedPeriod: string;
}

export default function PerformancePage({ selectedPeriod }: PerformancePageProps) {
  const [activeTab, setActiveTab] = useState<PerformanceTabType>('overview');
  const { positions, transactions, options, currentUser } = useHybridData();

  const tabs = [
    { 
      id: 'overview', 
      label: 'Visão Geral',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"></path>
          <path d="M7 12l4-4 4 4 6-6"></path>
        </svg>
      )
    },
    { 
      id: 'assets', 
      label: 'Por Ativo',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      )
    },
    { 
      id: 'temporal', 
      label: 'Análise Temporal',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12,6 12,12 16,14"></polyline>
        </svg>
      )
    },
    { 
      id: 'risk', 
      label: 'Risco & Exposição',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      )
    },
    { 
      id: 'operational', 
      label: 'Operacional',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      )
    }
  ];

  // Calcular dados de performance baseados nos dados reais
  const performanceData = useMemo(() => {
    console.log('🔄 PERFORMANCE PAGE: Recalculando métricas - positions:', positions.length, 'transactions:', transactions.length);
    
    if (!positions.length && !transactions.length) {
      return {
        assetPerformance: [],
        monthlyPerformance: [],
        resultDistribution: [],
        riskExposure: [],
        cumulativePerformance: [],
        totalResult: 0,
        totalContracts: 0,
        winRate: 0,
        maxExposure: 0,
        roi: 0,
        avgHoldingDays: 0
      };
    }

    // Análise por ativo
    const assetStats = {};
    positions.forEach(position => {
      const asset = position.contract.startsWith('BGI') ? 'Boi Gordo' :
                   position.contract.startsWith('CCM') ? 'Milho' :
                   position.contract.startsWith('SFI') ? 'Soja' : 'Outros';

      if (!assetStats[asset]) {
        assetStats[asset] = {
          asset,
          contracts: 0,
          result: 0,
          exposure: 0,
          trades: 0,
          wins: 0
        };
      }

      assetStats[asset].contracts += position.quantity;
      assetStats[asset].exposure += position.entry_price * position.quantity * (position.contract.startsWith('BGI') ? 330 : 450);
      assetStats[asset].trades += 1;

      if (position.realized_pnl) {
        assetStats[asset].result += position.realized_pnl;
        if (position.realized_pnl > 0) {
          assetStats[asset].wins += 1;
        }
      }
      if (position.unrealized_pnl) {
        assetStats[asset].result += position.unrealized_pnl;
      }
    });

    const assetPerformance = Object.values(assetStats).map((asset: any) => ({
      ...asset,
      avgDays: 15, // Seria calculado baseado nas datas das posições
      winRate: asset.trades > 0 ? (asset.wins / asset.trades) * 100 : 0
    }));

    // Performance mensal baseada em transações
    const monthlyStats = {};
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const monthIndex = date.getMonth();
      const monthName = months[monthIndex];
      
      if (!monthlyStats[monthName]) {
        monthlyStats[monthName] = {
          month: monthName,
          result: 0,
          contracts: 0,
          exposure: 0,
          drawdown: 0
        };
      }
      
      monthlyStats[monthName].contracts += transaction.quantity;
      monthlyStats[monthName].exposure += transaction.total;
    });

    const monthlyPerformance = months.slice(0, 6).map(month => 
      monthlyStats[month] || { month, result: 0, contracts: 0, exposure: 0, drawdown: 0 }
    );

    // Métricas gerais
    const totalResult = positions.reduce((sum, pos) => {
      return sum + (pos.realized_pnl || 0) + (pos.unrealized_pnl || 0);
    }, 0);

    const totalContracts = positions.reduce((sum, pos) => sum + pos.quantity, 0);
    const winningPositions = positions.filter(pos => (pos.realized_pnl || 0) + (pos.unrealized_pnl || 0) > 0).length;
    const winRate = positions.length > 0 ? (winningPositions / positions.length) * 100 : 0;
    
    const maxExposure = Math.max(...positions.map(pos => 
      pos.entryPrice * pos.quantity * (pos.contract.startsWith('BGI') ? 330 : 450)
    ), 0);

    const initialCapital = 200000; // Deveria vir das configurações do usuário
    const roi = initialCapital > 0 ? (totalResult / initialCapital) * 100 : 0;

    return {
      assetPerformance,
      monthlyPerformance,
      resultDistribution: [
        { range: '< -50k', count: 0, color: '#dc2626' },
        { range: '-50k a -10k', count: 0, color: '#ea580c' },
        { range: '-10k a 0', count: 0, color: '#f59e0b' },
        { range: '0 a 10k', count: positions.length, color: '#84cc16' },
        { range: '10k a 50k', count: 0, color: '#22c55e' },
        { range: '> 50k', count: 0, color: '#16a34a' }
      ],
      riskExposure: monthlyPerformance,
      cumulativePerformance: monthlyPerformance.map((month, index) => ({
        date: `01/${String(index + 1).padStart(2, '0')}`,
        daily: month.result,
        cumulative: monthlyPerformance.slice(0, index + 1).reduce((sum, m) => sum + m.result, 0),
        benchmark: month.result * 0.6 // Benchmark simulado
      })),
      totalResult,
      totalContracts,
      winRate,
      maxExposure,
      roi,
      avgHoldingDays: 15 // Seria calculado baseado nas datas das posições
    };
  }, [positions, transactions, selectedPeriod]);

  // Estados vazios para quando não há dados
  const renderEmptyState = (title: string, description: string) => (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"></path>
          <path d="M7 12l4-4 4 4 6-6"></path>
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <button 
        className="btn btn-primary"
        onClick={() => {
          const event = new CustomEvent('openNewPositionModal');
          window.dispatchEvent(event);
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Nova Posição
      </button>
    </div>
  );

  const renderUserLoading = () => (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"></path>
          <path d="M7 12l4-4 4 4 6-6"></path>
        </svg>
      </div>
      <h3>Carregando Performance...</h3>
      <p>Aguarde enquanto carregamos seus dados.</p>
    </div>
  );

  const renderOverview = () => (
    <div className="performance-grid">
      {/* Métricas Principais */}
      <div className="performance-card overview-metrics">
        <h3>Métricas Principais</h3>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className={`metric-value ${performanceData.totalResult >= 0 ? 'positive' : 'negative'}`}>
              {performanceData.totalResult >= 0 ? '+' : ''}
              {Math.abs(performanceData.totalResult).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="metric-label">Resultado Total</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{performanceData.totalContracts}</div>
            <div className="metric-label">Total de Contratos</div>
          </div>
          <div className="metric-item">
            <div className={`metric-value ${performanceData.winRate >= 50 ? 'positive' : 'negative'}`}>
              {performanceData.winRate.toFixed(0)}%
            </div>
            <div className="metric-label">Win Rate</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">
              {performanceData.maxExposure.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="metric-label">Exposição Máxima</div>
          </div>
          <div className="metric-item">
            <div className={`metric-value ${performanceData.roi >= 0 ? 'positive' : 'negative'}`}>
              {performanceData.roi >= 0 ? '+' : ''}{performanceData.roi.toFixed(1)}%
            </div>
            <div className="metric-label">ROI Período</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">{performanceData.avgHoldingDays} dias</div>
            <div className="metric-label">Holding Médio</div>
          </div>
        </div>
      </div>

      {/* Performance Acumulada */}
      <div className="performance-card cumulative-performance">
        <h3>Performance Acumulada</h3>
        <div className="performance-chart">
          <p>Gráfico de performance acumulada seria renderizado aqui</p>
          <div className="chart-placeholder">
            <div className="placeholder-text">
              {performanceData.cumulativePerformance.length > 0 
                ? `${performanceData.cumulativePerformance.length} pontos de dados` 
                : 'Sem dados suficientes'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssets = () => (
    <div className="performance-grid">
      <div className="performance-card asset-breakdown">
        <h3>Performance por Ativo</h3>
        {performanceData.assetPerformance.length > 0 ? (
          <div className="asset-performance-list">
            {performanceData.assetPerformance.map((asset, index) => (
              <div key={index} className="asset-performance-item">
                <div className="asset-info">
                  <div className="asset-name">{asset.asset}</div>
                  <div className="asset-stats">
                    {asset.contracts} contratos • Win Rate: {asset.winRate.toFixed(1)}%
                  </div>
                </div>
                <div className="asset-result">
                  <div className={`asset-pnl ${asset.result >= 0 ? 'positive' : 'negative'}`}>
                    {asset.result >= 0 ? '+' : ''}
                    {Math.abs(asset.result).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className="asset-exposure">
                    Exposição: {asset.exposure.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-small">
            <p>Sem dados de ativos para exibir</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTemporal = () => (
    <div className="performance-grid">
      <div className="performance-card temporal-analysis">
        <h3>Análise Temporal</h3>
        {performanceData.monthlyPerformance.length > 0 ? (
          <div className="temporal-chart">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Resultado</th>
                  <th>Contratos</th>
                  <th>Exposição</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.monthlyPerformance.map((month, index) => (
                  <tr key={index}>
                    <td><strong>{month.month}</strong></td>
                    <td className={month.result >= 0 ? 'positive' : 'negative'}>
                      {month.result >= 0 ? '+' : ''}
                      {Math.abs(month.result).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td>{month.contracts}</td>
                    <td>{month.exposure.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-small">
            <p>Sem dados temporais para exibir</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderRisk = () => (
    <div className="performance-grid">
      <div className="performance-card risk-analysis">
        <h3>Análise de Risco</h3>
        <div className="risk-metrics">
          <div className="risk-metric">
            <div className="risk-label">Exposição Máxima</div>
            <div className="risk-value">
              {performanceData.maxExposure.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
          <div className="risk-metric">
            <div className="risk-label">Posições Ativas</div>
            <div className="risk-value">
              {positions.filter(p => (p.status === 'EXECUTADA' || p.status === 'EM_ABERTO')).length}
            </div>
          </div>
          <div className="risk-metric">
            <div className="risk-label">Diversificação</div>
            <div className="risk-value">
              {performanceData.assetPerformance.length} ativos
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOperational = () => (
    <div className="performance-grid">
      <div className="performance-card operational-stats">
        <h3>Estatísticas Operacionais</h3>
        <div className="operational-grid">
          <div className="operational-item">
            <div className="operational-icon">📈</div>
            <div className="operational-data">
              <div className="operational-value">
                {positions.filter(pos => (pos.realized_pnl || 0) + (pos.unrealized_pnl || 0) > 0).length}
              </div>
              <div className="operational-label">Trades Vencedores</div>
            </div>
          </div>
          <div className="operational-item">
            <div className="operational-icon">📉</div>
            <div className="operational-data">
              <div className="operational-value">
                {positions.filter(pos => (pos.realized_pnl || 0) + (pos.unrealized_pnl || 0) < 0).length}
              </div>
              <div className="operational-label">Trades Perdedores</div>
            </div>
          </div>
          <div className="operational-item">
            <div className="operational-icon">💰</div>
            <div className="operational-data">
              <div className="operational-value">
                {positions.length > 0 
                  ? (performanceData.totalResult / positions.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : 'R$ 0,00'
                }
              </div>
              <div className="operational-label">Resultado Médio</div>
            </div>
          </div>
          <div className="operational-item">
            <div className="operational-icon">⏱️</div>
            <div className="operational-data">
              <div className="operational-value">{performanceData.avgHoldingDays}</div>
              <div className="operational-label">Dias Médios</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Sempre mostrar a interface com navegação
  return (
    <div className="performance-page">
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as PerformanceTabType)}
      />

      <div className="performance-content">
        {!currentUser ? (
          renderUserLoading()
        ) : positions.length === 0 && transactions.length === 0 ? (
          renderEmptyState('Sem dados de performance', 'Cadastre algumas posições para ver análises de performance aqui.')
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'assets' && renderAssets()}
            {activeTab === 'temporal' && renderTemporal()}
            {activeTab === 'risk' && renderRisk()}
            {activeTab === 'operational' && renderOperational()}
          </>
        )}
      </div>
    </div>
  );
} 