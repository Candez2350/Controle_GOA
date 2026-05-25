import { carregarDashboard } from './dashboard.js';
import { carregarContratos, carregarDropdownContratos } from './contratos.js';
import { carregarOrdensServico, abrirDetalhesOs, abrirModalFaturamentoLote } from './os.js';
import { carregarNotasFiscais, carregarDropdownVinculoNf } from './notas.js';
import { carregarAeronavesEEmpresas, carregarDropdownAeronaves, carregarDropdownEmpresas } from './aeronaves.js';
import { carregarUsuarios } from './usuarios.js';
import { apiFetch, API_BASE } from './api.js';
import { state } from './state.js';
import { fecharModal, navegarParaAba, abrirModal } from './ui.js';
import { validarTokenEIniciar, mostrarTelaLogin } from './auth.js';

const componentes = [
    { id: 'sidebar-container', url: '/components/sidebar.html' },
    { id: 'tab-dashboard-container', url: '/components/tab-dashboard.html' },
    { id: 'tab-contratos-container', url: '/components/tab-contratos.html' },
    { id: 'tab-os-container', url: '/components/tab-os.html' },
    { id: 'tab-notas-container', url: '/components/tab-notas.html' },
    { id: 'tab-aeronaves-container', url: '/components/tab-aeronaves.html' },
    { id: 'tab-usuarios-container', url: '/components/tab-usuarios.html' },
    { id: 'modals-container', url: '/components/modals.html' }
];

export async function carregarComponentesHTML() {
    const promises = componentes.map(async (comp) => {
        try {
            const response = await fetch(comp.url);
            const html = await response.text();
            document.getElementById(comp.id).innerHTML = html;
        } catch (error) {
            console.error(`Erro ao carregar componente ${comp.url}:`, error);
        }
    });

    await Promise.all(promises);
}

