'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  nome: string;
  cpf: string;
  endereco: string;
  telefone: string;
  email: string;
  corretoras: string[]; // IDs das corretoras vinculadas
}

interface Brokerage {
  id: string;
  name: string;
  cnpj: string;
}

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: Omit<User, 'id'>) => void;
  editingUser?: User | null;
}

export default function UserRegistrationModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingUser 
}: UserRegistrationModalProps) {
  // Lista de corretoras disponíveis (mockado - viria do contexto/API)
  const [availableBrokerages] = useState<Brokerage[]>([
    { id: '1', name: 'XP Investimentos', cnpj: '02.332.886/0001-04' },
    { id: '2', name: 'Rico Investimentos', cnpj: '03.814.055/0001-74' },
    { id: '3', name: 'Clear Corretora', cnpj: '01.234.567/0001-89' }
  ]);

  const [formData, setFormData] = useState({
    nome: editingUser?.nome || '',
    cpf: editingUser?.cpf || '',
    endereco: editingUser?.endereco || '',
    telefone: editingUser?.telefone || '',
    email: editingUser?.email || '',
    corretoras: editingUser?.corretoras || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNewBrokerageModal, setShowNewBrokerageModal] = useState(false);
  const [newBrokerageData, setNewBrokerageData] = useState({
    name: '',
    cnpj: ''
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setFormData({
          nome: editingUser.nome,
          cpf: editingUser.cpf,
          endereco: editingUser.endereco,
          telefone: editingUser.telefone,
          email: editingUser.email,
          corretoras: editingUser.corretoras || []
        });
      }
    } else {
      setFormData({
        nome: '',
        cpf: '',
        endereco: '',
        telefone: '',
        email: '',
        corretoras: []
      });
      setErrors({});
    }
  }, [isOpen, editingUser]);

  // Função para adicionar/remover corretora
  const toggleBrokerage = (brokerageId: string) => {
    setFormData(prev => ({
      ...prev,
      corretoras: prev.corretoras.includes(brokerageId)
        ? prev.corretoras.filter(id => id !== brokerageId)
        : [...prev.corretoras, brokerageId]
    }));

    // Clear error when user selects brokerage
    if (errors.corretoras) {
      setErrors(prev => ({ ...prev, corretoras: '' }));
    }
  };

  // Função para criar nova corretora rapidamente
  const handleCreateNewBrokerage = () => {
    if (!newBrokerageData.name.trim() || !newBrokerageData.cnpj.trim()) {
      alert('Nome e CNPJ são obrigatórios para criar nova corretora');
      return;
    }

    // Simular criação de nova corretora (aqui integraria com API)
    const newBrokerage: Brokerage = {
      id: Date.now().toString(),
      name: newBrokerageData.name,
      cnpj: newBrokerageData.cnpj
    };

    // Adicionar à lista (em produção, atualizaria o contexto/estado global)
    // availableBrokerages.push(newBrokerage);
    
    // Selecionar automaticamente a nova corretora
    setFormData(prev => ({
      ...prev,
      corretoras: [...prev.corretoras, newBrokerage.id]
    }));

    // Reset e fechar modal
    setNewBrokerageData({ name: '', cnpj: '' });
    setShowNewBrokerageModal(false);

    // Feedback
    const toast = document.createElement('div');
    toast.textContent = `✅ Corretora ${newBrokerage.name} criada e vinculada!`;
    toast.style.cssText = `
      position: fixed; top: 70px; right: 20px; z-index: 10002;
      background: var(--color-success); color: white; padding: 12px 20px;
      border-radius: 8px; font-weight: 500; animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(formData.cpf.trim())) {
      newErrors.cpf = 'CPF deve estar no formato 000.000.000-00';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email deve ter formato válido';
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }

    if (!formData.endereco.trim()) {
      newErrors.endereco = 'Endereço é obrigatório';
    }

    // VALIDAÇÃO OBRIGATÓRIA: Pelo menos 1 corretora
    if (formData.corretoras.length === 0) {
      newErrors.corretoras = 'É obrigatório vincular pelo menos 1 corretora';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      onClose();
      setFormData({
        nome: '',
        cpf: '',
        endereco: '',
        telefone: '',
        email: '',
        corretoras: []
      });
      setErrors({});
    }
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cleaned;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return cleaned;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    if (field === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (field === 'telefone') {
      formattedValue = formatPhone(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className="modal-container large">
        <div className="modal-header">
          <h2 className="modal-title">
            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Seção: Dados Pessoais */}
            <div className="form-section">
              <h3 className="form-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Dados Pessoais
              </h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input
                    type="text"
                    className={`form-input ${errors.nome ? 'error' : ''}`}
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Ex: João da Silva"
                  />
                  {errors.nome && <span className="error-message">{errors.nome}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">CPF</label>
                  <input
                    type="text"
                    className={`form-input ${errors.cpf ? 'error' : ''}`}
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                  {errors.cpf && <span className="error-message">{errors.cpf}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="usuario@email.com"
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input
                    type="text"
                    className={`form-input ${errors.telefone ? 'error' : ''}`}
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.telefone && <span className="error-message">{errors.telefone}</span>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Endereço Completo</label>
                <input
                  type="text"
                  className={`form-input ${errors.endereco ? 'error' : ''}`}
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Rua, número, bairro, cidade - UF"
                />
                {errors.endereco && <span className="error-message">{errors.endereco}</span>}
              </div>
            </div>

            {/* Seção: Corretoras (OBRIGATÓRIO) */}
            <div className="form-section">
              <div className="form-section-header">
                <h3 className="form-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="2" y1="7" x2="22" y2="7"></line>
                  </svg>
                  Corretoras Vinculadas
                  <span className="required-indicator">*</span>
                </h3>
                <button 
                  type="button" 
                  className="btn btn-success btn-sm"
                  onClick={() => setShowNewBrokerageModal(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Nova Corretora
                </button>
              </div>

              <div className="brokerages-selection">
                {availableBrokerages.length > 0 ? (
                  <div className="brokerages-grid">
                    {availableBrokerages.map(brokerage => (
                      <div 
                        key={brokerage.id}
                        className={`brokerage-card ${formData.corretoras.includes(brokerage.id) ? 'selected' : ''}`}
                        onClick={() => toggleBrokerage(brokerage.id)}
                      >
                        <div className="brokerage-info">
                          <strong>{brokerage.name}</strong>
                          <small>CNPJ: {brokerage.cnpj}</small>
                        </div>
                        <div className="selection-indicator">
                          {formData.corretoras.includes(brokerage.id) ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20,6 9,17 4,12"></polyline>
                            </svg>
                          ) : (
                            <div className="empty-circle"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-brokerages">
                    <p>Nenhuma corretora cadastrada no sistema.</p>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={() => setShowNewBrokerageModal(true)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Cadastrar Primeira Corretora
                    </button>
                  </div>
                )}
              </div>

              {errors.corretoras && <span className="error-message">{errors.corretoras}</span>}
              
              {formData.corretoras.length > 0 && (
                <div className="selected-brokerages-summary">
                  <div className="summary-content">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                    <small>
                      {formData.corretoras.length} corretora{formData.corretoras.length > 1 ? 's' : ''} selecionada{formData.corretoras.length > 1 ? 's' : ''}
                    </small>
                  </div>
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editingUser ? 'Atualizar Usuário' : 'Cadastrar Usuário'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Nova Corretora */}
      {showNewBrokerageModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Nova Corretora</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowNewBrokerageModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome da Corretora</label>
                <input
                  type="text"
                  className="form-input"
                  value={newBrokerageData.name}
                  onChange={(e) => setNewBrokerageData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: XP Investimentos"
                />
              </div>

              <div className="form-group">
                <label className="form-label">CNPJ</label>
                <input
                  type="text"
                  className="form-input"
                  value={newBrokerageData.cnpj}
                  onChange={(e) => setNewBrokerageData(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00.000.000/0001-00"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowNewBrokerageModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleCreateNewBrokerage}
              >
                Criar e Vincular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 