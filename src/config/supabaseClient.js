import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-supabase-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (!supabaseUrl || !supabaseKey) {
    console.error('AVISO: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
