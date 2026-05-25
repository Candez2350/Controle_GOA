import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_goa_2026_change_in_production';

export function verificarAcesso(rolesPermitidas = []) {
    return async (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(411).json({ error: 'Token de autenticação não fornecido.' });
        }

        // Mock bypass para testes e desenvolvimento ágil local
        if (token.startsWith('mock-')) {
            const role = token.replace('mock-', '').toUpperCase();
            let mappedRole = 'OPERADOR_MANUTENCAO';
            let mockId = '00000000-0000-0000-0000-000000000003';

            if (role === 'ADMIN') {
                mappedRole = 'ADMIN';
                mockId = '00000000-0000-0000-0000-000000000001';
            } else if (role === 'FISCAL_CONTRATO' || role === 'FISCAL') {
                mappedRole = 'FISCAL_CONTRATO';
                mockId = '00000000-0000-0000-0000-000000000002';
            }

            if (rolesPermitidas.length > 0 && !rolesPermitidas.includes(mappedRole)) {
                return res.status(403).json({ error: 'Acesso negado. Perfil insuficiente para esta operação (Mock Bypass).' });
            }

            req.user = { id: mockId, role: mappedRole, isMock: true };
            return next();
        }

        try {
            // Valida o token JWT diretamente com o jsonwebtoken
            const decoded = jwt.verify(token, JWT_SECRET);

            const userRole = decoded.role || 'OPERADOR_MANUTENCAO';

            // Se roles específicas foram passadas, verifica se o usuário possui permissão
            if (rolesPermitidas.length > 0 && !rolesPermitidas.includes(userRole)) {
                return res.status(403).json({ error: 'Acesso negado. Perfil insuficiente para esta operação.' });
            }

            // Injeta o ID do usuário e a Role na requisição para uso posterior
            req.user = { id: decoded.id, role: userRole };
            next();
        } catch (err) {
            return res.status(401).json({ error: 'Falha na verificação de token: ' + err.message });
        }
    };
}
