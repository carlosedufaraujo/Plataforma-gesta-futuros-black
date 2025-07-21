'use client';

import { createContext, useContext, ReactNode } from 'react';

// Context para compartilhar filtros
interface FilterContextType {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter deve ser usado dentro de um FilterProvider');
  }
  return context;
};

interface FilterProviderProps {
  children: ReactNode;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
}

export const FilterProvider = ({ children, selectedPeriod, setSelectedPeriod }: FilterProviderProps) => {
  return (
    <FilterContext.Provider value={{ selectedPeriod, setSelectedPeriod }}>
      {children}
    </FilterContext.Provider>
  );
};

export default FilterContext; 