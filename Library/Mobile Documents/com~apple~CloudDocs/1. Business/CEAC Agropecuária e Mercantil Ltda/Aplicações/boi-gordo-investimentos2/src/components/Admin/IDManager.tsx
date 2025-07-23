'use client';

import { useState, useEffect } from 'react';
import { idGenerator } from '@/services/idGenerator';

export default function IDManager() {
  const [stats, setStats] = useState<any>(null);
  const [backupData, setBackupData] = useState('');
  const [importData, setImportData] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    setStats(idGenerator.getCounterStats());
  };

  const handleExport = () => {
    const exportedData = idGenerator.exportCounters();
    setBackupData(exportedData);
    
    // Download automático
    const blob = new Blob([exportedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acex_id_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importData.trim()) {
      alert('Por favor, cole os dados de backup no campo abaixo.');
      return;
    }

    const success = idGenerator.importCounters(importData);
    if (success) {
      alert('Backup importado com sucesso!');
      loadStats();
      setImportData('');
    } else {
      alert('Erro ao importar backup. Verifique o formato dos dados.');
    }
  };

  const handleSync = async () => {
    await idGenerator.syncWithBackend();
    loadStats();
  };

  if (!stats) {
    return <div>Carregando estatísticas...</div>;
  }

  return (
    <div className="id-manager">
      <div className="card">
        <h2>Gerenciador de IDs do Sistema</h2>
        
        {/* Estatísticas dos Contadores */}
        <div className="stats-section">
          <h3>Estatísticas dos Contadores</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Transações (TX)</div>
              <div className="stat-value">{stats.transactions.toLocaleString()}</div>
              <div className="stat-next">Próximo: {idGenerator.getNextId('transactions')}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Posições (PS)</div>
              <div className="stat-value">{stats.positions.toLocaleString()}</div>
              <div className="stat-next">Próximo: {idGenerator.getNextId('positions')}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Opções (OP)</div>
              <div className="stat-value">{stats.options.toLocaleString()}</div>
              <div className="stat-next">Próximo: {idGenerator.getNextId('options')}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Usuários (US)</div>
              <div className="stat-value">{stats.users.toLocaleString()}</div>
              <div className="stat-next">Próximo: {idGenerator.getNextId('users')}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Corretoras (BR)</div>
              <div className="stat-value">{stats.brokerages.toLocaleString()}</div>
              <div className="stat-next">Próximo: {idGenerator.getNextId('brokerages')}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Contratos (CT)</div>
              <div className="stat-value">{stats.contracts.toLocaleString()}</div>
              <div className="stat-next">Próximo: {idGenerator.getNextId('contracts')}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Estratégias (ST)</div>
              <div className="stat-value">{stats.strategies.toLocaleString()}</div>
              <div className="stat-next">Próximo: {idGenerator.getNextId('strategies')}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Relatórios (RP)</div>
              <div className="stat-value">{stats.reports.toLocaleString()}</div>
              <div className="stat-next">Próximo: {idGenerator.getNextId('reports')}</div>
            </div>
          </div>
          
          <div className="total-stats">
            <strong>Total de IDs gerados: {stats.total.toLocaleString()}</strong>
          </div>
        </div>

        {/* Ações de Gerenciamento */}
        <div className="management-section">
          <h3>Gerenciamento</h3>
          
          <div className="action-buttons">
            <button className="btn btn-primary" onClick={loadStats}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23,4 23,10 17,10"></polyline>
                <polyline points="1,20 1,14 7,14"></polyline>
                <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15"></path>
              </svg>
              Atualizar Estatísticas
            </button>
            
            <button className="btn btn-secondary" onClick={handleExport}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21,15v4a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2V15"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Exportar Backup
            </button>
            
            <button className="btn btn-info" onClick={handleSync}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23,4 23,10 17,10"></polyline>
                <polyline points="1,20 1,14 7,14"></polyline>
                <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15"></path>
              </svg>
              Sincronizar com Backend
            </button>
          </div>
        </div>

        {/* Importar Backup */}
        <div className="import-section">
          <h3>Importar Backup</h3>
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Cole aqui os dados do backup JSON..."
            rows={6}
            className="form-input"
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px' }}
          />
          <button className="btn btn-warning" onClick={handleImport} style={{ marginTop: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21,15v4a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2V15"></path>
              <polyline points="17,8 12,3 7,8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Importar Backup
          </button>
        </div>

        {/* Dados Exportados */}
        {backupData && (
          <div className="export-section">
            <h3>Dados Exportados</h3>
            <textarea
              value={backupData}
              readOnly
              rows={8}
              className="form-input"
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px', background: 'var(--bg-secondary)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 