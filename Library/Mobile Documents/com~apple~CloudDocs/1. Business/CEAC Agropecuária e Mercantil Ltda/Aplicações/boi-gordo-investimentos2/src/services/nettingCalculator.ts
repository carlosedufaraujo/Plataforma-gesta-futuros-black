import { Position, NetPosition, NetPositionSummary, CONTRACT_SIZES } from '@/types';

/**
 * SISTEMA NET BRASILEIRO - COMO PROFIT E CORRETORAS BR
 * Baseado na realidade do mercado brasileiro de futuros
 */

/**
 * Calcula posição líquida por contrato (incluindo vencimento)
 * Cada vencimento é tratado como ativo separado
 */
export const calculateBrazilianNetPosition = (
  positions: Position[], 
  symbol: string, // Ex: 'BGIJ5', 'BGIN5'
  currentPrice: number
): NetPosition => {
  // Filtrar posições do mesmo contrato E vencimento
  const contractPositions = positions.filter(pos => 
    pos.contract === symbol && pos.status === 'OPEN'
  );

  if (contractPositions.length === 0) {
    throw new Error(`Nenhuma posição encontrada para ${symbol}`);
  }

  // Separar por direção
  const longPositions = contractPositions.filter(pos => pos.direction === 'LONG');
  const shortPositions = contractPositions.filter(pos => pos.direction === 'SHORT');

  // Calcular quantidades
  const longQuantity = longPositions.reduce((sum, pos) => sum + pos.quantity, 0);
  const shortQuantity = shortPositions.reduce((sum, pos) => sum + pos.quantity, 0);
  const netQuantity = longQuantity - shortQuantity;

  // Determinar direção líquida
  const netDirection: 'LONG' | 'SHORT' | 'FLAT' = 
    netQuantity > 0 ? 'LONG' : netQuantity < 0 ? 'SHORT' : 'FLAT';

  // Calcular preço médio baseado na direção líquida
  let averagePrice = 0;
  let totalCost = 0;
  let totalQuantity = 0;

  if (netDirection !== 'FLAT') {
    const relevantPositions = netDirection === 'LONG' ? longPositions : shortPositions;
    
    relevantPositions.forEach(pos => {
      totalCost += pos.entryPrice * pos.quantity;
      totalQuantity += pos.quantity;
    });
    
    averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
  }

  // Obter informações do contrato
  const contractType = symbol.startsWith('BGI') ? 'BGI' : 'CCM';
  const contractInfo = CONTRACT_SIZES[contractType];
  
  // P&L não realizado (ajuste diário automático)
  let unrealizedPnL = 0;
  if (netDirection !== 'FLAT' && currentPrice > 0) {
    const priceDiff = currentPrice - averagePrice;
    const absNetQuantity = Math.abs(netQuantity);
    
    unrealizedPnL = netDirection === 'LONG' 
      ? priceDiff * absNetQuantity * contractInfo.size // 330 arrobas por contrato
      : -priceDiff * absNetQuantity * contractInfo.size;
  }

  const unrealizedPnLPercentage = averagePrice > 0 && Math.abs(netQuantity) > 0
    ? (unrealizedPnL / (averagePrice * Math.abs(netQuantity) * contractInfo.size)) * 100 
    : 0;

  // Datas
  const sortedPositions = contractPositions.sort((a, b) => 
    new Date(a.openDate).getTime() - new Date(b.openDate).getTime()
  );

  return {
    contract: symbol,
    contract_type: contractType,
    net_quantity: netQuantity,
    net_direction: netDirection,
    average_price: Math.round(averagePrice * 100) / 100, // Centavos inclusos
    current_price: Math.round(currentPrice * 100) / 100,
    net_exposure: Math.round(averagePrice * Math.abs(netQuantity) * contractInfo.size * 100) / 100,
    unrealized_pnl: Math.round(unrealizedPnL * 100) / 100,
    unrealized_pnl_percentage: Math.round(unrealizedPnLPercentage * 100) / 100,
    realized_pnl: 0, // Será calculado durante fechamentos
    first_entry_date: sortedPositions[0]?.openDate || new Date().toISOString(),
    last_entry_date: sortedPositions[sortedPositions.length - 1]?.openDate || new Date().toISOString(),
    positions: contractPositions,
    long_quantity: longQuantity,
    short_quantity: shortQuantity,
    individual_positions_count: contractPositions.length
  };
};

/**
 * Simula fechamento parcial com redistribuição de P&L (lógica brasileira)
 */
