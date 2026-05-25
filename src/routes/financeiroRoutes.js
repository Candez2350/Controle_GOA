import express from 'express';
import { verificarAcesso } from '../middlewares/authMiddleware.js';
import {
    listarNotasFiscais,
    criarNotaFiscal,
    atualizarNotaFiscal,
    deletarNotaFiscalLogica,
    faturarItensParcial
} from '../controllers/financeiroController.js';

const router = express.Router();

// ==========================================
// NOTAS FISCAIS (Leitura geral, escrita Admin/Fiscal, deleção Admin)
// ==========================================
router.get('/notas-fiscais', verificarAcesso(), listarNotasFiscais);
router.post('/notas-fiscais', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO']), criarNotaFiscal);
router.put('/notas-fiscais/:id', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO']), atualizarNotaFiscal);
router.delete('/notas-fiscais/:id', verificarAcesso(['ADMIN']), deletarNotaFiscalLogica);

// ==========================================
// FATURAMENTO PARCIAL DE ITENS DE OS
// ==========================================
router.post('/faturar-itens', verificarAcesso(['ADMIN', 'FISCAL_CONTRATO']), faturarItensParcial);

export default router;
