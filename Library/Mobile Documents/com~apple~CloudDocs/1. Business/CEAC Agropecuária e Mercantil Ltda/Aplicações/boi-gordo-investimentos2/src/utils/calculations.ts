import { Position, PositionDirection, CONTRACT_SIZES } from '@/types';

export interface PnLCalculation {
  pnl: number;
  pnl_percentage: number;
  total_quantity: number;
  exposure: number;
  price_diff: number;
}

/**
 * Calcula P&L de uma posição EXATAMENTE como no HTML original
 * LONG (Compra): Ganha quando o preço SOBE, perde quando CAI
 * SHORT (Venda): Ganha quando o preço CAI, perde quando SOBE
 */
export const calculatePositionPnL = (position: {
  direction: PositionDirection;
  quantity: number;
  entry_price: number;
  current_price: number;
  contract_size: number;
}): PnLCalculation => {
  const { direction, quantity, entry_price, current_price, contract_size } = position;
  
  // Quantidade total (contratos * tamanho)
  const totalQuantity = quantity * contract_size;
  
  // Diferença de preço
  const priceDiff = current_price - entry_price;
  
  // P&L baseado na direção - REPLICANDO LÓGICA EXATA DO HTML
  let pnl = 0;
  if (direction === 'LONG') {
    // LONG: P&L = (Preço Atual - Preço Entrada) * Quantidade Total
    pnl = priceDiff * totalQuantity;
  } else {
    // SHORT: P&L = (Preço Entrada - Preço Atual) * Quantidade Total
    // Ou seja: -(Preço Atual - Preço Entrada) * Quantidade Total
    pnl = -priceDiff * totalQuantity;
  }
  
  // Exposição (valor nocional da posição)
  const exposure = entry_price * totalQuantity;
  
  // P&L percentual
  const pnl_percentage = exposure > 0 ? (pnl / exposure) * 100 : 0;
  
  return {
    pnl,
    pnl_percentage,
    total_quantity: totalQuantity,
    exposure,
    price_diff: priceDiff
  };
};

/**
 * Calcula preço alvo para determinado P&L
 */
export const calculateTargetPrice = (position: {
  direction: PositionDirection;
  entry_price: number;
  quantity: number;
  contract_size: number;
}, targetPnL: number): number => {
  const { direction, entry_price, quantity, contract_size } = position;
  const totalQuantity = quantity * contract_size;
  
  if (direction === 'LONG') {
    // Para LONG: targetPrice = entryPrice + (targetPnL / totalQuantity)
    return entry_price + (targetPnL / totalQuantity);
  } else {
    // Para SHORT: targetPrice = entryPrice - (targetPnL / totalQuantity)
    return entry_price - (targetPnL / totalQuantity);
  }
};

/**
 * Formata valores monetários para exibição
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata percentual para exibição
 */
export const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

/**
 * Formata números para exibição com separadores
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Calcula payoff de opção (para o gráfico)
 */
export const calculateOptionPayoff = (
  optionType: 'CALL' | 'PUT',
  strikePrice: number,
  premium: number,
  underlyingPrice: number,
  isPurchased: boolean,
  contractSize: number = 330
): number => {
  let intrinsicValue = 0;
  
  if (optionType === 'CALL') {
    intrinsicValue = Math.max(underlyingPrice - strikePrice, 0);
  } else {
    intrinsicValue = Math.max(strikePrice - underlyingPrice, 0);
  }
  
  const payoff = isPurchased 
    ? (intrinsicValue - premium) * contractSize
    : (premium - intrinsicValue) * contractSize;
  
  return payoff;
};

/**
 * Gera dados de payoff para gráfico (como no HTML original)
 */
export const generatePayoffData = (
  optionType: 'CALL' | 'PUT',
  strikePrice: number,
  premium: number,
  isPurchased: boolean,
  contractSize: number = 330,
  priceRange: { min: number; max: number; step: number } = { min: 300, max: 360, step: 2 }
): Array<{ price: number; payoff: number }> => {
  const data = [];
  
  for (let price = priceRange.min; price <= priceRange.max; price += priceRange.step) {
    const payoff = calculateOptionPayoff(optionType, strikePrice, premium, price, isPurchased, contractSize);
    data.push({ price, payoff });
  }
  
  return data;
};

/**
 * Calcula dados para o gráfico de evolução do capital
 */
export const generateCapitalEvolutionData = () => {
  return [
    { label: 'Jan', value: 200000 },
    { label: 'Fev', value: 195500 },
    { label: 'Mar', value: 203700 },
    { label: 'Abr', value: 208900 },
    { label: 'Mai', value: 218000 },
    { label: 'Jun', value: 235000 },
    { label: 'Jul', value: 245780 }
  ];
};

/**
 * Calcula dados para o gráfico de P&L por contrato
 */
export const generatePLByContractData = () => {
  return [
    { label: 'BGI', value: 18500 },
    { label: 'CCM', value: 12300 },
    { label: 'ICF', value: -4200 },
    { label: 'DOL', value: 8900 },
    { label: 'IND', value: 10280 }
  ];
};

/**
 * Converte string de preço para número
 */
export const parsePrice = (priceStr: string): number => {
  return parseFloat(priceStr.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
};

/**
 * Converte número para string de preço formatada
 */
export const formatPriceInput = (value: number): string => {
  return value.toFixed(2).replace('.', ',');
};



/**
 * Calcula margem necessária (simplificado - 10% da exposição)
 */
export const calculateMarginRequired = (exposure: number): number => {
  return exposure * 0.1; // 10% de margem
};

/**
 * Calcula taxas de operação (0.1% padrão)
 */
export const calculateFees = (totalAmount: number): number => {
  return totalAmount * 0.001; // 0.1% de taxa
}; 