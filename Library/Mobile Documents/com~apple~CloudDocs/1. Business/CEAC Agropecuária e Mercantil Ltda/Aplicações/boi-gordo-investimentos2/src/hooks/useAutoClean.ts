import { useEffect, useState } from 'react';

export const useAutoClean = () => {
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  useEffect(() => {
    const executeAutoClean = () => {
      console.log('🔍 Auto-limpeza iniciada...');

      const keys = ['acex_positions', 'acex_options', 'acex_transactions', 'acex_users', 'acex_brokerages'];
      let foundMockData = false;
      let itemsFound = [];

      // Verificar dados mock
      keys.forEach(key => {
        const rawData = localStorage.getItem(key);
        if (rawData) {
          try {
            const parsed = JSON.parse(rawData);
            const data = parsed.data || parsed;
            
            if (Array.isArray(data) && data.length > 0) {
              data.forEach((item) => {
                if (item.contract && (item.contract.includes('BGI') || item.contract.includes('CCM'))) {
                  itemsFound.push(`${item.contract}(${item.quantity || '?'})`);
                  foundMockData = true;
                }
                if (item.nome && (item.nome.includes('Carlos') || item.nome.includes('Maria'))) {
                  itemsFound.push(`User:${item.nome.split(' ')[0]}`);
                  foundMockData = true;
                }
                if (item.nome && item.cnpj && item.nome.includes('ACEX')) {
                  itemsFound.push(`Broker:${item.nome}`);
                  foundMockData = true;
                }
              });
            }
          } catch (e) {
            // Ignorar erros de parsing
          }
        }
      });

      if (!foundMockData) {
        console.log('✅ Sistema já limpo');
        return;
      }

      // Executar limpeza
      console.log('🧹 Removendo dados mock:', itemsFound);
      
      const allKeys = [...keys, 'acex_current_user', 'acex_selected_brokerage', 'acex_id_counters'];
      allKeys.forEach(key => localStorage.removeItem(key));

      setCleanupResult(`Removidos: ${itemsFound.join(', ')}`);
      
      // Recarregar após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    };

    // Executar após 500ms para garantir que a página carregou
    const timer = setTimeout(executeAutoClean, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return { cleanupResult };
}; 