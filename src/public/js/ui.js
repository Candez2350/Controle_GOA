import { state } from './state.js';
import { carregarDashboard } from './dashboard.js';
import { carregarContratos } from './contratos.js';
import { carregarOrdensServico } from './os.js';
import { carregarNotasFiscais } from './notas.js';
import { carregarAeronavesEEmpresas } from './aeronaves.js';
import { carregarUsuarios } from './usuarios.js';

export function abrirModal(id) {
    document.getElementById(id).classList.add('open');
}

export function fecharModal(id) {
    document.getElementById(id).classList.remove('open');
}

// Navegador de Abas SPA
export function navegarParaAba(tabId) {
    state.activeTab = tabId;
    
    // Atualizar classe ativa na Sidebar
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Exibir painel correto
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    // Atualizar títulos do Header
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    if (tabId === 'dashboard') {
        pageTitle.textContent = 'Painel Geral de Controle';
        pageSubtitle.textContent = 'Visão integrada de contratos, manutenção aérea e fluxo de caixa.';
        carregarDashboard();
    } else if (tabId === 'contratos') {
        pageTitle.textContent = 'Contratos & Aditivos';
        pageSubtitle.textContent = 'Gerenciamento de empenhos originais, saldos e termos aditivos (Adesão).';
        carregarContratos();
    } else if (tabId === 'os') {
        pageTitle.textContent = 'Ordens de Serviço Aéreas';
        pageSubtitle.textContent = 'Controle de manutenções de aeronaves, peças rotativas e compras de insumos.';
        carregarOrdensServico();
    } else if (tabId === 'notas') {
        pageTitle.textContent = 'Saúde Financeira e Notas Fiscais';
        pageSubtitle.textContent = 'Lançamento, atesto de pagamentos e auditoria fiscal de faturamentos.';
        carregarNotasFiscais();
    } else if (tabId === 'aeronaves') {
        pageTitle.textContent = 'Aeronaves & Empresas';
        pageSubtitle.textContent = 'Parametrização de frotas militares e fornecedores conveniados.';
        carregarAeronavesEEmpresas();
    } else if (tabId === 'usuarios') {
        pageTitle.textContent = 'Gestão de Equipe';
        pageSubtitle.textContent = 'Administração de usuários, permissões e perfis de acesso.';
        carregarUsuarios();
    }
}
