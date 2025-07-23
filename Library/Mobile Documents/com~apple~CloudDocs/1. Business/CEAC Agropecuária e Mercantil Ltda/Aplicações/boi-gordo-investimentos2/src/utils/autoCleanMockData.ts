/**
 * Limpeza automática de dados mock na inicialização
 * Executa automaticamente quando o sistema carrega
 */

export const autoCleanMockData = () => {
  // Só executar no cliente
  if (typeof window === 'undefined') return;

  console.log('🔍 Verificando dados mock para limpeza automática...');

  const keys = ['acex_positions', 'acex_options', 'acex_transactions', 'acex_users', 'acex_brokerages'];
  let foundMockData = false;
  let itemsToRemove = [];

  // Verificar se há dados mock
  keys.forEach(key => {
    const rawData = localStorage.getItem(key);
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData);
        const data = parsed.data || parsed;
        
        if (Array.isArray(data) && data.length > 0) {
          data.forEach((item) => {
            // Detectar posições de exemplo (BGI, CCM)
            if (item.contract && (item.contract.includes('BGI') || item.contract.includes('CCM'))) {
              itemsToRemove.push(`${item.contract} (${item.quantity || 'N/A'} lotes)`);
              foundMockData = true;
            }
            // Detectar usuários de exemplo
            if (item.nome && (item.nome.includes('Carlos Eduardo') || item.nome.includes('Maria Silva'))) {
              itemsToRemove.push(`Usuário: ${item.nome}`);
              foundMockData = true;
            }
            // Detectar corretoras de exemplo
            if (item.nome && (item.nome.includes('ACEX') || item.nome.includes('XP Investimentos'))) {
              itemsToRemove.push(`Corretora: ${item.nome}`);
              foundMockData = true;
            }
          });
        }
      } catch (e) {
        console.log(`Erro ao verificar ${key}:`, e.message);
      }
    }
  });

  // Se não há dados mock, não fazer nada
  if (!foundMockData) {
    console.log('✅ Sistema limpo - nenhum dado mock encontrado');
    return false;
  }

  // Executar limpeza automática
  console.log('🧹 EXECUTANDO LIMPEZA AUTOMÁTICA DE DADOS MOCK...');
  console.log('📋 Itens encontrados:', itemsToRemove);

  // Remover todos os dados ACEX
  const allKeys = [...keys, 'acex_current_user', 'acex_selected_brokerage', 'acex_id_counters'];
  
  allKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ ${key} removido`);
  });

  // Verificar se limpeza foi bem-sucedida
  let remainingData = false;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('acex_')) {
      console.log(`❌ Ainda existe: ${key}`);
      remainingData = true;
    }
  });

  if (!remainingData) {
    console.log('✅ LIMPEZA AUTOMÁTICA CONCLUÍDA COM SUCESSO!');
    console.log(`📊 Removidos: ${itemsToRemove.join(', ')}`);
    
    // Mostrar notificação visual
    showCleanupNotification(itemsToRemove.length);
    
    return true;
  } else {
    console.log('⚠️ Alguns dados ainda existem após limpeza');
    return false;
  }
};

// Mostrar notificação visual da limpeza
const showCleanupNotification = (itemCount: number) => {
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(34, 197, 94, 0.95);
      color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 350px;
      border-left: 4px solid #22c55e;
    ">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 18px; margin-right: 8px;">🧹</span>
        <strong>Limpeza Automática Concluída</strong>
      </div>
      <div style="font-size: 12px; opacity: 0.9;">
        ${itemCount} itens de dados mock foram removidos automaticamente, incluindo BGIF25.
      </div>
      <div style="margin-top: 10px; font-size: 11px; opacity: 0.8;">
        Sistema agora está limpo e pronto para dados reais.
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Remover notificação após 5 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
};

// Executar automaticamente quando importado
if (typeof window !== 'undefined') {
  // Aguardar um pouco para garantir que a página carregou
  setTimeout(() => {
    autoCleanMockData();
  }, 1000);
}

export default autoCleanMockData; 