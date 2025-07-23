export type ContractType = 'BGI' | 'CCM' | 'ICF' | 'DOL' | 'IND';
export type PositionDirection = 'LONG' | 'SHORT';
export type OptionType = 'CALL' | 'PUT';
export type TransactionType = 'BUY' | 'SELL' | 'EXERCISE' | 'EXPIRE';
export type PositionStatus = 'OPEN' | 'CLOSED' | 'PARTIAL' | 'NETTED' | 'CONSOLIDATED';

export interface User {
  id: string;
  nome: string;
  cpf: string;
  endereco: string;
  telefone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Relação com corretoras
  brokerageIds: string[]; // IDs das corretoras que o usuário tem acesso
}

export interface Brokerage {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  assessor: string;
  telefone: string;
  email: string;
  corretagemMilho: number;
  corretagemBoi: number;
  taxas: number;
  impostos: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Usuários com acesso a esta corretora
  authorizedUserIds: string[];
}

export interface UserBrokerageAccess {
  userId: string;
  brokerageId: string;
  grantedAt: string;
  grantedBy: string; // ID do usuário que concedeu acesso
  isActive: boolean;
}

export interface CurrentUserSession {
  user: User | null; // Permitir null para estado inicial
  selectedBrokerage: Brokerage | null;
  availableBrokerages: Brokerage[];
  lastTransaction: {
    date: string;
    type: string;
    contract: string;
  } | null;
}

export interface Contract {
  id: string;
  symbol: string;
  contract_type: ContractType;
  expiration_date: string;
  contract_size: number;
  unit: string;
  name: string;
  current_price?: number;
  volume?: number;
}

export interface Position {
  id: string;
  user_id: string;
  contract_id: string;
  direction: PositionDirection;
  quantity: number;
  entry_price: number;
  current_price?: number;
  stop_loss?: number;
  take_profit?: number;
  status: PositionStatus;
  entry_date: string;
  exit_date?: string;
  exit_price?: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  pnl_percentage?: number;
  exposure?: number;
  total_quantity?: number;
  fees: number;
  symbol?: string;
  name?: string;
  contract_size?: number;
  unit?: string;
}

export interface Option {
  id: string;
  user_id: string;
  contract_id: string;
  option_type: OptionType;
  strike_price: number;
  premium: number;
  quantity: number;
  expiration_date: string;
  is_purchased: boolean;
  status: PositionStatus;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  symbol?: string;
  name?: string;
  created_at?: string; // Data de criação da opção
}

export interface Transaction {
  id: string;
  userId: string;
  brokerageId: string;
  date: string;
  type: 'COMPRA' | 'VENDA' | 'EXERCICIO' | 'VENCIMENTO';
  contract: string;
  quantity: number;
  price: number;
  total: number;
  fees: number;
  status: 'EXECUTADA' | 'PENDENTE' | 'CANCELADA';
  createdAt: string;
}

export interface RentabilityMetrics {
  total_pnl: number;
  roi: number;
  win_rate: number;
  sharpe_ratio: number;
  max_drawdown: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  current_capital?: number;
  initial_capital?: number;
}

