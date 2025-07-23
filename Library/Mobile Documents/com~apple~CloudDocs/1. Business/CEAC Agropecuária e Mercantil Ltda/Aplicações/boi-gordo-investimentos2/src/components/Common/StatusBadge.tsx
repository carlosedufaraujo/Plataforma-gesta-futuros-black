'use client';

import { PositionStatus } from '@/types';

interface StatusBadgeProps {
  status: PositionStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusConfig = (status: PositionStatus) => {
    switch (status) {
      case 'OPEN':
        return {
          label: 'Aberta',
          className: 'status-open',
          icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
          )
        };
      case 'CLOSED':
        return {
          label: 'Fechada',
          className: 'status-closed',
          icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          )
        };
      case 'PARTIAL':
        return {
          label: 'Parcial',
          className: 'status-partial',
          icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6"></path>
            </svg>
          )
        };
      case 'NETTED':
        return {
          label: 'Netada',
          className: 'status-netted',
          icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
          )
        };
      case 'CONSOLIDATED':
        return {
          label: 'Consolidada',
          className: 'status-consolidated',
          icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          )
        };
      default:
        return {
          label: 'Desconhecido',
          className: 'status-unknown',
          icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"></path>
            </svg>
          )
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClass = `status-badge-${size}`;

  return (
    <span className={`status-badge ${config.className} ${sizeClass}`}>
      {config.icon}
      <span className="status-label">{config.label}</span>
    </span>
  );
} 