export function configurarEventosGerais() {
    // Cliques na Sidebar (Mobile & Desktop)
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar-container');
    const overlay = document.getElementById('sidebar-overlay');

    function toggleSidebar() {
        sidebar.classList.toggle('sidebar-open');
        overlay.classList.toggle('active');
    }

    mobileMenuBtn?.addEventListener('click', toggleSidebar);
    overlay?.addEventListener('click', toggleSidebar);

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const tabId = item.getAttribute('data-tab');
            navegarParaAba(tabId);
            
            // Fechar sidebar no mobile ao clicar em um link
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('sidebar-open');
                overlay.classList.remove('active');
            }
        });
    });

    // Cliques nas Abas Analíticas (Detalhes do Contrato)
    const analyticalTabs = document.querySelectorAll('.btn-tab-analytical');
    analyticalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            analyticalTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.tab-content-analytical').forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('active');
            });
            
            const targetId = tab.getAttribute('data-target');
            if (targetId) {
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    targetEl.classList.remove('hidden');
                    targetEl.classList.add('active');
                }
            }
        });
    });

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        localStorage.removeItem('goa_token');
        state.token = '';
        state.user = null;
        mostrarTelaLogin();
    });

    // Login com Perfis Mock
    const mockButtons = document.querySelectorAll('.btn-mock');
    mockButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const role = btn.getAttribute('data-role');
            let mockToken = 'mock-operador';
            if (role === 'admin') mockToken = 'mock-admin';
            else if (role === 'fiscal') mockToken = 'mock-fiscal';
            else if (role === 'consulta') mockToken = 'mock-consulta'; // adicionando o mock consulta
            
            state.token = mockToken;
            localStorage.setItem('goa_token', mockToken);
            
            const sucesso = await validarTokenEIniciar();
            if (!sucesso) {
                document.getElementById('login-error').textContent = 'Erro ao autenticar com perfil simulado.';
                document.getElementById('login-error').classList.remove('hidden');
            }
        });
    });

    // Login Form
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        document.getElementById('login-error').classList.add('hidden');
        
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha: password })
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Credenciais inválidas.');
            }

            state.token = data.token;
            localStorage.setItem('goa_token', data.token);
            
            const sucesso = await validarTokenEIniciar();
            if (!sucesso) {
                throw new Error('Falha na validação do token após o login.');
            }
        } catch (err) {
            document.getElementById('login-error').textContent = err.message;
            document.getElementById('login-error').classList.remove('hidden');
        }
    });

    // Controles de Modais e fechamento geral
    document.addEventListener('click', (e) => {
        if (e.target.matches('.close-modal') || e.target.closest('.close-modal') || e.target.matches('.btn-cancelar')) {
            const modal = e.target.closest('.modal');
            if (modal) fecharModal(modal.id);
        }
    });

    document.getElementById('btn-close-contrato-detail')?.addEventListener('click', () => {
        document.getElementById('contrato-detail-section').classList.add('hidden');
    });

    // Eventos de abrir modais principais
    document.getElementById('btn-modal-contrato')?.addEventListener('click', () => {
        document.getElementById('form-contrato').reset();
        document.getElementById('contrato-id').value = '';
        carregarDropdownEmpresas('contrato-empresa');
        abrirModal('modal-contrato');
    });

    document.getElementById('btn-modal-os')?.addEventListener('click', () => {
        document.getElementById('form-os').reset();
        document.getElementById('os-id').value = '';
        carregarDropdownContratos('os-contrato');
        carregarDropdownAeronaves('os-aeronave');
        abrirModal('modal-os');
    });

    document.getElementById('btn-modal-nf')?.addEventListener('click', () => {
        document.getElementById('form-nf').reset();
        document.getElementById('nf-id').value = '';
        carregarDropdownVinculoNf();
        abrirModal('modal-nf');
    });

    document.getElementById('btn-modal-empresa')?.addEventListener('click', () => {
        document.getElementById('form-empresa').reset();
        document.getElementById('empresa-id').value = '';
        abrirModal('modal-empresa');
    });

    document.getElementById('btn-modal-aeronave')?.addEventListener('click', () => {
        document.getElementById('form-aeronave').reset();
        document.getElementById('aeronave-id').value = '';
        abrirModal('modal-aeronave');
    });

    document.getElementById('btn-modal-usuario')?.addEventListener('click', () => {
        document.getElementById('form-usuario').reset();
        document.getElementById('usuario-id').value = '';
        document.getElementById('usuario-nome').disabled = false;
        document.getElementById('usuario-email').disabled = false;
        document.getElementById('usuario-role').disabled = false;
        abrirModal('modal-usuario');
    });

    // Abrir modal de Alterar Senha
    document.getElementById('btn-alterar-senha-trigger')?.addEventListener('click', () => {
        document.getElementById('form-alterar-senha').reset();
        abrirModal('modal-alterar-senha');
    });

    // Novos eventos de botões internos das abas
    document.getElementById('btn-modal-adesao')?.addEventListener('click', () => {
        document.getElementById('form-adesao').reset();
        document.getElementById('adesao-id').value = '';
        document.getElementById('adesao-contrato-id').value = state.selectedContratoId || '';
        abrirModal('modal-adesao');
    });

    document.getElementById('btn-modal-reparo')?.addEventListener('click', () => {
        document.getElementById('form-reparo').reset();
        document.getElementById('reparo-id').value = '';
        document.getElementById('reparo-os-id').value = state.selectedOsId || '';
        abrirModal('modal-reparo');
    });

    document.getElementById('btn-modal-material')?.addEventListener('click', () => {
        document.getElementById('form-material').reset();
        document.getElementById('material-id').value = '';
        document.getElementById('material-os-id').value = state.selectedOsId || '';
        abrirModal('modal-material');
    });

    document.getElementById('btn-close-os-detail')?.addEventListener('click', () => {
        document.getElementById('os-detail-section').classList.add('hidden');
    });

    document.getElementById('btn-faturar-reparos-lote')?.addEventListener('click', () => {
        if (state.selectedReparos.length > 0) {
            abrirModalFaturamentoLote(state.selectedReparos, []);
        }
    });

    document.getElementById('btn-faturar-materiais-lote')?.addEventListener('click', () => {
        if (state.selectedMateriais.length > 0) {
            abrirModalFaturamentoLote([], state.selectedMateriais);
        }
    });

    document.getElementById('btn-concluir-os')?.addEventListener('click', async () => {
        if (!state.selectedOsId) return;
        if (confirm('Tem certeza que deseja concluir esta Ordem de Serviço? Ela não poderá receber novos itens.')) {
            try {
                await apiFetch(`/os/ordens-servico/${state.selectedOsId}/concluir`, { method: 'PUT' });
                alert('OS concluída com sucesso!');
                document.getElementById('os-detail-section').classList.add('hidden');
                carregarOrdensServico();
            } catch (err) {}
        }
    });

    // Sub-abas de OS
    const osTabBtns = document.querySelectorAll('.os-tab-btn');
    osTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            osTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.os-tab-content').forEach(c => c.classList.remove('active'));
            const target = btn.getAttribute('data-subtab');
            document.getElementById(`subtab-${target}`)?.classList.add('active');
        });
    });
}

