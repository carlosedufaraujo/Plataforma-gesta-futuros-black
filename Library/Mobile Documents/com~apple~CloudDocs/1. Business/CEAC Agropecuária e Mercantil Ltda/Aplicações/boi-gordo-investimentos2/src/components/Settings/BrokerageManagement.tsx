'use client';

import { useState } from 'react';

interface Brokerage {
  id: string;
  name: string;
  cnpj: string;
  assessor: string;
  phone: string;
  email: string;
  milhoFees: number;
  boiFees: number;
  taxes: number;
  otherFees: number;
  linkedUsers?: User[];
}

interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
}

export default function BrokerageManagement() {
  // Lista de usuários disponíveis no sistema
  const [availableUsers] = useState<User[]>([
    { id: '1', name: 'João Silva', email: 'joao@email.com', cpf: '123.456.789-00' },
    { id: '2', name: 'Maria Santos', email: 'maria@email.com', cpf: '987.654.321-00' },
    { id: '3', name: 'Pedro Costa', email: 'pedro@email.com', cpf: '456.789.123-00' }
  ]);

  const [brokerages, setBrokerages] = useState<Brokerage[]>([
    {
      id: '1',
      name: 'XP Investimentos',
      cnpj: '02.332.886/0001-04',
      assessor: 'Roberto Silva',
      phone: '(11) 3003-3000',
      email: 'assessoria@xpi.com.br',
      milhoFees: 2.50,
      boiFees: 3.20,
      taxes: 0.35,
      otherFees: 15.80,
      linkedUsers: [
        { id: '1', name: 'João Silva', email: 'joao@email.com', cpf: '123.456.789-00' }
      ]
    },
    {
      id: '2',
      name: 'Rico Investimentos',
      cnpj: '03.814.055/0001-74',
      assessor: 'Ana Paula Costa',
      phone: '(11) 2050-5000',
      email: 'suporte@rico.com.vc',
      milhoFees: 2.80,
      boiFees: 3.50,
      taxes: 0.28,
      otherFees: 16.20,
      linkedUsers: []
    }
  ]);

  const [selectedBrokerageForUsers, setSelectedBrokerageForUsers] = useState<string | null>(null);
  const [showUserLinkModal, setShowUserLinkModal] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrokerage, setEditingBrokerage] = useState<Brokerage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    address: '',
    assessor: '',
    phone: '',
    email: '',
    milhoFees: '',
    boiFees: '',
    taxRate: '',
    taxes: '',
    otherFees: ''
  });

  const handleAddBrokerage = () => {
    // Disparar evento para abrir modal de corretora
    const event = new CustomEvent('openBrokerageRegistrationModal');
    window.dispatchEvent(event);
  };

  const handleEditBrokerage = (brokerage: Brokerage) => {
    setEditingBrokerage(brokerage);
    setFormData({
      name: brokerage.name,
      cnpj: brokerage.cnpj,
      address: brokerage.address || '',
      assessor: brokerage.assessor,
      phone: brokerage.phone,
      email: brokerage.email,
      milhoFees: brokerage.milhoFees.toString(),
      boiFees: brokerage.boiFees.toString(),
      taxRate: '',
      taxes: brokerage.taxes?.toString() || '',
      otherFees: brokerage.otherFees.toString()
    });
    setIsModalOpen(true);
  };

  const handleDeleteBrokerage = (id: string) => {
    const brokerage = brokerages.find(b => b.id === id);
    if (!brokerage) return;

    if (confirm(`Deseja excluir a corretora "${brokerage.name}"?\n\nCNPJ: ${brokerage.cnpj}\n\nEsta ação não pode ser desfeita e removerá todos os dados associados.`)) {
      setBrokerages(prev => prev.filter(brokerage => brokerage.id !== id));
      
      // Feedback visual
      const toast = document.createElement('div');
      toast.textContent = `✅ Corretora "${brokerage.name}" excluída com sucesso!`;
      toast.style.cssText = `
        position: fixed; top: 70px; right: 20px; z-index: 10002;
        background: var(--color-negative); color: white; padding: 12px 20px;
        border-radius: 8px; font-weight: 500; animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const brokerageData = {
      ...formData,
      milhoFees: parseFloat(formData.milhoFees),
      boiFees: parseFloat(formData.boiFees),
      taxRate: parseFloat(formData.taxRate),
      taxes: parseFloat(formData.taxes),
      otherFees: parseFloat(formData.otherFees)
    };
    
    if (editingBrokerage) {
      // Editar corretora existente
      setBrokerages(brokerages.map(brokerage => 
        brokerage.id === editingBrokerage.id 
          ? { ...editingBrokerage, ...brokerageData }
          : brokerage
      ));
    } else {
      // Adicionar nova corretora
      const newBrokerage: Brokerage = {
        id: Date.now().toString(),
        ...brokerageData
      };
      setBrokerages([...brokerages, newBrokerage]);
    }
    
    setIsModalOpen(false);
    setEditingBrokerage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Função para vincular usuário à corretora
  const linkUserToBrokerage = (brokerageId: string, userId: string) => {
    const user = availableUsers.find(u => u.id === userId);
    if (!user) return;

    setBrokerages(prev => prev.map(brokerage => 
      brokerage.id === brokerageId
        ? { 
            ...brokerage, 
            linkedUsers: [...(brokerage.linkedUsers || []), user]
          }
        : brokerage
    ));

    // Feedback visual
    const toast = document.createElement('div');
    toast.textContent = `✅ Usuário ${user.name} vinculado à ${brokerages.find(b => b.id === brokerageId)?.name}`;
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

  // Função para desvincular usuário da corretora
  const unlinkUserFromBrokerage = (brokerageId: string, userId: string) => {
    const brokerage = brokerages.find(b => b.id === brokerageId);
    const user = brokerage?.linkedUsers?.find(u => u.id === userId);
    
    if (!user || !brokerage) return;

    if (confirm(`Deseja desvincular ${user.name} da corretora ${brokerage.name}?\n\nEsta ação removerá o acesso do usuário aos dados desta corretora.`)) {
      setBrokerages(prev => prev.map(b => 
        b.id === brokerageId
          ? { 
              ...b, 
              linkedUsers: b.linkedUsers?.filter(u => u.id !== userId) || []
            }
          : b
      ));

      // Feedback visual
      const toast = document.createElement('div');
      toast.textContent = `✅ Usuário ${user.name} desvinculado da ${brokerage.name}`;
      toast.style.cssText = `
        position: fixed; top: 70px; right: 20px; z-index: 10002;
        background: var(--color-warning); color: white; padding: 12px 20px;
        border-radius: 8px; font-weight: 500; animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    }
  };

  // Função para abrir modal de vinculação de usuários
  const openUserLinkModal = (brokerageId: string) => {
    setSelectedBrokerageForUsers(brokerageId);
    setShowUserLinkModal(true);
  };

  // Obter usuários disponíveis para vincular (que não estão já vinculados à corretora)
  const getAvailableUsersForBrokerage = (brokerageId: string) => {
    const brokerage = brokerages.find(b => b.id === brokerageId);
    const linkedUserIds = brokerage?.linkedUsers?.map(u => u.id) || [];
    return availableUsers.filter(user => !linkedUserIds.includes(user.id));
  };

  return (
    <div className="card">
      <div className="settings-header">
        <div className="settings-header-main">
          <h2>Gerenciamento de Corretoras</h2>
          <p className="settings-subtitle">
            Configure corretoras e defina custos operacionais
          </p>
        </div>
        <div className="settings-actions">
          <button 
            className="btn btn-primary btn-header-action"
            onClick={handleAddBrokerage}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9,22 9,12 15,12 15,22"></polyline>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            Nova Corretora
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Corretora</th>
              <th>Assessor</th>
              <th>Contato</th>
              <th>Taxas</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {brokerages.map(brokerage => (
              <tr key={brokerage.id}>
                <td>
                  <div>
                    <strong>{brokerage.name}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      CNPJ: {brokerage.cnpj}
                    </div>
                  </div>
                </td>
                <td>{brokerage.assessor}</td>
                <td>{brokerage.phone}</td>
                <td>
                  <div style={{ fontSize: '12px' }}>
                    <div>Milho: R$ {brokerage.milhoFees.toFixed(2)}</div>
                    <div>Boi: R$ {brokerage.boiFees.toFixed(2)}</div>
                    <div>Outras: R$ {brokerage.otherFees.toFixed(2)}</div>
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEditBrokerage(brokerage)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Editar
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteBrokerage(brokerage.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                      </svg>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para adicionar/editar corretora */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>{editingBrokerage ? 'Editar Corretora' : 'Adicionar Corretora'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h4>Informações Básicas</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nome da Corretora</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CNPJ</label>
                      <input
                        type="text"
                        className="form-control"
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Endereço Completo</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Assessor</label>
                      <input
                        type="text"
                        className="form-control"
                        name="advisor"
                        value={formData.advisor}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Telefone</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>Custos e Taxas</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Corretagem Milho (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="milhoFees"
                        value={formData.milhoFees}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Corretagem Boi (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="boiFees"
                        value={formData.boiFees}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Taxa de Margem (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control"
                        name="taxRate"
                        value={formData.taxRate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Impostos e Taxas Adicionais</label>
                    <textarea
                      className="form-control"
                      name="taxes"
                      value={formData.taxes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Ex: IOF, IRPF, Taxa B3, Taxa de Custódia"
                    />
                  </div>
                </div>

                {/* Seção de Usuários Vinculados (apenas no modo edição) */}
                {editingBrokerage && (
                  <div className="form-section">
                    <h4>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      Usuários Vinculados
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
                      Gerencie quais usuários têm acesso aos dados desta corretora
                    </p>

                    {/* Usuários já vinculados */}
                    <div className="linked-users-section">
                      <h5>Usuários Atuais ({editingBrokerage.linkedUsers?.length || 0})</h5>
                      {editingBrokerage.linkedUsers && editingBrokerage.linkedUsers.length > 0 ? (
                        <div className="linked-users-list">
                          {editingBrokerage.linkedUsers.map(user => (
                            <div key={user.id} className="linked-user-card">
                              <div className="user-info">
                                <strong>{user.name}</strong>
                                <small>{user.email}</small>
                              </div>
                              <button 
                                className="btn btn-danger btn-xs"
                                onClick={() => unlinkUserFromBrokerage(editingBrokerage.id, user.id)}
                                title="Desvincular usuário"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '20px', 
                          background: 'var(--bg-secondary)', 
                          borderRadius: '6px',
                          border: '1px dashed var(--border-color)'
                        }}>
                          <p style={{ color: 'var(--text-secondary)', margin: '0' }}>
                            Nenhum usuário vinculado a esta corretora
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Usuários disponíveis para vincular */}
                    <div className="available-users-section" style={{ marginTop: '20px' }}>
                      <h5>Adicionar Usuários</h5>
                      {getAvailableUsersForBrokerage(editingBrokerage.id).length > 0 ? (
                        <div className="available-users">
                          {getAvailableUsersForBrokerage(editingBrokerage.id).map(user => (
                            <div key={user.id} className="user-card">
                              <div className="user-info">
                                <strong>{user.name}</strong>
                                <small>{user.email}</small>
                                <small>CPF: {user.cpf}</small>
                              </div>
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => linkUserToBrokerage(editingBrokerage.id, user.id)}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="12" y1="5" x2="12" y2="19"></line>
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Vincular
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '16px', 
                          background: 'var(--bg-secondary)', 
                          borderRadius: '6px',
                          color: 'var(--text-secondary)'
                        }}>
                          <p style={{ margin: '0', fontSize: '13px' }}>
                            Todos os usuários já estão vinculados a esta corretora
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingBrokerage ? 'Salvar Alterações' : 'Adicionar Corretora'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 