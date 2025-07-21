'use client';

import { useState, useCallback, useEffect } from 'react';

export interface User {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  endereco: string;
}

export interface UserPermission {
  userId: string;
  brokerageId: string;
  role: 'admin' | 'trader' | 'viewer';
  createdAt: string;
  createdBy: string;
}

export interface BrokerageAccess {
  brokerageId: string;
  brokerageName: string;
  users: Array<{
    user: User;
    permission: UserPermission;
  }>;
}

// Dados mockados - em produção viria do backend
const mockUsers: User[] = [
  {
    id: '1',
    nome: 'Carlos Eduardo Almeida',
    email: 'carlos@ceacagro.com.br',
    cpf: '123.456.789-00',
    telefone: '(11) 99999-9999',
    endereco: 'Rua das Palmeiras, 123 - São Paulo, SP'
  },
  {
    id: '2',
    nome: 'Maria Silva Santos',
    email: 'maria@email.com',
    cpf: '987.654.321-00',
    telefone: '(21) 88888-8888',
    endereco: 'Av. Brasil, 456 - Rio de Janeiro, RJ'
  },
  {
    id: '3',
    nome: 'João Pedro Oliveira',
    email: 'joao@empresa.com.br',
    cpf: '456.789.123-00',
    telefone: '(11) 77777-7777',
    endereco: 'Rua Augusta, 789 - São Paulo, SP'
  },
  {
    id: '4',
    nome: 'Ana Carolina Costa',
    email: 'ana@trading.com.br',
    cpf: '321.654.987-00',
    telefone: '(21) 66666-6666',
    endereco: 'Av. Copacabana, 321 - Rio de Janeiro, RJ'
  }
];

let mockPermissions: UserPermission[] = [
  {
    userId: '1',
    brokerageId: '1',
    role: 'admin',
    createdAt: new Date().toISOString(),
    createdBy: '1'
  },
  {
    userId: '1',
    brokerageId: '2', 
    role: 'admin',
    createdAt: new Date().toISOString(),
    createdBy: '1'
  }
];

export function useAccessControl() {
  const [users] = useState<User[]>(mockUsers);
  const [permissions, setPermissions] = useState<UserPermission[]>(mockPermissions);
  const [currentUser] = useState<User>(mockUsers[0]); // Simula usuário atual
  
  // Buscar usuários que têm acesso a uma corretora específica
  const getBrokerageUsers = useCallback((brokerageId: string): Array<{ user: User; permission: UserPermission }> => {
    const brokeragePermissions = permissions.filter(p => p.brokerageId === brokerageId);
    
    return brokeragePermissions.map(permission => {
      const user = users.find(u => u.id === permission.userId);
      return {
        user: user || mockUsers[0],
        permission
      };
    }).filter(item => item.user);
  }, [permissions, users]);

  // Buscar corretoras que um usuário tem acesso
  const getUserBrokerages = useCallback((userId: string): string[] => {
    return permissions
      .filter(p => p.userId === userId)
      .map(p => p.brokerageId);
  }, [permissions]);

  // Adicionar usuário a uma corretora
  const addUserToBrokerage = useCallback((
    userId: string, 
    brokerageId: string, 
    role: 'admin' | 'trader' | 'viewer' = 'viewer'
  ) => {
    // Verificar se já existe
    const existingPermission = permissions.find(
      p => p.userId === userId && p.brokerageId === brokerageId
    );
    
    if (existingPermission) {
      // Atualizar role se diferente
      if (existingPermission.role !== role) {
        setPermissions(prev => 
          prev.map(p => 
            p.userId === userId && p.brokerageId === brokerageId
              ? { ...p, role }
              : p
          )
        );
      }
      return;
    }

    // Adicionar nova permissão
    const newPermission: UserPermission = {
      userId,
      brokerageId,
      role,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id
    };

    setPermissions(prev => [...prev, newPermission]);
  }, [permissions, currentUser.id]);

  // Remover usuário de uma corretora
  const removeUserFromBrokerage = useCallback((userId: string, brokerageId: string) => {
    setPermissions(prev => 
      prev.filter(p => !(p.userId === userId && p.brokerageId === brokerageId))
    );
  }, []);

  // Alterar role de um usuário em uma corretora
  const changeUserRole = useCallback((
    userId: string, 
    brokerageId: string, 
    newRole: 'admin' | 'trader' | 'viewer'
  ) => {
    setPermissions(prev => 
      prev.map(p => 
        p.userId === userId && p.brokerageId === brokerageId
          ? { ...p, role: newRole }
          : p
      )
    );
  }, []);

  // Verificar se usuário tem acesso a uma corretora
  const hasAccess = useCallback((userId: string, brokerageId: string): boolean => {
    return permissions.some(p => p.userId === userId && p.brokerageId === brokerageId);
  }, [permissions]);

  // Obter role de um usuário em uma corretora
  const getUserRole = useCallback((userId: string, brokerageId: string): string | null => {
    const permission = permissions.find(p => p.userId === userId && p.brokerageId === brokerageId);
    return permission ? permission.role : null;
  }, [permissions]);

  // Buscar usuários disponíveis (que não têm acesso a uma corretora específica)
  const getAvailableUsers = useCallback((brokerageId: string): User[] => {
    const usersWithAccess = permissions
      .filter(p => p.brokerageId === brokerageId)
      .map(p => p.userId);
    
    return users.filter(u => !usersWithAccess.includes(u.id));
  }, [permissions, users]);

  return {
    users,
    permissions,
    currentUser,
    getBrokerageUsers,
    getUserBrokerages,
    addUserToBrokerage,
    removeUserFromBrokerage,
    changeUserRole,
    hasAccess,
    getUserRole,
    getAvailableUsers
  };
} 