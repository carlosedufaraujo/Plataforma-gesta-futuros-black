'use client';

import { useState, useEffect } from 'react';
import { Option } from '@/types';
import { useExpirations } from '@/hooks/useExpirations';

interface NewOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (option: Omit<Option, 'id' | 'user_id' | 'contract_id'>) => void;
  editingOption?: Option | null;
}

export default function NewOptionModal({ isOpen, onClose, onSubmit, editingOption }: NewOptionModalProps) {
  const { activeExpirations } = useExpirations();
  
  const [formData, setFormData] = useState({
    contractType: 'BGI',
    expiration: '',
    option_type: 'CALL' as 'CALL' | 'PUT',
    strike_price: '',
    premium: '',
    quantity: '',
    is_purchased: true,
    delta: ''
  });

  // Definir primeiro vencimento ativo como padrão
  useEffect(() => {
    if (activeExpirations.length > 0 && !formData.expiration) {
      setFormData(prev => ({ ...prev, expiration: activeExpirations[0].code }));
    }
  }, [activeExpirations, formData.expiration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.strike_price || !formData.premium || !formData.quantity) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Construir código completo do contrato
    const expiration = activeExpirations.find(exp => exp.code === formData.expiration);
    const contractCode = `${formData.contractType}${formData.expiration}${expiration?.year.slice(-2) || '25'}`;

    // Calcular data de expiração baseada no vencimento selecionado
    const expirationDate = expiration ? 
      new Date(parseInt(expiration.year), expiration.monthNumber - 1, 30).toISOString() :
      new Date().toISOString();

    const newOption: Omit<Option, 'id' | 'user_id' | 'contract_id'> = {
      option_type: formData.option_type,
      strike_price: parseFloat(formData.strike_price.replace('R$ ', '').replace(',', '.')),
      premium: parseFloat(formData.premium.replace('R$ ', '').replace(',', '.')),
      quantity: parseInt(formData.quantity),
      expiration_date: expirationDate,
      is_purchased: formData.is_purchased,
      status: 'OPEN',
      delta: formData.delta ? parseFloat(formData.delta) : undefined,
      symbol: contractCode,
      name: `${formData.option_type} ${contractCode}`
    };

    onSubmit(newOption);
    onClose();
    
    // Reset form
    setFormData({
      contractType: 'BGI',
      expiration: activeExpirations.length > 0 ? activeExpirations[0].code : '',
      option_type: 'CALL',
      strike_price: '',
      premium: '',
      quantity: '',
      is_purchased: true,
      delta: ''
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{editingOption ? 'Editar Opção' : 'Nova Opção'}</h3>
          <button 
            className="modal-close"
            onClick={onClose}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select 
                  className="form-select"
                  value={formData.option_type}
                  onChange={(e) => handleInputChange('option_type', e.target.value as 'CALL' | 'PUT')}
                >
                  <option value="CALL">Call</option>
                  <option value="PUT">Put</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Ativo Base</label>
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
                <label className="form-label">Vencimento</label>
                <select 
                  className="form-select"
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
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Strike</label>
                <input 
                  type="number"
                  className="form-input"
                  value={formData.strike_price}
                  onChange={(e) => handleInputChange('strike_price', e.target.value)}
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Prêmio</label>
                <input 
                  type="number"
                  className="form-input"
                  value={formData.premium}
                  onChange={(e) => handleInputChange('premium', e.target.value)}
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Quantidade</label>
                <input 
                  type="number"
                  className="form-input"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  min="1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Delta (Opcional)</label>
                <input 
                  type="text"
                  className="form-input"
                  value={formData.delta}
                  onChange={(e) => handleInputChange('delta', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Operação</label>
              <select 
                className="form-select"
                value={formData.is_purchased.toString()}
                onChange={(e) => handleInputChange('is_purchased', e.target.value === 'true')}
              >
                <option value="true">Comprada</option>
                <option value="false">Vendida</option>
              </select>
            </div>

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
                {editingOption ? 'Atualizar Opção' : 'Criar Opção'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 