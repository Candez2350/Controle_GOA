import { state } from './state.js';
import { apiFetch } from './api.js';
import { formatarReal, formatarDataVisual } from './helpers.js';
import { abrirModal } from './ui.js';

export async function carregarDropdownEmpresas(selectId) {
    try {
        const empresas = await apiFetch('/contrato/empresas');
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Selecione uma empresa...</option>';
        empresas.forEach(emp => {
            select.innerHTML += `<option value="${emp.id_empresa}">${emp.nome} (${emp.cnpj})</option>`;
        });
    } catch (err) {}
}

export async function carregarDropdownContratos(selectId) {
    try {
        const contratos = await apiFetch('/contrato/contratos');
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Selecione o contrato...</option>';
        contratos.forEach(c => {
            select.innerHTML += `<option value="${c.id_contrato}">${c.numero_contrato} - ${c.empresa?.nome || 'Sem Empresa'}</option>`;
        });
    } catch (err) {}
}

export async function carregarContratos() {
    try {
        const contratos = await apiFetch('/contrato/contratos');
        state.contratos = contratos;
        
        const nfs = await apiFetch('/financeiro/notas-fiscais');
        
        const grid = document.getElementById('contratos-cards-grid');
        grid.innerHTML = '';
        
        if (contratos.length === 0) {
            grid.innerHTML = '<p class="text-muted text-center" style="grid-column: 1/-1;">Nenhum contrato cadastrado. Clique em Novo Contrato para começar.</p>';
            return;
        }
        
        contratos.forEach(c => {
            const hoje = new Date();
            const fim = new Date(c.data_fim_calculado);
            const restamDias = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
            
            let statusClass = 'vigente';
            let statusLabel = 'Vigente';
            if (restamDias < 0) {
                statusClass = 'vencido';
                statusLabel = 'Vencido';
            } else if (restamDias <= 60) {
                statusClass = 'alerta';
                statusLabel = `Vence em ${restamDias}d`;
            }
            
            // Somatório NFs pagas associadas a este contrato diretamente (sem adesao)
            const pagas = nfs
                .filter(n => n.id_contrato === c.id_contrato && !n.id_adesao && n.situacao_atual === 'PAGO')
                .reduce((acc, curr) => acc + parseFloat(curr.valor_nf), 0);
            
            const pct = Math.min((pagas / parseFloat(c.valor_total)) * 100, 100);
            
            const card = document.createElement('div');
            card.className = `contrato-card ${statusClass}`;
            card.setAttribute('data-id', c.id_contrato);
            card.innerHTML = `
                <div class="contrato-status-stripe"></div>
                <div class="contrato-card-header">
                    <h3>${c.numero_contrato}</h3>
                    <span class="badge ${statusClass === 'vigente' ? 'badge-success' : statusClass === 'vencido' ? 'badge-danger' : 'badge-warning'}">${statusLabel}</span>
                </div>
                <div class="contrato-card-company">${c.empresa?.nome || 'Empresa não vinculada'}</div>
                <div class="contrato-metric">
                    <span>Gasto Faturado:</span>
                    <span>R$ ${pagas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="contrato-metric">
                    <span>Teto Limite:</span>
                    <span>R$ ${parseFloat(c.valor_total).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${pct}%;"></div>
                </div>
                <div class="contrato-card-footer">
                    <span>Fim: ${formatarDataVisual(c.data_fim_calculado)}</span>
                    <span>Processo: ${c.processo_sei || 'N/A'}</span>
                </div>
                <div style="margin-top: 10px; display:flex; gap:10px;">
                    <button class="btn btn-sm btn-outline btn-edit-contrato" data-id="${c.id_contrato}">Editar</button>
                    <button class="btn btn-sm btn-primary btn-detalhar-contrato" data-id="${c.id_contrato}">Ver Detalhes</button>
                </div>
            `;
            grid.appendChild(card);
            
            // Edit
            card.querySelector('.btn-edit-contrato').addEventListener('click', async (e) => {
                e.stopPropagation();
                document.getElementById('form-contrato').reset();
                document.getElementById('contrato-id').value = c.id_contrato;
                await carregarDropdownEmpresas('contrato-empresa');
                document.getElementById('contrato-empresa').value = c.id_empresa;
                document.getElementById('contrato-numero').value = c.numero_contrato;
                document.getElementById('contrato-sei').value = c.processo_sei;
                document.getElementById('contrato-objeto').value = c.objeto;
                document.getElementById('contrato-doerj').value = c.doerj || '';
                document.getElementById('contrato-pncp').value = c.pncp || '';
                document.getElementById('contrato-data-inicio').value = c.data_inicio ? c.data_inicio.split('T')[0] : '';
                document.getElementById('contrato-data-fim').value = c.data_fim_calculado ? c.data_fim_calculado.split('T')[0] : '';
                document.getElementById('contrato-valor').value = c.valor_total;
                abrirModal('modal-contrato');
            });

            // Detalhar
            card.querySelector('.btn-detalhar-contrato').addEventListener('click', (e) => {
                e.stopPropagation();
                abrirDetalhesContrato(c.id_contrato);
            });
        });
    } catch (err) {}
}

