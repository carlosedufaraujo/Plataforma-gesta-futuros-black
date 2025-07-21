'use client';

import { useState, useEffect } from 'react';
import { ContractExpiration, DEFAULT_EXPIRATIONS } from '@/types';

export function useExpirations() {
  const [expirations, setExpirations] = useState<ContractExpiration[]>(DEFAULT_EXPIRATIONS);

  // Simular carregamento (depois conectar com API)
  useEffect(() => {
    const savedExpirations = localStorage.getItem('contractExpirations');
    if (savedExpirations) {
      try {
        const parsed = JSON.parse(savedExpirations);
        setExpirations(parsed);
      } catch (error) {
        console.error('Erro ao carregar vencimentos:', error);
        setExpirations(DEFAULT_EXPIRATIONS);
      }
    }
  }, []);

  // Salvar alterações no localStorage
  const updateExpirations = (newExpirations: ContractExpiration[]) => {
    setExpirations(newExpirations);
    localStorage.setItem('contractExpirations', JSON.stringify(newExpirations));
  };

  // Filtrar apenas vencimentos ativos
  const activeExpirations = expirations.filter(exp => exp.isActive);

  return {
    expirations,
    activeExpirations,
    updateExpirations,
    setExpirations: updateExpirations
  };
} 