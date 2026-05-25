import express from 'express';
import { verificarAcesso } from '../middlewares/authMiddleware.js';
import {
    listarEmpresas, criarEmpresa, atualizarEmpresa, deletarEmpresa,
    listarAeronaves, criarAeronave, atualizarAeronave, deletarAeronave,
    listarContratos, criarContrato, atualizarContrato, deletarContratoLogico,
    listarAdesoes, criarAdesao, atualizarAdesao, deletarAdesaoLogica
} from '../controllers/contratoController.js';

const router = express.Router();

// ==========================================
// EMPRESAS (ADMIN e FISCAL_CONTRATO alteram, apenas ADMIN deleta)
// ==========================================
router.get('/empresas', verificarAcesso(), listarEmpresas);
router.post('/empresas', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO']), criarEmpresa);
router.put('/empresas/:id', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO']), atualizarEmpresa);
router.delete('/empresas/:id', verificarAcesso(['ADMIN']), deletarEmpresa);

// ==========================================
// AERONAVES (ADMIN e FISCAL_CONTRATO alteram, apenas ADMIN deleta)
// ==========================================
router.get('/aeronaves', verificarAcesso(), listarAeronaves);
router.post('/aeronaves', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO']), criarAeronave);
router.put('/aeronaves/:id', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO']), atualizarAeronave);
router.delete('/aeronaves/:id', verificarAcesso(['ADMIN']), deletarAeronave);

// ==========================================
// CONTRATOS (Leitura geral, escrita Admin/Fiscal, exclusão Admin)
// ==========================================
router.get('/contratos', verificarAcesso(), listarContratos);
router.post('/contratos', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO']), criarContrato);
router.put('/contratos/:id', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO']), atualizarContrato);
router.delete('/contratos/:id', verificarAcesso(['ADMIN']), deletarContratoLogico);

// ==========================================
// ADESÕES / TERMOS ADITIVOS (Leitura geral, escrita Admin/Fiscal, exclusão Admin)
// ==========================================
router.get('/adesoes', verificarAcesso(), listarAdesoes);
router.post('/adesoes', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO']), criarAdesao);
router.put('/adesoes/:id', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO']), atualizarAdesao);
router.delete('/adesoes/:id', verificarAcesso(['ADMIN']), deletarAdesaoLogica);

export default router;
