/**
 * Funções de cálculo para análises financeiras
 */

import { Position, Transaction, Option } from '@/types';

/**
 * Calcula o P&L total baseado nas posições
 */
export const calculateTotalPnL = (positions: Position[]): number => {
  return positions.reduce((total, position) => {
    const realizedPnL = position.realized_pnl || 0;
    const unrealizedPnL = position.unrealized_pnl || 0;
    return total + realizedPnL + unrealizedPnL;
  }, 0);
};

/**
 * Calcula o P&L diário baseado nas transações do dia atual
 */
export const calculateDailyPnL = (transactions: Transaction[]): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return transactions
    .filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      transactionDate.setHours(0, 0, 0, 0);
      return transactionDate.getTime() === today.getTime();
    })
    .reduce((total, transaction) => {
      // Simplificação: considerar diferença entre compra e venda
      if (transaction.type === 'VENDA') {
        return total + (transaction.total * 0.05); // 5% de exemplo
      } else if (transaction.type === 'COMPRA') {
        return total - (transaction.total * 0.02); // 2% de custo
      }
      return total;
    }, 0);
};

/**
 * Calcula métricas de performance baseadas nas posições
 */
export const calculatePerformanceMetrics = (
  positions: Position[], 
  initialCapital: number = 200000
) => {
  const totalPnL = calculateTotalPnL(positions);
  const currentCapital = initialCapital + totalPnL;
  const roi = initialCapital > 0 ? (totalPnL / initialCapital) * 100 : 0;
  
  const openPositions = positions.filter(pos => pos.status === 'OPEN');
  const closedPositions = positions.filter(pos => pos.status === 'CLOSED');
  
  const winningPositions = closedPositions.filter(pos => (pos.realized_pnl || 0) > 0);
  const winRate = closedPositions.length > 0 ? (winningPositions.length / closedPositions.length) * 100 : 0;
  
  const totalExposure = openPositions.reduce((total, position) => {
    const contractSize = position.contract.startsWith('BGI') ? 330 : 450;
    return total + (position.entryPrice * position.quantity * contractSize);
  }, 0);

  return {
    totalPnL,
    currentCapital,
    roi,
    openPositions: openPositions.length,
    closedPositions: closedPositions.length,
    winRate,
    totalExposure
  };
};

/**
 * Agrupa transações por mês para análise temporal
 */
export const groupTransactionsByMonth = (transactions: Transaction[]) => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthlyStats = {};

  transactions.forEach(transaction => {
    const date = new Date(transaction.createdAt);
    const monthIndex = date.getMonth();
    const monthName = months[monthIndex];

    if (!monthlyStats[monthName]) {
      monthlyStats[monthName] = {
        month: monthName,
        pnl: 0,
        contracts: 0,
        transactions: 0,
        volume: 0
      };
    }

    monthlyStats[monthName].contracts += transaction.quantity;
    monthlyStats[monthName].transactions += 1;
    monthlyStats[monthName].volume += transaction.total;

    // Aproximação de P&L baseada no tipo de transação
    if (transaction.type === 'VENDA') {
      monthlyStats[monthName].pnl += transaction.total * 0.03; // 3% de ganho médio
    } else if (transaction.type === 'COMPRA') {
      monthlyStats[monthName].pnl -= transaction.fees; // Deduzir custos
    }
  });

  return months.map(month => 
    monthlyStats[month] || { month, pnl: 0, contracts: 0, transactions: 0, volume: 0 }
  );
};

/**
 * Calcula dados para o gráfico de evolução do capital
 */
export const generateCapitalEvolutionData = (
  monthlyData: any[], 
  initialCapital: number = 200000
) => {
  return monthlyData.map((month, index) => {
    const accumulated = monthlyData.slice(0, index + 1).reduce((sum, m) => sum + m.pnl, 0);
    return {
      month: month.month,
      capital: initialCapital + accumulated
    };
  });
};

/**
 * Calcula dados para o gráfico de P&L por contrato
 */