export function configurarFormulariosGerais() {
    // 1. Criar/Editar Contrato
    document.getElementById('form-contrato')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('contrato-id').value;
        const body = {
            id_empresa: document.getElementById('contrato-empresa').value,
            numero_contrato: document.getElementById('contrato-numero').value,
            processo_sei: document.getElementById('contrato-sei').value,
            objeto: document.getElementById('contrato-objeto').value,
            doerj: document.getElementById('contrato-doerj').value || null,
            pncp: document.getElementById('contrato-pncp').value || null,
            data_inicio: document.getElementById('contrato-data-inicio').value,
            data_fim_calculado: document.getElementById('contrato-data-fim').value,
            valor_total: document.getElementById('contrato-valor').value
        };

        try {
            if (id) {
                await apiFetch(`/contrato/contratos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
                alert('Contrato atualizado com sucesso!');
            } else {
                await apiFetch('/contrato/contratos', { method: 'POST', body: JSON.stringify(body) });
                alert('Contrato cadastrado com sucesso!');
            }
            fecharModal('modal-contrato');
            carregarContratos();
        } catch (err) {}
    });

    // 2. Criar/Editar Aditivo
    document.getElementById('form-adesao')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('adesao-id').value;
        const contratoId = document.getElementById('adesao-contrato-id').value;
        const body = {
            id_contrato: contratoId,
            numero_adesao: document.getElementById('adesao-numero').value,
            processo_sei: document.getElementById('adesao-sei').value,
            pncp: document.getElementById('adesao-pncp').value || null,
            data_inicio: document.getElementById('adesao-data-inicio').value,
            data_fim_calculado: document.getElementById('adesao-data-fim').value,
            valor_aditivado: document.getElementById('adesao-valor').value
        };

        try {
            if (id) {
                await apiFetch(`/contrato/adesoes/${id}`, { method: 'PUT', body: JSON.stringify(body) });
                alert('Termo Aditivo atualizado com sucesso!');
            } else {
                await apiFetch('/contrato/adesoes', { method: 'POST', body: JSON.stringify(body) });
                alert('Termo Aditivo inserido com sucesso!');
            }
            fecharModal('modal-adesao');
            document.querySelector(`.contract-card[data-id="${contratoId}"]`)?.click();
        } catch (err) {}
    });

    // 3. Ordem de Serviço
    document.getElementById('form-os')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('os-id').value;
        const body = {
            id_contrato: document.getElementById('os-contrato').value,
            id_aeronave: document.getElementById('os-aeronave').value,
            codigo_os: document.getElementById('os-codigo').value,
            processo_sei: document.getElementById('os-sei').value,
            data_solicitacao: document.getElementById('os-data').value,
            prazo_conclusao_dias: parseInt(document.getElementById('os-prazo').value),
            aog: document.getElementById('os-aog').checked,
            observacao: document.getElementById('os-observacao').value
        };

        try {
            if (id) {
                await apiFetch(`/os/${id}`, { method: 'PUT', body: JSON.stringify(body) });
                alert('Ordem de Serviço atualizada com sucesso!');
            } else {
                await apiFetch('/os', { method: 'POST', body: JSON.stringify(body) });
                alert('Ordem de Serviço aberta com sucesso!');
            }
            fecharModal('modal-os');
            carregarOrdensServico();
        } catch (err) {}
    });

    // 4. Reparo
    document.getElementById('form-reparo')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('reparo-id').value;
        const osId = document.getElementById('reparo-os-id').value;
        const exigeCore = document.getElementById('reparo-exige-core').checked;
        const body = {
            id_ordem_servico: osId,
            componente_descricao: document.getElementById('reparo-descricao').value,
            pn: document.getElementById('reparo-pn').value,
            sn: document.getElementById('reparo-sn').value,
            valor_reparo: document.getElementById('reparo-valor').value || 0,
            valor_item_novo: document.getElementById('reparo-valor-novo').value || 0,
            frete: document.getElementById('reparo-frete').value || 0,
            cotacao: document.getElementById('reparo-cotacao').value,
            data_fim_garantia: document.getElementById('reparo-garantia').value || null,
            situacao_atual: document.getElementById('reparo-situacao').value,
            status_goa: document.getElementById('reparo-status-goa').value,
            awb_rastreio: document.getElementById('reparo-awb').value || null,
            coleta_individual: document.getElementById('reparo-coleta').checked,
            core_retornado: !exigeCore
        };

        try {
            if (id) {
                await apiFetch(`/os/reparos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
                alert('Item de reparo atualizado com sucesso!');
            } else {
                await apiFetch('/os/reparos', { method: 'POST', body: JSON.stringify(body) });
                alert('Item de reparo adicionado com sucesso!');
            }
            fecharModal('modal-reparo');
            abrirDetalhesOs(osId);
        } catch (err) {}
    });

    // 5. Material
    document.getElementById('form-material')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('material-id').value;
        const osId = document.getElementById('material-os-id').value;
        const exigeCore = document.getElementById('material-exige-core').checked;
        const body = {
            id_ordem_servico: osId,
            item_descricao: document.getElementById('material-descricao').value,
            pn: document.getElementById('material-pn').value,
            equivalencia_evo: document.getElementById('material-evo').value,
            quantidade: parseInt(document.getElementById('material-qtd').value),
            orcamento: document.getElementById('material-orcamento').value,
            data_previsao: document.getElementById('material-previsao').value || null,
            data_fim_garantia: document.getElementById('material-garantia').value || null,
            awb_rastreio: document.getElementById('material-awb').value || null,
            recebido: document.getElementById('material-recebido').checked,
            core_retornado: !exigeCore
        };

        try {
            if (id) {
                await apiFetch(`/os/materiais/${id}`, { method: 'PUT', body: JSON.stringify(body) });
                alert('Material atualizado com sucesso!');
            } else {
                await apiFetch('/os/materiais', { method: 'POST', body: JSON.stringify(body) });
                alert('Material cadastrado na Ordem de Serviço!');
            }
            fecharModal('modal-material');
            abrirDetalhesOs(osId);
        } catch (err) {}
    });

    // 6. Faturamento Vinculo
    document.getElementById('form-faturamento-vinculo')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id_nota_fiscal = document.getElementById('fat-selecao-nf').value;
        const reparosIds = JSON.parse(document.getElementById('fat-reparos-ids').value);
        const materiaisIds = JSON.parse(document.getElementById('fat-materiais-ids').value);
        
        if (!id_nota_fiscal) {
            alert('Por favor, selecione uma Nota Fiscal.');
            return;
        }

        try {
            await apiFetch('/financeiro/faturar-itens', {
                method: 'POST',
                body: JSON.stringify({
                    id_nota_fiscal,
                    itens_reparo_ids: reparosIds,
                    itens_material_ids: materiaisIds
                })
            });
            fecharModal('modal-faturamento-vinculo');
            abrirDetalhesOs(state.selectedOsId);
            alert('Itens vinculados e faturados com sucesso!');
        } catch (err) {}
    });

    // 7. Aeronave
    document.getElementById('form-aeronave')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('aeronave-id').value;
        const body = {
            prefixo: document.getElementById('aeronave-prefixo').value,
            modelo: document.getElementById('aeronave-modelo').value
        };
        try {
            if (id) {
                await apiFetch(`/contrato/aeronaves/${id}`, { method: 'PUT', body: JSON.stringify(body) });
                alert('Aeronave atualizada com sucesso!');
            } else {
                await apiFetch('/contrato/aeronaves', { method: 'POST', body: JSON.stringify(body) });
                alert('Aeronave adicionada com sucesso!');
            }
            fecharModal('modal-aeronave');
            carregarAeronavesEEmpresas();
        } catch (err) {}
    });

    // 8. Empresa
    document.getElementById('form-empresa')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('empresa-id').value;
        const body = {
            nome: document.getElementById('empresa-nome').value,
            cnpj: document.getElementById('empresa-cnpj').value
        };
        try {
            if (id) {
                await apiFetch(`/contrato/empresas/${id}`, { method: 'PUT', body: JSON.stringify(body) });
                alert('Empresa atualizada com sucesso!');
            } else {
                await apiFetch('/contrato/empresas', { method: 'POST', body: JSON.stringify(body) });
                alert('Empresa cadastrada com sucesso!');
            }
            fecharModal('modal-empresa');
            carregarAeronavesEEmpresas();
        } catch (err) {}
    });

    // 9. Nota Fiscal
    document.getElementById('form-nf')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('nf-id').value;
        const vinculoSelect = document.getElementById('nf-vinculo-tipo').value;
        if (!vinculoSelect) {
            alert('Por favor, selecione o vínculo contratual da NF.');
            return;
        }
        
        const [tipo, vinculoId] = vinculoSelect.split(':');
        
        const body = {
            id_contrato: tipo === 'contrato' ? vinculoId : null,
            id_adesao: tipo === 'adesao' ? vinculoId : null,
            numero_nf: document.getElementById('nf-numero').value,
            processo_dgaf: document.getElementById('nf-sei').value,
            data_emissao: document.getElementById('nf-emissao').value,
            data_vencimento: document.getElementById('nf-vencimento').value,
            valor_nf: parseFloat(document.getElementById('nf-valor').value),
            fonte_pagadora: document.getElementById('nf-fonte').value,
            situacao_atual: document.getElementById('nf-situacao').value
        };

        try {
            if (id) {
                await apiFetch(`/financeiro/notas-fiscais/${id}`, { method: 'PUT', body: JSON.stringify(body) });
                alert('Nota Fiscal atualizada com sucesso!');
            } else {
                await apiFetch('/financeiro/notas-fiscais', { method: 'POST', body: JSON.stringify(body) });
                alert('Nota Fiscal lançada com sucesso!');
            }
            fecharModal('modal-nf');
            carregarNotasFiscais();
        } catch (err) {}
    });

    // 10. Usuário
    document.getElementById('form-usuario')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('usuario-id').value;
        const payload = {
            nome: document.getElementById('usuario-nome').value,
            email: document.getElementById('usuario-email').value,
            role: document.getElementById('usuario-role').value,
            senha: document.getElementById('usuario-senha').value
        };

        if (!payload.senha) delete payload.senha; // Se vazio, não atualiza a senha
        if (!id && !payload.senha) {
            alert('É obrigatório informar uma senha para um novo usuário.');
            return;
        }

        try {
            if (id) {
                // Atualizar
                await apiFetch(`/auth/users/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                alert('Usuário atualizado com sucesso!');
            } else {
                // Criar Novo
                await apiFetch('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                alert('Usuário cadastrado com sucesso!');
            }
            fecharModal('modal-usuario');
            carregarUsuarios();
        } catch (err) {
            alert(err.message);
        }
    });

    // 11. Alterar Senha (Usuário Logado)
    document.getElementById('form-alterar-senha')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const novaSenha = document.getElementById('alterar-senha-nova').value;
        const confirmarSenha = document.getElementById('alterar-senha-confirmar').value;

        if (novaSenha !== confirmarSenha) {
            alert('As senhas não coincidem. Por favor, verifique.');
            return;
        }

        if (!state.user || !state.user.id) {
            alert('Erro: Usuário não identificado. Por favor, faça login novamente.');
            return;
        }

        try {
            await apiFetch(`/auth/users/${state.user.id}`, {
                method: 'PUT',
                body: JSON.stringify({ senha: novaSenha })
            });
            alert('Senha atualizada com sucesso!');
            fecharModal('modal-alterar-senha');
        } catch (err) {
            alert(err.message || 'Erro ao atualizar a senha.');
        }
    });
}

export async function inicializarApp() {
    if (state.token) {
        validarTokenEIniciar();
    } else {
        mostrarTelaLogin();
    }
}
