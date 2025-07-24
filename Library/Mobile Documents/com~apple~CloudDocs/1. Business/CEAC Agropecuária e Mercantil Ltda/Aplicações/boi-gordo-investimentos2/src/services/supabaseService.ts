import { supabase } from '@/lib/supabase';
import { Tables, Inserts, Updates } from '@/lib/supabase';
import { Position, Transaction, User, Brokerage, Option } from '@/types';
import { generateTransactionId } from '@/services/idGenerator';

export class SupabaseService {
  
  // Verificar se Supabase está disponível
  private checkSupabase() {
    if (!supabase) {
      throw new Error('Supabase não está disponível. Verifique as configurações.');
    }
    return supabase;
  }

  // ================================
  // USUÁRIOS
  // ================================
  
  async getUsers(): Promise<User[]> {
    const client = this.checkSupabase();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('nome');
    
    if (error) throw error;
    return data.map(this.mapUserFromDB);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        nome: userData.nome,
        cpf: userData.cpf,
        email: userData.email,
        telefone: userData.telefone,
        endereco: userData.endereco
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapUserFromDB(data);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        nome: updates.nome,
        cpf: updates.cpf,
        email: updates.email,
        telefone: updates.telefone,
        endereco: updates.endereco
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapUserFromDB(data);
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  }

  // ================================
  // CORRETORAS
  // ================================
  
  async getBrokerages(): Promise<Brokerage[]> {
    const { data, error } = await supabase
      .from('brokerages')
      .select('*')
      .eq('is_active', true)
      .order('nome');
    
    if (error) throw error;
    return data.map(this.mapBrokerageFromDB);
  }

