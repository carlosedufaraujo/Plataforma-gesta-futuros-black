'use client';

import { useState, useEffect } from 'react';
import { useHybridData } from '@/contexts/HybridDataContext';

interface Contract {
  id: string;
  symbol: string;
  contract_type: string;
  name: string;
  expiration_date: string;
  contract_size: number;
  unit: string;
  current_price?: number;
  volume?: number;
  is_active: boolean;
  created_at: string;
}

interface ContractFormData {
  symbol: string;
  contract_type: string;
  name: string;
  expiration_date: string;
  contract_size: number;
  unit: string;
  current_price: number;
  is_active: boolean;
}

const MONTH_CODES = {
  '01': 'F', '02': 'G', '03': 'H', '04': 'J', '05': 'K', '06': 'M',
  '07': 'N', '08': 'Q', '09': 'U', '10': 'V', '11': 'X', '12': 'Z'
};

const CONTRACT_TYPES = [
  { value: 'BGI', label: 'Boi Gordo', size: 330, unit: 'arrobas' },
  { value: 'CCM', label: 'Milho', size: 450, unit: 'sacos' },
  { value: 'ICF', label: 'Café', size: 100, unit: 'sacas' },
  { value: 'DOL', label: 'Dólar', size: 50000, unit: 'USD' },
  { value: 'IND', label: 'Índice', size: 1, unit: 'pontos' }
];

