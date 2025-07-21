'use client';

import { useState } from 'react';
import React from 'react';
import { PageType } from '@/types';
import Sidebar from './Sidebar';
import MobileMenuToggle from './MobileMenuToggle';
import ModalManager from '@/components/Common/ModalManager';

import { useTheme } from '@/hooks/useTheme';
import { useFilter } from '@/contexts/FilterContext';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

export default function AppLayout({ children, currentPage, onPageChange }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();
  const { selectedPeriod, setSelectedPeriod } = useFilter();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getPageTitle = (page: PageType) => {
    const titles = {
      rentabilidade: 'Dashboard',
      posicoes: 'Posições',
      opcoes: 'Opções',
      transacoes: 'Transações',
      performance: 'Performance',
      configuracoes: 'Configurações'
    };
    return titles[page] || 'Dashboard';
  };

  const periodOptions = [
    { value: '30d', label: '30 dias', description: 'Últimos 30 dias' },
    { value: '60d', label: '60 dias', description: 'Últimos 60 dias' },
    { value: '90d', label: '90 dias', description: 'Últimos 90 dias' },
    { value: '6m', label: '6 meses', description: 'Últimos 6 meses' },
    { value: '1y', label: '1 ano', description: 'Último ano' },
    { value: 'all', label: 'Todo período', description: 'Desde o início' }
  ];

  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
    console.log('Período selecionado:', newPeriod);
  };

  return (
    <div className="app-container" data-theme={theme}>
      {/* Mobile Menu Toggle */}
      <MobileMenuToggle onClick={toggleSidebar} />
      
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={toggleSidebar}
      />
      
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
      
      {/* Main Content */}
      <div className="main-content">
        <div className="page-header">
          <div className="page-header-main">
            <h1 className="page-title">
              {getPageTitle(currentPage)}
            </h1>
            {currentPage === 'rentabilidade' && (
              <div className="page-subtitle">
                Análise de desempenho - {periodOptions.find(p => p.value === selectedPeriod)?.description || 'Período personalizado'}
              </div>
            )}
            {currentPage === 'posicoes' && (
              <div className="page-subtitle">
                Gestão de Posições - {periodOptions.find(p => p.value === selectedPeriod)?.description || 'Período personalizado'}
              </div>
            )}
            {currentPage === 'opcoes' && (
              <div className="page-subtitle">
                Resumo de Opções - {periodOptions.find(p => p.value === selectedPeriod)?.description || 'Período personalizado'}
              </div>
            )}
            {currentPage === 'transacoes' && (
              <div className="page-subtitle">
                Histórico de Transações - {periodOptions.find(p => p.value === selectedPeriod)?.description || 'Período personalizado'}
              </div>
            )}
            {currentPage === 'performance' && (
              <div className="page-subtitle">
                Análise de Performance - {periodOptions.find(p => p.value === selectedPeriod)?.description || 'Período personalizado'}
              </div>
            )}
            {currentPage === 'configuracoes' && (
              <div className="page-subtitle">
                Configurações do Sistema - Personalização da plataforma
              </div>
            )}
          </div>
          <div className="header-actions">
            {(currentPage === 'rentabilidade' || currentPage === 'posicoes' || currentPage === 'opcoes' || currentPage === 'transacoes') && (
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
                  onChange={(e) => handlePeriodChange(e.target.value)}
                >
                  {periodOptions.map(option => (
                    <option key={option.value} value={option.value} title={option.description}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="filter-chevron">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>
              </div>
            )}
            {currentPage === 'posicoes' && (
              <button 
                className="btn btn-primary btn-header-action"
                onClick={() => {
                  // Trigger para abrir modal de nova posição
                  const event = new CustomEvent('openNewPositionModal');
                  window.dispatchEvent(event);
                }}
              >
                + Nova Posição
              </button>
            )}
            {currentPage === 'opcoes' && (
              <button 
                className="btn btn-primary btn-header-action"
                onClick={() => {
                  // Trigger para abrir modal de nova opção
                  const event = new CustomEvent('openNewOptionModal');
                  window.dispatchEvent(event);
                }}
              >
                + Nova Opção
              </button>
            )}
          </div>
        </div>
        <main className="page-content">
          {children}
        </main>
      </div>
      <ModalManager />
    </div>
  );
} 