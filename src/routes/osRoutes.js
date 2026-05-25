import express from 'express';
import { verificarAcesso } from '../middlewares/authMiddleware.js';
import {
    listarOrdensServico, obterDetalhesOrdemServico, criarOrdemServico, atualizarOrdemServico, deletarOrdemServicoLogico,
    criarServicoReparo, atualizarServicoReparo, deletarServicoReparo,
    criarMaterialAquisicao, atualizarMaterialAquisicao, deletarMaterialAquisicao,
    obterAlertasCoreReturn
} from '../controllers/osController.js';

const router = express.Router();

// ==========================================
// ALERTAS DE LOGÍSTICA REVERSA (CORE RETURN)
// ==========================================
router.get('/alertas-core-return', verificarAcesso(), obterAlertasCoreReturn);

// ==========================================
// ORDENS DE SERVIÇO (Leitura geral, escrita geral, deativação Admin/Fiscal)
// ==========================================
router.get('/', verificarAcesso(), listarOrdensServico);
router.get('/:id', verificarAcesso(), obterDetalhesOrdemServico);
router.post('/', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO', 'OPERADOR_MANUTENCAO']), criarOrdemServico);
router.put('/:id', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO', 'OPERADOR_MANUTENCAO']), atualizarOrdemServico);
router.delete('/:id', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO']), deletarOrdemServicoLogico);

// ==========================================
// REPAROS / SERVIÇOS (Leitura geral, escrita geral, deativação Admin/Fiscal/Operador)
// ==========================================
router.post('/reparos', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO', 'OPERADOR_MANUTENCAO']), criarServicoReparo);
router.put('/reparos/:id', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO', 'OPERADOR_MANUTENCAO']), atualizarServicoReparo);
router.delete('/reparos/:id', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO', 'OPERADOR_MANUTENCAO']), deletarServicoReparo);

// ==========================================
// MATERIAIS / AQUISIÇÃO (Leitura geral, escrita geral, deativação Admin/Fiscal/Operador)
// ==========================================
router.post('/materiais', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO', 'OPERADOR_MANUTENCAO']), criarMaterialAquisicao);
router.put('/materiais/:id', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO', 'OPERADOR_MANUTENCAO']), atualizarMaterialAquisicao);
router.delete('/materiais/:id', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO', 'OPERADOR_MANUTENCAO']), deletarMaterialAquisicao);

export default router;
