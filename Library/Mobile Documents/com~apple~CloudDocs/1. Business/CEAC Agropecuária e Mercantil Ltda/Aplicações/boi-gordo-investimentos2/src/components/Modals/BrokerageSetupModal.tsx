'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';

interface BrokerageSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstSetup?: boolean;
}

interface BrokerageConfig {
  brokerageId: string;
  apiKey?: string;
  secretKey?: string;
  clientId?: string;
  environment: 'sandbox' | 'production';
  autoSync: boolean;
}

export default function BrokerageSetupModal({ isOpen, onClose, isFirstSetup = false }: BrokerageSetupModalProps) {
  const { currentSession, updateSelectedBrokerage } = useUser();
  const { fetchData } = useData();
  
  const [selectedBrokerage, setSelectedBrokerage] = useState('');
  const [config, setConfig] = useState<BrokerageConfig>({
    brokerageId: '',
    environment: 'sandbox',
    autoSync: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && selectedBrokerage) {
      setConfig(prev => ({ ...prev, brokerageId: selectedBrokerage }));
    }
  }, [isOpen, selectedBrokerage]);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setConnectionStatus('testing');
    setErrorMessage('');

    try {
      // Simular teste de conexão - aqui integraria com API real da corretora
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Validações básicas
      if (!config.apiKey || !config.secretKey) {
        throw new Error('API Key e Secret Key são obrigatórios');
      }

      if (config.apiKey.length < 10) {
        throw new Error('API Key deve ter pelo menos 10 caracteres');
      }

      setConnectionStatus('success');
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error.message || 'Erro ao testar conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (connectionStatus !== 'success') {
      setErrorMessage('Teste a conexão antes de salvar');
      return;
    }

    setIsLoading(true);
    try {
      // Aqui salvaria a configuração no backend
      const selectedBrokerageData = currentSession.availableBrokerages.find(
        b => b.id === selectedBrokerage
      );

      if (selectedBrokerageData) {
        await updateSelectedBrokerage(selectedBrokerageData);
        
        // Sincronizar dados após configuração
        if (config.autoSync) {
          await fetchData();
        }

        onClose();
        
        // Mostrar notificação de sucesso
        if (window.showToast) {
          window.showToast('Corretora configurada com sucesso!', 'success');
        }
      }
    } catch (error) {
      setErrorMessage('Erro ao salvar configuração');
    } finally {
      setIsLoading(false);
    }
  };

  const getBrokerageInstructions = (brokerageId: string) => {
    const instructions = {
      'xp': {
        apiKeyLabel: 'Token de Acesso XP',
        secretKeyLabel: 'Chave Secreta XP',
        instructions: [
          '1. Acesse sua conta XP Investimentos',
          '2. Vá em Configurações > API',
          '3. Gere um novo token de acesso',
          '4. Copie o Token e a Chave Secreta'
        ]
      },
      'rico': {
        apiKeyLabel: 'API Key Rico',
        secretKeyLabel: 'Secret Rico',
        instructions: [
          '1. Acesse sua conta Rico',
          '2. Vá em Perfil > Integrações',
          '3. Crie uma nova API Key',
          '4. Copie a API Key e Secret'
        ]
      },
      'clear': {
        apiKeyLabel: 'Client ID Clear',
        secretKeyLabel: 'Client Secret Clear',
        instructions: [
          '1. Acesse o Portal Clear',
          '2. Vá em Configurações > API',
          '3. Registre uma nova aplicação',
          '4. Copie Client ID e Client Secret'
        ]
      }
    };
    
    return instructions[brokerageId] || {
      apiKeyLabel: 'API Key',
      secretKeyLabel: 'Secret Key',
      instructions: ['Consulte a documentação da sua corretora']
    };
  };

  if (!isOpen) return null;

  const selectedBrokerageData = currentSession.availableBrokerages.find(b => b.id === selectedBrokerage);
  const brokerageInstructions = selectedBrokerage ? getBrokerageInstructions(selectedBrokerage) : null;

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2>
            {isFirstSetup ? 'Configurar Corretora' : 'Alterar Corretora'}
          </h2>
          {!isFirstSetup && (
            <button className="modal-close" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        <div className="modal-body">
          {isFirstSetup && (
            <div className="setup-welcome">
              <div className="welcome-icon">🏦</div>
              <h3>Bem-vindo ao ACEX Capital Markets!</h3>
              <p>Para começar, você precisa configurar sua corretora para sincronizar suas posições automaticamente.</p>
            </div>
          )}

          {/* Seleção da Corretora */}
          <div className="form-section">
            <h4>Selecionar Corretora</h4>
            <div className="brokerage-grid">
              {currentSession.availableBrokerages.map(brokerage => (
                <div
                  key={brokerage.id}
                  className={`brokerage-card ${selectedBrokerage === brokerage.id ? 'selected' : ''}`}
                  onClick={() => setSelectedBrokerage(brokerage.id)}
                >
                  <div className="brokerage-logo">
                    {brokerage.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="brokerage-info">
                    <div className="brokerage-name">{brokerage.nome}</div>
                    <div className="brokerage-type">Corretora</div>
                  </div>
                  <div className="brokerage-fees">
                    <small>Corretagem: R$ {brokerage.corretagemBoi.toFixed(2)} (Boi) / R$ {brokerage.corretagemMilho.toFixed(2)} (Milho)</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuração da API */}
          {selectedBrokerage && (
            <div className="form-section">
              <h4>Configuração de API - {selectedBrokerageData?.nome}</h4>
              
              {brokerageInstructions && (
                <div className="api-instructions">
                  <h5>Como obter suas credenciais:</h5>
                  <ol>
                    {brokerageInstructions.instructions.map((instruction, index) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>{brokerageInstructions?.apiKeyLabel || 'API Key'}</label>
                  <input
                    type="password"
                    value={config.apiKey || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Insira sua API Key"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>{brokerageInstructions?.secretKeyLabel || 'Secret Key'}</label>
                  <input
                    type="password"
                    value={config.secretKey || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                    placeholder="Insira sua Secret Key"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Ambiente</label>
                  <select
                    value={config.environment}
                    onChange={(e) => setConfig(prev => ({ ...prev, environment: e.target.value as 'sandbox' | 'production' }))}
                    className="form-select"
                  >
                    <option value="sandbox">Sandbox (Teste)</option>
                    <option value="production">Produção</option>
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.autoSync}
                      onChange={(e) => setConfig(prev => ({ ...prev, autoSync: e.target.checked }))}
                    />
                    <span className="checkbox-text">Sincronização automática</span>
                  </label>
                  <small>Sincronizar posições automaticamente a cada 5 minutos</small>
                </div>
              </div>

              {/* Status da Conexão */}
              <div className="connection-status">
                <button
                  className={`btn btn-secondary ${isLoading ? 'loading' : ''}`}
                  onClick={handleTestConnection}
                  disabled={!config.apiKey || !config.secretKey || isLoading}
                >
                  {connectionStatus === 'testing' ? 'Testando...' : 'Testar Conexão'}
                </button>

                {connectionStatus === 'success' && (
                  <div className="status-message success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                    Conexão estabelecida com sucesso!
                  </div>
                )}

                {connectionStatus === 'error' && (
                  <div className="status-message error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!isFirstSetup && (
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          )}
          <button
            className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
            onClick={handleSaveConfiguration}
            disabled={!selectedBrokerage || connectionStatus !== 'success' || isLoading}
          >
            {isFirstSetup ? 'Configurar e Começar' : 'Salvar Configuração'}
          </button>
        </div>
      </div>
    </div>
  );
} 