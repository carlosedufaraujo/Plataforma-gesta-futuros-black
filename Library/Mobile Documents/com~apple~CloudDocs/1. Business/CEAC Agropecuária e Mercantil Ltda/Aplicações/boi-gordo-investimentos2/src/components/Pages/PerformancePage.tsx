'use client';

import { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter
} from 'recharts';

interface PerformancePageProps {
  selectedPeriod: string;
}

export default function PerformancePage({ selectedPeriod }: PerformancePageProps) {
  const [activeSection, setActiveSection] = useState('overview');

  // Dados simulados de performance baseados em negócios liquidados reais
  const performanceData = useMemo(() => {
    const baseData = {
      // Performance por ativo
      assetPerformance: [
        { asset: 'Milho', contracts: 450, result: 125400, exposure: 850000, avgDays: 12, winRate: 68 },
        { asset: 'Soja', contracts: 380, result: -15600, exposure: 920000, avgDays: 18, winRate: 42 },
        { asset: 'Opções Milho', contracts: 220, result: 58200, exposure: 340000, avgDays: 8, winRate: 73 },
        { asset: 'Opções Soja', contracts: 150, result: 32800, exposure: 280000, avgDays: 6, winRate: 80 }
      ],

      // Performance temporal mensal
      monthlyPerformance: [
        { month: 'Jan', result: 45200, contracts: 450, exposure: 1200000, drawdown: -8500 },
        { month: 'Fev', result: -12800, contracts: 380, exposure: 1350000, drawdown: -35600 },
        { month: 'Mar', result: 78400, contracts: 590, exposure: 1180000, drawdown: -2100 },
        { month: 'Abr', result: 62100, contracts: 520, exposure: 1420000, drawdown: -15200 },
        { month: 'Mai', result: -18900, contracts: 340, exposure: 980000, drawdown: -28800 },
        { month: 'Jun', result: 85600, contracts: 720, exposure: 1580000, drawdown: -5400 }
      ],

      // Análise de distribuição de resultados
      resultDistribution: [
        { range: '< -50k', count: 3, color: '#dc2626' },
        { range: '-50k a -10k', count: 8, color: '#ea580c' },
        { range: '-10k a 0', count: 15, color: '#f59e0b' },
        { range: '0 a 10k', count: 35, color: '#84cc16' },
        { range: '10k a 50k', count: 28, color: '#22c55e' },
        { range: '> 50k', count: 11, color: '#16a34a' }
      ],

      // Análise de risco por exposição
      riskExposure: [
        { date: '2024-01', exposure: 1200000, result: 45200, vol: 0.12 },
        { date: '2024-02', exposure: 1350000, result: -12800, vol: 0.18 },
        { date: '2024-03', exposure: 1180000, result: 78400, vol: 0.09 },
        { date: '2024-04', exposure: 1420000, result: 62100, vol: 0.14 },
        { date: '2024-05', exposure: 980000, result: -18900, vol: 0.16 },
        { date: '2024-06', exposure: 1580000, result: 85600, vol: 0.11 }
      ],

      // Performance acumulada
      cumulativePerformance: [
        { date: '01/01', daily: 0, cumulative: 0, benchmark: 0 },
        { date: '15/01', daily: 22400, cumulative: 22400, benchmark: 8500 },
        { date: '01/02', daily: 22800, cumulative: 45200, benchmark: 15200 },
        { date: '15/02', daily: -35600, cumulative: 9600, benchmark: 18900 },
        { date: '01/03', daily: 22800, cumulative: 32400, benchmark: 24100 },
        { date: '15/03', daily: 46000, cumulative: 78400, benchmark: 32800 },
        { date: '01/04', daily: -16300, cumulative: 62100, benchmark: 38200 },
        { date: '15/04', daily: 0, cumulative: 62100, benchmark: 42500 },
        { date: '01/05', daily: -18900, cumulative: 43200, benchmark: 45800 },
        { date: '15/05', daily: 0, cumulative: 43200, benchmark: 48200 },
        { date: '01/06', daily: 42400, cumulative: 85600, benchmark: 52100 },
        { date: '15/06', daily: 43200, cumulative: 128800, benchmark: 58400 }
      ]
    };

    return baseData;
  }, [selectedPeriod]);

  const sections = [
    { id: 'overview', label: 'Visão Geral', icon: '' },
    { id: 'assets', label: 'Por Ativo', icon: '' },
    { id: 'temporal', label: 'Análise Temporal', icon: '' },
    { id: 'risk', label: 'Risco & Exposição', icon: '' },
    { id: 'operational', label: 'Operacional', icon: '' }
  ];

  const renderOverview = () => (
    <div className="performance-grid">
      {/* Métricas Principais */}
      <div className="performance-card overview-metrics">
        <h3>Métricas Principais</h3>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-value positive">R$ 200.800</div>
            <div className="metric-label">Resultado Total</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">120</div>
            <div className="metric-label">Total de Contratos</div>
          </div>
          <div className="metric-item">
            <div className="metric-value positive">64%</div>
            <div className="metric-label">Win Rate</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">R$ 1.420.000</div>
            <div className="metric-label">Exposição Máxima</div>
          </div>
          <div className="metric-item">
            <div className="metric-value positive">14,1%</div>
            <div className="metric-label">ROI Período</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">11,2 dias</div>
            <div className="metric-label">Holding Médio</div>
          </div>
        </div>
      </div>

      {/* Performance Acumulada */}
      <div className="performance-card cumulative-chart">
        <h3>Performance Acumulada vs Benchmark</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData.cumulativePerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }} 
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="cumulative" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Performance"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="benchmark" 
              stroke="#6b7280" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Benchmark CDI"
              dot={{ fill: '#6b7280', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distribuição de Resultados */}
      <div className="performance-card distribution-chart">
        <h3>Distribuição de Resultados por Trade</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData.resultDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="range" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }} 
            />
            <Bar dataKey="count" name="Número de Trades">
              {performanceData.resultDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderAssets = () => (
    <div className="performance-grid">
      {/* Performance por Ativo - Barras */}
      <div className="performance-card asset-performance">
        <h3>Resultado por Ativo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData.assetPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="asset" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
              formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Resultado']}
            />
            <Bar 
              dataKey="result" 
              name="Resultado (R$)"
              fill="#3b82f6"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Win Rate por Ativo */}
      <div className="performance-card winrate-chart">
        <h3>Win Rate por Ativo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData.assetPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="asset" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
              formatter={(value) => [`${value}%`, 'Win Rate']}
            />
            <Bar 
              dataKey="winRate" 
              name="Win Rate (%)"
              fill="#10b981"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela Detalhada */}
      <div className="performance-card asset-table full-width">
        <h3>Análise Detalhada por Ativo</h3>
        <div className="asset-table-container">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Ativo</th>
                <th>Contratos</th>
                <th>Resultado</th>
                <th>Exposição Média</th>
                <th>Tempo Médio</th>
                <th>Win Rate</th>
                <th>Profit Factor</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.assetPerformance.map((asset, index) => (
                <tr key={index}>
                  <td className="asset-name">{asset.asset}</td>
                  <td>{asset.contracts}</td>
                  <td className={asset.result >= 0 ? 'positive' : 'negative'}>
                    R$ {asset.result.toLocaleString('pt-BR')}
                  </td>
                  <td>R$ {asset.exposure.toLocaleString('pt-BR')}</td>
                  <td>{asset.avgDays} dias</td>
                  <td className={asset.winRate >= 60 ? 'positive' : asset.winRate >= 40 ? 'neutral' : 'negative'}>
                    {asset.winRate}%
                  </td>
                  <td className="positive">
                    {(1.2 + Math.random() * 0.8).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTemporal = () => (
    <div className="performance-grid">
      {/* Performance Mensal */}
      <div className="performance-card monthly-performance">
        <h3>Performance Mensal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={performanceData.monthlyPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="month" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
              formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Resultado']}
            />
            <Area 
              type="monotone" 
              dataKey="result" 
              stroke="#3b82f6" 
              fill="rgba(59, 130, 246, 0.3)"
              name="Resultado Mensal"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Volume de Contratos */}
      <div className="performance-card contracts-volume">
        <h3>Volume de Contratos por Mês</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData.monthlyPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="month" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
            />
            <Bar 
              dataKey="contracts" 
              name="Número de Contratos"
              fill="#8b5cf6"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Drawdown Analysis */}
      <div className="performance-card drawdown-chart">
        <h3>Análise de Drawdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={performanceData.monthlyPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="month" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
              formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Drawdown']}
            />
            <Area 
              type="monotone" 
              dataKey="drawdown" 
              stroke="#ef4444" 
              fill="rgba(239, 68, 68, 0.3)"
              name="Drawdown"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderRisk = () => (
    <div className="performance-grid">
      {/* Risco vs Retorno */}
      <div className="performance-card risk-return">
        <h3>Risco vs Retorno por Período</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart data={performanceData.riskExposure}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis 
              dataKey="vol" 
              stroke="var(--text-secondary)"
              name="Volatilidade"
              type="number"
              domain={[0, 0.2]}
            />
            <YAxis 
              dataKey="result" 
              stroke="var(--text-secondary)"
              name="Retorno"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
              formatter={(value, name) => [
                name === 'result' ? `R$ ${Number(value).toLocaleString('pt-BR')}` : `${(Number(value) * 100).toFixed(1)}%`,
                name === 'result' ? 'Retorno' : 'Volatilidade'
              ]}
            />
            <Scatter 
              name="Períodos" 
              dataKey="result" 
              fill="#3b82f6"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Exposição ao Risco */}
      <div className="performance-card exposure-chart">
        <h3>Evolução da Exposição</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData.riskExposure}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" stroke="var(--text-secondary)" />
            <YAxis stroke="var(--text-secondary)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
              formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Exposição']}
            />
            <Line 
              type="monotone" 
              dataKey="exposure" 
              stroke="#f59e0b" 
              strokeWidth={3}
              name="Exposição Máxima"
              dot={{ fill: '#f59e0b', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Métricas de Risco */}
      <div className="performance-card risk-metrics">
        <h3>Métricas de Risco</h3>
        <div className="risk-metrics-grid">
          <div className="risk-metric">
            <div className="risk-value">-35.600</div>
            <div className="risk-label">Drawdown Máximo</div>
            <div className="risk-period">Fevereiro 2024</div>
          </div>
          <div className="risk-metric">
            <div className="risk-value">0.87</div>
            <div className="risk-label">Sharpe Ratio</div>
            <div className="risk-period">Últimos 6 meses</div>
          </div>
          <div className="risk-metric">
            <div className="risk-value">12.4%</div>
            <div className="risk-label">Volatilidade Média</div>
            <div className="risk-period">Base anualizada</div>
          </div>
          <div className="risk-metric">
            <div className="risk-value">-28.500</div>
            <div className="risk-label">VaR 95%</div>
            <div className="risk-period">Perda máxima esperada</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOperational = () => (
    <div className="performance-grid">
      {/* Estatísticas Operacionais */}
      <div className="performance-card operational-stats">
        <h3>Estatísticas Operacionais</h3>
        <div className="operational-grid">
          <div className="operational-item">
            <div className="operational-icon"></div>
            <div className="operational-data">
              <div className="operational-value">76</div>
              <div className="operational-label">Trades Vencedores</div>
            </div>
          </div>
          <div className="operational-item">
            <div className="operational-icon">📉</div>
            <div className="operational-data">
              <div className="operational-value">44</div>
              <div className="operational-label">Trades Perdedores</div>
            </div>
          </div>
          <div className="operational-item">
            <div className="operational-icon">💰</div>
            <div className="operational-data">
              <div className="operational-value">R$ 5.420</div>
              <div className="operational-label">Ganho Médio</div>
            </div>
          </div>
          <div className="operational-item">
            <div className="operational-icon">💸</div>
            <div className="operational-data">
              <div className="operational-value">R$ 3.180</div>
              <div className="operational-label">Perda Média</div>
            </div>
          </div>
          <div className="operational-item">
            <div className="operational-icon"></div>
            <div className="operational-data">
              <div className="operational-value">1.71</div>
              <div className="operational-label">Profit Factor</div>
            </div>
          </div>
          <div className="operational-item">
            <div className="operational-icon"></div>
            <div className="operational-data">
              <div className="operational-value">11.2 dias</div>
              <div className="operational-label">Holding Médio</div>
            </div>
          </div>
        </div>
      </div>

      {/* Análise de Custos */}
      <div className="performance-card costs-analysis">
        <h3>Análise de Custos</h3>
        <div className="costs-breakdown">
          <div className="cost-item">
            <span className="cost-label">Corretagem Total</span>
            <span className="cost-value">R$ 12.840</span>
          </div>
          <div className="cost-item">
            <span className="cost-label">Taxas B3</span>
            <span className="cost-value">R$ 3.280</span>
          </div>
          <div className="cost-item">
            <span className="cost-label">Impostos</span>
            <span className="cost-value">R$ 8.920</span>
          </div>
          <div className="cost-item total">
            <span className="cost-label">Total de Custos</span>
            <span className="cost-value">R$ 25.040</span>
          </div>
        </div>
        <div className="cost-impact">
          <div className="impact-metric">
            <div className="impact-label">Impacto na Performance</div>
            <div className="impact-value negative">-11.1%</div>
          </div>
          <div className="impact-metric">
            <div className="impact-label">Resultado Bruto</div>
            <div className="impact-value">R$ 225.840</div>
          </div>
        </div>
      </div>

      {/* Top Trades */}
      <div className="performance-card top-trades">
        <h3>Melhores e Piores Trades</h3>
        <div className="trades-lists">
          <div className="best-trades">
            <h4>Melhores Trades</h4>
            <div className="trade-list">
              <div className="trade-item">
                <span className="trade-asset">BGIM25</span>
                <span className="trade-result positive">+R$ 18.500</span>
              </div>
              <div className="trade-item">
                <span className="trade-asset">CCMJ25</span>
                <span className="trade-result positive">+R$ 15.200</span>
              </div>
              <div className="trade-item">
                <span className="trade-asset">OPT BGI</span>
                <span className="trade-result positive">+R$ 12.800</span>
              </div>
            </div>
          </div>
          <div className="worst-trades">
            <h4>Piores Trades</h4>
            <div className="trade-list">
              <div className="trade-item">
                <span className="trade-asset">CCMK25</span>
                <span className="trade-result negative">-R$ 22.100</span>
              </div>
              <div className="trade-item">
                <span className="trade-asset">BGIQ25</span>
                <span className="trade-result negative">-R$ 18.900</span>
              </div>
              <div className="trade-item">
                <span className="trade-asset">OPT CCM</span>
                <span className="trade-result negative">-R$ 11.400</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverview();
      case 'assets': return renderAssets();
      case 'temporal': return renderTemporal();
      case 'risk': return renderRisk();
      case 'operational': return renderOperational();
      default: return renderOverview();
    }
  };

  return (
    <div className="performance-page">
      {/* Navigation */}
      <div className="performance-nav">
        {sections.map(section => (
          <button
            key={section.id}
            className={`performance-nav-btn ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="nav-icon">{section.icon}</span>
            <span className="nav-label">{section.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="performance-content">
        {renderContent()}
      </div>
    </div>
  );
} 