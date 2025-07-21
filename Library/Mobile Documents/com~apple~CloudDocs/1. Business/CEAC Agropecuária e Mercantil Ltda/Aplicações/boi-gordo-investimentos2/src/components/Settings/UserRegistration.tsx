'use client';

import { useState } from 'react';

interface UserData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  tradingExperience: 'iniciante' | 'intermediario' | 'avancado';
}

interface UserRegistrationProps {
  onSubmit?: (userData: UserData) => void;
}

export default function UserRegistration({ onSubmit }: UserRegistrationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    name: 'Carlos Eduardo Almeida',
    email: 'carlos@ceacagro.com.br',
    cpf: '123.456.789-00',
    phone: '(11) 99999-9999',
    birthDate: '1985-06-15',
    address: 'Rua das Palmeiras, 123',
    city: 'São Paulo',
    state: 'SP',
    cep: '01234-567',
    tradingExperience: 'intermediario'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    setIsEditing(false);
    alert('Dados do usuário atualizados com sucesso!');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data if needed
  };

  return (
    <div className="card">
      <div className="settings-header">
        <div className="settings-header-main">
          <h2>Cadastro de Usuário</h2>
          <p className="settings-subtitle">Informações pessoais e perfil de investimento</p>
        </div>
        <div className="settings-actions">
          {!isEditing ? (
            <button className="btn btn-secondary" onClick={handleEdit}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Editar
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" type="submit" form="user-form">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                Salvar
              </button>
              <button className="btn btn-secondary" onClick={handleCancel}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      <form id="user-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Informações Básicas */}
          <div className="form-section">
            <h3 className="form-section-title">Informações Básicas</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
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
                  disabled={!isEditing}
                  required
                />
              </div>
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
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Data de Nascimento</label>
                <input
                  type="date"
                  className="form-control"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="form-section">
            <h3 className="form-section-title">Endereço</h3>
            
            <div className="form-row">
              <div className="form-group form-group-wide">
                <label className="form-label">Endereço Completo</label>
                <input
                  type="text"
                  className="form-control"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cidade</label>
                <input
                  type="text"
                  className="form-control"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  className="form-control"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                >
                  <option value="SP">São Paulo</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="PR">Paraná</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="GO">Goiás</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="BA">Bahia</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">CEP</label>
                <input
                  type="text"
                  className="form-control"
                  name="cep"
                  value={formData.cep}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>
          </div>

          {/* Perfil de Investimento */}
          <div className="form-section">
            <h3 className="form-section-title">Perfil de Investimento</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Experiência em Trading</label>
                <select
                  className="form-control"
                  name="tradingExperience"
                  value={formData.tradingExperience}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                >
                  <option value="iniciante">Iniciante (menos de 1 ano)</option>
                  <option value="intermediario">Intermediário (1-5 anos)</option>
                  <option value="avancado">Avançado (mais de 5 anos)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Status do Cadastro */}
      <div className="status-section">
        <div className="status-indicator status-active"></div>
        <span>Cadastro ativo e validado</span>
      </div>
    </div>
  );
} 