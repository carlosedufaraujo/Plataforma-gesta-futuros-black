'use client';

import { useState, useEffect } from 'react';
import { Position } from '@/types';

interface Contract {
  id: string;
  symbol: string;
  contract_type: string;
  name: string;
  expiration_date: string;
  contract_size: number;
  unit: string;
  current_price?: number;
  is_active: boolean;
}

interface NewPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (position: Omit<Position, 'id'>) => void;
  editingPosition?: Position | null;
}

export default function NewPositionModal({ isOpen, onClose, onSubmit, editingPosition }: NewPositionModalProps) {
  // Estados do formulário
  const [formData, setFormData] = useState({
    contract: '',
    contractDisplay: '',
    direction: 'COMPRA' as 'COMPRA' | 'VENDA',
    quantity: '',
    price: '',
    executionDate: getCurrentDateTime()
  });

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractSuggestions, setContractSuggestions] = useState<Contract[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loadingContracts, setLoadingContracts] = useState(false);

  // Função para obter data e hora atual no formato datetime-local
  function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Carregar contratos do Supabase
  const loadContracts = async () => {
    try {
      setLoadingContracts(true);
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        'https://kdfevkbwohcajcwrqzor.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZmV2a2J3b2hjYWpjd3Jxem9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTUzODcsImV4cCI6MjA2ODg5MTM4N30.4nBjKi3rdpfbYmxeoa8GELdBLq8JY6ym68cJX7jpaus'
      );
      
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('is_active', true)
        .order('symbol');
      
      if (error) {
        console.error('❌ Erro ao carregar contratos:', error);
        return;
      }
      
      setContracts(data || []);
      console.log('✅ Contratos carregados:', data?.length || 0);
    } catch (err) {
      console.error('❌ Erro ao conectar com Supabase:', err);
    } finally {
      setLoadingContracts(false);
    }
  };

  // Carregar contratos quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadContracts();
    }
  }, [isOpen]);

  // Buscar contrato por símbolo
  const findContractBySymbol = (symbol: string): Contract | null => {
    return contracts.find(contract => 
      contract.symbol.toLowerCase() === symbol.toLowerCase()
    ) || null;
  };

  // Filtrar sugestões baseado na entrada
  const filterSuggestions = (input: string) => {
    if (!input.trim()) return [];
    
    return contracts.filter(contract =>
      contract.symbol.toLowerCase().includes(input.toLowerCase()) ||
      contract.name.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5); // Limitar a 5 sugestões
  };

  // Selecionar sugestão
  const selectSuggestion = (contract: Contract) => {
    setFormData(prev => ({
      ...prev,
      contract: contract.symbol,
      contractDisplay: `${contract.symbol} - ${contract.name}`,
      price: contract.current_price?.toString() || prev.price
    }));
    setSelectedContract(contract);
    setShowSuggestions(false);
    
    // Limpar erro se existir
    if (errors.contract) {
      setErrors(prev => ({ ...prev, contract: '' }));
    }
  };

  // Atualizar campo de contrato
  const handleContractChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      contract: value,
      contractDisplay: value
    }));
    
    // Buscar contrato correspondente
    const contract = findContractBySymbol(value);
    setSelectedContract(contract);
    
    // Mostrar sugestões se há entrada
    if (value.trim()) {
      const suggestions = filterSuggestions(value);
      setContractSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
      setContractSuggestions([]);
    }
    
    // Limpar erro do campo
    if (errors.contract) {
      setErrors(prev => ({ ...prev, contract: '' }));
    }
  };

  // Atualizar outros campos
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validação
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.contract.trim()) {
      newErrors.contract = 'Contrato é obrigatório';
    } else {
      // Verificar se o contrato existe no Supabase
      const contract = findContractBySymbol(formData.contract);
      if (!contract) {
        newErrors.contract = `Contrato ${formData.contract.toUpperCase()} não encontrado`;
      } else if (!contract.is_active) {
        newErrors.contract = `Contrato ${formData.contract.toUpperCase()} está inativo`;
      }
    }

    if (!formData.quantity.trim() || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantidade deve ser maior que zero';
    }

    if (!formData.price.trim() || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    }

    if (!formData.executionDate.trim()) {
      newErrors.executionDate = 'Data de execução é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Buscar dados do contrato no Supabase
    const contract = findContractBySymbol(formData.contract);
    if (!contract) {
      setErrors({ contract: `Contrato ${formData.contract.toUpperCase()} não encontrado` });
      return;
    }
    
    const positionData: Omit<Position, 'id'> = {
      // Campos obrigatórios para Supabase
      user_id: '2dc60bee-5466-4f7e-8e1d-00cf91ee6e97', // UUID válido
      brokerage_id: '6b75b1d7-8cea-4823-9c2f-2ff236d32da6', // UUID válido
      contract_id: contract.id, // ID do contrato do Supabase
      contract: contract.symbol,
      direction: formData.direction,
      quantity: parseInt(formData.quantity),
      entry_price: parseFloat(formData.price),
      current_price: parseFloat(formData.price),
      entry_date: new Date(formData.executionDate).toISOString(),
      status: 'EM_ABERTO',
      
      // Campos do contrato
      symbol: contract.symbol,
      name: contract.name,
      contract_size: contract.contract_size,
      unit: contract.unit,
      exposure: parseFloat(formData.price) * parseInt(formData.quantity) * contract.contract_size,
      fees: 0,
      realized_pnl: 0,
      unrealized_pnl: 0,
      
      // Campos opcionais
      stop_loss: undefined,
      take_profit: undefined,
      exit_date: undefined,
      exit_price: undefined,
      pnl_percentage: undefined
    };

    console.log('📊 Criando posição com contrato:', contract.symbol, contract.name);
    onSubmit(positionData);

    // Reset form
    setFormData({
      contract: '',
      contractDisplay: '',
              direction: 'COMPRA',
      quantity: '',
      price: '',
      executionDate: getCurrentDateTime()
    });
    setSelectedContract(null);
    setErrors({});
    onClose();
  };

  // Carregar dados se estiver editando
  useEffect(() => {
    if (editingPosition) {
      setFormData({
        contract: editingPosition.contract,
        contractDisplay: editingPosition.contract,
        direction: editingPosition.direction,
        quantity: editingPosition.quantity.toString(),
        price: editingPosition.entry_price.toString(),
        executionDate: new Date(editingPosition.entry_date).toISOString().slice(0, 16)
      });
      
      // Buscar contrato correspondente
      const contract = findContractBySymbol(editingPosition.contract);
      setSelectedContract(contract);
    } else {
      setFormData({
        contract: '',
        contractDisplay: '',
        direction: 'COMPRA',
        quantity: '',
        price: '',
        executionDate: getCurrentDateTime()
      });
      setSelectedContract(null);
    }
    setErrors({});
  }, [editingPosition, isOpen, contracts]);

  if (!isOpen) return null;

  // Calcular estimativa de exposição
  const quantity = parseInt(formData.quantity) || 0;
  const price = parseFloat(formData.price) || 0;
  const contractSize = selectedContract?.contract_size || 330;
  const estimatedExposure = quantity * price * contractSize;

  return (
    <div className="modal-overlay">
      <div className="modal position-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{editingPosition ? 'Editar Posição' : 'Nova Posição'}</h2>
            <span className="modal-subtitle">
              {selectedContract ? `${selectedContract.symbol} - ${selectedContract.name}` : 'Selecione um contrato'}
            </span>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* Body */}
        <div className="modal-body">
          {/* Informações do Contrato Selecionado */}
          {selectedContract && (
            <div className="position-summary">
              <div className="summary-row">
                <span className="summary-label">Contrato</span>
                <span className="summary-value">{selectedContract.symbol}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Produto</span>
                <span className="summary-value">{selectedContract.name}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Tamanho</span>
                <span className="summary-value">{selectedContract.contract_size} {selectedContract.unit}</span>
              </div>
              {selectedContract.current_price && (
                <div className="summary-row">
                  <span className="summary-label">Preço Atual</span>
                  <span className="summary-value">
                    {selectedContract.current_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="position-form">
            {/* Seleção de Contrato */}
            <div className="form-row">
              <div className="field-group full-width">
                <label className="field-label">Contrato</label>
                <div className="contract-input-container">
                  <input
                    type="text"
                    className={`form-input ${errors.contract ? 'error' : ''}`}
                    value={formData.contract}
                    onChange={(e) => handleContractChange(e.target.value)}
                    onFocus={() => {
                      if (formData.contract.trim()) {
                        const suggestions = filterSuggestions(formData.contract);
                        setContractSuggestions(suggestions);
                        setShowSuggestions(suggestions.length > 0);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder="Digite o símbolo (ex: BGIF25, CCMK25)"
                    disabled={loadingContracts}
                  />
                  
                  {loadingContracts && (
                    <div className="loading-indicator">
                      <div className="spinner-small"></div>
                    </div>
                  )}
                  
                  {showSuggestions && contractSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {contractSuggestions.map((contract) => (
                        <div
                          key={contract.id}
                          className="suggestion-item"
                          onClick={() => selectSuggestion(contract)}
                        >
                          <div className="suggestion-symbol">{contract.symbol}</div>
                          <div className="suggestion-name">{contract.name}</div>
                          <div className="suggestion-details">
                            {contract.contract_size} {contract.unit}
                            {contract.current_price && (
                              <span className="suggestion-price">
                                R$ {contract.current_price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.contract && <span className="error-message">{errors.contract}</span>}
              </div>
            </div>

            {/* Campos principais horizontais */}
            <div className="form-row horizontal-close-fields">
              <div className="field-group flex-1">
                <label className="field-label">Direção</label>
                <select
                  className="form-input"
                  value={formData.direction}
                  onChange={(e) => handleChange('direction', e.target.value)}
                >
                                  <option value="COMPRA">COMPRA</option>
                <option value="VENDA">VENDA</option>
                </select>
              </div>
              
              <div className="field-group flex-1">
                <label className="field-label">Quantidade</label>
                <input
                  type="number"
                  className={`form-input ${errors.quantity ? 'error' : ''}`}
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  placeholder="Contratos"
                  min="1"
                />
                {errors.quantity && <span className="error-message">{errors.quantity}</span>}
              </div>
            </div>

            {/* Preço e Data */}
            <div className="form-row horizontal-close-fields">
              <div className="field-group flex-1">
                <label className="field-label">Preço de Entrada</label>
                <div className="price-input-container-fixed">
                  <span className="currency-symbol-fixed">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    className={`form-input price-input-fixed ${errors.price ? 'error' : ''}`}
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="0,00"
                    min="0.01"
                  />
                </div>
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>
              
              <div className="field-group flex-1">
                <label className="field-label">Data de Execução</label>
                <input
                  type="datetime-local"
                  className={`form-input ${errors.executionDate ? 'error' : ''}`}
                  value={formData.executionDate}
                  onChange={(e) => handleChange('executionDate', e.target.value)}
                />
                {errors.executionDate && <span className="error-message">{errors.executionDate}</span>}
              </div>
            </div>

            {/* Estimativa de Exposição */}
            {estimatedExposure > 0 && selectedContract && (
              <div className="pnl-card">
                <div className="pnl-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                  </svg>
                  <span className="pnl-title">Resumo da Operação</span>
                </div>
                <div className="pnl-content">
                  <div className="pnl-amount">
                    {estimatedExposure.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className="pnl-details">
                    <span className="pnl-detail-item">
                      <span className="detail-label">Exposição Total:</span>
                      <span className="detail-value">
                        {quantity} × R$ {parseFloat(formData.price || '0').toFixed(2)} × {contractSize.toLocaleString()}
                      </span>
                    </span>
                    <span className="pnl-detail-item">
                      <span className="detail-label">Variação por ponto:</span>
                      <span className="detail-value">
                        {(quantity * contractSize).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loadingContracts}
          >
            {editingPosition ? 'Salvar Alterações' : 'Criar Posição'}
          </button>
        </div>
      </div>
    </div>
  );
} 