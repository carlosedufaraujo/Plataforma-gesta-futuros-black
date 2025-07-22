import React from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button 
      className="floating-action-button"
      onClick={onClick}
      title="Nova Posição Rápida"
      aria-label="Adicionar nova posição"
    >
      <div className="fab-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      
      <div className="fab-tooltip">
        <span className="tooltip-text">Nova Posição</span>
        <div className="tooltip-arrow"></div>
      </div>
    </button>
  );
};

export default FloatingActionButton; 