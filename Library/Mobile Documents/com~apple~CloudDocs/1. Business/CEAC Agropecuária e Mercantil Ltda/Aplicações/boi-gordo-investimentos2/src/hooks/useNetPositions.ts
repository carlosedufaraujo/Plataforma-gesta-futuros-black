'use client';

import { useMemo } from 'react';
import { useHybridData } from '@/contexts/HybridDataContext';
import { Position } from '@/types';

export interface NetPosition {
  contract: string;
  product: string;
  longQuantity: number;
  shortQuantity: number;
  netQuantity: number; // Mantém sinal negativo para SHORT
  netDirection: 'LONG' | 'SHORT' | 'NEUTRO';
  positions: Position[];
  weightedEntryPrice: number;
  currentPrice: number;
  totalValue: number;
  unrealizedPnL: number;
  exposure: number;
}

export const useNetPositions = () => {
  const { positions, calculateNetPosition, getAllNetPositions, isPositionNeutralized } = useHybridData();

  // Calcular posições líquidas com informações financeiras completas
  const netPositions = useMemo((): NetPosition[] => {
    // Filtrar apenas posições executadas e em aberto (não CANCELADA, FECHADA, NETTED, etc.)
    const activePositions = positions.filter(p => p.status === 'EXECUTADA' || p.status === 'EM_ABERTO');
    const contracts = [...new Set(activePositions.map(p => p.contract))];
    
    return contracts.map(contract => {
      const contractPositions = activePositions.filter(p => p.contract === contract);
      
      const longPositions = contractPositions.filter(p => p.direction === 'LONG');
      const shortPositions = contractPositions.filter(p => p.direction === 'SHORT');
      
      const longQuantity = longPositions.reduce((sum, p) => sum + p.quantity, 0);
      const shortQuantity = shortPositions.reduce((sum, p) => sum + p.quantity, 0);
      const netQuantity = longQuantity - shortQuantity; // Mantém sinal
      const netDirection = netQuantity > 0 ? 'LONG' : netQuantity < 0 ? 'SHORT' : 'NEUTRO';
      
      // Se a quantidade líquida é zero, não incluir na lista
      if (netQuantity === 0) {
        return null;
      }
      
      // Calcular preço médio ponderado
      const totalValue = contractPositions.reduce((sum, p) => sum + (p.entry_price * p.quantity), 0);
      const totalQuantity = contractPositions.reduce((sum, p) => sum + p.quantity, 0);
      const weightedEntryPrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;
      
      // Preço atual (usar o mais recente disponível)
      const currentPrice = contractPositions.find(p => p.current_price)?.current_price || weightedEntryPrice;
      
      // Calcular P&L não realizado e exposição
      const contractSize = contract.startsWith('BGI') ? 330 : 450;
      const priceDiff = currentPrice - weightedEntryPrice;
      
      // Para LONG: P&L positivo quando preço sobe (priceDiff > 0)
      // Para SHORT: P&L positivo quando preço cai (priceDiff < 0)
      let unrealizedPnL = 0;
      if (netDirection === 'LONG') {
        unrealizedPnL = priceDiff * Math.abs(netQuantity) * contractSize;
      } else if (netDirection === 'SHORT') {
        // Para SHORT, quando preço cai (priceDiff negativo), P&L é positivo
        unrealizedPnL = -priceDiff * Math.abs(netQuantity) * contractSize;
      }
      
      const exposure = weightedEntryPrice * Math.abs(netQuantity) * contractSize;
      
      return {
        contract,
        product: contract.startsWith('BGI') ? 'Boi Gordo' : 'Milho',
        longQuantity,
        shortQuantity,
        netQuantity, // Mantém sinal negativo para SHORT
        netDirection,
        positions: contractPositions,
        weightedEntryPrice,
        currentPrice,
        totalValue,
        unrealizedPnL,
        exposure
      };
    }).filter(net => net !== null && net.netQuantity !== 0); // Filtrar posições neutras e nulas
  }, [positions]);

  // Estatísticas gerais
  const netStats = useMemo(() => {
    const totalUnrealizedPnL = netPositions.reduce((sum, net) => sum + net.unrealizedPnL, 0);
    const totalExposure = netPositions.reduce((sum, net) => sum + net.exposure, 0);
    const longPositions = netPositions.filter(net => net.netDirection === 'LONG').length;
    const shortPositions = netPositions.filter(net => net.netDirection === 'SHORT').length;
    const neutralPositions = positions.filter(p => p.status === 'OPEN').length - 
                           netPositions.reduce((sum, net) => sum + net.positions.length, 0);

    return {
      totalUnrealizedPnL,
      totalExposure,
      longPositions,
      shortPositions,
      neutralPositions,
      totalNetPositions: netPositions.length
    };
  }, [netPositions, positions]);

  // Função para obter posição líquida de um contrato específico
  const getNetPositionByContract = (contract: string): NetPosition | null => {
    return netPositions.find(net => net.contract === contract) || null;
  };

  // Função para verificar se uma posição individual está neutralizada
  const checkPositionNeutralization = (positionId: string): boolean => {
    return isPositionNeutralized(positionId);
  };

  // Função para formatar quantidade com sinal
  const formatNetQuantity = (netQuantity: number): string => {
    if (netQuantity === 0) return '0';
    return netQuantity < 0 ? `-${Math.abs(netQuantity)}` : `${netQuantity}`;
  };

  // Função para obter cor baseada na direção
  const getDirectionColor = (netDirection: string): string => {
    switch (netDirection) {
      case 'LONG': return 'var(--color-success)';
      case 'SHORT': return 'var(--color-danger)';
      case 'NEUTRO': return 'var(--color-secondary)';
      default: return 'var(--text-primary)';
    }
  };

  return {
    netPositions,
    netStats,
    getNetPositionByContract,
    checkPositionNeutralization,
    formatNetQuantity,
    getDirectionColor,
    // Re-exportar funções do contexto
    calculateNetPosition,
    getAllNetPositions,
    isPositionNeutralized
  };
}; 