export const generatePLByContractData = (positions: Position[]) => {
  if (!positions.length) {
    return {
      labels: ['Sem Dados'],
      data: [0]
    };
  }

  const contractStats = {};

  positions.forEach(position => {
    // Extrair símbolo do contrato (BGI, CCM, etc.)
    const contractSymbol = position.contract.substring(0, 3);

    if (!contractStats[contractSymbol]) {
      contractStats[contractSymbol] = 0;
    }

    // Somar P&L realizado e não realizado
    if (position.realized_pnl) {
      contractStats[contractSymbol] += position.realized_pnl;
    }
    if (position.unrealized_pnl) {
      contractStats[contractSymbol] += position.unrealized_pnl;
    }
  });

  return {
    labels: Object.keys(contractStats),
    data: Object.values(contractStats)
  };
};

/**
 * Calcula análise de performance por ativo
 */
export const analyzePerformanceByAsset = (positions: Position[]) => {
  const assetStats = {};

  positions.forEach(position => {
    const asset = position.contract.startsWith('BGI') ? 'Boi Gordo' :
                 position.contract.startsWith('CCM') ? 'Milho' :
                 position.contract.startsWith('SFI') ? 'Soja' : 'Outros';

    if (!assetStats[asset]) {
      assetStats[asset] = {
        asset,
        contracts: 0,
        result: 0,
        exposure: 0,
        trades: 0,
        wins: 0
      };
    }

    const contractSize = position.contract.startsWith('BGI') ? 330 : 450;
    
    assetStats[asset].contracts += position.quantity;
    assetStats[asset].exposure += position.entryPrice * position.quantity * contractSize;
    assetStats[asset].trades += 1;

    const totalPnL = (position.realized_pnl || 0) + (position.unrealized_pnl || 0);
    assetStats[asset].result += totalPnL;
    
    if (totalPnL > 0) {
      assetStats[asset].wins += 1;
    }
  });

  return Object.values(assetStats).map((asset: any) => ({
    ...asset,
    winRate: asset.trades > 0 ? (asset.wins / asset.trades) * 100 : 0,
    avgResult: asset.trades > 0 ? asset.result / asset.trades : 0
  }));
};

/**
 * Calcula métricas de risco
 */
export const calculateRiskMetrics = (positions: Position[]) => {
  const openPositions = positions.filter(pos => pos.status === 'OPEN');
  
  const totalExposure = openPositions.reduce((total, position) => {
    const contractSize = position.contract.startsWith('BGI') ? 330 : 450;
    return total + (position.entryPrice * position.quantity * contractSize);
  }, 0);

  const maxSingleExposure = Math.max(...openPositions.map(position => {
    const contractSize = position.contract.startsWith('BGI') ? 330 : 450;
    return position.entryPrice * position.quantity * contractSize;
  }), 0);

  // Diversificação: número de ativos diferentes
  const uniqueAssets = new Set(openPositions.map(pos => pos.contract.substring(0, 3)));
  const diversification = uniqueAssets.size;

  return {
    totalExposure,
    maxSingleExposure,
    diversification,
    concentrationRisk: totalExposure > 0 ? (maxSingleExposure / totalExposure) * 100 : 0
  };
};

/**
 * Calcula payoff de opções
 */
export const calculateOptionPayoff = (
  option: Option, 
  spotPrices: number[]
): { spotPrice: number; payoff: number }[] => {
  return spotPrices.map(spotPrice => {
    let intrinsicValue = 0;
    
    if (option.type === 'CALL') {
      intrinsicValue = Math.max(0, spotPrice - option.strike);
    } else {
      intrinsicValue = Math.max(0, option.strike - spotPrice);
    }
    
    const payoff = option.isPurchased 
      ? (intrinsicValue - option.premium) * option.quantity
      : (option.premium - intrinsicValue) * option.quantity;
    
    return { spotPrice, payoff };
  });
};

/**
 * Calcula breakeven de uma carteira de opções
 */
export const calculatePortfolioBreakeven = (options: Option[]): number[] => {
  if (!options.length) return [];

  // Simplificação: calcular breakeven baseado na opção com maior exposição
  const mainOption = options.reduce((prev, current) => 
    (prev.premium * prev.quantity > current.premium * current.quantity) ? prev : current
  );

  const totalPremium = options.reduce((sum, opt) => 
    sum + (opt.isPurchased ? opt.premium : -opt.premium) * opt.quantity, 0
  );

  if (mainOption.type === 'CALL') {
    return [mainOption.strike + Math.abs(totalPremium) / mainOption.quantity];
  } else {
    return [mainOption.strike - Math.abs(totalPremium) / mainOption.quantity];
  }
}; 