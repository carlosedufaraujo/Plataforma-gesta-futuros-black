'use client';

import React, { useState } from 'react';
import { Download, Upload, Trash2, Database, RefreshCw } from 'lucide-react';
import { useHybridData } from '@/contexts/HybridDataContext';
import { localStorageService } from '@/services/localStorage';

export default function DataManager() {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    positions, options, transactions, users, brokerages,
    clearAllData, exportData, importData, fetchData
  } = useHybridData();
  
  const [exportedData, setExportedData] = useState('');
  const [importedData, setImportedData] = useState('');
  const [storageStats, setStorageStats] = useState(localStorageService.getStorageStats());

  const handleClearAllData = () => {
    const confirmMessage = `
⚠️  ATENÇÃO: Esta ação irá apagar TODOS os dados:

• ${positions.length} Posições
• ${options.length} Opções  
• ${transactions.length} Transações
• ${users.length} Usuários
• ${brokerages.length} Corretoras

Esta ação NÃO pode ser desfeita!

Tem certeza que deseja continuar?`;

    if (confirm(confirmMessage)) {
      clearAllData();
      setStorageStats(localStorageService.getStorageStats());
      alert('✅ Todos os dados foram limpos com sucesso!');
    }
  };

  const handleExportData = () => {
    const data = exportData();
    setExportedData(data);
    
    // Download automático
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acex_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    if (!importedData.trim()) {
      alert('Por favor, cole os dados de backup no campo abaixo.');
      return;
    }

    const success = importData(importedData);
    if (success) {
      alert('✅ Backup importado com sucesso!');
      setImportedData('');
      setStorageStats(localStorageService.getStorageStats());
    } else {
      alert('❌ Erro ao importar backup. Verifique o formato dos dados.');
    }
  };

  const refreshStorageStats = () => {
    setStorageStats(localStorageService.getStorageStats());
  };

  return (
    <div className="data-manager">
      <div className="card">
        <h2>Administração de Dados</h2>

        {/* Estatísticas Gerais */}
        <div className="data-stats">
          <h3>Estatísticas do Sistema</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{positions.length}</div>
                <div className="stat-label">Posições</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{transactions.length}</div>
                <div className="stat-label">Transações</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{users.length}</div>
                <div className="stat-label">Usuários</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{brokerages.length}</div>
                <div className="stat-label">Corretoras</div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas do localStorage */}
        <div className="storage-stats">
          <h3>Uso do Armazenamento Local</h3>
          <div className="storage-info">
            <div className="storage-bar">
              <div 
                className="storage-fill" 
                style={{ width: `${Math.min(storageStats.percentage, 100)}%` }}
              ></div>
            </div>
            <div className="storage-details">
              <span>Usado: {(storageStats.used / 1024).toFixed(1)} KB</span>
              <span>Disponível: {(storageStats.available / 1024 / 1024).toFixed(1)} MB</span>
              <span>Utilização: {storageStats.percentage.toFixed(1)}%</span>
            </div>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={refreshStorageStats}
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* Ações de Gerenciamento */}
        <div className="management-actions">
          <h3>Ações de Gerenciamento</h3>
          
          <div className="action-buttons">
            <button 
              className="btn btn-secondary"
              onClick={handleExportData}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21,15v4a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2V15"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Exportar Backup
            </button>

            <button 
              className="btn btn-warning"
              onClick={handleClearAllData}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2,2h4a2,2,0,0,1,2,2v2"></path>
              </svg>
              Limpar Todos os Dados
            </button>
          </div>
        </div>

        {/* Importar Backup */}
        <div className="import-section">
          <h3>Importar Backup</h3>
          <textarea
            value={importedData}
            onChange={(e) => setImportedData(e.target.value)}
            placeholder="Cole aqui os dados do backup JSON..."
            rows={8}
            className="form-input"
            style={{ 
              width: '100%', 
              fontFamily: 'monospace', 
              fontSize: '12px',
              resize: 'vertical'
            }}
          />
          <button 
            className="btn btn-info" 
            onClick={handleImportData}
            style={{ marginTop: '12px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21,15v4a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2V15"></path>
              <polyline points="17,8 12,3 7,8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Importar Backup
          </button>
        </div>

        {/* Dados Exportados */}
        {exportedData && (
          <div className="export-section">
            <h3>Dados Exportados</h3>
            <textarea
              value={exportedData}
              readOnly
              rows={10}
              className="form-input"
              style={{ 
                width: '100%', 
                fontFamily: 'monospace', 
                fontSize: '11px',
                background: 'var(--bg-secondary)',
                resize: 'vertical'
              }}
            />
          </div>
        )}

        {/* Informações Importantes */}
        <div className="important-info">
          <h3>Informações Importantes</h3>
          <div className="info-content">
            <div className="info-item">
              <strong>💾 Persistência Automática:</strong>
              <p>Todos os dados são salvos automaticamente no navegador e persistem entre sessões.</p>
            </div>
            
            <div className="info-item">
              <strong>🔄 Backup Regular:</strong>
              <p>Recomendamos exportar backups regularmente para evitar perda de dados.</p>
            </div>
            
            <div className="info-item">
              <strong>⚠️ Limpeza de Dados:</strong>
              <p>A ação "Limpar Todos os Dados" é irreversível. Faça backup antes de usar.</p>
            </div>
            
            <div className="info-item">
              <strong>📱 Compatibilidade:</strong>
              <p>Os dados são específicos do navegador e não são sincronizados entre dispositivos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 