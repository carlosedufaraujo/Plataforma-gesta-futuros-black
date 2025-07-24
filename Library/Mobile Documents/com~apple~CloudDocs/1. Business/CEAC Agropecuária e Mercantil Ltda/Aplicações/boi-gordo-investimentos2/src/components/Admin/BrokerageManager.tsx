'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Building, Phone, Mail } from 'lucide-react';
import { useHybridData } from '@/contexts/HybridDataContext';
import { Brokerage } from '@/types';

export default function BrokerageManager() {
  const { brokerages, addBrokerage, updateBrokerage, deleteBrokerage, selectedBrokerage, setSelectedBrokerage } = useHybridData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrokerage, setEditingBrokerage] = useState<Brokerage | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    assessor: '',
    telefone: '',
    email: '',
    corretagemMilho: 0,
    corretagemBoi: 0,
    taxas: 0,
    impostos: 0,
    isActive: true,
    authorizedUserIds: [] as string[]
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      cnpj: '',
      endereco: '',
      assessor: '',
      telefone: '',
      email: '',
      corretagemMilho: 0,
      corretagemBoi: 0,
      taxas: 0,
      impostos: 0,
      isActive: true,
      authorizedUserIds: []
    });
    setEditingBrokerage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBrokerage) {
      updateBrokerage(editingBrokerage.id, formData);
    } else {
      addBrokerage(formData);
    }
    
    resetForm();
    setIsModalOpen(false);
  };

  const handleEdit = (brokerage: Brokerage) => {
    setFormData({
      nome: brokerage.nome,
      cnpj: brokerage.cnpj,
      endereco: brokerage.endereco,
      assessor: brokerage.assessor,
      telefone: brokerage.telefone,
      email: brokerage.email,
      corretagemMilho: brokerage.corretagemMilho,
      corretagemBoi: brokerage.corretagemBoi,
      taxas: brokerage.taxas,
      impostos: brokerage.impostos,
      isActive: brokerage.isActive,
      authorizedUserIds: brokerage.authorizedUserIds
    });
    setEditingBrokerage(brokerage);
    setIsModalOpen(true);
  };

  const handleDelete = (brokerage: Brokerage) => {
    if (confirm(`Tem certeza que deseja excluir a corretora ${brokerage.nome}?`)) {
      deleteBrokerage(brokerage.id);
    }
  };

  const handleSetSelected = (brokerage: Brokerage) => {
    setSelectedBrokerage(brokerage);
  };

  return (
    <div className="brokerage-manager">
      <div className="card">
        <div className="card-header">
          <h2>Gerenciar Corretoras</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            Nova Corretora
          </button>
        </div>

        {/* Corretora Selecionada */}
        {selectedBrokerage && (
          <div className="selected-brokerage">
            <h3>Corretora Selecionada</h3>
            <div className="brokerage-info">
              <strong>{selectedBrokerage.nome}</strong>
              <span>{selectedBrokerage.assessor}</span>
              <span className={`status ${selectedBrokerage.isActive ? 'active' : 'inactive'}`}>
                {selectedBrokerage.isActive ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>
        )}

        {/* Lista de Corretoras */}
        <div className="brokerages-list">
          <h3>Corretoras Cadastradas ({brokerages.length})</h3>
          
          {brokerages.length > 0 ? (
            <div className="brokerages-grid">
              {brokerages.map(brokerage => (
                <div key={brokerage.id} className="brokerage-card">
                  <div className="brokerage-header">
                    <div className="brokerage-name">
                      <strong>{brokerage.nome}</strong>
                      {selectedBrokerage?.id === brokerage.id && (
                        <span className="selected-badge">Selecionada</span>
                      )}
                    </div>
                    <span className={`status ${brokerage.isActive ? 'active' : 'inactive'}`}>
                      {brokerage.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  
                  <div className="brokerage-details">
                    <div className="detail-item">
                      <span className="label">CNPJ:</span>
                      <span className="value">{brokerage.cnpj}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Assessor:</span>
                      <span className="value">{brokerage.assessor}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Email:</span>
                      <span className="value">{brokerage.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Corretagem Boi:</span>
                      <span className="value">R$ {brokerage.corretagemBoi.toFixed(2)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Corretagem Milho:</span>
                      <span className="value">R$ {brokerage.corretagemMilho.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="brokerage-actions">
                    {selectedBrokerage?.id !== brokerage.id && (
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => handleSetSelected(brokerage)}
                      >
                        Selecionar
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEdit(brokerage)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(brokerage)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <p>Nenhuma corretora cadastrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h2>{editingBrokerage ? 'Editar Corretora' : 'Nova Corretora'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="nome">Nome da Corretora *</label>
                  <input
                    type="text"
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cnpj">CNPJ *</label>
                  <input
                    type="text"
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                    required
                    className="form-input"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="assessor">Assessor *</label>
                  <input
                    type="text"
                    id="assessor"
                    value={formData.assessor}
                    onChange={(e) => setFormData(prev => ({ ...prev, assessor: e.target.value }))}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="telefone">Telefone</label>
                  <input
                    type="tel"
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    className="form-input"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="endereco">Endereço</label>
                  <input
                    type="text"
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="corretagemBoi">Corretagem Boi Gordo (R$)</label>
                  <input
                    type="number"
                    id="corretagemBoi"
                    value={formData.corretagemBoi}
                    onChange={(e) => setFormData(prev => ({ ...prev, corretagemBoi: parseFloat(e.target.value) || 0 }))}
                    className="form-input"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="corretagemMilho">Corretagem Milho (R$)</label>
                  <input
                    type="number"
                    id="corretagemMilho"
                    value={formData.corretagemMilho}
                    onChange={(e) => setFormData(prev => ({ ...prev, corretagemMilho: parseFloat(e.target.value) || 0 }))}
                    className="form-input"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="taxas">Taxas Adicionais (R$)</label>
                  <input
                    type="number"
                    id="taxas"
                    value={formData.taxas}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxas: parseFloat(e.target.value) || 0 }))}
                    className="form-input"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="impostos">Impostos (%)</label>
                  <input
                    type="number"
                    id="impostos"
                    value={formData.impostos}
                    onChange={(e) => setFormData(prev => ({ ...prev, impostos: parseFloat(e.target.value) || 0 }))}
                    className="form-input"
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Corretora Ativa
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBrokerage ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 