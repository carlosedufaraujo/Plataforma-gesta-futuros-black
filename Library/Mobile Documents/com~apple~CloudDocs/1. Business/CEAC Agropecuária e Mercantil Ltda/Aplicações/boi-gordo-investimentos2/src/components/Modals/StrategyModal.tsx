'use client';

import { useState, useEffect } from 'react';
import { Option } from '@/types';
import { useExpirations } from '@/hooks/useExpirations';

interface StrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (options: Omit<Option, 'id' | 'user_id' | 'contract_id'>[]) => void;
}

export default function StrategyModal({ isOpen, onClose, onSubmit }: StrategyModalProps) {
  const { activeExpirations } = useExpirations();
  
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [formData, setFormData] = useState({
    contractType: 'BGI',
    expiration: '',
    currentPrice: '340',
    investment: '10000',
    riskProfile: 'MEDIUM'
  });

  // Definir estratégias disponíveis
  const strategies = {
    'protective-put': {
      name: '🛡️ Protective Put',
      description: 'Proteção contra quedas mantendo ações',
      category: 'Proteção',
      risk: 'BAIXO',
      positions: [
        { type: 'PUT', action: 'BUY', strike_offset: -20, premium_estimate: 15 }
      ]
    },
    'covered-call': {
      name: '📈 Covered Call',
      description: 'Gerar renda vendendo calls sobre ações',
      category: 'Renda',
      risk: 'BAIXO',
      positions: [
        { type: 'CALL', action: 'SELL', strike_offset: 20, premium_estimate: 8 }
      ]
    },
    'long-straddle': {
      name: '🚀 Long Straddle',
      description: 'Lucrar com alta volatilidade em qualquer direção',
      category: 'Volátil',
      risk: 'ALTO',
      positions: [
        { type: 'CALL', action: 'BUY', strike_offset: 0, premium_estimate: 12 },
        { type: 'PUT', action: 'BUY', strike_offset: 0, premium_estimate: 10 }
      ]
    },
    'long-strangle': {
      name: '⚡ Long Strangle',
      description: 'Movimento forte com custo menor que straddle',
      category: 'Volátil',
      risk: 'ALTO',
      positions: [
        { type: 'CALL', action: 'BUY', strike_offset: 20, premium_estimate: 8 },
        { type: 'PUT', action: 'BUY', strike_offset: -20, premium_estimate: 6 }
      ]
    },
    'bull-call-spread': {
      name: '🐂 Bull Call Spread',
      description: 'Lucrar com alta moderada limitando risco',
      category: 'Direcional',
      risk: 'MEDIUM',
      positions: [
        { type: 'CALL', action: 'BUY', strike_offset: 0, premium_estimate: 12 },
        { type: 'CALL', action: 'SELL', strike_offset: 20, premium_estimate: 8 }
      ]
    },
    'bear-put-spread': {
      name: '🐻 Bear Put Spread',
      description: 'Lucrar com queda moderada limitando risco',
      category: 'Direcional',
      risk: 'MEDIUM',
      positions: [
        { type: 'PUT', action: 'BUY', strike_offset: 0, premium_estimate: 10 },
        { type: 'PUT', action: 'SELL', strike_offset: -20, premium_estimate: 6 }
      ]
    },
    'iron-condor': {
      name: '🦅 Iron Condor',
      description: 'Lucrar com baixa volatilidade (trading lateral)',
      category: 'Neutro',
      risk: 'MEDIUM',
      positions: [
        { type: 'CALL', action: 'SELL', strike_offset: 10, premium_estimate: 6 },
        { type: 'CALL', action: 'BUY', strike_offset: 30, premium_estimate: 3 },
        { type: 'PUT', action: 'SELL', strike_offset: -10, premium_estimate: 5 },
        { type: 'PUT', action: 'BUY', strike_offset: -30, premium_estimate: 2 }
      ]
    },
    'collar': {
      name: '🔒 Collar',
      description: 'Proteção barata vendendo upside',
      category: 'Proteção',
      risk: 'BAIXO',
      positions: [
        { type: 'PUT', action: 'BUY', strike_offset: -20, premium_estimate: 12 },
        { type: 'CALL', action: 'SELL', strike_offset: 20, premium_estimate: 8 }
      ]
    }
  };

  // Definir primeiro vencimento ativo como padrão
  useEffect(() => {
    if (activeExpirations.length > 0 && !formData.expiration) {
      setFormData(prev => ({ ...prev, expiration: activeExpirations[0].code }));
    }
  }, [activeExpirations, formData.expiration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStrategy || !formData.currentPrice) {
      alert('Por favor, selecione uma estratégia e preencha o preço atual.');
      return;
    }

    const strategy = strategies[selectedStrategy as keyof typeof strategies];
    const currentPrice = parseFloat(formData.currentPrice);
    const expiration = activeExpirations.find(exp => exp.code === formData.expiration);
    
    // Construir código completo do contrato
    const contractCode = `${formData.contractType}${formData.expiration}${expiration?.year.slice(-2) || '25'}`;
    
    // Calcular data de expiração
    const expirationDate = expiration ? 
      new Date(parseInt(expiration.year), expiration.monthNumber - 1, 30).toISOString() :
      new Date().toISOString();

    // Calcular quantidade baseada no investimento
    const totalPremium = strategy.positions.reduce((sum, pos) => {
      return sum + (pos.action === 'BUY' ? pos.premium_estimate : -pos.premium_estimate);
    }, 0);
    
    const baseQuantity = totalPremium > 0 ? 
      Math.floor(parseFloat(formData.investment) / (totalPremium * 100)) : 1;
    
    const quantity = Math.max(1, Math.min(baseQuantity, 10)); // Entre 1 e 10 contratos

    // Criar opções da estratégia
    const strategyOptions: Omit<Option, 'id' | 'user_id' | 'contract_id'>[] = strategy.positions.map((position, index) => {
      const strikePrice = currentPrice + position.strike_offset;
      
      return {
        option_type: position.type as 'CALL' | 'PUT',
        strike_price: strikePrice,
        premium: position.premium_estimate,
        quantity: quantity,
        expiration_date: expirationDate,
        is_purchased: position.action === 'BUY',
        status: 'OPEN',
        delta: position.type === 'CALL' ? 0.5 : -0.5,
        symbol: contractCode,
        name: `${position.type} ${contractCode} ${strikePrice} (${strategy.name})`
      };
    });

    onSubmit(strategyOptions);
    onClose();
    
    // Reset form
    setSelectedStrategy('');
    setFormData({
      contractType: 'BGI',
      expiration: activeExpirations.length > 0 ? activeExpirations[0].code : '',
      currentPrice: '340',
      investment: '10000',
      riskProfile: 'MEDIUM'
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'BAIXO': return 'var(--color-success)';
      case 'MEDIUM': return 'var(--color-warning)';
      case 'ALTO': return 'var(--color-negative)';
      default: return 'var(--color-info)';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Proteção': return '#10b981';
      case 'Renda': return '#3b82f6';
      case 'Volátil': return '#f59e0b';
      case 'Direcional': return '#8b5cf6';
      case 'Neutro': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal strategy-modal">
        <div className="modal-header">
          <h3>🎯 Criar Estratégia de Opções</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Configurações Base */}
            <div className="strategy-config-section">
              <h4>📋 Configuração Base</h4>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Ativo Base</label>
                  <select 
                    className="form-select"
                    value={formData.contractType}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractType: e.target.value }))}
                  >
                    <option value="BGI">BGI - Boi Gordo</option>
                    <option value="CCM">CCM - Milho</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Vencimento</label>
                  <select 
                    className="form-select"
                    value={formData.expiration}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiration: e.target.value }))}
                    disabled={activeExpirations.length === 0}
                  >
                    <option value="">Selecione um vencimento</option>
                    {activeExpirations.length === 0 ? (
                      <option value="" disabled>Nenhum vencimento ativo - Configure em Configurações</option>
                    ) : (
                      activeExpirations.map(exp => (
                        <option key={exp.id} value={exp.code}>
                          {exp.code} - {exp.month}/{exp.year}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Preço Atual do Ativo</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={formData.currentPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPrice: e.target.value }))}
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Investimento Alvo (R$)</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={formData.investment}
                    onChange={(e) => setFormData(prev => ({ ...prev, investment: e.target.value }))}
                    min="1000"
                    step="1000"
                  />
                </div>
              </div>
            </div>

            {/* Seleção de Estratégia */}
            <div className="strategy-selection-section">
              <h4>🎯 Escolha sua Estratégia</h4>
              
              <div className="strategies-grid">
                {Object.entries(strategies).map(([key, strategy]) => (
                  <div
                    key={key}
                    className={`strategy-card ${selectedStrategy === key ? 'selected' : ''}`}
                    onClick={() => setSelectedStrategy(key)}
                  >
                    <div className="strategy-header">
                      <h5>{strategy.name}</h5>
                      <div className="strategy-badges">
                        <span 
                          className="strategy-category-badge"
                          style={{ backgroundColor: getCategoryColor(strategy.category) }}
                        >
                          {strategy.category}
                        </span>
                        <span 
                          className="strategy-risk-badge"
                          style={{ color: getRiskColor(strategy.risk) }}
                        >
                          {strategy.risk}
                        </span>
                      </div>
                    </div>
                    
                    <p className="strategy-description">{strategy.description}</p>
                    
                    <div className="strategy-positions">
                      <div className="positions-label">Posições:</div>
                      {strategy.positions.map((pos, index) => (
                        <div key={index} className="position-item">
                          <span className={`position-action ${pos.action.toLowerCase()}`}>
                            {pos.action === 'BUY' ? '📈' : '📉'} {pos.action}
                          </span>
                          <span className="position-details">
                            {pos.type} Strike {pos.strike_offset > 0 ? '+' : ''}{pos.strike_offset}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview da Estratégia */}
            {selectedStrategy && (
              <div className="strategy-preview-section">
                <h4>👁️ Preview da Estratégia</h4>
                
                <div className="strategy-preview">
                  {strategies[selectedStrategy as keyof typeof strategies].positions.map((position, index) => {
                    const currentPrice = parseFloat(formData.currentPrice);
                    const strikePrice = currentPrice + position.strike_offset;
                    const totalPremium = strategies[selectedStrategy as keyof typeof strategies].positions.reduce((sum, pos) => {
                      return sum + (pos.action === 'BUY' ? pos.premium_estimate : -pos.premium_estimate);
                    }, 0);
                    const quantity = totalPremium > 0 ? 
                      Math.floor(parseFloat(formData.investment) / (totalPremium * 100)) : 1;
                    
                    return (
                      <div key={index} className="preview-position">
                        <div className="preview-position-header">
                          <span className={`preview-action ${position.action.toLowerCase()}`}>
                            {position.action === 'BUY' ? '🟢 COMPRAR' : '🔴 VENDER'}
                          </span>
                          <span className="preview-type">{position.type}</span>
                        </div>
                        <div className="preview-details">
                          <div>Strike: R$ {strikePrice.toFixed(2)}</div>
                          <div>Prêmio: R$ {position.premium_estimate.toFixed(2)}</div>
                          <div>Quantidade: {Math.max(1, Math.min(quantity, 10))}</div>
                          <div>Total: R$ {(position.premium_estimate * Math.max(1, Math.min(quantity, 10))).toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="strategy-summary">
                  <div className="summary-item">
                    <span>💰 Custo Total:</span>
                    <span>R$ {strategies[selectedStrategy as keyof typeof strategies].positions.reduce((sum, pos) => {
                      const totalPremium = strategies[selectedStrategy as keyof typeof strategies].positions.reduce((s, p) => {
                        return s + (p.action === 'BUY' ? p.premium_estimate : -p.premium_estimate);
                      }, 0);
                      const quantity = totalPremium > 0 ? 
                        Math.floor(parseFloat(formData.investment) / (totalPremium * 100)) : 1;
                      return sum + (pos.action === 'BUY' ? pos.premium_estimate * Math.max(1, Math.min(quantity, 10)) : -(pos.premium_estimate * Math.max(1, Math.min(quantity, 10))));
                    }, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!selectedStrategy}
              >
                Criar Estratégia
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 