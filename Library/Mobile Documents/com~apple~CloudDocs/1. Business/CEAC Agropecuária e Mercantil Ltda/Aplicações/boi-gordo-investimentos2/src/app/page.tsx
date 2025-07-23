'use client';

import { useState, useEffect } from 'react';
import AppWrapper from '@/components/Layout/AppWrapper';
import DataInspector from '@/components/Debug/DataInspector';
import AutoClearButton from '@/components/Debug/AutoClearButton';

export default function HomePage() {
  const [showDataInspector, setShowDataInspector] = useState(false);
  const [showAutoClear, setShowAutoClear] = useState(true); // Mostrar por padrão

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl + Shift + D para mostrar/ocultar o inspetor de dados
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDataInspector(prev => !prev);
      }
      // Ctrl + Shift + C para mostrar/ocultar o botão de limpeza
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setShowAutoClear(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      <AppWrapper />
      {showDataInspector && (
        <div id="data-inspector">
          <DataInspector />
        </div>
      )}
      {showAutoClear && (
        <div id="auto-clear-container">
          <AutoClearButton />
        </div>
      )}
    </>
  );
} 