import { state } from './state.js';
import { apiFetch } from './api.js';
import { formatarReal, formatarDataVisual } from './helpers.js';
import { abrirModal, fecharModal } from './ui.js';
import { carregarDropdownContratos } from './contratos.js';
import { carregarDropdownAeronaves } from './aeronaves.js';

export async function carregarOrdensServico() {
    try {
        const osList = await apiFetch('/os');
        state.ordensServico = osList;
        
        // Popular dropdown de filtro de contratos
        const filterSelect = document.getElementById('filter-os-contrato');
        filterSelect.innerHTML = '<option value="">Todos os Contratos</option>';
        const contratos = await apiFetch('/contrato/contratos');
        contratos.forEach(c => {
            filterSelect.innerHTML += `<option value="${c.id_contrato}">${c.numero_contrato}</option>`;
        });
        
        // Configurar listener para filtro
        filterSelect.onchange = () => renderizarFiltrosOS();
        
        renderizarOsCards(osList);
    } catch (err) {}
}

export function renderizarFiltrosOS() {
    const contratoId = document.getElementById('filter-os-contrato').value;
    let filtradas = state.ordensServico;
    
    if (contratoId) {
        filtradas = state.ordensServico.filter(o => o.id_contrato === contratoId);
    }
    
    renderizarOsCards(filtradas);
}

export function renderizarOsCards(lista) {
    const grid = document.getElementById('os-cards-grid');
    grid.innerHTML = '';
    
    if (lista.length === 0) {
        grid.innerHTML = '<p class="text-muted text-center" style="grid-column: 1/-1;">Nenhuma Ordem de Serviço cadastrada.</p>';
        return;
    }
    
    lista.forEach(o => {
        const card = document.createElement('div');
        card.className = `os-card ${o.concluido ? 'os-concluido' : ''}`;
        card.setAttribute('data-id', o.id_ordem_servico);
        card.innerHTML = `
            <div class="os-card-header">
                <h3>${o.codigo_os}</h3>
                <div style="display:flex; gap:6px;">
                    ${o.aog && !o.concluido ? '<span class="os-aog-flag">AOG</span>' : ''}
                    <span class="badge ${o.concluido ? 'badge-success' : 'badge-warning'}">${o.concluido ? 'Concluída' : 'Em Execução'}</span>
                </div>
            </div>
            <div class="os-card-body">
                <p><strong>Aeronave:</strong> ${o.aeronave?.prefixo || 'N/A'}</p>
                <p><strong>Contrato:</strong> ${o.contrato?.numero_contrato || 'N/A'}</p>
                <p class="text-sm text-muted">${o.observacao ? (o.observacao.length > 55 ? o.observacao.substring(0, 52) + '...' : o.observacao) : 'Sem observações.'}</p>
            </div>
            <div class="os-card-footer">
                <span>Solicitada: ${formatarDataVisual(o.data_solicitacao)}</span>
                <span>Processo: ${o.processo_sei || 'N/A'}</span>
            </div>
            <div style="margin-top: 10px; display:flex; gap:10px;">
                <button class="btn btn-sm btn-outline btn-edit-os" data-id="${o.id_ordem_servico}" data-contrato="${o.id_contrato}" data-aero="${o.id_aeronave}" data-codigo="${o.codigo_os}" data-sei="${o.processo_sei}" data-data="${o.data_solicitacao}" data-prazo="${o.prazo_conclusao_dias}" data-aog="${o.aog}" data-obs="${o.observacao || ''}">Editar</button>
            </div>
        `;
        grid.appendChild(card);
        
        card.querySelector('.btn-edit-os').addEventListener('click', async (e) => {
            e.stopPropagation();
            document.getElementById('form-os').reset();
            const btn = e.target.closest('.btn-edit-os') || e.target;
            document.getElementById('os-id').value = btn.getAttribute('data-id');
            await carregarDropdownContratos('os-contrato');
            await carregarDropdownAeronaves('os-aeronave');
            document.getElementById('os-contrato').value = btn.getAttribute('data-contrato');
            document.getElementById('os-aeronave').value = btn.getAttribute('data-aero');
            document.getElementById('os-codigo').value = btn.getAttribute('data-codigo');
            document.getElementById('os-sei').value = btn.getAttribute('data-sei');
            document.getElementById('os-data').value = btn.getAttribute('data-data') ? btn.getAttribute('data-data').split('T')[0] : '';
            document.getElementById('os-prazo').value = btn.getAttribute('data-prazo');
            document.getElementById('os-aog').checked = btn.getAttribute('data-aog') === 'true';
            document.getElementById('os-observacao').value = btn.getAttribute('data-obs');
            abrirModal('modal-os');
        });
        
        card.addEventListener('click', () => abrirDetalhesOs(o.id_ordem_servico));
    });
}

