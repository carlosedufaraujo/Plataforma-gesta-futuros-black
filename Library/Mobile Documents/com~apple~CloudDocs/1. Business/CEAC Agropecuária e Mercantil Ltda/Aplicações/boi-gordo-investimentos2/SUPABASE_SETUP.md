# 🚀 Configuração do Supabase - Sistema de Trading ACEX

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Node.js 18+ instalado
3. Git configurado

## 🔧 Passos de Configuração

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em "New Project"
3. Escolha sua organização
4. Configure o projeto:
   - **Name**: `acex-trading-platform`
   - **Database Password**: Gere uma senha segura (anote!)
   - **Region**: Escolha a mais próxima (ex: South America)
5. Clique em "Create new project"
6. Aguarde a criação (2-3 minutos)

### 2. Obter Credenciais

Após a criação, vá para **Settings > API**:

- **Project URL**: `https://[seu-project-id].supabase.co`
- **anon public key**: `eyJ...` (chave pública)
- **service_role key**: `eyJ...` (chave privada - mantenha segura!)

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[seu-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Database Configuration  
DATABASE_URL=postgresql://postgres:[sua-senha]@db.[seu-project-id].supabase.co:5432/postgres

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Executar Script SQL

1. No painel do Supabase, vá para **SQL Editor**
2. Clique em "New query"
3. Copie todo o conteúdo do arquivo `database/schema.sql`
4. Cole no editor e clique em "Run"
5. Aguarde a execução (deve mostrar "Success")

### 5. Verificar Tabelas

Vá para **Table Editor** e verifique se as seguintes tabelas foram criadas:

- ✅ `users`
- ✅ `brokerages` 
- ✅ `user_brokerages`
- ✅ `contracts`
- ✅ `positions`
- ✅ `transactions`
- ✅ `options`

### 6. Configurar RLS (Row Level Security)

Execute no **SQL Editor**:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokerages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_brokerages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir tudo por enquanto)
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON brokerages FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON user_brokerages FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON contracts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON positions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON options FOR ALL USING (true);
```

## 🔄 Migração do localStorage para Supabase

### Opção 1: Substituir Contexto (Recomendado)

Edite `src/app/layout.tsx`:

```tsx
// Substituir:
import { DataProvider } from '@/contexts/DataContext';

// Por:
import { SupabaseDataProvider } from '@/contexts/SupabaseDataContext';

// E no JSX:
<SupabaseDataProvider>
  {children}
</SupabaseDataProvider>
```

### Opção 2: Migração Gradual

Mantenha ambos os contextos e migre componente por componente:

```tsx
// Em componentes específicos:
import { useSupabaseData } from '@/contexts/SupabaseDataContext';
```

## 🧪 Testar Integração

1. Inicie o servidor: `npm run dev`
2. Abra o console do navegador
3. Procure por logs do tipo:
   - `📡 Carregando dados do Supabase...`
   - `✅ Dados carregados do Supabase:`
4. Teste criar uma nova posição
5. Verifique no painel do Supabase se os dados foram salvos

## 📊 Monitoramento

### Logs do Supabase

No painel, vá para **Logs** para ver:
- Queries executadas
- Erros de conexão
- Performance das operações

### Métricas

Em **Reports** você pode acompanhar:
- Uso do banco de dados
- Número de requisições
- Latência das queries

## 🔒 Segurança

### Políticas RLS Avançadas

Para produção, substitua as políticas básicas por:

```sql
-- Usuários só podem ver seus próprios dados
CREATE POLICY "Users can only see own data" ON positions 
  FOR ALL USING (auth.uid()::text = user_id);

-- Corretoras só para usuários autorizados
CREATE POLICY "Brokerage access control" ON user_brokerages 
  FOR ALL USING (auth.uid()::text = user_id);
```

### Variáveis de Ambiente

- ✅ **NUNCA** commite as chaves no Git
- ✅ Use `.env.local` para desenvolvimento
- ✅ Configure variáveis no Vercel/produção
- ✅ Mantenha `service_role_key` segura

## 🚨 Troubleshooting

### Erro de Conexão

```
Error: Missing Supabase environment variables
```

**Solução**: Verifique se `.env.local` está configurado corretamente.

### Erro de Permissão

```
new row violates row-level security policy
```

**Solução**: Verifique as políticas RLS ou desabilite temporariamente.

### Erro de Schema

```
relation "positions" does not exist
```

**Solução**: Execute novamente o script `database/schema.sql`.

## 📈 Próximos Passos

1. ✅ Configurar autenticação de usuários
2. ✅ Implementar real-time subscriptions
3. ✅ Adicionar backup automático
4. ✅ Configurar webhooks para notificações
5. ✅ Otimizar queries com índices

## 🆘 Suporte

- **Documentação**: [supabase.com/docs](https://supabase.com/docs)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)
- **GitHub**: [github.com/supabase/supabase](https://github.com/supabase/supabase) 