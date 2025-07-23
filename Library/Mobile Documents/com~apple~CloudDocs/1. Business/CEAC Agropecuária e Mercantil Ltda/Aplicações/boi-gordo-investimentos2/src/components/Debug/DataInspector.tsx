'use client';

import { useData } from '@/contexts/DataContext';
import { localStorageService } from '@/services/localStorage';
import { useState, useEffect } from 'react';
import { clearSavedDataOnly, checkCurrentDataState } from '@/utils/clearData';

export default function DataInspector() {
  const { 
    positions, 
    options, 
    transactions, 
    users, 
    brokerages, 
    currentUser, 
    selectedBrokerage 
  } = useData();

  const [storageStats, setStorageStats] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStorageStats(localStorageService.getStorageStats());
    }
  }, []);

  const dataOverview = {
    'Posições': {
      count: positions.length,
      data: positions,
      description: 'Posições de trading abertas e fechadas'
    },
    'Opções': {
      count: options.length,
      data: options,
      description: 'Contratos de opções cadastrados'
    },
    'Transações': {
      count: transactions.length,
      data: transactions,
      description: 'Histórico de transações executadas'
    },
    'Usuários': {
      count: users.length,
      data: users,
      description: 'Usuários cadastrados no sistema'
    },
    'Corretoras': {
      count: brokerages.length,
      data: brokerages,
      description: 'Corretoras cadastradas'
    }
  };

  const handleClearAllData = () => {
    if (confirm('⚠️ Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita!')) {
      localStorageService.clearAllData();
      window.location.reload();
    }
  };

  const handleClearSavedDataOnly = () => {
    if (confirm('🧹 Limpar apenas os dados salvos? (Funcionalidades preservadas)')) {
      const result = clearSavedDataOnly();
      if (result.success) {
        alert('✅ Dados limpos com sucesso! Sistema preservado.');
        window.location.reload();
      } else {
        alert('❌ Erro: ' + result.message);
      }
    }
  };

  const handleExportData = () => {
    const data = localStorageService.exportAllData();
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

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      right: 0, 
      width: '400px', 
      height: '100vh', 
      background: 'rgba(0,0,0,0.9)', 
      color: 'white', 
      padding: '20px', 
      overflowY: 'auto',
      zIndex: 10000,
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#4ade80' }}>
        🔍 DADOS SALVOS - ACEX
      </h2>

      {/* Resumo Geral */}
      <div style={{ marginBottom: '20px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#fbbf24' }}>📊 Resumo Geral</h3>
        {Object.entries(dataOverview).map(([key, info]) => (
          <div key={key} style={{ marginBottom: '5px' }}>
            <strong>{key}:</strong> {info.count} itens
          </div>
        ))}
        
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div><strong>Usuário Atual:</strong> {currentUser?.nome || 'Não definido'}</div>
          <div><strong>Corretora Atual:</strong> {selectedBrokerage?.nome || 'Não definida'}</div>
        </div>
      </div>

      {/* Detalhes por Categoria */}
      {Object.entries(dataOverview).map(([category, info]) => (
        <div key={category} style={{ marginBottom: '15px' }}>
          <h4 style={{ 
            margin: '0 0 5px 0', 
            color: info.count > 0 ? '#4ade80' : '#ef4444',
            fontSize: '14px'
          }}>
            {info.count > 0 ? '✅' : '❌'} {category} ({info.count})
          </h4>
          <p style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '11px' }}>
            {info.description}
          </p>
          
          {info.count > 0 && (
            <div style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '8px', 
              borderRadius: '3px',
              maxHeight: '100px',
              overflow: 'auto'
            }}>
              <pre style={{ margin: 0, fontSize: '10px', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(info.data.slice(0, 1), null, 2)}
                {info.count > 1 && `\n... e mais ${info.count - 1} itens`}
              </pre>
            </div>
          )}
        </div>
      ))}

      {/* Estatísticas de Armazenamento */}
      {storageStats && (
        <div style={{ marginBottom: '20px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#fbbf24' }}>💾 Armazenamento</h3>
          <div>Usado: {(storageStats.used / 1024).toFixed(1)} KB</div>
          <div>Itens: {storageStats.itemCount}</div>
          <div>Utilização: {storageStats.percentage.toFixed(1)}%</div>
        </div>
      )}

      {/* Ações */}
      <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
        <button 
          onClick={handleExportData}
          style={{
            padding: '8px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          📤 Exportar Backup
        </button>
        
        <button 
          onClick={handleClearAllData}
          style={{
            padding: '8px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          🗑️ Limpar Todos os Dados
        </button>

        <button 
          onClick={handleClearSavedDataOnly}
          style={{
            padding: '8px',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          🧹 Limpar Dados Salvos
        </button>

        <button 
          onClick={() => {
            const inspector = document.getElementById('data-inspector');
            if (inspector) inspector.style.display = 'none';
          }}
          style={{
            padding: '8px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          ❌ Fechar
        </button>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        background: 'rgba(59, 130, 246, 0.1)', 
        borderRadius: '4px',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#3b82f6' }}>💡 Console Commands</h4>
        <code style={{ fontSize: '10px', color: '#94a3b8' }}>
          window.inspectLocalStorage() - Inspeção detalhada
        </code>
      </div>
    </div>
  );
} 