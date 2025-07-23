'use client';

import { useState } from 'react';

export default function AutoClearButton() {
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const executeAutoClear = async () => {
    setIsClearing(true);
    setResult(null);

    try {
      console.log('🔍 INICIANDO LIMPEZA AUTOMÁTICA...');
      
      // 1. VERIFICAR DADOS ATUAIS
      const keys = ['acex_positions', 'acex_options', 'acex_transactions', 'acex_users', 'acex_brokerages'];
      let foundMockData = false;
      let itemsFound = [];

      for (const key of keys) {
        const rawData = localStorage.getItem(key);
        if (rawData) {
          try {
            const parsed = JSON.parse(rawData);
            const data = parsed.data || parsed;
            
            if (Array.isArray(data) && data.length > 0) {
              data.forEach((item, index) => {
                if (item.contract && (item.contract.includes('BGI') || item.contract.includes('CCM'))) {
                  itemsFound.push(`${item.contract} (${item.quantity || 'N/A'} lotes)`);
                  foundMockData = true;
                }
                if (item.nome && (item.nome.includes('Carlos') || item.nome.includes('Maria'))) {
                  itemsFound.push(`Usuário: ${item.nome}`);
                  foundMockData = true;
                }
                if (item.nome && item.cnpj) {
                  itemsFound.push(`Corretora: ${item.nome}`);
                  foundMockData = true;
                }
              });
            }
          } catch (e) {
            console.log(`Erro ao ler ${key}:`, e.message);
          }
        }
      }

      if (!foundMockData) {
        setResult('✅ Sistema já está limpo! Nenhum dado mock encontrado.');
        setIsClearing(false);
        return;
      }

      // 2. MOSTRAR O QUE FOI ENCONTRADO
      console.log('📋 Dados mock encontrados:', itemsFound);

      // 3. LIMPEZA COMPLETA
      console.log('🧹 Executando limpeza...');
      
      // Remover todos os dados ACEX
      const allKeys = [...keys, 'acex_current_user', 'acex_selected_brokerage', 'acex_id_counters'];
      
      allKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ ${key} removido`);
      });

      // 4. VERIFICAÇÃO FINAL
      let remainingData = false;
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('acex_')) {
          console.log(`❌ Ainda existe: ${key}`);
          remainingData = true;
        }
      });

      if (!remainingData) {
        setResult(`✅ Limpeza concluída! Removidos: ${itemsFound.join(', ')}`);
        
        // Aguardar 2 segundos e recarregar
        setTimeout(() => {
          console.log('🔄 Recarregando página...');
          window.location.reload();
        }, 2000);
      } else {
        setResult('⚠️ Alguns dados ainda existem. Verifique o console.');
      }

    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      setResult(`❌ Erro: ${error.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      background: 'rgba(0,0,0,0.9)',
      padding: '20px',
      borderRadius: '8px',
      border: '2px solid #ef4444',
      color: 'white',
      fontFamily: 'monospace',
      fontSize: '14px',
      maxWidth: '400px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#ef4444' }}>
        🧹 Limpeza Automática
      </h3>
      
      <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#94a3b8' }}>
        Remove automaticamente todos os dados mock incluindo BGIF25, usuários e corretoras de exemplo.
      </p>

      <button
        onClick={executeAutoClear}
        disabled={isClearing}
        style={{
          width: '100%',
          padding: '12px',
          background: isClearing ? '#6b7280' : '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isClearing ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        {isClearing ? '🔄 Limpando...' : '🗑️ Limpar Dados Mock'}
      </button>

      {result && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: result.startsWith('✅') ? 'rgba(34, 197, 94, 0.2)' : 
                     result.startsWith('⚠️') ? 'rgba(251, 191, 36, 0.2)' : 
                     'rgba(239, 68, 68, 0.2)',
          borderRadius: '4px',
          fontSize: '12px',
          border: `1px solid ${result.startsWith('✅') ? '#22c55e' : 
                                result.startsWith('⚠️') ? '#fbbf24' : 
                                '#ef4444'}`
        }}>
          {result}
        </div>
      )}

      <button
        onClick={() => {
          const button = document.getElementById('auto-clear-container');
          if (button) button.style.display = 'none';
        }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'transparent',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        ✕
      </button>
    </div>
  );
} 