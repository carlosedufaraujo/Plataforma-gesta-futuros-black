const fs = require('fs');
const path = require('path');

// Função para substituir status OPEN
function fixStatusInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Substituições para posições
  let newContent = content
    .replace(/p\.status === 'OPEN'/g, "(p.status === 'EXECUTADA' || p.status === 'EM_ABERTO')")
    .replace(/pos\.status === 'OPEN'/g, "(pos.status === 'EXECUTADA' || pos.status === 'EM_ABERTO')")
    .replace(/position\.status === 'OPEN'/g, "(position.status === 'EXECUTADA' || position.status === 'EM_ABERTO')")
    .replace(/p\.status === 'CLOSED'/g, "p.status === 'FECHADA'")
    .replace(/pos\.status === 'CLOSED'/g, "pos.status === 'FECHADA'")
    .replace(/position\.status === 'CLOSED'/g, "position.status === 'FECHADA'");
  
  // Para opções, manter OPEN
  newContent = newContent
    .replace(/opt\.status === 'OPEN'/g, "opt.status === 'OPEN'")
    .replace(/option\.status === 'OPEN'/g, "option.status === 'OPEN'");
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Corrigido: ${filePath}`);
  }
}

// Arquivos para corrigir
const filesToFix = [
  'src/components/Pages/PosicoesPage.tsx',
  'src/components/Pages/RentabilidadePage.tsx', 
  'src/components/Pages/PerformancePage.tsx',
  'src/contexts/DataContext.tsx'
];

filesToFix.forEach(fixStatusInFile);
console.log('Correção de status concluída!');
