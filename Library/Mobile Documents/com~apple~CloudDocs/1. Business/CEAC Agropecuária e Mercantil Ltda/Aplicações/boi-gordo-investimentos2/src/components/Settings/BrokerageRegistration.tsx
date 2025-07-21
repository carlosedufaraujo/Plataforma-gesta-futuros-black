'use client';

import { useState } from 'react';

interface BrokerageData {
  name: string;
  cnpj: string;
  tradingCode: string;
  apiKey: string;
  secretKey: string;
  environment: 'producao' | 'homologacao';
  connectionType: 'api' | 'fix' | 'websocket';
  server: string;
  port: string;
  commission: number;
  marginRate: number;
  autoHedge: boolean;
  notifications: boolean;
}

interface BrokerageRegistrationProps {
  onSubmit?: (brokerageData: BrokerageData) => void;
}

export default function BrokerageRegistration({ onSubmit }: BrokerageRegistrationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BrokerageData>({
    name: 'Clear Corretora',
    cnpj: '01.234.567/0001-89',
    tradingCode: 'CLEAR',
    apiKey: '••••••••••••••••••••••••••••••••',
    secretKey: '••••••••••••••••••••••••••••••••••••••••••••••••',
    environment: 'producao',
    connectionType: 'api',
    server: 'api.clear.com.br',
    port: '443',
    commission: 2.50,
    marginRate: 15.00,
    autoHedge: true,
    notifications: true
  });

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('connected');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    setIsEditing(false);
    alert('Configurações da corretora atualizadas com sucesso!');
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    // Simular teste de conexão
    setTimeout(() => {
      setConnectionStatus('connected');
      alert('Conexão testada com sucesso!');
    }, 2000);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'status-active';
      case 'disconnected': return 'status-error';
      case 'testing': return 'status-warning';
      default: return 'status-inactive';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Conectado';
      case 'disconnected': return 'Desconectado';
      case 'testing': return 'Testando...';
      default: return 'Inativo';
    }
  };

  return (
    <div className="card">
      <div className="settings-header">
        <div className="settings-header-main">
          <h2>Configurações da Corretora</h2>
          <p className="settings-subtitle">Configurações de conexão e parâmetros de trading</p>
        </div>
        <div className="settings-actions">
          {!isEditing ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-info" onClick={handleTestConnection} disabled={connectionStatus === 'testing'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12a10 10 0 1 0 20 0 10 10 0 0 0-20 0z"></path>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <path d="M9 9h.01"></path>
                  <path d="M15 9h.01"></path>
                </svg>
                {connectionStatus === 'testing' ? 'Testando...' : 'Testar Conexão'}
              </button>
              <button className="btn btn-secondary" onClick={handleEdit}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Editar
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" type="submit" form="brokerage-form">
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

      {/* Status de Conexão */}
      <div className="connection-status">
        <div className={`status-indicator ${getStatusColor()}`}></div>
        <span className="status-text">Status: {getStatusText()}</span>
        <span className="connection-info">Última atualização: há 2 minutos</span>
      </div>

      <form id="brokerage-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Informações da Corretora */}
          <div className="form-section">
            <h3 className="form-section-title">Informações da Corretora</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome da Corretora</label>
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
              <div className="form-group">
                <label className="form-label">CNPJ</label>
                <input
                  type="text"
                  className="form-control"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Código de Negociação</label>
                <input
                  type="text"
                  className="form-control"
                  name="tradingCode"
                  value={formData.tradingCode}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ambiente</label>
                <select
                  className="form-control"
                  name="environment"
                  value={formData.environment}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                >
                  <option value="producao">Produção</option>
                  <option value="homologacao">Homologação</option>
                </select>
              </div>
            </div>
          </div>

          {/* Configurações de API */}
          <div className="form-section">
            <h3 className="form-section-title">Configurações de API</h3>
            
            <div className="form-row">
              <div className="form-group form-group-wide">
                <label className="form-label">API Key</label>
                <input
                  type="password"
                  className="form-control"
                  name="apiKey"
                  value={formData.apiKey}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group form-group-wide">
                <label className="form-label">Secret Key</label>
                <input
                  type="password"
                  className="form-control"
                  name="secretKey"
                  value={formData.secretKey}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tipo de Conexão</label>
                <select
                  className="form-control"
                  name="connectionType"
                  value={formData.connectionType}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                >
                  <option value="api">REST API</option>
                  <option value="websocket">WebSocket</option>
                  <option value="fix">FIX Protocol</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Servidor</label>
                <input
                  type="text"
                  className="form-control"
                  name="server"
                  value={formData.server}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Porta</label>
                <input
                  type="text"
                  className="form-control"
                  name="port"
                  value={formData.port}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>
          </div>

          {/* Parâmetros de Trading */}
          <div className="form-section">
            <h3 className="form-section-title">Parâmetros de Trading</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Comissão (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="commission"
                  value={formData.commission}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Taxa de Margem (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  name="marginRate"
                  value={formData.marginRate}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    name="autoHedge"
                    checked={formData.autoHedge}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                  <span className="checkmark"></span>
                  <span className="label-text">Hedge Automático</span>
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    name="notifications"
                    checked={formData.notifications}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                  <span className="checkmark"></span>
                  <span className="label-text">Notificações Push</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 