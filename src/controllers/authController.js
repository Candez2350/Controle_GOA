import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_goa_2026_change_in_production';

export const register = async (req, res) => {
    try {
        const { nome, email, senha, role } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
        }

        // Verifica se o usuário já existe
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado.' });
        }

        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha, salt);

        // Insere o novo usuário
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                {
                    nome,
                    email,
                    senha_hash: hashedPassword,
                    role: role || 'OPERADOR_MANUTENCAO'
                }
            ])
            .select('id, nome, email, role, created_at')
            .single();

        if (insertError) {
            console.error('Erro ao inserir usuário:', insertError);
            return res.status(500).json({ error: 'Erro ao criar usuário no banco de dados.' });
        }

        res.status(201).json({
            message: 'Usuário criado com sucesso.',
            user: newUser
        });
    } catch (err) {
        console.error('Erro no registro:', err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
        }

        // Busca o usuário pelo email
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (fetchError || !user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Compara as senhas
        const isMatch = await bcrypt.compare(senha, user.senha_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Gera o token JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login realizado com sucesso.',
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};

export const listarUsuarios = async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, nome, email, role, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: 'Erro ao listar usuários.' });
        }

        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};

export const atualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, role, senha } = req.body;
        const isSelf = req.user.id === id;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isAdmin && !isSelf) {
            return res.status(403).json({ error: 'Você não tem permissão para editar este usuário.' });
        }

        // Usuários comuns tentando atualizar dados além da senha
        if (!isAdmin && isSelf && (nome || email || role)) {
            return res.status(403).json({ error: 'Como usuário padrão, você só tem permissão para alterar a própria senha.' });
        }

        let updates = {};

        if (isAdmin) {
            if (nome) updates.nome = nome;
            if (email) updates.email = email;
            if (role) updates.role = role;
        }

        if (senha) {
            const salt = await bcrypt.genSalt(10);
            updates.senha_hash = await bcrypt.hash(senha, salt);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'Nenhum dado válido fornecido para atualizar.' });
        }

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select('id, nome, email, role')
            .single();

        if (error) {
            return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
        }

        res.status(200).json({ message: 'Usuário atualizado com sucesso.', user: data });
    } catch (err) {
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};

export const deletarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.id === id) {
            return res.status(400).json({ error: 'Você não pode excluir a própria conta.' });
        }

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            return res.status(500).json({ error: 'Erro ao excluir usuário.' });
        }

        res.status(200).json({ message: 'Usuário excluído com sucesso.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};
