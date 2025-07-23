'use client';

import { useState, useEffect } from 'react';
import { Position } from '@/types';

interface ClosePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (closeData: ClosePositionData) => void;
  position?: Position | null;
}

interface ClosePositionData {
  positionId: string;
  quantity: number;
  closePrice: number;
  reason: string;
  closeDate: string;
}

export default function ClosePositionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  position 
}: ClosePositionModalProps) {
  const [formData, setFormData] = useState({
    quantity: 0,
    closePrice: 0,
    reason: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Atualizar formData quando position mudar
  useEffect(() => {
    if (position) {
      setFormData({
        quantity: position.quantity, // Sempre carregar com a quantidade total da posição
        closePrice: position.entry_price, // Carregar com preço de entrada em vez do atual
        reason: ''
      });
      setErrors({});
    }
  }, [position]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantidade deve ser maior que zero';
    }

    if (!position) {
      newErrors.general = 'Posição não encontrada';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (formData.quantity > position.quantity) {
      newErrors.quantity = 'Quantidade não pode ser maior que a posição atual';
    }

    if (!formData.closePrice || formData.closePrice <= 0) {
      newErrors.closePrice = 'Preço de fechamento deve ser maior que zero';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Motivo do fechamento é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!position || !validateForm()) {
      return;
    }

    const closeData: ClosePositionData = {
      positionId: position.id,
      quantity: formData.quantity,
      closePrice: formData.closePrice,
      reason: formData.reason,
      closeDate: new Date().toISOString()
    };

    onSubmit(closeData);
    onClose();
    
    // Reset form
    setFormData({
      quantity: position?.quantity || 0,
      closePrice: position?.entry_price || 0, // Usar preço de entrada em vez do atual
      reason: ''
    });
    setErrors({});
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

  if (!isOpen || !position) return null;

  // Calcular P&L considerando o tamanho dos contratos
  const contractSize = position.contract.startsWith('BGI') ? 330 : 450;
  const currentPnL = (position.direction === 'LONG' ? 1 : -1) * 
    ((position.current_price || position.entry_price) - position.entry_price) * 
    position.quantity * contractSize;
  
  const estimatedPnL = (position.direction === 'LONG' ? 1 : -1) * 
    (formData.closePrice - position.entry_price) * 
    formData.quantity * contractSize;
  
  const pnlDifference = estimatedPnL - currentPnL;

  return (
    <div className="modal-overlay">
      <div className="modal position-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">Fechar Posição</h2>
            <span className="modal-subtitle">{position.contract}</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Informações da Posição */}
          <div className="position-summary">
            <div className="summary-row">
              <span className="summary-label">Direção</span>
              <span className={`badge ${position.direction === 'LONG' ? 'badge-success' : 'badge-danger'}`}>
                {position.direction}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Quantidade</span>
              <span className="summary-value">{position.quantity} contratos</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Preço Entrada</span>
              <span className="summary-value">R$ {position.entry_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Preço Atual</span>
              <span className="summary-value">R$ {(position.current_price || position.entry_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Formulário de Fechamento */}
          <div className="close-form">
            <div className="form-row">
              <div className="field-group">
                <label className="field-label">Quantidade a Fechar</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                  className={`form-input ${errors.quantity ? 'error' : ''}`}
                  min="1"
                  max={position.quantity}
                />
                {errors.quantity && <span className="error-message">{errors.quantity}</span>}
              </div>
              
              <div className="field-group">
                <label className="field-label">Preço de Fechamento</label>
                <div className="price-input-container">
                  <span className="currency-symbol">R$</span>
                  <input
                    type="number"
                    value={formData.closePrice}
                    onChange={(e) => handleChange('closePrice', parseFloat(e.target.value) || 0)}
                    className={`form-input ${errors.closePrice ? 'error' : ''}`}
                    step="0.01"
                    min="0.01"
                  />
                </div>
                {errors.closePrice && <span className="error-message">{errors.closePrice}</span>}
                {position && (
                  <div className="price-info">
                    <small>
                      Entrada: R$ {position.entry_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • 
                      Atual: R$ {(position.current_price || position.entry_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </small>
                  </div>
                )}
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Motivo do Fechamento</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                className={`form-input ${errors.reason ? 'error' : ''}`}
                placeholder="Ex: Stop loss, Take profit, Realização de lucro..."
              />
              {errors.reason && <span className="error-message">{errors.reason}</span>}
            </div>

            {/* P&L Estimado */}
            <div className="pnl-card">
              <div className="pnl-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18"></path>
                  <path d="M7 12l4-4 4 4 6-6"></path>
                </svg>
                <span className="pnl-title">P&L Estimado</span>
              </div>
              <div className="pnl-content">
                <div className={`pnl-amount ${estimatedPnL > 0 ? 'positive' : estimatedPnL < 0 ? 'negative' : 'neutral'}`}>
                  {estimatedPnL < 0 ? '-' : ''}R$ {Math.abs(estimatedPnL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="pnl-details">
                  <span className="pnl-detail-item">
                    <span className="detail-label">Quantidade:</span>
                    <span className="detail-value">{formData.quantity} contratos</span>
                  </span>
                  <span className="pnl-detail-item">
                    <span className="detail-label">Diferença por contrato:</span>
                    <span className={`detail-value ${((position.direction === 'LONG' ? 1 : -1) * (formData.closePrice - position.entry_price) * contractSize) > 0 ? 'positive' : ((position.direction === 'LONG' ? 1 : -1) * (formData.closePrice - position.entry_price) * contractSize) < 0 ? 'negative' : 'neutral'}`}>
                      {((position.direction === 'LONG' ? 1 : -1) * (formData.closePrice - position.entry_price) * contractSize) < 0 ? '-' : ''}R$ {Math.abs((position.direction === 'LONG' ? 1 : -1) * (formData.closePrice - position.entry_price) * contractSize).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={handleSubmit}>
            Fechar Posição
          </button>
        </div>
      </div>
    </div>
  );
} 