export async function abrirDetalhesOs(id) {
    state.selectedOsId = id;
    state.selectedReparos = [];
    state.selectedMateriais = [];
    
    // Reset dos checkboxes de lote
    document.getElementById('check-all-reparos').checked = false;
    document.getElementById('check-all-materiais').checked = false;
    document.getElementById('batch-reparos-panel').classList.add('hidden');
    document.getElementById('batch-materiais-panel').classList.add('hidden');
    
    try {
        const os = await apiFetch(`/os/${id}`);
        
        document.getElementById('detail-os-title').textContent = `Ordem de Serviço: ${os.codigo_os}`;
        
        const aogFlag = document.getElementById('detail-os-aog');
        if (os.aog && !os.concluido) {
            aogFlag.classList.remove('hidden');
            aogFlag.textContent = 'AOG (Aeronave no Chão)';
        } else {
            aogFlag.classList.add('hidden');
        }
        
        document.getElementById('detail-os-aeronave').textContent = `${os.aeronave?.prefixo || 'N/A'} (${os.aeronave?.modelo || ''})`;
        document.getElementById('detail-os-contrato').textContent = os.contrato?.numero_contrato || 'N/A';
        document.getElementById('detail-os-sei').textContent = os.processo_sei || 'N/A';
        document.getElementById('detail-os-data').textContent = formatarDataVisual(os.data_solicitacao);
        
        const btnConcluir = document.getElementById('btn-concluir-os');
        if (os.concluido) {
            btnConcluir.classList.add('hidden');
        } else {
            btnConcluir.classList.remove('hidden');
        }
        
        // Renderizar sub-abas
        renderizarItensReparoOS(os.reparos, os.concluido);
        renderizarItensMateriaisOS(os.materiais, os.concluido);
        
        document.getElementById('os-detail-section').classList.remove('hidden');
        
        // Scroll suave até os detalhes
        document.getElementById('os-detail-section').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {}
}

export function renderizarItensReparoOS(reparos, osConcluida) {
    const tbody = document.getElementById('table-os-reparos');
    tbody.innerHTML = '';
    
    if (reparos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Nenhum reparo adicionado a esta OS.</td></tr>';
        return;
    }
    
    reparos.forEach(item => {
        const isFaturado = item.id_nota_fiscal !== null;
        const fatLabel = isFaturado 
            ? `<span class="badge badge-success">Faturado (NF ${item.nota_fiscal?.numero_nf || 'N/A'})</span>`
            : `<span class="badge badge-outline">Aguardando Faturamento</span>`;
            
        const isCoreAtestado = item.core_retornado;
        const coreLabel = isCoreAtestado
            ? `<span class="badge badge-success">DEVOLVIDO (AWB: ${item.awb_rastreio || 'N/A'})</span>`
            : `<span class="badge badge-warning">DEVOLUÇÃO PENDENTE</span>`;
            
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                ${(!isFaturado && !osConcluida) ? `<input type="checkbox" value="${item.id_servico_reparo}" class="check-reparo-item">` : ''}
            </td>
            <td><strong>${item.componente_descricao}</strong></td>
            <td><code>${item.pn || '-'}</code> / <code>${item.sn || '-'}</code></td>
            <td>${item.cotacao || 'N/A'}</td>
            <td>R$ ${parseFloat(item.valor_reparo).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td>${fatLabel}</td>
            <td>${coreLabel}</td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-sm btn-outline btn-edit-reparo" data-id="${item.id_servico_reparo}" data-desc="${item.componente_descricao}" data-pn="${item.pn || ''}" data-sn="${item.sn || ''}" data-valor="${item.valor_reparo || 0}" data-novo="${item.valor_item_novo || 0}" data-frete="${item.frete || 0}" data-cot="${item.cotacao || ''}" data-garantia="${item.data_fim_garantia || ''}" data-sit="${item.situacao_atual || ''}" data-goa="${item.status_goa || ''}" data-awb="${item.awb_rastreio || ''}" data-coleta="${item.coleta_individual}" data-core="${item.core_retornado}">Editar</button>
                    ${!osConcluida ? `<button class="btn btn-sm btn-outline btn-danger-text btn-delete-reparo" data-id="${item.id_servico_reparo}">Excluir</button>` : 'N/A'}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
        
        // Listener para faturamento em lote
        const checkbox = tr.querySelector('.check-reparo-item');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                triggerReparoSelection(item.id_servico_reparo, e.target.checked);
            });
        }
    });
    
    // Edição de reparo
    tbody.querySelectorAll('.btn-edit-reparo').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('form-reparo').reset();
            document.getElementById('reparo-id').value = btn.getAttribute('data-id');
            document.getElementById('reparo-os-id').value = state.selectedOsId;
            document.getElementById('reparo-descricao').value = btn.getAttribute('data-desc');
            document.getElementById('reparo-pn').value = btn.getAttribute('data-pn');
            document.getElementById('reparo-sn').value = btn.getAttribute('data-sn');
            document.getElementById('reparo-valor').value = btn.getAttribute('data-valor');
            document.getElementById('reparo-valor-novo').value = btn.getAttribute('data-novo');
            document.getElementById('reparo-frete').value = btn.getAttribute('data-frete');
            document.getElementById('reparo-cotacao').value = btn.getAttribute('data-cot');
            document.getElementById('reparo-garantia').value = btn.getAttribute('data-garantia') ? btn.getAttribute('data-garantia').split('T')[0] : '';
            document.getElementById('reparo-situacao').value = btn.getAttribute('data-sit') || 'PENDENTE';
            document.getElementById('reparo-status-goa').value = btn.getAttribute('data-goa') || 'NA_BASE';
            document.getElementById('reparo-awb').value = btn.getAttribute('data-awb');
            document.getElementById('reparo-coleta').checked = btn.getAttribute('data-coleta') === 'true';
            document.getElementById('reparo-exige-core').checked = !(btn.getAttribute('data-core') === 'true');
            abrirModal('modal-reparo');
        });
    });

    // Exclusão de reparo
    tbody.querySelectorAll('.btn-delete-reparo').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Deseja excluir este item de reparo?')) {
                const id = btn.getAttribute('data-id');
                try {
                    await apiFetch(`/os/reparos/${id}`, { method: 'DELETE' });
                    abrirDetalhesOs(state.selectedOsId);
                } catch (err) {}
            }
        });
    });
}

