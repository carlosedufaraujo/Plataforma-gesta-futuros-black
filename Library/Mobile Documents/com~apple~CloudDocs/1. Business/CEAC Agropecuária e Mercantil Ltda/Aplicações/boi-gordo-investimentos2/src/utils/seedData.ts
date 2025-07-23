/**
 * Dados de exemplo para testar o sistema
 */

import { localStorageService } from '@/services/localStorage';
import { User, Brokerage, Position, Transaction } from '@/types';

export const seedExampleData = () => {
  console.log('🌱 Populando dados de exemplo...');

  // Usuários de exemplo
  const exampleUsers: User[] = [
    {
      id: 'user_1',
      nome: 'Carlos Eduardo Almeida',
      cpf: '123.456.789-00',
      email: 'carlos@email.com',
      telefone: '(11) 99999-1234',
      endereco: 'São Paulo, SP',
      isActive: true,
      brokerageIds: ['brokerage_1', 'brokerage_2'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user_2',
      nome: 'Maria Silva Santos',
      cpf: '987.654.321-00',
      email: 'maria@email.com',
      telefone: '(11) 88888-5678',
      endereco: 'Rio de Janeiro, RJ',
      isActive: true,
      brokerageIds: ['brokerage_1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Corretoras de exemplo
  const exampleBrokerages: Brokerage[] = [
    {
      id: 'brokerage_1',
      nome: 'ACEX Investimentos',
      cnpj: '12.345.678/0001-90',
      endereco: 'Av. Paulista, 1000 - São Paulo, SP',
      assessor: 'João Silva',
      telefone: '(11) 3000-1000',
      email: 'contato@acex.com.br',
      corretagemBoi: 15.00,
      corretagemMilho: 12.00,
      taxas: 5.00,
      impostos: 0.15,
      isActive: true,
      authorizedUserIds: ['user_1', 'user_2'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'brokerage_2',
      nome: 'XP Investimentos',
      cnpj: '98.765.432/0001-10',
      endereco: 'Av. Brigadeiro Faria Lima, 2000 - São Paulo, SP',
      assessor: 'Ana Costa',
      telefone: '(11) 4000-2000',
      email: 'suporte@xpi.com.br',
      corretagemBoi: 18.00,
      corretagemMilho: 15.00,
      taxas: 8.00,
      impostos: 0.20,
      isActive: true,
      authorizedUserIds: ['user_1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Posições de exemplo
  const examplePositions: Position[] = [
    {
      id: 'pos_1',
      contract: 'BGI25',
      direction: 'LONG',
      quantity: 5,
      entry_price: 285.50,
      current_price: 290.00,
      entry_date: '2024-01-15',
      status: 'OPEN',
      fees: 75.00,
      unrealized_pnl: 7425.00, // (290-285.50) * 5 * 330
      user_id: 'user_1',
      brokerage_id: 'brokerage_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'pos_2',
      contract: 'CCM25',
      direction: 'SHORT',
      quantity: 3,
      entry_price: 62.80,
      current_price: 61.50,
      entry_date: '2024-01-20',
      status: 'OPEN',
      fees: 45.00,
      unrealized_pnl: 1755.00, // (62.80-61.50) * 3 * 450
      user_id: 'user_1',
      brokerage_id: 'brokerage_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'pos_3',
      contract: 'BGI25',
      direction: 'SHORT',
      quantity: 2,
      entry_price: 288.00,
      current_price: 290.00,
      entry_date: '2024-01-22',
      status: 'OPEN',
      fees: 30.00,
      unrealized_pnl: -1320.00, // (288.00-290.00) * 2 * 330
      user_id: 'user_2',
      brokerage_id: 'brokerage_1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Transações de exemplo
  const exampleTransactions: Transaction[] = [
    {
      id: 'trans_1',
      userId: 'user_1',
      brokerageId: 'brokerage_1',
      date: '2024-01-15',
      contract: 'BGI25',
      type: 'COMPRA',
      quantity: 5,
      price: 285.50,
      total: 470775.00, // 285.50 * 5 * 330
      fees: 75.00,
      status: 'EXECUTADA',
      createdAt: new Date().toISOString()
    },
    {
      id: 'trans_2',
      userId: 'user_1',
      brokerageId: 'brokerage_1',
      date: '2024-01-20',
      contract: 'CCM25',
      type: 'VENDA',
      quantity: 3,
      price: 62.80,
      total: 84780.00, // 62.80 * 3 * 450
      fees: 45.00,
      status: 'EXECUTADA',
      createdAt: new Date().toISOString()
    }
  ];

  // Salvar dados
  localStorageService.saveUsers(exampleUsers);
  localStorageService.saveBrokerages(exampleBrokerages);
  localStorageService.savePositions(examplePositions);
  localStorageService.saveTransactions(exampleTransactions);
  
  // Definir usuário e corretora atuais
  localStorageService.saveCurrentUser(exampleUsers[0]);
  localStorageService.saveSelectedBrokerage(exampleBrokerages[0]);

  console.log('✅ Dados de exemplo salvos com sucesso!');
  console.log('📊 Resumo:');
  console.log(`   - ${exampleUsers.length} usuários`);
  console.log(`   - ${exampleBrokerages.length} corretoras`);
  console.log(`   - ${examplePositions.length} posições`);
  console.log(`   - ${exampleTransactions.length} transações`);
  
  return {
    users: exampleUsers,
    brokerages: exampleBrokerages,
    positions: examplePositions,
    transactions: exampleTransactions
  };
};

// Disponibilizar globalmente no desenvolvimento
if (typeof window !== 'undefined') {
  (window as any).seedExampleData = seedExampleData;
}

export default seedExampleData; 