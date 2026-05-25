// Auxiliares de formato e UI

export function formatarReal(valor) {
    return `R$ ${parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatarDataVisual(dataStr) {
    if (!dataStr) return 'N/A';
    const partes = dataStr.split('T')[0].split('-');
    if (partes.length < 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Mostra o alerta flutuante de negócio bloqueado (Toast)
export function mostrarAlertaFinanceiro(msg) {
    const toast = document.getElementById('financial-alert-toast');
    document.getElementById('toast-message').textContent = msg;
    
    toast.classList.remove('hidden');
    
    // Auto close após 8 segundos
    const timerId = setTimeout(() => {
        toast.classList.add('hidden');
    }, 8000);
    
    // Guardar ID no elemento se precisarmos limpar
    toast.dataset.timerId = timerId;
}
