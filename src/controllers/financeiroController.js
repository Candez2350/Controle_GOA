import { supabase } from '../config/supabaseClient.js';

// ==========================================
// NOTAS FISCAIS
// ==========================================

export const listarNotasFiscais = async (req, res) => {
    try {
        const { contrato_id } = req.query;
        let query = supabase.from('nota_fiscal')
            .select('*, contrato(*), adesao(*)')
            .is('deleted_at', null);

        if (contrato_id) {
            query = query.eq('id_contrato', contrato_id);
        }

        const { data, error } = await query.order('data_emissao', { ascending: false });

        if (error) throw error;
        return res.status(200).json(data);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const criarNotaFiscal = async (req, res) => {
    try {
        const {
            id_contrato,
            id_adesao,
            numero_nf,
            data_emissao,
            data_vencimento,
            valor_nf,
            fonte_pagadora,
            processo_dgaf,
            situacao_atual
        } = req.body;

        if (!numero_nf || !data_emissao || !data_vencimento || valor_nf === undefined) {
            return res.status(400).json({ error: 'Campos obrigatórios: número da NF, data emissão, data vencimento e valor da NF.' });
        }

        if (!id_contrato && !id_adesao) {
            return res.status(400).json({ error: 'A Nota Fiscal deve estar vinculada a um contrato ou a um termo aditivo (adesão).' });
        }

        const parsedValor = parseFloat(valor_nf);

        // 1. Validação de Vigência e Limites Financeiros
        if (id_adesao) {
            // Caso vinculada a um Termo Aditivo (Adesão)
            const { data: adesao, error: errAdesao } = await supabase
                .from('adesao')
                .select('*')
                .eq('id_adesao', id_adesao)
                .is('deleted_at', null)
                .single();

            if (errAdesao || !adesao) {
                return res.status(400).json({ error: 'Termo aditivo (adesão) não encontrado ou inativo.' });
            }

            // Validar vigência
            const emissaoDate = new Date(data_emissao);
            const vigenciaInicio = new Date(adesao.data_inicio);
            const vigenciaFim = new Date(adesao.data_fim_calculado);

            if (emissaoDate < vigenciaInicio || emissaoDate > vigenciaFim) {
                return res.status(400).json({
                    error: `A data de emissão (${data_emissao}) está fora do período de vigência do Termo Aditivo: ${adesao.data_inicio} até ${adesao.data_fim_calculado}.`
                });
            }

            // Validar limite financeiro se a NF for PAGO
            if (situacao_atual === 'PAGO') {
                const { data: nfsPagas, error: errNfs } = await supabase
                    .from('nota_fiscal')
                    .select('valor_nf')
                    .eq('id_adesao', id_adesao)
                    .eq('situacao_atual', 'PAGO')
                    .is('deleted_at', null);

                if (errNfs) throw errNfs;

                const somaPaga = nfsPagas.reduce((acc, curr) => acc + parseFloat(curr.valor_nf), 0);
                if (somaPaga + parsedValor > parseFloat(adesao.valor_aditivado)) {
                    return res.status(400).json({
                        error: `Limite financeiro da Adesão excedido. Disponível: R$ ${(parseFloat(adesao.valor_aditivado) - somaPaga).toFixed(2)}. Tentado: R$ ${parsedValor.toFixed(2)}.`
                    });
                }
            }
        } else if (id_contrato) {
            // Caso vinculada apenas ao Contrato original
            const { data: contrato, error: errContrato } = await supabase
                .from('contrato')
                .select('*')
                .eq('id_contrato', id_contrato)
                .is('deleted_at', null)
                .single();

            if (errContrato || !contrato) {
                return res.status(400).json({ error: 'Contrato mãe não encontrado ou inativo.' });
            }

            // Validar vigência
            const emissaoDate = new Date(data_emissao);
            const vigenciaInicio = new Date(contrato.data_inicio);
            const vigenciaFim = new Date(contrato.data_fim_calculado);

            if (emissaoDate < vigenciaInicio || emissaoDate > vigenciaFim) {
                return res.status(400).json({
                    error: `A data de emissão (${data_emissao}) está fora do período de vigência do Contrato: ${contrato.data_inicio} até ${contrato.data_fim_calculado}.`
                });
            }

            // Validar limite financeiro se a NF for PAGO
            if (situacao_atual === 'PAGO') {
                const { data: nfsPagas, error: errNfs } = await supabase
                    .from('nota_fiscal')
                    .select('valor_nf')
                    .eq('id_contrato', id_contrato)
                    .is('id_adesao', null)
                    .eq('situacao_atual', 'PAGO')
                    .is('deleted_at', null);

                if (errNfs) throw errNfs;

                const somaPaga = nfsPagas.reduce((acc, curr) => acc + parseFloat(curr.valor_nf), 0);
                if (somaPaga + parsedValor > parseFloat(contrato.valor_total)) {
                    return res.status(400).json({
                        error: `Limite financeiro do Contrato excedido. Disponível: R$ ${(parseFloat(contrato.valor_total) - somaPaga).toFixed(2)}. Tentado: R$ ${parsedValor.toFixed(2)}.`
                    });
                }
            }
        }

        const { data, error } = await supabase
            .from('nota_fiscal')
            .insert([{
                id_contrato: id_contrato || null,
                id_adesao: id_adesao || null,
                numero_nf,
                data_emissao,
                data_vencimento,
                valor_nf: parsedValor,
                fonte_pagadora,
                processo_dgaf,
                situacao_atual: situacao_atual || 'PENDENTE',
                created_by: req.user.id
            }])
            .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const atualizarNotaFiscal = async (req, res) => {
    try {
        const { id } = req.params;
        const { situacao_atual, valor_nf, data_emissao } = req.body;

        // Buscar NF atual
        const { data: currentNf, error: errFetch } = await supabase
            .from('nota_fiscal')
            .select('*')
            .eq('id_nota_fiscal', id)
            .is('deleted_at', null)
            .single();

        if (errFetch || !currentNf) {
            return res.status(404).json({ error: 'Nota Fiscal não encontrada ou inativa.' });
        }

        const novoStatus = situacao_atual !== undefined ? situacao_atual : currentNf.situacao_atual;
        const novoValor = valor_nf !== undefined ? parseFloat(valor_nf) : parseFloat(currentNf.valor_nf);
        const novaDataEmissao = data_emissao !== undefined ? data_emissao : currentNf.data_emissao;

        // Se mudou para PAGO ou alterou dados e está como PAGO, validamos os limites
        if (novoStatus === 'PAGO') {
            if (currentNf.id_adesao) {
                const { data: adesao } = await supabase
                    .from('adesao')
                    .select('*')
                    .eq('id_adesao', currentNf.id_adesao)
                    .single();

                if (adesao) {
                    const emissaoDate = new Date(novaDataEmissao);
                    if (emissaoDate < new Date(adesao.data_inicio) || emissaoDate > new Date(adesao.data_fim_calculado)) {
                        return res.status(400).json({ error: 'Data de emissão fora da vigência do Termo Aditivo.' });
                    }

                    const { data: nfsPagas } = await supabase
                        .from('nota_fiscal')
                        .select('valor_nf')
                        .eq('id_adesao', currentNf.id_adesao)
                        .eq('situacao_atual', 'PAGO')
                        .neq('id_nota_fiscal', id)
                        .is('deleted_at', null);

                    const somaPaga = nfsPagas.reduce((acc, curr) => acc + parseFloat(curr.valor_nf), 0);
                    if (somaPaga + novoValor > parseFloat(adesao.valor_aditivado)) {
                        return res.status(400).json({
                            error: `Limite financeiro da Adesão excedido. Disponível: R$ ${(parseFloat(adesao.valor_aditivado) - somaPaga).toFixed(2)}. Tentado: R$ ${novoValor.toFixed(2)}.`
                        });
                    }
                }
            } else if (currentNf.id_contrato) {
                const { data: contrato } = await supabase
                    .from('contrato')
                    .select('*')
                    .eq('id_contrato', currentNf.id_contrato)
                    .single();

                if (contrato) {
                    const emissaoDate = new Date(novaDataEmissao);
                    if (emissaoDate < new Date(contrato.data_inicio) || emissaoDate > new Date(contrato.data_fim_calculado)) {
                        return res.status(400).json({ error: 'Data de emissão fora da vigência do Contrato.' });
                    }

                    const { data: nfsPagas } = await supabase
                        .from('nota_fiscal')
                        .select('valor_nf')
                        .eq('id_contrato', currentNf.id_contrato)
                        .is('id_adesao', null)
                        .eq('situacao_atual', 'PAGO')
                        .neq('id_nota_fiscal', id)
                        .is('deleted_at', null);

                    const somaPaga = nfsPagas.reduce((acc, curr) => acc + parseFloat(curr.valor_nf), 0);
                    if (somaPaga + novoValor > parseFloat(contrato.valor_total)) {
                        return res.status(400).json({
                            error: `Limite financeiro do Contrato excedido. Disponível: R$ ${(parseFloat(contrato.valor_total) - somaPaga).toFixed(2)}. Tentado: R$ ${novoValor.toFixed(2)}.`
                        });
                    }
                }
            }
        }

        const { data, error } = await supabase
            .from('nota_fiscal')
            .update({
                ...req.body,
                updated_at: new Date().toISOString()
            })
            .eq('id_nota_fiscal', id)
            .select();

        if (error) throw error;
        return res.status(200).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const deletarNotaFiscalLogica = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('nota_fiscal')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id_nota_fiscal', id)
            .select();

        if (error) throw error;
        return res.status(200).json({ message: 'Nota Fiscal desativada logicamente.', data });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

// ==========================================
// FATURAMENTO FRACIONADO / PARCIAL
// ==========================================

export const faturarItensParcial = async (req, res) => {
    try {
        const { id_nota_fiscal, itens_reparo_ids, itens_material_ids } = req.body;

        if (!id_nota_fiscal) {
            return res.status(400).json({ error: 'O ID da Nota Fiscal é obrigatório.' });
        }

        // Validar se a NF existe
        const { data: nf, error: errNf } = await supabase
            .from('nota_fiscal')
            .select('*')
            .eq('id_nota_fiscal', id_nota_fiscal)
            .is('deleted_at', null)
            .single();

        if (errNf || !nf) {
            return res.status(404).json({ error: 'Nota Fiscal destino não encontrada ou inativa.' });
        }

        const resultados = { reparos: [], materiais: [] };

        // Vincular itens de reparo
        if (itens_reparo_ids && Array.isArray(itens_reparo_ids) && itens_reparo_ids.length > 0) {
            const { data, error } = await supabase
                .from('os_servico_reparo')
                .update({
                    id_nota_fiscal,
                    updated_at: new Date().toISOString()
                })
                .in('id_servico_reparo', itens_reparo_ids)
                .select();

            if (error) throw error;
            resultados.reparos = data;
        }

        // Vincular itens de aquisição (materiais)
        if (itens_material_ids && Array.isArray(itens_material_ids) && itens_material_ids.length > 0) {
            const { data, error } = await supabase
                .from('os_material_aquisicao')
                .update({
                    id_nota_fiscal,
                    updated_at: new Date().toISOString()
                })
                .in('id_material_aquisicao', itens_material_ids)
                .select();

            if (error) throw error;
            resultados.materiais = data;
        }

        return res.status(200).json({
            message: 'Faturamento parcial de itens concluído com sucesso.',
            data: resultados
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};