  async createBrokerage(brokerageData: Omit<Brokerage, 'id' | 'createdAt' | 'updatedAt'>): Promise<Brokerage> {
    const { data, error } = await supabase
      .from('brokerages')
      .insert({
        nome: brokerageData.nome,
        cnpj: brokerageData.cnpj,
        endereco: brokerageData.endereco,
        assessor: brokerageData.assessor,
        telefone: brokerageData.telefone,
        email: brokerageData.email,
        corretagem_milho: brokerageData.corretagemMilho,
        corretagem_boi: brokerageData.corretagemBoi,
        taxas: brokerageData.taxas,
        impostos: brokerageData.impostos
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapBrokerageFromDB(data);
  }

  // ================================
  // POSIÇÕES
  // ================================
  
  async getPositions(userId?: string): Promise<Position[]> {
    let query = supabase
      .from('positions')
      .select(`
        *,
        users(nome),
        brokerages(nome)
      `)
      .order('entry_date', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data.map(this.mapPositionFromDB);
  }

  async createPosition(positionData: Omit<Position, 'id'>): Promise<Position> {
    const client = this.checkSupabase();
    
    console.log('📊 Criando posição no Supabase:', positionData);
    
    const { data, error } = await client
      .from('positions')
      .insert({
        user_id: positionData.user_id,
        brokerage_id: positionData.brokerage_id,
        contract_id: positionData.contract_id,
        contract: positionData.contract,
        direction: positionData.direction,
        quantity: positionData.quantity,
        entry_price: positionData.entry_price,
        current_price: positionData.current_price,
        stop_loss: positionData.stop_loss,
        take_profit: positionData.take_profit,
        status: positionData.status || 'EM_ABERTO',
        entry_date: positionData.entry_date,
        fees: positionData.fees || 0,
        symbol: positionData.symbol,
        name: positionData.name,
        contract_size: positionData.contract_size,
        unit: positionData.unit,
        exposure: positionData.exposure,
        unrealized_pnl: positionData.unrealized_pnl || 0
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao inserir posição no Supabase:', error);
      throw error;
    }
    
    console.log('✅ Posição criada no Supabase:', data);
    return this.mapPositionFromDB(data);
  }

  async updatePosition(id: string, updates: Partial<Position>): Promise<Position> {
    const { data, error } = await supabase
      .from('positions')
      .update({
        current_price: updates.current_price,
        stop_loss: updates.stop_loss,
        take_profit: updates.take_profit,
        status: updates.status,
        exit_date: updates.exit_date,
        exit_price: updates.exit_price,
        realized_pnl: updates.realized_pnl,
        unrealized_pnl: updates.unrealized_pnl,
        pnl_percentage: updates.pnl_percentage,
        exposure: updates.exposure
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapPositionFromDB(data);
  }

  async deletePosition(id: string): Promise<void> {
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ================================
  // TRANSAÇÕES
  // ================================
  
  // Sincronizar contadores do IDGenerator com os dados do Supabase
  async syncTransactionIdCounter(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('custom_id')
        .not('custom_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const lastCustomId = data[0].custom_id;
        if (lastCustomId) {
          // Extrair o número do último ID (ex: TX0042 -> 42)
          const match = lastCustomId.match(/^TX(\d{4})$/);
          if (match) {
            const lastNumber = parseInt(match[1], 10);
            
            // Importar dinâmicamente para evitar problemas de SSR
            const { idGenerator } = await import('@/services/idGenerator');
            idGenerator.setTransactionCounter(lastNumber);
            
            console.log(`🔄 Contador de transações sincronizado: ${lastNumber}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar contador de transações:', error);
    }
  }
  
  async getTransactions(userId?: string): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data.map(this.mapTransactionFromDB);
  }

  async createTransaction(transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
    // Gerar ID customizado no formato TX0001, TX0002, etc.
    const customId = generateTransactionId();
    
    console.log('🆔 Gerando transação com custom_id:', customId);
    
    const insertData = {
      user_id: transactionData.userId,
      brokerage_id: transactionData.brokerageId,
      date: transactionData.date,
      type: transactionData.type,
      contract: transactionData.contract,
      quantity: transactionData.quantity,
      price: transactionData.price,
      total: transactionData.total,
      fees: transactionData.fees,
      status: transactionData.status,
      custom_id: customId
    };
    
    console.log('📝 Dados para inserção:', insertData);
    
    const { data, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar transação:', error);
      throw error;
    }
    
    console.log('✅ Transação criada no banco:', data);
    
    const mappedTransaction = this.mapTransactionFromDB(data);
    console.log('🔄 Transação mapeada:', mappedTransaction);
    
    return mappedTransaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const dbUpdates: any = {};
    
    if (updates.date) dbUpdates.date = updates.date;
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.contract) dbUpdates.contract = updates.contract;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.total !== undefined) dbUpdates.total = updates.total;
    if (updates.fees !== undefined) dbUpdates.fees = updates.fees;
    if (updates.status) dbUpdates.status = updates.status;

    // Buscar pelo custom_id primeiro, depois pelo UUID
    let query = supabase
      .from('transactions')
      .update(dbUpdates)
      .select()
      .single();

    // Se o ID parece ser um custom_id (formato TX0001), buscar por custom_id
    if (id.match(/^TX\d{4}$/)) {
      query = query.eq('custom_id', id);
    } else {
      // Senão, buscar pelo UUID
      query = query.eq('id', id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return this.mapTransactionFromDB(data);
  }

  async deleteTransaction(id: string): Promise<void> {
    // Buscar pelo custom_id primeiro, depois pelo UUID
    let query = supabase
      .from('transactions')
      .delete();

    // Se o ID parece ser um custom_id (formato TX0001), buscar por custom_id
    if (id.match(/^TX\d{4}$/)) {
      query = query.eq('custom_id', id);
    } else {
      // Senão, buscar pelo UUID
      query = query.eq('id', id);
    }

    const { error } = await query;

    if (error) throw error;
  }

  // ================================
  // OPÇÕES
  // ================================
  
  async getOptions(userId?: string): Promise<Option[]> {
    let query = supabase
      .from('options')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data.map(this.mapOptionFromDB);
  }

  async createOption(optionData: Omit<Option, 'id'>): Promise<Option> {
    const { data, error } = await supabase
      .from('options')
      .insert({
        user_id: optionData.user_id,
        brokerage_id: optionData.brokerage_id || 'default-brokerage-id',
        contract_id: optionData.contract_id,
        option_type: optionData.option_type,
        strike_price: optionData.strike_price,
        premium: optionData.premium,
        quantity: optionData.quantity,
        expiration_date: optionData.expiration_date,
        is_purchased: optionData.is_purchased,
        status: optionData.status,
        symbol: optionData.symbol,
        name: optionData.name,
        fees: optionData.fees
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapOptionFromDB(data);
  }

  // ================================
  // MAPEADORES DE DADOS
  // ================================
  
  private mapUserFromDB(dbUser: Tables<'users'>): User {
    return {
      id: dbUser.id,
      nome: dbUser.nome,
      cpf: dbUser.cpf,
      email: dbUser.email,
      telefone: dbUser.telefone || '',
      endereco: dbUser.endereco || '',
      isActive: dbUser.is_active,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
      brokerageIds: [] // Será populado via join se necessário
    };
  }

  private mapBrokerageFromDB(dbBrokerage: Tables<'brokerages'>): Brokerage {
    return {
      id: dbBrokerage.id,
      nome: dbBrokerage.nome,
      cnpj: dbBrokerage.cnpj,
      endereco: dbBrokerage.endereco || '',
      assessor: dbBrokerage.assessor || '',
      telefone: dbBrokerage.telefone || '',
      email: dbBrokerage.email || '',
      corretagemMilho: dbBrokerage.corretagem_milho,
      corretagemBoi: dbBrokerage.corretagem_boi,
      taxas: dbBrokerage.taxas,
      impostos: dbBrokerage.impostos,
      isActive: dbBrokerage.is_active,
      createdAt: dbBrokerage.created_at,
      updatedAt: dbBrokerage.updated_at,
      authorizedUserIds: [] // Será populado via join se necessário
    };
  }

  private mapPositionFromDB(dbPosition: any): Position {
    return {
      id: dbPosition.id,
      user_id: dbPosition.user_id,
      contract_id: dbPosition.contract_id,
      contract: dbPosition.contract,
      direction: dbPosition.direction as 'LONG' | 'SHORT',
      quantity: dbPosition.quantity,
      entry_price: dbPosition.entry_price,
      current_price: dbPosition.current_price,
      stop_loss: dbPosition.stop_loss,
      take_profit: dbPosition.take_profit,
      status: dbPosition.status as any,
      entry_date: dbPosition.entry_date,
      exit_date: dbPosition.exit_date,
      exit_price: dbPosition.exit_price,
      realized_pnl: dbPosition.realized_pnl,
      unrealized_pnl: dbPosition.unrealized_pnl,
      pnl_percentage: dbPosition.pnl_percentage,
      exposure: dbPosition.exposure,
      fees: dbPosition.fees,
      symbol: dbPosition.symbol,
      name: dbPosition.name,
      contract_size: dbPosition.contract_size,
      unit: dbPosition.unit
    };
  }

  private mapTransactionFromDB(dbTransaction: Tables<'transactions'>): Transaction {
    return {
      // Usar custom_id se disponível, senão usar UUID como fallback
      id: dbTransaction.custom_id || dbTransaction.id,
      userId: dbTransaction.user_id,
      brokerageId: dbTransaction.brokerage_id,
      date: dbTransaction.date,
      type: dbTransaction.type as any,
      contract: dbTransaction.contract,
      quantity: dbTransaction.quantity,
      price: dbTransaction.price,
      total: dbTransaction.total,
      fees: dbTransaction.fees,
      status: dbTransaction.status as any,
      createdAt: dbTransaction.created_at
    };
  }

  private mapOptionFromDB(dbOption: Tables<'options'>): Option {
    return {
      id: dbOption.id,
      user_id: dbOption.user_id,
      contract_id: dbOption.contract_id,
      option_type: dbOption.option_type as 'CALL' | 'PUT',
      strike_price: dbOption.strike_price,
      premium: dbOption.premium,
      quantity: dbOption.quantity,
      expiration_date: dbOption.expiration_date,
      is_purchased: dbOption.is_purchased,
      status: dbOption.status as any,
      delta: dbOption.delta,
      gamma: dbOption.gamma,
      theta: dbOption.theta,
      vega: dbOption.vega,
      symbol: dbOption.symbol,
      name: dbOption.name,
      fees: dbOption.fees,
      created_at: dbOption.created_at
    };
  }
}

export const supabaseService = new SupabaseService(); 