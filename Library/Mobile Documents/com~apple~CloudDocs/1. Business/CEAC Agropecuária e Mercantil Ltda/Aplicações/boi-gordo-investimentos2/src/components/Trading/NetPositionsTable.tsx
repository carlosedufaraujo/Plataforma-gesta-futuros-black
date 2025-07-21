'use client';

import { NetPosition } from '@/types';
import DataTable from '@/components/Common/DataTable';

interface NetPositionsTableProps {
  netPositions: NetPosition[];
  onPartialClose?: (netPosition: NetPosition, quantity: number, price: number) => void;
  onViewDetails?: (netPosition: NetPosition) => void;
}

export default function NetPositionsTable({ 
  netPositions, 
  onPartialClose,
  onViewDetails 
}: NetPositionsTableProps) {
  
  if (netPositions.length === 0) {
    return (
      <div className="card">
        <h2>Posições NET - Sistema Brasileiro</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
          Nenhuma posição líquida encontrada
        </p>
      </div>
    );
  }

  const tableData = netPositions.map(netPosition => [
    // Contrato
    <div key="contract">
      <strong>{netPosition.contract}</strong><br/>
      <small style={{ color: 'var(--text-secondary)' }}>
        {netPosition.individual_positions?.length || 0} posições
      </small>
    </div>,

    // Direção - SEGUINDO PADRÃO ORIGINAL com ícones
    <span 
      key="direction" 
      className={`badge ${
        netPosition.net_direction === 'LONG' 
          ? 'badge-success direction-indicator long' 
          : netPosition.net_direction === 'SHORT'
          ? 'badge-danger direction-indicator short'
          : 'badge-info'
      }`}
    >
      {netPosition.net_direction}
    </span>,

    // Quantidade
    Math.abs(netPosition.net_quantity),

    // Preço Médio - FORMATAÇÃO BRASILEIRA ORIGINAL
    `R$ ${netPosition.average_price.toFixed(2).replace('.', ',')}`,

    // Preço Atual - FORMATAÇÃO BRASILEIRA ORIGINAL  
    `R$ ${netPosition.current_price.toFixed(2).replace('.', ',')}`,

    // P&L Não Realizado - USANDO CLASSES ORIGINAIS positive/negative
    <span 
      key="pnl" 
      className={netPosition.unrealized_pnl >= 0 ? 'positive' : 'negative'}
    >
      {netPosition.unrealized_pnl >= 0 ? '+' : ''}R$ {Math.abs(netPosition.unrealized_pnl).toLocaleString('pt-BR', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })}
    </span>,

    // Exposição - FORMATAÇÃO BRASILEIRA
    `R$ ${netPosition.net_exposure.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).replace(/\./g, ',').replace(/,(\d{2})$/, ',$1')}`,

    // Ações - USANDO PADRÃO ORIGINAL
    <div key="actions" className="action-buttons">
      <button 
        className="btn btn-secondary btn-sm"
        onClick={() => onViewDetails?.(netPosition)}
      >
        Detalhes
      </button>
      <button 
        className="btn btn-danger btn-sm"
        onClick={() => onPartialClose?.(netPosition, Math.abs(netPosition.net_quantity), netPosition.current_price)}
      >
        Fechar
      </button>
    </div>
  ]);

  return (
    <div className="card">
      <h2>Posições NET - Sistema Brasileiro</h2>
      <p style={{ 
        color: 'var(--text-secondary)', 
        marginBottom: '20px', 
        fontSize: '14px' 
      }}>
        {netPositions.length} posições líquidas ativas • Preço médio ponderado • Ajuste diário automático
      </p>
      
      <DataTable
        headers={[
          'Contrato',
          'Direção', 
          'Quantidade',
          'Preço Médio',
          'Preço Atual',
          'P&L Não Real.',
          'Exposição',
          'Ações'
        ]}
        data={tableData}
      />
    </div>
  );
} 