export default function ContractManagement() {
  const { backendType } = useHybridData();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados do modal
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState<ContractFormData>({
    symbol: '',
    contract_type: 'BGI',
    name: '',
    expiration_date: '',
    contract_size: 330,
    unit: 'arrobas',
    current_price: 0,
    is_active: true
  });

  // Carregar contratos do Supabase
  const loadContracts = async () => {
    try {
      setLoading(true);
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        'https://kdfevkbwohcajcwrqzor.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZmV2a2J3b2hjYWpjd3Jxem9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTUzODcsImV4cCI6MjA2ODg5MTM4N30.4nBjKi3rdpfbYmxeoa8GELdBLq8JY6ym68cJX7jpaus'
      );
      
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('symbol');
      
      if (error) throw error;
      setContracts(data || []);
    } catch (err) {
      console.error('Erro ao carregar contratos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  // Gerar símbolo automaticamente
  const generateSymbol = (type: string, expirationDate: string) => {
    if (!expirationDate) return '';
    
    const date = new Date(expirationDate);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const monthCode = MONTH_CODES[month as keyof typeof MONTH_CODES] || 'F';
    
    return `${type}${monthCode}${year}`;
  };

  // Atualizar formulário baseado no tipo de contrato
  const handleTypeChange = (type: string) => {
    const contractType = CONTRACT_TYPES.find(ct => ct.value === type);
    if (contractType) {
      setFormData(prev => ({
        ...prev,
        contract_type: type,
        contract_size: contractType.size,
        unit: contractType.unit,
        symbol: generateSymbol(type, prev.expiration_date),
        name: prev.expiration_date ? 
          `${contractType.label} ${new Date(prev.expiration_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}` : 
          ''
      }));
    }
  };

  // Atualizar mês de vencimento e regenerar símbolo/nome
  const handleMonthChange = (month: number) => {
    if (!month) {
      setFormData(prev => ({ ...prev, expiration_date: '', symbol: '', name: '' }));
      return;
    }
    
    // Criar data para o último dia do mês selecionado em 2025
    const year = 2025;
    const lastDay = new Date(year, month, 0).getDate();
    const date = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    if (formData.contract_type) {
      const monthCode = MONTH_CODES[String(month).padStart(2, '0') as keyof typeof MONTH_CODES];
      const yearCode = String(year).slice(-2);
      
      const newSymbol = `${formData.contract_type}${monthCode}${yearCode}`;
      const contractType = CONTRACT_TYPES.find(t => t.value === formData.contract_type);
      const newName = `${contractType?.label} ${new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
      
      setFormData(prev => ({
        ...prev,
        symbol: newSymbol,
        name: newName,
        expiration_date: date
      }));
    } else {
      setFormData(prev => ({ ...prev, expiration_date: date }));
    }
  };

  // Atualizar formulário baseado na data
  const handleDateChange = (date: string) => {
    const contractType = CONTRACT_TYPES.find(ct => ct.value === formData.contract_type);
    setFormData(prev => ({
      ...prev,
      expiration_date: date,
      symbol: generateSymbol(prev.contract_type, date),
      name: date && contractType ? 
        `${contractType.label} ${new Date(date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}` : 
        ''
    }));
  };

  // Salvar contrato
  const handleSave = async () => {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        'https://kdfevkbwohcajcwrqzor.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZmV2a2J3b2hjYWpjd3Jxem9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTUzODcsImV4cCI6MjA2ODg5MTM4N30.4nBjKi3rdpfbYmxeoa8GELdBLq8JY6ym68cJX7jpaus'
      );

      if (editingContract) {
        // Atualizar contrato existente
        const { error } = await supabase
          .from('contracts')
          .update({
            symbol: formData.symbol,
            contract_type: formData.contract_type,
            name: formData.name,
            expiration_date: formData.expiration_date,
            contract_size: formData.contract_size,
            unit: formData.unit,
            current_price: formData.current_price,
            is_active: formData.is_active
          })
          .eq('id', editingContract.id);

        if (error) throw error;
        console.log('✅ Contrato atualizado:', formData.symbol);
      } else {
        // Criar novo contrato
        const { error } = await supabase
          .from('contracts')
          .insert([{
            symbol: formData.symbol,
            contract_type: formData.contract_type,
            name: formData.name,
            expiration_date: formData.expiration_date,
            contract_size: formData.contract_size,
            unit: formData.unit,
            current_price: formData.current_price,
            volume: 0,
            is_active: formData.is_active
          }]);

        if (error) throw error;
        console.log('✅ Novo contrato criado:', formData.symbol);
      }

      // Recarregar lista
      await loadContracts();
      handleCloseModal();
      
      // Feedback visual
      showToast(
        `✅ Contrato ${formData.symbol} ${editingContract ? 'atualizado' : 'criado'} com sucesso!`,
        'success'
      );
    } catch (err) {
      console.error('Erro ao salvar contrato:', err);
      showToast('❌ Erro ao salvar contrato: ' + (err instanceof Error ? err.message : 'Erro desconhecido'), 'error');
    }
  };

  // Alternar status ativo/inativo
  const toggleActive = async (contract: Contract) => {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        'https://kdfevkbwohcajcwrqzor.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZmV2a2J3b2hjYWpjd3Jxem9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTUzODcsImV4cCI6MjA2ODg5MTM4N30.4nBjKi3rdpfbYmxeoa8GELdBLq8JY6ym68cJX7jpaus'
      );

      const { error } = await supabase
        .from('contracts')
        .update({ is_active: !contract.is_active })
        .eq('id', contract.id);

      if (error) throw error;
      
      await loadContracts();
      showToast(`✅ Contrato ${contract.symbol} ${!contract.is_active ? 'ativado' : 'desativado'}!`, 'success');
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      showToast('❌ Erro ao alterar status do contrato', 'error');
    }
  };

  // Excluir contrato
  const deleteContract = async (contract: Contract) => {
    if (!confirm(`Deseja excluir o contrato ${contract.symbol}?\n\nEsta ação não pode ser desfeita e pode afetar posições existentes.`)) {
      return;
    }

    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        'https://kdfevkbwohcajcwrqzor.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZmV2a2J3b2hjYWpjd3Jxem9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTUzODcsImV4cCI6MjA2ODg5MTM4N30.4nBjKi3rdpfbYmxeoa8GELdBLq8JY6ym68cJX7jpaus'
      );

      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contract.id);

      if (error) throw error;
      
      await loadContracts();
      showToast(`✅ Contrato ${contract.symbol} excluído com sucesso!`, 'success');
    } catch (err) {
      console.error('Erro ao excluir contrato:', err);
      showToast('❌ Erro ao excluir contrato', 'error');
    }
  };

  // Abrir modal para novo contrato
  const handleNewContract = () => {
    setEditingContract(null);
    setFormData({
      symbol: '',
      contract_type: 'BGI',
      name: '',
      expiration_date: '',
      contract_size: 330,
      unit: 'arrobas',
      current_price: 0,
      is_active: true
    });
    setShowModal(true);
  };

  // Abrir modal para editar contrato
  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      symbol: contract.symbol,
      contract_type: contract.contract_type,
      name: contract.name,
      expiration_date: contract.expiration_date,
      contract_size: contract.contract_size,
      unit: contract.unit,
      current_price: contract.current_price || 0,
      is_active: contract.is_active
    });
    setShowModal(true);
  };

  // Fechar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingContract(null);
    setFormData({
      symbol: '',
      contract_type: 'BGI',
      name: '',
      expiration_date: '',
      contract_size: 330,
      unit: 'arrobas',
      current_price: 0,
      is_active: true
    });
  };

  // Mostrar toast
  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10002;
      background: ${type === 'success' ? 'var(--color-success)' : 'var(--color-negative)'}; 
      color: white; padding: 12px 20px; border-radius: 8px; font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Carregando contratos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="settings-header">
        <div className="settings-header-main">
          <h2>Gerenciamento de Contratos</h2>
          <p className="settings-subtitle">
            Criar, editar e gerenciar contratos futuros disponíveis para trading
            {backendType === 'supabase' && <span className="backend-badge">Supabase</span>}
          </p>
        </div>
        <div className="settings-actions">
          <button 
            className="btn btn-primary btn-header-action"
            onClick={handleNewContract}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Novo Contrato
          </button>
          <button 
            className="btn btn-secondary btn-header-action"
            onClick={loadContracts}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Erro:</strong> {error}
        </div>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Símbolo</th>
              <th style={{ width: '80px' }}>Tipo</th>
              <th style={{ minWidth: '200px' }}>Nome</th>
              <th style={{ width: '120px' }}>Vencimento</th>
              <th style={{ width: '100px' }}>Tamanho</th>
              <th style={{ width: '100px' }}>Preço</th>
              <th style={{ width: '80px' }}>Status</th>
              <th style={{ width: '200px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(contract => (
              <tr key={contract.id}>
                <td><strong>{contract.symbol}</strong></td>
                <td>{contract.contract_type}</td>
                <td>{contract.name}</td>
                <td>{new Date(contract.expiration_date).toLocaleDateString('pt-BR')}</td>
                <td>{contract.contract_size} {contract.unit}</td>
                <td>R$ {contract.current_price?.toFixed(2) || '0,00'}</td>
                <td>
                  <span className={`badge ${contract.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {contract.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEditContract(contract)}
                      title="Editar contrato"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button 
                      className={`btn btn-sm ${contract.is_active ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => toggleActive(contract)}
                      title={contract.is_active ? 'Desativar contrato' : 'Ativar contrato'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {contract.is_active ? (
                          <path d="M10 9v6l4-3-4-3z"/>
                        ) : (
                          <circle cx="12" cy="12" r="10"/>
                        )}
                      </svg>
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteContract(contract)}
                      title="Excluir contrato"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contracts.length === 0 && !loading && (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
          </svg>
          <h3>Nenhum contrato encontrado</h3>
          <p>Clique em "Novo Contrato" para adicionar o primeiro contrato.</p>
        </div>
      )}

      {/* Modal para criar/editar contrato */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal contract-modal">
            {/* Header */}
            <div className="modal-header">
              <div className="modal-title-section">
                <h2 className="modal-title">
                  {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
                </h2>
                <span className="modal-subtitle">
                  {editingContract ? `Modificar ${editingContract.symbol}` : 'Configurar novo instrumento'}
                </span>
              </div>
              <button className="modal-close" onClick={handleCloseModal} type="button">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="modal-body">
              <div className="contract-form-layout">
                
                {/* Seção Principal - Configuração */}
                <div className="form-section">
                  <div className="section-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                    </svg>
                    <span className="section-title">Configuração</span>
                  </div>
                  
                  <div className="horizontal-fields">
                    <div className="field-group flex-2">
                      <label className="field-label">Tipo de Contrato</label>
                      <select 
                        className="form-input"
                        value={formData.contract_type}
                        onChange={(e) => handleTypeChange(e.target.value)}
                      >
                        {CONTRACT_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.value} - {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field-group flex-2">
                      <label className="field-label">Mês de Vencimento</label>
                      <select 
                        className="form-input"
                        value={formData.expiration_date ? new Date(formData.expiration_date).getMonth() + 1 : ''}
                        onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                      >
                        <option value="">Selecione o mês</option>
                        <option value="1">Janeiro 2025</option>
                        <option value="2">Fevereiro 2025</option>
                        <option value="3">Março 2025</option>
                        <option value="4">Abril 2025</option>
                        <option value="5">Maio 2025</option>
                        <option value="6">Junho 2025</option>
                        <option value="7">Julho 2025</option>
                        <option value="8">Agosto 2025</option>
                        <option value="9">Setembro 2025</option>
                        <option value="10">Outubro 2025</option>
                        <option value="11">Novembro 2025</option>
                        <option value="12">Dezembro 2025</option>
                      </select>
                    </div>

                    <div className="field-group flex-1">
                      <label className="field-label">Status</label>
                      <div className="status-toggle-compact">
                        <label className="toggle-switch-compact">
                          <input 
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                          />
                          <span className="toggle-slider-compact"></span>
                          <span className="toggle-label-compact">
                            {formData.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção Especificações */}
                <div className="form-section">
                  <div className="section-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11H1v3h8v3l3-3.5L9 10v1z"></path>
                      <path d="M22 12h-8"></path>
                      <path d="M15 9l3 3-3 3"></path>
                    </svg>
                    <span className="section-title">Especificações</span>
                  </div>
                  
                  <div className="horizontal-fields">
                    <div className="field-group flex-2">
                      <label className="field-label">Tamanho do Contrato</label>
                      <div className="input-with-unit">
                        <input 
                          type="number"
                          className="form-input"
                          value={formData.contract_size}
                          onChange={(e) => setFormData(prev => ({ ...prev, contract_size: parseInt(e.target.value) || 0 }))}
                        />
                        <span className="input-unit">contratos</span>
                      </div>
                    </div>
                    
                    <div className="field-group flex-2">
                      <label className="field-label">Unidade de Medida</label>
                      <input 
                        type="text"
                        className="form-input"
                        value={formData.unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                        placeholder="ex: arrobas, sacas"
                      />
                    </div>

                    <div className="field-group flex-2">
                      <label className="field-label">Preço Atual</label>
                      <div className="price-input-container">
                        <span className="currency-symbol">R$</span>
                        <input 
                          type="number"
                          step="0.01"
                          className="form-input"
                          value={formData.current_price}
                          onChange={(e) => setFormData(prev => ({ ...prev, current_price: parseFloat(e.target.value) || 0 }))}
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção Informações Automáticas */}
                {(formData.contract_type && formData.expiration_date) && (
                  <div className="form-section auto-info">
                    <div className="section-header">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                      </svg>
                      <span className="section-title">Informações Geradas</span>
                      <div className="auto-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2l2 7h7l-5.5 4.5L17 21l-5-4-5 4 1.5-7.5L3 9h7z"></path>
                        </svg>
                        Automático
                      </div>
                    </div>
                    
                    <div className="auto-info-grid">
                      <div className="info-card primary">
                        <div className="info-header">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 7V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3M4 7h16M4 7l2 10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l2-10"></path>
                          </svg>
                          <span className="info-label">Símbolo</span>
                        </div>
                        <div className="info-value primary-value">{formData.symbol}</div>
                      </div>

                      <div className="info-card">
                        <div className="info-header">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                          </svg>
                          <span className="info-label">Nome Completo</span>
                        </div>
                        <div className="info-value">{formData.name}</div>
                      </div>

                      <div className="info-card">
                        <div className="info-header">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          <span className="info-label">Data de Vencimento</span>
                        </div>
                        <div className="info-value">
                          {formData.expiration_date ? new Date(formData.expiration_date).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric' 
                          }) : ''}
                        </div>
                      </div>

                      <div className="info-card">
                        <div className="info-header">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                          </svg>
                          <span className="info-label">Especificação</span>
                        </div>
                        <div className="info-value">
                          {formData.contract_size} {formData.unit} por contrato
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleCloseModal}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={!formData.contract_type || !formData.expiration_date}
              >
                {editingContract ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Salvar Alterações
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Criar Contrato
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 