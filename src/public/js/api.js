import { state } from './state.js';
import { mostrarAlertaFinanceiro } from './helpers.js';

export const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
    };
    
    const config = {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    };
    
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await res.json();
        
        if (!res.ok) {
            // Se for erro de validação (400), exibe o toast de alerta
            if (res.status === 400 || res.status === 403 || res.status === 411) {
                mostrarAlertaFinanceiro(data.error || 'Operação bloqueada pelas regras de negócio.');
            }
            throw new Error(data.error || 'Erro na requisição');
        }
        
        return data;
    } catch (err) {
        console.error(`Erro na chamada API ${endpoint}:`, err);
        throw err;
    }
}
