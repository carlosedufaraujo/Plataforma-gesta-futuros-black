'use client';

import { useState, useMemo } from 'react';
import { OptionTabType } from '@/types';
import DataTable from '@/components/Common/DataTable';
import TabNavigation from '@/components/Common/TabNavigation';
import { useData } from '@/contexts/DataContext';
import StrategyModal from '@/components/Modals/StrategyModal';
import NewOptionModal from '@/components/Modals/NewOptionModal';
import { Option } from '@/types';

interface OpcoesPageProps {
  selectedPeriod: string;
}

export default function OpcoesPage({ selectedPeriod }: OpcoesPageProps) {
  const [activeTab, setActiveTab] = useState<OptionTabType>('ativas');
  const { options, addOption, addMultipleOptions, updateOption } = useData();
  const [showNewOptionModal, setShowNewOptionModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [editingOption, setEditingOption] = useState<Option | null>(null);

  // Handlers para modais
  const handleNewOption = (optionData: Omit<Option, 'id' | 'user_id' | 'contract_id'>) => {
    addOption(optionData);
    setShowNewOptionModal(false);
  };

  const handleNewStrategy = (optionsData: Omit<Option, 'id' | 'user_id' | 'contract_id'>[]) => {
    addMultipleOptions(optionsData);
    setShowStrategyModal(false);
  };

  const handleEditOption = (optionData: Omit<Option, 'id' | 'user_id' | 'contract_id'>) => {
    if (editingOption) {
      updateOption(editingOption.id, optionData);
      setEditingOption(null);
    }
    setShowNewOptionModal(false);
  };

  // Opções de período para descrição
  const periodOptions = [
    { value: '30d', label: '30 dias', description: 'Últimos 30 dias' },
    { value: '60d', label: '60 dias', description: 'Últimos 60 dias' },
    { value: '90d', label: '90 dias', description: 'Últimos 90 dias' },
    { value: '6m', label: '6 meses', description: 'Últimos 6 meses' },
    { value: '1y', label: '1 ano', description: 'Último ano' },
    { value: 'all', label: 'Todo período', description: 'Desde o início' }
  ];

  // Função para filtrar opções por período
  const filterOptionsByPeriod = (options: any[], period: string) => {
    if (period === 'all') return options;
    
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
        return options;
    }
    
    return options.filter(option => {
      // CORREÇÃO: Usar created_at ao invés de expiration_date
      const optionDate = new Date(option.created_at || option.expiration_date);
      return optionDate >= startDate;
    });
  };

  const tabs = [
    { 
      id: 'ativas', 
      label: 'Ativas',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      )
    },
    { 
      id: 'exercidas', 
      label: 'Exercidas',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22,4 12,14.01 9,11.01"></polyline>
        </svg>
      )
    },
    { 
      id: 'vencidas', 
      label: 'Vencidas',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      )
    },
    { 
      id: 'payoff', 
      label: 'Payoff',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"></path>
          <path d="M7 12l4-4 4 4 6-6"></path>
        </svg>
      )
    }
  ];

  // Filtrar opções usando dados reais
  const filteredOptions = useMemo(() => {
    const periodFiltered = filterOptionsByPeriod(options, selectedPeriod);
    
    switch (activeTab) {
      case 'ativas':
        return periodFiltered.filter(opt => opt.status === 'OPEN');
      case 'vencidas':
        return periodFiltered.filter(opt => opt.status === 'EXPIRED');
      case 'exercidas':
        return periodFiltered.filter(opt => opt.status === 'EXERCISED');
      default:
        return periodFiltered;
    }
  }, [options, activeTab, selectedPeriod]);

  // Obter descrição do período atual
  const currentPeriodDescription = periodOptions.find(p => p.value === selectedPeriod)?.description || 'Período personalizado';

  const renderTabContent = () => {
    if (filteredOptions.length === 0) {
      const emptyMessages = {
        ativas: 'Nenhuma opção ativa encontrada.',
        vencidas: 'Nenhuma opção vencida encontrada.',
        exercidas: 'Nenhuma opção exercida encontrada.',
        payoff: 'Nenhuma opção para análise de payoff.'
      };

      return (
        <div className="card">
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 16px' }}>
              <path d="M3 3v18h18"></path>
              <path d="M7 12l4-4 4 4 6-6"></path>
            </svg>
            <h3>{emptyMessages[activeTab as keyof typeof emptyMessages]}</h3>
            {activeTab === 'ativas' && (
              <div className="empty-state-hint">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 12l2 2 4-4"></path>
                </svg>
                <p>Clique em "Nova Opção" no cabeçalho para criar sua primeira opção</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'payoff') {
      const activeOptions = options.filter(opt => opt.status === 'OPEN');
      
      if (activeOptions.length === 0) {
        return (
          <div className="card">
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto 16px' }}>
                <path d="M3 3v18h18"></path>
                <path d="M7 12l4-4 4 4 6-6"></path>
              </svg>
              <h3>Nenhuma opção ativa para análise de payoff</h3>
              <div className="empty-state-hint">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 12l2 2 4-4"></path>
                </svg>
                <p>Clique em "Nova Opção" no cabeçalho para criar sua primeira opção</p>
              </div>
            </div>
          </div>
        );
      }

      // Cálculos de Payoff
      const calculatePayoff = (option: any, spotPrice: number) => {
        const { option_type, strike_price, premium, quantity, is_purchased } = option;
        
        let intrinsicValue = 0;
        if (option_type === 'CALL') {
          intrinsicValue = Math.max(0, spotPrice - strike_price);
        } else {
          intrinsicValue = Math.max(0, strike_price - spotPrice);
        }
        
        const totalIntrinsic = intrinsicValue * quantity;
        const premiumPaid = premium * quantity;
        
        let payoff = 0;
        if (is_purchased) {
          payoff = totalIntrinsic - premiumPaid;
        } else {
          payoff = premiumPaid - totalIntrinsic;
        }
        
        return {
          intrinsicValue: totalIntrinsic,
          premium: premiumPaid,
          payoff,
          breakeven: option_type === 'CALL' 
            ? (is_purchased ? strike_price + premium : strike_price - premium)
            : (is_purchased ? strike_price - premium : strike_price + premium)
        };
      };

      // Análise para diferentes preços spot
      const spotPrices = [];
      const minStrike = Math.min(...activeOptions.map(opt => opt.strike_price));
      const maxStrike = Math.max(...activeOptions.map(opt => opt.strike_price));
      const range = Math.max(50, (maxStrike - minStrike) * 0.5);
      const startPrice = Math.max(0, minStrike - range);
      const endPrice = maxStrike + range;
      
      for (let price = startPrice; price <= endPrice; price += 5) {
        spotPrices.push(price);
      }

      // Calcular payoff total da carteira
      const portfolioPayoffs = spotPrices.map(price => {
        const totalPayoff = activeOptions.reduce((sum, option) => {
          const { payoff } = calculatePayoff(option, price);
          return sum + payoff;
        }, 0);
        return { price, payoff: totalPayoff };
      });

      // Ponto de breakeven da carteira
      const breakevenPoint = portfolioPayoffs.find((point, index) => {
        if (index === 0) return false;
        const prev = portfolioPayoffs[index - 1];
        return (prev.payoff <= 0 && point.payoff > 0) || (prev.payoff > 0 && point.payoff <= 0);
      });

      // Máximo lucro e prejuízo
      const maxProfit = Math.max(...portfolioPayoffs.map(p => p.payoff));
      const maxLoss = Math.min(...portfolioPayoffs.map(p => p.payoff));

      // Investimento total
      const totalInvestment = activeOptions.reduce((sum, opt) => {
        return sum + (opt.is_purchased ? opt.premium * opt.quantity : 0);
      }, 0);

      const totalReceived = activeOptions.reduce((sum, opt) => {
        return sum + (!opt.is_purchased ? opt.premium * opt.quantity : 0);
      }, 0);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Resumo da Carteira */}
          <div className="card">
            <h2>Resumo da Carteira de Opções ({activeOptions.length} posições ativas)</h2>
            
            <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div className="metric-card">
                <div className="metric-label">Investimento Total</div>
                <div className="metric-value negative">R$ {totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="metric-change">Prêmios pagos</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Recebimento Total</div>
                <div className="metric-value positive">R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="metric-change">Prêmios recebidos</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Resultado Líquido</div>
                <div className={`metric-value ${(totalReceived - totalInvestment) >= 0 ? 'positive' : 'negative'}`}>
                  R$ {(totalReceived - totalInvestment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="metric-change">Recebido - Pago</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Máximo Lucro</div>
                <div className={`metric-value ${maxProfit >= 0 ? 'positive' : 'negative'}`}>
                  R$ {maxProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="metric-change">Cenário ótimo</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Máximo Prejuízo</div>
                <div className={`metric-value ${maxLoss >= 0 ? 'positive' : 'negative'}`}>
                  R$ {maxLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="metric-change">Cenário pessimista</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Breakeven</div>
                <div className="metric-value">
                  {breakevenPoint ? `R$ ${breakevenPoint.price.toFixed(2)}` : 'N/A'}
                </div>
                <div className="metric-change">Ponto de equilíbrio</div>
              </div>
            </div>
          </div>

          {/* Gráfico de Payoff */}
          <div className="card">
            <h3>Gráfico de Payoff da Carteira</h3>
            
            <div className="payoff-chart-container" style={{ 
              position: 'relative', 
              height: '400px', 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '20px',
              overflow: 'hidden'
            }}>
              {/* Eixos e Grid */}
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Grid horizontal */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-color)" strokeWidth="0.5" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Linha zero (breakeven) */}
                <line x1="60" y1="50%" x2="95%" y2="50%" stroke="var(--text-secondary)" strokeWidth="2" strokeDasharray="5,5" opacity="0.7"/>
                
                {/* Labels dos eixos */}
                <text x="50%" y="95%" textAnchor="middle" fill="var(--text-secondary)" fontSize="12">
                  Preço do Ativo (R$)
                </text>
                <text x="20" y="50%" textAnchor="middle" fill="var(--text-secondary)" fontSize="12" transform="rotate(-90, 20, 200)">
                  Payoff (R$)
                </text>
              </svg>
              
              {/* Curva de Payoff */}
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                <polyline
                  points={portfolioPayoffs.map((point, index) => {
                    const x = 60 + ((index / (portfolioPayoffs.length - 1)) * (95 - 60));
                    const maxAbs = Math.max(Math.abs(maxProfit), Math.abs(maxLoss));
                    const normalizedY = maxAbs > 0 ? (point.payoff / maxAbs) * 0.4 : 0;
                    const y = 50 - (normalizedY * 100);
                    return `${x}%,${y}%`;
                  }).join(' ')}
                  fill="none"
                  stroke="var(--color-info)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Pontos de interesse */}
                {breakevenPoint && (
                  <circle
                    cx={`${60 + ((portfolioPayoffs.indexOf(breakevenPoint) / (portfolioPayoffs.length - 1)) * (95 - 60))}%`}
                    cy="50%"
                    r="4"
                    fill="var(--color-warning)"
                    stroke="white"
                    strokeWidth="2"
                  />
                )}
              </svg>
              
              {/* Legendas dos valores */}
              <div style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <div>Min: R$ {startPrice.toFixed(0)} | Max: R$ {endPrice.toFixed(0)}</div>
                <div>Max Lucro: R$ {maxProfit.toFixed(2)} | Max Prejuízo: R$ {maxLoss.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Detalhes por Opção */}
          <div className="card">
            <h3>Análise Individual das Opções</h3>
            
            <div className="options-analysis-grid" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {activeOptions.map((option, index) => {
                const currentPrice = (minStrike + maxStrike) / 2; // Preço médio como referência
                const analysis = calculatePayoff(option, currentPrice);
                
                return (
                  <div key={option.id} className="option-analysis-card" style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-bright)' }}>
                        {option.name || `${option.option_type} ${option.strike_price}`}
                      </h4>
                      <span className={`badge ${option.option_type === 'CALL' ? 'badge-success' : 'badge-warning'}`}>
                        {option.option_type}
                      </span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Strike:</div>
                        <div style={{ fontWeight: 'bold' }}>R$ {option.strike_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Prêmio:</div>
                        <div style={{ fontWeight: 'bold' }}>R$ {option.premium.toFixed(2)}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Quantidade:</div>
                        <div style={{ fontWeight: 'bold' }}>{option.quantity}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Posição:</div>
                        <div style={{ fontWeight: 'bold', color: option.is_purchased ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                          {option.is_purchased ? 'Comprada' : 'Vendida'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Breakeven:</div>
                        <div style={{ fontWeight: 'bold', color: 'var(--color-warning)' }}>R$ {analysis.breakeven.toFixed(2)}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Vencimento:</div>
                        <div style={{ fontWeight: 'bold' }}>
                          {new Date(option.expiration_date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cenários de Preços */}
          <div className="card">
            <h3>Análise de Cenários</h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Preço do Ativo</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Payoff Total</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>% do Investimento</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Cenário</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioPayoffs.filter((_, index) => index % 4 === 0).slice(0, 10).map((point, index) => {
                    const percentage = totalInvestment > 0 ? (point.payoff / totalInvestment) * 100 : 0;
                    let scenario = 'Neutro';
                    if (point.payoff > totalInvestment * 0.1) scenario = 'Muito Bom';
                    else if (point.payoff > 0) scenario = 'Bom';
                    else if (point.payoff > -totalInvestment * 0.1) scenario = 'Ruim';
                    else scenario = 'Muito Ruim';
                    
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px', textAlign: 'center' }}>R$ {point.price.toFixed(2)}</td>
                        <td style={{ 
                          padding: '8px', 
                          textAlign: 'center',
                          color: point.payoff >= 0 ? 'var(--color-positive)' : 'var(--color-negative)',
                          fontWeight: 'bold'
                        }}>
                          R$ {point.payoff.toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: '8px', 
                          textAlign: 'center',
                          color: percentage >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'
                        }}>
                          {percentage.toFixed(1)}%
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <span className={`badge badge-${scenario.includes('Bom') ? 'success' : scenario.includes('Ruim') ? 'danger' : 'secondary'}`}>
                            {scenario}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="card">
        <DataTable
          headers={[
            'Símbolo',
            'Tipo',
            'Strike',
            'Prêmio',
            'Quantidade',
            'Vencimento',
            'Status',
            'P&L Atual'
          ]}
          data={filteredOptions.map(option => {
            const currentValue = activeTab === 'ativas' ? option.premium * 1.15 : 0; // Simulação
            const pnl = (currentValue - option.premium) * option.quantity;

            return [
              <div key="symbol">
                <strong>{option.symbol || option.name}</strong>
              </div>,
              <span 
                key="type" 
                className={`badge ${option.option_type === 'CALL' 
                  ? 'badge-success' : 'badge-warning'}`}
              >
                {option.option_type}
              </span>,
              option.strike_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
              option.premium.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
              option.quantity,
              new Date(option.expiration_date).toLocaleDateString('pt-BR'),
              <span key="status" className={`badge ${option.status === 'OPEN' 
                ? 'badge-success' : option.status === 'EXPIRED' 
                ? 'badge-danger' : 'badge-warning'}`}>
                {option.status === 'OPEN' ? 'Ativa' : 
                 option.status === 'EXPIRED' ? 'Vencida' : 'Exercida'}
              </span>,
              activeTab === 'ativas' ? (
                <span key="pnl" className={pnl >= 0 ? 'positive' : 'negative'}>
                  {pnl >= 0 ? '+' : ''}R$ {Math.abs(pnl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              ) : '-'
            ];
          })}
        />
      </div>
    );
  };

  // Cálculos de resumo usando dados reais
  const activeOptions = options.filter(opt => opt.status === 'OPEN');
  const totalPremiumPaid = activeOptions.reduce((sum, opt) => sum + (opt.premium * opt.quantity), 0);
  const totalCurrentValue = activeOptions.reduce((sum, opt) => sum + (opt.premium * opt.quantity * 1.15), 0); // Simulação
  const totalPnL = totalCurrentValue - totalPremiumPaid;
  const callOptions = activeOptions.filter(opt => opt.option_type === 'CALL').length;
  const putOptions = activeOptions.filter(opt => opt.option_type === 'PUT').length;

  return (
    <div>
      {/* Cabeçalho da Página */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text-bright)' }}>
            Opções de Futuros
          </h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Gerenciamento de opções e estratégias de investimento
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowStrategyModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            Estratégias
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewOptionModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nova Opção
          </button>
        </div>
      </div>

      {/* Resumo de Opções */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Prêmio Investido</div>
          <div className="metric-value">R$ {totalPremiumPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="metric-change">{activeOptions.length} opções ativas</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Valor Atual</div>
          <div className="metric-value">R$ {totalCurrentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="metric-change">Mark-to-market</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">P&L Total</div>
          <div className={`metric-value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
            {totalPnL >= 0 ? '+' : ''}R$ {Math.abs(totalPnL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className={`metric-change ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
            {totalPremiumPaid > 0 ? ((totalPnL / totalPremiumPaid) * 100).toFixed(1) : '0.0'}%
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Distribuição</div>
          <div className="metric-value">{callOptions}C / {putOptions}P</div>
          <div className="metric-change">Calls / Puts</div>
        </div>
      </div>

      {/* Navegação de Abas */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as OptionTabType)}
      />

      {/* Cabeçalho da Seção Ativa */}
      {filteredOptions.length > 0 && activeTab !== 'payoff' && (
        <div className="section-header-card">
          <div className="section-info">
            <h2 className="section-title">
              {tabs.find(t => t.id === activeTab)?.icon}
              Opções {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="section-subtitle">
              {filteredOptions.length} opção{filteredOptions.length !== 1 ? 'ões' : ''} • {currentPeriodDescription}
            </p>
          </div>
        </div>
      )}

      {renderTabContent()}
      
      {/* Modais */}
      <NewOptionModal
        isOpen={showNewOptionModal}
        onClose={() => {
          setShowNewOptionModal(false);
          setEditingOption(null);
        }}
        onSubmit={editingOption ? handleEditOption : handleNewOption}
        editingOption={editingOption}
      />
      
      <StrategyModal
        isOpen={showStrategyModal}
        onClose={() => setShowStrategyModal(false)}
        onSubmit={handleNewStrategy}
      />
    </div>
  );
} 