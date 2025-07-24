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
    direction: 'LONG' as 'LONG' | 'SHORT',
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
      user_id: 'current-user-id', // Será substituído no SupabaseDataContext
      brokerage_id: 'current-brokerage-id', // Será substituído no SupabaseDataContext
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
      direction: 'LONG',
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
        direction: 'LONG',
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
        <div className="modal-header">
          <h3>{editingPosition ? 'Editar Posição' : 'Nova Posição'}</h3>
          <button className="modal-close" onClick={onClose} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label required">Contrato</label>
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
                    // Delay para permitir clique na sugestão
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
              {errors.contract && <div className="error-message">{errors.contract}</div>}
              
              {selectedContract && (
                <div className="contract-info">
                  <span className="contract-details">
                    {selectedContract.name} • {selectedContract.contract_size} {selectedContract.unit}
                    {selectedContract.current_price && (
                      <span> • R$ {selectedContract.current_price.toFixed(2)}</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label required">Direção</label>
              <select
                className="form-select"
                value={formData.direction}
                onChange={(e) => handleChange('direction', e.target.value)}
              >
                <option value="LONG">LONG (Compra)</option>
                <option value="SHORT">SHORT (Venda)</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label required">Quantidade</label>
              <input
                type="number"
                className={`form-input ${errors.quantity ? 'error' : ''}`}
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                placeholder="Número de contratos"
                min="1"
              />
              {errors.quantity && <div className="error-message">{errors.quantity}</div>}
            </div>

            <div className="form-group">
              <label className="form-label required">Preço</label>
              <input
                type="number"
                step="0.01"
                className={`form-input ${errors.price ? 'error' : ''}`}
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="Preço de entrada"
                min="0.01"
              />
              {errors.price && <div className="error-message">{errors.price}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Data e Hora de Execução</label>
            <input
              type="datetime-local"
              className={`form-input ${errors.executionDate ? 'error' : ''}`}
              value={formData.executionDate}
              onChange={(e) => handleChange('executionDate', e.target.value)}
            />
            {errors.executionDate && <div className="error-message">{errors.executionDate}</div>}
          </div>

          {estimatedExposure > 0 && (
            <div className="exposure-info">
              <span className="exposure-label">Exposição Estimada:</span>
              <span className="exposure-value">
                R$ {estimatedExposure.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loadingContracts}
            >
              {editingPosition ? 'Salvar Alterações' : 'Criar Posição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 