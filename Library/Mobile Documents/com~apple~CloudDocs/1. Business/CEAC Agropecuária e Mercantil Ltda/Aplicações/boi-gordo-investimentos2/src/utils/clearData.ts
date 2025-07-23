/**
 * Utilitário para limpar APENAS os dados salvos no localStorage
 * PRESERVA todas as funcionalidades e código do sistema
 */

export const clearSavedDataOnly = () => {
  console.log('🧹 LIMPANDO APENAS DADOS SALVOS...');
  console.log('⚠️  PRESERVANDO: Funcionalidades, código e configurações do sistema');
  console.log('🗑️  REMOVENDO: Apenas dados de usuários, posições, transações e corretoras');
  
  try {
    // Chaves dos dados que serão limpos
    const dataKeys = [
      'acex_positions',
      'acex_options',
      'acex_transactions', 
      'acex_users',
      'acex_brokerages',
      'acex_current_user',
      'acex_selected_brokerage'
    ];

    // Criar backup antes da limpeza
    const backup: Record<string, any> = {};
    let totalItems = 0;

    dataKeys.forEach(key => {
      try {
        const rawData = localStorage.getItem(key);
        if (rawData) {
          const parsedData = JSON.parse(rawData);
          const actualData = parsedData.data || parsedData;
          backup[key] = actualData;
          
          if (Array.isArray(actualData)) {
            totalItems += actualData.length;
          } else if (actualData) {
            totalItems += 1;
          }
        } else {
          backup[key] = null;
        }
      } catch (error) {
        console.warn(`Erro ao fazer backup de ${key}:`, error);
        backup[key] = null;
      }
    });

    console.log('📦 Backup criado com sucesso!');
    console.log(`📊 Total de itens no backup: ${totalItems}`);

    // Limpar os dados (salvar arrays vazios e nulls)
    const emptyData = {
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Arrays vazios para coleções
    const arrayKeys = ['acex_positions', 'acex_options', 'acex_transactions', 'acex_users', 'acex_brokerages'];
    arrayKeys.forEach(key => {
      localStorage.setItem(key, JSON.stringify({
        data: [],
        ...emptyData
      }));
    });

    // Null para seleções atuais
    const nullKeys = ['acex_current_user', 'acex_selected_brokerage'];
    nullKeys.forEach(key => {
      localStorage.setItem(key, JSON.stringify({
        data: null,
        ...emptyData
      }));
    });

    // Resetar contadores de ID
    const counters = {
      position: 1,
      option: 1,
      transaction: 1,
      user: 1,
      brokerage: 1
    };
    localStorage.setItem('acex_id_counters', JSON.stringify({
      data: counters,
      ...emptyData
    }));

    console.log('✅ DADOS LIMPOS COM SUCESSO!');
    console.log('🔧 Sistema mantém todas as funcionalidades');
    console.log('📊 Estado atual:');
    console.log('   - Posições: 0');
    console.log('   - Opções: 0');
    console.log('   - Transações: 0');
    console.log('   - Usuários: 0');
    console.log('   - Corretoras: 0');
    console.log('   - Usuário atual: Não definido');
    console.log('   - Corretora atual: Não definida');

    return {
      success: true,
      message: 'Dados limpos com sucesso. Sistema preservado.',
      backup: backup,
      clearedItems: totalItems
    };

  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
    return {
      success: false,
      message: 'Erro ao limpar dados: ' + error.message,
      backup: null,
      clearedItems: 0
    };
  }
};

// Função para verificar o estado atual (sem modificar nada)
export const checkCurrentDataState = () => {
  console.log('🔍 ESTADO ATUAL DOS DADOS:');
  
  const dataKeys = [
    'acex_positions',
    'acex_options',
    'acex_transactions',
    'acex_users', 
    'acex_brokerages',
    'acex_current_user',
    'acex_selected_brokerage'
  ];

  const state: Record<string, any> = {};
  let totalItems = 0;

  dataKeys.forEach(key => {
    try {
      const rawData = localStorage.getItem(key);
      if (rawData) {
        const parsedData = JSON.parse(rawData);
        const actualData = parsedData.data || parsedData;
        
        if (Array.isArray(actualData)) {
          state[key] = `${actualData.length} itens`;
          totalItems += actualData.length;
        } else if (actualData) {
          state[key] = 'Definido';
          totalItems += 1;
        } else {
          state[key] = 'Vazio/Null';
        }
      } else {
        state[key] = 'Não existe';
      }
    } catch (error) {
      state[key] = 'Erro ao ler';
    }
  });

  Object.entries(state).forEach(([key, value]) => {
    console.log(`   ${key.replace('acex_', '')}: ${value}`);
  });

  console.log(`\n📊 Total de itens salvos: ${totalItems}`);

  // Calcular tamanho do armazenamento
  let totalSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }

  console.log(`💾 Tamanho total localStorage: ${(totalSize / 1024).toFixed(2)} KB`);

  return {
    state,
    totalItems,
    totalSizeKB: (totalSize / 1024).toFixed(2)
  };
};

// Disponibilizar globalmente no desenvolvimento
if (typeof window !== 'undefined') {
  (window as any).clearSavedDataOnly = clearSavedDataOnly;
  (window as any).checkCurrentDataState = checkCurrentDataState;
}

export default clearSavedDataOnly; 