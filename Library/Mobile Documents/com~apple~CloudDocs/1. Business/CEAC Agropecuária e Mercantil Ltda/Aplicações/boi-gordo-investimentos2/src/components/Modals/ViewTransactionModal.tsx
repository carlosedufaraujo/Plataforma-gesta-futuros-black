'use client';

import { Transaction } from '@/types';

interface ViewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export default function ViewTransactionModal({
  isOpen,
  onClose,
  transaction
}: ViewTransactionModalProps) {
  if (!isOpen || !transaction) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-transaction">
        <div className="modal-header">
          <h2 className="modal-title">Detalhes da Transação</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Informações Básicas */}
          <div className="transaction-info-section">
            <h3>Informações da Transação</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>ID da Transação:</label>
                <span className="transaction-id">{transaction.id}</span>
              </div>
              <div className="info-item">
                <label>Data/Hora:</label>
                <span>
                  {new Date(transaction.date).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(transaction.date).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <div className="info-item">
                <label>Contrato:</label>
                <span className="contract-badge">{transaction.contract}</span>
              </div>
              <div className="info-item">
                <label>Tipo:</label>
                <span className={`type-badge ${transaction.type.toLowerCase()}`}>
                  {transaction.type}
                </span>
              </div>
            </div>
          </div>

          {/* Detalhes Financeiros */}
          <div className="transaction-info-section">
            <h3>Detalhes Financeiros</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Quantidade:</label>
                <span>{transaction.quantity} contratos</span>
              </div>
              <div className="info-item">
                <label>Preço por Contrato:</label>
                <span>{transaction.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="info-item">
                <label>Taxa/Comissão:</label>
                <span>
                  {transaction.fees > 0 
                    ? transaction.fees.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : 'Sem taxa'
                  }
                </span>
              </div>
              <div className="info-item">
                <label>Valor Total:</label>
                <span className="total-value">
                  {transaction.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>

          {/* Status e Datas */}
          <div className="transaction-info-section">
            <h3>Status e Controle</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Status:</label>
                <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                  {transaction.status === 'EXECUTADA' ? 'Executada' :
                   transaction.status === 'PENDENTE' ? 'Pendente' : 'Cancelada'}
                </span>
              </div>
              <div className="info-item">
                <label>Data de Criação:</label>
                <span>
                  {new Date(transaction.createdAt).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(transaction.createdAt).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Cálculos Adicionais */}
          <div className="transaction-calculations">
            <h3>Cálculos</h3>
            <div className="calculation-row">
              <span>Valor Base ({transaction.quantity} × {transaction.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}):</span>
              <span>{(transaction.quantity * transaction.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            {transaction.fees > 0 && (
              <div className="calculation-row">
                <span>Taxa/Comissão:</span>
                <span>+ {transaction.fees.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            )}
            <div className="calculation-row total">
              <span>Total Final:</span>
              <span>{transaction.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
} 