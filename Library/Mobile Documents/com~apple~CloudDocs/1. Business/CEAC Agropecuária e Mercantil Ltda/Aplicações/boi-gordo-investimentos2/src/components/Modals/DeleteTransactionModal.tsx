'use client';

import { Transaction } from '@/types';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
  transaction: Transaction | null;
}

export default function DeleteTransactionModal({
  isOpen,
  onClose,
  onConfirm,
  transaction
}: DeleteTransactionModalProps) {
  if (!isOpen || !transaction) return null;

  const handleConfirm = () => {
    onConfirm(transaction.id);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-transaction">
        <div className="modal-header">
          <h2 className="modal-title">Confirmar Exclusão</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="delete-warning">
            <div className="warning-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            
            <h3>Tem certeza que deseja excluir esta transação?</h3>
            
            <div className="transaction-summary">
              <div className="summary-item">
                <label>ID:</label>
                <span className="transaction-id">{transaction.id}</span>
              </div>
              <div className="summary-item">
                <label>Data:</label>
                <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="summary-item">
                <label>Contrato:</label>
                <span className="contract-badge">{transaction.contract}</span>
              </div>
              <div className="summary-item">
                <label>Tipo:</label>
                <span className={`type-badge ${transaction.type.toLowerCase()}`}>
                  {transaction.type}
                </span>
              </div>
              <div className="summary-item">
                <label>Quantidade:</label>
                <span>{transaction.quantity} contratos</span>
              </div>
              <div className="summary-item">
                <label>Valor Total:</label>
                <span className="total-value">
                  {transaction.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            <div className="warning-text">
              <p>⚠️ <strong>Esta ação não pode ser desfeita!</strong></p>
              <p>A transação será permanentemente removida do sistema e do histórico.</p>
              {transaction.status === 'EXECUTADA' && (
                <p className="impact-warning">
                  <strong>Atenção:</strong> Esta transação pode estar vinculada a posições ativas. 
                  A exclusão pode afetar os cálculos de P&L e exposição.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={handleConfirm}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Excluir Transação
          </button>
        </div>
      </div>
    </div>
  );
} 