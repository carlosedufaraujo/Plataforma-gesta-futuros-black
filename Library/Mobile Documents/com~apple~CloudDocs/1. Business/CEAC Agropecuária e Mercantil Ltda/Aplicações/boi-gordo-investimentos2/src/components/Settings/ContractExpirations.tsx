'use client';

import { useState } from 'react';
import { ContractExpiration, MONTH_CODE_MAP } from '@/types';
import { useExpirations } from '@/hooks/useExpirations';

export default function ContractExpirations() {
  const { expirations, updateExpirations } = useExpirations();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExpiration, setEditingExpiration] = useState<ContractExpiration | null>(null);
  const [newExpiration, setNewExpiration] = useState({
    code: 'F',
    month: 'Janeiro',
    year: '2025',
    monthNumber: 1
  });
  const [editForm, setEditForm] = useState({
    code: 'F',
    month: 'Janeiro',
    year: '2025',
    monthNumber: 1
  });

  const handleAdd = () => {
    // Verificar se já existe um vencimento para esse mês/ano
    const exists = expirations.some(exp => 
      exp.monthNumber === newExpiration.monthNumber && exp.year === newExpiration.year
    );

    if (exists) {
      alert(`Já existe um vencimento para ${newExpiration.month}/${newExpiration.year}.`);
      return;
    }

    const newItem: ContractExpiration = {
      id: Date.now().toString(),
      code: newExpiration.code,
      month: newExpiration.month,
      year: newExpiration.year,
      monthNumber: newExpiration.monthNumber,
      isActive: true
    };

    updateExpirations([...expirations, newItem]);
    setNewExpiration({ code: 'F', month: 'Janeiro', year: '2025', monthNumber: 1 });
    setIsAdding(false);
  };

  const handleToggle = (id: string) => {
    updateExpirations(expirations.map(exp => 
      exp.id === id ? { ...exp, isActive: !exp.isActive } : exp
    ));
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja remover este vencimento?')) {
      updateExpirations(expirations.filter(exp => exp.id !== id));
    }
  };

  const handleEdit = (expiration: ContractExpiration) => {
    setEditingExpiration(expiration);
    setEditForm({
      code: expiration.code,
      month: expiration.month,
      year: expiration.year,
      monthNumber: expiration.monthNumber
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editingExpiration) return;

    // Verificar se já existe outro vencimento para esse mês/ano
    const exists = expirations.some(exp => 
      exp.id !== editingExpiration.id &&
      exp.monthNumber === editForm.monthNumber && 
      exp.year === editForm.year
    );

    if (exists) {
      alert(`Já existe um vencimento para ${editForm.month}/${editForm.year}.`);
      return;
    }

    updateExpirations(expirations.map(exp => 
      exp.id === editingExpiration.id 
        ? { 
            ...exp, 
            code: editForm.code,
            month: editForm.month,
            year: editForm.year,
            monthNumber: editForm.monthNumber
          }
        : exp
    ));

    setIsEditing(false);
    setEditingExpiration(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingExpiration(null);
    setEditForm({ code: 'F', month: 'Janeiro', year: '2025', monthNumber: 1 });
  };

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  return (
    <div className="card">
      <div className="settings-header">
        <div className="settings-header-main">
          <h2>Vencimentos de Contratos</h2>
          <p className="settings-subtitle">Gerenciar códigos de vencimento ativos para trading</p>
        </div>
        <div className="settings-actions">
          <button 
            className="btn btn-primary btn-header-action"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Adicionar Vencimento
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Novo Vencimento</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setIsAdding(false);
                  setNewExpiration({ code: 'F', month: 'Janeiro', year: '2025', monthNumber: 1 });
                }}
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required">Mês</label>
                  <select 
                    className="form-select"
                    value={newExpiration.monthNumber}
                    onChange={(e) => {
                      const monthNum = parseInt(e.target.value);
                      const monthObj = months.find(m => m.value === monthNum);
                      const autoCode = MONTH_CODE_MAP[monthNum as keyof typeof MONTH_CODE_MAP];
                      setNewExpiration({ 
                        ...newExpiration, 
                        monthNumber: monthNum,
                        month: monthObj?.label || '',
                        code: autoCode
                      });
                    }}
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Código Automático</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={newExpiration.code}
                    readOnly
                    style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label required">Ano</label>
                <select 
                  className="form-select"
                  value={newExpiration.year}
                  onChange={(e) => setNewExpiration({ ...newExpiration, year: e.target.value })}
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsAdding(false);
                    setNewExpiration({ code: 'F', month: 'Janeiro', year: '2025', monthNumber: 1 });
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAdd}
                >
                  Salvar Vencimento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'center', width: '80px' }}>Código</th>
              <th style={{ textAlign: 'left', width: '150px' }}>Mês</th>
              <th style={{ textAlign: 'center', width: '80px' }}>Ano</th>
              <th style={{ textAlign: 'center', width: '120px' }}>Status</th>
              <th style={{ textAlign: 'center', width: '200px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {expirations.map(exp => (
              <tr key={exp.id}>
                <td style={{ textAlign: 'center' }}><strong>{exp.code}</strong></td>
                <td style={{ textAlign: 'left' }}>{exp.month}</td>
                <td style={{ textAlign: 'center' }}>{exp.year}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`badge ${exp.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {exp.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEdit(exp)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Editar
                    </button>
                    <button 
                      className={`btn btn-sm ${exp.isActive ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => handleToggle(exp.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {exp.isActive ? (
                          <>
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="m9 12 2 2 4-4"></path>
                          </>
                        ) : (
                          <>
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                          </>
                        )}
                      </svg>
                      {exp.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(exp.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                      </svg>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para editar vencimento */}
      {isEditing && editingExpiration && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Editar Vencimento</h3>
              <button className="modal-close" onClick={handleCancelEdit}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Mês</label>
                  <select 
                    className="form-control"
                    value={editForm.monthNumber}
                    onChange={(e) => {
                      const monthNum = parseInt(e.target.value);
                      const monthObj = months.find(m => m.value === monthNum);
                      const autoCode = MONTH_CODE_MAP[monthNum as keyof typeof MONTH_CODE_MAP];
                      setEditForm({ 
                        ...editForm, 
                        monthNumber: monthNum,
                        month: monthObj?.label || '',
                        code: autoCode
                      });
                    }}
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Código Automático</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={editForm.code}
                    readOnly
                    style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ano</label>
                  <select 
                    className="form-control"
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 