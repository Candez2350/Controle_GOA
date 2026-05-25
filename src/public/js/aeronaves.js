import { state } from './state.js';
import { apiFetch } from './api.js';
import { abrirModal } from './ui.js';

export async function carregarAeronavesEEmpresas() {
    try {
        const aeronaves = await apiFetch('/contrato/aeronaves');
        const empresas = await apiFetch('/contrato/empresas');
        
        // Aeronaves
        const bodyAero = document.getElementById('table-aeronaves');
        bodyAero.innerHTML = '';
        if (aeronaves.length === 0) {
            bodyAero.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Nenhuma aeronave cadastrada.</td></tr>';
        } else {
            aeronaves.forEach(a => {
                bodyAero.innerHTML += `
                    <tr>
                        <td><strong>${a.prefixo}</strong></td>
                        <td>${a.modelo}</td>
                        <td>
                            <div style="display:flex; gap:6px;">
                                ${state.user.role !== 'CONSULTA' ? `<button class="btn btn-sm btn-outline btn-edit-aero" data-id="${a.id_aeronave}" data-prefixo="${a.prefixo}" data-modelo="${a.modelo}">Editar</button>` : ''}
                                ${state.user.role === 'ADMIN' ? `<button class="btn btn-sm btn-outline btn-danger-text btn-delete-aero" data-id="${a.id_aeronave}">Remover</button>` : '-'}
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
        
        // Empresas
        const bodyEmp = document.getElementById('table-empresas');
        bodyEmp.innerHTML = '';
        if (empresas.length === 0) {
            bodyEmp.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Nenhuma empresa parceira cadastrada.</td></tr>';
        } else {
            empresas.forEach(e => {
                bodyEmp.innerHTML += `
                    <tr>
                        <td><strong>${e.nome}</strong></td>
                        <td><code>${e.cnpj}</code></td>
                        <td>
                            <div style="display:flex; gap:6px;">
                                ${state.user.role !== 'CONSULTA' ? `<button class="btn btn-sm btn-outline btn-edit-emp" data-id="${e.id_empresa}" data-nome="${e.nome}" data-cnpj="${e.cnpj}">Editar</button>` : ''}
                                ${state.user.role === 'ADMIN' ? `<button class="btn btn-sm btn-outline btn-danger-text btn-delete-emp" data-id="${e.id_empresa}">Remover</button>` : '-'}
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        // Eventos exclusão aeronave
        bodyAero.querySelectorAll('.btn-delete-aero').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Deseja desativar esta aeronave logicamente?')) {
                    const id = btn.getAttribute('data-id');
                    try {
                        await apiFetch(`/contrato/aeronaves/${id}`, { method: 'DELETE' });
                        carregarAeronavesEEmpresas();
                    } catch (err) {}
                }
            });
        });

        // Eventos exclusão empresa
        bodyEmp.querySelectorAll('.btn-delete-emp').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Deseja desativar esta empresa logicamente?')) {
                    const id = btn.getAttribute('data-id');
                    try {
                        await apiFetch(`/contrato/empresas/${id}`, { method: 'DELETE' });
                        carregarAeronavesEEmpresas();
                    } catch (err) {}
                }
            });
        });

        // Eventos edição aeronave
        bodyAero.querySelectorAll('.btn-edit-aero').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('form-aeronave').reset();
                document.getElementById('aeronave-id').value = btn.getAttribute('data-id');
                document.getElementById('aeronave-prefixo').value = btn.getAttribute('data-prefixo');
                document.getElementById('aeronave-modelo').value = btn.getAttribute('data-modelo');
                abrirModal('modal-aeronave');
            });
        });
        
        // Eventos edição empresa
        bodyEmp.querySelectorAll('.btn-edit-emp').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('form-empresa').reset();
                document.getElementById('empresa-id').value = btn.getAttribute('data-id');
                document.getElementById('empresa-nome').value = btn.getAttribute('data-nome');
                document.getElementById('empresa-cnpj').value = btn.getAttribute('data-cnpj');
                abrirModal('modal-empresa');
            });
        });
    } catch (err) {}
}

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

export async function carregarDropdownAeronaves(selectId) {
    try {
        const aeronaves = await apiFetch('/contrato/aeronaves');
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Selecione a aeronave...</option>';
        aeronaves.forEach(aero => {
            select.innerHTML += `<option value="${aero.id_aeronave}">${aero.prefixo} - ${aero.modelo}</option>`;
        });
    } catch (err) {}
}
