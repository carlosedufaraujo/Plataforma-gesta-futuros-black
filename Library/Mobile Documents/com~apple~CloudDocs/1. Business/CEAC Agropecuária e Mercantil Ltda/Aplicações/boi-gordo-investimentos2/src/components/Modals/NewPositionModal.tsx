'use client';

import { useState, useEffect } from 'react';
import { Position } from '@/types';
import { useExpirations } from '@/hooks/useExpirations';

interface NewPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (position: Omit<Position, 'id'>) => void;
  editingPosition?: Position | null;
}

export default function NewPositionModal({ isOpen, onClose, onSubmit, editingPosition }: NewPositionModalProps) {
  const { activeExpirations } = useExpirations();
  
  const [formData, setFormData] = useState({
    contractType: editingPosition?.contract.slice(0, 3) || 'BGI',
    expiration: editingPosition?.contract.slice(3, 4) || '',
    direction: editingPosition?.direction || 'LONG' as 'LONG' | 'SHORT',
    quantity: editingPosition?.quantity.toString() || '',
    price: editingPosition?.entryPrice.toString() || '',
    stopLoss: editingPosition?.stopLoss?.toString() || '',
    takeProfit: editingPosition?.takeProfit?.toString() || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Definir primeiro vencimento ativo como padrão
  useEffect(() => {
    if (activeExpirations.length > 0 && !formData.expiration) {
      setFormData(prev => ({ ...prev, expiration: activeExpirations[0].code }));
    }
  }, [activeExpirations, formData.expiration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    const newErrors: Record<string, string> = {};
    
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantidade é obrigatória e deve ser maior que zero';
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Preço de entrada é obrigatório e deve ser maior que zero';
    }
    
    if (!formData.expiration) {
      newErrors.expiration = 'Vencimento é obrigatório';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Construir código completo do contrato (BGI + K + 25)
    const expiration = activeExpirations.find(exp => exp.code === formData.expiration);
    const contractCode = `${formData.contractType}${formData.expiration}${expiration?.year.slice(-2) || '25'}`;

    const newPosition: Omit<Position, 'id'> = {
      contract: contractCode,
      direction: formData.direction,
      quantity: parseInt(formData.quantity),
      entryPrice: parseFloat(formData.price.replace('R$ ', '').replace('.', '').replace(',', '.')),
      currentPrice: parseFloat(formData.price.replace('R$ ', '').replace('.', '').replace(',', '.')),
      stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss.replace('R$ ', '').replace('.', '').replace(',', '.')) : undefined,
      takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit.replace('R$ ', '').replace('.', '').replace(',', '.')) : undefined,
      status: 'OPEN',
      openDate: new Date().toISOString(),
    };

    onSubmit(newPosition);
    onClose();
    
    // Reset form
    setFormData({
      contractType: 'BGI',
      expiration: activeExpirations.length > 0 ? activeExpirations[0].code : '',
      direction: 'LONG',
      quantity: '',
      price: '',
      stopLoss: '',
      takeProfit: ''
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{editingPosition ? 'Editar Posição' : 'Nova Posição'}</h3>
          <button 
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Primeira linha: Ativo e Vencimento */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required">Ativo</label>
                <select 
                  className="form-select"
                  value={formData.contractType}
                  onChange={(e) => handleInputChange('contractType', e.target.value)}
                >
                  <option value="BGI">BGI - Boi Gordo</option>
                  <option value="CCM">CCM - Milho</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label required">Vencimento</label>
                <select 
                  className={`form-select ${errors.expiration ? 'error' : ''}`}
                  value={formData.expiration}
                  onChange={(e) => handleInputChange('expiration', e.target.value)}
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
                {errors.expiration && <span className="error-message">{errors.expiration}</span>}
              </div>
            </div>

            {/* Segunda linha: Direção e Quantidade */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label required">Direção</label>
                <select 
                  className="form-select"
                  value={formData.direction}
                  onChange={(e) => handleInputChange('direction', e.target.value)}
                >
                  <option value="LONG">LONG (Compra)</option>
                  <option value="SHORT">SHORT (Venda)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label required">Quantidade</label>
                <input 
                  type="number" 
                  className={`form-input ${errors.quantity ? 'error' : ''}`}
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  min="1"
                  placeholder="Número de contratos"
                />
                {errors.quantity && <span className="error-message">{errors.quantity}</span>}
              </div>
            </div>

            {/* Terceira linha: Preço de Entrada (largura completa) */}
            <div className="form-group full-width">
              <label className="form-label required">Preço de Entrada</label>
              <input 
                type="text" 
                className={`form-input ${errors.price ? 'error' : ''}`}
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="Ex: 350,50"
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>

            {/* Quarta linha: Stop Loss e Take Profit (Opcionais) */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Stop Loss (Opcional)</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.stopLoss}
                  onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                  placeholder="Ex: 320,00"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Take Profit (Opcional)</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.takeProfit}
                  onChange={(e) => handleInputChange('takeProfit', e.target.value)}
                  placeholder="Ex: 400,00"
                />
              </div>
            </div>

            {/* Botões */}
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
              >
                {editingPosition ? 'Atualizar Posição' : 'Criar Posição'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 