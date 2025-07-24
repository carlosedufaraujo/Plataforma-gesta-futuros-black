import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { query } from '../services/database';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

// GET /api/brokerages - Listar corretoras do usuário
router.get('/', asyncHandler(async (req: any, res: any) => {
  const { userId } = req;

  const result = await query(`
    SELECT b.*, uba.role, uba.granted_at
    FROM brokerages b
    JOIN user_brokerage_access uba ON b.id = uba.brokerage_id
    WHERE uba.user_id = $1 AND uba.is_active = true AND b.is_active = true
    ORDER BY b.nome
  `, [userId]);

  const response: ApiResponse = {
    success: true,
    data: result.rows
  };

  res.json(response);
}));

// GET /api/brokerages/:id - Obter corretora específica
router.get('/:id', [
  param('id').isUUID().withMessage('ID da corretora inválido')
], asyncHandler(async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: errors.array()
    } as ApiResponse);
  }

  const { userId } = req;
  const { id } = req.params;

  // Verificar se usuário tem acesso à corretora
  const result = await query(`
    SELECT b.*, uba.role
    FROM brokerages b
    JOIN user_brokerage_access uba ON b.id = uba.brokerage_id
    WHERE b.id = $1 AND uba.user_id = $2 AND uba.is_active = true
  `, [id, userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Corretora não encontrada ou sem acesso'
    } as ApiResponse);
  }

  const response: ApiResponse = {
    success: true,
    data: result.rows[0]
  };

  res.json(response);
}));

// POST /api/brokerages - Criar nova corretora
router.post('/', [
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('cnpj').matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/).withMessage('CNPJ deve ter formato XX.XXX.XXX/XXXX-XX'),
  body('endereco').optional().isString(),
  body('assessor').optional().isString(),
  body('telefone').optional().isString(),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('corretagemMilho').optional().isFloat({ min: 0 }).withMessage('Corretagem milho deve ser positiva'),
  body('corretagemBoi').optional().isFloat({ min: 0 }).withMessage('Corretagem boi deve ser positiva'),
  body('taxas').optional().isFloat({ min: 0 }).withMessage('Taxas devem ser positivas'),
  body('impostos').optional().isFloat({ min: 0 }).withMessage('Impostos devem ser positivos')
], asyncHandler(async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: errors.array()
    } as ApiResponse);
  }

  const { userId } = req;
  const {
    nome,
    cnpj,
    endereco,
    assessor,
    telefone,
    email,
    corretagemMilho,
    corretagemBoi,
    taxas,
    impostos
  } = req.body;

  try {
    // Verificar se CNPJ já existe
    const existingBrokerage = await query('SELECT id FROM brokerages WHERE cnpj = $1', [cnpj]);
    if (existingBrokerage.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'CNPJ já cadastrado'
      } as ApiResponse);
    }

    // Inserir nova corretora
    const insertResult = await query(`
      INSERT INTO brokerages (
        nome, cnpj, endereco, assessor, telefone, email,
        corretagem_milho, corretagem_boi, taxas, impostos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      nome, cnpj, endereco, assessor, telefone, email,
      corretagemMilho || 0, corretagemBoi || 0, taxas || 0, impostos || 0
    ]);

    const newBrokerage = insertResult.rows[0];

    // Conceder acesso de admin ao usuário criador
    await query(`
      INSERT INTO user_brokerage_access (user_id, brokerage_id, role, granted_by)
      VALUES ($1, $2, 'admin', $1)
    `, [userId, newBrokerage.id]);

    const response: ApiResponse = {
      success: true,
      data: newBrokerage,
      message: 'Corretora cadastrada com sucesso!'
    };

    res.status(201).json(response);
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        error: 'CNPJ já cadastrado'
      } as ApiResponse);
    }
    throw error;
  }
}));

// PUT /api/brokerages/:id - Atualizar corretora
router.put('/:id', [
  param('id').isUUID().withMessage('ID da corretora inválido'),
  body('nome').optional().notEmpty().withMessage('Nome não pode estar vazio'),
  body('cnpj').optional().matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/).withMessage('CNPJ deve ter formato XX.XXX.XXX/XXXX-XX'),
  body('endereco').optional().isString(),
  body('assessor').optional().isString(),
  body('telefone').optional().isString(),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('corretagemMilho').optional().isFloat({ min: 0 }).withMessage('Corretagem milho deve ser positiva'),
  body('corretagemBoi').optional().isFloat({ min: 0 }).withMessage('Corretagem boi deve ser positiva'),
  body('taxas').optional().isFloat({ min: 0 }).withMessage('Taxas devem ser positivas'),
  body('impostos').optional().isFloat({ min: 0 }).withMessage('Impostos devem ser positivos')
], asyncHandler(async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: errors.array()
    } as ApiResponse);
  }

  const { userId } = req;
  const { id } = req.params;

  // Verificar se usuário tem permissão de admin na corretora
  const accessResult = await query(`
    SELECT role FROM user_brokerage_access 
    WHERE user_id = $1 AND brokerage_id = $2 AND is_active = true
  `, [userId, id]);

  if (accessResult.rows.length === 0 || accessResult.rows[0].role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Sem permissão para editar esta corretora'
    } as ApiResponse);
  }

  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  Object.entries(req.body).forEach(([key, value]) => {
    if (value !== undefined) {
      const dbField = key === 'corretagemMilho' ? 'corretagem_milho' :
                     key === 'corretagemBoi' ? 'corretagem_boi' : key;
      updateFields.push(`${dbField} = $${paramIndex}`);
      updateValues.push(value);
      paramIndex++;
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Nenhum campo para atualizar'
    } as ApiResponse);
  }

  updateValues.push(id);
  const updateResult = await query(`
    UPDATE brokerages 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, updateValues);

  const response: ApiResponse = {
    success: true,
    data: updateResult.rows[0],
    message: 'Corretora atualizada com sucesso!'
  };

  res.json(response);
}));

