'use client';

interface MobileMenuToggleProps {
  onClick: () => void;
}

export default function MobileMenuToggle({ onClick }: MobileMenuToggleProps) {
  return (
    <button className="mobile-menu-toggle" onClick={onClick}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  );
} 