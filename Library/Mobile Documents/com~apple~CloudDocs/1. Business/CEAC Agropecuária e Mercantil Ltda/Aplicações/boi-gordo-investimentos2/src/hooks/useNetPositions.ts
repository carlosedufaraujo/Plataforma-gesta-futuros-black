'use client';

import { useMemo } from 'react';
import { useHybridData } from '@/contexts/HybridDataContext';
import { Position, Transaction } from '@/types';

export interface NetPosition {
  contract: string;
  product: string;
  buyQuantity: number;
  sellQuantity: number;
  netQuantity: number; // Mantém sinal negativo para VENDA
  netDirection: 'COMPRA' | 'VENDA' | 'NEUTRO';
  positions: Position[];
  weightedEntryPrice: number;
  currentPrice: number;
  totalValue: number;
  unrealizedPnL: number;
  exposure: number;
  accumulatedPnL?: number; // P&L acumulado de operações parciais (modelo correto)
}

export const useNetPositions = (filteredTransactions?: Transaction[]) => {
  const { positions, transactions, calculateNetPosition, getAllNetPositions, isPositionNeutralized } = useHybridData();
  
  // Usar transações filtradas se fornecidas, senão usar todas
  const transactionsToUse = filteredTransactions || transactions;

  // ✅ MODELO CORRETO: Calcular posições líquidas seguindo especificações de commodities
  const netPositions = useMemo((): NetPosition[] => {
    console.log('🎯 MODELO CORRETO: Calculando posições NET conforme especificações...');
    
    // Incluir TODAS as posições (EXECUTADA, EM_ABERTO, FECHADA) para cálculo NET
    const allPositions = positions.filter(p => 
      p.status === 'EXECUTADA' || p.status === 'EM_ABERTO' || p.status === 'FECHADA'
    );
    const contracts = [...new Set(allPositions.map(p => p.contract))];
    
    console.log(`📊 Total de posições analisadas: ${allPositions.length}`);
    console.log(`📋 Contratos únicos: ${contracts.length} - ${contracts.join(', ')}`);
    
    return contracts.map(contract => {
      const contractPositions = allPositions.filter(p => p.contract === contract);
      
      console.log(`\n🎯 CONTRATO ${contract} (MODELO CORRETO):`);
      console.log(`   Total de posições: ${contractPositions.length}`);
      
      // Verificar se há transações para este contrato para usar cálculo correto
      const contractTransactions = transactionsToUse.filter(t => t.contract === contract);
      
      if (contractTransactions.length > 0) {
        console.log(`   📊 Usando transações para cálculo preciso (${contractTransactions.length} transações)`);
        
        // Usar a mesma lógica do recalculatePosition para consistência
        const sortedTransactions = [...contractTransactions].sort((a, b) => 
          new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime()
        );
        
        // Estado da posição seguindo o modelo
        let posicaoAtual = 0;
        let precoMedioAtual = 0;
        let pnlAcumulado = 0;
        
        sortedTransactions.forEach((transacao) => {
          const isBoiGordo = transacao.contract.startsWith('BGI');
          const especificacao = isBoiGordo ? 330 : 450;
          const qtdOperacao = transacao.type === 'COMPRA' ? transacao.quantity : -transacao.quantity;
          const precoOperacao = transacao.price;
          
          if (posicaoAtual === 0) {
            // ABERTURA
            posicaoAtual = qtdOperacao;
            precoMedioAtual = precoOperacao;
          } else if ((posicaoAtual > 0 && qtdOperacao > 0) || (posicaoAtual < 0 && qtdOperacao < 0)) {
            // REFORÇO - Recalcular PM ponderado
            const valorAtual = Math.abs(posicaoAtual) * precoMedioAtual;
            const valorNovo = Math.abs(qtdOperacao) * precoOperacao;
            const novaQuantidade = Math.abs(posicaoAtual + qtdOperacao);
            precoMedioAtual = novaQuantidade > 0 ? (valorAtual + valorNovo) / novaQuantidade : 0;
            posicaoAtual += qtdOperacao;
          } else if (Math.abs(qtdOperacao) <= Math.abs(posicaoAtual)) {
            // REDUÇÃO - PM permanece, calcular P&L parcial
            const qtdReduzida = Math.abs(qtdOperacao);
            const pnlParcial = qtdReduzida * especificacao * (
              posicaoAtual > 0 ? 
                (precoOperacao - precoMedioAtual) :
                (precoMedioAtual - precoOperacao)
            );
            pnlAcumulado += pnlParcial;
            posicaoAtual += qtdOperacao;
            // PM permanece o mesmo
          } else {
            // INVERSÃO - Fechar posição atual e abrir nova
            const qtdFechamento = Math.abs(posicaoAtual);
            const pnlFechamento = qtdFechamento * especificacao * (
              posicaoAtual > 0 ? 
                (precoOperacao - precoMedioAtual) :
                (precoMedioAtual - precoOperacao)
            );
            pnlAcumulado += pnlFechamento;
            posicaoAtual = qtdOperacao + posicaoAtual; // Quantidade restante
            precoMedioAtual = precoOperacao; // Novo PM
          }
        });
        
        const netQuantity = posicaoAtual;
        const netDirection = netQuantity > 0 ? 'COMPRA' : netQuantity < 0 ? 'VENDA' : 'NEUTRO';
        
        console.log(`   ➡️  RESULTADO NET (MODELO): ${netQuantity} (${netDirection}) @ R$ ${precoMedioAtual.toFixed(2)}`);
        
        // FILTRAR POSIÇÕES NEUTRALIZADAS para aba Gestão
        if (netQuantity === 0) {
          console.log(`   ✅ POSIÇÃO NEUTRALIZADA - removida da aba Gestão`);
          return null;
        }
        
        // Calcular P&L não realizado e exposição
        const contractSize = contract.startsWith('BGI') ? 330 : 450;
        const currentPrice = contractPositions.find(p => p.current_price)?.current_price || precoMedioAtual;
        const priceDiff = currentPrice - precoMedioAtual;
        
        let unrealizedPnL = 0;
        if (netDirection === 'COMPRA') {
          unrealizedPnL = priceDiff * Math.abs(netQuantity) * contractSize;
        } else if (netDirection === 'VENDA') {
          unrealizedPnL = -priceDiff * Math.abs(netQuantity) * contractSize;
        }
        
        const exposure = precoMedioAtual * Math.abs(netQuantity) * contractSize;
        
        console.log(`   💰 P&L Não Realizado: R$ ${unrealizedPnL.toFixed(2)}`);
        console.log(`   📊 Exposição: R$ ${exposure.toFixed(2)}`);
        
        return {
          contract,
          product: contract.startsWith('BGI') ? 'Boi Gordo' : 'Milho',
          buyQuantity: netQuantity > 0 ? Math.abs(netQuantity) : 0,
          sellQuantity: netQuantity < 0 ? Math.abs(netQuantity) : 0,
          netQuantity,
          netDirection,
          positions: contractPositions,
          weightedEntryPrice: precoMedioAtual,
          currentPrice,
          totalValue: exposure,
          unrealizedPnL,
          exposure,
          accumulatedPnL: pnlAcumulado
        };
        
      } else {
        // Fallback: usar cálculo baseado em posições (método anterior)
        console.log(`   ⚠️  Sem transações - usando cálculo baseado em posições`);
        
        let symbolSum = 0;
        let buyTotal = 0;
        let sellTotal = 0;
        let buyQuantity = 0;
        let sellQuantity = 0;
        
        contractPositions.forEach(pos => {
          const symbolQuantity = pos.direction === 'COMPRA' ? +pos.quantity : -pos.quantity;
          symbolSum += symbolQuantity;
          
          if (pos.direction === 'COMPRA') {
            buyQuantity += pos.quantity;
            buyTotal += pos.quantity * pos.entry_price;
          } else {
            sellQuantity += pos.quantity;
            sellTotal += pos.quantity * pos.entry_price;
          }
          
          console.log(`   ${pos.direction} ${pos.quantity} @ R$ ${pos.entry_price.toFixed(2)} = ${symbolQuantity} (${pos.status})`);
        });
        
        const netQuantity = symbolSum;
        const netDirection = netQuantity > 0 ? 'COMPRA' : netQuantity < 0 ? 'VENDA' : 'NEUTRO';
        
        console.log(`   ➡️  RESULTADO NET (FALLBACK): ${netQuantity} (${netDirection})`);
        
        if (netQuantity === 0) {
          console.log(`   ✅ POSIÇÃO NEUTRALIZADA - removida da aba Gestão`);
          return null;
        }
        
        const totalValue = buyTotal + sellTotal;
        const totalQuantity = buyQuantity + sellQuantity;
        const weightedEntryPrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
        const currentPrice = contractPositions.find(p => p.current_price)?.current_price || weightedEntryPrice;
        const contractSize = contract.startsWith('BGI') ? 330 : 450;
        const priceDiff = currentPrice - weightedEntryPrice;
        
        let unrealizedPnL = 0;
        if (netDirection === 'COMPRA') {
          unrealizedPnL = priceDiff * Math.abs(netQuantity) * contractSize;
        } else if (netDirection === 'VENDA') {
          unrealizedPnL = -priceDiff * Math.abs(netQuantity) * contractSize;
        }
        
        const exposure = weightedEntryPrice * Math.abs(netQuantity) * contractSize;
        
        return {
          contract,
          product: contract.startsWith('BGI') ? 'Boi Gordo' : 'Milho',
          buyQuantity,
          sellQuantity,
          netQuantity,
          netDirection,
          positions: contractPositions,
          weightedEntryPrice,
          currentPrice,
          totalValue,
          unrealizedPnL,
          exposure,
          accumulatedPnL: 0
        };
      }
    }).filter(net => net !== null && net.netQuantity !== 0);
  }, [positions, transactionsToUse]);

  // ❌ REMOVIDO: allPositionsIncludingClosed 
  // ✅ CORREÇÃO: Agora usamos apenas getNeutralizedPositionsForPerformance para Performance

  // Estatísticas gerais
  const netStats = useMemo(() => {
    const totalUnrealizedPnL = netPositions.reduce((sum, net) => sum + net.unrealizedPnL, 0);
    const totalExposure = netPositions.reduce((sum, net) => sum + net.exposure, 0);
    const buyPositions = netPositions.filter(net => net.netDirection === 'COMPRA').length;
    const sellPositions = netPositions.filter(net => net.netDirection === 'VENDA').length;
    const neutralPositions = positions.filter(p => p.status === 'OPEN').length - 
                           netPositions.reduce((sum, net) => sum + net.positions.length, 0);

    return {
      totalUnrealizedPnL,
      totalExposure,
      buyPositions,
      sellPositions,
      neutralPositions,
      totalNetPositions: netPositions.length
    };
  }, [netPositions, positions]);

  // Função para obter posição líquida de um contrato específico
  const getNetPositionByContract = (contract: string): NetPosition | null => {
    return netPositions.find(net => net.contract === contract) || null;
  };

  // Função para verificar se uma posição individual está neutralizada
  const checkPositionNeutralization = (positionId: string): boolean => {
    return isPositionNeutralized(positionId);
  };

  // Função para formatar quantidade com sinal matemático direto
  const formatNetQuantity = (netQuantity: number): string => {
    if (netQuantity === 0) return '±0';
    return `${netQuantity}`; // O sinal matemático na quantidade já indica a direção
  };

  // Função para formatar transação com símbolos (matematicamente correto)
  const formatTransactionSymbol = (type: string, quantity: number): string => {
    return type === 'COMPRA' ? `${quantity}` : `-${quantity}`;
  };

  // Função para aplicar jogo de símbolos em array de transações (matematicamente correto)
  const applySymbolCalculation = (transactions: any[]): string => {
    let calculation = '';
    let total = 0;
    
    transactions.forEach((t, index) => {
      const symbolQuantity = t.type === 'COMPRA' ? +t.quantity : -t.quantity;
      total += symbolQuantity;
      
      if (index > 0) calculation += ' ';
      calculation += `${symbolQuantity}`;
    });
    
    calculation += ` = ${total}`;
    return calculation;
  };

  // Função para obter cor baseada na direção
  const getDirectionColor = (netDirection: string): string => {
    switch (netDirection) {
      case 'COMPRA': return 'var(--color-success)';
      case 'VENDA': return 'var(--color-danger)';
      case 'NEUTRO': return 'var(--color-secondary)';
      default: return 'var(--text-primary)';
    }
  };

  // 🚀 NOVA FUNÇÃO: Detectar P&L realizado (reduções parciais + fechamentos)
  const getRealizedPnL = useMemo(() => {
    console.log('💰 P&L REALIZADO: Detectando reduções parciais e fechamentos...');
    
    const realizedPnLEntries: any[] = [];
    const contracts = [...new Set(transactionsToUse.map(t => t.contract))];
    
    contracts.forEach(contract => {
      console.log(`\n🔍 ANALISANDO P&L REALIZADO: ${contract}`);
      
      const contractTransactions = transactionsToUse
        .filter(t => t.contract === contract)
        .sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt || '');
          const dateB = new Date(b.date || b.createdAt || '');
          return dateA.getTime() - dateB.getTime();
        });
      
      if (contractTransactions.length < 2) {
        console.log(`⏭️  Pulando ${contract}: apenas ${contractTransactions.length} transação(ões)`);
        return;
      }
      
      // Processar transações cronologicamente
      let saldoCorrente = 0;
      let precoMedioEntrada = 0;
      let pnlRealizado = 0;
      let operacoesRealizadas = [];
      const contractSize = contract.startsWith('BGI') ? 330 : 450;
      
      contractTransactions.forEach((transaction, index) => {
        const quantidade = transaction.quantity;
        const preco = transaction.price;
        const tipo = transaction.type;
        
        console.log(`  📝 Transação ${index + 1}: ${tipo} ${quantidade} @ R$ ${preco} (Saldo: ${saldoCorrente})`);
        
        // Detectar operações que geram P&L realizado
        if (tipo === 'COMPRA') {
          if (saldoCorrente < 0) {
            // Redução de posição SHORT (gera P&L)
            const quantidadeReduzida = Math.min(quantidade, Math.abs(saldoCorrente));
            const pnlOperacao = quantidadeReduzida * (precoMedioEntrada - preco) * contractSize;
            
            if (quantidadeReduzida > 0) {
              pnlRealizado += pnlOperacao;
              operacoesRealizadas.push({
                tipo: 'REDUÇÃO SHORT',
                quantidade: quantidadeReduzida,
                precoEntrada: precoMedioEntrada,
                precoSaida: preco,
                pnl: pnlOperacao,
                data: transaction.date || transaction.createdAt
              });
              
              console.log(`    💰 P&L REALIZADO: ${quantidadeReduzida} contratos SHORT @ R$ ${precoMedioEntrada} → R$ ${preco} = R$ ${pnlOperacao.toFixed(2)}`);
            }
          }
          
          // Atualizar saldo
          if (saldoCorrente <= 0) {
            precoMedioEntrada = preco;
          } else {
            precoMedioEntrada = ((saldoCorrente * precoMedioEntrada) + (quantidade * preco)) / (saldoCorrente + quantidade);
          }
          saldoCorrente += quantidade;
          
        } else if (tipo === 'VENDA') {
          if (saldoCorrente > 0) {
            // Redução de posição LONG (gera P&L)
            const quantidadeReduzida = Math.min(quantidade, saldoCorrente);
            const pnlOperacao = quantidadeReduzida * (preco - precoMedioEntrada) * contractSize;
            
            if (quantidadeReduzida > 0) {
              pnlRealizado += pnlOperacao;
              operacoesRealizadas.push({
                tipo: 'REDUÇÃO LONG',
                quantidade: quantidadeReduzida,
                precoEntrada: precoMedioEntrada,
                precoSaida: preco,
                pnl: pnlOperacao,
                data: transaction.date || transaction.createdAt
              });
              
              console.log(`    💰 P&L REALIZADO: ${quantidadeReduzida} contratos LONG @ R$ ${precoMedioEntrada} → R$ ${preco} = R$ ${pnlOperacao.toFixed(2)}`);
            }
          }
          
          // Atualizar saldo
          if (saldoCorrente >= 0) {
            precoMedioEntrada = preco;
          } else {
            precoMedioEntrada = ((Math.abs(saldoCorrente) * precoMedioEntrada) + (quantidade * preco)) / (Math.abs(saldoCorrente) + quantidade);
          }
          saldoCorrente -= quantidade;
        }
        
        // Detectar fechamento completo
        if (saldoCorrente === 0 && operacoesRealizadas.length > 0) {
          console.log(`    ✅ FECHAMENTO COMPLETO DETECTADO: P&L Total = R$ ${pnlRealizado.toFixed(2)}`);
        }
      });
      
      // Adicionar entrada se houve P&L realizado
      if (pnlRealizado !== 0) {
        const ultimaOperacao = operacoesRealizadas[operacoesRealizadas.length - 1];
        const status = saldoCorrente === 0 ? 'FECHADA' : 'REDUÇÃO PARCIAL';
        
        realizedPnLEntries.push({
          contract,
          product: contract.startsWith('BGI') ? 'Boi Gordo' : 'Milho',
          pnl: pnlRealizado, // ✅ CORRIGIDO: Usar o P&L total acumulado
          status,
          operacoesRealizadas,
          quantidadeLiquidada: operacoesRealizadas.reduce((sum, op) => sum + op.quantidade, 0),
          ultimaOperacao: ultimaOperacao?.data,
          saldoAtual: saldoCorrente
        });
        
        console.log(`    📊 ENTRADA CRIADA: ${contract} - ${status} - P&L TOTAL: R$ ${pnlRealizado.toFixed(2)}`);
      }
    });
    
    console.log(`💰 P&L REALIZADO: ${realizedPnLEntries.length} entradas encontradas`);
    return realizedPnLEntries;
  }, [transactionsToUse]);

  // 🚀 NOVA FUNÇÃO: Detectar neutralizações históricas cronológicas
  const getNeutralizedPositionsForPerformance = useMemo(() => {
    console.log('🔍 PERFORMANCE: Detectando neutralizações históricas (LÓGICA CRONOLÓGICA)...');
    console.log('🔍 DADOS DE ENTRADA:', {
      totalTransacoes: transactionsToUse.length,
      contratosUnicos: [...new Set(transactionsToUse.map(t => t.contract))]
    });
    
    const neutralizedContracts: any[] = [];
    const contracts = [...new Set(transactionsToUse.map(t => t.contract))];
    
    console.log(`📋 PERFORMANCE: Analisando ${contracts.length} contratos para neutralizações históricas:`, contracts);
    
    contracts.forEach(contract => {
      console.log(`\n🔍 ANALISANDO NEUTRALIZAÇÕES HISTÓRICAS: ${contract}`);
      
      const contractTransactions = transactionsToUse.filter(t => t.contract === contract);
      
      if (contractTransactions.length < 2) {
        console.log(`⏭️  Pulando ${contract}: apenas ${contractTransactions.length} transação(ões)`);
        return;
      }
      
      // 🚨 LOG ESPECÍFICO PARA BGIN
      if (contract.includes('BGIN')) {
        console.log(`🚨 PROCESSANDO NEUTRALIZAÇÕES BGIN: ${contract}`);
        console.log(`🚨 TRANSAÇÕES BGIN:`, contractTransactions.map(t => ({
          data: t.date || t.createdAt,
          tipo: t.type,
          quantidade: t.quantity,
          preco: t.price
        })));
      }
      
      // Ordenar transações cronologicamente
      const sortedTransactions = contractTransactions.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || '');
        const dateB = new Date(b.date || b.createdAt || '');  
        return dateA.getTime() - dateB.getTime();
      });
      
      console.log(`📊 ${contract}: Processando ${sortedTransactions.length} transações cronologicamente`);
      
      // 🔥 NOVA LÓGICA: Detectar neutralizações históricas
      let saldoCorrente = 0;
      let precoMedioEntrada = 0;
      let pnlAcumulado = 0;
      let neutralizacoesDetectadas = [];
      let transacoesParaNeutralizacao = [];
      let valorComprasNeutralizacao = 0;
      let valorVendasNeutralizacao = 0;
      let quantidadeComprasNeutralizacao = 0;
      let quantidadeVendasNeutralizacao = 0;
      
      const contractSize = contract.startsWith('BGI') ? 330 : 450;
      
      sortedTransactions.forEach((transaction, index) => {
        const quantidade = transaction.quantity;
        const preco = transaction.price;
        const valorTransacao = quantidade * preco * contractSize;
        
        console.log(`  📝 Transação ${index + 1}: ${transaction.type} ${quantidade} @ R$ ${preco} (Saldo antes: ${saldoCorrente})`);
        
        // Acumular dados para neutralização
        if (transaction.type === 'COMPRA') {
          valorComprasNeutralizacao += valorTransacao;
          quantidadeComprasNeutralizacao += quantidade;
        } else {
          valorVendasNeutralizacao += valorTransacao;
          quantidadeVendasNeutralizacao += quantidade;
        }
        
        // Processar transação com lógica correta
        if (transaction.type === 'COMPRA') {
          if (saldoCorrente >= 0) {
            // ABERTURA ou REFORÇO LONG
            const novaQuantidadeTotal = saldoCorrente + quantidade;
            if (saldoCorrente > 0) {
              precoMedioEntrada = ((saldoCorrente * precoMedioEntrada) + (quantidade * preco)) / novaQuantidadeTotal;
            } else {
              precoMedioEntrada = preco;
            }
            saldoCorrente = novaQuantidadeTotal;
          } else {
            // REDUÇÃO SHORT ou INVERSÃO
            const quantidadeReduzida = Math.min(quantidade, Math.abs(saldoCorrente));
            const pnlOperacao = quantidadeReduzida * (precoMedioEntrada - preco) * contractSize;
            pnlAcumulado += pnlOperacao;
            
            saldoCorrente += quantidade;
            
            if (saldoCorrente > 0) {
              precoMedioEntrada = preco;
            }
          }
        } else {
          if (saldoCorrente <= 0) {
            // ABERTURA ou REFORÇO SHORT
            const novaQuantidadeTotal = saldoCorrente - quantidade;
            if (saldoCorrente < 0) {
              precoMedioEntrada = ((Math.abs(saldoCorrente) * precoMedioEntrada) + (quantidade * preco)) / Math.abs(novaQuantidadeTotal);
            } else {
              precoMedioEntrada = preco;
            }
            saldoCorrente = novaQuantidadeTotal;
          } else {
            // REDUÇÃO LONG ou INVERSÃO
            const quantidadeReduzida = Math.min(quantidade, saldoCorrente);
            const pnlOperacao = quantidadeReduzida * (preco - precoMedioEntrada) * contractSize;
            pnlAcumulado += pnlOperacao;
            
            saldoCorrente -= quantidade;
            
            if (saldoCorrente < 0) {
              precoMedioEntrada = preco;
            }
          }
        }
        
        transacoesParaNeutralizacao.push({
          tipo: transaction.type,
          quantidade,
          preco,
          valor: valorTransacao,
          data: transaction.date || transaction.createdAt,
          saldoApos: saldoCorrente
        });
        
        console.log(`    💰 Saldo após: ${saldoCorrente}, P&L acumulado: R$ ${pnlAcumulado.toFixed(2)}`);
        
        // 🎯 DETECTAR NEUTRALIZAÇÃO HISTÓRICA (TODAS as vezes que chega a zero)
        if (saldoCorrente === 0) {
          const neutralizacao = {
            dataUltimaNeutralizacao: transaction.date || transaction.createdAt,
            pnlNeutralizacao: pnlAcumulado,
            valorCompras: valorComprasNeutralizacao,
            valorVendas: valorVendasNeutralizacao,
            quantidadeCompras: quantidadeComprasNeutralizacao,
            quantidadeVendas: quantidadeVendasNeutralizacao,
            transacoesProcessadas: [...transacoesParaNeutralizacao],
            indexNeutralizacao: index + 1
          };
          
          neutralizacoesDetectadas.push(neutralizacao);
          
          console.log(`🎊 NEUTRALIZAÇÃO HISTÓRICA DETECTADA em ${contract} (${neutralizacoesDetectadas.length + 1}ª vez)!`);
          console.log(`   📅 Data: ${neutralizacao.dataUltimaNeutralizacao}`);
          console.log(`   💰 P&L: R$ ${neutralizacao.pnlNeutralizacao.toFixed(2)}`);
          console.log(`   📊 Transações até neutralização: ${neutralizacao.indexNeutralizacao}`);
          
          // 🚨 LOG ESPECÍFICO BGIN
          if (contract.includes('BGIN')) {
            console.log(`🚨 BGIN NEUTRALIZAÇÃO DETECTADA (${neutralizacoesDetectadas.length + 1}ª vez): P&L = R$ ${neutralizacao.pnlNeutralizacao.toFixed(2)}`);
          }
        }
      });
      
      // Se detectou neutralização histórica, adicionar à Performance
      if (neutralizacoesDetectadas.length > 0) {
        const neutralizacao = neutralizacoesDetectadas[neutralizacoesDetectadas.length - 1]; // ÚLTIMA neutralização (mais recente)
        
        console.log(`🎯 USANDO NEUTRALIZAÇÃO ${neutralizacoesDetectadas.length} de ${neutralizacoesDetectadas.length} para ${contract}`);
         
         const neutralizedPosition = {
           contract: contract,
           product: contract.startsWith('BGI') ? 'Boi Gordo' : 'Milho',
           netQuantity: Math.min(neutralizacao.quantidadeCompras, neutralizacao.quantidadeVendas), // Quantidade netada (liquidada)
           direction: 'FECHADA',
           pnl: neutralizacao.pnlNeutralizacao,
           exposure: 0, // Exposição é 0 para posições fechadas
           roi: neutralizacao.valorCompras > 0 ? (neutralizacao.pnlNeutralizacao / neutralizacao.valorCompras) * 100 : 0,
           status: 'FECHADA',
           commodity: contract.startsWith('BGI') ? 'BOI GORDO' : 'MILHO',
           lastTransactionDate: neutralizacao.dataUltimaNeutralizacao,
           valorTotalCompras: neutralizacao.valorCompras,
           valorTotalVendas: neutralizacao.valorVendas,
           quantidadeCompras: neutralizacao.quantidadeCompras,
           quantidadeVendas: neutralizacao.quantidadeVendas,
           transacoesProcessadas: neutralizacao.transacoesProcessadas,
           saldoFinalAposNeutralizacao: saldoCorrente // Para debug
         };
         
         neutralizedContracts.push(neutralizedPosition);
         console.log(`✅ PERFORMANCE: ${contract} adicionado com neutralização ${neutralizacoesDetectadas.length} - P&L: R$ ${neutralizacao.pnlNeutralizacao.toFixed(2)}, Saldo final atual: ${saldoCorrente}`);
         console.log(`   📊 Total de neutralizações detectadas: ${neutralizacoesDetectadas.length}`);
         console.log(`   📅 Datas das neutralizações:`, neutralizacoesDetectadas.map((n, i) => `${i+1}ª: ${n.dataUltimaNeutralizacao}`));
         
         // 🚨 LOG ESPECÍFICO BGIN
         if (contract.includes('BGIN')) {
           console.log(`🚨 BGIN ADICIONADO À PERFORMANCE: P&L = R$ ${neutralizacao.pnlNeutralizacao.toFixed(2)}, Total neutralizações = ${neutralizacoesDetectadas.length}`);
         }
       } else {
         console.log(`❌ PERFORMANCE: ${contract} não teve neutralização histórica - Saldo final: ${saldoCorrente}`);
       }
     });
    
    console.log(`📊 PERFORMANCE: Posições neutralizadas encontradas: ${neutralizedContracts.length}`);
    if (neutralizedContracts.length > 0) {
      console.log('🎊 PERFORMANCE: Posições neutralizadas detectadas:', neutralizedContracts.map(c => c.contract));
    }
    
    // 🚨 LOG ESPECÍFICO BGIN
    const bginNeutralizadas = neutralizedContracts.filter(c => c.contract.includes('BGIN'));
    console.log('🚨 BGIN NEUTRALIZADAS DETECTADAS:', bginNeutralizadas.length, bginNeutralizadas.map(c => c.contract));
    
    return neutralizedContracts;
  }, [transactionsToUse, positions]);

  // 🎯 NOVA FUNÇÃO: Detectar P&L parciais já realizados para aba Performance
  const getPartialPnLForPerformance = useMemo(() => {
    console.log('🎯 DETECTANDO P&L PARCIAIS para aba Performance...');
    console.log('🎯 DADOS ESPECÍFICOS BGIN:', {
      bginTransacoes: transactionsToUse.filter(t => t.contract.includes('BGIN')),
      totalBginTransacoes: transactionsToUse.filter(t => t.contract.includes('BGIN')).length
    });
    
    const partialPnLEntries: any[] = [];
    const contracts = [...new Set(transactionsToUse.map(t => t.contract))];
    
    console.log(`📋 Analisando ${contracts.length} contratos para P&L parciais:`, contracts);
    console.log('📋 FOCO BGIN:', contracts.filter(c => c.includes('BGIN')));
    
          contracts.forEach(contract => {
        const contractTransactions = transactionsToUse.filter(t => t.contract === contract);
        
        // 🚨 LOG ESPECÍFICO PARA BGIN
        if (contract.includes('BGIN')) {
          console.log(`🚨 PROCESSANDO CONTRATO BGIN: ${contract}`);
          console.log(`🚨 TRANSAÇÕES BGIN:`, contractTransactions.map(t => ({
            data: t.date || t.createdAt,
            tipo: t.type,
            quantidade: t.quantity,
            preco: t.price
          })));
        }
        
        if (contractTransactions.length < 2) {
          console.log(`⏭️  Pulando ${contract}: apenas ${contractTransactions.length} transação(ões)`);
          if (contract.includes('BGIN')) {
            console.log(`🚨 BGIN PULADO: Precisa de pelo menos 2 transações para P&L parcial!`);
          }
          return;
        }
        
        console.log(`\n🔍 Analisando P&L parciais para ${contract}: ${contractTransactions.length} transações`);
        
        // 🚨 DEBUG: Mostrar todas as transações do contrato
        console.log(`📋 ${contract} - TRANSAÇÕES COMPLETAS:`, contractTransactions.map(t => ({
          data: new Date(t.date || t.createdAt).toLocaleString('pt-BR'),
          tipo: t.type,
          quantidade: t.quantity,
          preco: `R$ ${t.price.toFixed(2)}`,
          id: t.id
        })));
      
      // Usar mesma lógica do recalculatePosition para detectar P&L parciais
      const sortedTransactions = [...contractTransactions].sort((a, b) => 
        new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime()
      );
      
      let posicaoAtual = 0;
      let precoMedioAtual = 0;
      let pnlAcumuladoParcial = 0;
      let operacoesParciais: any[] = [];
      
      sortedTransactions.forEach((transacao, index) => {
        const isBoiGordo = transacao.contract.startsWith('BGI');
        const especificacao = isBoiGordo ? 330 : 450;
        const unidade = isBoiGordo ? '@' : 'sc';
        const qtdOperacao = transacao.type === 'COMPRA' ? transacao.quantity : -transacao.quantity;
        const precoOperacao = transacao.price;
        
        console.log(`   Operação ${index + 1}: ${transacao.type} ${Math.abs(qtdOperacao)} @ R$ ${precoOperacao.toFixed(2)}/${unidade}`);
        
        if (posicaoAtual === 0) {
          // ABERTURA DE POSIÇÃO
          posicaoAtual = qtdOperacao;
          precoMedioAtual = precoOperacao;
          console.log(`   → ABERTURA: ${posicaoAtual > 0 ? '+' : ''}${posicaoAtual} @ R$ ${precoMedioAtual.toFixed(2)}/${unidade}`);
          
        } else if ((posicaoAtual > 0 && qtdOperacao > 0) || (posicaoAtual < 0 && qtdOperacao < 0)) {
          // REFORÇO DE POSIÇÃO
          const valorAtual = Math.abs(posicaoAtual) * precoMedioAtual;
          const valorNovo = Math.abs(qtdOperacao) * precoOperacao;
          const novaQuantidade = Math.abs(posicaoAtual + qtdOperacao);
          precoMedioAtual = novaQuantidade > 0 ? (valorAtual + valorNovo) / novaQuantidade : 0;
          posicaoAtual += qtdOperacao;
          console.log(`   → REFORÇO: ${posicaoAtual > 0 ? '+' : ''}${posicaoAtual} @ R$ ${precoMedioAtual.toFixed(2)}/${unidade}`);
          
        } else if (Math.abs(qtdOperacao) <= Math.abs(posicaoAtual)) {
          // REDUÇÃO DE POSIÇÃO - GERA P&L PARCIAL!
          console.log(`    🎯 REDUÇÃO DETECTADA: ${transacao.type} ${Math.abs(qtdOperacao)} sobre posição ${posicaoAtual > 0 ? 'COMPRA' : 'VENDA'} ${Math.abs(posicaoAtual)}`);
          console.log(`       📊 Preços: Entrada R$ ${precoMedioAtual.toFixed(2)} → Saída R$ ${precoOperacao.toFixed(2)}`);
          
          const qtdReduzida = Math.abs(qtdOperacao);
          const pnlParcial = qtdReduzida * especificacao * (
            posicaoAtual > 0 ? 
              (precoOperacao - precoMedioAtual) :  // Posição LONG vendendo
              (precoMedioAtual - precoOperacao)    // Posição SHORT comprando
          );
          
          console.log(`       💰 Cálculo P&L: ${qtdReduzida} × ${especificacao} × (${posicaoAtual > 0 ? precoOperacao - precoMedioAtual : precoMedioAtual - precoOperacao}) = R$ ${pnlParcial.toFixed(2)}`);
          
          pnlAcumuladoParcial += pnlParcial;
          posicaoAtual += qtdOperacao;
          
          // 🎯 REGISTRAR OPERAÇÃO PARCIAL para Performance
          operacoesParciais.push({
            data: new Date(transacao.createdAt || transacao.date),
            tipo: 'REDUÇÃO PARCIAL',
            contratos: qtdReduzida,
            precoEntrada: precoMedioAtual,
            precoSaida: precoOperacao,
            pnlParcial: pnlParcial,
            diferenca: Math.abs(precoOperacao - precoMedioAtual),
            transacao: transacao
          });
          
          console.log(`   → REDUÇÃO: ${qtdReduzida} contratos realizados`);
          console.log(`     💰 P&L PARCIAL: R$ ${pnlParcial.toFixed(2)} (diferença: R$ ${Math.abs(precoOperacao - precoMedioAtual).toFixed(2)}/${unidade})`);
          console.log(`     ⚡ Posição restante: ${posicaoAtual > 0 ? '+' : ''}${posicaoAtual} @ R$ ${precoMedioAtual.toFixed(2)}/${unidade}`);
          
        } else {
          // INVERSÃO DE POSIÇÃO - TAMBÉM GERA P&L
          const qtdFechamento = Math.abs(posicaoAtual);
          const pnlFechamento = qtdFechamento * especificacao * (
            posicaoAtual > 0 ? 
              (precoOperacao - precoMedioAtual) :  // Posição LONG vendendo
              (precoMedioAtual - precoOperacao)    // Posição SHORT comprando
          );
          
          pnlAcumuladoParcial += pnlFechamento;
          
          operacoesParciais.push({
            data: new Date(transacao.createdAt || transacao.date),
            tipo: 'INVERSÃO PARCIAL',
            contratos: qtdFechamento,
            precoEntrada: precoMedioAtual,
            precoSaida: precoOperacao,
            pnlParcial: pnlFechamento,
            diferenca: Math.abs(precoOperacao - precoMedioAtual),
            transacao: transacao
          });
          
          // Nova posição na direção oposta
          const qtdNovaPosition = qtdOperacao + posicaoAtual;
          posicaoAtual = qtdNovaPosition;
          precoMedioAtual = precoOperacao;
          
          console.log(`   → INVERSÃO: ${qtdFechamento} contratos fechados`);
          console.log(`     💰 P&L FECHAMENTO: R$ ${pnlFechamento.toFixed(2)}`);
          console.log(`     🔄 Nova posição: ${posicaoAtual > 0 ? '+' : ''}${posicaoAtual} @ R$ ${precoMedioAtual.toFixed(2)}/${unidade}`);
        }
      });
      
      // 🎯 CORRIGIDO: Incluir na Performance se há operações de redução/inversão (independente do P&L)
      if (operacoesParciais.length > 0) {
        console.log(`🎯 ${contract}: INCLUINDO na Performance - ${operacoesParciais.length} operação(ões) parcial(is), P&L: R$ ${pnlAcumuladoParcial.toFixed(2)}`);
        // Calcular total de contratos liquidados parcialmente
        const contratosLiquidados = operacoesParciais.reduce((total, op) => total + op.contratos, 0);
        
        // Calcular exposição baseada nos contratos liquidados (para ROI correto)
        const isBoiGordo = contract.startsWith('BGI');
        const especificacao = isBoiGordo ? 330 : 450;
        const precoMedioLiquidacao = operacoesParciais.reduce((soma, op, idx, arr) => {
          return soma + (op.precoSaida * op.contratos);
        }, 0) / contratosLiquidados;
        const exposure = contratosLiquidados * especificacao * precoMedioLiquidacao;
        const roi = exposure > 0 ? (pnlAcumuladoParcial / exposure) * 100 : 0;

        partialPnLEntries.push({
          contract: contract,
          product: contract.startsWith('BGI') ? 'Boi Gordo' : 'Milho',
          status: posicaoAtual === 0 ? 'FECHADA' : 'P&L PARCIAL', // ✅ CORRIGIDO: Status correto
          pnl: pnlAcumuladoParcial, // Usar mesmo campo que posições fechadas
          pnlParcialTotal: pnlAcumuladoParcial,
          exposure: exposure, // ✅ Exposição dos contratos liquidados
          roi: roi, // ✅ ROI baseado nos contratos liquidados
          netQuantity: contratosLiquidados, // ✅ SEMPRE quantidade de contratos realizados (liquidados)
          quantidadeLiquidada: contratosLiquidados, // ✅ Campo para quantidade
          operacoesParciais: operacoesParciais,
          posicaoAtiva: {
            quantidade: Math.abs(posicaoAtual),
            direcao: posicaoAtual > 0 ? 'COMPRA' : 'VENDA',
            precoMedio: precoMedioAtual
          },
          ultimaRealizacao: operacoesParciais[operacoesParciais.length - 1]?.data,
          ultimaOperacao: operacoesParciais[operacoesParciais.length - 1]?.data, // ✅ Campo alternativo
          realizationDate: operacoesParciais[operacoesParciais.length - 1]?.data?.toISOString()
        });
        
        console.log(`✅ P&L PARCIAL REGISTRADO: ${contract}`);
        console.log(`   📊 Total P&L Parcial: R$ ${pnlAcumuladoParcial.toFixed(2)}`);
        console.log(`   🎯 ${operacoesParciais.length} operação(ões) parcial(is)`);
        console.log(`   📋 Contratos liquidados: ${contratosLiquidados}`);
        console.log(`   ⚡ Posição ainda ativa: ${Math.abs(posicaoAtual)} ${posicaoAtual > 0 ? 'COMPRA' : 'VENDA'} @ R$ ${precoMedioAtual.toFixed(2)}`);
        console.log(`   🎪 Status na Performance: ${posicaoAtual === 0 ? 'FECHADA' : 'P&L PARCIAL'}`);
      } else {
        console.log(`⏭️  ${contract}: Sem operações parciais detectadas (P&L: ${pnlAcumuladoParcial.toFixed(2)}, Posição: ${posicaoAtual}, Operações: ${operacoesParciais.length})`);
        
        // 🚨 DEBUG ESPECÍFICO: Se não tem operações parciais, mostrar por quê
        if (sortedTransactions.length >= 2) {
          console.log(`🤔 ${contract}: Debug - Por que não tem operações parciais?`);
          console.log(`   📊 Total transações: ${sortedTransactions.length}`);
          console.log(`   📋 Tipos: ${sortedTransactions.map(t => t.type).join(', ')}`);
          console.log(`   💰 Preços: ${sortedTransactions.map(t => `R$ ${t.price.toFixed(2)}`).join(', ')}`);
          console.log(`   📈 Quantidades: ${sortedTransactions.map(t => t.quantity).join(', ')}`);
        }
      }
    });
    
    console.log(`\n📊 RESULTADO P&L PARCIAIS: ${partialPnLEntries.length} contratos com P&L parcial`);
    if (partialPnLEntries.length > 0) {
      console.log('🎊 CONTRATOS COM P&L PARCIAL:', partialPnLEntries.map(p => `${p.contract}: R$ ${p.pnl.toFixed(2)}`));
    }
    
    // 🚨 LOG ESPECÍFICO BGIN
    const bginParciais = partialPnLEntries.filter(p => p.contract.includes('BGIN'));
    console.log('🚨 BGIN P&L PARCIAIS DETECTADOS:', bginParciais.length, bginParciais.map(p => `${p.contract}: R$ ${p.pnl.toFixed(2)}`));
    
    return partialPnLEntries;
  }, [transactionsToUse]);

  return {
    netPositions,
    netStats,
    getNeutralizedPositionsForPerformance, // ✅ APENAS posições neutralizadas para Performance
    getPartialPnLForPerformance, // 🎯 NOVA: P&L parciais já realizados para Performance
    getNetPositionByContract,
    checkPositionNeutralization,
    formatNetQuantity,
    formatTransactionSymbol, // Nova função para jogo de símbolos
    applySymbolCalculation, // Nova função para cálculos com símbolos
    getDirectionColor,
    getRealizedPnL, // 🎯 NOVA: P&L realizado
    // Re-exportar funções do contexto
    calculateNetPosition,
    getAllNetPositions,
    isPositionNeutralized
  };
}; 