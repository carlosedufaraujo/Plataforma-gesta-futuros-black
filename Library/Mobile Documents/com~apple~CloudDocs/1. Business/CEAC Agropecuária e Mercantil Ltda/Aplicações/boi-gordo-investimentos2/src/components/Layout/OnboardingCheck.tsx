'use client';

import React, { useEffect, useState } from 'react';
import BrokerageSetupModal from '@/components/Modals/BrokerageSetupModal';
import { useHybridData } from '@/contexts/HybridDataContext';

export default function OnboardingCheck() {
  const [showBrokerageSetup, setShowBrokerageSetup] = useState(false);
  const { currentUser, selectedBrokerage } = useHybridData();

  useEffect(() => {
    // Verificar se o usuário precisa configurar uma corretora
    const timer = setTimeout(() => {
      if (currentUser && !selectedBrokerage) {
        setShowBrokerageSetup(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentUser, selectedBrokerage]);

  const handleOnboardingComplete = () => {
    setShowBrokerageSetup(false);
  };

  if (!showBrokerageSetup) return null;

  return (
    <BrokerageSetupModal
      isOpen={showBrokerageSetup}
      onClose={handleOnboardingComplete}
      isFirstSetup={true}
    />
  );
} 