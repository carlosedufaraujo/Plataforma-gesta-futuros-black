'use client';

import { useState } from 'react';

interface User {
  id: string;
  name: string;
  cpf: string;
  address: string;
  phone: string;
  email: string;
  corretoras: string[]; // IDs das corretoras vinculadas
}

interface Brokerage {
  id: string;
  name: string;
  cnpj: string;
}

export default function UserManagement() {
  // Lista de corretoras (mockado - viria do contexto/API)
  const [brokerages] = useState<Brokerage[]>([
    { id: '1', name: 'XP Investimentos', cnpj: '02.332.886/0001-04' },
    { id: '2', name: 'Rico Investimentos', cnpj: '03.814.055/0001-74' },
    { id: '3', name: 'Clear Corretora', cnpj: '01.234.567/0001-89' }
  ]);

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'João Silva',
      cpf: '123.456.789-00',
      address: 'Rua A, 123 - São Paulo, SP',
      phone: '(11) 99999-9999',
      email: 'joao@email.com',
      corretoras: ['1', '2'] // XP e Rico
    },
    {
      id: '2',
      name: 'Maria Santos',
      cpf: '987.654.321-00',
      address: 'Av. B, 456 - Rio de Janeiro, RJ',
      phone: '(21) 88888-8888',
      email: 'maria@email.com',
      corretoras: ['1'] // Apenas XP
    },
    {
      id: '3',
      name: 'Pedro Costa',
      cpf: '456.789.123-00',
      address: 'Rua C, 789 - Belo Horizonte, MG',
      phone: '(31) 77777-7777',
      email: 'pedro@email.com',
      corretoras: ['3'] // Apenas Clear
    }
  ]);

  // Função para obter nomes das corretoras por IDs
  const getBrokerageNames = (brokerageIds: string[]): string => {
    return brokerageIds
      .map(id => brokerages.find(b => b.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    address: '',
    phone: '',
    email: ''
  });

  const handleAddUser = () => {
    // Disparar evento para abrir modal de usuário
    const event = new CustomEvent('openUserRegistrationModal');
    window.dispatchEvent(event);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      cpf: user.cpf,
      address: user.address,
      phone: user.phone,
      email: user.email
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    if (confirm(`Deseja excluir o usuário "${user.name}"?\n\nCPF: ${user.cpf}\nEmail: ${user.email}\n\nEsta ação não pode ser desfeita.`)) {
      setUsers(prev => prev.filter(user => user.id !== id));
      
      // Feedback visual
      const toast = document.createElement('div');
      toast.textContent = `✅ Usuário "${user.name}" excluído com sucesso!`;
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
    
    if (editingUser) {
      // Editar usuário existente
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...editingUser, ...formData }
          : user
      ));
    } else {
      // Adicionar novo usuário
      const newUser: User = {
        id: Date.now().toString(),
        ...formData
      };
      setUsers([...users, newUser]);
    }
    
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="card">
      <div className="settings-header">
        <div className="settings-header-main">
          <h2>Gerenciamento de Usuários</h2>
          <p className="settings-subtitle">
            Cadastre e gerencie usuários que terão acesso ao sistema
          </p>
        </div>
        <div className="settings-actions">
          <button 
            className="btn btn-primary btn-header-action"
            onClick={handleAddUser}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            Novo Usuário
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Endereço</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Corretoras</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.cpf}</td>
                <td>{user.address}</td>
                <td>{user.phone}</td>
                <td>{user.email}</td>
                <td>{getBrokerageNames(user.corretoras)}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Editar
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
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

      {/* Modal para adicionar/editar usuário */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nome Completo</label>
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
                    <label className="form-label">CPF</label>
                    <input
                      type="text"
                      className="form-control"
                      name="cpf"
                      value={formData.cpf}
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

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingUser ? 'Salvar Alterações' : 'Adicionar Usuário'}
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