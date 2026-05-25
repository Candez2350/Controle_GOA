// Estado global do App
export const state = {
    user: null,
    token: localStorage.getItem('goa_token') || '',
    activeTab: 'dashboard',
    
    // Cache de dados
    contratos: [],
    aeronaves: [],
    empresas: [],
    notasFiscais: [],
    ordensServico: [],
    alertasCore: [],
    
    // IDs selecionados para exibições detalhadas
    selectedContratoId: null,
    selectedOsId: null,
    
    // Seleção temporária para faturamento em lote
    selectedReparos: [],
    selectedMateriais: []
};
