'use client';

import { useState } from 'react';
import { useAccessControl } from '@/hooks/useAccessControl';
import UserSelectionModal from './UserSelectionModal';

interface Brokerage {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  assessor: string;
  telefone: string;
  email: string;
  corretagemMilho: number;
  corretagemBoi: number;
  taxas: number;
  impostos: number;
}

interface BrokerageRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (brokerage: Omit<Brokerage, 'id'>) => void;
  editingBrokerage?: Brokerage | null;
}

export default function BrokerageRegistrationModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingBrokerage 
}: BrokerageRegistrationModalProps) {
  const [formData, setFormData] = useState({
    nome: editingBrokerage?.nome || '',
    cnpj: editingBrokerage?.cnpj || '',
    endereco: editingBrokerage?.endereco || '',
    assessor: editingBrokerage?.assessor || '',
    telefone: editingBrokerage?.telefone || '',
    email: editingBrokerage?.email || '',
    corretagemMilho: editingBrokerage?.corretagemMilho || 0,
    corretagemBoi: editingBrokerage?.corretagemBoi || 0,
    taxas: editingBrokerage?.taxas || 0,
    impostos: editingBrokerage?.impostos || 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Access Control
  const { 
    currentUser, 
    getBrokerageUsers, 
    addUserToBrokerage, 
    removeUserFromBrokerage, 
    changeUserRole,
    getAvailableUsers 
  } = useAccessControl();
  
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);
  
  // Para edição, obter usuários da corretora
  const brokerageUsers = editingBrokerage ? getBrokerageUsers(editingBrokerage.id) : [];
  const availableUsers = editingBrokerage ? getAvailableUsers(editingBrokerage.id) : [];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome da corretora é obrigatório';
    }

    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj.trim())) {
      newErrors.cnpj = 'CNPJ deve estar no formato 00.000.000/0000-00';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }

    if (!formData.endereco.trim()) {
      newErrors.endereco = 'Endereço é obrigatório';
    }

    if (!formData.assessor.trim()) {
      newErrors.assessor = 'Nome do assessor é obrigatório';
    }

    if (formData.corretagemMilho < 0) {
      newErrors.corretagemMilho = 'Corretagem do milho deve ser maior ou igual a zero';
    }

    if (formData.corretagemBoi < 0) {
      newErrors.corretagemBoi = 'Corretagem do boi deve ser maior ou igual a zero';
    }

    if (formData.taxas < 0 || formData.taxas > 100) {
      newErrors.taxas = 'Taxa deve estar entre 0% e 100%';
    }

    if (formData.impostos < 0) {
      newErrors.impostos = 'Impostos devem ser maior ou igual a zero';
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
        cnpj: '',
        endereco: '',
        assessor: '',
        telefone: '',
        email: '',
        corretagemMilho: 0,
        corretagemBoi: 0,
        taxas: 0,
        impostos: 0
      });
      setErrors({});
    }
  };

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
    }
    return cleaned;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return cleaned;
  };

  const handleChange = (field: string, value: string | number) => {
    let formattedValue = value;
    
    if (field === 'cnpj' && typeof value === 'string') {
      formattedValue = formatCNPJ(value);
    } else if (field === 'telefone' && typeof value === 'string') {
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

  // Funções de controle de acesso
  const handleAddUser = (userId: string, role: 'admin' | 'trader' | 'viewer') => {
    if (editingBrokerage) {
      addUserToBrokerage(userId, editingBrokerage.id, role);
      
      // Toast de sucesso
      const toast = document.createElement('div');
      toast.textContent = '✅ Usuário adicionado com sucesso!';
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10002;
        background: var(--color-success); color: white; padding: 12px 20px;
        border-radius: 8px; font-weight: 500; animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    }
  };

  const handleRemoveUser = (userId: string) => {
    if (editingBrokerage && confirm('Deseja remover o acesso deste usuário à corretora?')) {
      removeUserFromBrokerage(userId, editingBrokerage.id);
    }
  };

  const handleChangeRole = (userId: string, newRole: 'admin' | 'trader' | 'viewer') => {
    if (editingBrokerage) {
      changeUserRole(userId, editingBrokerage.id, newRole);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'trader': return 'Operador';
      case 'viewer': return 'Visualizador';
      default: return role;
    }
  };

  const getRoleTooltip = (role: string) => {
    switch (role) {
      case 'admin': return 'Acesso completo para gerenciar usuários, configurações e todas as operações';
      case 'trader': return 'Pode criar, editar e executar operações, mas não pode gerenciar usuários';
      case 'viewer': return 'Apenas visualização de posições e relatórios, sem poder executar operações';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay">
        <div className="modal modal-large">
          <div className="modal-header">
            <h3>{editingBrokerage ? 'Editar Corretora' : 'Cadastrar Corretora'}</h3>
            <button className="modal-close" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Informações Básicas */}
                <div className="form-group full-width">
                  <label className="form-label">Nome da Corretora *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.nome ? 'error' : ''}`}
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    placeholder="Digite o nome da corretora"
                  />
                  {errors.nome && <span className="error-message">{errors.nome}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">CNPJ *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.cnpj ? 'error' : ''}`}
                    value={formData.cnpj}
                    onChange={(e) => handleChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                  {errors.cnpj && <span className="error-message">{errors.cnpj}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Assessor Responsável *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.assessor ? 'error' : ''}`}
                    value={formData.assessor}
                    onChange={(e) => handleChange('assessor', e.target.value)}
                    placeholder="Nome do assessor"
                  />
                  {errors.assessor && <span className="error-message">{errors.assessor}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.telefone ? 'error' : ''}`}
                    value={formData.telefone}
                    onChange={(e) => handleChange('telefone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                  {errors.telefone && <span className="error-message">{errors.telefone}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contato@corretora.com.br"
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Endereço Completo *</label>
                  <textarea
                    className={`form-textarea ${errors.endereco ? 'error' : ''}`}
                    value={formData.endereco}
                    onChange={(e) => handleChange('endereco', e.target.value)}
                    placeholder="Rua, número, bairro, cidade, estado, CEP"
                    rows={3}
                  />
                  {errors.endereco && <span className="error-message">{errors.endereco}</span>}
                </div>

                {/* Custos Operacionais */}
                <div className="form-section-title full-width">
                  <h4>Custos Operacionais</h4>
                </div>

                <div className="form-group">
                  <label className="form-label">Corretagem - Milho (R$)</label>
                  <input
                    type="number"
                    className={`form-input ${errors.corretagemMilho ? 'error' : ''}`}
                    value={formData.corretagemMilho}
                    onChange={(e) => handleChange('corretagemMilho', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.corretagemMilho && <span className="error-message">{errors.corretagemMilho}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Corretagem - Boi Gordo (R$)</label>
                  <input
                    type="number"
                    className={`form-input ${errors.corretagemBoi ? 'error' : ''}`}
                    value={formData.corretagemBoi}
                    onChange={(e) => handleChange('corretagemBoi', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.corretagemBoi && <span className="error-message">{errors.corretagemBoi}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Taxas (%)</label>
                  <input
                    type="number"
                    className={`form-input ${errors.taxas ? 'error' : ''}`}
                    value={formData.taxas}
                    onChange={(e) => handleChange('taxas', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max="100"
                  />
                  {errors.taxas && <span className="error-message">{errors.taxas}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Impostos (R$)</label>
                  <input
                    type="number"
                    className={`form-input ${errors.impostos ? 'error' : ''}`}
                    value={formData.impostos}
                    onChange={(e) => handleChange('impostos', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.impostos && <span className="error-message">{errors.impostos}</span>}
                </div>

                {/* Controle de Acesso */}
                <div className="form-section-title full-width">
                  <h4>Controle de Acesso</h4>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Usuários Autorizados</label>
                  <div className="user-access-info">
                    <p className="access-description">
                      Os usuários listados abaixo terão acesso a esta corretora. 
                      Por padrão, o usuário atual será incluído automaticamente.
                    </p>
                    
                    {/* Usuário Atual */}
                    <div className="current-user-info">
                      <div className="user-badge current">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>Usuário Atual (Acesso Automático)</span>
                        <div className="access-type">Administrador</div>
                      </div>
                    </div>

                    {/* Lista de usuários adicionais (apenas em edição) */}
                    {editingBrokerage && brokerageUsers.length > 1 && (
                      <div className="expanded-users-list">
                        <div className="users-list-header">
                          <span className="users-count">
                            {brokerageUsers.length - 1} usuário(s) adicional(is)
                          </span>
                          <button
                            type="button"
                            className="users-toggle"
                            onClick={() => setShowUsersList(!showUsersList)}
                          >
                            {showUsersList ? 'Ocultar' : 'Mostrar'} Lista
                          </button>
                        </div>

                        {showUsersList && (
                          <div className="authorized-users-list users-list-expanded">
                            {brokerageUsers
                              .filter(item => item.user.id !== currentUser.id)
                              .map(({ user, permission }) => (
                                <div key={user.id} className="user-item">
                                  <div className="user-info">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                      <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <div className="user-details">
                                      <div className="user-name">{user.nome}</div>
                                      <div className="user-email">{user.email}</div>
                                    </div>
                                  </div>
                                  <div className="user-actions">
                                    <div 
                                      className={`permission-badge ${permission.role} role-tooltip`}
                                      data-tooltip={getRoleTooltip(permission.role)}
                                    >
                                      {getRoleLabel(permission.role)}
                                    </div>
                                    <select
                                      className="user-action-btn"
                                      value={permission.role}
                                      onChange={(e) => handleChangeRole(user.id, e.target.value as 'admin' | 'trader' | 'viewer')}
                                      style={{
                                        padding: '4px 6px',
                                        fontSize: '10px',
                                        borderRadius: '4px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-primary)'
                                      }}
                                    >
                                      <option value="viewer">Visualizador</option>
                                      <option value="trader">Operador</option>
                                      <option value="admin">Administrador</option>
                                    </select>
                                    <button
                                      type="button"
                                      className="user-action-btn remove"
                                      onClick={() => handleRemoveUser(user.id)}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botão adicionar usuário (apenas em edição) */}
                    {editingBrokerage && (
                      <div style={{ marginTop: '16px' }}>
                        <button
                          type="button"
                          className="add-user-btn"
                          onClick={() => setShowUserSelection(true)}
                          disabled={availableUsers.length === 0}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                          {availableUsers.length === 0 ? 'Nenhum usuário disponível' : 'Adicionar Usuário'}
                        </button>
                      </div>
                    )}

                    <div className="access-note">
                      <strong>Nota:</strong> Para adicionar outros usuários, {editingBrokerage ? 'use o botão "Adicionar Usuário" acima ou vá na' : 'use a'} seção "Configurações → Usuários" 
                      {editingBrokerage ? '.' : ' após criar a corretora.'} Lá você poderá gerenciar permissões específicas para cada usuário.
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBrokerage ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de seleção de usuários */}
      {editingBrokerage && (
        <UserSelectionModal
          isOpen={showUserSelection}
          onClose={() => setShowUserSelection(false)}
          onSubmit={handleAddUser}
          availableUsers={availableUsers}
          title="Adicionar Usuário à Corretora"
        />
      )}
    </>
  );
} 