import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Configurar corretora para um usuário
router.post('/configure',
  [
    body('brokerageId').notEmpty().withMessage('ID da corretora é obrigatório'),
    body('apiKey').notEmpty().withMessage('API Key é obrigatória'),
    body('secretKey').notEmpty().withMessage('Secret Key é obrigatória'),
    body('environment').isIn(['sandbox', 'production']).withMessage('Ambiente deve ser sandbox ou production'),
    body('autoSync').isBoolean().withMessage('Auto sync deve ser boolean')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { brokerageId, apiKey, secretKey, environment, autoSync } = req.body;

    try {
      // Verificar se a corretora existe
      const brokerageQuery = 'SELECT * FROM brokerages WHERE id = $1';
      const brokerageResult = await pool.query(brokerageQuery, [brokerageId]);
      
      if (brokerageResult.rows.length === 0) {
        return res.status(404).json({ message: 'Corretora não encontrada' });
      }

      // Verificar se usuário tem acesso a esta corretora
      const accessQuery = 'SELECT * FROM user_brokerage_access WHERE user_id = $1 AND brokerage_id = $2';
      const accessResult = await pool.query(accessQuery, [userId, brokerageId]);
      
      if (accessResult.rows.length === 0) {
        return res.status(403).json({ message: 'Usuário não tem acesso a esta corretora' });
      }

      // Criptografar as chaves (em produção, usar biblioteca de criptografia)
      const encryptedApiKey = Buffer.from(apiKey).toString('base64');
      const encryptedSecretKey = Buffer.from(secretKey).toString('base64');

      // Inserir ou atualizar configuração
      const configQuery = `
        INSERT INTO user_brokerage_configs (user_id, brokerage_id, api_key, secret_key, environment, auto_sync, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
        ON CONFLICT (user_id, brokerage_id) 
        DO UPDATE SET 
          api_key = $3,
          secret_key = $4,
          environment = $5,
          auto_sync = $6,
          is_active = true,
          updated_at = NOW()
        RETURNING *
      `;

      const configResult = await pool.query(configQuery, [
        userId, brokerageId, encryptedApiKey, encryptedSecretKey, environment, autoSync
      ]);

      // Atualizar corretora selecionada do usuário
      const updateUserQuery = 'UPDATE users SET selected_brokerage_id = $1, updated_at = NOW() WHERE id = $2';
      await pool.query(updateUserQuery, [brokerageId, userId]);

      res.json({
        message: 'Configuração salva com sucesso',
        config: {
          id: configResult.rows[0].id,
          brokerageId,
          environment,
          autoSync,
          isActive: true
        }
      });

    } catch (error) {
      console.error('Erro ao configurar corretora:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  })
);

// Obter configurações do usuário
router.get('/configurations',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
      const query = `
        SELECT 
          ubc.*,
          b.name as brokerage_name,
          b.type as brokerage_type,
          b.website,
          b.fees
        FROM user_brokerage_configs ubc
        JOIN brokerages b ON ubc.brokerage_id = b.id
        WHERE ubc.user_id = $1 AND ubc.is_active = true
        ORDER BY ubc.updated_at DESC
      `;

      const result = await pool.query(query, [userId]);

      const configurations = result.rows.map(row => ({
        id: row.id,
        brokerageId: row.brokerage_id,
        brokerageName: row.brokerage_name,
        brokerageType: row.brokerage_type,
        website: row.website,
        fees: row.fees,
        environment: row.environment,
        autoSync: row.auto_sync,
        isActive: row.is_active,
        lastSync: row.last_sync,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json({ configurations });

    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  })
);

// Testar conexão com corretora
router.post('/test-connection',
  [
    body('brokerageId').notEmpty().withMessage('ID da corretora é obrigatório'),
    body('apiKey').notEmpty().withMessage('API Key é obrigatória'),
    body('secretKey').notEmpty().withMessage('Secret Key é obrigatória'),
    body('environment').isIn(['sandbox', 'production']).withMessage('Ambiente inválido')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { brokerageId, apiKey, secretKey, environment } = req.body;

    try {
      // Simular teste de conexão
      // Em produção, aqui faria a chamada real para a API da corretora
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Validações básicas
      if (apiKey.length < 10) {
        return res.status(400).json({ 
          success: false, 
          message: 'API Key deve ter pelo menos 10 caracteres' 
        });
      }

      if (secretKey.length < 10) {
        return res.status(400).json({ 
          success: false, 
          message: 'Secret Key deve ter pelo menos 10 caracteres' 
        });
      }

      // Simular sucesso
      res.json({
        success: true,
        message: 'Conexão estabelecida com sucesso',
        data: {
          brokerageId,
          environment,
          connectionTime: new Date().toISOString(),
          status: 'connected'
        }
      });

    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao testar conexão com a corretora' 
      });
    }
  })
);

// Sincronizar dados da corretora
router.post('/sync/:brokerageId',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { brokerageId } = req.params;

    try {
      // Verificar se usuário tem configuração ativa para esta corretora
      const configQuery = `
        SELECT * FROM user_brokerage_configs 
        WHERE user_id = $1 AND brokerage_id = $2 AND is_active = true
      `;
      const configResult = await pool.query(configQuery, [userId, brokerageId]);

      if (configResult.rows.length === 0) {
        return res.status(404).json({ message: 'Configuração não encontrada' });
      }

      // Simular sincronização
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Atualizar timestamp de última sincronização
      const updateQuery = `
        UPDATE user_brokerage_configs 
        SET last_sync = NOW(), updated_at = NOW()
        WHERE user_id = $1 AND brokerage_id = $2
      `;
      await pool.query(updateQuery, [userId, brokerageId]);

      res.json({
        message: 'Sincronização concluída com sucesso',
        lastSync: new Date().toISOString(),
        syncedData: {
          positions: 0, // Em produção, retornaria dados reais
          transactions: 0,
          balance: 0
        }
      });

    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
      res.status(500).json({ message: 'Erro ao sincronizar dados' });
    }
  })
);

// Desativar configuração de corretora
router.delete('/configure/:brokerageId',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { brokerageId } = req.params;

    try {
      const query = `
        UPDATE user_brokerage_configs 
        SET is_active = false, updated_at = NOW()
        WHERE user_id = $1 AND brokerage_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [userId, brokerageId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Configuração não encontrada' });
      }

      // Se era a corretora selecionada, remover seleção
      const updateUserQuery = `
        UPDATE users 
        SET selected_brokerage_id = NULL, updated_at = NOW()
        WHERE id = $1 AND selected_brokerage_id = $2
      `;
      await pool.query(updateUserQuery, [userId, brokerageId]);

      res.json({ message: 'Configuração desativada com sucesso' });

    } catch (error) {
      console.error('Erro ao desativar configuração:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  })
);

export default router; 