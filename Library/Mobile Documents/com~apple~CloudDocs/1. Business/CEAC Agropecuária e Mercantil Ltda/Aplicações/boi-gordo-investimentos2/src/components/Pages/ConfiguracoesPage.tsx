'use client';

import { useState } from 'react';
import ContractManagement from '@/components/Settings/ContractManagement';
import UserManagement from '@/components/Settings/UserManagement';
import BrokerageManagement from '@/components/Settings/BrokerageManagement';
import TabNavigation from '@/components/Common/TabNavigation';

type SettingsTabType = 'usuarios' | 'corretoras' | 'api' | 'referencias' | 'contratos';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabType>('usuarios');

  const handleTestConnection = () => {
    console.log('Testando conexão...');
    alert('Conexão testada com sucesso!');
  };

  const tabs = [
    { 
      id: 'usuarios', 
      label: 'Usuários',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
    { 
      id: 'corretoras', 
      label: 'Corretoras',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9,22 9,12 15,12 15,22"></polyline>
        </svg>
      )
    },
    { 
      id: 'api', 
      label: 'API',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
      )
    },
    { 
      id: 'referencias', 
      label: 'Referências',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      )
    },
    { 
      id: 'contratos', 
      label: 'Contratos',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10,9 9,9 8,9"></polyline>
        </svg>
      )
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'usuarios':
        return <UserManagement />;
      
      case 'corretoras':
        return <BrokerageManagement />;
      
      case 'api':
        return (
          <div>
            <div className="card">
              <h2>Configuração de APIs</h2>
              
              <div className="api-sections">
                <div className="api-section">
                  <h3>Conexão Principal - B3 Market Data</h3>
                  
                  <div className="form-group">
                    <label className="form-label">Status da Conexão</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="status-indicator status-active"></span>
                      <span>Conectado - Atualizado há 2 minutos</span>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">URL da API</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        defaultValue="wss://api.b3.com.br/marketdata/v1"
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Timeout (ms)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        defaultValue="5000"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">API Key</label>
                      <input 
                        type="password" 
                        className="form-control" 
                        defaultValue="••••••••••••••••"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Frequência de Atualização</label>
                      <select className="form-control">
                        <option value="1000">1 segundo</option>
                        <option value="5000">5 segundos</option>
                        <option value="30000">30 segundos</option>
                      </select>
                    </div>
                  </div>
                  
                  <button className="btn btn-primary" onClick={handleTestConnection}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                    Testar Conexão
                  </button>
                </div>

                <div className="api-section">
                  <h3>Status da Última Atualização</h3>
                  
                  <div className="status-grid">
                    <div className="status-item">
                      <label>Última Sincronização:</label>
                      <span className="status-value">26/01/2025 às 14:32:15</span>
                    </div>
                    <div className="status-item">
                      <label>Contratos Atualizados:</label>
                      <span className="status-value">BGI, CCM, SOJ, ICF</span>
                    </div>
                    <div className="status-item">
                      <label>Próxima Atualização:</label>
                      <span className="status-value">Em 3 minutos</span>
                    </div>
                    <div className="status-item">
                      <label>Latência Média:</label>
                      <span className="status-value">127ms</span>
                    </div>
                  </div>
                </div>

                <div className="api-section">
                  <h3>Dados Compartilhados</h3>
                  
                  <div className="data-sharing-grid">
                    <div className="data-category">
                      <h4>Preços em Tempo Real</h4>
                      <ul>
                        <li>• Preços de abertura, máxima, mínima e fechamento</li>
                        <li>• Volume negociado por contrato</li>
                        <li>• Oscilação percentual</li>
                        <li>• Spread de compra e venda</li>
                      </ul>
                    </div>

                    <div className="data-category">
                      <h4>Informações de Mercado</h4>
                      <ul>
                        <li>• Posições em aberto por vencimento</li>
                        <li>• Margem de garantia por contrato</li>
                        <li>• Ajustes diários</li>
                        <li>• Liquidez por série</li>
                      </ul>
                    </div>

                    <div className="data-category">
                      <h4>Dados Históricos</h4>
                      <ul>
                        <li>• Histórico de preços dos últimos 2 anos</li>
                        <li>• Séries temporais de volume</li>
                        <li>• Volatilidade histórica</li>
                        <li>• Correlações entre contratos</li>
                      </ul>
                    </div>

                    <div className="data-category">
                      <h4>Alertas e Notificações</h4>
                      <ul>
                        <li>• Variações acima de 2%</li>
                        <li>• Volumes anômalos</li>
                        <li>• Aproximação de vencimentos</li>
                        <li>• Atualizações de margem</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'referencias':
        return (
          <div className="card">
            <h2>Referências do Sistema</h2>
            
            <div className="references-container">
              <div className="references-row">
                <div className="reference-card">
                  <h3 className="reference-title">Códigos de Contratos</h3>
                  <div className="reference-content">
                    <div className="reference-item">
                      <span className="reference-code">BGI</span>
                      <span className="reference-desc">Boi Gordo Ibovespa</span>
                    </div>
                    <div className="reference-item">
                      <span className="reference-code">CCM</span>
                      <span className="reference-desc">Milho</span>
                    </div>
                  </div>
                </div>
                
                <div className="reference-card">
                  <h3 className="reference-title">Tamanhos de Contrato</h3>
                  <div className="reference-content">
                    <div className="reference-item">
                      <span className="reference-code">BGI:</span>
                      <span className="reference-desc">330 arrobas por contrato</span>
                    </div>
                    <div className="reference-item">
                      <span className="reference-code">CCM:</span>
                      <span className="reference-desc">450 sacos por contrato</span>
                    </div>
                  </div>
                </div>
                
                <div className="reference-card">
                  <h3 className="reference-title">Exemplos</h3>
                  <div className="reference-content">
                    <div className="reference-item">
                      <span className="reference-code">BGIK25:</span>
                      <span className="reference-desc">Boi Gordo venc. Maio/2025</span>
                    </div>
                    <div className="reference-item">
                      <span className="reference-code">CCMN25:</span>
                      <span className="reference-desc">Milho venc. Julho/2025</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="reference-card reference-full-width">
                <h3 className="reference-title">Códigos de Vencimento</h3>
                <div className="reference-months-grid">
                  <div className="reference-month">
                    <span className="month-code">F</span>
                    <span className="month-name">Janeiro</span>
                  </div>
                  <div className="reference-month">
                    <span className="month-code">G</span>
                    <span className="month-name">Fevereiro</span>
                  </div>
                  <div className="reference-month">
                    <span className="month-code">H</span>
                    <span className="month-name">Março</span>
                  </div>
                  <div className="reference-month">
                    <span className="month-code">J</span>
                    <span className="month-name">Abril</span>
                  </div>
                  <div className="reference-month">
                    <span className="month-code">K</span>
                    <span className="month-name">Maio</span>
                  </div>
                  <div className="reference-month">
                    <span className="month-code">M</span>
                    <span className="month-name">Junho</span>
                  </div>
                  <div className="reference-month">
                    <span className="month-code">N</span>
                    <span className="month-name">Julho</span>
                  </div>
                  <div className="reference-month">
                    <span className="month-code">Q</span>
                    <span className="month-name">Agosto</span>
                  </div>
                  <div className="reference-month">
                    <span className="month-code">U</span>
                    <span className="month-name">Setembro</span>
                  </div>
                  <div className="reference-month">
                    <span className="month-code">V</span>
                    <span className="month-name">Outubro</span>
                  </div>
                  <div className="reference-month">
                    <span className="month-code">X</span>
                    <span className="month-name">Novembro</span>
                  </div>
                  <div className="reference-month">
                    <span className="month-code">Z</span>
                    <span className="month-name">Dezembro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'contratos':
        return <ContractManagement />;
      
      default:
        return <UserManagement />;
    }
  };

  return (
    <div>
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as SettingsTabType)}
      />
      
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
} 