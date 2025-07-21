'use client';

import { useState } from 'react';
import { PageType } from '@/types';
import AppLayout from '@/components/Layout/AppLayout';
import RentabilidadePage from '@/components/Pages/RentabilidadePage';
import PosicoesPage from '@/components/Pages/PosicoesPage';
import OpcoesPage from '@/components/Pages/OpcoesPage';
import TransacoesPage from '@/components/Pages/TransacoesPage';
import PerformancePage from '@/components/Pages/PerformancePage';
import ConfiguracoesPage from '@/components/Pages/ConfiguracoesPage';
import { FilterProvider } from '@/contexts/FilterContext';
import { UserProvider } from '@/contexts/UserContext';
import { DataProvider } from '@/contexts/DataContext';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageType>('rentabilidade');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const renderPage = () => {
    switch (currentPage) {
      case 'rentabilidade':
        return <RentabilidadePage selectedPeriod={selectedPeriod} />;
      case 'posicoes':
        return <PosicoesPage selectedPeriod={selectedPeriod} />;
      case 'opcoes':
        return <OpcoesPage selectedPeriod={selectedPeriod} />;
      case 'transacoes':
        return <TransacoesPage selectedPeriod={selectedPeriod} />;
      case 'performance':
        return <PerformancePage selectedPeriod={selectedPeriod} />;
      case 'configuracoes':
        return <ConfiguracoesPage />;
      default:
        return <RentabilidadePage selectedPeriod={selectedPeriod} />;
    }
  };

  return (
    <UserProvider>
      <DataProvider>
        <FilterProvider selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod}>
          <AppLayout
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          >
            {renderPage()}
          </AppLayout>
        </FilterProvider>
      </DataProvider>
    </UserProvider>
  );
} 