// POST /api/brokerages/:id/users - Adicionar usuário à corretora
router.post('/:id/users', [
  param('id').isUUID().withMessage('ID da corretora inválido'),
  body('userId').isUUID().withMessage('ID do usuário inválido'),
  body('role').isIn(['admin', 'trader', 'viewer']).withMessage('Role deve ser admin, trader ou viewer')
], asyncHandler(async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: errors.array()
    } as ApiResponse);
  }

  const { userId: currentUserId } = req;
  const { id: brokerageId } = req.params;
  const { userId: targetUserId, role } = req.body;

  // Verificar se usuário atual tem permissão de admin
  const accessResult = await query(`
    SELECT role FROM user_brokerage_access 
    WHERE user_id = $1 AND brokerage_id = $2 AND is_active = true
  `, [currentUserId, brokerageId]);

  if (accessResult.rows.length === 0 || accessResult.rows[0].role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Sem permissão para gerenciar usuários desta corretora'
    } as ApiResponse);
  }

  // Verificar se usuário alvo existe
  const userExists = await query('SELECT id FROM users WHERE id = $1', [targetUserId]);
  if (userExists.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Usuário não encontrado'
    } as ApiResponse);
  }

  // Inserir ou atualizar acesso
  const upsertResult = await query(`
    INSERT INTO user_brokerage_access (user_id, brokerage_id, role, granted_by, is_active)
    VALUES ($1, $2, $3, $4, true)
    ON CONFLICT (user_id, brokerage_id)
    DO UPDATE SET role = $3, granted_by = $4, is_active = true, updated_at = NOW()
    RETURNING *
  `, [targetUserId, brokerageId, role, currentUserId]);

  const response: ApiResponse = {
    success: true,
    data: upsertResult.rows[0],
    message: 'Acesso do usuário atualizado com sucesso!'
  };

  res.json(response);
}));

// DELETE /api/brokerages/:id/users/:userId - Remover usuário da corretora
router.delete('/:id/users/:userId', [
  param('id').isUUID().withMessage('ID da corretora inválido'),
  param('userId').isUUID().withMessage('ID do usuário inválido')
], asyncHandler(async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: errors.array()
    } as ApiResponse);
  }

  const { userId: currentUserId } = req;
  const { id: brokerageId, userId: targetUserId } = req.params;

  // Verificar permissão de admin
  const accessResult = await query(`
    SELECT role FROM user_brokerage_access 
    WHERE user_id = $1 AND brokerage_id = $2 AND is_active = true
  `, [currentUserId, brokerageId]);

  if (accessResult.rows.length === 0 || accessResult.rows[0].role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Sem permissão para gerenciar usuários desta corretora'
    } as ApiResponse);
  }

  // Não permitir que admin remova a si mesmo
  if (currentUserId === targetUserId) {
    return res.status(400).json({
      success: false,
      error: 'Não é possível remover seu próprio acesso'
    } as ApiResponse);
  }

  await query(`
    UPDATE user_brokerage_access 
    SET is_active = false 
    WHERE user_id = $1 AND brokerage_id = $2
  `, [targetUserId, brokerageId]);

  const response: ApiResponse = {
    success: true,
    message: 'Acesso do usuário removido com sucesso!'
  };

  res.json(response);
}));

// GET /api/brokerages/:id/users - Listar usuários da corretora
router.get('/:id/users', [
  param('id').isUUID().withMessage('ID da corretora inválido')
], asyncHandler(async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: errors.array()
    } as ApiResponse);
  }

  const { userId } = req;
  const { id: brokerageId } = req.params;

  // Verificar se usuário tem acesso à corretora
  const hasAccess = await query(`
    SELECT 1 FROM user_brokerage_access 
    WHERE user_id = $1 AND brokerage_id = $2 AND is_active = true
  `, [userId, brokerageId]);

  if (hasAccess.rows.length === 0) {
    return res.status(403).json({
      success: false,
      error: 'Sem acesso a esta corretora'
    } as ApiResponse);
  }

  const result = await query(`
    SELECT u.id, u.name, u.email, uba.role, uba.granted_at, uba.granted_by
    FROM users u
    JOIN user_brokerage_access uba ON u.id = uba.user_id
    WHERE uba.brokerage_id = $1 AND uba.is_active = true
    ORDER BY uba.role, u.name
  `, [brokerageId]);

  const response: ApiResponse = {
    success: true,
    data: result.rows
  };

  res.json(response);
}));

export default router; 