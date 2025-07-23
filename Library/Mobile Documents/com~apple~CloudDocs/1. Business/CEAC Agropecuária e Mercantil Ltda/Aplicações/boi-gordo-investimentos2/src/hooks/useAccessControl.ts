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

export function useAccessControl() {
  // Estados vazios - dados virão do backend ou localStorage
  const [users] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [currentUser] = useState<User | null>(null);
  
  // Buscar usuários que têm acesso a uma corretora específica
  const getBrokerageUsers = useCallback((brokerageId: string): Array<{ user: User; permission: UserPermission }> => {
    const brokeragePermissions = permissions.filter(p => p.brokerageId === brokerageId);
    
    return brokeragePermissions.map(permission => {
      const user = users.find(u => u.id === permission.userId);
      return {
        user: user,
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
      createdBy: currentUser?.id || 'unknown' // Assuming currentUser is not null
    };

    setPermissions(prev => [...prev, newPermission]);
  }, [permissions, currentUser]);

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