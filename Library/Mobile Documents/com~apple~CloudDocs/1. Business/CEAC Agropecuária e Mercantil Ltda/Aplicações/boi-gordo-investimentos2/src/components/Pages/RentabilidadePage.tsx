'use client';

import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

interface RentabilidadePageProps {
  selectedPeriod?: string;
}

export default function RentabilidadePage({ selectedPeriod = '30d' }: RentabilidadePageProps) {
  const capitalChartRef = useRef<HTMLCanvasElement>(null);
  const plByContractChartRef = useRef<HTMLCanvasElement>(null);
  const [portfolioData] = useState({
    totalValue: 245780,
    dailyPnL: 3280,
    totalPnL: 45780,
    totalPnLPercentage: 22.89
  });
  
  const [monthlyData] = useState([
    { month: 'Jan', pnl: 45780, contracts: 450, winRate: 73.3 }, // 450 contratos negociados (compra + venda)
    { month: 'Fev', pnl: 38200, contracts: 320, winRate: 66.7 }, // 320 contratos negociados
    { month: 'Mar', pnl: 52800, contracts: 580, winRate: 77.8 }, // 580 contratos negociados  
    { month: 'Abr', pnl: 41500, contracts: 375, winRate: 63.6 }, // 375 contratos negociados
    { month: 'Mai', pnl: 58000, contracts: 620, winRate: 80.0 }, // 620 contratos negociados
    { month: 'Jun', pnl: 62000, contracts: 680, winRate: 72.7 }, // 680 contratos negociados
    { month: 'Jul', pnl: 45780, contracts: 420, winRate: 75.0 }  // 420 contratos negociados
  ]);



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
    const colors = getChartColors();
    let capitalChart: Chart | null = null;
    let plByContractChart: Chart | null = null;

    // Gráfico de Evolução do Capital
    if (capitalChartRef.current) {
      const ctx = capitalChartRef.current.getContext('2d');
      if (ctx) {
        capitalChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
            datasets: [{
              label: 'Capital Total',
              data: [200000, 195500, 203700, 208900, 218000, 235000, 245780],
              borderColor: colors.infoColor,
              backgroundColor: colors.infoColor + '20',
              tension: 0.4,
              fill: true,
              pointRadius: 5,
              pointHoverRadius: 7
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
                    return 'Capital: ' + context.parsed.y.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: colors.textColor }
              },
              y: {
                grid: { 
                  color: colors.gridColor + '80',
                  drawBorder: false
                },
                ticks: {
                  color: colors.textColor,
                  callback: function(value) {
                    return 'R$ ' + ((value as number) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + 'k';
                  }
                }
              }
            }
          }
        });
      }
    }

    // Gráfico P&L por Contrato
    if (plByContractChartRef.current) {
      const ctx = plByContractChartRef.current.getContext('2d');
      if (ctx) {
        plByContractChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['BGI', 'CCM', 'ICF', 'DOL', 'IND'],
            datasets: [{
              label: 'P&L',
              data: [18500, 12300, -4200, 8900, 10280],
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
                grid: { display: false },
                ticks: { color: colors.textColor }
              },
              y: {
                grid: { 
                  color: colors.gridColor + '80',
                  drawBorder: false
                },
                ticks: {
                  color: colors.textColor,
                  callback: function(value) {
                    const prefix = (value as number) >= 0 ? '+' : '';
                    return prefix + 'R$ ' + Math.abs((value as number) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + 'k';
                  }
                }
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
  }, [selectedPeriod]); // Recarregar gráficos quando período mudar

  return (
    <div>
      {/* Métricas Principais */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">P&L Total</div>
          <div className={`metric-value ${portfolioData.totalPnL >= 0 ? 'positive' : 'negative'}`}>
            {portfolioData.totalPnL >= 0 ? '+' : ''}{Math.abs(portfolioData.totalPnL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className={`metric-change ${portfolioData.totalPnLPercentage >= 0 ? 'positive' : 'negative'}`}>
            {portfolioData.totalPnLPercentage >= 0 ? '+' : ''}{portfolioData.totalPnLPercentage.toFixed(2)}%
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">P&L Diário</div>
          <div className={`metric-value ${portfolioData.dailyPnL >= 0 ? 'positive' : 'negative'}`}>
            {portfolioData.dailyPnL >= 0 ? '+' : ''}{Math.abs(portfolioData.dailyPnL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div className={`metric-change ${portfolioData.dailyPnL >= 0 ? 'positive' : 'negative'}`}>
            {((portfolioData.dailyPnL / portfolioData.totalValue) * 100).toFixed(2)}%
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Valor Total da Carteira</div>
          <div className="metric-value">{portfolioData.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          <div className="metric-change neutral">Inicial: R$ 200.000</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Capital Investido</div>
          <div className="metric-value">R$ 250.000</div>
          <div className="metric-change neutral">Inicial: R$ 200.000</div>
        </div>
      </div>

      {/* Gráficos lado a lado - Layout original */}
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

      {/* Resumo Financeiro por Mês */}
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
            {monthlyData.map((month, index) => (
              <tr key={month.month}>
                <td><strong>{month.month}</strong></td>
                <td className={month.pnl >= 0 ? 'positive' : 'negative'}>
                  {month.pnl >= 0 ? '+' : ''}{Math.abs(month.pnl).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td>{month.contracts}</td>
                <td>{month.winRate}%</td>
                <td className={index > 0 && month.pnl > monthlyData[index-1].pnl ? 'positive' : index > 0 ? 'negative' : 'neutral'}>
                  {index > 0 ? (
                    <>
                      {month.pnl > monthlyData[index-1].pnl ? '↗' : '↘'} 
                      {Math.abs(((month.pnl - monthlyData[index-1].pnl) / monthlyData[index-1].pnl * 100)).toFixed(1)}%
                    </>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 