# 🚀 Instruções para Configurar o Supabase

## 📋 Pré-requisitos

1. **Conta no Supabase**: Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. **Projeto criado**: Crie um novo projeto no dashboard do Supabase

## 🔧 Configuração das Variáveis de Ambiente

### 1. Encontrar as Credenciais do Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie as seguintes informações:
   - **Project URL**: `https://sua-url-do-projeto.supabase.co`
   - **anon/public key**: `eyJ...` (chave longa começando com eyJ)
   - **service_role key**: `eyJ...` (chave de serviço - **SECRETA**)

### 2. Configurar o arquivo `.env.local`

Edite o arquivo `.env.local` na raiz do projeto:

```env
# Configurações do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://sua-url-do-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

## 🗄️ Configuração do Banco de Dados

### Executar Script SQL

No SQL Editor do Supabase, execute o conteúdo do arquivo `EXECUTAR_NO_SUPABASE.sql`:

1. Vá em **SQL Editor** no dashboard
2. Copie todo o conteúdo do arquivo `EXECUTAR_NO_SUPABASE.sql`
3. Cole no editor e execute
4. Aguarde a criação de todas as tabelas e índices

## ✅ Verificação

### Testar a Conexão

1. Reinicie o servidor de desenvolvimento: `npm run dev`
2. Verifique no console do browser se aparece: `✅ Cliente Supabase criado com sucesso`
3. Acesse a aplicação e teste as funcionalidades

### Problemas Comuns

**❌ "Conectando ao Supabase..." infinito**
- Verifique se as URLs estão corretas no `.env.local`
- Certifique-se de que as chaves não são os placeholders

**❌ Erro de permissão**
- Verifique se RLS (Row Level Security) está configurado
- Execute novamente o script SQL

**❌ Dados não aparecem**
- Verifique se as tabelas foram criadas corretamente
- Teste inserir dados manualmente no dashboard

## 📊 Funcionalidades Disponíveis

Com o Supabase configurado, você terá acesso a:

- ✅ **Gestão de Posições** - Completa com net positions
- ✅ **Histórico de Transações** - Com IDs customizados
- ✅ **Modais de Ações** - Visualizar, editar, excluir
- ✅ **Sincronização Real** - Entre todas as abas
- ✅ **Limpeza Automática** - De posições órfãs
- ✅ **Performance e Análises** - Baseadas em dados reais

## 🆘 Suporte

Se ainda houver problemas:

1. Verifique os logs do console do browser
2. Verifique os logs do terminal do Next.js
3. Confirme que o projeto Supabase está ativo
4. Teste a conexão diretamente no SQL Editor

**Configuração bem-sucedida = Sistema completamente funcional! 🎯** 