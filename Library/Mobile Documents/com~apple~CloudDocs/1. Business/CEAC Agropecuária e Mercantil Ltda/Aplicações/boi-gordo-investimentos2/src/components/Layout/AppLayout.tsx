'use client';

import { useState } from 'react';
import React from 'react';
import { PageType } from '@/types';
import Sidebar from './Sidebar';
import MobileMenuToggle from './MobileMenuToggle';
import ModalManager from '@/components/Common/ModalManager';

import { useTheme } from '@/hooks/useTheme';
import FloatingActionButton from './FloatingActionButton';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export default function AppLayout({ 
  children, 
  currentPage, 
  onPageChange, 
  selectedPeriod, 
  onPeriodChange 
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getPageTitle = (page: PageType) => {
    const titles = {
      rentabilidade: 'Dashboard',
      posicoes: 'Posições',
      opcoes: 'Opções',
      performance: 'Performance',
      configuracoes: 'Configurações'
    };
    return titles[page] || 'Dashboard';
  };

  const getPeriodLabel = (period: string) => {
    const labels = {
      '30d': 'Últimos 30 dias',
      '60d': 'Últimos 60 dias',
      '90d': 'Últimos 90 dias',
      '6m': 'Últimos 6 meses',
      '1y': 'Último ano',
      'all': 'Todo período'
    };
    return labels[period] || 'Últimos 30 dias';
  };

  return (
    <div className={`app-container`} data-theme={theme}>
      <MobileMenuToggle onClick={toggleSidebar} />
      
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={toggleSidebar} />
      
      <Sidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        <div className="page-header">
          <div className="page-header-main">
            <h1 className="page-title">{getPageTitle(currentPage)}</h1>
            <div className="page-subtitle">
              Análise de desempenho - {getPeriodLabel(selectedPeriod)}
            </div>
          </div>

          <div className="header-actions">
            {currentPage === 'posicoes' && (
              <button 
                className="btn btn-primary"
                onClick={() => window.dispatchEvent(new CustomEvent('openNewPositionModal'))}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Nova Posição
              </button>
            )}
            {currentPage === 'opcoes' && (
              <button 
                className="btn btn-primary"
                onClick={() => window.dispatchEvent(new CustomEvent('openNewOptionModal'))}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Nova Opção
              </button>
            )}
            {currentPage !== 'configuracoes' && (
              <div className="period-filter">
                <div className="filter-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <select 
                  className="period-select"
                  value={selectedPeriod}
                  onChange={(e) => onPeriodChange(e.target.value)}
                >
                  <option value="30d" title="Últimos 30 dias">30 dias</option>
                  <option value="60d" title="Últimos 60 dias">60 dias</option>
                  <option value="90d" title="Últimos 90 dias">90 dias</option>
                  <option value="6m" title="Últimos 6 meses">6 meses</option>
                  <option value="1y" title="Último ano">1 ano</option>
                  <option value="all" title="Desde o início">Todo período</option>
                </select>
                <div className="filter-chevron">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        <main className="page-content">
          {children}
        </main>
      </div>

      {/* Botão Flutuante para Nova Posição */}
      <FloatingActionButton 
        onClick={() => {
          // Dispatch do evento customizado para abrir modal Nova Posição
          const event = new CustomEvent('openNewPositionModal');
          window.dispatchEvent(event);
        }}
      />

      <ModalManager />
    </div>
  );
} 