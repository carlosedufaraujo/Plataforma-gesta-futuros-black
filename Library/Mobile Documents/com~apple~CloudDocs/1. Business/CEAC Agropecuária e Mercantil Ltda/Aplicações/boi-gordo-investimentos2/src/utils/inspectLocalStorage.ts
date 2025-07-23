/**
 * Utilitário para inspecionar dados do localStorage
 * Execute no console do navegador: window.inspectLocalStorage()
 */

export const inspectLocalStorage = () => {
  console.log('🔍 INSPEÇÃO DO LOCALSTORAGE - ACEX CAPITAL MARKETS\n');
  console.log('=' .repeat(60));

  const keys = [
    'acex_positions',
    'acex_options', 
    'acex_transactions',
    'acex_users',
    'acex_brokerages',
    'acex_current_user',
    'acex_selected_brokerage',
    'acex_id_counters'
  ];

  const results = {};

  keys.forEach(key => {
    try {
      const rawData = localStorage.getItem(key);
      if (rawData) {
        const parsedData = JSON.parse(rawData);
        const actualData = parsedData.data || parsedData;
        
        results[key] = {
          exists: true,
          timestamp: parsedData.timestamp || 'N/A',
          version: parsedData.version || 'N/A',
          dataType: Array.isArray(actualData) ? 'Array' : typeof actualData,
          count: Array.isArray(actualData) ? actualData.length : 1,
          data: actualData
        };

        console.log(`\n📦 ${key.toUpperCase()}:`);
        console.log(`   ✅ Existe: Sim`);
        console.log(`   📅 Timestamp: ${parsedData.timestamp || 'N/A'}`);
        console.log(`   🏷️  Versão: ${parsedData.version || 'N/A'}`);
        console.log(`   📊 Tipo: ${Array.isArray(actualData) ? 'Array' : typeof actualData}`);
        console.log(`   🔢 Quantidade: ${Array.isArray(actualData) ? actualData.length : 1}`);
        
        if (Array.isArray(actualData) && actualData.length > 0) {
          console.log(`   📋 Primeiros itens:`, actualData.slice(0, 2));
        } else if (!Array.isArray(actualData) && actualData) {
          console.log(`   📋 Dados:`, actualData);
        }
      } else {
        results[key] = {
          exists: false,
          count: 0
        };
        console.log(`\n📦 ${key.toUpperCase()}:`);
        console.log(`   ❌ Existe: Não`);
      }
    } catch (error) {
      results[key] = {
        exists: false,
        error: error.message,
        count: 0
      };
      console.log(`\n📦 ${key.toUpperCase()}:`);
      console.log(`   ⚠️  Erro: ${error.message}`);
    }
  });

  // Resumo
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RESUMO GERAL:');
  console.log('=' .repeat(60));

  const summary = {
    posições: results.acex_positions?.count || 0,
    opções: results.acex_options?.count || 0,
    transações: results.acex_transactions?.count || 0,
    usuários: results.acex_users?.count || 0,
    corretoras: results.acex_brokerages?.count || 0,
    usuárioAtual: results.acex_current_user?.exists ? 'Definido' : 'Não definido',
    corretoraAtual: results.acex_selected_brokerage?.exists ? 'Definida' : 'Não definida'
  };

  Object.entries(summary).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  // Estatísticas de armazenamento
  let totalSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }

  console.log('\n📈 ESTATÍSTICAS DE ARMAZENAMENTO:');
  console.log(`   💾 Tamanho total: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log(`   📁 Itens no localStorage: ${Object.keys(localStorage).length}`);
  console.log(`   🎯 Itens ACEX: ${keys.filter(k => results[k]?.exists).length}/${keys.length}`);

  return results;
};

// Disponibilizar globalmente no desenvolvimento
if (typeof window !== 'undefined') {
  (window as any).inspectLocalStorage = inspectLocalStorage;
}

export default inspectLocalStorage; 