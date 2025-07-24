-- ================================
-- SCHEMA INICIAL - SISTEMA DE TRADING ACEX
-- ================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de corretoras
CREATE TABLE IF NOT EXISTS brokerages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    endereco TEXT,
    assessor VARCHAR(255),
    telefone VARCHAR(20),
    email VARCHAR(255),
    corretagem_milho DECIMAL(10,4) DEFAULT 0,
    corretagem_boi DECIMAL(10,4) DEFAULT 0,
    taxas DECIMAL(10,4) DEFAULT 0,
    impostos DECIMAL(10,4) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relação usuário-corretora
CREATE TABLE IF NOT EXISTS user_brokerages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    brokerage_id UUID REFERENCES brokerages(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'trader' CHECK (role IN ('admin', 'trader', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, brokerage_id)
);

-- Tabela de contratos
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL UNIQUE,
    contract_type VARCHAR(10) NOT NULL CHECK (contract_type IN ('BGI', 'CCM', 'ICF', 'DOL', 'IND')),
    expiration_date DATE NOT NULL,
    contract_size INTEGER NOT NULL,
    unit VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    current_price DECIMAL(10,2),
    volume INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de posições
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    brokerage_id UUID REFERENCES brokerages(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    contract VARCHAR(10) NOT NULL, -- Para facilitar queries
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    entry_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2),
    stop_loss DECIMAL(10,2),
    take_profit DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'EXECUTADA' CHECK (status IN ('EXECUTADA', 'EM_ABERTO', 'CANCELADA', 'FECHADA', 'NETTED')),
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_date TIMESTAMP WITH TIME ZONE,
    exit_price DECIMAL(10,2),
    realized_pnl DECIMAL(15,2),
    unrealized_pnl DECIMAL(15,2),
    pnl_percentage DECIMAL(8,4),
    exposure DECIMAL(15,2),
    fees DECIMAL(10,2) DEFAULT 0,
    symbol VARCHAR(10),
    name VARCHAR(255),
    contract_size INTEGER,
    unit VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    brokerage_id UUID REFERENCES brokerages(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('COMPRA', 'VENDA', 'EXERCICIO', 'VENCIMENTO')),
    contract VARCHAR(10) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(15,2) NOT NULL,
    fees DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'EXECUTADA' CHECK (status IN ('EXECUTADA', 'PENDENTE', 'CANCELADA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de opções
CREATE TABLE IF NOT EXISTS options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    brokerage_id UUID REFERENCES brokerages(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    option_type VARCHAR(10) NOT NULL CHECK (option_type IN ('CALL', 'PUT')),
    strike_price DECIMAL(10,2) NOT NULL,
    premium DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    expiration_date DATE NOT NULL,
    is_purchased BOOLEAN NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'EXPIRED', 'EXERCISED')),
    delta DECIMAL(6,4),
    gamma DECIMAL(6,4),
    theta DECIMAL(6,4),
    vega DECIMAL(6,4),
    symbol VARCHAR(20),
    name VARCHAR(255),
    fees DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- ÍNDICES PARA PERFORMANCE
-- ================================

CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_contract ON positions(contract);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_entry_date ON positions(entry_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_options_user_id ON options(user_id);
CREATE INDEX IF NOT EXISTS idx_options_expiration ON options(expiration_date);

-- ================================
-- TRIGGERS PARA UPDATED_AT
-- ================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_brokerages_updated_at 
    BEFORE UPDATE ON brokerages 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_positions_updated_at 
    BEFORE UPDATE ON positions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_options_updated_at 
    BEFORE UPDATE ON options 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ================================
-- DADOS INICIAIS
-- ================================

-- Contratos padrão
INSERT INTO contracts (symbol, contract_type, expiration_date, contract_size, unit, name, current_price) VALUES
('BGIK25', 'BGI', '2025-05-31', 330, 'arrobas', 'Boi Gordo Maio 2025', 285.50),
('BGIM25', 'BGI', '2025-06-30', 330, 'arrobas', 'Boi Gordo Junho 2025', 287.00),
('BGIN25', 'BGI', '2025-07-31', 330, 'arrobas', 'Boi Gordo Julho 2025', 289.25),
('CCMK25', 'CCM', '2025-05-31', 450, 'sacos', 'Milho Maio 2025', 65.80),
('CCMM25', 'CCM', '2025-06-30', 450, 'sacos', 'Milho Junho 2025', 66.20),
('CCMN25', 'CCM', '2025-07-31', 450, 'sacos', 'Milho Julho 2025', 66.90)
ON CONFLICT (symbol) DO NOTHING;

-- Usuário de teste
INSERT INTO users (nome, cpf, email, telefone, endereco) VALUES
('Carlos Eduardo', '123.456.789-00', 'carlos@acex.com', '(11) 99999-9999', 'São Paulo, SP')
ON CONFLICT (cpf) DO NOTHING;

-- Corretora de teste  
INSERT INTO brokerages (nome, cnpj, endereco, assessor, telefone, email, corretagem_milho, corretagem_boi, taxas, impostos) VALUES
('ACEX Capital Markets', '12.345.678/0001-90', 'São Paulo, SP', 'João Silva', '(11) 3333-4444', 'contato@acex.com', 2.50, 3.00, 0.10, 0.05)
ON CONFLICT (cnpj) DO NOTHING; 