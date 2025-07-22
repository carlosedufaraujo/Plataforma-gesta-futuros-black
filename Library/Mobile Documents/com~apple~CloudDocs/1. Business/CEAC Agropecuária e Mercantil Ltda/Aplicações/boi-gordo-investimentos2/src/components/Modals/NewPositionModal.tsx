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
      <div className="modal-container position-modal">
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-title-section">
              <h2 className="modal-title">
                {editingPosition ? 'Editar Posição' : 'Nova Posição'}
              </h2>
              <p className="modal-subtitle">
                {editingPosition 
                  ? 'Altere os dados da posição selecionada'
                  : positions.length > 1 
                    ? `Cadastre ${positions.length} posições na mesma data`
                    : 'Cadastre uma nova posição no sistema'
                }
              </p>
            </div>
            <button className="modal-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="position-form">
            
            {/* Seção 1: Data da Operação */}
            <div className="form-section primary-section">
              <div className="section-header">
                <div className="section-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div className="section-title-group">
                  <h3 className="section-title">Data da Operação</h3>
                  <p className="section-description">Defina quando as posições foram executadas</p>
                </div>
              </div>
              
              <div className="date-input-container">
                <div className="form-group">
                  <label className="form-label">Data de Execução</label>
                  <input 
                    type="date" 
                    className="form-input date-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  <div className="input-hint">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M8 12l2 2 4-4"></path>
                    </svg>
                    Data padrão: {new Date().toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Lista de Posições */}
            <div className="form-section positions-section">
              <div className="section-header">
                <div className="section-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18"></path>
                    <path d="M7 12l4-4 4 4 6-6"></path>
                  </svg>
                </div>
                <div className="section-title-group">
                  <h3 className="section-title">Posições</h3>
                  <p className="section-description">
                    {positions.length === 1 
                      ? 'Configure os dados da sua posição'
                      : `${positions.length} posições serão criadas na mesma data`
                    }
                  </p>
                </div>
                <div className="section-actions">
                  <div className="positions-counter">
                    <span className="counter-badge">{positions.length}</span>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-success btn-sm add-position-btn"
                    onClick={addNewPosition}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Lista de Posições */}
              <div className="positions-list">
                {positions.map((position, index) => (
                  <div key={position.id} className="position-card">
                    
                    {/* Header da Posição */}
                    <div className="position-card-header">
                      <div className="position-number">
                        <span className="position-badge">#{index + 1}</span>
                      </div>
                      <div className="position-title">
                        <h4>Posição {index + 1}</h4>
                        {position.contractInput && (
                          <span className="position-preview">{position.contractInput} - {position.direction}</span>
                        )}
                      </div>
                      {positions.length > 1 && (
                        <button 
                          type="button" 
                          className="btn btn-danger btn-xs remove-position-btn"
                          onClick={() => removePosition(position.id)}
                          title="Remover esta posição"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Formulário da Posição */}
                    <div className="position-form-content">
                      
                      {/* Linha 1: Contrato */}
                      <div className="form-row contract-row">
                        <div className="form-group contract-group">
                          <label className="form-label required">Contrato</label>
                          <div className="autocomplete-container">
                            <input 
                              ref={inputRef}
                              type="text"
                              className={`form-input contract-input ${errors.expiration ? 'error' : ''}`}
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
                                    <div className="suggestion-content">
                                      <span className="suggestion-contract">{suggestion.split(' - ')[0]}</span>
                                      <span className="suggestion-desc">{suggestion.split(' - ')[1]}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {errors.expiration && <span className="error-message">{errors.expiration}</span>}
                          <div className="input-hint">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M8 12l2 2 4-4"></path>
                            </svg>
                            Digite as primeiras letras para buscar
                          </div>
                        </div>
                      </div>

                      {/* Linha 2: Operação */}
                      <div className="form-row operation-row">
                        <div className="form-group">
                          <label className="form-label required">Direção</label>
                          <div className="direction-selector">
                            <button
                              type="button"
                              className={`direction-btn long ${position.direction === 'LONG' ? 'active' : ''}`}
                              onClick={() => updatePosition(position.id, 'direction', 'LONG')}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M7 17l9.2-9.2M17 17V7H7"></path>
                              </svg>
                              LONG
                              <span className="direction-label">Compra</span>
                            </button>
                            <button
                              type="button"
                              className={`direction-btn short ${position.direction === 'SHORT' ? 'active' : ''}`}
                              onClick={() => updatePosition(position.id, 'direction', 'SHORT')}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 7l-9.2 9.2M7 7v10h10"></path>
                              </svg>
                              SHORT
                              <span className="direction-label">Venda</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Linha 3: Quantidade e Preço */}
                      <div className="form-row main-data-row">
                        <div className="form-group">
                          <label className="form-label required">Quantidade</label>
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
                          <label className="form-label required">Preço de Entrada</label>
                          <div className="price-input-container">
                            <span className="currency-symbol">R$</span>
                            <input 
                              type="text" 
                              className={`form-input price-input ${errors.price ? 'error' : ''}`}
                              value={position.price}
                              onChange={(e) => updatePosition(position.id, 'price', e.target.value)}
                              placeholder="350,50"
                            />
                          </div>
                          {errors.price && <span className="error-message">{errors.price}</span>}
                        </div>
                      </div>

                      {/* Linha 4: Risk Management (Opcional) */}
                      <div className="form-section risk-section">
                        <div className="risk-header">
                          <h5 className="risk-title">Gestão de Risco (Opcional)</h5>
                          <span className="optional-badge">Opcional</span>
                        </div>
                        
                        <div className="form-row risk-row">
                          <div className="form-group">
                            <label className="form-label">Stop Loss</label>
                            <div className="price-input-container">
                              <span className="currency-symbol">R$</span>
                              <input 
                                type="text" 
                                className="form-input price-input"
                                value={position.stopLoss}
                                onChange={(e) => updatePosition(position.id, 'stopLoss', e.target.value)}
                                placeholder="320,00"
                              />
                            </div>
                          </div>
                          
                          <div className="form-group">
                            <label className="form-label">Take Profit</label>
                            <div className="price-input-container">
                              <span className="currency-symbol">R$</span>
                              <input 
                                type="text" 
                                className="form-input price-input"
                                value={position.takeProfit}
                                onChange={(e) => updatePosition(position.id, 'takeProfit', e.target.value)}
                                placeholder="400,00"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer com Ações */}
            <div className="modal-footer">
              <div className="footer-summary">
                <div className="summary-info">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 12l2 2 4-4"></path>
                  </svg>
                  <span>
                    {positions.length} posição{positions.length > 1 ? 'ões' : ''} • Data: {new Date(selectedDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              
              <div className="footer-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-large">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                  {editingPosition ? 'Atualizar Posição' : `Criar ${positions.length} Posição${positions.length > 1 ? 'ões' : ''}`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 