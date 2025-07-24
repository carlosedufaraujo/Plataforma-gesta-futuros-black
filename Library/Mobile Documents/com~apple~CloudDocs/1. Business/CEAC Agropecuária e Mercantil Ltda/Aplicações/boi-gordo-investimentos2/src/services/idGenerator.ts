/**
 * Sistema Centralizado de Geração de IDs
 * Gera IDs únicos e sequenciais para toda a plataforma
 */

interface IDCounters {
  transactions: number;
  positions: number;
  options: number;
  users: number;
  brokerages: number;
  contracts: number;
  strategies: number;
  reports: number;
}

class IDGenerator {
  private counters: IDCounters;
  private readonly storageKey = 'acex_id_counters';

  constructor() {
    this.loadCounters();
  }

  /**
   * Verifica se localStorage está disponível (evita erro no SSR)
   */
  private isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && window.localStorage !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Carrega contadores do localStorage ou inicializa com valores padrão
   */
  private loadCounters(): void {
    try {
      if (this.isLocalStorageAvailable()) {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          this.counters = JSON.parse(stored);
        } else {
          this.counters = {
            transactions: 0,
            positions: 0,
            options: 0,
            users: 0,
            brokerages: 0,
            contracts: 0,
            strategies: 0,
            reports: 0
          };
          this.saveCounters();
        }
      } else {
        // Fallback para SSR ou quando localStorage não está disponível
        this.counters = {
          transactions: Date.now() % 1000, // Usar timestamp como fallback
          positions: Date.now() % 1000,
          options: Date.now() % 1000,
          users: Date.now() % 1000,
          brokerages: Date.now() % 1000,
          contracts: Date.now() % 1000,
          strategies: Date.now() % 1000,
          reports: Date.now() % 1000
        };
      }
    } catch (error) {
      console.error('Erro ao carregar contadores de ID:', error);
      this.resetCounters();
    }
  }

  /**
   * Salva contadores no localStorage
   */
  private saveCounters(): void {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.counters));
      } else {
        console.warn('localStorage não disponível, não foi possível salvar contadores.');
      }
    } catch (error) {
      console.error('Erro ao salvar contadores de ID:', error);
    }
  }

  /**
   * Reseta todos os contadores
   */
  private resetCounters(): void {
    this.counters = {
      transactions: 0,
      positions: 0,
      options: 0,
      users: 0,
      brokerages: 0,
      contracts: 0,
      strategies: 0,
      reports: 0
    };
    this.saveCounters();
  }

  /**
   * Gera um ID único para transações
   * Formato: TX0001, TX0002, TX0003...
   */
  generateTransactionId(): string {
    this.counters.transactions++;
    this.saveCounters();
    return `TX${this.counters.transactions.toString().padStart(4, '0')}`;
  }

  /**
   * Gera um ID único para posições
   * Formato: PS0001, PS0002, PS0003...
   */
  generatePositionId(): string {
    this.counters.positions++;
    this.saveCounters();
    return `PS${this.counters.positions.toString().padStart(4, '0')}`;
  }

  /**
   * Gera um ID único para opções
   * Formato: OP0001, OP0002, OP0003...
   */
  generateOptionId(): string {
    this.counters.options++;
    this.saveCounters();
    return `OP${this.counters.options.toString().padStart(4, '0')}`;
  }

  /**
   * Gera um ID único para usuários
   * Formato: US0001, US0002, US0003...
   */
  generateUserId(): string {
    this.counters.users++;
    this.saveCounters();
    return `US${this.counters.users.toString().padStart(4, '0')}`;
  }

  /**
   * Gera um ID único para corretoras
   * Formato: BR0001, BR0002, BR0003...
   */
  generateBrokerageId(): string {
    this.counters.brokerages++;
    this.saveCounters();
    return `BR${this.counters.brokerages.toString().padStart(4, '0')}`;
  }

  /**
   * Gera um ID único para contratos
   * Formato: CT0001, CT0002, CT0003...
   */
  generateContractId(): string {
    this.counters.contracts++;
    this.saveCounters();
    return `CT${this.counters.contracts.toString().padStart(4, '0')}`;
  }

  /**
   * Gera um ID único para estratégias
   * Formato: ST0001, ST0002, ST0003...
   */
  generateStrategyId(): string {
    this.counters.strategies++;
    this.saveCounters();
    return `ST${this.counters.strategies.toString().padStart(4, '0')}`;
  }

  /**
   * Gera um ID único para relatórios
   * Formato: RP0001, RP0002, RP0003...
   */
  generateReportId(): string {
    this.counters.reports++;
    this.saveCounters();
    return `RP${this.counters.reports.toString().padStart(4, '0')}`;
  }

  /**
   * Obtém o próximo ID sem incrementar o contador
   */
  getNextId(type: keyof IDCounters): string {
    const nextNumber = this.counters[type] + 1;
    const prefixes = {
      transactions: 'TX',
      positions: 'PS',
      options: 'OP',
      users: 'US',
      brokerages: 'BR',
      contracts: 'CT',
      strategies: 'ST',
      reports: 'RP'
    };
    
    return `${prefixes[type]}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Define manualmente o contador para um tipo específico
   * Útil para sincronizar com dados existentes do banco
   */
  setCounter(type: keyof IDCounters, value: number): void {
    this.counters[type] = value;
    this.saveCounters();
    console.log(`📊 Contador ${type} definido para: ${value}`);
  }

  /**
   * Define especificamente o contador de transações
   */
  setTransactionCounter(value: number): void {
    this.setCounter('transactions', value);
  }

  /**
   * Obtém estatísticas dos contadores
   */
  getCounterStats(): IDCounters & { total: number } {
    const total = Object.values(this.counters).reduce((sum, count) => sum + count, 0);
    return {
      ...this.counters,
      total
    };
  }

  /**
   * Sincroniza contadores com o backend (para uso futuro)
   */
  async syncWithBackend(): Promise<void> {
    try {
      // TODO: Implementar sincronização com backend quando disponível
      // const response = await fetch('/api/id-counters/sync', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(this.counters)
      // });
      // 
      // if (response.ok) {
      //   const serverCounters = await response.json();
      //   this.counters = serverCounters;
      //   this.saveCounters();
      // }
      
      console.log('🔄 Sincronização com backend será implementada');
    } catch (error) {
      console.error('Erro na sincronização de IDs:', error);
    }
  }

  /**
   * Exporta contadores para backup
   */
  exportCounters(): string {
    return JSON.stringify({
      ...this.counters,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }, null, 2);
  }

  /**
   * Importa contadores de backup
   */
  importCounters(backupData: string): boolean {
    try {
      const data = JSON.parse(backupData);
      
      // Validar estrutura dos dados
      const requiredKeys: (keyof IDCounters)[] = [
        'transactions', 'positions', 'options', 'users', 
        'brokerages', 'contracts', 'strategies', 'reports'
      ];
      
      const isValid = requiredKeys.every(key => 
        typeof data[key] === 'number' && data[key] >= 0
      );
      
      if (isValid) {
        this.counters = {
          transactions: data.transactions,
          positions: data.positions,
          options: data.options,
          users: data.users,
          brokerages: data.brokerages,
          contracts: data.contracts,
          strategies: data.strategies,
          reports: data.reports
        };
        this.saveCounters();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao importar contadores:', error);
      return false;
    }
  }
}

// Instância singleton do gerador de IDs
export const idGenerator = new IDGenerator();

// Funções de conveniência para uso direto
export const generateTransactionId = () => idGenerator.generateTransactionId();
export const generatePositionId = () => idGenerator.generatePositionId();
export const generateOptionId = () => idGenerator.generateOptionId();
export const generateUserId = () => idGenerator.generateUserId();
export const generateBrokerageId = () => idGenerator.generateBrokerageId();
export const generateContractId = () => idGenerator.generateContractId();
export const generateStrategyId = () => idGenerator.generateStrategyId();
export const generateReportId = () => idGenerator.generateReportId();

// Função genérica para gerar qualquer tipo de ID
export const generateId = (type: keyof IDCounters): string => {
  switch (type) {
    case 'transactions': return idGenerator.generateTransactionId();
    case 'positions': return idGenerator.generatePositionId();
    case 'options': return idGenerator.generateOptionId();
    case 'users': return idGenerator.generateUserId();
    case 'brokerages': return idGenerator.generateBrokerageId();
    case 'contracts': return idGenerator.generateContractId();
    case 'strategies': return idGenerator.generateStrategyId();
    case 'reports': return idGenerator.generateReportId();
    default: throw new Error(`Tipo de ID não suportado: ${type}`);
  }
};

export default idGenerator; 