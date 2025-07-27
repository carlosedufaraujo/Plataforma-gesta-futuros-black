# 🚀 Deploy Manual no Cloudflare Pages

## 1️⃣ Acesse o Cloudflare Dashboard
1. Vá para [dash.cloudflare.com](https://dash.cloudflare.com)
2. Faça login com sua conta

## 2️⃣ Criar Projeto no Cloudflare Pages
1. Clique em **Workers & Pages** no menu lateral
2. Clique em **Create application**
3. Selecione **Pages**
4. Clique em **Connect to Git**

## 3️⃣ Conectar com GitHub
1. Selecione **GitHub**
2. Autorize o Cloudflare a acessar seu GitHub
3. Selecione o repositório: **Plataforma-gesta-futuros-black**
4. Clique em **Begin setup**

## 4️⃣ Configurar Build
Configure exatamente assim:

- **Project name**: `plataforma-futuros`
- **Production branch**: `main`
- **Framework preset**: `Next.js (Static HTML Export)`
- **Build command**: `npm run build`
- **Build output directory**: `out`
- **Root directory**: `/` (deixe vazio)

## 5️⃣ Variáveis de Ambiente
Clique em **Environment variables** e adicione:

```
NEXT_PUBLIC_SUPABASE_URL = https://kdfevkbwohcajcwrqzor.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZmV2a2J3b2hjYWpjd3Jxem9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTUzODcsImV4cCI6MjA2ODg5MTM4N30.4nBjKi3rdpfbYmxeoa8GELdBLq8JY6ym68cJX7jpaus
```

## 6️⃣ Deploy
1. Clique em **Save and Deploy**
2. Aguarde o build (2-3 minutos)
3. Seu site estará em: `plataforma-futuros.pages.dev`

## 7️⃣ Domínio Customizado
Após o primeiro deploy:

1. Vá em **Custom domains**
2. Clique em **Set up a custom domain**
3. Digite seu domínio (ex: `plataforma-futuros.com.br`)
4. Siga as instruções para configurar DNS

## 8️⃣ Deploy Automático
Agora, toda vez que você fizer push para o GitHub:
```bash
git add .
git commit -m "sua mensagem"
git push origin main
```

O Cloudflare vai automaticamente:
- Detectar as mudanças
- Fazer build
- Publicar em produção

## 📱 URLs
- **Temporária**: `https://plataforma-futuros.pages.dev`
- **Customizada**: `https://seu-dominio.com.br` (após configurar)

## ⚡ Dicas
- Build leva ~2-3 minutos
- Deploys são automáticos
- Preview deployments para branches diferentes
- Analytics grátis incluído