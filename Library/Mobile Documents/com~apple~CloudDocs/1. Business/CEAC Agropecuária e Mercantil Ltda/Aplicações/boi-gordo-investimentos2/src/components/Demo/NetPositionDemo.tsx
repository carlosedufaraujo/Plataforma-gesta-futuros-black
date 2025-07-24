'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useHybridData } from '@/contexts/HybridDataContext';

export default function NetPositionDemo() {
  const { positions } = useHybridData();
  const { netPositions, netStats, formatNetQuantity, getDirectionColor } = useNetPositions();

  return (
    <div className="net-position-demo">
      <div className="card">
        <h2>Demonstração da Lógica NET</h2>
        
        {/* Estatísticas Gerais */}
        <div className="net-stats">
          <h3>Estatísticas de Posições Líquidas</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total P&L Não Realizado</span>
              <span className={`stat-value ${netStats.totalUnrealizedPnL >= 0 ? 'positive' : 'negative'}`}>
                {netStats.totalUnrealizedPnL < 0 ? '-' : ''}R$ {Math.abs(netStats.totalUnrealizedPnL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Exposição Total</span>
              <span className="stat-value">
                R$ {netStats.totalExposure.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Posições LONG</span>
              <span className="stat-value positive">{netStats.longPositions}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Posições SHORT</span>
              <span className="stat-value negative">{netStats.shortPositions}</span>
            </div>
          </div>
        </div>

        {/* Posições Líquidas */}
        <div className="net-positions-list">
          <h3>Posições Líquidas por Contrato</h3>
          
          {netPositions.length > 0 ? (
            <div className="positions-table">
              {netPositions.map((netPos, index) => (
                <div key={netPos.contract} className="net-position-row">
                  <div className="position-header">
                    <div className="asset-info">
                      <strong>{netPos.contract}</strong>
                      <span className="product-name">{netPos.product}</span>
                    </div>
                    
                    <div className="net-direction" style={{ color: getDirectionColor(netPos.netDirection) }}>
                      {netPos.netDirection}
                    </div>
                  </div>
                  
                  <div className="position-details">
                    <div className="detail-item">
                      <span className="detail-label">Quantidade Líquida:</span>
                      <span 
                        className={`detail-value ${netPos.netQuantity < 0 ? 'negative' : 'positive'}`}
                        style={{ color: netPos.netQuantity < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}
                      >
                        {formatNetQuantity(netPos.netQuantity)}
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">LONG:</span>
                      <span className="detail-value positive">+{netPos.longQuantity}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">SHORT:</span>
                      <span className="detail-value negative">-{netPos.shortQuantity}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">P&L Não Realizado:</span>
                      <span className={`detail-value ${netPos.unrealizedPnL >= 0 ? 'positive' : 'negative'}`}>
                        {netPos.unrealizedPnL < 0 ? '-' : ''}R$ {Math.abs(netPos.unrealizedPnL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Exposição:</span>
                      <span className="detail-value">
                        R$ {netPos.exposure.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="individual-positions">
                    <h4>Posições Individuais ({netPos.positions.length})</h4>
                    {netPos.positions.map(pos => (
                      <div key={pos.id} className="individual-position">
                        <span className="position-id">{pos.id}</span>
                        <span className={`position-direction ${pos.direction.toLowerCase()}`}>
                          {pos.direction}
                        </span>
                        <span className="position-quantity">{pos.quantity}</span>
                        <span className="position-price">
                          R$ {pos.entry_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Nenhuma posição líquida encontrada</p>
            </div>
          )}
        </div>

        {/* Explicação da Lógica */}
        <div className="logic-explanation">
          <h3>Como Funciona a Lógica NET</h3>
          <div className="explanation-content">
            <div className="explanation-item">
              <strong>1. Agrupamento por Contrato:</strong>
              <p>Todas as posições do mesmo contrato são agrupadas (ex: BGIV25)</p>
            </div>
            
            <div className="explanation-item">
              <strong>2. Cálculo da Posição Líquida:</strong>
              <p>Quantidade NET = Quantidade LONG - Quantidade SHORT</p>
            </div>
            
            <div className="explanation-item">
              <strong>3. Determinação da Direção:</strong>
              <p>
                • Se NET > 0: Posição LONG<br/>
                • Se NET &lt; 0: Posição SHORT (quantidade com sinal negativo)<br/>
                • Se NET = 0: Posição NEUTRA (não aparece na lista)
              </p>
            </div>
            
            <div className="explanation-item">
              <strong>4. Cálculos Financeiros:</strong>
              <p>P&L e Exposição são calculados usando a quantidade absoluta da posição líquida</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 