'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useHybridData } from '@/contexts/HybridDataContext';
import { useNetPositions } from '@/hooks/useNetPositions';

export default function NetTestComponent() {
  const { addPosition, positions } = useHybridData();
  const { netPositions, formatNetQuantity } = useNetPositions();
  const [testContract] = React.useState('BGIK25');

  const addLongPosition = () => {
    addPosition({
      user_id: 'test_user',
      contract_id: `contract_${Date.now()}`,
      contract: testContract,
      direction: 'LONG',
      quantity: 20,
      entry_price: 245.50,
      current_price: 248.00,
      status: 'OPEN',
      entry_date: new Date().toISOString(),
      fees: 50,
      unrealized_pnl: 0,
      pnl_percentage: 0
    });
  };

  const addShortPosition = () => {
    addPosition({
      user_id: 'test_user',
      contract_id: `contract_${Date.now()}`,
      contract: testContract,
      direction: 'SHORT',
      quantity: 20,
      entry_price: 248.00,
      current_price: 248.00,
      status: 'OPEN',
      entry_date: new Date().toISOString(),
      fees: 50,
      unrealized_pnl: 0,
      pnl_percentage: 0
    });
  };

  const contractPositions = positions.filter(p => p.contract === testContract);
  const contractNetPosition = netPositions.find(net => net.contract === testContract);

  return (
    <div className="net-test-component">
      <div className="card">
        <h2>Teste de Lógica NET - {testContract}</h2>
        
        {/* Botões de Teste */}
        <div className="test-buttons">
          <button className="btn btn-success" onClick={addLongPosition}>
            Comprar 20 contratos (LONG)
          </button>
          <button className="btn btn-danger" onClick={addShortPosition}>
            Vender 20 contratos (SHORT)
          </button>
        </div>

        {/* Status Atual */}
        <div className="test-status">
          <h3>Status Atual</h3>
          
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Posições Individuais:</span>
              <span className="status-value">{contractPositions.length}</span>
            </div>
            
            <div className="status-item">
              <span className="status-label">Posição Líquida:</span>
              <span className="status-value">
                {contractNetPosition ? 
                  `${formatNetQuantity(contractNetPosition.netQuantity)} (${contractNetPosition.netDirection})` : 
                  'NEUTRA (não aparece na carteira)'
                }
              </span>
            </div>
            
            <div className="status-item">
              <span className="status-label">Aparece na Gestão:</span>
              <span className={`status-value ${contractNetPosition ? 'positive' : 'negative'}`}>
                {contractNetPosition ? 'SIM' : 'NÃO'}
              </span>
            </div>
          </div>
        </div>

        {/* Detalhes das Posições */}
        {contractPositions.length > 0 && (
          <div className="positions-detail">
            <h4>Posições Individuais ({contractPositions.length})</h4>
            <div className="positions-list">
              {contractPositions.map(pos => (
                <div key={pos.id} className="position-item">
                  <span className="position-id">{pos.id}</span>
                  <span className={`position-direction ${pos.direction.toLowerCase()}`}>
                    {pos.direction}
                  </span>
                  <span className="position-quantity">{pos.quantity}</span>
                  <span className="position-price">
                    R$ {pos.entry_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`position-status status-${pos.status.toLowerCase()}`}>
                    {pos.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explicação */}
        <div className="explanation">
          <h4>Como Testar:</h4>
          <ol>
            <li><strong>Clique "Comprar 20 contratos"</strong> - Verá posição LONG +20 na gestão</li>
            <li><strong>Clique "Vender 20 contratos"</strong> - Posição desaparecerá da gestão (NET = 0)</li>
            <li><strong>As posições individuais ainda existem</strong> mas estão marcadas como NETTED</li>
            <li><strong>A carteira mostra apenas exposição real</strong> (posições líquidas ≠ 0)</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 