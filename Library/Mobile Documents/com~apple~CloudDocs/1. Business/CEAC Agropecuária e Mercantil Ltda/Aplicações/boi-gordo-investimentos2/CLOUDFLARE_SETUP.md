# 🚀 Configuração Completa - Cloudflare + GitHub + Supabase

## 📋 Checklist de Configuração

### 1️⃣ **Cloudflare Pages (Frontend)**
- [ ] Acesse [dash.cloudflare.com](https://dash.cloudflare.com)
- [ ] Vá em **Workers & Pages** → **Create Application** → **Pages**
- [ ] Conecte com GitHub e selecione o repositório
- [ ] Configure o build:
  ```
  Build command: npm run build
  Build output directory: .next
  Root directory: /
  ```
- [ ] Adicione variáveis de ambiente:
  ```
  NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
  ```

### 2️⃣ **Cloudflare Workers (Backend)**
- [ ] No Cloudflare Dashboard, crie um novo Worker
- [ ] Nome: `boi-gordo-api`
- [ ] Configure o subdomínio: `api.seudominio.com.br`

### 3️⃣ **GitHub Secrets**
No seu repositório GitHub, vá em **Settings** → **Secrets** → **Actions** e adicione:

```bash
CLOUDFLARE_API_TOKEN         # Token da API Cloudflare
CLOUDFLARE_ACCOUNT_ID        # ID da conta Cloudflare
NEXT_PUBLIC_SUPABASE_URL     # URL do Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY # Chave anônima do Supabase
SUPABASE_SERVICE_KEY         # Chave de serviço (para o backend)
```

### 4️⃣ **Domínio Customizado**
1. No Cloudflare Pages, vá em **Custom domains**
2. Adicione seu domínio: `seudominio.com.br`
3. Para o backend: `api.seudominio.com.br`

### 5️⃣ **Scripts NPM Necessários**

Adicione ao `package.json` do backend:
```json
{
  "scripts": {
    "build:worker": "esbuild src/worker.ts --bundle --platform=node --outfile=dist/worker.js"
  }
}
```

### 6️⃣ **Variáveis de Ambiente**

#### `.env.production` (Frontend)
```env
NEXT_PUBLIC_SUPABASE_URL=https://kdfevkbwohcajcwrqzor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
NEXT_PUBLIC_API_URL=https://api.seudominio.com.br
```

#### `wrangler.toml` (Backend)
```toml
[vars]
SUPABASE_URL = "https://kdfevkbwohcajcwrqzor.supabase.co"
SUPABASE_SERVICE_KEY = "sua_service_key_aqui"
```

## 🔄 Deploy Automático

Após configurar tudo:
1. Faça commit das mudanças
2. Push para o branch `main`
3. O GitHub Actions vai:
   - Fazer build do frontend e backend
   - Fazer deploy no Cloudflare automaticamente
   - Atualizar seu site em produção

## 🎯 URLs Finais
- **Frontend**: `https://seudominio.com.br`
- **API Backend**: `https://api.seudominio.com.br`
- **Supabase**: `https://kdfevkbwohcajcwrqzor.supabase.co`

## 📱 Comandos Úteis

```bash
# Testar localmente
npm run dev

# Build de produção
npm run build

# Deploy manual (se necessário)
npx wrangler deploy

# Ver logs do Worker
npx wrangler tail
```

## ⚡ Performance
- **CDN Global**: Cloudflare distribui seu site em 200+ datacenters
- **Edge Computing**: Backend roda próximo aos usuários
- **Cache Automático**: Assets otimizados automaticamente
- **SSL Grátis**: HTTPS incluído

## 🔐 Segurança
- Proteção DDoS automática
- Firewall Web Application (WAF)
- Rate limiting configurável
- Headers de segurança automáticos