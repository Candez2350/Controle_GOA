import { state } from './state.js';
import { API_BASE, apiFetch } from './api.js';
import { navegarParaAba } from './ui.js';

export async function validarTokenEIniciar() {
    try {
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        if (!res.ok) throw new Error('Token expirado');
        
        const userData = await res.json();
        state.user = userData;
        
        // Atualizar informações visuais do perfil do usuário
        document.getElementById('user-display-email').textContent = userData.isMock ? `Simulado: ${userData.role.toLowerCase()}@cbmerj.gov.br` : userData.email;
        
        const roleBadge = document.getElementById('user-display-role');
        roleBadge.textContent = userData.role;
        roleBadge.className = 'role-badge'; // reset
        if (userData.role === 'ADMIN') roleBadge.classList.add('role-admin');
        else if (userData.role === 'FISCAL_CONTRATO') roleBadge.classList.add('role-fiscal');
        else roleBadge.classList.add('role-operador');
        
        // Esconder Login e mostrar Sistema
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        // Aplicar controle de permissões na UI
        aplicarPermissoesUI(userData.role);
        
        // Carregar aba padrão
        navegarParaAba(state.activeTab);
        
        return true;
    } catch (err) {
        console.error('Erro na validação do login:', err);
        localStorage.removeItem('goa_token');
        state.token = '';
        return false;
    }
}

export function mostrarTelaLogin() {
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
}

export function aplicarPermissoesUI(role) {
    // Esconder/Mostrar elementos com base na role
    const adminElements = document.querySelectorAll('.btn-admin-only');
    const fiscalElements = document.querySelectorAll('.btn-fiscal-only');
    
    if (role !== 'ADMIN') {
        adminElements.forEach(el => el.classList.add('hidden'));
    } else {
        adminElements.forEach(el => el.classList.remove('hidden'));
    }

    if (role !== 'ADMIN' && role !== 'FISCAL_CONTRATO') {
        document.getElementById('btn-modal-empresa').classList.add('hidden');
        document.getElementById('btn-modal-aeronave').classList.add('hidden');
    } else {
        document.getElementById('btn-modal-empresa').classList.remove('hidden');
        document.getElementById('btn-modal-aeronave').classList.remove('hidden');
    }

    if (role === 'OPERADOR_MANUTENCAO') {
        document.getElementById('btn-modal-contrato').classList.add('hidden');
        document.getElementById('btn-modal-nf').classList.add('hidden');
        document.getElementById('btn-faturar-reparos-lote').classList.add('hidden');
        document.getElementById('btn-faturar-materiais-lote').classList.add('hidden');
        document.getElementById('btn-concluir-os').classList.add('hidden');
    } else {
        document.getElementById('btn-modal-contrato').classList.remove('hidden');
        document.getElementById('btn-modal-nf').classList.remove('hidden');
        document.getElementById('btn-faturar-reparos-lote').classList.remove('hidden');
        document.getElementById('btn-faturar-materiais-lote').classList.remove('hidden');
        document.getElementById('btn-concluir-os').classList.remove('hidden');
    }
}
