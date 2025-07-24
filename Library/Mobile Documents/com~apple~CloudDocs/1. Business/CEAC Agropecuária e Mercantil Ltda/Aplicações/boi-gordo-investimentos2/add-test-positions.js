// Script para adicionar posições de teste
const testPositions = [
  {
    id: 'PS0001',
    user_id: 'user_1',
    contract_id: 'BGIK25',
    contract: 'BGIK25',
    direction: 'LONG',
    quantity: 10,
    entry_price: 280.50,
    current_price: 285.00,
    status: 'EXECUTADA',
    entry_date: new Date().toISOString(),
    fees: 50,
    symbol: 'BGIK25',
    name: 'Boi Gordo Maio 2025'
  },
  {
    id: 'PS0002',
    user_id: 'user_1',
    contract_id: 'BGIK25',
    contract: 'BGIK25',
    direction: 'SHORT',
    quantity: 5,
    entry_price: 282.00,
    current_price: 285.00,
    status: 'EXECUTADA',
    entry_date: new Date().toISOString(),
    fees: 25,
    symbol: 'BGIK25',
    name: 'Boi Gordo Maio 2025'
  }
];

// Salvar no localStorage
const existingPositions = JSON.parse(localStorage.getItem('acex_positions') || '{"data": []}');
existingPositions.data = testPositions;
localStorage.setItem('acex_positions', JSON.stringify(existingPositions));

console.log('Posições de teste adicionadas:', testPositions);
