import { carregarComponentesHTML, configurarEventosGerais, configurarFormulariosGerais, inicializarApp } from './js/init.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Injetar componentes HTML estáticos (abas e modais)
    await carregarComponentesHTML();
    
    // 2. Configurar eventos de clique, navegação e formatação (agora que o DOM existe)
    configurarEventosGerais();
    configurarFormulariosGerais();
    
    // 3. Checar token, rotear para a primeira tela ou exibir Login
    await inicializarApp();
});
