'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Position, Option, Transaction, User, Brokerage } from '@/types';
import { isSupabaseAvailable } from '@/lib/supabase';

import { SupabaseDataProvider, useSupabaseData } from '@/contexts/SupabaseDataContext';

// Interface unificada para o contexto híbrido
interface HybridDataContextType {
  // Estados de dados
  positions: Position[];
  options: Option[];
  transactions: Transaction[];
  users: User[];
  brokerages: Brokerage[];
  currentUser: User | null;
  selectedBrokerage: Brokerage | null;
  
  // Estados de controle
  loading: boolean;
  error: string | null;
  backendType: 'supabase';
  
  // Funções de manipulação - todas assíncronas
  addPosition: (position: Omit<Position, 'id'>) => Promise<void>;
  updatePosition: (id: string, updates: Partial<Position>) => Promise<void>;
  deletePosition: (id: string) => Promise<void>;
  closePosition: (id: string, closePrice: number, closeDate?: string) => Promise<void>;
  duplicatePosition: (id: string) => Promise<void>;
  
  addOption: (option: Omit<Option, 'id'>) => Promise<void>;
  updateOption: (id: string, updates: Partial<Option>) => Promise<void>;
  deleteOption: (id: string) => Promise<void>;
  
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  setCurrentUser: (user: User | null) => void;
  
  addBrokerage: (brokerage: Omit<Brokerage, 'id'>) => Promise<void>;
  updateBrokerage: (id: string, updates: Partial<Brokerage>) => Promise<void>;
  deleteBrokerage: (id: string) => Promise<void>;
  setSelectedBrokerage: (brokerage: Brokerage | null) => void;
  
  // Funções utilitárias
  refreshData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  forceCleanOrphanedPositions: () => Promise<void>;
  
  // NET Position Functions
  calculateNetPosition: (contract: string, allPositions?: Position[]) => any;
  getAllNetPositions: () => any[];
  isPositionNeutralized: (positionId: string) => boolean;
  cleanNettedPositions: () => void;
  getActivePositions: () => Position[];
}

const HybridDataContext = createContext<HybridDataContextType | undefined>(undefined);

const HybridDataWrapper = ({ children }: { children: ReactNode }) => {
  const [backendReady, setBackendReady] = useState(false);
  
  useEffect(() => {
    // USAR APENAS SUPABASE - SEM BYPASS
    console.log('🚀 SISTEMA CONFIGURADO PARA USAR APENAS SUPABASE');
    
    if (isSupabaseAvailable()) {
      console.log('✅ Supabase disponível e ativo');
      setBackendReady(true);
    } else {
      console.error('❌ ERRO: Supabase não disponível - sistema não funcionará');
      setBackendReady(false);
    }
  }, []);

  if (!backendReady) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Conectando ao Supabase...</p>
        </div>
      </div>
    );
  }

  // Usar apenas Supabase
  return (
    <SupabaseDataProvider>
      <SupabaseDataAdapter>{children}</SupabaseDataAdapter>
    </SupabaseDataProvider>
  );
};

const SupabaseDataAdapter = ({ children }: { children: ReactNode }) => {
  const supabaseData = useSupabaseData();
  
  console.log('🔥 HYBRID CONTEXT: Usando SupabaseDataAdapter');
  console.log('🔥 HYBRID CONTEXT: addPosition function:', typeof supabaseData.addPosition);
  console.log('🔥 HYBRID CONTEXT: addTransaction function:', typeof supabaseData.addTransaction);
  
  const hybridValue: HybridDataContextType = {
    ...supabaseData,
    backendType: 'supabase' as const,
    refreshData: supabaseData.fetchData, // Alias para compatibilidade
  };
  
  return (
    <HybridDataContext.Provider value={hybridValue}>
      {children}
    </HybridDataContext.Provider>
  );
};

export const HybridDataProvider = HybridDataWrapper;

export const useHybridData = (): HybridDataContextType => {
  const context = useContext(HybridDataContext);
  if (context === undefined) {
    throw new Error('useHybridData deve ser usado dentro de um HybridDataProvider');
  }
  return context;
}; 