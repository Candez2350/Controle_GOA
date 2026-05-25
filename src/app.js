import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregar variáveis de ambiente
dotenv.config();

// Middlewares e Rotas
import { auditLog } from './middlewares/auditMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import contratoRoutes from './routes/contratoRoutes.js';
import financeiroRoutes from './routes/financeiroRoutes.js';
import osRoutes from './routes/osRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Resolver caminhos de arquivos estáticos em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Habilitar CORS para o desenvolvimento
app.use(cors());
app.use(express.json());

// Injetar logger de auditoria global para todas as rotas da API
app.use('/api', auditLog);

// Registrar rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/contrato', contratoRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/os', osRoutes);

// Servir arquivos estáticos do Frontend SPA
app.use(express.static(path.join(__dirname, 'public')));

// Fallback para qualquer rota não mapeada (direciona para o SPA em HTML5)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tratamento centralizado de erros
app.use((err, req, res, next) => {
    console.error('[ERRO GLOBAL]:', err.stack);
    res.status(500).json({ error: 'Ocorreu um erro interno no servidor backend.' });
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`=====================================================================`);
    console.log(`   SISTEMA DE GESTÃO DE CONTRATOS ADMINISTRATIVOS E MANUTENÇÃO (GOA) `);
    console.log(`   CORPO DE BOMBEIROS MILITAR DO ESTADO DO RIO DE JANEIRO (CBMERJ)   `);
    console.log(`=====================================================================`);
    console.log(`[OK] Servidor rodando com sucesso no endereço: http://localhost:${PORT}`);
    console.log(`=====================================================================`);
});

export default app;
