'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Target } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useHybridData } from '@/contexts/HybridDataContext';
import { Chart, registerables } from 'chart.js';

// Registrar componentes do Chart.js
Chart.register(...registerables);

interface RentabilidadePageProps {
  selectedPeriod: string;
}

export default function RentabilidadePage({ selectedPeriod }: RentabilidadePageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed'>('overview');
  
  const { positions, transactions, options, currentUser } = useHybridData();
  
  // Referencias para os gráficos
  const capitalChartRef = useRef<HTMLCanvasElement>(null);
  const plByContractChartRef = useRef<HTMLCanvasElement>(null);

  // Calcular dados reais baseados nas posições e transações
  const portfolioData = useMemo(() => {
    console.log('🔄 RENTABILIDADE PAGE: Recalculando portfolio - positions:', positions.length, 'transactions:', transactions.length);
    
    if (!currentUser) {
      return {
        totalValue: 0,
        dailyPnL: 0,
        totalPnL: 0,
        totalPnLPercentage: 0,
        initialCapital: 0,
        totalInvested: 0,
        totalRealized: 0,
        openPositionsValue: 0,
        closedPositionsValue: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        bestTrade: 0,
        worstTrade: 0,
        totalTrades: 0,
        profitableTrades: 0,
        losingTrades: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        roi: 0
      };
    }

    // Filtrar posições do usuário atual
    const userPositions = positions.filter(p => p.user_id === currentUser.id);
    const userTransactions = transactions.filter(t => t.userId === currentUser.id);

    // Calcular métricas básicas
    const openPositions = userPositions.filter(p => p.status === 'EXECUTADA' || p.status === 'EM_ABERTO');
    const closedPositions = userPositions.filter(p => p.status === 'FECHADA');

    const totalInvested = userTransactions
      .filter(t => t.type === 'COMPRA')
      .reduce((sum, t) => sum + t.total, 0);

    const totalRealized = closedPositions
      .reduce((sum, p) => sum + (p.realized_pnl || 0), 0);

    const openPositionsValue = openPositions
      .reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);

    const totalPnL = totalRealized + openPositionsValue;
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    // Calcular win rate
    const profitableTrades = closedPositions.filter(p => (p.realized_pnl || 0) > 0).length;
    const losingTrades = closedPositions.filter(p => (p.realized_pnl || 0) < 0).length;
    const totalTrades = closedPositions.length;
    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

    // Calcular médias
    const wins = closedPositions.filter(p => (p.realized_pnl || 0) > 0);
    const losses = closedPositions.filter(p => (p.realized_pnl || 0) < 0);
    
    const avgWin = wins.length > 0 ? wins.reduce((sum, p) => sum + (p.realized_pnl || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, p) => sum + (p.realized_pnl || 0), 0) / losses.length : 0;

    // Melhor e pior trade
    const pnls = closedPositions.map(p => p.realized_pnl || 0);
    const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
    const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;

    return {
      totalValue: totalInvested + totalPnL,
      dailyPnL: 0, // Implementar cálculo diário
      totalPnL,
      totalPnLPercentage,
      initialCapital: totalInvested,
      totalInvested,
      totalRealized,
      openPositionsValue,
      closedPositionsValue: totalRealized,
      winRate,
      avgWin,
      avgLoss,
      bestTrade,
      worstTrade,
      totalTrades,
      profitableTrades,
      losingTrades,
      sharpeRatio: 0, // Implementar cálculo Sharpe
      maxDrawdown: 0, // Implementar cálculo drawdown
      roi: totalPnLPercentage
    };
  }, [positions, transactions, currentUser]);

  // Dados mensais baseados em transações reais
  const monthlyData = useMemo(() => {
    if (!transactions.length) {
      return [
        { month: 'Jan', pnl: 0, contracts: 0, winRate: 0 },
        { month: 'Fev', pnl: 0, contracts: 0, winRate: 0 },
        { month: 'Mar', pnl: 0, contracts: 0, winRate: 0 },
        { month: 'Abr', pnl: 0, contracts: 0, winRate: 0 },
        { month: 'Mai', pnl: 0, contracts: 0, winRate: 0 },
        { month: 'Jun', pnl: 0, contracts: 0, winRate: 0 },
        { month: 'Jul', pnl: 0, contracts: 0, winRate: 0 }
      ];
    }

    // Agrupar transações por mês
    const monthlyStats = {};
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const monthIndex = date.getMonth();
      const monthName = months[monthIndex];
      
      if (!monthlyStats[monthName]) {
        monthlyStats[monthName] = {
          month: monthName,
          pnl: 0,
          contracts: 0,
          wins: 0,
          total: 0
        };
      }
      
      monthlyStats[monthName].contracts += transaction.quantity;
      monthlyStats[monthName].total += 1;
      
      // Simplificação: considerar transações de venda como realizações de P&L
      if (transaction.type === 'VENDA') {
        // Aqui seria necessário calcular o P&L real comparando com a compra
        // Por ora, usar uma aproximação
        monthlyStats[monthName].pnl += transaction.total * 0.05; // 5% de exemplo
        if (transaction.total > 0) {
          monthlyStats[monthName].wins += 1;
        }
      }
    });

    return months.map(month => {
      const data = monthlyStats[month] || { month, pnl: 0, contracts: 0, wins: 0, total: 1 };
      return {
        ...data,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0
      };
    }).slice(0, 7); // Primeiros 7 meses
  }, [transactions]);

  // Dados de P&L por contrato baseados em posições reais
  const plByContractData = useMemo(() => {
    if (!positions.length) {
      return {
        labels: ['Sem Dados'],
        data: [0]
      };
    }

    const contractStats = {};
    
    positions.forEach(position => {
      // Extrair símbolo do contrato (BGI, CCM, etc.)
      const contractSymbol = position.contract.substring(0, 3);
      
      if (!contractStats[contractSymbol]) {
        contractStats[contractSymbol] = 0;
      }
      
      // Somar P&L realizado e não realizado
      if (position.realized_pnl) {
        contractStats[contractSymbol] += position.realized_pnl;
      }
      if (position.unrealized_pnl) {
        contractStats[contractSymbol] += position.unrealized_pnl;
      }
    });

    const labels = Object.keys(contractStats);
    const data = Object.values(contractStats);

    return { labels, data };
  }, [positions]);

  const getChartColors = () => {
    const styles = getComputedStyle(document.documentElement);
    return {
      textColor: styles.getPropertyValue('--text-secondary').trim(),
      gridColor: styles.getPropertyValue('--border-color').trim(),
      positiveColor: styles.getPropertyValue('--color-positive').trim(),
      negativeColor: styles.getPropertyValue('--color-negative').trim(),
      infoColor: styles.getPropertyValue('--color-info').trim(),
      bgPrimary: styles.getPropertyValue('--bg-primary').trim()
    };
  };

  useEffect(() => {
    let capitalChart: Chart | null = null;
    let plByContractChart: Chart | null = null;

    const colors = getChartColors();

    // Gráfico Evolução do Capital
    if (capitalChartRef.current) {
      const ctx = capitalChartRef.current.getContext('2d');
      if (ctx) {
        // Dados baseados no histórico real - por ora simulado
        const evolutionData = monthlyData.map((month, index) => {
          const accumulated = monthlyData.slice(0, index + 1).reduce((sum, m) => sum + m.pnl, 0);
          return portfolioData.initialCapital + accumulated;
        });

        capitalChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: monthlyData.map(m => m.month),
            datasets: [{
              label: 'Capital',
              data: evolutionData,
              borderColor: colors.infoColor,
              backgroundColor: colors.infoColor + '20',
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: colors.bgPrimary,
                borderColor: colors.gridColor,
                borderWidth: 1,
                titleColor: colors.textColor,
                bodyColor: colors.textColor,
                padding: 12,
                displayColors: false,
                callbacks: {
                  label: function(context) {
                    const value = context.raw as number;
                    return 'Capital: ' + value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  }
                }
              }
            },
            scales: {
              x: {
                ticks: { color: colors.textColor },
                grid: { color: colors.gridColor }
              },
              y: {
                ticks: { 
                  color: colors.textColor,
                  callback: function(value) {
                    return (value as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  }
                },
                grid: { color: colors.gridColor }
              }
            }
          }
        });
      }
    }

    // Gráfico P&L por Contrato
    if (plByContractChartRef.current && plByContractData.labels.length > 0) {
      const ctx = plByContractChartRef.current.getContext('2d');
      if (ctx) {
        plByContractChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: plByContractData.labels,
            datasets: [{
              label: 'P&L',
              data: plByContractData.data,
              backgroundColor: function(context) {
                const value = context.raw as number;
                return value >= 0 ? colors.positiveColor : colors.negativeColor;
              },
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: colors.bgPrimary,
                borderColor: colors.gridColor,
                borderWidth: 1,
                titleColor: colors.textColor,
                bodyColor: colors.textColor,
                padding: 12,
                displayColors: false,
                callbacks: {
                  label: function(context) {
                    const value = context.raw as number;
                    const prefix = value >= 0 ? '+' : '';
                    return 'P&L: ' + prefix + Math.abs(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  }
                }
              }
            },
            scales: {
              x: {
                ticks: { color: colors.textColor },
                grid: { color: colors.gridColor }
              },
              y: {
                ticks: { 
                  color: colors.textColor,
                  callback: function(value) {
                    return (value as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  }
                },
                grid: { color: colors.gridColor }
              }
            }
          }
        });
      }
    }

    // Cleanup
    return () => {
      if (capitalChart) capitalChart.destroy();
      if (plByContractChart) plByContractChart.destroy();
    };
  }, [monthlyData, plByContractData, portfolioData, selectedPeriod]);

  // Estado vazio quando não há dados
  if (!currentUser) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18"></path>
            <path d="M7 12l4-4 4 4 6-6"></path>
          </svg>
        </div>
        <h3>Carregando Dashboard...</h3>
        <p>Aguarde enquanto carregamos seus dados.</p>
      </div>
    );
  }

  // Estado sem dados
  if (positions.length === 0 && transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18"></path>
            <path d="M7 12l4-4 4 4 6-6"></path>
          </svg>
        </div>
        <h3>Bem-vindo ao seu Dashboard!</h3>
        <p>Comece cadastrando sua primeira posição para ver as análises aqui.</p>
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
  }

  return (
    <div>
      {/* Métricas Principais */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">P&L Total</div>
          <div className={`metric-value ${portfolioData.totalPnL >= 0 ? 'positive' : 'negative'}`}>
            {portfolioData.totalPnL >= 0 ? '+' : ''}
            {Math.abs(portfolioData.totalPnL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className={`metric-change ${portfolioData.totalPnLPercentage >= 0 ? 'positive' : 'negative'}`}>
            {portfolioData.totalPnLPercentage >= 0 ? '+' : ''}
            {portfolioData.totalPnLPercentage.toFixed(2)}%
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">P&L Diário</div>
          <div className={`metric-value ${portfolioData.dailyPnL >= 0 ? 'positive' : 'negative'}`}>
            {portfolioData.dailyPnL >= 0 ? '+' : ''}
            {Math.abs(portfolioData.dailyPnL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className={`metric-change ${portfolioData.dailyPnL >= 0 ? 'positive' : 'negative'}`}>
            {portfolioData.totalValue > 0 ? ((portfolioData.dailyPnL / portfolioData.totalValue) * 100).toFixed(2) : '0.00'}%
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Valor Total da Carteira</div>
          <div className="metric-value">
            {portfolioData.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className="metric-change neutral">
            Inicial: {portfolioData.initialCapital.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Posições Ativas</div>
          <div className="metric-value">{positions.filter(p => (p.status === 'EXECUTADA' || p.status === 'EM_ABERTO')).length}</div>
          <div className="metric-change neutral">
            {positions.length} total
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="chart-grid">
        <div className="card">
          <h2>Evolução do Capital</h2>
          <div className="chart-container">
            <canvas ref={capitalChartRef}></canvas>
          </div>
        </div>
        <div className="card">
          <h2>P&L por Contrato</h2>
          <div className="chart-container">
            <canvas ref={plByContractChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Tabela Resumo Mensal */}
      <div className="card">
        <h2>Resumo Financeiro por Mês</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th>P&L</th>
              <th>Contratos</th>
              <th>Taxa de Acerto</th>
              <th>Variação</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((month, index) => {
              const prevMonth = index > 0 ? monthlyData[index - 1] : null;
              const variation = prevMonth && prevMonth.pnl !== 0 
                ? ((month.pnl - prevMonth.pnl) / Math.abs(prevMonth.pnl)) * 100 
                : 0;
              
              return (
                <tr key={month.month}>
                  <td><strong>{month.month}</strong></td>
                  <td className={month.pnl >= 0 ? 'positive' : 'negative'}>
                    {month.pnl >= 0 ? '+' : ''}
                    {Math.abs(month.pnl).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td>{month.contracts}</td>
                  <td>{month.winRate.toFixed(1)}%</td>
                  <td className={
                    index === 0 ? 'neutral' : 
                    variation > 0 ? 'positive' : 
                    variation < 0 ? 'negative' : 'neutral'
                  }>
                    {index === 0 ? '-' : 
                     variation > 0 ? `↗${Math.abs(variation).toFixed(1)}%` :
                     variation < 0 ? `↘${Math.abs(variation).toFixed(1)}%` : 
                     '→0.0%'
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 