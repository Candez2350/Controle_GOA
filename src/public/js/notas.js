import { state } from './state.js';
import { apiFetch } from './api.js';
import { formatarDataVisual } from './helpers.js';
import { abrirModal } from './ui.js';

export async function carregarNotasFiscais() {
    try {
        const nfs = await apiFetch('/financeiro/notas-fiscais');
        state.notasFiscais = nfs;
        
        const tbody = document.getElementById('table-notas-fiscais');
        tbody.innerHTML = '';
        
        if (nfs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Nenhuma Nota Fiscal lançada no sistema.</td></tr>';
            return;
        }
        
        nfs.forEach(n => {
            const vinculoLabel = n.id_adesao 
                ? `<strong>Termo Aditivo ${n.adesao?.numero_adesao || ''}</strong><br><span class="text-sm text-muted">Contrato: ${n.contrato?.numero_contrato || 'N/A'}</span>`
                : `<strong>Contrato Mãe ${n.contrato?.numero_contrato || ''}</strong>`;
                
            let situacaoClass = 'badge-warning';
            if (n.situacao_atual === 'PAGO') situacaoClass = 'badge-success';
            else if (n.situacao_atual === 'CANCELADO') situacaoClass = 'badge-danger';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>NF ${n.numero_nf}</strong></td>
                <td>${vinculoLabel}</td>
                <td>${formatarDataVisual(n.data_emissao)}</td>
                <td>${formatarDataVisual(n.data_vencimento)}</td>
                <td><strong>R$ ${parseFloat(n.valor_nf).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong></td>
                <td>${n.fonte_pagadora || 'SEDEC'}</td>
                <td><code>${n.processo_dgaf || 'N/A'}</code></td>
                <td><span class="badge ${situacaoClass}">${n.situacao_atual}</span></td>
                <td>
                    <div style="display:flex; gap:6px;">
                        ${state.user.role !== 'CONSULTA' ? `<button class="btn btn-sm btn-outline btn-edit-nf" data-id="${n.id_nota_fiscal}" data-emissao="${n.data_emissao}" data-vencimento="${n.data_vencimento}" data-numero="${n.numero_nf}" data-valor="${n.valor_nf}" data-dgaf="${n.processo_dgaf || ''}" data-fonte="${n.fonte_pagadora || 'SEDEC'}" data-contrato="${n.id_contrato || ''}" data-adesao="${n.id_adesao || ''}">Editar</button>` : ''}
                        ${n.situacao_atual === 'PENDENTE' && state.user.role !== 'OPERADOR_MANUTENCAO' && state.user.role !== 'CONSULTA' ? `<button class="btn btn-sm btn-success btn-atestar-nf" data-id="${n.id_nota_fiscal}">Atestar Pago</button>` : ''}
                        ${state.user.role === 'ADMIN' ? `<button class="btn btn-sm btn-outline btn-danger-text btn-deletar-nf" data-id="${n.id_nota_fiscal}">Remover</button>` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Eventos de atesto
        tbody.querySelectorAll('.btn-atestar-nf').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Deseja atestar o faturamento e liquidação desta Nota Fiscal? Isso validará os limites de empenho e saldos.')) {
                    try {
                        await apiFetch(`/financeiro/notas-fiscais/${id}`, {
                            method: 'PUT',
                            body: JSON.stringify({ situacao_atual: 'PAGO' })
                        });
                        alert('Nota Fiscal liquidada com sucesso!');
                        carregarNotasFiscais();
                    } catch (err) {}
                }
            });
        });

        // Eventos de exclusão
        tbody.querySelectorAll('.btn-deletar-nf').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Deseja realmente remover esta Nota Fiscal do sistema de forma lógica?')) {
                    try {
                        await apiFetch(`/financeiro/notas-fiscais/${id}`, { method: 'DELETE' });
                        alert('Nota Fiscal removida logicamente.');
                        carregarNotasFiscais();
                    } catch (err) {}
                }
            });
        });
        
        // Eventos de edição
        tbody.querySelectorAll('.btn-edit-nf').forEach(btn => {
            btn.addEventListener('click', async () => {
                document.getElementById('form-nf').reset();
                document.getElementById('nf-id').value = btn.getAttribute('data-id');
                
                // load dropdown first
                await carregarDropdownVinculoNf();
                
                const idContrato = btn.getAttribute('data-contrato');
                const idAdesao = btn.getAttribute('data-adesao');
                if (idAdesao) {
                    document.getElementById('nf-vinculo-tipo').value = `adesao:${idAdesao}`;
                } else if (idContrato) {
                    document.getElementById('nf-vinculo-tipo').value = `contrato:${idContrato}`;
                }

                document.getElementById('nf-numero').value = btn.getAttribute('data-numero');
                document.getElementById('nf-emissao').value = btn.getAttribute('data-emissao') ? btn.getAttribute('data-emissao').split('T')[0] : '';
                document.getElementById('nf-vencimento').value = btn.getAttribute('data-vencimento') ? btn.getAttribute('data-vencimento').split('T')[0] : '';
                document.getElementById('nf-valor').value = btn.getAttribute('data-valor');
                document.getElementById('nf-sei').value = btn.getAttribute('data-dgaf');
                document.getElementById('nf-fonte').value = btn.getAttribute('data-fonte');
                abrirModal('modal-nf');
            });
        });
    } catch (err) {}
}

export async function carregarDropdownVinculoNf() {
    try {
        const contratos = await apiFetch('/contrato/contratos');
        const adesoes = await apiFetch('/contrato/adesoes');
        
        const selectContratos = document.getElementById('nf-opt-contratos');
        const selectAdesoes = document.getElementById('nf-opt-adesoes');
        
        selectContratos.innerHTML = '';
        selectAdesoes.innerHTML = '';
        
        contratos.forEach(c => {
            selectContratos.innerHTML += `<option value="contrato:${c.id_contrato}">Contrato ${c.numero_contrato} (${c.empresa?.nome || 'S/E'})</option>`;
        });
        
        adesoes.forEach(a => {
            selectAdesoes.innerHTML += `<option value="adesao:${a.id_adesao}">Aditivo ${a.numero_adesao} (Ref Contrato: ${a.contrato?.numero_contrato})</option>`;
        });
    } catch (err) {}
}
