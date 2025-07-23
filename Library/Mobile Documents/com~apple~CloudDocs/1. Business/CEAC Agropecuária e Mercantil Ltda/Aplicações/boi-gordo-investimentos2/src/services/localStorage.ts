/**
 * Serviço de Armazenamento Local
 * Gerencia persistência de dados no localStorage
 */

import { Position, Option, Transaction, User, Brokerage } from '@/types';

// Chaves do localStorage
const STORAGE_KEYS = {
  POSITIONS: 'acex_positions',
  OPTIONS: 'acex_options', 
  TRANSACTIONS: 'acex_transactions',
  USERS: 'acex_users',
  BROKERAGES: 'acex_brokerages',
  CURRENT_USER: 'acex_current_user',
  SELECTED_BROKERAGE: 'acex_selected_brokerage',
  APP_VERSION: 'acex_app_version'
} as const;

const APP_VERSION = '1.0.0';

class LocalStorageService {
  /**
   * Verifica se localStorage está disponível
   */
  private isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Salva dados no localStorage com tratamento de erro
   */
  private setItem<T>(key: string, data: T): boolean {
    if (!this.isAvailable()) return false;
    
    try {
      const serializedData = JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        version: APP_VERSION
      });
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error(`Erro ao salvar ${key}:`, error);
      return false;
    }
  }

  /**
   * Recupera dados do localStorage com validação
   */
  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isAvailable()) return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      
      const parsed = JSON.parse(item);
      
      // Validar estrutura dos dados
      if (!parsed.data || !parsed.timestamp) {
        console.warn(`Dados inválidos para ${key}, usando padrão`);
        return defaultValue;
      }
      
      return parsed.data as T;
    } catch (error) {
      console.error(`Erro ao recuperar ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove item do localStorage
   */
  private removeItem(key: string): boolean {
    if (!this.isAvailable()) return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Erro ao remover ${key}:`, error);
      return false;
    }
  }

  // ================================
  // POSIÇÕES
  // ================================
  
  savePositions(positions: Position[]): boolean {
    const success = this.setItem(STORAGE_KEYS.POSITIONS, positions);
    if (success) {
      console.log(`💾 ${positions.length} posições salvas no localStorage`);
    }
    return success;
  }

  loadPositions(): Position[] {
    const positions = this.getItem<Position[]>(STORAGE_KEYS.POSITIONS, []);
    console.log(`📂 ${positions.length} posições carregadas do localStorage`);
    return positions;
  }

  // ================================
  // OPÇÕES
  // ================================
  
  saveOptions(options: Option[]): boolean {
    const success = this.setItem(STORAGE_KEYS.OPTIONS, options);
    if (success) {
      console.log(`💾 ${options.length} opções salvas no localStorage`);
    }
    return success;
  }

  loadOptions(): Option[] {
    const options = this.getItem<Option[]>(STORAGE_KEYS.OPTIONS, []);
    console.log(`📂 ${options.length} opções carregadas do localStorage`);
    return options;
  }

  // ================================
  // TRANSAÇÕES
  // ================================
  
  saveTransactions(transactions: Transaction[]): boolean {
    const success = this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    if (success) {
      console.log(`💾 ${transactions.length} transações salvas no localStorage`);
    }
    return success;
  }

  loadTransactions(): Transaction[] {
    const transactions = this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    console.log(`📂 ${transactions.length} transações carregadas do localStorage`);
    return transactions;
  }

  // ================================
  // USUÁRIOS
  // ================================
  
  saveUsers(users: User[]): boolean {
    const success = this.setItem(STORAGE_KEYS.USERS, users);
    if (success) {
      console.log(`💾 ${users.length} usuários salvos no localStorage`);
    }
    return success;
  }

  loadUsers(): User[] {
    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, []);
    console.log(`📂 ${users.length} usuários carregados do localStorage`);
    return users;
  }

  // ================================
  // CORRETORAS
  // ================================
  
  saveBrokerages(brokerages: Brokerage[]): boolean {
    const success = this.setItem(STORAGE_KEYS.BROKERAGES, brokerages);
    if (success) {
      console.log(`💾 ${brokerages.length} corretoras salvas no localStorage`);
    }
    return success;
  }

  loadBrokerages(): Brokerage[] {
    const brokerages = this.getItem<Brokerage[]>(STORAGE_KEYS.BROKERAGES, []);
    console.log(`📂 ${brokerages.length} corretoras carregadas do localStorage`);
    return brokerages;
  }

  // ================================
  // USUÁRIO ATUAL
  // ================================
  
  saveCurrentUser(user: User | null): boolean {
    const success = this.setItem(STORAGE_KEYS.CURRENT_USER, user);
    if (success && user) {
      console.log(`💾 Usuário atual salvo: ${user.nome}`);
    }
    return success;
  }

  loadCurrentUser(): User | null {
    const user = this.getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (user) {
      console.log(`📂 Usuário atual carregado: ${user.nome}`);
    }
    return user;
  }

  // ================================
  // CORRETORA SELECIONADA
  // ================================
  
  saveSelectedBrokerage(brokerage: Brokerage | null): boolean {
    const success = this.setItem(STORAGE_KEYS.SELECTED_BROKERAGE, brokerage);
    if (success && brokerage) {
      console.log(`💾 Corretora selecionada salva: ${brokerage.nome}`);
    }
    return success;
  }

  loadSelectedBrokerage(): Brokerage | null {
    const brokerage = this.getItem<Brokerage | null>(STORAGE_KEYS.SELECTED_BROKERAGE, null);
    if (brokerage) {
      console.log(`📂 Corretora selecionada carregada: ${brokerage.nome}`);
    }
    return brokerage;
  }

  // ================================
  // UTILITÁRIOS
  // ================================
  
  /**
   * Limpa todos os dados do localStorage
   */
  clearAllData(): boolean {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        this.removeItem(key);
      });
      console.log('🗑️ Todos os dados foram limpos do localStorage');
      return true;
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      return false;
    }
  }

  /**
   * Exporta todos os dados para backup
   */
  exportAllData(): string {
    const allData = {
      positions: this.loadPositions(),
      options: this.loadOptions(),
      transactions: this.loadTransactions(),
      users: this.loadUsers(),
      brokerages: this.loadBrokerages(),
      currentUser: this.loadCurrentUser(),
      selectedBrokerage: this.loadSelectedBrokerage(),
      exportedAt: new Date().toISOString(),
      version: APP_VERSION
    };

    return JSON.stringify(allData, null, 2);
  }

  /**
   * Importa dados de backup
   */
  importAllData(backupData: string): boolean {
    try {
      const data = JSON.parse(backupData);
      
      // Validar estrutura básica
      if (!data.exportedAt || !data.version) {
        throw new Error('Formato de backup inválido');
      }

      // Importar cada tipo de dado
      if (data.positions) this.savePositions(data.positions);
      if (data.options) this.saveOptions(data.options);
      if (data.transactions) this.saveTransactions(data.transactions);
      if (data.users) this.saveUsers(data.users);
      if (data.brokerages) this.saveBrokerages(data.brokerages);
      if (data.currentUser) this.saveCurrentUser(data.currentUser);
      if (data.selectedBrokerage) this.saveSelectedBrokerage(data.selectedBrokerage);

      console.log('📥 Backup importado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao importar backup:', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas de uso do localStorage
   */
  getStorageStats(): {
    used: number;
    available: number;
    percentage: number;
    itemCount: number;
  } {
    if (!this.isAvailable()) {
      return { used: 0, available: 0, percentage: 0, itemCount: 0 };
    }

    let used = 0;
    let itemCount = 0;

    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
          itemCount++;
        }
      }

      // Estimar limite do localStorage (geralmente 5-10MB)
      const available = 5 * 1024 * 1024; // 5MB
      const percentage = (used / available) * 100;

      return {
        used,
        available,
        percentage: Math.min(percentage, 100),
        itemCount
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return { used: 0, available: 0, percentage: 0, itemCount: 0 };
    }
  }
}

// Instância singleton do serviço
export const localStorageService = new LocalStorageService();

// Exportar funções de conveniência
export const {
  savePositions,
  loadPositions,
  saveOptions,
  loadOptions,
  saveTransactions,
  loadTransactions,
  saveUsers,
  loadUsers,
  saveBrokerages,
  loadBrokerages,
  saveCurrentUser,
  loadCurrentUser,
  saveSelectedBrokerage,
  loadSelectedBrokerage,
  clearAllData,
  exportAllData,
  importAllData,
  getStorageStats
} = localStorageService;

export default localStorageService; 