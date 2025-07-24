-- ============================================
-- VERIFICAR SE O CAMPO CUSTOM_ID EXISTE
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Verificar se a coluna custom_id existe na tabela transactions
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================

-- 2. SE A COLUNA NÃO EXISTIR, execute este comando:
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS custom_id VARCHAR(10) UNIQUE;

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_transactions_custom_id ON transactions(custom_id);

-- 4. Adicionar comentário
COMMENT ON COLUMN transactions.custom_id IS 'ID customizado no formato TX0001, TX0002, etc.';

-- ============================================

-- 5. Verificar novamente se a coluna foi criada
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' 
    AND column_name = 'custom_id'
    AND table_schema = 'public';

-- ============================================
-- TESTE: Verificar se consegue inserir dados com custom_id
-- ============================================

-- ESTE É APENAS UM TESTE - NÃO EXECUTE A MENOS QUE SEJA NECESSÁRIO
/*
INSERT INTO transactions (
    user_id, 
    brokerage_id, 
    type, 
    contract, 
    quantity, 
    price, 
    total, 
    fees, 
    status,
    custom_id
) VALUES (
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM brokerages LIMIT 1),
    'COMPRA',
    'BGIZ24',
    1,
    100.00,
    100.00,
    0.00,
    'EXECUTADA',
    'TX0001'
);
*/ 