export async function abrirDetalhesContrato(id) {
    state.selectedContratoId = id;
    const contrato = state.contratos.find(c => c.id_contrato === id);
    if (!contrato) return;
    
    document.getElementById('detail-contrato-title').textContent = `Contrato Mãe: ${contrato.numero_contrato}`;
    document.getElementById('detail-contrato-empresa').textContent = contrato.empresa?.nome || '-';
    document.getElementById('detail-contrato-sei').textContent = contrato.processo_sei || 'N/A';
    document.getElementById('detail-contrato-vigencia').textContent = `${formatarDataVisual(contrato.data_inicio)} até ${formatarDataVisual(contrato.data_fim_calculado)}`;
    document.getElementById('detail-contrato-valor').textContent = formatarReal(contrato.valor_total);
    
    document.getElementById('contrato-detail-section').classList.remove('hidden');
    
    // Reset tabs
    document.querySelectorAll('.btn-tab-analytical').forEach(b => b.classList.remove('active'));
    document.querySelector('.btn-tab-analytical[data-target="analytics-aditivos"]').classList.add('active');
    document.querySelectorAll('.tab-content-analytical').forEach(c => {
        c.classList.add('hidden');
        c.classList.remove('active');
    });
    document.getElementById('analytics-aditivos').classList.remove('hidden');
    document.getElementById('analytics-aditivos').classList.add('active');
    
    // Carregar Adesoes, OS e NFs
    carregarAdesoesContrato(id);
    carregarAnaliseOS(id);
    carregarAnaliseNFs(id);
}

