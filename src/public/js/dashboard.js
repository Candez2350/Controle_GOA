import { state } from './state.js';
import { apiFetch } from './api.js';
import { formatarReal, formatarDataVisual } from './helpers.js';

export async function carregarDashboard() {
    try {
        // Obter dados em paralelo
        const contratos = await apiFetch('/contrato/contratos');
        const os = await apiFetch('/os');
        const nfs = await apiFetch('/financeiro/notas-fiscais');
        const alertas = await apiFetch('/os/alertas-core-return');
        const aeronaves = await apiFetch('/contrato/aeronaves');
        
        state.contratos = contratos;
        state.ordensServico = os;
        state.notasFiscais = nfs;
        state.alertasCore = alertas;
        state.aeronaves = aeronaves;
        
        // Calcular estatísticas
        const contratosAtivos = contratos.length;
        const aeronavesAOG = os.filter(o => o.aog && !o.concluido).length;
        const totalPendenteCore = alertas.length;
        
        const totalFaturadoPaco = nfs
            .filter(n => n.situacao_atual === 'PAGO')
            .reduce((acc, curr) => acc + parseFloat(curr.valor_nf), 0);
            
        // Preencher na UI
        document.getElementById('stat-contratos').textContent = contratosAtivos;
        
        const aogElement = document.getElementById('stat-aog');
        aogElement.textContent = aeronavesAOG;
        const cardAog = document.getElementById('card-aog');
        if (parseInt(aogElement.textContent) > 0) {
            cardAog.classList.add('pulse-alert');
        } else {
            cardAog.classList.remove('pulse-alert');
        }
        
        document.getElementById('stat-core').textContent = totalPendenteCore;
        document.getElementById('stat-faturado').textContent = formatarReal(totalFaturadoPaco);
        
        // Renderizar lista de alertas de Core Return
        renderizarAlertasCoreReturn(alertas);
        
        // Renderizar aeronaves status
        renderizarDashboardAeronaves(aeronaves, os);
        
        // Renderizar vigência contratos
        renderizarDashboardContratos(contratos, nfs);
        
    } catch (err) {
        console.error('Falha ao carregar painel principal:', err);
    }
}

function renderizarAlertasCoreReturn(alertas) {
    const tbody = document.getElementById('table-core-alerts');
    tbody.innerHTML = '';
    
    if (alertas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted font-weight-500">Nenhuma pendência logística de Core Return registrada! Bom trabalho.</td></tr>';
        return;
    }
    
    alertas.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge ${item.tipo === 'REPARO' ? 'badge-primary' : 'badge-warning'}">${item.tipo}</span></td>
            <td><strong>${item.descricao}</strong></td>
            <td><code>${item.pn}</code></td>
            <td><code>${item.sn}</code></td>
            <td><strong>${item.codigo_os}</strong></td>
            <td><span class="badge badge-outline">${item.aeronave}</span></td>
            <td>${item.contrato}</td>
            <td>
                <div style="display:flex; gap:6px;">
                    <input type="text" placeholder="AWB Rastreio" class="form-control" id="awb-${item.id}" value="${item.awb_rastreio || ''}" style="padding:4px 8px; font-size:11px; width:120px;">
                    <button class="btn btn-sm btn-success btn-atestar-core" data-id="${item.id}" data-type="${item.tipo}">Atestar Devolução</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Eventos de atesto de devolução direto da tabela
    tbody.querySelectorAll('.btn-atestar-core').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const type = btn.getAttribute('data-type');
            const awbVal = document.getElementById(`awb-${id}`).value.trim();
            
            if (!awbVal) {
                alert('É obrigatório inserir o código AWB de rastreamento do envio para atestar o Core Return.');
                return;
            }
            
            try {
                const endpoint = type === 'REPARO' ? `/os/reparos/${id}` : `/os/materiais/${id}`;
                await apiFetch(endpoint, {
                    method: 'PUT',
                    body: JSON.stringify({ core_retornado: true, awb_rastreio: awbVal })
                });
                alert('Retorno de casco (Core Return) atestado com sucesso!');
                carregarDashboard();
            } catch (err) {}
        });
    });
}

function renderizarDashboardAeronaves(aeronaves, os) {
    const list = document.getElementById('dashboard-aeronaves-list');
    list.innerHTML = '';
    
    if (aeronaves.length === 0) {
        list.innerHTML = '<p class="text-muted">Nenhuma aeronave registrada.</p>';
        return;
    }
    
    aeronaves.forEach(aero => {
        const isAog = os.some(o => o.id_aeronave === aero.id_aeronave && o.aog && !o.concluido);
        const row = document.createElement('div');
        row.className = 'aeronave-status-row';
        row.innerHTML = `
            <div>
                <span class="prefix">${aero.prefixo}</span>
                <span class="model">(${aero.modelo})</span>
            </div>
            <span class="badge ${isAog ? 'badge-danger' : 'badge-success'}">${isAog ? 'AOG - IMPEDIDA' : 'DISPONÍVEL'}</span>
        `;
        list.appendChild(row);
    });
}

function renderizarDashboardContratos(contratos, nfs) {
    const list = document.getElementById('dashboard-contratos-list');
    list.innerHTML = '';
    
    if (contratos.length === 0) {
        list.innerHTML = '<p class="text-muted">Nenhum contrato ativo.</p>';
        return;
    }
    
    contratos.forEach(c => {
        // Calcular vigência
        const hoje = new Date();
        const fim = new Date(c.data_fim_calculado);
        const restamDias = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
        
        let statusText = 'Vigente';
        let badgeClass = 'badge-success';
        if (restamDias < 0) {
            statusText = 'Vencido';
            badgeClass = 'badge-danger';
        } else if (restamDias <= 60) {
            statusText = `Vence em ${restamDias} dias`;
            badgeClass = 'badge-warning';
        }
        
        // Calcular financeiro original do contrato
        const nfsContrato = nfs.filter(n => n.id_contrato === c.id_contrato && !n.id_adesao && n.situacao_atual === 'PAGO');
        const faturado = nfsContrato.reduce((acc, curr) => acc + parseFloat(curr.valor_nf), 0);
        const pct = Math.min((faturado / parseFloat(c.valor_total)) * 100, 100);
        
        const row = document.createElement('div');
        row.className = 'contrato-progress-row';
        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom: 4px;">
                <strong>Contrato ${c.numero_contrato} (${c.empresa?.nome || 'S/E'})</strong>
                <span class="badge ${badgeClass}">${statusText}</span>
            </div>
            <div class="contrato-metric">
                <span>Faturado: R$ ${faturado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                <span>Total: R$ ${parseFloat(c.valor_total).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </div>
            <div class="progress-bar-container" style="margin: 4px 0 0 0; height:6px;">
                <div class="progress-bar-fill" style="width: ${pct}%;"></div>
            </div>
        `;
        list.appendChild(row);
    });
}
