# 🎨 PADRÕES DO SISTEMA - ACEX CAPITAL MARKETS

## 📁 ESTRUTURA E ORGANIZAÇÃO

### **Estrutura de Pastas:**
```
src/
├── app/                    # Next.js App Router
├── components/            # Componentes React organizados por categoria
│   ├── Admin/            # Componentes administrativos
│   ├── Common/           # Componentes reutilizáveis
│   ├── Layout/           # Layout e estrutura
│   ├── Modals/           # Todos os modais do sistema
│   ├── Pages/            # Componentes de página
│   ├── Settings/         # Configurações
│   └── Trading/          # Componentes de trading
├── contexts/             # Context API providers
├── hooks/                # Custom React hooks
├── lib/                  # Bibliotecas e configurações
├── services/             # Serviços e APIs
├── styles/               # Estilos globais
├── types/                # TypeScript types
└── utils/                # Funções utilitárias
```

## 🎨 DESIGN SYSTEM

### **Cores e Temas:**
- **Tema Dark (padrão):** Fundo #0f0f0f, cards #1a1a1a
- **Tema Light:** Fundo #EEECE8, cards #ffffff
- **Cores semânticas:**
  - Positivo: #10b981 (verde)
  - Negativo: #ef4444 (vermelho)
  - Info: #3b82f6 (azul)
  - Warning: #f59e0b (laranja)

### **Tipografia:**
- **Fonte:** Inter (300, 400, 500, 600, 700)
- **Classes CSS:** Usar variáveis CSS customizadas

### **Componentes Base:**
- **Cards:** Classe `.card` com bordas arredondadas
- **Modais:** Componente `Modal` com overlay escuro
- **Badges:** `StatusBadge` para estados
- **Tabelas:** `DataTable` com estilos consistentes

## 💻 BIBLIOTECAS PRINCIPAIS

### **UI/UX:**
- **React 19.1.0** + **Next.js 15.4.2**
- **Tailwind CSS 4** (com preflight desabilitado)
- **Framer Motion** para animações
- **React Hot Toast** para notificações

### **Gráficos:**
- **Chart.js 4.5.0** + **react-chartjs-2**
- **Recharts 3.1.0** para gráficos adicionais

### **Ícones:**
- **Heroicons** (@heroicons/react)
- **Lucide React** para ícones adicionais
- SVG inline para ícones customizados

### **Data:**
- **date-fns 4.1.0** para manipulação de datas
- **Supabase** para backend/database

## 🔧 PADRÕES DE CÓDIGO

### **TypeScript:**
- Usar types explícitos sempre
- Interfaces para props de componentes
- Enums para valores constantes

### **Componentes:**
```typescript
'use client';

interface ComponentProps {
  prop1: string;
  prop2?: number;
}

export default function Component({ prop1, prop2 = 0 }: ComponentProps) {
  // Lógica do componente
}
```

### **Estilos:**
- CSS Modules não usado - usar classes globais
- Tailwind para utilitários rápidos
- Variáveis CSS para temas

### **Estado:**
- Context API para estado global
- useState para estado local
- Custom hooks para lógica reutilizável

## 📱 LAYOUT PADRÃO

### **Desktop:**
- Sidebar fixa à esquerda (280px)
- Conteúdo principal com padding
- Modais centralizados com overlay

### **Mobile:**
- Menu hambúrguer
- Sidebar como drawer
- Componentes responsivos

## 🚀 CONVENÇÕES

### **Nomenclatura:**
- Componentes: PascalCase
- Arquivos: camelCase ou kebab-case
- Variáveis: camelCase
- Constantes: UPPER_SNAKE_CASE

### **Imports:**
- Absolute imports com @/
- Agrupar por tipo (React, libs, local)

### **Git:**
- Commits em português
- Prefixos: feat:, fix:, refactor:, docs:

## ⚡ PERFORMANCE

### **Otimizações:**
- Lazy loading de componentes pesados
- Memoização com React.memo quando necessário
- useCallback/useMemo para funções pesadas

### **Bundle:**
- Code splitting automático do Next.js
- Imports dinâmicos para modais

## 🔐 SEGURANÇA

### **Práticas:**
- Sanitização de inputs
- Validação no frontend e backend
- Uso de variáveis de ambiente
- HTTPS em produção

---

**IMPORTANTE:** Sempre seguir esses padrões para manter consistência no sistema!