export function triggerReparoSelection(id, checked) {
    if (checked) {
        if (!state.selectedReparos.includes(id)) state.selectedReparos.push(id);
    } else {
        state.selectedReparos = state.selectedReparos.filter(item => item !== id);
    }
    
    const panel = document.getElementById('batch-reparos-panel');
    if (state.selectedReparos.length > 0) {
        panel.classList.remove('hidden');
    } else {
        panel.classList.add('hidden');
    }
}

export function renderizarItensMateriaisOS(materiais, osConcluida) {
    const tbody = document.getElementById('table-os-materiais');
    tbody.innerHTML = '';
    
    if (materiais.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Nenhum material de aquisição lançado nesta OS.</td></tr>';
        return;
    }
    
    materiais.forEach(item => {
        const isFaturado = item.id_nota_fiscal !== null;
        const fatLabel = isFaturado 
            ? `<span class="badge badge-success">Faturado (NF ${item.nota_fiscal?.numero_nf || 'N/A'})</span>`
            : `<span class="badge badge-outline">Aguardando Faturamento</span>`;
            
        const isCoreAtestado = item.core_retornado;
        const coreLabel = isCoreAtestado
            ? `<span class="badge badge-success">DEVOLVIDO (AWB: ${item.awb_rastreio || 'N/A'})</span>`
            : `<span class="badge badge-warning">DEVOLUÇÃO PENDENTE</span>`;
            
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                ${(!isFaturado && !osConcluida) ? `<input type="checkbox" value="${item.id_material_aquisicao}" class="check-material-item">` : ''}
            </td>
            <td><strong>${item.item_descricao}</strong></td>
            <td><code>${item.pn || '-'}</code> / ${item.quantidade} un</td>
            <td>${item.orcamento || 'N/A'}</td>
            <td>
                <div style="display:flex; align-items:center; gap:6px;">
                    <span class="badge ${item.recebido ? 'badge-success' : 'badge-outline'}">${item.recebido ? 'SIM' : 'NÃO'}</span>
                    ${(!item.recebido && !osConcluida) ? `<button class="btn btn-sm btn-outline btn-receber-item" data-id="${item.id_material_aquisicao}" style="padding:2px 6px; font-size:10px;">Receber</button>` : ''}
                </div>
            </td>
            <td>${fatLabel}</td>
            <td>${coreLabel}</td>
            <td>
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-sm btn-outline btn-edit-material" data-id="${item.id_material_aquisicao}" data-desc="${item.item_descricao}" data-pn="${item.pn || ''}" data-evo="${item.equivalencia_evo || ''}" data-qtd="${item.quantidade || 1}" data-orc="${item.orcamento || ''}" data-prev="${item.data_previsao || ''}" data-garantia="${item.data_fim_garantia || ''}" data-awb="${item.awb_rastreio || ''}" data-rec="${item.recebido}" data-core="${item.core_retornado}">Editar</button>
                    ${!osConcluida ? `<button class="btn btn-sm btn-outline btn-danger-text btn-delete-material" data-id="${item.id_material_aquisicao}">Excluir</button>` : 'N/A'}
                </div>
            </td>
        `;
        tbody.appendChild(tr);

        // Receber material individual
        const btnReceber = tr.querySelector('.btn-receber-item');
        if (btnReceber) {
            btnReceber.addEventListener('click', async () => {
                const id = btnReceber.getAttribute('data-id');
                try {
                    await apiFetch(`/os/materiais/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ recebido: true })
                    });
                    abrirDetalhesOs(state.selectedOsId);
                } catch (err) {}
            });
        }
        
        // Listener para faturamento em lote
        const checkbox = tr.querySelector('.check-material-item');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                triggerMaterialSelection(item.id_material_aquisicao, e.target.checked);
            });
        }
    });
    
    // Edição de material
    tbody.querySelectorAll('.btn-edit-material').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('form-material').reset();
            document.getElementById('material-id').value = btn.getAttribute('data-id');
            document.getElementById('material-os-id').value = state.selectedOsId;
            document.getElementById('material-descricao').value = btn.getAttribute('data-desc');
            document.getElementById('material-pn').value = btn.getAttribute('data-pn');
            document.getElementById('material-evo').value = btn.getAttribute('data-evo');
            document.getElementById('material-qtd').value = btn.getAttribute('data-qtd');
            document.getElementById('material-orcamento').value = btn.getAttribute('data-orc');
            document.getElementById('material-previsao').value = btn.getAttribute('data-prev') ? btn.getAttribute('data-prev').split('T')[0] : '';
            document.getElementById('material-garantia').value = btn.getAttribute('data-garantia') ? btn.getAttribute('data-garantia').split('T')[0] : '';
            document.getElementById('material-awb').value = btn.getAttribute('data-awb');
            document.getElementById('material-recebido').checked = btn.getAttribute('data-rec') === 'true';
            document.getElementById('material-exige-core').checked = !(btn.getAttribute('data-core') === 'true');
            abrirModal('modal-material');
        });
    });

    // Exclusão de material
    tbody.querySelectorAll('.btn-delete-material').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Deseja excluir este item de material?')) {
                const id = btn.getAttribute('data-id');
                try {
                    await apiFetch(`/os/materiais/${id}`, { method: 'DELETE' });
                    abrirDetalhesOs(state.selectedOsId);
                } catch (err) {}
            }
        });
    });
}

