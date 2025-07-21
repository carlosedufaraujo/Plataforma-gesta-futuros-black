'use client';

import { useState } from 'react';
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
    quantity: position?.quantity || 0,
    closePrice: position?.currentPrice || 0,
    reason: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantidade deve ser maior que zero';
    }

    if (!position) {
      newErrors.general = 'Posição não encontrada';
    }

    if (formData.quantity > (position?.quantity || 0)) {
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
      closePrice: position?.currentPrice || 0,
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

  const currentPnL = (position.currentPrice - position.entryPrice) * position.quantity;
  const estimatedPnL = (formData.closePrice - position.entryPrice) * formData.quantity;
  const pnlDifference = estimatedPnL - currentPnL;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Fechar Posição - {position.contract}</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Informações da Posição */}
          <div className="position-info">
            <h4>Informações da Posição</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Contrato:</label>
                <span>{position.contract}</span>
              </div>
              <div className="info-item">
                <label>Direção:</label>
                <span className={`direction ${position.direction.toLowerCase()}`}>
                  {position.direction === 'LONG' ? 'Comprado' : 'Vendido'}
                </span>
              </div>
              <div className="info-item">
                <label>Quantidade Atual:</label>
                <span>{position.quantity} contratos</span>
              </div>
              <div className="info-item">
                <label>Preço de Entrada:</label>
                <span>R$ {position.entryPrice.toFixed(2)}</span>
              </div>
              <div className="info-item">
                <label>Preço Atual:</label>
                <span>R$ {position.currentPrice.toFixed(2)}</span>
              </div>
              <div className="info-item">
                <label>P&L Atual:</label>
                <span className={currentPnL >= 0 ? 'positive' : 'negative'}>
                  {currentPnL >= 0 ? '+' : ''}R$ {currentPnL.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Simulação do Fechamento */}
          {formData.closePrice > 0 && formData.quantity > 0 && (
            <div className="simulation-info">
              <h4>Simulação de Fechamento</h4>
              <div className="info-grid">
                <div className="info-item">
                  <label>P&L Estimado:</label>
                  <span className={estimatedPnL >= 0 ? 'positive' : 'negative'}>
                    {estimatedPnL >= 0 ? '+' : ''}R$ {estimatedPnL.toFixed(2)}
                  </span>
                </div>
                <div className="info-item">
                  <label>Diferença:</label>
                  <span className={pnlDifference >= 0 ? 'positive' : 'negative'}>
                    {pnlDifference >= 0 ? '+' : ''}R$ {pnlDifference.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Quantidade a Fechar *</label>
                <input
                  type="number"
                  className={`form-input ${errors.quantity ? 'error' : ''}`}
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                  min="1"
                  max={position.quantity}
                />
                {errors.quantity && <span className="error-message">{errors.quantity}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Preço de Fechamento (R$) *</label>
                <input
                  type="number"
                  className={`form-input ${errors.closePrice ? 'error' : ''}`}
                  value={formData.closePrice}
                  onChange={(e) => handleChange('closePrice', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0.01"
                />
                {errors.closePrice && <span className="error-message">{errors.closePrice}</span>}
              </div>

              <div className="form-group full-width">
                <label className="form-label">Motivo do Fechamento *</label>
                <textarea
                  className={`form-textarea ${errors.reason ? 'error' : ''}`}
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  placeholder="Descreva o motivo para fechar esta posição..."
                  rows={3}
                />
                {errors.reason && <span className="error-message">{errors.reason}</span>}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-danger">
                Fechar Posição
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 