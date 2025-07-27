// Utilitários para manipulação de datas com fuso horário correto

/**
 * Cria uma data atual no fuso horário local
 */
export const createLocalDate = (): string => {
  // Criar data atual real (26/07/2025)
  const now = new Date();
  
  // Formatar para YYYY-MM-DDTHH:mm:ss no fuso horário local
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Verifica se uma data está muito no futuro (mais de 1 dia)
 */
export const isDateTooFarInFuture = (dateString: string | Date | null | undefined): boolean => {
  try {
    const date = parseLocalDate(dateString);
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    return date > oneDayFromNow;
  } catch {
    return false;
  }
};

/**
 * Corrige apenas datas muito no futuro (mais de 1 dia)
 */
export const correctDateIfNeeded = (dateString: string | Date | null | undefined): string => {
  if (isDateTooFarInFuture(dateString)) {
    return createLocalDate();
  }
  return typeof dateString === 'string' ? dateString : createLocalDate();
};

/**
 * Converte uma data string para objeto Date no fuso horário local
 */
export const parseLocalDate = (dateString: string | Date | null | undefined): Date => {
  // Se não tem valor, retorna data atual
  if (!dateString) return new Date();
  
  // Se já é um objeto Date, retorna ele mesmo
  if (dateString instanceof Date) return dateString;
  
  // Se não é string, tenta converter
  if (typeof dateString !== 'string') {
    try {
      return new Date(dateString);
    } catch {
      return new Date();
    }
  }
  
  // Se já é uma data ISO, converter para local
  if (dateString.includes('T')) {
    const date = new Date(dateString);
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  }
  
  // Se é apenas data, adicionar hora atual
  if (dateString.includes('-') && !dateString.includes('T')) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return new Date(`${dateString}T${hours}:${minutes}:${seconds}`);
  }
  
  return new Date(dateString);
};

/**
 * Formata uma data para exibição no formato brasileiro
 */
export const formatDateBR = (date: Date | string | null | undefined): string => {
  try {
    const dateObj = parseLocalDate(date);
    return dateObj.toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};

/**
 * Formata uma data e hora para exibição no formato brasileiro
 */
export const formatDateTimeBR = (date: Date | string | null | undefined): string => {
  try {
    const dateObj = parseLocalDate(date);
    return `${dateObj.toLocaleDateString('pt-BR')} às ${dateObj.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  } catch {
    return 'Data inválida';
  }
};

/**
 * Formata apenas a hora para exibição no formato brasileiro
 */
export const formatTimeBR = (date: Date | string | null | undefined): string => {
  try {
    const dateObj = parseLocalDate(date);
    return dateObj.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch {
    return '--:--';
  }
}; 