export function triggerMaterialSelection(id, checked) {
    if (checked) {
        if (!state.selectedMateriais.includes(id)) state.selectedMateriais.push(id);
    } else {
        state.selectedMateriais = state.selectedMateriais.filter(item => item !== id);
    }
    
    const panel = document.getElementById('batch-materiais-panel');
    if (state.selectedMateriais.length > 0) {
        panel.classList.remove('hidden');
    } else {
        panel.classList.add('hidden');
    }
}

// Abrir Modal para faturar múltiplos itens vinculando a uma NF
export async function abrirModalFaturamentoLote(reparosIds, materiaisIds) {
    try {
        if (!state.selectedOsId) return;
        const os = state.ordensServico.find(o => o.id_ordem_servico === state.selectedOsId);
        if (!os) return;
        
        const contratoId = os.id_contrato;
        
        // Buscar Notas Fiscais vinculadas a este contrato (para podermos selecionar uma existente)
        const todasNfs = await apiFetch('/financeiro/notas-fiscais');
        
        // Filtrar apenas notas fiscais deste contrato que NÃO estão canceladas
        const nfsContrato = todasNfs.filter(n => n.id_contrato === contratoId && n.situacao_atual !== 'CANCELADO');
        
        const select = document.getElementById('fat-selecao-nf');
        select.innerHTML = '<option value="">Selecione uma Nota Fiscal...</option>';
        nfsContrato.forEach(nf => {
            select.innerHTML += `<option value="${nf.id_nota_fiscal}">NF ${nf.numero_nf} - Valor: R$ ${parseFloat(nf.valor_nf).toLocaleString('pt-BR', {minimumFractionDigits: 2})} [${nf.situacao_atual}]</option>`;
        });
        
        document.getElementById('fat-reparos-ids').value = JSON.stringify(reparosIds);
        document.getElementById('fat-materiais-ids').value = JSON.stringify(materiaisIds);
        
        abrirModal('modal-faturamento-vinculo');
    } catch (err) {}
}
