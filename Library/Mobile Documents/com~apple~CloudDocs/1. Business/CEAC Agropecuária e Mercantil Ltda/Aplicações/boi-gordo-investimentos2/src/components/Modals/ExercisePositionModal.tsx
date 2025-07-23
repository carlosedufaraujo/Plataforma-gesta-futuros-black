'use client';

import { useState } from 'react';
import { Position } from '@/types';

interface ExercisePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exerciseData: ExerciseData) => void;
  position?: Position | null;
}

interface ExerciseData {
  positionId: string;
  exerciseType: 'EARLY' | 'EXPIRATION';
  quantity: number;
  exercisePrice: number;
  reason: string;
  exerciseDate: string;
}

export default function ExercisePositionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  position 
}: ExercisePositionModalProps) {
  const [formData, setFormData] = useState({
    exerciseType: 'EXPIRATION' as 'EARLY' | 'EXPIRATION',
    quantity: position?.quantity || 0,
    exercisePrice: position?.currentPrice || 0,
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

    if (!formData.exercisePrice || formData.exercisePrice <= 0) {
      newErrors.exercisePrice = 'Preço de exercício deve ser maior que zero';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Motivo do exercício é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!position || !validateForm()) {
      return;
    }

    const exerciseData: ExerciseData = {
      positionId: position.id,
      exerciseType: formData.exerciseType,
      quantity: formData.quantity,
      exercisePrice: formData.exercisePrice,
      reason: formData.reason,
      exerciseDate: new Date().toISOString()
    };

    onSubmit(exerciseData);
    onClose();
    
    // Reset form
    setFormData({
      exerciseType: 'EXPIRATION',
      quantity: position?.quantity || 0,
      exercisePrice: position?.currentPrice || 0,
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

  const currentPnL = (position.current_price - position.entry_price) * position.quantity;
  const pnlPercentage = ((position.current_price - position.entry_price) / position.entry_price) * 100;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Exercer Posição - {position.contract}</h3>
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
                <label>P&L:</label>
                <span className={currentPnL >= 0 ? 'positive' : 'negative'}>
                  R$ {Math.abs(currentPnL).toFixed(2)} ({pnlPercentage.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Tipo de Exercício *</label>
                <select
                  className="form-select"
                  value={formData.exerciseType}
                  onChange={(e) => handleChange('exerciseType', e.target.value)}
                >
                  <option value="EXPIRATION">Exercício no Vencimento</option>
                  <option value="EARLY">Exercício Antecipado</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantidade a Exercer *</label>
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
                <label className="form-label">Preço de Exercício (R$) *</label>
                <input
                  type="number"
                  className={`form-input ${errors.exercisePrice ? 'error' : ''}`}
                  value={formData.exercisePrice}
                  onChange={(e) => handleChange('exercisePrice', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0.01"
                />
                {errors.exercisePrice && <span className="error-message">{errors.exercisePrice}</span>}
              </div>

              <div className="form-group full-width">
                <label className="form-label">Motivo do Exercício *</label>
                <textarea
                  className={`form-textarea ${errors.reason ? 'error' : ''}`}
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  placeholder="Descreva o motivo para exercer esta posição..."
                  rows={3}
                />
                {errors.reason && <span className="error-message">{errors.reason}</span>}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-warning">
                Exercer Posição
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 