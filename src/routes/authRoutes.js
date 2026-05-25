import express from 'express';
import { verificarAcesso } from '../middlewares/authMiddleware.js';
import { login, register, listarUsuarios, atualizarUsuario, deletarUsuario } from '../controllers/authController.js';

const router = express.Router();

// Rotas públicas
router.post('/login', login);

// Rotas de Gestão de Usuários e Autenticação
// Apenas ADMIN pode criar usuários
router.post('/register', verificarAcesso(['ADMIN']), register);

// Apenas ADMIN pode listar todos e deletar
router.get('/users', verificarAcesso(['ADMIN']), listarUsuarios);
router.delete('/users/:id', verificarAcesso(['ADMIN']), deletarUsuario);

// ADMIN pode editar todos, usuário comum pode editar a própria senha
router.put('/users/:id', verificarAcesso(), atualizarUsuario);

// Rota protegida para validar e obter dados do usuário logado
router.get('/me', verificarAcesso(), (req, res) => {
    return res.status(200).json({
        id: req.user.id,
        role: req.user.role,
        nome: req.user.nome,
        email: req.user.email,
        isMock: !!req.user.isMock
    });
});

export default router;
