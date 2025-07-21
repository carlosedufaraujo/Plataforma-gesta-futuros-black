'use client';

import { useState } from 'react';
import { User } from '@/hooks/useAccessControl';

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userId: string, role: 'admin' | 'trader' | 'viewer') => void;
  availableUsers: User[];
  title?: string;
}

export default function UserSelectionModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  availableUsers,
  title = 'Adicionar Usuário'
}: UserSelectionModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'trader' | 'viewer'>('viewer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      alert('Por favor, selecione um usuário.');
      return;
    }

    onSubmit(selectedUserId, selectedRole);
    
    // Reset form
    setSelectedUserId('');
    setSelectedRole('viewer');
    onClose();
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleClose = () => {
    setSelectedUserId('');
    setSelectedRole('viewer');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal user-selection-modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={handleClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {availableUsers.length === 0 ? (
              <div className="no-users-available">
                <div className="no-users-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                    <path d="M22 11l-3-3-3 3"></path>
                  </svg>
                </div>
                <h4>Nenhum usuário disponível</h4>
                <p>Todos os usuários já têm acesso a esta corretora ou não há usuários cadastrados no sistema.</p>
                <p className="suggestion">
                  Para adicionar mais usuários, vá em <strong>Configurações → Usuários</strong> e crie novos usuários primeiro.
                </p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Selecionar Usuário *</label>
                  <div className="user-selection-list">
                    {availableUsers.map(user => (
                      <div
                        key={user.id}
                        className={`selectable-user ${selectedUserId === user.id ? 'selected' : ''}`}
                        onClick={() => handleUserSelect(user.id)}
                      >
                        <div className="user-info">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          <div className="user-details">
                            <div className="user-name">{user.nome}</div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                        {selectedUserId === user.id && (
                          <div className="selected-indicator">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20,6 9,17 4,12"></polyline>
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nível de Acesso *</label>
                  <select 
                    className="form-select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'trader' | 'viewer')}
                  >
                    <option value="viewer">Visualizador</option>
                    <option value="trader">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <div className="role-description">
                    {selectedRole === 'admin' && (
                      <p className="role-info admin">
                        <strong>Administrador:</strong> Acesso completo para gerenciar usuários, configurações e todas as operações.
                      </p>
                    )}
                    {selectedRole === 'trader' && (
                      <p className="role-info trader">
                        <strong>Operador:</strong> Pode criar, editar e executar operações, mas não pode gerenciar usuários.
                      </p>
                    )}
                    {selectedRole === 'viewer' && (
                      <p className="role-info viewer">
                        <strong>Visualizador:</strong> Apenas visualização de posições e relatórios, sem poder executar operações.
                      </p>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleClose}>
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={!selectedUserId}
                  >
                    Adicionar Usuário
                  </button>
                </div>
              </>
            )}
            
            {availableUsers.length === 0 && (
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleClose}>
                  Fechar
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 