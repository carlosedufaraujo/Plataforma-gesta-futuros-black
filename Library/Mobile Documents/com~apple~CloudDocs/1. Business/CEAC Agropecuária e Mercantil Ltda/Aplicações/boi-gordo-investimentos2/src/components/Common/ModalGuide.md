# 🪟 Guia de Modais - Sistema Padronizado

## 📋 Estrutura Obrigatória

### ✅ ESTRUTURA CORRETA (USAR SEMPRE):
```tsx
<div className="modal-overlay">
  <div className="modal"> {/* ou "modal modal-large" */}
    <div className="modal-header">
      <h3>Título do Modal</h3>
      <button className="modal-close" onClick={onClose}>×</button>
    </div>
    
    <div className="modal-body">
      <form onSubmit={handleSubmit}>
        {/* Conteúdo do formulário */}
        
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Confirmar
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
```

### ❌ ESTRUTURAS INCORRETAS (EVITAR):
```tsx
<!-- NUNCA USAR - Sem overlay -->
<div className="modal active">
  <div className="modal-content">

<!-- NUNCA USAR - Botões com style inline -->
<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>

<!-- NUNCA USAR - modal-footer (usar modal-actions) -->
<div className="modal-footer">
```

## 🏗️ Componente Base Recomendado

```tsx
import Modal, { ModalActions, ModalForm } from '@/components/Common/Modal';

export default function MeuModal({ isOpen, onClose, onSubmit }) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Título do Modal"
      size="normal" // ou "large"
    >
      <ModalForm onSubmit={onSubmit}>
        {/* Campos do formulário */}
        
        <ModalActions>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Confirmar
          </button>
        </ModalActions>
      </ModalForm>
    </Modal>
  );
}
```

## 🎯 Classes CSS Padronizadas

### Estrutura Principal:
- **`.modal-overlay`** - Container principal com blur
- **`.modal`** - Janela do modal (tamanho normal)
- **`.modal-large`** - Janela do modal (tamanho grande)

### Seções:
- **`.modal-header`** - Cabeçalho com título e botão fechar
- **`.modal-body`** - Conteúdo principal do modal
- **`.modal-actions`** - Container para botões (usar sempre)

### Elementos:
- **`.modal-close`** - Botão de fechar (X)
- **`h3`** - Título do modal (dentro de modal-header)

## 🔧 Funcionalidades Automáticas

### CSS Robusto com !important:
- ✅ **Centralização automática** - Todo modal será centralizado
- ✅ **Blur de fundo** - backdrop-filter aplicado automaticamente
- ✅ **Responsividade** - Adaptação mobile automática
- ✅ **Animações** - fadeIn e slideIn aplicadas
- ✅ **Z-index correto** - Sobreposição garantida

### Compatibilidade Retroativa:
- ✅ **`.modal.active`** - Estrutura antiga funciona (com correções CSS)
- ✅ **Estilos inline** - Sobrescritos automaticamente
- ✅ **`.modal-footer`** - Convertido para `.modal-actions`

## 📏 Tamanhos de Modal

```tsx
{/* Modal Normal - máx 650px */}
<div className="modal">

{/* Modal Grande - máx 900px */}
<div className="modal modal-large">
```

## 🎨 Boas Práticas

### 1. **Título Consistente:**
```tsx
<h3>{editingItem ? 'Editar Item' : 'Novo Item'}</h3>
```

### 2. **Botões Padronizados:**
```tsx
<div className="modal-actions">
  <button type="button" className="btn btn-secondary" onClick={onClose}>
    Cancelar
  </button>
  <button type="submit" className="btn btn-primary">
    {editingItem ? 'Atualizar' : 'Criar'}
  </button>
</div>
```

### 3. **Validação de Formulário:**
```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

// Mostrar erros
{errors.field && <span className="error-message">{errors.field}</span>}
```

### 4. **Fechar Modal:**
```tsx
// Fechar ao clicar no overlay
const handleOverlayClick = (e) => {
  if (e.target === e.currentTarget) {
    onClose();
  }
};

// Fechar com ESC
useEffect(() => {
  const handleEsc = (e) => {
    if (e.key === 'Escape') onClose();
  };
  
  if (isOpen) {
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }
}, [isOpen, onClose]);
```

## 🚨 Regras de Validação CSS

O sistema CSS força as seguintes regras:

1. **`.modal-overlay`** SEMPRE é container principal
2. **`.modal`** SEMPRE é a janela centralizada
3. **`.modal-header`** SEMPRE tem padding e border
4. **`.modal-body`** SEMPRE tem padding interno
5. **`.modal-actions`** SEMPRE alinha botões à direita
6. **Responsividade** SEMPRE ativa em mobile
7. **Animações** SEMPRE aplicadas
8. **Z-index** SEMPRE correto (10001+)

## ✅ Checklist de Desenvolvimento

### Antes de criar um novo modal:
- [ ] Usa `.modal-overlay > .modal` como estrutura
- [ ] Usa `<h3>` para título
- [ ] Usa `.modal-actions` para botões
- [ ] Implementa fechar com ESC e overlay click
- [ ] Aplica validação de formulário
- [ ] Testa em mobile
- [ ] Usa botões `.btn-secondary` e `.btn-primary`

### Migração de modal antigo:
- [ ] Trocar `.modal.active` por `.modal-overlay > .modal`
- [ ] Trocar `.modal-content` por `.modal`
- [ ] Trocar `<h2 className="modal-title">` por `<h3>`
- [ ] Trocar `.modal-footer` por `.modal-actions`
- [ ] Remover estilos inline dos botões
- [ ] Testar funcionalidade completa

## 🎉 Resultado Final

Com essas regras, TODOS os modais terão:
- ✅ **Aparência consistente**
- ✅ **Comportamento uniforme**
- ✅ **Acessibilidade garantida**
- ✅ **Responsividade automática**
- ✅ **Manutenibilidade alta**

---

*Este sistema garante que qualquer modal, independente de como foi implementado, seguirá o padrão visual e funcional estabelecido.* 