'use client';

import { useState, useEffect, useRef } from 'react';
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
    contractInput: editingPosition?.contract || '',
    contractType: editingPosition?.contract.slice(0, 3) || 'BGI',
    expiration: editingPosition?.contract.slice(3, 4) || '',
    direction: editingPosition?.direction || 'LONG' as 'LONG' | 'SHORT',
    quantity: editingPosition?.quantity.toString() || '',
    price: editingPosition?.entryPrice.toString() || '',
    stopLoss: editingPosition?.stopLoss?.toString() || '',
    takeProfit: editingPosition?.takeProfit?.toString() || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [contractInput, setContractInput] = useState(editingPosition?.contract || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Definir primeiro vencimento ativo como padrão
  useEffect(() => {
    if (activeExpirations.length > 0 && !formData.expiration) {
      setFormData(prev => ({ ...prev, expiration: activeExpirations[0].code }));
    }
  }, [activeExpirations, formData.expiration]);

  // Sincronizar contractInput quando editingPosition mudar
  useEffect(() => {
    if (editingPosition) {
      setContractInput(editingPosition.contract);
      setFormData(prev => ({
        ...prev,
        contractType: editingPosition.contract.slice(0, 3),
        expiration: editingPosition.contract.slice(3, 4),
        direction: editingPosition.direction,
        quantity: editingPosition.quantity.toString(),
        price: editingPosition.entryPrice.toString(),
        stopLoss: editingPosition.stopLoss?.toString() || '',
        takeProfit: editingPosition.takeProfit?.toString() || ''
      }));
    }
  }, [editingPosition]);

  // Gerar lista de contratos disponíveis
  const generateContractSuggestions = () => {
    const contracts = [];
    const contractTypes = [
      { code: 'BGI', name: 'Boi Gordo' },
      { code: 'CCM', name: 'Milho' }
    ];

    contractTypes.forEach(type => {
      activeExpirations.forEach(exp => {
        const contractCode = `${type.code}${exp.code}${exp.year.slice(-2)}`;
        contracts.push(`${contractCode} - ${type.name} ${exp.month}/${exp.year}`);
      });
    });

    return contracts;
  };

  // Filtrar sugestões baseado no input
  const filterSuggestions = (input: string) => {
    if (!input) return [];
    
    const allContracts = generateContractSuggestions();
    return allContracts.filter(contract => 
      contract.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5); // Limitar a 5 sugestões
  };

  // Handler para mudanças no input do contrato
  const handleContractInputChange = (value: string) => {
    setContractInput(value);
    
    if (value.length > 0) {
      const filtered = filterSuggestions(value);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      
      // Auto-completar campos separados se o input for válido
      const upperValue = value.toUpperCase();
      if (upperValue.length >= 4) {
        const contractType = upperValue.slice(0, 3);
        const expiration = upperValue.slice(3, 4);
        
        if ((contractType === 'BGI' || contractType === 'CCM') && 
            activeExpirations.some(exp => exp.code === expiration)) {
          setFormData(prev => ({
            ...prev,
            contractType,
            expiration
          }));
        }
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Selecionar sugestão
  const selectSuggestion = (suggestion: string) => {
    const contractCode = suggestion.split(' - ')[0];
    setContractInput(contractCode);
    
    const contractType = contractCode.slice(0, 3);
    const expiration = contractCode.slice(3, 4);
    
    setFormData(prev => ({
      ...prev,
      contractType,
      expiration
    }));
    
    setShowSuggestions(false);
  };

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
    
    if (!contractInput || contractInput.length < 4) {
      newErrors.expiration = 'Contrato é obrigatório (ex: BGIK25)';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Usar o código do contrato diretamente do input
    const contractCode = contractInput.toUpperCase();

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
    setContractInput('');
    setSuggestions([]);
    setShowSuggestions(false);
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
            {/* Campo de Contrato com Autocomplete */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label required">Contrato</label>
              <input
                ref={inputRef}
                type="text"
                className={`form-input ${errors.expiration ? 'error' : ''}`}
                value={contractInput}
                onChange={(e) => handleContractInputChange(e.target.value)}
                onFocus={() => contractInput && setShowSuggestions(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Digite BGI, CCM ou código completo (ex: BGIK25)"
                autoComplete="off"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: index < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(suggestion)}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.background = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <div style={{ fontWeight: '600', color: 'var(--text-bright)' }}>
                        {suggestion.split(' - ')[0]}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {suggestion.split(' - ')[1]}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.expiration && <span className="error-message">{errors.expiration}</span>}
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