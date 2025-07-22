'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import BrokerageSetupModal from '@/components/Modals/BrokerageSetupModal';

export default function OnboardingCheck() {
  const { currentSession } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Verificar se usuário logado não tem corretora configurada
    if (currentSession.user && !currentSession.selectedBrokerage) {
      setShowOnboarding(true);
    }
  }, [currentSession.user, currentSession.selectedBrokerage]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (!showOnboarding) return null;

  return (
    <BrokerageSetupModal
      isOpen={showOnboarding}
      onClose={handleOnboardingComplete}
      isFirstSetup={true}
    />
  );
} 