export interface PositionSummary {
  total_positions: number;
  total_exposure: number;
  unrealized_pnl: number;
  realized_pnl: number;
  positions: Position[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any[];
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

export interface PriceData {
  price: number;
  timestamp: string;
  volume?: number;
}

// Form types
export interface CreatePositionForm {
  contract_id: string;
  direction: PositionDirection;
  quantity: number;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
}

export interface CreateOptionForm {
  contract_id: string;
  option_type: OptionType;
  strike_price: number;
  premium: number;
  quantity: number;
  expiration_date: string;
  is_purchased: boolean;
  delta?: number;
}

// WebSocket messages
export interface WSMessage {
  type: 'price_update' | 'position_update' | 'auth_success' | 'error';
  payload: any;
}

// Navigation
export type PageType = 'rentabilidade' | 'posicoes' | 'opcoes' | 'performance' | 'configuracoes';
export type PositionTabType = 'gestao' | 'performance' | 'transacoes' | 'resumo';
export type OptionTabType = 'posicoes' | 'estrategias' | 'payoff';

// Theme
export type ThemeType = 'light' | 'dark';

// Contract expiration management
export interface ContractExpiration {
  id: string;
  code: string; // K, M, N, U, V, Z
  month: string; // Maio, Junho, Julho, etc.
  year: string; // 2025, 2026, etc.
  monthNumber: number; // 5, 6, 7, etc.
  isActive: boolean;
}

// Mapeamento oficial de códigos de vencimento por mês
export const MONTH_CODE_MAP = {
  1: 'F',   // Janeiro
  2: 'G',   // Fevereiro  
  3: 'H',   // Março
  4: 'J',   // Abril
  5: 'K',   // Maio
  6: 'M',   // Junho
  7: 'N',   // Julho
  8: 'Q',   // Agosto
  9: 'U',   // Setembro
  10: 'V',  // Outubro
  11: 'X',  // Novembro
  12: 'Z'   // Dezembro
} as const;

export const DEFAULT_EXPIRATIONS: ContractExpiration[] = [
  { id: '1', code: 'F', month: 'Janeiro', year: '2025', monthNumber: 1, isActive: true },
  { id: '2', code: 'G', month: 'Fevereiro', year: '2025', monthNumber: 2, isActive: true },
  { id: '3', code: 'H', month: 'Março', year: '2025', monthNumber: 3, isActive: true },
  { id: '4', code: 'J', month: 'Abril', year: '2025', monthNumber: 4, isActive: true },
  { id: '5', code: 'K', month: 'Maio', year: '2025', monthNumber: 5, isActive: true },
  { id: '6', code: 'M', month: 'Junho', year: '2025', monthNumber: 6, isActive: true },
  { id: '7', code: 'N', month: 'Julho', year: '2025', monthNumber: 7, isActive: true },
  { id: '8', code: 'Q', month: 'Agosto', year: '2025', monthNumber: 8, isActive: true },
  { id: '9', code: 'U', month: 'Setembro', year: '2025', monthNumber: 9, isActive: true },
  { id: '10', code: 'V', month: 'Outubro', year: '2025', monthNumber: 10, isActive: true },
  { id: '11', code: 'X', month: 'Novembro', year: '2025', monthNumber: 11, isActive: true },
  { id: '12', code: 'Z', month: 'Dezembro', year: '2025', monthNumber: 12, isActive: true }
];

// Net Position System - Professional Trading Platform
export interface NetPosition {
  contract: string; // Ex: 'BGIJ5', 'BGIN5' (inclui vencimento)
  contract_type: 'BGI' | 'CCM';
  net_quantity: number; // Quantidade líquida (positivo = LONG, negativo = SHORT)
  net_direction: 'LONG' | 'SHORT' | 'FLAT';
  average_price: number; // Preço médio ponderado (inclui centavos)
  current_price: number;
  net_exposure: number; // Exposição total em R$
  unrealized_pnl: number; // P&L não realizado (mark-to-market)
  unrealized_pnl_percentage: number;
  realized_pnl: number; // P&L realizado em fechamentos
  first_entry_date: string;
  last_entry_date: string;
  positions: Position[]; // Posições individuais que compõem o NET
  long_quantity: number; // Total de contratos LONG
  short_quantity: number; // Total de contratos SHORT
  individual_positions_count: number; // Número de posições individuais
}

export interface PositionCalculation {
  individual_pnl: number;
  individual_exposure: number;
  weight_in_average: number;    // Peso no preço médio
}

export interface NetPositionSummary {
  total_net_positions: number;
  total_net_exposure: number;
  total_unrealized_pnl: number;
  total_realized_pnl: number;
  net_positions: NetPosition[];
  individual_positions: Position[];
  margin_required: number;      // Baseado em posições líquidas
  available_margin: number;
  margin_utilization: number;   // %
}

export interface PnLCalculation {
  pnl: number;
  pnl_percentage: number;
  total_quantity: number;
  exposure: number;
  price_diff: number;
}

// Contract sizes (matching backend)
export const CONTRACT_SIZES = {
  BGI: { size: 330, unit: 'arrobas', name: 'Boi Gordo' },
  CCM: { size: 450, unit: 'sacos', name: 'Milho' }
} as const; 