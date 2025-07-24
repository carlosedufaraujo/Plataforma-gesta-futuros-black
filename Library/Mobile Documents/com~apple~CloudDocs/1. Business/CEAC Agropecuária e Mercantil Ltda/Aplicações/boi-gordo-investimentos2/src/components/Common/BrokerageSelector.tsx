'use client';

import React from 'react';
import { Building, User, ChevronDown } from 'lucide-react';
import { useHybridData } from '@/contexts/HybridDataContext';

export default function BrokerageSelector() {
  const { currentUser, selectedBrokerage } = useHybridData();

  if (!currentUser) {
    return (
      <div className="brokerage-selector">
        <div className="selector-content">
          <div className="selector-icon">
            <User size={16} />
          </div>
          <div className="selector-info">
            <span className="selector-label">Usuário</span>
            <span className="selector-value">Não logado</span>
          </div>
        </div>
      </div>
    );
  }

  const hasSelectedBrokerage = selectedBrokerage !== null;

  return (
    <div className="brokerage-selector">
      <div className="selector-content">
        <div className="selector-icon">
          <User size={16} />
        </div>
        <div className="selector-info">
          <span className="selector-label">Usuário</span>
          <span className="selector-value">{currentUser.nome}</span>
        </div>
      </div>
      
      {hasSelectedBrokerage && (
        <div className="selector-content">
          <div className="selector-icon">
            <Building size={16} />
          </div>
          <div className="selector-info">
            <span className="selector-label">Corretora</span>
            <span className="selector-value">{selectedBrokerage.nome}</span>
          </div>
        </div>
      )}
    </div>
  );
} 