export async function carregarAdesoesContrato(contratoId) {
    try {
        const adesoes = await apiFetch(`/contrato/adesoes?contrato_id=${contratoId}`);
        const nfs = await apiFetch('/financeiro/notas-fiscais');
        
        const tbody = document.getElementById('table-adesoes');
        tbody.innerHTML = '';
        
        if (adesoes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Nenhum termo aditivo lançado para este contrato.</td></tr>';
            return;
        }
        
        adesoes.forEach(a => {
            const gastoSoma = nfs
                .filter(n => n.id_adesao === a.id_adesao && n.situacao_atual === 'PAGO')
                .reduce((acc, curr) => acc + parseFloat(curr.valor_nf), 0);
                
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${a.numero_adesao}</strong></td>
                <td>${a.processo_sei || 'N/A'}</td>
                <td>${a.pncp ? `<a href="${a.pncp}" target="_blank">Acessar PNCP</a>` : 'N/A'}</td>
                <td>${formatarDataVisual(a.data_inicio)}</td>
                <td>${formatarDataVisual(a.data_fim_calculado)}</td>
                <td>R$ ${parseFloat(a.valor_aditivado).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <span>R$ ${gastoSoma.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        <div class="progress-bar-container" style="margin:2px 0 0 0; height:4px; width:120px;">
                            <div class="progress-bar-fill" style="width: ${Math.min((gastoSoma/parseFloat(a.valor_aditivado))*100, 100)}%;"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline btn-edit-adesao" data-id="${a.id_adesao}" data-numero="${a.numero_adesao}" data-sei="${a.processo_sei}" data-pncp="${a.pncp}" data-inicio="${a.data_inicio}" data-fim="${a.data_fim_calculado}" data-valor="${a.valor_aditivado}">Editar</button>
                    <button class="btn btn-sm btn-outline btn-delete-adesao" data-id="${a.id_adesao}" style="color:var(--color-danger); border-color:var(--color-danger);">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Eventos Adesao
        document.querySelectorAll('.btn-edit-adesao').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('form-adesao').reset();
                document.getElementById('adesao-id').value = btn.getAttribute('data-id');
                document.getElementById('adesao-contrato-id').value = state.selectedContratoId;
                document.getElementById('adesao-numero').value = btn.getAttribute('data-numero');
                document.getElementById('adesao-sei').value = btn.getAttribute('data-sei');
                document.getElementById('adesao-pncp').value = btn.getAttribute('data-pncp');
                document.getElementById('adesao-data-inicio').value = btn.getAttribute('data-inicio') ? btn.getAttribute('data-inicio').split('T')[0] : '';
                document.getElementById('adesao-data-fim').value = btn.getAttribute('data-fim') ? btn.getAttribute('data-fim').split('T')[0] : '';
                document.getElementById('adesao-valor').value = btn.getAttribute('data-valor');
                abrirModal('modal-adesao');
            });
        });

        document.querySelectorAll('.btn-delete-adesao').forEach(btn => {
            btn.addEventListener('click', async () => {
                const adesaoId = btn.getAttribute('data-id');
                if(confirm('Deseja excluir este aditivo/adesão?')) {
                    try {
                        await apiFetch(`/contrato/adesoes/${adesaoId}`, { method: 'DELETE' });
                        alert('Aditivo removido!');
                        carregarAdesoesContrato(contratoId);
                        carregarContratos();
                    } catch (err) {}
                }
            });
        });

    } catch (err) {}
}

export async function carregarAnaliseOS(contratoId) {
    try {
        const osList = await apiFetch(`/os?contrato_id=${contratoId}`);
        const tbody = document.getElementById('table-analytics-os');
        tbody.innerHTML = '';
        
        if (osList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhuma Ordem de Serviço encontrada.</td></tr>';
            return;
        }
        
        osList.forEach(os => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${os.codigo_os}</strong></td>
                <td>${os.aeronave?.prefixo || '-'}</td>
                <td><span class="badge ${os.aog ? 'badge-danger' : 'badge-primary'}">${os.aog ? 'AOG' : 'ROTINA'}</span></td>
                <td><span class="badge ${os.concluido ? 'badge-success' : 'badge-warning'}">${os.concluido ? 'CONCLUÍDO' : 'ABERTA'}</span></td>
                <td>${formatarDataVisual(os.created_at)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Erro ao carregar analise OS', err);
    }
}

export async function carregarAnaliseNFs(contratoId) {
    try {
        const nfs = await apiFetch(`/financeiro/notas-fiscais?contrato_id=${contratoId}`);
        const tbody = document.getElementById('table-analytics-nfs');
        tbody.innerHTML = '';
        
        if (nfs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhuma Nota Fiscal encontrada.</td></tr>';
            return;
        }
        
        nfs.forEach(nf => {
            const tr = document.createElement('tr');
            let statusClass = 'badge-warning';
            if (nf.situacao_atual === 'PAGO') statusClass = 'badge-success';
            if (nf.situacao_atual === 'CANCELADA') statusClass = 'badge-danger';

            tr.innerHTML = `
                <td><strong>${nf.numero_nf}</strong></td>
                <td>${formatarDataVisual(nf.data_emissao)}</td>
                <td>${formatarDataVisual(nf.data_vencimento)}</td>
                <td>R$ ${parseFloat(nf.valor_nf).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                <td><span class="badge ${statusClass}">${nf.situacao_atual}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Erro ao carregar analise NFs', err);
    }
}
