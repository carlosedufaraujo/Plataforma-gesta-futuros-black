'use client';

import { useState } from 'react';

interface Brokerage {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  assessor: string;
  phone: string;
  email: string;
  milhoFees: number;
  boiFees: number;
  taxRate?: number;
  taxes: number;
  otherFees: number;
}

export default function BrokerageManagement() {
  const [brokerages, setBrokerages] = useState<Brokerage[]>([
    {
      id: '1',
      name: 'XP Investimentos',
      cnpj: '02.332.886/0001-04',
      address: 'Av. Brigadeiro Faria Lima, 3300 - São Paulo, SP',
      assessor: 'Roberto Silva',
      phone: '(11) 3003-3000',
      email: 'assessoria@xpi.com.br',
      milhoFees: 2.50,
      boiFees: 3.20,
      taxes: 0.35,
      otherFees: 15.80
    },
    {
      id: '2',
      name: 'Rico Investimentos',
      cnpj: '03.814.055/0001-74',
      address: 'Av. Paulista, 1450 - São Paulo, SP',
      assessor: 'Ana Paula Costa',
      phone: '(11) 2050-5000',
      email: 'suporte@rico.com.vc',
      milhoFees: 2.80,
      boiFees: 3.50,
      taxes: 0.28,
      otherFees: 16.20
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrokerage, setEditingBrokerage] = useState<Brokerage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    address: '',
    assessor: '',
    phone: '',
    email: '',
    milhoFees: '',
    boiFees: '',
    taxRate: '',
    taxes: '',
    otherFees: ''
  });

  const handleAddBrokerage = () => {
    // Disparar evento para abrir modal de corretora
    const event = new CustomEvent('openBrokerageRegistrationModal');
    window.dispatchEvent(event);
  };

  const handleEditBrokerage = (brokerage: Brokerage) => {
    setEditingBrokerage(brokerage);
    setFormData({
      name: brokerage.name,
      cnpj: brokerage.cnpj,
      address: brokerage.address,
      assessor: brokerage.assessor,
      phone: brokerage.phone,
      email: brokerage.email,
      milhoFees: brokerage.milhoFees.toString(),
      boiFees: brokerage.boiFees.toString(),
      taxRate: (brokerage.taxRate || 0).toString(),
      taxes: brokerage.taxes.toString(),
      otherFees: brokerage.otherFees.toString()
    });
    setIsModalOpen(true);
  };

  const handleDeleteBrokerage = (id: string) => {
    if (confirm('Deseja remover esta corretora?')) {
      setBrokerages(brokerages.filter(brokerage => brokerage.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const brokerageData = {
      ...formData,
      milhoFees: parseFloat(formData.milhoFees),
      boiFees: parseFloat(formData.boiFees),
      taxRate: parseFloat(formData.taxRate),
      taxes: parseFloat(formData.taxes),
      otherFees: parseFloat(formData.otherFees)
    };
    
    if (editingBrokerage) {
      // Editar corretora existente
      setBrokerages(brokerages.map(brokerage => 
        brokerage.id === editingBrokerage.id 
          ? { ...editingBrokerage, ...brokerageData }
          : brokerage
      ));
    } else {
      // Adicionar nova corretora
      const newBrokerage: Brokerage = {
        id: Date.now().toString(),
        ...brokerageData
      };
      setBrokerages([...brokerages, newBrokerage]);
    }
    
    setIsModalOpen(false);
    setEditingBrokerage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="card">
      <div className="settings-header">
        <div className="settings-header-main">
          <h2>Gerenciamento de Corretoras</h2>
          <p className="settings-subtitle">
            Configure corretoras e defina custos operacionais
          </p>
        </div>
        <div className="settings-actions">
          <button 
            className="btn btn-primary btn-header-action"
            onClick={handleAddBrokerage}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9,22 9,12 15,12 15,22"></polyline>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            Nova Corretora
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Assessor</th>
              <th>Contato</th>
              <th>Corretagem Milho</th>
              <th>Corretagem Boi</th>
              <th>Taxas (%)</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {brokerages.map(brokerage => (
              <tr key={brokerage.id}>
                <td><strong>{brokerage.name}</strong></td>
                <td>{brokerage.advisor}</td>
                <td>
                  <div style={{ fontSize: '12px' }}>
                    <div>{brokerage.phone}</div>
                    <div>{brokerage.email}</div>
                  </div>
                </td>
                <td>R$ {(brokerage.milhoFees || 0).toFixed(2)}</td>
                <td>R$ {(brokerage.boiFees || 0).toFixed(2)}</td>
                <td>{(brokerage.taxes || 0).toFixed(2)}%</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEditBrokerage(brokerage)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Editar
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteBrokerage(brokerage.id)}
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

      {/* Modal para adicionar/editar corretora */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h3>{editingBrokerage ? 'Editar Corretora' : 'Adicionar Corretora'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-section">
                  <h4>Informações Básicas</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nome da Corretora</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CNPJ</label>
                      <input
                        type="text"
                        className="form-control"
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Endereço Completo</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Assessor</label>
                      <input
                        type="text"
                        className="form-control"
                        name="advisor"
                        value={formData.advisor}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Telefone</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>Custos e Taxas</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Corretagem Milho (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="milhoFees"
                        value={formData.milhoFees}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Corretagem Boi (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        name="boiFees"
                        value={formData.boiFees}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Taxa de Margem (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control"
                        name="taxRate"
                        value={formData.taxRate}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Impostos e Taxas Adicionais</label>
                    <textarea
                      className="form-control"
                      name="taxes"
                      value={formData.taxes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Ex: IOF, IRPF, Taxa B3, Taxa de Custódia"
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingBrokerage ? 'Salvar Alterações' : 'Adicionar Corretora'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 