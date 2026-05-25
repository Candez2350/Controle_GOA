import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Faltam variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
    const email = 'candez2350@gmail.com';
    const senha = '81330443';
    const nome = 'Roger Candez';
    const role = 'ADMIN';

    try {
        console.log(`Verificando se o usuário ${email} já existe...`);
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            console.log('Usuário ADMIN já existe.');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(senha, salt);

        console.log('Criando usuário ADMIN...');
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    nome,
                    email,
                    senha_hash: hashedPassword,
                    role
                }
            ])
            .select();

        if (error) {
            console.error('Erro ao inserir ADMIN:', error);
        } else {
            console.log('Usuário ADMIN criado com sucesso:', data);
        }
    } catch (err) {
        console.error('Erro inesperado:', err);
    }
}

createAdmin();
