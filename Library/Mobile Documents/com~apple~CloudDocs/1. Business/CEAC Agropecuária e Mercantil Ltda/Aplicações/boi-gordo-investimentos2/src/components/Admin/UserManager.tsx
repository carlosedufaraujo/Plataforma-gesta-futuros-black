'use client';

import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { User } from '@/types';

export default function UserManager() {
  const { users, addUser, updateUser, deleteUser, currentUser, setCurrentUser } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    endereco: '',
    telefone: '',
    email: '',
    isActive: true,
    brokerageIds: [] as string[]
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      endereco: '',
      telefone: '',
      email: '',
      isActive: true,
      brokerageIds: []
    });
    setEditingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      addUser(formData);
    }
    
    resetForm();
    setIsModalOpen(false);
  };

  const handleEdit = (user: User) => {
    setFormData({
      nome: user.nome,
      cpf: user.cpf,
      endereco: user.endereco,
      telefone: user.telefone,
      email: user.email,
      isActive: user.isActive,
      brokerageIds: user.brokerageIds
    });
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    if (confirm(`Tem certeza que deseja excluir o usuário ${user.nome}?`)) {
      deleteUser(user.id);
    }
  };

  const handleSetCurrent = (user: User) => {
    setCurrentUser(user);
  };

  return (
    <div className="user-manager">
      <div className="card">
        <div className="card-header">
          <h2>Gerenciar Usuários</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
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

        {/* Usuário Atual */}
        {currentUser && (
          <div className="current-user">
            <h3>Usuário Atual</h3>
            <div className="user-info">
              <strong>{currentUser.nome}</strong>
              <span>{currentUser.email}</span>
              <span className={`status ${currentUser.isActive ? 'active' : 'inactive'}`}>
                {currentUser.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        )}

        {/* Lista de Usuários */}
        <div className="users-list">
          <h3>Usuários Cadastrados ({users.length})</h3>
          
          {users.length > 0 ? (
            <div className="users-grid">
              {users.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-header">
                    <div className="user-name">
                      <strong>{user.nome}</strong>
                      {currentUser?.id === user.id && (
                        <span className="current-badge">Atual</span>
                      )}
                    </div>
                    <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <div className="user-details">
                    <div className="detail-item">
                      <span className="label">CPF:</span>
                      <span className="value">{user.cpf}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Email:</span>
                      <span className="value">{user.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Telefone:</span>
                      <span className="value">{user.telefone}</span>
                    </div>
                  </div>
                  
                  <div className="user-actions">
                    {currentUser?.id !== user.id && (
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => handleSetCurrent(user)}
                      >
                        Definir como Atual
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEdit(user)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(user)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <p>Nenhum usuário cadastrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nome">Nome Completo *</label>
                  <input
                    type="text"
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cpf">CPF *</label>
                  <input
                    type="text"
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                    required
                    className="form-input"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="telefone">Telefone</label>
                  <input
                    type="tel"
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    className="form-input"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="endereco">Endereço</label>
                  <input
                    type="text"
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Usuário Ativo
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 