import { supabase } from '../config/supabaseClient.js';

// ==========================================
// EMPRESAS
// ==========================================
export const listarEmpresas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('empresa')
            .select('*')
            .is('deleted_at', null)
            .order('nome');

        if (error) throw error;
        return res.status(200).json(data);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const criarEmpresa = async (req, res) => {
    try {
        const { nome, cnpj } = req.body;
        if (!nome || !cnpj) {
            return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios.' });
        }

        const { data, error } = await supabase
            .from('empresa')
            .insert([{
                nome,
                cnpj,
                created_by: req.user.id
            }])
            .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const atualizarEmpresa = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('empresa')
            .update({
                ...req.body,
                updated_at: new Date().toISOString()
            })
            .eq('id_empresa', id)
            .select();

        if (error) throw error;
        return res.status(200).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const deletarEmpresa = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('empresa')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id_empresa', id)
            .select();

        if (error) throw error;
        return res.status(200).json({ message: 'Empresa desativada com sucesso.', data });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

// ==========================================
// AERONAVES
// ==========================================
export const listarAeronaves = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('aeronave')
            .select('*')
            .is('deleted_at', null)
            .order('prefixo');

        if (error) throw error;
        return res.status(200).json(data);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const criarAeronave = async (req, res) => {
    try {
        const { prefixo, modelo } = req.body;
        if (!prefixo || !modelo) {
            return res.status(400).json({ error: 'Prefixo e modelo são obrigatórios.' });
        }

        const { data, error } = await supabase
            .from('aeronave')
            .insert([{
                prefixo,
                modelo,
                created_by: req.user.id
            }])
            .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const atualizarAeronave = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('aeronave')
            .update({
                ...req.body,
                updated_at: new Date().toISOString()
            })
            .eq('id_aeronave', id)
            .select();

        if (error) throw error;
        return res.status(200).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const deletarAeronave = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('aeronave')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id_aeronave', id)
            .select();

        if (error) throw error;
        return res.status(200).json({ message: 'Aeronave desativada com sucesso.', data });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

// ==========================================
// CONTRATOS
// ==========================================
export const listarContratos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('contrato')
            .select('*, empresa(*)')
            .is('deleted_at', null)
            .order('numero_contrato');

        if (error) throw error;
        return res.status(200).json(data);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const criarContrato = async (req, res) => {
    try {
        const {
            id_empresa,
            numero_contrato,
            processo_sei,
            objeto,
            doerj,
            pncp,
            data_inicio,
            data_fim_calculado,
            valor_total
        } = req.body;

        if (!id_empresa || !numero_contrato || !data_inicio || !data_fim_calculado || valor_total === undefined) {
            return res.status(400).json({ error: 'Campos obrigatórios: empresa, número do contrato, data início, data fim e valor total.' });
        }

        if (new Date(data_inicio) > new Date(data_fim_calculado)) {
            return res.status(400).json({ error: 'A data de início do contrato não pode ser posterior à data de fim calculada.' });
        }

        const { data, error } = await supabase
            .from('contrato')
            .insert([{
                id_empresa,
                numero_contrato,
                processo_sei,
                objeto,
                doerj,
                pncp,
                data_inicio,
                data_fim_calculado,
                valor_total: parseFloat(valor_total),
                created_by: req.user.id
            }])
            .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const atualizarContrato = async (req, res) => {
    try {
        const { id } = req.params;
        
        const payload = { ...req.body, updated_at: new Date().toISOString() };
        if (payload.valor_total) payload.valor_total = parseFloat(payload.valor_total);

        // Validation for date if present
        if (payload.data_inicio && payload.data_fim_calculado) {
            if (new Date(payload.data_inicio) > new Date(payload.data_fim_calculado)) {
                return res.status(400).json({ error: 'A data de início do contrato não pode ser posterior à data de fim calculada.' });
            }
        }

        const { data, error } = await supabase
            .from('contrato')
            .update(payload)
            .eq('id_contrato', id)
            .select();

        if (error) throw error;
        return res.status(200).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const deletarContratoLogico = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('contrato')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id_contrato', id)
            .select();

        if (error) throw error;
        return res.status(200).json({ message: 'Contrato desativado com sucesso.', data });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

// ==========================================
// ADESÕES (TERMOS ADITIVOS)
// ==========================================
export const listarAdesoes = async (req, res) => {
    try {
        const { contrato_id } = req.query;
        let query = supabase.from('adesao').select('*, contrato(*)').is('deleted_at', null);
        
        if (contrato_id) {
            query = query.eq('id_contrato', contrato_id);
        }

        const { data, error } = await query.order('numero_adesao');

        if (error) throw error;
        return res.status(200).json(data);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const criarAdesao = async (req, res) => {
    try {
        const {
            id_contrato,
            numero_adesao,
            processo_sei,
            pncp,
            data_inicio,
            data_fim_calculado,
            valor_aditivado
        } = req.body;

        if (!id_contrato || !numero_adesao || !data_inicio || !data_fim_calculado || valor_aditivado === undefined) {
            return res.status(400).json({ error: 'Campos obrigatórios: contrato, número do termo aditivo, data início, data fim e valor aditivado.' });
        }

        if (new Date(data_inicio) > new Date(data_fim_calculado)) {
            return res.status(400).json({ error: 'A data de início do aditivo não pode ser posterior à data de fim calculada.' });
        }

        // Validar se o contrato mãe existe e não está deletado
        const { data: contrato, error: errContrato } = await supabase
            .from('contrato')
            .select('*')
            .eq('id_contrato', id_contrato)
            .is('deleted_at', null)
            .single();

        if (errContrato || !contrato) {
            return res.status(400).json({ error: 'Contrato mãe não encontrado ou inativo.' });
        }

        const { data, error } = await supabase
            .from('adesao')
            .insert([{
                id_contrato,
                numero_adesao,
                processo_sei,
                pncp,
                data_inicio,
                data_fim_calculado,
                valor_aditivado: parseFloat(valor_aditivado),
                created_by: req.user.id
            }])
            .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const atualizarAdesao = async (req, res) => {
    try {
        const { id } = req.params;

        const payload = { ...req.body, updated_at: new Date().toISOString() };
        if (payload.valor_aditivado) payload.valor_aditivado = parseFloat(payload.valor_aditivado);

        // Validation for date if present
        if (payload.data_inicio && payload.data_fim_calculado) {
            if (new Date(payload.data_inicio) > new Date(payload.data_fim_calculado)) {
                return res.status(400).json({ error: 'A data de início do aditivo não pode ser posterior à data de fim calculada.' });
            }
        }

        const { data, error } = await supabase
            .from('adesao')
            .update(payload)
            .eq('id_adesao', id)
            .select();

        if (error) throw error;
        return res.status(200).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const deletarAdesaoLogica = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('adesao')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id_adesao', id)
            .select();

        if (error) throw error;
        return res.status(200).json({ message: 'Termo aditivo desativado com sucesso.', data });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};
