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

interface PositionItem {
  id: string;
  contractInput: string;
  contractType: string;
  expiration: string;
  direction: 'LONG' | 'SHORT';
  quantity: string;
  price: string;
  stopLoss: string;
  takeProfit: string;
}

export default function NewPositionModal({ isOpen, onClose, onSubmit, editingPosition }: NewPositionModalProps) {
  const { activeExpirations } = useExpirations();
  
  // Data atual formatada para input date
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [positions, setPositions] = useState<PositionItem[]>([
    {
      id: '1',
      contractInput: editingPosition?.contract || '',
      contractType: editingPosition?.contract.slice(0, 3) || 'BGI',
      expiration: editingPosition?.contract.slice(3, 4) || '',
      direction: editingPosition?.direction || 'LONG',
      quantity: editingPosition?.quantity.toString() || '',
      price: editingPosition?.entryPrice.toString() || '',
      stopLoss: editingPosition?.stopLoss?.toString() || '',
      takeProfit: editingPosition?.takeProfit?.toString() || ''
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Definir primeiro vencimento ativo como padrão
  useEffect(() => {
    if (activeExpirations.length > 0 && !positions[0].expiration) {
      setPositions(prev => prev.map(pos => ({ ...pos, expiration: activeExpirations[0].code })));
    }
  }, [activeExpirations, positions]);

  // Sincronizar contractInput quando editingPosition mudar
  useEffect(() => {
    if (editingPosition) {
      setPositions(prev => prev.map(pos => ({
        ...pos,
        contractInput: editingPosition.contract,
        contractType: editingPosition.contract.slice(0, 3),
        expiration: editingPosition.contract.slice(3, 4),
        direction: editingPosition.direction,
        quantity: editingPosition.quantity.toString(),
        price: editingPosition.entryPrice.toString(),
        stopLoss: editingPosition.stopLoss?.toString() || '',
        takeProfit: editingPosition.takeProfit?.toString() || ''
      })));
    }
  }, [editingPosition]);

  // Função para adicionar nova posição à lista
  const addNewPosition = () => {
    const newId = (positions.length + 1).toString();
    const newPosition: PositionItem = {
      id: newId,
      contractInput: '',
      contractType: 'BGI',
      expiration: activeExpirations.length > 0 ? activeExpirations[0].code : '',
      direction: 'LONG',
      quantity: '',
      price: '',
      stopLoss: '',
      takeProfit: ''
    };
    setPositions(prev => [...prev, newPosition]);
  };

  // Função para remover posição da lista
  const removePosition = (id: string) => {
    if (positions.length > 1) {
      setPositions(prev => prev.filter(pos => pos.id !== id));
    }
  };

  // Função para atualizar posição específica
  const updatePosition = (id: string, field: string, value: string) => {
    setPositions(prev => prev.map(pos => 
      pos.id === id ? { ...pos, [field]: value } : pos
    ));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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
  const handleContractInputChange = (id: string, value: string) => {
    updatePosition(id, 'contractInput', value);
    
    if (value.length > 0) {
      const filtered = filterSuggestions(value);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setActiveSuggestionIndex(-1);
      
      // Auto-parse se o formato estiver correto (ex: BGIK25)
      if (value.length >= 4) {
        const contractType = value.slice(0, 3).toUpperCase();
        const expiration = value.slice(3, 4).toUpperCase();
        
        if ((contractType === 'BGI' || contractType === 'CCM') && 
            activeExpirations.some(exp => exp.code === expiration)) {
          updatePosition(id, 'contractType', contractType);
          updatePosition(id, 'expiration', expiration);
        }
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (id: string, suggestion: string) => {
    const contractCode = suggestion.split(' - ')[0];
    updatePosition(id, 'contractInput', contractCode);
    
    const contractType = contractCode.slice(0, 3);
    const expiration = contractCode.slice(3, 4);
    
    updatePosition(id, 'contractType', contractType);
    updatePosition(id, 'expiration', expiration);
    
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    const newErrors: Record<string, string> = {};
    
    if (!positions[0].quantity || parseInt(positions[0].quantity) <= 0) {
      newErrors.quantity = 'Quantidade é obrigatória e deve ser maior que zero';
    }
    
    if (!positions[0].price || parseFloat(positions[0].price) <= 0) {
      newErrors.price = 'Preço de entrada é obrigatório e deve ser maior que zero';
    }
    
    if (!positions[0].contractInput || positions[0].contractInput.length < 4) {
      newErrors.expiration = 'Contrato é obrigatório (ex: BGIK25)';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Usar o código do contrato diretamente do input
    const contractCode = positions[0].contractInput.toUpperCase();

    const newPosition: Omit<Position, 'id'> = {
      contract: contractCode,
      direction: positions[0].direction,
      quantity: parseInt(positions[0].quantity),
      entryPrice: parseFloat(positions[0].price.replace('R$ ', '').replace('.', '').replace(',', '.')),
      currentPrice: parseFloat(positions[0].price.replace('R$ ', '').replace('.', '').replace(',', '.')),
      stopLoss: positions[0].stopLoss ? parseFloat(positions[0].stopLoss.replace('R$ ', '').replace('.', '').replace(',', '.')) : undefined,
      takeProfit: positions[0].takeProfit ? parseFloat(positions[0].takeProfit.replace('R$ ', '').replace('.', '').replace(',', '.')) : undefined,
      status: 'OPEN',
      openDate: new Date().toISOString(),
    };

    onSubmit(newPosition);
    onClose();
    
    // Reset form
    setPositions([{
      id: '1',
      contractInput: activeExpirations.length > 0 ? activeExpirations[0].code : '',
      contractType: 'BGI',
      expiration: activeExpirations.length > 0 ? activeExpirations[0].code : '',
      direction: 'LONG',
      quantity: '',
      price: '',
      stopLoss: '',
      takeProfit: ''
    }]);
    setContractInput('');
    setSuggestions([]);
    setShowSuggestions(false);
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setPositions(prev => prev.map(pos => ({
      ...pos,
      [field]: value
    })));
    
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
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">
            {editingPosition ? 'Editar Posição' : 'Nova Posição'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            
            {/* Data da Operação */}
            <div className="form-group">
              <label className="form-label">Data de Execução</label>
              <input 
                type="date" 
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Posições */}
            <div className="form-section">
              <div className="form-section-header">
                <h3 className="form-section-title">
                  Posições ({positions.length})
                </h3>
                <button 
                  type="button" 
                  className="btn btn-success btn-sm"
                  onClick={addNewPosition}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Adicionar
                </button>
              </div>

              {positions.map((position, index) => (
                <div key={position.id} className="position-item">
                  
                  {/* Header da posição */}
                  {positions.length > 1 && (
                    <div className="position-header">
                      <span className="position-number">Posição #{index + 1}</span>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm"
                        onClick={() => removePosition(position.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                        </svg>
                        Remover
                      </button>
                    </div>
                  )}

                  {/* Contrato */}
                  <div className="form-group">
                    <label className="form-label">Contrato</label>
                    <div className="autocomplete-container">
                      <input 
                        ref={inputRef}
                        type="text"
                        className={`form-input ${errors.expiration ? 'error' : ''}`}
                        value={position.contractInput}
                        onChange={(e) => handleContractInputChange(position.id, e.target.value)}
                        onFocus={() => position.contractInput && setShowSuggestions(suggestions.length > 0)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Ex: BGIK25, CCMN25"
                      />
                      
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="autocomplete-suggestions">
                          {suggestions.map((suggestion, idx) => (
                            <div 
                              key={idx}
                              className={`suggestion-item ${idx === activeSuggestionIndex ? 'active' : ''}`}
                              onClick={() => selectSuggestion(position.id, suggestion)}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.expiration && <span className="error-message">{errors.expiration}</span>}
                  </div>

                  {/* Direção */}
                  <div className="form-group">
                    <label className="form-label">Direção</label>
                    <div className="direction-selector">
                      <button
                        type="button"
                        className={`direction-btn ${position.direction === 'LONG' ? 'active long' : ''}`}
                        onClick={() => updatePosition(position.id, 'direction', 'LONG')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M7 17l9.2-9.2M17 17V7H7"></path>
                        </svg>
                        LONG
                      </button>
                      <button
                        type="button"
                        className={`direction-btn ${position.direction === 'SHORT' ? 'active short' : ''}`}
                        onClick={() => updatePosition(position.id, 'direction', 'SHORT')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 7l-9.2 9.2M7 7v10h10"></path>
                        </svg>
                        SHORT
                      </button>
                    </div>
                  </div>

                  {/* Quantidade e Preço */}
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Quantidade</label>
                      <input 
                        type="number" 
                        className={`form-input ${errors.quantity ? 'error' : ''}`}
                        value={position.quantity}
                        onChange={(e) => updatePosition(position.id, 'quantity', e.target.value)}
                        min="1"
                        placeholder="10"
                      />
                      {errors.quantity && <span className="error-message">{errors.quantity}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Preço de Entrada</label>
                      <input 
                        type="text" 
                        className={`form-input ${errors.price ? 'error' : ''}`}
                        value={position.price}
                        onChange={(e) => updatePosition(position.id, 'price', e.target.value)}
                        placeholder="350,50"
                      />
                      {errors.price && <span className="error-message">{errors.price}</span>}
                    </div>
                  </div>

                  {/* Stop Loss e Take Profit */}
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Stop Loss (Opcional)</label>
                      <input 
                        type="text" 
                        className="form-input"
                        value={position.stopLoss}
                        onChange={(e) => updatePosition(position.id, 'stopLoss', e.target.value)}
                        placeholder="320,00"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Take Profit (Opcional)</label>
                      <input 
                        type="text" 
                        className="form-input"
                        value={position.takeProfit}
                        onChange={(e) => updatePosition(position.id, 'takeProfit', e.target.value)}
                        placeholder="400,00"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ações */}
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editingPosition ? 'Atualizar' : `Criar ${positions.length} Posição${positions.length > 1 ? 'ões' : ''}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 