export const simulateBrazilianPartialClose = (
  netPosition: NetPosition,
  quantityToClose: number,
  exitPrice: number
): {
  realizedPnL: number,
  newAveragePrice: number,
  remainingQuantity: number
} => {
  const { net_quantity, average_price, net_direction } = netPosition;
  
  if (quantityToClose <= 0 || Math.abs(quantityToClose) > Math.abs(net_quantity)) {
    throw new Error('Quantidade inválida para fechamento');
  }

  // Calcular P&L realizado
  const priceDiff = exitPrice - average_price;
  const realizedPnL = net_direction === 'LONG' 
    ? priceDiff * quantityToClose * CONTRACT_SIZES[netPosition.contract_type].size
    : -priceDiff * quantityToClose * CONTRACT_SIZES[netPosition.contract_type].size;

  // Calcular quantidade restante
  const remainingQuantity = net_direction === 'LONG' 
    ? net_quantity - quantityToClose
    : net_quantity + quantityToClose;

  // Redistribuir P&L no preço médio (lógica do Profit)
  let newAveragePrice = average_price;
  if (Math.abs(remainingQuantity) > 0) {
    const pnlPerContract = realizedPnL / Math.abs(remainingQuantity);
    const pnlPerArroba = pnlPerContract / CONTRACT_SIZES[netPosition.contract_type].size;
    newAveragePrice = average_price - pnlPerArroba;
  }

  return {
    realizedPnL: Math.round(realizedPnL * 100) / 100,
    newAveragePrice: Math.round(newAveragePrice * 100) / 100,
    remainingQuantity: Math.round(remainingQuantity)
  };
};

/**
 * Calcula resumo de todas as posições NET
 */
export const calculateBrazilianNetSummary = (
  positions: Position[],
  currentPrices: Record<string, number>,
  userCapital: number = 100000
): NetPositionSummary => {
  // Agrupar por símbolo (contrato + vencimento)
  const symbolGroups: Record<string, Position[]> = {};
  
  positions.filter(pos => pos.status === 'OPEN').forEach(pos => {
    const symbol = pos.contract;
    if (!symbolGroups[symbol]) {
      symbolGroups[symbol] = [];
    }
    symbolGroups[symbol].push(pos);
  });

  const netPositions: NetPosition[] = [];

  // Calcular posições NET para cada símbolo
  Object.keys(symbolGroups).forEach(symbol => {
    try {
      const currentPrice = currentPrices[symbol] || 0;
      if (currentPrice > 0) {
        const netPos = calculateBrazilianNetPosition(symbolGroups[symbol], symbol, currentPrice);
        if (netPos.net_quantity !== 0) { // Apenas posições com saldo líquido
          netPositions.push(netPos);
        }
      }
    } catch (error) {
      console.warn(`Erro ao calcular NET para ${symbol}:`, error);
    }
  });

  // Totais
  const totalNetExposure = netPositions.reduce((sum, pos) => sum + pos.net_exposure, 0);
  const totalUnrealizedPnL = netPositions.reduce((sum, pos) => sum + pos.unrealized_pnl, 0);
  const totalRealizedPnL = netPositions.reduce((sum, pos) => sum + pos.realized_pnl, 0);

  // Resumo simples (sem cálculo de margem inicial da B3)
  return {
    total_net_positions: netPositions.length,
    total_net_exposure: Math.round(totalNetExposure * 100) / 100,
    total_unrealized_pnl: Math.round(totalUnrealizedPnL * 100) / 100,
    total_realized_pnl: Math.round(totalRealizedPnL * 100) / 100,
    net_positions: netPositions,
    individual_positions: positions.filter(pos => pos.status === 'OPEN'),
    margin_required: 0, // Não aplicável - calculado pela B3
    available_margin: userCapital,
    margin_utilization: 0
  };
};

/**
 * Calcula ajuste diário (mark-to-market) para uma posição NET
 */
export const calculateDailyAdjustment = (
  netPosition: NetPosition,
  previousClosePrice: number,
  currentClosePrice: number
): number => {
  if (netPosition.net_quantity === 0) return 0;

  const priceDiff = currentClosePrice - previousClosePrice;
  const contractInfo = CONTRACT_SIZES[netPosition.contract_type];
  
  const dailyPnL = netPosition.net_direction === 'LONG'
    ? priceDiff * Math.abs(netPosition.net_quantity) * contractInfo.size
    : -priceDiff * Math.abs(netPosition.net_quantity) * contractInfo.size;

  return Math.round(dailyPnL * 100) / 100;
};

/**
 * Formatações
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const formatContracts = (quantity: number): string => {
  return `${quantity > 0 ? '+' : ''}${quantity} contrato${Math.abs(quantity) !== 1 ? 's' : ''}`;
}; 