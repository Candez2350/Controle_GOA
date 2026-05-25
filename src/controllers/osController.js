import { supabase } from '../config/supabaseClient.js';

// ==========================================
// ORDENS DE SERVIÇO (OSE/RMS)
// ==========================================

export const listarOrdensServico = async (req, res) => {
    try {
        const { contrato_id } = req.query;
        let query = supabase.from('ordem_servico')
            .select('*, contrato(*), aeronave(*)')
            .is('deleted_at', null);

        if (contrato_id) {
            query = query.eq('id_contrato', contrato_id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json(data);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const obterDetalhesOrdemServico = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar OS principal
        const { data: os, error: errOs } = await supabase
            .from('ordem_servico')
            .select('*, contrato(*), aeronave(*)')
            .eq('id_ordem_servico', id)
            .is('deleted_at', null)
            .single();

        if (errOs || !os) {
            return res.status(404).json({ error: 'Ordem de serviço não encontrada ou inativa.' });
        }

        // Buscar reparos
        const { data: reparos, error: errReparos } = await supabase
            .from('os_servico_reparo')
            .select('*, nota_fiscal(*)')
            .eq('id_ordem_servico', id)
            .is('deleted_at', null);

        if (errReparos) throw errReparos;

        // Buscar materiais
        const { data: materiais, error: errMateriais } = await supabase
            .from('os_material_aquisicao')
            .select('*, nota_fiscal(*)')
            .eq('id_ordem_servico', id)
            .is('deleted_at', null);

        if (errMateriais) throw errMateriais;

        return res.status(200).json({
            ...os,
            reparos,
            materiais
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const criarOrdemServico = async (req, res) => {
    try {
        const { id_contrato, id_aeronave, codigo_os, data_solicitacao, aog, prazo_conclusao_dias, processo_sei, observacao } = req.body;
        
        if (!id_contrato || !id_aeronave || !codigo_os) {
            return res.status(400).json({ error: 'Contrato, aeronave e código da OS são obrigatórios.' });
        }

        const dataSol = data_solicitacao || new Date().toISOString().split('T')[0];

        // Validar vigência do contrato
        const { data: contrato, error: errContrato } = await supabase
            .from('contrato')
            .select('*')
            .eq('id_contrato', id_contrato)
            .single();

        if (errContrato || !contrato) {
            return res.status(400).json({ error: 'Contrato mãe não encontrado.' });
        }

        const solicDate = new Date(dataSol);
        const vigInicio = new Date(contrato.data_inicio);
        const vigFim = new Date(contrato.data_fim_calculado);

        if (solicDate < vigInicio || solicDate > vigFim) {
            return res.status(400).json({
                error: `A data da solicitação (${dataSol}) está fora do período de vigência do Contrato: ${contrato.data_inicio} até ${contrato.data_fim_calculado}.`
            });
        }

        const { data, error } = await supabase
            .from('ordem_servico')
            .insert([{
                id_contrato,
                id_aeronave,
                codigo_os,
                data_solicitacao: dataSol,
                aog: aog || false,
                prazo_conclusao_dias,
                processo_sei,
                observacao,
                concluido: false,
                created_by: req.user.id
            }])
            .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const atualizarOrdemServico = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('ordem_servico')
            .update({
                ...req.body,
                updated_at: new Date().toISOString()
            })
            .eq('id_ordem_servico', id)
            .select();

        if (error) throw error;
        return res.status(200).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const deletarOrdemServicoLogico = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('ordem_servico')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id_ordem_servico', id)
            .select();

        if (error) throw error;
        return res.status(200).json({ message: 'Ordem de Serviço desativada com sucesso.', data });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

// ==========================================
// ITENS DE REPARO (OS_SERVICO_REPARO)
// ==========================================

export const criarServicoReparo = async (req, res) => {
    try {
        const {
            id_ordem_servico,
            cotacao,
            componente_descricao,
            pn,
            sn,
            valor_reparo,
            valor_item_novo,
            frete,
            coleta_individual,
            situacao_atual,
            status_goa,
            data_fim_garantia,
            core_retornado,
            awb_rastreio
        } = req.body;

        if (!id_ordem_servico || !componente_descricao) {
            return res.status(400).json({ error: 'Ordem de serviço e descrição do componente são obrigatórios.' });
        }

        const { data, error } = await supabase
            .from('os_servico_reparo')
            .insert([{
                id_ordem_servico,
                cotacao,
                componente_descricao,
                pn,
                sn,
                valor_reparo: parseFloat(valor_reparo || 0),
                valor_item_novo: parseFloat(valor_item_novo || 0),
                frete: parseFloat(frete || 0),
                coleta_individual,
                situacao_atual,
                status_goa,
                data_fim_garantia,
                core_retornado: core_retornado || false,
                awb_rastreio,
                created_by: req.user.id
            }])
            .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const atualizarServicoReparo = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('os_servico_reparo')
            .update({
                ...req.body,
                updated_at: new Date().toISOString()
            })
            .eq('id_servico_reparo', id)
            .select();

        if (error) throw error;
        return res.status(200).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const deletarServicoReparo = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('os_servico_reparo')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id_servico_reparo', id)
            .select();

        if (error) throw error;
        return res.status(200).json({ message: 'Reparo removido com sucesso.', data });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

// ==========================================
// MATERIAIS DE AQUISIÇÃO (OS_MATERIAL_AQUISICAO)
// ==========================================

export const criarMaterialAquisicao = async (req, res) => {
    try {
        const {
            id_ordem_servico,
            orcamento,
            item_descricao,
            pn,
            equivalencia_evo,
            quantidade,
            data_previsao,
            recebido,
            data_fim_garantia,
            core_retornado,
            awb_rastreio
        } = req.body;

        if (!id_ordem_servico || !item_descricao) {
            return res.status(400).json({ error: 'Ordem de serviço e descrição do material são obrigatórios.' });
        }

        const { data, error } = await supabase
            .from('os_material_aquisicao')
            .insert([{
                id_ordem_servico,
                orcamento,
                item_descricao,
                pn,
                equivalencia_evo,
                quantidade: parseInt(quantidade || 1),
                data_previsao,
                recebido: recebido || false,
                data_fim_garantia,
                core_retornado: core_retornado || false,
                awb_rastreio,
                created_by: req.user.id
            }])
            .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const atualizarMaterialAquisicao = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('os_material_aquisicao')
            .update({
                ...req.body,
                updated_at: new Date().toISOString()
            })
            .eq('id_material_aquisicao', id)
            .select();

        if (error) throw error;
        return res.status(200).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const deletarMaterialAquisicao = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('os_material_aquisicao')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id_material_aquisicao', id)
            .select();

        if (error) throw error;
        return res.status(200).json({ message: 'Material removido com sucesso.', data });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

// ==========================================
// ALERTAS SINTÉTICOS E CORE RETURN
// ==========================================

export const obterAlertasCoreReturn = async (req, res) => {
    try {
        // Obter reparos onde core_retornado = false
        const { data: reparos, error: errRep } = await supabase
            .from('os_servico_reparo')
            .select('*, ordem_servico(*, contrato(*), aeronave(*))')
            .eq('core_retornado', false)
            .is('deleted_at', null);

        if (errRep) throw errRep;

        // Obter materiais onde core_retornado = false
        const { data: materiais, error: errMat } = await supabase
            .from('os_material_aquisicao')
            .select('*, ordem_servico(*, contrato(*), aeronave(*))')
            .eq('core_retornado', false)
            .is('deleted_at', null);

        if (errMat) throw errMat;

        // Consolidar alertas estruturados
        const alertas = [
            ...reparos.map(item => ({
                id: item.id_servico_reparo,
                tipo: 'REPARO',
                descricao: item.componente_descricao,
                pn: item.pn,
                sn: item.sn || 'N/A',
                codigo_os: item.ordem_servico?.codigo_os || 'OS N/A',
                id_ordem_servico: item.id_ordem_servico,
                aeronave: item.ordem_servico?.aeronave?.prefixo || 'N/A',
                contrato: item.ordem_servico?.contrato?.numero_contrato || 'N/A',
                awb_rastreio: item.awb_rastreio,
                created_at: item.created_at
            })),
            ...materiais.map(item => ({
                id: item.id_material_aquisicao,
                tipo: 'MATERIAL',
                descricao: item.item_descricao,
                pn: item.pn,
                sn: 'N/A',
                codigo_os: item.ordem_servico?.codigo_os || 'OS N/A',
                id_ordem_servico: item.id_ordem_servico,
                aeronave: item.ordem_servico?.aeronave?.prefixo || 'N/A',
                contrato: item.ordem_servico?.contrato?.numero_contrato || 'N/A',
                awb_rastreio: item.awb_rastreio,
                created_at: item.created_at
            }))
        ];

        return res.status(200).json(alertas);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};
