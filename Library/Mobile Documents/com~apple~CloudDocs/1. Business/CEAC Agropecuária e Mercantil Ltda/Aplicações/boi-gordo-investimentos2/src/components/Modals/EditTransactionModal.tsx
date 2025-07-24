'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Transaction>) => void;
  transaction: Transaction | null;
}

export default function EditTransactionModal({
  isOpen,
  onClose,
  onSave,
  transaction
}: EditTransactionModalProps) {
  const [formData, setFormData] = useState({
    date: '',
    type: 'COMPRA' as 'COMPRA' | 'VENDA' | 'EXERCICIO' | 'VENCIMENTO',
    contract: '',
    quantity: 0,
    price: 0,
    fees: 0,
    status: 'EXECUTADA' as 'EXECUTADA' | 'PENDENTE' | 'CANCELADA'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (transaction && isOpen) {
      setFormData({
        date: new Date(transaction.date).toISOString().slice(0, 16),
        type: transaction.type,
        contract: transaction.contract,
        quantity: transaction.quantity,
        price: transaction.price,
        fees: transaction.fees,
        status: transaction.status
      });
      setErrors({});
    }
  }, [transaction, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Data e hora são obrigatórias';
    }

    if (!formData.contract.trim()) {
      newErrors.contract = 'Contrato é obrigatório';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantidade deve ser maior que zero';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    }

    if (formData.fees < 0) {
      newErrors.fees = 'Taxa não pode ser negativa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction || !validateForm()) return;

    const updates: Partial<Transaction> = {
      date: new Date(formData.date).toISOString(),
      type: formData.type,
      contract: formData.contract.toUpperCase(),
      quantity: formData.quantity,
      price: formData.price,
      fees: formData.fees,
      status: formData.status,
      total: (formData.quantity * formData.price) + formData.fees
    };

    onSave(transaction.id, updates);
    onClose();
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-transaction">
        <div className="modal-header">
          <h2 className="modal-title">Editar Transação</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required">Data e Hora</label>
                <input
                  type="datetime-local"
                  className={`form-input ${errors.date ? 'error' : ''}`}
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
                {errors.date && <span className="error-message">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required">Tipo de Transação</label>
                <select
                  className={`form-select ${errors.type ? 'error' : ''}`}
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <option value="COMPRA">Compra</option>
                  <option value="VENDA">Venda</option>
                  <option value="EXERCICIO">Exercício</option>
                  <option value="VENCIMENTO">Vencimento</option>
                </select>
                {errors.type && <span className="error-message">{errors.type}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required">Contrato</label>
                <input
                  type="text"
                  className={`form-input ${errors.contract ? 'error' : ''}`}
                  value={formData.contract}
                  onChange={(e) => handleChange('contract', e.target.value.toUpperCase())}
                  placeholder="Ex: BGIZ24, CCMZ24"
                />
                {errors.contract && <span className="error-message">{errors.contract}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required">Status</label>
                <select
                  className={`form-select ${errors.status ? 'error' : ''}`}
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="EXECUTADA">Executada</option>
                  <option value="PENDENTE">Pendente</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
                {errors.status && <span className="error-message">{errors.status}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required">Quantidade</label>
                <input
                  type="number"
                  className={`form-input ${errors.quantity ? 'error' : ''}`}
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                  min="1"
                />
                {errors.quantity && <span className="error-message">{errors.quantity}</span>}
              </div>

              <div className="form-group">
                <label className="form-label required">Preço por Contrato</label>
                <input
                  type="number"
                  step="0.01"
                  className={`form-input ${errors.price ? 'error' : ''}`}
                  value={formData.price}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                  min="0.01"
                />
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Taxa/Comissão</label>
                <input
                  type="number"
                  step="0.01"
                  className={`form-input ${errors.fees ? 'error' : ''}`}
                  value={formData.fees}
                  onChange={(e) => handleChange('fees', parseFloat(e.target.value) || 0)}
                  min="0"
                />
                {errors.fees && <span className="error-message">{errors.fees}</span>}
              </div>

              <div className="form-group full-width">
                <div className="calculation-preview">
                  <h4>Cálculo do Total</h4>
                  <div className="calc-row">
                    <span>Valor Base:</span>
                    <span>{(formData.quantity * formData.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="calc-row">
                    <span>Taxa/Comissão:</span>
                    <span>+ {formData.fees.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  <div className="calc-row total">
                    <span>Total Final:</span>
                    <span>{((formData.quantity * formData.price) + formData.fees).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 