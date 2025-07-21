'use client';

import { useState, useEffect } from 'react';
import NewPositionModal from '@/components/Modals/NewPositionModal';
import NewOptionModal from '@/components/Modals/NewOptionModal';
import UserRegistrationModal from '@/components/Modals/UserRegistrationModal';
import BrokerageRegistrationModal from '@/components/Modals/BrokerageRegistrationModal';
import { useData } from '@/contexts/DataContext';

interface ModalState {
  newPosition: boolean;
  newOption: boolean;
  userRegistration: boolean;
  brokerageRegistration: boolean;
}

export default function ModalManager() {
  const { addPosition, addOption } = useData();
  const [modals, setModals] = useState<ModalState>({
    newPosition: false,
    newOption: false,
    userRegistration: false,
    brokerageRegistration: false
  });

  useEffect(() => {
    // Event listeners para todos os modais
    const handleOpenNewPosition = () => {
      setModals(prev => ({ ...prev, newPosition: true }));
    };

    const handleOpenNewOption = () => {
      setModals(prev => ({ ...prev, newOption: true }));
    };

    const handleOpenUserRegistration = () => {
      setModals(prev => ({ ...prev, userRegistration: true }));
    };

    const handleOpenBrokerageRegistration = () => {
      setModals(prev => ({ ...prev, brokerageRegistration: true }));
    };

    // Registrar todos os event listeners
    window.addEventListener('openNewPositionModal', handleOpenNewPosition);
    window.addEventListener('openNewOptionModal', handleOpenNewOption);
    window.addEventListener('openUserRegistrationModal', handleOpenUserRegistration);
    window.addEventListener('openBrokerageRegistrationModal', handleOpenBrokerageRegistration);

    // Cleanup
    return () => {
      window.removeEventListener('openNewPositionModal', handleOpenNewPosition);
      window.removeEventListener('openNewOptionModal', handleOpenNewOption);
      window.removeEventListener('openUserRegistrationModal', handleOpenUserRegistration);
      window.removeEventListener('openBrokerageRegistrationModal', handleOpenBrokerageRegistration);
    };
  }, []);

  const closeModal = (modalName: keyof ModalState) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  };

  // Handlers conectados com DataContext
  const handleNewPosition = (positionData: any) => {
    try {
      addPosition(positionData);
      closeModal('newPosition');
      
      // Feedback visual para o usuário
      const toast = document.createElement('div');
      toast.textContent = '✅ Nova posição criada com sucesso!';
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10002;
        background: var(--color-success); color: white; padding: 12px 20px;
        border-radius: 8px; font-weight: 500; animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao criar posição:', error);
      alert('Erro ao criar posição. Verifique os dados e tente novamente.');
    }
  };

  const handleNewOption = (optionData: any) => {
    try {
      addOption(optionData);
      closeModal('newOption');
      
      // Feedback visual para o usuário
      const toast = document.createElement('div');
      toast.textContent = '✅ Nova opção criada com sucesso!';
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10002;
        background: var(--color-success); color: white; padding: 12px 20px;
        border-radius: 8px; font-weight: 500; animation: slideIn 0.3s ease-out;
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao criar opção:', error);
      alert('Erro ao criar opção. Verifique os dados e tente novamente.');
    }
  };

  const handleUserRegistration = (userData: any) => {
    console.log('✅ Usuário cadastrado:', userData);
    closeModal('userRegistration');
    
    // Feedback visual para o usuário
    const toast = document.createElement('div');
    toast.textContent = '✅ Usuário cadastrado com sucesso!';
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10002;
      background: var(--color-success); color: white; padding: 12px 20px;
      border-radius: 8px; font-weight: 500; animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const handleBrokerageRegistration = (brokerageData: any) => {
    console.log('✅ Corretora cadastrada:', brokerageData);
    closeModal('brokerageRegistration');
    
    // Feedback visual para o usuário
    const toast = document.createElement('div');
    toast.textContent = '✅ Corretora cadastrada com sucesso!';
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10002;
      background: var(--color-success); color: white; padding: 12px 20px;
      border-radius: 8px; font-weight: 500; animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  return (
    <>
      {/* Modal Nova Posição - CONECTADO */}
      {modals.newPosition && (
        <div className="modal-portal">
          <NewPositionModal
            isOpen={modals.newPosition}
            onClose={() => closeModal('newPosition')}
            onSubmit={handleNewPosition}
          />
        </div>
      )}

      {/* Modal Nova Opção - CONECTADO */}
      {modals.newOption && (
        <div className="modal-portal">
          <NewOptionModal
            isOpen={modals.newOption}
            onClose={() => closeModal('newOption')}
            onSubmit={handleNewOption}
          />
        </div>
      )}

      {/* Modal Cadastro de Usuário */}
      {modals.userRegistration && (
        <div className="modal-portal">
          <UserRegistrationModal
            isOpen={modals.userRegistration}
            onClose={() => closeModal('userRegistration')}
            onSubmit={handleUserRegistration}
          />
        </div>
      )}

      {/* Modal Cadastro de Corretora */}
      {modals.brokerageRegistration && (
        <div className="modal-portal">
          <BrokerageRegistrationModal
            isOpen={modals.brokerageRegistration}
            onClose={() => closeModal('brokerageRegistration')}
            onSubmit={handleBrokerageRegistration}
          />
        </div>
      )}
    </>
  );
} 