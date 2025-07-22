'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { useData } from '@/contexts/DataContext';
import { useUser } from '@/contexts/UserContext';

interface RentabilidadePageProps {
  selectedPeriod?: string;
}

export default function RentabilidadePage({ selectedPeriod = '30d' }: RentabilidadePageProps) {
  const capitalChartRef = useRef<HTMLCanvasElement>(null);
  const plByContractChartRef = useRef<HTMLCanvasElement>(null);
  const { positions, transactions, options } = useData();
  const { currentSession } = useUser();

  // Calcular dados reais baseados nas posições e transações
  const portfolioData = useMemo(() => {
    if (!currentSession.user) {
      return {
        totalValue: 0,
        dailyPnL: 0,
        totalPnL: 0,
        totalPnLPercentage: 0,
        initialCapital: 0,
        currentCapital: 0
      };
    }

    // Capital inicial do usuário
    const initialCapital = 200000; // Pode vir das configurações do usuário
    
    // Calcular P&L realizado das transações
    const realizedPnL = transactions.reduce((total, transaction) => {
      // Lógica para calcular P&L realizado baseado nas transações
      return total;
    }, 0);

    // Calcular P&L não realizado das posições abertas
    const unrealizedPnL = positions
      .filter(pos => pos.status === 'OPEN')
      .reduce((total, position) => {
        if (position.unrealized_pnl) {
          return total + position.unrealized_pnl;
        }
        return total;
      }, 0);

    const totalPnL = realizedPnL + unrealizedPnL;
    const currentCapital = initialCapital + totalPnL;
    const totalPnLPercentage = initialCapital > 0 ? (totalPnL / initialCapital) * 100 : 0;

    // P&L diário (últimas 24h) - seria melhor vir do backend
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyPnL = transactions
      .filter(t => new Date(t.createdAt) >= today)
      .reduce((total, transaction) => {
        // Calcular P&L das transações do dia
        return total;
      }, 0);

    return {
      totalValue: currentCapital,
      dailyPnL,
      totalPnL,
      totalPnLPercentage,
      initialCapital,
      currentCapital
    };
  }, [positions, transactions, currentSession.user]);

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
  if (!currentSession.user) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <h3>Carregando Dashboard...</h3>
        <p>Aguarde enquanto carregamos seus dados.</p>
      </div>
    );
  }

  // Estado sem dados
  if (positions.length === 0 && transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📈</div>
        <h3>Bem-vindo ao seu Dashboard!</h3>
        <p>Comece cadastrando sua primeira posição para ver as análises aqui.</p>
        <button 
          className="btn btn-primary"
          onClick={() => {
            const event = new CustomEvent('openNewPositionModal');
            window.dispatchEvent(event);
          }}
        >
          + Nova Posição
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
          <div className="metric-value">{positions.filter(p => p.status === 'OPEN').length}</div>
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