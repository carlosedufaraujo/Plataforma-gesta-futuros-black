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

interface PositionData {
  id: string;
  contract: string;
  contractDisplay: string;
  direction: 'LONG' | 'SHORT';
  quantity: string;
  price: string;
}

export default function NewPositionModal({ isOpen, onClose, onSubmit, editingPosition }: NewPositionModalProps) {
  const { activeExpirations } = useExpirations();
  
  // Função para obter data e hora atual no formato datetime-local
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Estados principais
  const [executionDate, setExecutionDate] = useState(() => getCurrentDateTime());

  const [positions, setPositions] = useState<PositionData[]>([{
    id: '1',
    contract: '',
    contractDisplay: '',
    direction: 'LONG',
    quantity: '',
    price: ''
  }]);

  const [contractSuggestions, setContractSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<Record<string, boolean>>({});

  // Gerar sugestões de contratos
  const generateContractSuggestions = () => {
    const contracts: string[] = [];
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

  // Atualizar posição
  const updatePosition = (id: string, field: keyof PositionData, value: string) => {
    setPositions(prev => prev.map(pos => 
      pos.id === id ? { ...pos, [field]: value } : pos
    ));
  };

  // Adicionar nova posição
  const addPosition = () => {
    const newId = (positions.length + 1).toString();
    setPositions(prev => [...prev, {
      id: newId,
      contract: '',
      contractDisplay: '',
      direction: 'LONG',
      quantity: '',
      price: ''
    }]);
  };

  // Remover posição
  const removePosition = (id: string) => {
    if (positions.length > 1) {
      setPositions(prev => prev.filter(pos => pos.id !== id));
    }
  };

  // Filtrar sugestões
  const filterSuggestions = (input: string) => {
    const allSuggestions = generateContractSuggestions();
    return allSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(input.toLowerCase())
    );
  };

  // Selecionar sugestão
  const selectSuggestion = (positionId: string, suggestion: string) => {
    const contractCode = suggestion.split(' - ')[0];
    updatePosition(positionId, 'contract', contractCode);
    updatePosition(positionId, 'contractDisplay', suggestion);
    setShowSuggestions(prev => ({ ...prev, [positionId]: false }));
  };

  // Submeter formulário
  const handleSubmit = () => {
    // Validação básica
    const isValid = positions.every(pos => 
      pos.contract && pos.quantity && pos.price
    );

    if (!isValid) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Processar cada posição
    positions.forEach(pos => {
      const positionData: Omit<Position, 'id'> = {
        user_id: 'current_user',
        contract_id: `contract_${Date.now()}`,
        contract: pos.contract,
        direction: pos.direction,
        quantity: parseInt(pos.quantity),
        entry_price: parseFloat(pos.price),
        current_price: parseFloat(pos.price),
        status: 'OPEN',
        entry_date: new Date(executionDate).toISOString(),
        fees: 0,
        unrealized_pnl: 0,
        pnl_percentage: 0
      };
      onSubmit(positionData);
    });

    onClose();
  };

  // Reset ao fechar e configurar ao abrir
  useEffect(() => {
    if (isOpen) {
      // Sempre usar data e hora atual
      setExecutionDate(getCurrentDateTime());
      
      if (editingPosition) {
        // Modo edição: configurar com dados da posição
        setPositions([{
          id: '1',
          contract: editingPosition.contract,
          contractDisplay: editingPosition.contract,
          direction: editingPosition.direction,
          quantity: editingPosition.quantity.toString(),
          price: editingPosition.entry_price.toString()
        }]);
      } else {
        // Modo nova posição: resetar
        setPositions([{
          id: '1',
          contract: '',
          contractDisplay: '',
          direction: 'LONG',
          quantity: '',
          price: ''
        }]);
      }
    }
  }, [isOpen, editingPosition]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal position-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{editingPosition ? 'Editar Posição' : 'Nova Posição'}</h2>
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
          {/* Seção Superior: Data, Card Posições e Controles */}
          <div className="modal-top-section">
            <div className="execution-date-container">
              <label htmlFor="execution-date" className="field-label">Data e Horário de Execução</label>
              <div className="date-input-group">
                <input
                  id="execution-date"
                  type="datetime-local"
                  value={executionDate}
                  onChange={(e) => setExecutionDate(e.target.value)}
                  className="date-input"
                />
                <button 
                  type="button"
                  onClick={() => setExecutionDate(getCurrentDateTime())}
                  className="current-time-btn"
                  title="Usar horário atual"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            {/* Card de Posições */}
            <div className="positions-card-horizontal">
              <div className="positions-info">
                <span className="positions-label">Posições</span>
                <span className="positions-count-horizontal">{positions.length}</span>
              </div>
            </div>
            
            {!editingPosition && (
              <div className="add-position-container">
                <label className="field-label">Adicionar</label>
                <button className="add-position-btn-inline" onClick={addPosition} title="Adicionar nova posição">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Lista de Posições */}
          <div className="positions-section">
            {positions.map((position, index) => (
              <div key={position.id} className="position-card">
                {/* ID da Posição */}
                <div className="position-id-badge">
                  <span className="position-id">P{String(index + 1).padStart(2, '0')}</span>
                </div>
                
                {/* Header do Card */}
                <div className="position-card-header">
                  {positions.length > 1 && (
                    <button 
                      className="remove-position-btn"
                      onClick={() => removePosition(position.id)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Campos do Formulário */}
                <div className="position-fields">
                  {/* Contrato */}
                  <div className="field-group contract-field">
                    <label className="field-label">Contrato</label>
                    <div className="autocomplete-container">
                      <input
                        type="text"
                        value={position.contractDisplay}
                        onChange={(e) => {
                          updatePosition(position.id, 'contractDisplay', e.target.value);
                          const suggestions = filterSuggestions(e.target.value);
                          setContractSuggestions(suggestions);
                          setShowSuggestions(prev => ({ ...prev, [position.id]: suggestions.length > 0 }));
                        }}
                        onFocus={() => {
                          const suggestions = generateContractSuggestions();
                          setContractSuggestions(suggestions);
                          setShowSuggestions(prev => ({ ...prev, [position.id]: true }));
                        }}
                        className="contract-input"
                        placeholder="Ex: BGIK25"
                      />
                      {showSuggestions[position.id] && contractSuggestions.length > 0 && (
                        <div className="suggestions-dropdown">
                          {contractSuggestions.slice(0, 5).map((suggestion, idx) => (
                            <div
                              key={idx}
                              className="suggestion-item"
                              onClick={() => selectSuggestion(position.id, suggestion)}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direção */}
                  <div className="field-group direction-field">
                    <label className="field-label">Direção</label>
                    <div className="direction-buttons">
                      <button
                        type="button"
                        className={`direction-btn ${position.direction === 'LONG' ? 'active long' : ''}`}
                        onClick={() => updatePosition(position.id, 'direction', 'LONG')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m18 15-6-6-6 6"/>
                        </svg>
                        LONG
                      </button>
                      <button
                        type="button"
                        className={`direction-btn ${position.direction === 'SHORT' ? 'active short' : ''}`}
                        onClick={() => updatePosition(position.id, 'direction', 'SHORT')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6,9 12,15 18,9"/>
                        </svg>
                        SHORT
                      </button>
                    </div>
                  </div>

                  {/* Quantidade */}
                  <div className="field-group quantity-field">
                    <label className="field-label">Qtd</label>
                    <input
                      type="number"
                      value={position.quantity}
                      onChange={(e) => updatePosition(position.id, 'quantity', e.target.value)}
                      className="quantity-input"
                      placeholder="0"
                      min="1"
                    />
                  </div>

                  {/* Preço */}
                  <div className="field-group price-field">
                    <label className="field-label">Preço</label>
                    <div className="price-input-container">
                      <span className="currency-symbol">R$</span>
                      <input
                        type="number"
                        value={position.price}
                        onChange={(e) => updatePosition(position.id, 'price', e.target.value)}
                        className="price-input"
                        placeholder="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>


        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-register" onClick={handleSubmit}>
            Cadastrar
          </button>
        </div>
      </div>
    </div>
  );
} 